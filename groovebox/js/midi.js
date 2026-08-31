function setMidiStatus(text,connected=false){
  const el=$("midiStatus");
  el.textContent=text;
  el.classList.toggle("connected",connected);
}

function refreshMidiInputs(){
  const select=$("midiInput");
  const previous=select.value;

  select.innerHTML=
    '<option value="">No MIDI input</option>';

  if(!midiAccess)return;

  for(const input of midiAccess.inputs.values()){
    const option=document.createElement("option");
    option.value=input.id;
    option.textContent=input.name||"MIDI Input";
    select.appendChild(option);
  }

  if(
    previous &&
    [...select.options].some(
      option=>option.value===previous
    )
  ){
    select.value=previous;
  }else if(select.options.length>1){
    const preferred=
      [...select.options].findIndex(
        option=>
          /nano\s*kontrol|nanokontrol|korg/i.test(
            option.textContent||""
          )
      );

    select.selectedIndex=
      preferred>0
        ?preferred
        :1;
  }

  connectSelectedMidiInput();
}

function connectSelectedMidiInput(){
  if(activeMidiInput){
    activeMidiInput.onmidimessage=null;
    activeMidiInput=null;
  }

  if(!midiAccess)return;

  const id=$("midiInput").value;
  const input=midiAccess.inputs.get(id);

  if(!input){
    setMidiStatus("Choose a MIDI input");
    return;
  }

  activeMidiInput=input;
  activeMidiInput.onmidimessage=handleMidiMessage;

  setMidiStatus(
    "Connected: "+(input.name||"MIDI Controller"),
    true
  );
}

async function connectMidi(){
  if(!navigator.requestMIDIAccess){
    setMidiStatus(
      "Web MIDI is not supported in this browser"
    );
    return;
  }

  try{
    midiAccess=await navigator.requestMIDIAccess();
    midiAccess.onstatechange=refreshMidiInputs;
    refreshMidiInputs();
    $("midiConnect").textContent="MIDI Connected";
  }catch(error){
    setMidiStatus(
      "MIDI permission was not granted"
    );
  }
}


const MIDI_LEARN_STORAGE_KEY=
  "neonGrooveboxMidiMappingsV1";

let midiLearnTarget=null;
let midiLearnMappings={};
let midiLearnToastTimer=null;

function loadMidiLearnMappings(){
  try{
    const saved=
      JSON.parse(
        localStorage.getItem(
          MIDI_LEARN_STORAGE_KEY
        )||"{}"
      );

    midiLearnMappings=
      saved&&typeof saved==="object"
        ?saved
        :{};
  }catch(error){
    midiLearnMappings={};
  }
}

function saveMidiLearnMappings(){
  try{
    localStorage.setItem(
      MIDI_LEARN_STORAGE_KEY,
      JSON.stringify(
        midiLearnMappings
      )
    );
  }catch(error){}
}

function midiControlKey(control){
  if(!control)return "";

  if(control.id){
    return "id:"+control.id;
  }

  if(control.dataset.midiKey){
    return "key:"+control.dataset.midiKey;
  }

  return "";
}

function findMidiControlByKey(key){
  if(!key)return null;

  if(key.startsWith("id:")){
    return document.getElementById(
      key.slice(3)
    );
  }

  if(key.startsWith("key:")){
    const value=
      key.slice(4);

    return document.querySelector(
      '[data-midi-key="'+
      CSS.escape(value)+
      '"]'
    );
  }

  return null;
}

function describeMidiControl(control){
  if(!control)return "Control";

  const container=
    control.closest(
      ".knob-card,.rotary-control,.channel,.fx-strip,.audio-channel-strip,.keyboard-scale-control"
    );

  if(container){
    const label=
      container.querySelector(
        "label,span"
      );

    if(label&&label.textContent.trim()){
      return label.textContent
        .replace(/\s+/g," ")
        .trim();
    }
  }

  return (
    control.getAttribute("aria-label")||
    control.id||
    control.dataset.midiKey||
    "Control"
  );
}

