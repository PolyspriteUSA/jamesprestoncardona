function getTrackPattern(track,sequence=activeSequence){
  return track.patterns[sequence];
}

function getStepNotes(type,sequence=activeSequence){
  return type==="synth2"
    ?synth2Sequences[sequence]
    :synthSequences[sequence];
}

function refreshSequenceStatus(){
  const status=$("sequenceStatus");
  if(status){
    const start=(activeSequence*STEPS_PER_SEQUENCE)+1;
    const end=start+STEPS_PER_SEQUENCE-1;

    status.textContent=
      "Editing Sequence "+
      (activeSequence+1)+
      " · steps "+
      start+
      "–"+
      end;
  }

  document.querySelectorAll(".sequence-btn").forEach(button=>{
    button.classList.toggle(
      "active",
      parseInt(button.dataset.seq,10)===activeSequence
    );
  });
}

function refreshSequenceView(){
  document.querySelectorAll(".step").forEach(stepEl=>{
    const track=tracks[+stepEl.dataset.track];
    const stepIndex=+stepEl.dataset.step;

    stepEl.classList.toggle(
      "on",
      !!getTrackPattern(track)[stepIndex]
    );
  });


  document.querySelectorAll(".step").forEach(
    stepEl=>stepEl.classList.remove("playing")
  );

  refreshSequenceStatus();
}


function copyCurrentPattern(){
  copiedPattern={
    sourceSequence:activeSequence,
    trackPatterns:tracks.map(track=>getTrackPattern(track).slice()),
    synth2Notes:getStepNotes("synth2").slice(),
    synthNotes:getStepNotes("synth").slice(),
    midiSynth:clipFor("synth").map(ev=>({...ev})),
    midiSynth2:clipFor("synth2").map(ev=>({...ev}))
  };

  $("pastePatternBtn").disabled=false;

  const copyButton=$("copyPatternBtn");
  copyButton.classList.add("copied");
  copyButton.textContent="Copied Seq "+(activeSequence+1);

  setTimeout(()=>{
    copyButton.classList.remove("copied");
    copyButton.textContent="Copy Pattern";
  },900);

  const status=$("sequenceStatus");
  if(status){
    status.textContent=
      "Copied Sequence "+
      (activeSequence+1)+
      " · choose another sequence and Paste";
  }
}

function pastePatternToCurrent(){
  if(!copiedPattern)return;

  tracks.forEach((track,index)=>{
    const source=copiedPattern.trackPatterns[index];
    const destination=getTrackPattern(track);

    if(!source||!destination)return;

    for(let step=0;step<STEPS_PER_SEQUENCE;step++){
      destination[step]=source[step]?1:0;
    }
  });

  synth2Sequences[activeSequence]=copiedPattern.synth2Notes.slice();
  synthSequences[activeSequence]=copiedPattern.synthNotes.slice();
  midiClips.synth[activeSequence]=(copiedPattern.midiSynth||[]).map(ev=>({...ev,id:newMidiId()}));
  midiClips.synth2[activeSequence]=(copiedPattern.midiSynth2||[]).map(ev=>({...ev,id:newMidiId()}));

  refreshSequenceView();

  const status=$("sequenceStatus");
  if(status){
    status.textContent=
      "Pasted Sequence "+
      (copiedPattern.sourceSequence+1)+
      " into Sequence "+
      (activeSequence+1);
  }
}

function switchSequence(sequenceIndex){
  activeSequence=
    Math.max(
      0,
      Math.min(SEQUENCE_COUNT-1,sequenceIndex)
    );

  refreshSequenceView();
  if(typeof renderPianoRoll==="function")renderPianoRoll();
  if(typeof updateMidiStatus==="function")updateMidiStatus("Piano Roll");
}


function syncTrackButtons(){
  document.querySelectorAll(".mute").forEach(button=>{
    const type=button.dataset.type;
    button.classList.toggle("on",muted.has(type));
  });

  document.querySelectorAll(".solo").forEach(button=>{
    const type=button.dataset.type;
    button.classList.toggle("on",soloed.has(type));
  });

  document.querySelectorAll(".channel-mute").forEach(button=>{
    const type=button.dataset.type;
    button.classList.toggle("on",muted.has(type));
  });

  document.querySelectorAll(".channel-solo").forEach(button=>{
    const type=button.dataset.type;
    button.classList.toggle("on",soloed.has(type));
  });
}

