function secondsPerStep(){
  return 60/Math.max(60,Math.min(180,parseFloat($("bpm").value)||124))/4;
}


function scheduleMidiClipStep(type,step,time){
  const track=tracks.find(t=>t.type===type);
  if(!track||muted.has(type))return;
  if(soloed.size>0&&!soloed.has(type))return;
  clipFor(type,activeSequence).forEach(noteEvent=>{
    const start=((noteEvent.start%STEPS_PER_SEQUENCE)+STEPS_PER_SEQUENCE)%STEPS_PER_SEQUENCE;
    if(Math.floor(start)!==step)return;
    const offset=(start-step)*secondsPerStep();
    leadSynth(
      time+offset,
      noteEvent.note,
      Math.max(.03,track.level*(noteEvent.velocity||.8)),
      type,
      Math.max(.04,(noteEvent.duration||.82)*secondsPerStep())
    );
  });
}
function currentMidiPosition(){
  if(!audio||!running)return currentStep||0;
  const elapsed=audio.currentTime-midiTransportOrigin;
  if(elapsed<0)return 0;
  return (elapsed/secondsPerStep())%STEPS_PER_SEQUENCE;
}
function quantizeMidiPosition(value){
  const q=Number($("midiQuantize")?.value||0);
  if(!q)return Math.max(0,Math.min(STEPS_PER_SEQUENCE-.01,value));
  const quantum=q===1?1:q===2?2:4;
  return Math.max(0,Math.min(STEPS_PER_SEQUENCE-.01,Math.round(value/quantum)*quantum));
}
function syncStepTrackFromMidi(type){
  const track=tracks.find(t=>t.type===type); if(!track)return;
  const pattern=getTrackPattern(track);
  pattern.fill(0);
  const firstByStep=new Map();
  clipFor(type).forEach(ev=>{
    const step=Math.max(0,Math.min(15,Math.floor(ev.start)));
    pattern[step]=1;
    if(!firstByStep.has(step))firstByStep.set(step,ev.note);
  });
  const notes=getStepNotes(type);
  firstByStep.forEach((note,step)=>notes[step]=note);
  refreshSequenceView();
}
function recordMidiNoteOn(note,velocity=.85,type=midiEditorTarget){
  if(!midiRecording||midiCountIn)return;
  if(type!==midiEditorTarget)return;
  const start=quantizeMidiPosition(currentMidiPosition());
  if(!midiOverdub){
    clipFor(type).splice(0,clipFor(type).length);
    midiOverdub=true;
  }
  const ev={id:newMidiId(),note:Math.max(12,Math.min(120,note)),start,duration:.82,velocity:Math.max(.05,Math.min(1,velocity))};
  clipFor(type).push(ev);
  midiHeldNotes.set(type+":"+note,{event:ev,startRaw:currentMidiPosition()});
  syncStepTrackFromMidi(type); renderPianoRoll(); updateMidiStatus("Recording · "+noteName(note));
}
function recordMidiNoteOff(note,type=midiEditorTarget){
  const key=type+":"+note; const held=midiHeldNotes.get(key); if(!held)return;
  let end=currentMidiPosition(); let duration=end-held.startRaw; if(duration<=0)duration+=STEPS_PER_SEQUENCE;
  held.event.duration=Math.max(.25,Math.min(STEPS_PER_SEQUENCE,quantizeMidiPosition(held.event.start+duration)-held.event.start||duration));
  midiHeldNotes.delete(key); renderPianoRoll();
}
function snapshotMidiClip(){midiUndoSnapshot=clipFor().map(ev=>({...ev}));}
function beginMidiRecord(){
  ensureAudio();
  snapshotMidiClip();
  midiRecording=true; midiOverdub=$("midiOverdubBtn").classList.contains("active");
  $("midiRecordBtn").classList.add("recording");
  if(!running){
    midiCountIn=true; updateMidiStatus("Count-in · 4 · 3 · 2 · 1"); start();
    const barMs=secondsPerStep()*STEPS_PER_SEQUENCE*1000;
    clearTimeout(midiCountInTimer);
    midiCountInTimer=setTimeout(()=>{midiCountIn=false;midiTransportOrigin=audio.currentTime;updateMidiStatus("Recording · "+(midiEditorTarget==="synth"?"Synth 1":"Synth 2"));},barMs);
  }else{midiCountIn=false;midiTransportOrigin=audio.currentTime-currentMidiPosition()*secondsPerStep();updateMidiStatus("Recording");}
}
function stopMidiRecord(){midiRecording=false;midiCountIn=false;clearTimeout(midiCountInTimer);midiHeldNotes.clear();$("midiRecordBtn")?.classList.remove("recording");updateMidiStatus("Ready");}
function updateMidiStatus(message){const el=$("midiRecordStatus");if(el)el.textContent=(message||"Piano Roll")+" · "+(midiEditorTarget==="synth"?"Synth 1":"Synth 2")+" · Sequence "+(activeSequence+1);}