function showMidiLearnToast(text){
  const toast=
    document.getElementById(
      "midiLearnToast"
    );

  if(!toast)return;

  toast.textContent=text;
  toast.classList.add("show");

  clearTimeout(
    midiLearnToastTimer
  );

  midiLearnToastTimer=
    setTimeout(
      ()=>toast.classList.remove("show"),
      1800
    );
}

function clearMidiLearnHighlight(){
  document
    .querySelectorAll(
      ".midi-learn-target"
    )
    .forEach(
      element=>
        element.classList.remove(
          "midi-learn-target"
        )
    );
}

function refreshMidiMappedVisuals(){
  document
    .querySelectorAll(
      'input[type="range"]'
    )
    .forEach(control=>{
      const key=
        midiControlKey(control);

      const mapped=
        Object.values(
          midiLearnMappings
        ).some(
          item=>
            item&&
            item.target===key
        );

      control.classList.toggle(
        "midi-mapped",
        mapped
      );

      const wrap=
        control.closest(
          ".synth-rotary-wrap,.rotary-knob-wrap,.channel,.fx-strip,.audio-channel-strip"
        );

      if(wrap){
        wrap.classList.toggle(
          "midi-mapped",
          mapped
        );
      }
    });
}

function removeMappingsForTarget(targetKey){
  let changed=false;

  Object.keys(
    midiLearnMappings
  ).forEach(mappingKey=>{
    if(
      midiLearnMappings[mappingKey]&&
      midiLearnMappings[mappingKey].target===
        targetKey
    ){
      delete midiLearnMappings[
        mappingKey
      ];

      changed=true;
    }
  });

  if(changed){
    saveMidiLearnMappings();
  }

  refreshMidiMappedVisuals();

  return changed;
}

function applyMidiValueToControl(control,value){
  if(
    !control ||
    control.type!=="range"
  ){
    return false;
  }

  const min=
    Number.isFinite(
      parseFloat(control.min)
    )
      ?parseFloat(control.min)
      :0;

  const max=
    Number.isFinite(
      parseFloat(control.max)
    )
      ?parseFloat(control.max)
      :1;

  const step=
    parseFloat(control.step);

  let next=
    min+
    (max-min)*
    Math.max(
      0,
      Math.min(
        1,
        value
      )
    );

  if(
    Number.isFinite(step)&&
    step>0
  ){
    next=
      min+
      Math.round(
        (next-min)/step
      )*step;
  }

  next=
    Math.max(
      min,
      Math.min(
        max,
        next
      )
    );

  control.value=
    String(next);

  control.dispatchEvent(
    new Event(
      "input",
      {bubbles:true}
    )
  );

  return true;
}

function mappingLookupKey(channel,cc){
  return channel+":"+cc;
}

function startMidiLearn(control){
  const targetKey=
    midiControlKey(control);

  if(!targetKey){
    showMidiLearnToast(
      "This control cannot be mapped."
    );
    return;
  }

  midiLearnTarget=control;

  clearMidiLearnHighlight();

  control.classList.add(
    "midi-learn-target"
  );

  const wrap=
    control.closest(
      ".synth-rotary-wrap,.rotary-knob-wrap,.channel,.fx-strip,.audio-channel-strip"
    );

  if(wrap){
    wrap.classList.add(
      "midi-learn-target"
    );
  }

  setMidiStatus(
    "MIDI Learn: move a nanoKONTROL knob or fader",
    true
  );

  showMidiLearnToast(
    "Move the nanoKONTROL control you want to assign…"
  );
}

function finishMidiLearn(channel,cc){
  if(!midiLearnTarget){
    return false;
  }

  const targetKey=
    midiControlKey(
      midiLearnTarget
    );

  if(!targetKey){
    midiLearnTarget=null;
    clearMidiLearnHighlight();
    return false;
  }

  removeMappingsForTarget(
    targetKey
  );

  midiLearnMappings[
    mappingLookupKey(
      channel,
      cc
    )
  ]={
    target:targetKey,
    channel,
    cc
  };

  saveMidiLearnMappings();

  const name=
    describeMidiControl(
      midiLearnTarget
    );

  midiLearnTarget=null;
  clearMidiLearnHighlight();
  refreshMidiMappedVisuals();

  setMidiStatus(
    "Mapped CC "+
    cc+
    " · Ch "+
    channel+
    " → "+
    name,
    true
  );

  showMidiLearnToast(
    "Mapped CC "+
    cc+
    " to "+
    name
  );

  return true;
}