tracks.forEach((track,ti)=>{
  const row=document.createElement("div");
  row.className="track";

  const name=document.createElement("div");
  name.className="track-name";

  const title=document.createElement("span");
  title.textContent=track.name;

  const buttons=document.createElement("div");
  buttons.className="track-buttons";

  const mute=document.createElement("button");
  mute.className="mute";
  mute.dataset.type=track.type;
  mute.textContent="M";
  mute.title="Mute "+track.name;

  const solo=document.createElement("button");
  solo.className="solo";
  solo.dataset.type=track.type;
  solo.textContent="S";
  solo.title="Solo "+track.name;

  mute.addEventListener("click",()=>{
    if(muted.has(track.type))muted.delete(track.type);
    else muted.add(track.type);
    syncTrackButtons();
  });

  solo.addEventListener("click",()=>{
    if(soloed.has(track.type))soloed.delete(track.type);
    else soloed.add(track.type);
    syncTrackButtons();
  });

  const assignment=document.createElement("select");
  assignment.className="track-mixer-assign";
  assignment.setAttribute("aria-label",track.name+" mixer channel");
  assignment.title="Route "+track.name+" to mixer channel";

  for(let channelIndex=0;channelIndex<MIXER_CHANNEL_COUNT;channelIndex++){
    const option=document.createElement("option");
    option.value=channelIndex;
    option.textContent="CH "+(channelIndex+1);
    if(channelIndex===mixerChannelForType(track.type))option.selected=true;
    assignment.appendChild(option);
  }

  assignment.addEventListener("change",()=>{
    track.mixerChannel=parseInt(assignment.value,10)||0;
    refreshMixerAssignmentLabels();
  });

  buttons.append(mute,solo);

  const trackControls=document.createElement("div");
  trackControls.className="track-name-controls";
  trackControls.append(assignment,buttons);

  name.append(title,trackControls);
  row.appendChild(name);

  getTrackPattern(track,0).forEach((on,si)=>{
    const noteTrack=
      track.type==="synth"||
      track.type==="synth2";

    if(noteTrack){
      const pad=document.createElement("button");
      pad.type="button";
      pad.className="step"+(on?" on":"");
      pad.dataset.track=ti;
      pad.dataset.step=si;
      pad.setAttribute(
        "aria-label",
        track.name+" step "+(si+1)
      );

      pad.addEventListener("click",()=>{
        const pattern=getTrackPattern(track);
        pattern[si]=pattern[si]?0:1;
        updateMidiEventForStep(track.type,si,!!pattern[si]);
        pad.classList.toggle("on",!!pattern[si]);
      });

      row.appendChild(pad);
    }else{
      const pad=document.createElement("button");
      pad.className="step"+(on?" on":"");
      pad.dataset.track=ti;
      pad.dataset.step=si;

      pad.addEventListener("click",()=>{
        const pattern=getTrackPattern(track);
        pattern[si]=pattern[si]?0:1;
        pad.classList.toggle(
          "on",
          !!pattern[si]
        );
      });

      row.appendChild(pad);
    }
  });

  sequencer.appendChild(row);
});

syncTrackButtons();

$("randomBtn").addEventListener("click",()=>{
  tracks.forEach((t,ti)=>{
    const pattern=getTrackPattern(t);

    for(let i=0;i<pattern.length;i++){
      const chance=ti===0?.32:ti===1?.18:ti===2?.48:ti===5?.28:.20;
      pattern[i]=Math.random()<chance?1:0;
    }
  });

  const synthScale=[48,50,52,53,55,57,59,60,62,64,65,67,69,71,72];

  synth2Sequences[activeSequence]=getStepNotes("synth2").map(()=>{
    return synthScale[Math.floor(Math.random()*synthScale.length)];
  });

  synthSequences[activeSequence]=getStepNotes("synth").map(()=>{
    return synthScale[Math.floor(Math.random()*synthScale.length)];
  });
  rebuildMidiClipFromStep("synth");
  rebuildMidiClipFromStep("synth2");

  refreshSequenceView();
  renderPianoRoll();
});

$("clearBtn").addEventListener("click",()=>{
  tracks.forEach(t=>getTrackPattern(t).fill(0));
  midiClips.synth[activeSequence]=[];
  midiClips.synth2[activeSequence]=[];
  refreshSequenceView();
  renderPianoRoll();
});

document.querySelectorAll(".sequence-btn").forEach(button=>{
  button.addEventListener("click",()=>{
    switchSequence(parseInt(button.dataset.seq,10)||0);
  });
});

$("copyPatternBtn").addEventListener("click",copyCurrentPattern);
$("pastePatternBtn").addEventListener("click",pastePatternToCurrent);


refreshSequenceStatus();
seedMidiClipsFromSteps();

