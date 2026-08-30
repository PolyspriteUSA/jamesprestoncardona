/* ===== SYNTH ARPEGGIATOR ===== */
let arpEnabled=false;
let arpLatchEnabled=false;
let arpHeld={synth:new Set(),synth2:new Set()};
let arpTimer=null;
let arpCounter=0;
let arpDirection=1;
function arpStepSeconds(){
  const rate=Number($("arpRate")?.value||16);
  const quarter=60/Math.max(60,Math.min(180,parseFloat($("bpm")?.value)||124));
  return rate===8?quarter/2:rate===32?quarter/8:quarter/4;
}
function arpExpandedNotes(type){
  const base=[...arpHeld[type]].sort((a,b)=>a-b); if(!base.length)return [];
  const oct=Math.max(1,Math.min(3,Number($("arpOctaves")?.value||1)));
  const out=[];for(let o=0;o<oct;o++)base.forEach(n=>out.push(n+o*12));return out.filter(n=>n<=120);
}
function nextArpNote(type){
  const notes=arpExpandedNotes(type);if(!notes.length)return null;
  const mode=$("arpMode")?.value||"up";
  if(mode==="random")return notes[Math.floor(Math.random()*notes.length)];
  if(mode==="down"){const n=notes[(notes.length-1-(arpCounter%notes.length)+notes.length)%notes.length];arpCounter++;return n;}
  if(mode==="updown"){
    if(notes.length===1)return notes[0];
    let idx=arpCounter; if(idx>=notes.length-1){arpDirection=-1;} if(idx<=0){arpDirection=1;}
    const n=notes[Math.max(0,Math.min(notes.length-1,idx))];arpCounter+=arpDirection;return n;
  }
  const n=notes[arpCounter%notes.length];arpCounter++;return n;
}
function scheduleArpTick(){
  clearTimeout(arpTimer); if(!arpEnabled)return;
  const type=activeSynthEditor==="synth2"?"synth2":"synth";
  const note=nextArpNote(type);
  if(note!=null){
    ensureAudio();
    const gate=Math.max(.15,Math.min(.95,parseFloat($("arpGate")?.value)||.65));
    const dur=arpStepSeconds()*gate;
    const track=tracks.find(t=>t.type===type);
    leadSynth(audio.currentTime,note,track?track.level:.38,type,dur);
    if($("arpRecordMidi")?.checked&&midiRecording&&!midiCountIn){recordMidiNoteOn(note,.85,type);setTimeout(()=>recordMidiNoteOff(note,type),Math.max(20,dur*1000));}
    if($("arpStatus"))$("arpStatus").textContent=noteName(note)+" · "+(type==="synth"?"Synth 1":"Synth 2");
  }else if($("arpStatus"))$("arpStatus").textContent="hold notes";
  arpTimer=setTimeout(scheduleArpTick,arpStepSeconds()*1000);
}
function refreshArpTimer(){if(arpEnabled)scheduleArpTick();}
function arpNoteOn(note,type=activeSynthEditor){arpHeld[type].add(note);arpCounter=0;if(arpEnabled&&!arpTimer)scheduleArpTick();}
function arpNoteOff(note,type=activeSynthEditor){if(!arpLatchEnabled)arpHeld[type].delete(note);}
function toggleArp(){arpEnabled=!arpEnabled;$("arpToggle").classList.toggle("active",arpEnabled);$("arpToggle").textContent=arpEnabled?"Arp On":"Arp Off";arpCounter=0;if(arpEnabled)scheduleArpTick();else{clearTimeout(arpTimer);arpTimer=null;$("arpStatus").textContent="ready";}}
function toggleArpLatch(){arpLatchEnabled=!arpLatchEnabled;$("arpLatch").classList.toggle("active",arpLatchEnabled);if(!arpLatchEnabled){arpHeld.synth.clear();arpHeld.synth2.clear();}}
