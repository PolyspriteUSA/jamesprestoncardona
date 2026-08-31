function updateAudioStatus(message=""){
  const status=$("audioStatus");
  if(!status)return;

  if(message){
    status.textContent=message;
    status.classList.toggle(
      "active",
      !!audio
    );
    return;
  }

  if(!audio){
    status.textContent=
      "Audio engine not started";
    status.classList.remove("active");
    return;
  }

  const latency=
    typeof audio.baseLatency==="number"
      ?Math.round(audio.baseLatency*1000)+" ms"
      :"browser managed";

  status.textContent=
    Math.round(audio.sampleRate/100)/10+
    " kHz • "+
    latency+
    " latency";

  status.classList.add("active");
}

async function refreshAudioOutputs(){
  const select=$("audioOutput");
  if(!select)return;

  const previous=select.value;

  select.innerHTML=
    '<option value="default">System Default</option>';

  if(
    !navigator.mediaDevices||
    !navigator.mediaDevices.enumerateDevices
  ){
    return;
  }

  try{
    const devices=
      await navigator.mediaDevices.enumerateDevices();

    devices
      .filter(device=>device.kind==="audiooutput")
      .forEach((device,index)=>{
        const option=
          document.createElement("option");

        option.value=device.deviceId;
        option.textContent=
          device.label||
          "Audio Output "+(index+1);

        select.appendChild(option);
      });

    if(
      previous &&
      [...select.options].some(
        option=>option.value===previous
      )
    ){
      select.value=previous;
    }
  }catch(error){
    updateAudioStatus(
      "Output device list unavailable"
    );
  }
}

async function applySelectedAudioOutput(){
  if(!audio||!$("audioOutput"))return;

  const sinkId=
    $("audioOutput").value;

  if(
    typeof audio.setSinkId!=="function"
  ){
    if(sinkId!=="default"){
      updateAudioStatus(
        "Output selection is not supported by this browser"
      );
    }
    return;
  }

  try{
    await audio.setSinkId(sinkId);
    updateAudioStatus();
  }catch(error){
    updateAudioStatus(
      "Could not change audio output"
    );
  }
}

async function restartAudioEngine(){
  stopAudioInput();

  if(
    tapeRecorder&&
    tapeRecorder.state==="recording"
  ){
    tapeRecorder.stop();
  }

  stopTapeTimer();
  clearTapePlayback();
  const wasRunning=running;

  if(wasRunning){
    stop();
  }

  if(audio){
    try{
      await audio.close();
    }catch(error){}
  }

  audio=null;
  master=null;
  analyser=null;
  filter=null;
  reverbNode=null;
  reverbWet=null;
  reverbDry=null;
  synthDelayNode=null;
  synthDelayFeedbackNode=null;
  synthDelayWet=null;
  recordDestination=null;
  synthVisualizerAnalyser=null;
  synthVisualizerSink=null;
  noise=null;

  ensureAudio();

  if(audio.state==="suspended"){
    await audio.resume();
  }

  await applySelectedAudioOutput();
  updateAudioStatus();

  if(wasRunning){
    start();
  }
}

$("audioRestart").addEventListener(
  "click",
  restartAudioEngine
);

$("audioInputEnable").addEventListener(
  "click",
  enableAudioInput
);

$("audioInputMonitor").addEventListener(
  "change",
  updateAudioInputMonitor
);

$("audioInput").addEventListener(
  "change",
  async()=>{
    if(audioInputStream){
      stopAudioInput();
      await enableAudioInput();
    }
  }
);

refreshAudioInputs();

$("audioOutput").addEventListener(
  "change",
  applySelectedAudioOutput
);

$("audioLatency").addEventListener(
  "change",
  ()=>{
    updateAudioStatus(
      "Restart audio engine to apply latency"
    );
  }
);

$("audioSampleRate").addEventListener(
  "change",
  ()=>{
    updateAudioStatus(
      "Restart audio engine to apply sample rate"
    );
  }
);

refreshAudioOutputs();

if(
  navigator.mediaDevices &&
  navigator.mediaDevices.addEventListener
){
  navigator.mediaDevices.addEventListener(
    "devicechange",
    ()=>{
      refreshAudioOutputs();
      refreshAudioInputs();
    }
  );
}

let midiAccess=null;
let activeMidiInput=null;