/* ===== PIANO ROLL EDITOR ===== */
function setMidiMode(mode){
  midiEditorMode=mode;
  document.querySelectorAll(".midi-mode-btn").forEach(b=>b.classList.toggle("active",b.dataset.midiMode===mode));
  const body=$("midiComposeBody"); const step=$("sequencer");
  if(body)body.hidden=mode!=="piano";
  if(step)step.style.display=mode==="piano"?"none":"";
  if(mode==="piano")renderPianoRoll();
}
function setMidiTarget(type){
  midiEditorTarget=type==="synth2"?"synth2":"synth";
  document.querySelectorAll(".midi-target-btn").forEach(b=>b.classList.toggle("active",b.dataset.midiTarget===midiEditorTarget));
  switchSynthEditor(midiEditorTarget);
  if($("midiTarget"))$("midiTarget").value=midiEditorTarget;
  updateMidiStatus("Piano Roll"); renderPianoRoll();
}
function getPianoRollRange(){
  const clipNotes=clipFor().map(ev=>Number(ev.note)).filter(Number.isFinite);
  const stepNotes=(getStepNotes(midiEditorTarget,activeSequence)||[]).map(Number).filter(Number.isFinite);
  const used=[...clipNotes,...stepNotes];

  if(!used.length){
    return {min:48,max:72};
  }

  let min=Math.min(...used)-3;
  let max=Math.max(...used)+3;

  // Keep a useful minimum vertical span while centering on the notes actually in use.
  const minimumSpan=24;
  if(max-min<minimumSpan){
    const center=(min+max)/2;
    min=Math.floor(center-minimumSpan/2);
    max=Math.ceil(center+minimumSpan/2);
  }

  // Snap outward to C boundaries so the roll reads naturally.
  min=Math.floor(min/12)*12;
  max=Math.ceil((max+1)/12)*12-1;

  return {
    min:Math.max(MIDI_ROLL_MIN,min),
    max:Math.min(MIDI_ROLL_MAX,max)
  };
}

