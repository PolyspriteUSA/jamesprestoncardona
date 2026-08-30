const SYNTH_PARAMETER_IDS=[
  "osc1Wave",
  "osc1Octave",
  "osc1Pitch",
  "osc1Detune",
  "osc1Level",
  "osc1Cutoff",
  "osc1Res",
  "osc2Wave",
  "osc2Octave",
  "osc2Pitch",
  "osc2Detune",
  "osc2Level",
  "osc2Cutoff",
  "osc2Res",
  "synthFmFilterType",
  "synthFmCutoff",
  "synthFmRes",
  "synthFmRate",
  "synthFmDepth",
  "synthFmWave1",
  "synthFmRate2",
  "synthFmDepth2",
  "synthFmWave2",
  "synthAttack",
  "synthDecay",
  "synthSustain",
  "synthRelease",
  "synthDelay",
  "synthDelayTime",
  "synthDelayFeedback",
  "synthLevel",
  "synthFilterType",
  "synthFilterCutoff",
  "synthFilterRes",
  "synthFilterDrive"
];

let activeSynthEditor="synth";

function captureCurrentSynthState(){
  const state={};

  SYNTH_PARAMETER_IDS.forEach(id=>{
    const control=$(id);
    if(control){
      state[id]=control.value;
    }
  });

  return state;
}

const synthParameterStates={
  synth:null,
  synth2:null
};

function initializeSynthParameterStates(){
  if(synthParameterStates.synth)return;

  const base=
    captureCurrentSynthState();

  synthParameterStates.synth=
    Object.assign({},base);

  synthParameterStates.synth2=
    Object.assign({},base,{
      osc1Wave:"square",
      osc2Wave:"sawtooth",
      osc1Detune:"-8",
      osc2Detune:"9",
      synthFmRate:"1.2",
      synthFmRate2:"3.1",
      synthFmDepth:"520",
      synthFmDepth2:"260",
      synthFilterCutoff:"5200",
      synthLevel:".34"
    });
}

function saveActiveSynthState(){
  initializeSynthParameterStates();

  synthParameterStates[
    activeSynthEditor
  ]=
    captureCurrentSynthState();
}

function applySynthState(type){
  initializeSynthParameterStates();

  const state=
    synthParameterStates[type];

  if(!state)return;

  SYNTH_PARAMETER_IDS.forEach(id=>{
    const control=$(id);

    if(
      !control ||
      state[id]===undefined
    ){
      return;
    }

    control.value=
      state[id];

    control.dispatchEvent(
      new Event(
        "input",
        {bubbles:true}
      )
    );
  });
}

function getSynthParamValue(id,type="synth"){
  initializeSynthParameterStates();

  const state=
    synthParameterStates[type]||
    synthParameterStates.synth;

  if(
    state &&
    state[id]!==undefined
  ){
    return state[id];
  }

  const control=$(id);

  return control
    ?control.value
    :"";
}

function switchSynthEditor(type){
  if(
    type!=="synth" &&
    type!=="synth2"
  ){
    return;
  }

  saveActiveSynthState();

  activeSynthEditor=type;

  applySynthState(type);

  document
    .querySelectorAll(
      ".synth-select-btn"
    )
    .forEach(button=>{
      button.classList.toggle(
        "active",
        button.dataset.synthSelect===type
      );
    });

  const label=
    $("activeSynthLabel");

  if(label){
    label.textContent=
      type==="synth2"
        ?"Synth 2"
        :"Synth 1";
  }

  if($("midiTarget")){
    $("midiTarget").value=type;
  }

  showMidiLearnToast(
    type==="synth2"
      ?"Editing Synth 2"
      :"Editing Synth 1"
  );
}

initializeSynthParameterStates();

SYNTH_PARAMETER_IDS.forEach(id=>{
  const control=$(id);

  if(!control)return;

  control.addEventListener(
    "input",
    ()=>{
      initializeSynthParameterStates();

      synthParameterStates[
        activeSynthEditor
      ][id]=control.value;
    }
  );
});

document
  .querySelectorAll(
    ".synth-select-btn"
  )
  .forEach(button=>{
    button.addEventListener(
      "click",
      ()=>{
        switchSynthEditor(
          button.dataset.synthSelect
        );
      }
    );
  });