function pulseVisual(){
  const pulse=
    document.querySelector(
      ".page-reactive-pulse"
    );

  if(pulse){
    pulse.classList.remove("beat");

    void pulse.offsetWidth;

    pulse.classList.add("beat");

    setTimeout(
      ()=>pulse.classList.remove("beat"),
      90
    );
  }
}
function scheduleStep(step,time){
  const swing=
    parseFloat(
      $("swing").value
    )||0;

  const swingOffset=
    step%2
      ?secondsPerStep()*swing
      :0;

  tracks.forEach(track=>{
    try{
      if(track.type==="synth"||track.type==="synth2")return;
      if(
        getTrackPattern(track)[step]
      ){
        playTrack(
          track,
          time+swingOffset,
          step
        );
      }
    }catch(error){
      console.warn(
        "Track playback error:",
        track.type,
        error
      );
    }
  });

  scheduleMidiClipStep("synth",step,time+swingOffset);
  scheduleMidiClipStep("synth2",step,time+swingOffset);

  const delayMs=
    Math.max(
      0,
      (time-audio.currentTime)*1000
    );

  setTimeout(()=>{
    try{
      document
        .querySelectorAll(".step")
        .forEach(
          x=>x.classList.remove(
            "playing"
          )
        );

      document
        .querySelectorAll(
          '.step[data-step="'+step+'"]'
        )
        .forEach(
          x=>x.classList.add(
            "playing"
          )
        );

      pulseVisual();
    }catch(error){}
  },delayMs);
}

function scheduler(){
  if(
    !running ||
    !audio
  ){
    return;
  }

  try{
    while(
      nextNoteTime<
      audio.currentTime+.12
    ){
      scheduleStep(
        currentStep,
        nextNoteTime
      );

      nextNoteTime+=
        secondsPerStep();

      currentStep=
        (
          currentStep+1
        )%
        STEPS_PER_SEQUENCE;
    }
  }catch(error){
    console.warn(
      "Sequencer scheduler error:",
      error
    );
  }

  if(running){
    timerId=
      setTimeout(
        scheduler,
        25
      );
  }
}
async function start(){
  ensureAudio();

  if(audio.state==="suspended"){
    await audio.resume();
  }

  if(running)return;

  if(timerId){
    clearTimeout(timerId);
    timerId=null;
  }

  running=true;
  currentStep=0;
  nextNoteTime=
    audio.currentTime+.06;
  midiTransportOrigin=nextNoteTime;

  $("playBtn").classList.add(
    "active"
  );

  $("status").textContent=
    "playing";

  scheduler();
}

function stop(){
  running=false;

  if(timerId){
    clearTimeout(timerId);
    timerId=null;
  }

  document
    .querySelectorAll(".step")
    .forEach(
      x=>x.classList.remove(
        "playing"
      )
    );

  $("playBtn").classList.remove(
    "active"
  );

  $("status").textContent=
    "stopped";
}
$("playBtn").addEventListener("click",start);
$("stopBtn").addEventListener("click",stop);

const sequencer=$("sequencer");

const synthNoteChoices=[];
for(let midi=12;midi<=120;midi++)synthNoteChoices.push(midi);