function renderPianoRoll(){
  const grid=$("pianoRollGrid"),keys=$("pianoRollKeys"),ruler=$("pianoRollRuler"),vel=$("velocityLane");
  if(!grid||!keys||!ruler||!vel)return;
  keys.innerHTML=""; ruler.innerHTML=""; vel.innerHTML="";
  grid.querySelectorAll(".midi-note").forEach(n=>n.remove());
  for(let bar=0;bar<4;bar++){const s=document.createElement("span");s.textContent=String(bar+1);s.style.left=(bar*25)+"%";ruler.appendChild(s);}

  const range=getPianoRollRange();
  const rollMin=range.min;
  const rollMax=range.max;
  const rows=rollMax-rollMin+1;
  grid.style.backgroundSize="25% 100%,6.25% 100%,100% "+(100/rows)+"%";

  for(let note=rollMax;note>=rollMin;note--){
    const k=document.createElement("div");k.className="piano-roll-key"+([1,3,6,8,10].includes(note%12)?" black":"");
    k.style.top=((rollMax-note)/rows*100)+"%";
    k.style.height=(100/rows)+"%";
    if(note%12===0||note%12===5)k.textContent=noteName(note);
    keys.appendChild(k);
  }

  const events=clipFor(); grid.classList.toggle("has-notes",events.length>0);
  events.forEach(ev=>{
    // The piano roll displays the exact MIDI note used by the sequence/pad data.
    if(ev.note<rollMin||ev.note>rollMax)return;
    const n=document.createElement("div");n.className="midi-note"+(ev.id===midiSelectedNoteId?" selected":"");n.dataset.id=ev.id;
    n.style.left=(ev.start/STEPS_PER_SEQUENCE*100)+"%";n.style.width=(Math.max(.18,ev.duration)/STEPS_PER_SEQUENCE*100)+"%";
    n.style.top=((rollMax-ev.note)/rows*100)+"%";n.title=noteName(ev.note)+" · "+ev.duration.toFixed(2)+" steps";
    const handle=document.createElement("span");handle.className="midi-note-resize";n.appendChild(handle);grid.appendChild(n);
    const vb=document.createElement("div");vb.className="velocity-bar";vb.style.left=(ev.start/STEPS_PER_SEQUENCE*100)+"%";vb.style.height=((ev.velocity||.8)*100)+"%";vel.appendChild(vb);
  });
}
function gridPoint(event){const r=$("pianoRollGrid").getBoundingClientRect();return{x:Math.max(0,Math.min(1,(event.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(event.clientY-r.top)/r.height))};}
$("pianoRollGrid").addEventListener("dblclick",e=>{
  if(e.target.closest(".midi-note"))return;
  snapshotMidiClip();
  const p=gridPoint(e);
  const range=getPianoRollRange();
  const rows=range.max-range.min+1;
  const start=quantizeMidiPosition(p.x*STEPS_PER_SEQUENCE);
  const note=Math.max(range.min,Math.min(range.max,range.max-Math.floor(p.y*rows)));
  clipFor().push({id:newMidiId(),note,start,duration:1,velocity:.82});
  syncStepTrackFromMidi(midiEditorTarget);
  renderPianoRoll();
});
let midiDrag=null;
$("pianoRollGrid").addEventListener("pointerdown",e=>{
  const node=e.target.closest(".midi-note");if(!node)return; const ev=clipFor().find(x=>x.id===node.dataset.id);if(!ev)return;
  snapshotMidiClip();midiSelectedNoteId=ev.id;const p=gridPoint(e);midiDrag={ev,startX:p.x,startY:p.y,origStart:ev.start,origNote:ev.note,origDuration:ev.duration,resize:e.target.classList.contains("midi-note-resize")};node.setPointerCapture(e.pointerId);renderPianoRoll();e.preventDefault();
});
$("pianoRollGrid").addEventListener("pointermove",e=>{
  if(!midiDrag)return;const p=gridPoint(e),dx=(p.x-midiDrag.startX)*STEPS_PER_SEQUENCE;
  if(midiDrag.resize){midiDrag.ev.duration=Math.max(.25,Math.min(STEPS_PER_SEQUENCE-midiDrag.ev.start,midiDrag.origDuration+dx));}
  else{
    const range=getPianoRollRange();
    const rows=range.max-range.min+1;
    const dy=Math.round((p.y-midiDrag.startY)*rows);
    midiDrag.ev.start=quantizeMidiPosition(Math.max(0,Math.min(15.99,midiDrag.origStart+dx)));
    midiDrag.ev.note=Math.max(MIDI_ROLL_MIN,Math.min(MIDI_ROLL_MAX,midiDrag.origNote-dy));
  }
  renderPianoRoll();
});
function finishMidiDrag(){if(!midiDrag)return;syncStepTrackFromMidi(midiEditorTarget);midiDrag=null;renderPianoRoll();}
$("pianoRollGrid").addEventListener("pointerup",finishMidiDrag);$("pianoRollGrid").addEventListener("pointercancel",finishMidiDrag);

document.querySelectorAll(".midi-mode-btn").forEach(b=>b.addEventListener("click",()=>setMidiMode(b.dataset.midiMode)));
document.querySelectorAll(".midi-target-btn").forEach(b=>b.addEventListener("click",()=>setMidiTarget(b.dataset.midiTarget)));
$("midiRecordBtn").addEventListener("click",()=>midiRecording?stopMidiRecord():beginMidiRecord());
$("midiOverdubBtn").addEventListener("click",()=>$("midiOverdubBtn").classList.toggle("active"));
$("midiClipPlayBtn").addEventListener("click",()=>{midiTransportOrigin=audio?audio.currentTime:0;start();updateMidiStatus("Playing MIDI");});
$("midiClipStopBtn").addEventListener("click",()=>{stopMidiRecord();stop();});
$("midiUndoBtn").addEventListener("click",()=>{if(!midiUndoSnapshot)return; midiClips[midiEditorTarget][activeSequence]=midiUndoSnapshot.map(x=>({...x,id:newMidiId()}));syncStepTrackFromMidi(midiEditorTarget);renderPianoRoll();});
$("midiDuplicateBtn").addEventListener("click",()=>{snapshotMidiClip();const copy=clipFor().map(x=>({...x,id:newMidiId(),start:(x.start+8)%16}));clipFor().push(...copy);syncStepTrackFromMidi(midiEditorTarget);renderPianoRoll();});
$("midiClearBtn").addEventListener("click",()=>{snapshotMidiClip();clipFor().splice(0);syncStepTrackFromMidi(midiEditorTarget);renderPianoRoll();});
$("midiQuantize").addEventListener("change",()=>{snapshotMidiClip();clipFor().forEach(ev=>ev.start=quantizeMidiPosition(ev.start));syncStepTrackFromMidi(midiEditorTarget);renderPianoRoll();});

document.addEventListener("keydown",e=>{if((e.key==="Delete"||e.key==="Backspace")&&midiSelectedNoteId&&midiEditorMode==="piano"&&!/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)){const c=clipFor(),i=c.findIndex(x=>x.id===midiSelectedNoteId);if(i>=0){snapshotMidiClip();c.splice(i,1);midiSelectedNoteId=null;syncStepTrackFromMidi(midiEditorTarget);renderPianoRoll();e.preventDefault();}}});