function leadSynth(t,n=60,v=.38,synthType="synth",durationSeconds=null){
  ensureAudio();

  const synthLevel=
    parseFloat(getSynthParamValue("synthLevel",synthType));

  const requestedLevel=
    Number.isFinite(v)
      ?v
      :synthLevel;

  const level=
    Math.min(
      .9,
      Math.max(
        .001,
        Math.min(
          requestedLevel,
          synthLevel
        )
      )
    );

  const attack=
    Math.max(
      .005,
      parseFloat(getSynthParamValue("synthAttack",synthType))
    );

  const decay=
    Math.max(
      .01,
      parseFloat(getSynthParamValue("synthDecay",synthType))
    );

  const sustain=
    Math.max(
      .01,
      Math.min(
        1,
        parseFloat(getSynthParamValue("synthSustain",synthType))
      )
    );

  const release=
    Math.max(
      .03,
      parseFloat(getSynthParamValue("synthRelease",synthType))
    );

  const noteLength=
    Math.max(
      .06,
      Number.isFinite(durationSeconds)
        ?durationSeconds
        :secondsPerStep()*.82
    );

  const sustainTime=
    Math.max(
      .02,
      noteLength-attack-decay
    );

  const env=
    audio.createGain();

  env.gain.setValueAtTime(
    .0001,
    t
  );

  env.gain.exponentialRampToValueAtTime(
    level,
    t+attack
  );

  env.gain.exponentialRampToValueAtTime(
    Math.max(
      .001,
      level*sustain
    ),
    t+attack+decay
  );

  env.gain.setValueAtTime(
    Math.max(
      .001,
      level*sustain
    ),
    t+attack+decay+sustainTime
  );

  env.gain.exponentialRampToValueAtTime(
    .001,
    t+attack+decay+sustainTime+release
  );

  const osc1=
    audio.createOscillator();

  const osc2=
    audio.createOscillator();

  const osc1Gain=
    audio.createGain();

  const osc2Gain=
    audio.createGain();

  const osc1Filter=
    audio.createBiquadFilter();

  const osc2Filter=
    audio.createBiquadFilter();

  const osc1Octave=
    parseInt(
      getSynthParamValue("osc1Octave",synthType),
      10
    )||0;

  const osc2Octave=
    parseInt(
      getSynthParamValue("osc2Octave",synthType),
      10
    )||0;

  osc1.type=
    getSynthParamValue("osc1Wave",synthType);

  osc2.type=
    getSynthParamValue("osc2Wave",synthType);

  const osc1Pitch=
    parseInt(
      getSynthParamValue("osc1Pitch",synthType),
      10
    )||0;

  osc1.frequency.value=
    midiToHz(
      n+
      osc1Octave*12+
      osc1Pitch
    );

  const osc2Pitch=
    parseInt(
      getSynthParamValue("osc2Pitch",synthType),
      10
    )||0;

  osc2.frequency.value=
    midiToHz(
      n+
      osc2Octave*12+
      osc2Pitch
    );

  osc1.detune.value=
    parseFloat(
      getSynthParamValue("osc1Detune",synthType)
    );

  osc2.detune.value=
    parseFloat(
      getSynthParamValue("osc2Detune",synthType)
    );

  osc1Gain.gain.value=
    parseFloat(
      getSynthParamValue("osc1Level",synthType)
    );

  osc2Gain.gain.value=
    parseFloat(
      getSynthParamValue("osc2Level",synthType)
    );

  osc1Filter.type="lowpass";
  osc2Filter.type="lowpass";

  osc1Filter.frequency.value=
    parseFloat(
      getSynthParamValue("osc1Cutoff",synthType)
    );

  osc2Filter.frequency.value=
    parseFloat(
      getSynthParamValue("osc2Cutoff",synthType)
    );

  osc1Filter.Q.value=
    parseFloat(
      getSynthParamValue("osc1Res",synthType)
    );

  osc2Filter.Q.value=
    parseFloat(
      getSynthParamValue("osc2Res",synthType)
    );

  osc1.connect(osc1Gain);
  osc1Gain.connect(osc1Filter);
  osc1Filter.connect(env);

  osc2.connect(osc2Gain);
  osc2Gain.connect(osc2Filter);
  osc2Filter.connect(env);

  const synthFilter=
    audio.createBiquadFilter();

  synthFilter.type=
    getSynthParamValue("synthFilterType",synthType);

  synthFilter.frequency.value=
    parseFloat(
      getSynthParamValue("synthFilterCutoff",synthType)
    );

  synthFilter.Q.value=
    parseFloat(
      getSynthParamValue("synthFilterRes",synthType)
    );

  const synthDrive=
    audio.createWaveShaper();

  const driveAmount=
    parseFloat(
      getSynthParamValue("synthFilterDrive",synthType)
    );

  synthDrive.curve=
    makeDriveCurve(
      driveAmount
    );

  synthDrive.oversample="2x";

  const synthFmFilter=
    audio.createBiquadFilter();

  synthFmFilter.type=
    getSynthParamValue("synthFmFilterType",synthType);

  synthFmFilter.frequency.value=
    parseFloat(
      getSynthParamValue("synthFmCutoff",synthType)
    );

  synthFmFilter.Q.value=
    parseFloat(
      getSynthParamValue("synthFmRes",synthType)
    );

  const synthFmLfo=
    audio.createOscillator();

  const synthFmDepth=
    audio.createGain();

  const synthFmLfo2=
    audio.createOscillator();

  const synthFmDepth2=
    audio.createGain();

  synthFmLfo.type=
    getSynthParamValue("synthFmWave1",synthType);

  synthFmLfo.frequency.value=
    parseFloat(
      getSynthParamValue("synthFmRate",synthType)
    );

  synthFmDepth.gain.value=
    parseFloat(
      getSynthParamValue("synthFmDepth",synthType)
    );

  synthFmLfo2.type=
    getSynthParamValue("synthFmWave2",synthType);

  synthFmLfo2.frequency.value=
    parseFloat(
      getSynthParamValue("synthFmRate2",synthType)
    );

  synthFmDepth2.gain.value=
    parseFloat(
      getSynthParamValue("synthFmDepth2",synthType)
    );

  synthFmLfo.connect(synthFmDepth);
  synthFmDepth.connect(
    synthFmFilter.frequency
  );

  synthFmLfo2.connect(synthFmDepth2);
  synthFmDepth2.connect(
    synthFmFilter.frequency
  );

  env.connect(synthFilter);
  synthFilter.connect(synthDrive);
  synthDrive.connect(synthFmFilter);
  routeToMixer(synthFmFilter,synthType);

  if(synthVisualizerAnalyser){
    synthFmFilter.connect(
      synthVisualizerAnalyser
    );
  }

  if(synthDelayNode){
    synthFmFilter.connect(
      synthDelayNode
    );
  }

  const stopTime=
    t+
    attack+
    decay+
    sustainTime+
    release+
    .05;

  synthFmLfo.start(t);
  synthFmLfo2.start(t);

  synthFmLfo.stop(stopTime);
  synthFmLfo2.stop(stopTime);

  osc1.start(t);
  osc2.start(t);

  osc1.stop(stopTime);
  osc2.stop(stopTime);
}
function playTrack(track,t,step){
  if(muted.has(track.type))return;
  if(soloed.size>0&&!soloed.has(track.type))return;

  currentTrackType=track.type;

  try{
    if(track.type==="kick")kick(t,track.level);
    if(track.type==="snare")snare(t,track.level);
    if(track.type==="hat")hat(t,track.level,false);
    if(track.type==="openhat")hat(t,track.level,true);
    if(track.type==="perc")perc(t,track.level);

    if(track.type==="synth"){
      leadSynth(
        t,
        getStepNotes("synth")[step],
        track.level,
        "synth"
      );
    }

    if(track.type==="synth2"){
      leadSynth(
        t,
        getStepNotes("synth2")[step],
        track.level,
        "synth2"
      );
    }

    if(track.type==="sample"){
      triggerSequencerSample(
        t,
        track.level,
        step
      );
    }
  }finally{
    currentTrackType=null;
  }
}
