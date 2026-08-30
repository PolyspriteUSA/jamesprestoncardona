function midiToHz(n){return 440*Math.pow(2,(n-69)/12)}

function makeDriveCurve(amount){
  const samples=2048;
  const curve=new Float32Array(samples);
  const k=amount*80;

  for(let i=0;i<samples;i++){
    const x=i*2/samples-1;
    curve[i]=
      amount<=.001
        ?x
        :(1+k)*x/(1+k*Math.abs(x));
  }

  return curve;
}

function buildReverbImpulse(seconds=2.4){
  if(!audio)return null;

  const duration=
    Math.max(.3,Math.min(6,seconds));

  const length=
    Math.max(
      1,
      Math.floor(audio.sampleRate*duration)
    );

  const impulse=
    audio.createBuffer(
      2,
      length,
      audio.sampleRate
    );

  for(let channel=0;channel<2;channel++){
    const data=
      impulse.getChannelData(channel);

    for(let i=0;i<length;i++){
      const progress=i/length;
      const envelope=
        Math.pow(1-progress,2.4);

      data[i]=
        (Math.random()*2-1)*
        envelope;
    }
  }

  return impulse;
}

function refreshMasterReverb(){
  if(!reverbNode||!audio)return;

  const seconds=
    parseFloat(
      $("reverbDecay").value
    )||2.4;

  reverbNode.buffer=
    buildReverbImpulse(seconds);
}


async function refreshAudioInputs(){
  const select=$("audioInput");
  if(!select||!navigator.mediaDevices||!navigator.mediaDevices.enumerateDevices)return;

  let devices=[];
  try{
    devices=await navigator.mediaDevices.enumerateDevices();
  }catch(error){
    return;
  }

  const current=select.value||"default";
  select.innerHTML="";

  const systemOption=document.createElement("option");
  systemOption.value="default";
  systemOption.textContent="System Default";
  select.appendChild(systemOption);

  devices
    .filter(device=>device.kind==="audioinput")
    .forEach((device,index)=>{
      const option=document.createElement("option");
      option.value=device.deviceId;
      option.textContent=device.label||("Audio Input "+(index+1));
      select.appendChild(option);
    });

  if([...select.options].some(option=>option.value===current)){
    select.value=current;
  }
}

function stopAudioInput(){
  if(audioInputSource){
    try{audioInputSource.disconnect();}catch(error){}
    audioInputSource=null;
  }

  if(audioInputGain){
    try{audioInputGain.disconnect();}catch(error){}
    audioInputGain=null;
  }

  if(audioInputStream){
    audioInputStream.getTracks().forEach(track=>track.stop());
    audioInputStream=null;
  }

  if($("audioInputStatus")){
    $("audioInputStatus").textContent="Audio input disabled";
  }

  if($("audioInputEnable")){
    $("audioInputEnable").textContent="Enable Audio Input";
    $("audioInputEnable").classList.remove("active");
  }
}

function updateAudioInputMonitor(){
  if(!audioInputGain||!audio)return;

  const value=
    $("audioInputMonitor").value==="on"
      ?1
      :0;

  audioInputGain.gain.setTargetAtTime(
    value,
    audio.currentTime,
    .02
  );
}

async function enableAudioInput(){
  ensureAudio();

  if(audioInputStream){
    stopAudioInput();
    return;
  }

  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
    $("audioInputStatus").textContent=
      "Audio input not supported in this browser";
    return;
  }

  const selected=$("audioInput").value;

  const audioConstraint=
    selected&&selected!=="default"
      ?{
          deviceId:{exact:selected},
          echoCancellation:false,
          noiseSuppression:false,
          autoGainControl:false
        }
      :{
          echoCancellation:false,
          noiseSuppression:false,
          autoGainControl:false
        };

  try{
    audioInputStream=
      await navigator.mediaDevices.getUserMedia({
        audio:audioConstraint
      });

    audioInputSource=
      audio.createMediaStreamSource(audioInputStream);

    audioInputGain=
      audio.createGain();

    audioInputGain.gain.value=
      $("audioInputMonitor").value==="on"
        ?1
        :0;

    audioInputSource.connect(audioInputGain);
    audioInputGain.connect(master);

    $("audioInputStatus").textContent="Audio input active";
    $("audioInputEnable").textContent="Disable Audio Input";
    $("audioInputEnable").classList.add("active");

    await refreshAudioInputs();
  }catch(error){
    stopAudioInput();
    $("audioInputStatus").textContent=
      "Could not access audio input";
  }
}

function ensureAudio(){
  if(audio)return;
  const AudioContextClass=
    window.AudioContext||
    window.webkitAudioContext;

  const audioOptions={
    latencyHint:
      $("audioLatency")
        ?$("audioLatency").value
        :"interactive"
  };

  const selectedRate=
    $("audioSampleRate")
      ?$("audioSampleRate").value
      :"default";

  if(selectedRate!=="default"){
    audioOptions.sampleRate=
      parseInt(selectedRate,10);
  }

  audio=new AudioContextClass(audioOptions);

  master=audio.createGain();
  master.gain.value=parseFloat($("master").value);

  analyser=audio.createAnalyser();
  analyser.fftSize=256;
  analyser.smoothingTimeConstant=.82;

  filter=audio.createBiquadFilter();
  filter.type="lowpass";
  filter.frequency.value=1400;
  filter.Q.value=7;

  reverbNode=audio.createConvolver();
  reverbWet=audio.createGain();
  reverbDry=audio.createGain();

  reverbWet.gain.value=
    parseFloat($("reverb").value);

  reverbDry.gain.value=1;

  refreshMasterReverb();

  synthDelayNode=audio.createDelay(1.5);
  synthDelayNode.delayTime.value=parseFloat($("synthDelayTime").value);

  synthDelayFeedbackNode=audio.createGain();
  synthDelayFeedbackNode.gain.value=parseFloat($("synthDelayFeedback").value);

  synthDelayWet=audio.createGain();
  synthDelayWet.gain.value=parseFloat($("synthDelay").value);

  synthDelayNode.connect(synthDelayFeedbackNode);
  synthDelayFeedbackNode.connect(synthDelayNode);
  synthDelayNode.connect(synthDelayWet);
  synthDelayWet.connect(master);

  synthVisualizerAnalyser=audio.createAnalyser();
  synthVisualizerAnalyser.fftSize=1024;
  synthVisualizerAnalyser.smoothingTimeConstant=.72;

  synthVisualizerSink=audio.createGain();
  synthVisualizerSink.gain.value=0;
  synthVisualizerAnalyser.connect(synthVisualizerSink);
  synthVisualizerSink.connect(master);

  filter.connect(reverbDry);
  reverbDry.connect(master);

  filter.connect(reverbNode);
  reverbNode.connect(reverbWet);
  reverbWet.connect(master);

  buildMixerBuses();

  master.connect(analyser);

  recordDestination=audio.createMediaStreamDestination();
  master.connect(recordDestination);

  analyser.connect(audio.destination);

  updateAudioStatus();
  applySelectedAudioOutput();
}
function out(node,trackType=currentTrackType){
  routeToMixer(node,trackType);
}