function applyLearnedMidiMapping(channel,cc,value){
  const mapping=
    midiLearnMappings[
      mappingLookupKey(
        channel,
        cc
      )
    ];

  if(!mapping){
    return false;
  }

  const control=
    findMidiControlByKey(
      mapping.target
    );

  if(!control){
    return false;
  }

  return applyMidiValueToControl(
    control,
    value
  );
}

loadMidiLearnMappings();

async function handleMidiMessage(event){
  const data=event.data;
  const status=data[0];
  const command=status&0xf0;
  const channel=(status&0x0f)+1;
  const note=data[1];
  const velocity=data[2]||0;

  const selectedChannel=$("midiChannel").value;

  if(
    selectedChannel!=="all" &&
    Number(selectedChannel)!==channel
  ){
    return;
  }

  ensureAudio();

  if(audio.state==="suspended"){
    await audio.resume();
  }

  if(command===0x90&&velocity>0){
    const velocityGain=velocity/127;

    const midiTrackType=
      $("midiTarget").value==="synth2"
        ?"synth2"
        :"synth";

    const midiTrack=
      tracks.find(
        track=>track.type===midiTrackType
      );

    if(arpEnabled){
      arpNoteOn(note,midiTrackType);
    }else{
      leadSynth(
        audio.currentTime,
        note,
        Math.max(.08,(midiTrack?midiTrack.level:.38)*velocityGain),
        midiTrackType
      );
      recordMidiNoteOn(note,velocityGain,midiTrackType);
    }

    pulseVisual();
  }

  if(command===0x80||(command===0x90&&velocity===0)){
    const midiTrackType=$("midiTarget").value==="synth2"?"synth2":"synth";
    if(arpEnabled)arpNoteOff(note,midiTrackType);else recordMidiNoteOff(note,midiTrackType);
  }

  if(command===0xb0){
    const cc=data[1];
    const value=data[2]/127;

    if(midiLearnTarget){
      finishMidiLearn(
        channel,
        cc
      );
      return;
    }

    if(
      applyLearnedMidiMapping(
        channel,
        cc,
        value
      )
    ){
      return;
    }

    if(cc===7){
      $("master").value=value;
      $("master").dispatchEvent(
        new Event("input")
      );
    }

    if(cc===73){
      $("synthAttack").value=
        .005+
        value*1.995;

      $("synthAttack").dispatchEvent(
        new Event("input")
      );
    }

    if(cc===72){
      $("synthRelease").value=
        .03+
        value*2.97;

      $("synthRelease").dispatchEvent(
        new Event("input")
      );
    }

    if(cc===75){
      $("osc1Cutoff").value=
        120+
        value*(12000-120);

      $("osc1Cutoff").dispatchEvent(
        new Event("input")
      );
    }

    if(cc===76){
      $("osc2Cutoff").value=
        120+
        value*(12000-120);

      $("osc2Cutoff").dispatchEvent(
        new Event("input")
      );
    }

    if(cc===77){
      $("synthFilterCutoff").value=
        80+
        value*(16000-80);

      $("synthFilterCutoff").dispatchEvent(
        new Event("input")
      );
    }

    if(cc===78){
      $("synthFilterRes").value=
        .1+
        value*(24-.1);

      $("synthFilterRes").dispatchEvent(
        new Event("input")
      );
    }
  }
}

$("midiConnect").addEventListener(
  "click",
  connectMidi
);

$("midiInput").addEventListener(
  "change",
  connectSelectedMidiInput
);

$("midiTarget").addEventListener(
  "change",
  ()=>{
    switchSynthEditor(
      $("midiTarget").value
    );
  }
);

const keyboardIntervals=[0,1,2,3,4,5,6,7,8,9,10,11,12];
const keyboardBlackIntervals=new Set([1,3,6,8,10]);
