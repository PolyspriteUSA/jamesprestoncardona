/* ===== MIDI CLIP SCORE DATA ===== */
const MIDI_ROLL_MIN=48;
const MIDI_ROLL_MAX=72;
let midiEditorTarget="synth";
let midiEditorMode="step";
let midiRecording=false;
let midiOverdub=false;
let midiCountIn=false;
let midiCountInTimer=null;
let midiTransportOrigin=0;
let midiHeldNotes=new Map();
let midiSelectedNoteId=null;
let midiUndoSnapshot=null;
let midiIdCounter=1;
const midiClips={
  synth:Array.from({length:SEQUENCE_COUNT},()=>[]),
  synth2:Array.from({length:SEQUENCE_COUNT},()=>[])
};
function newMidiId(){return "mn"+(midiIdCounter++);}
function clipFor(type=midiEditorTarget,sequence=activeSequence){return midiClips[type][sequence];}
function seedMidiClipsFromSteps(){
  ["synth","synth2"].forEach(type=>{
    const track=tracks.find(t=>t.type===type);
    for(let seq=0;seq<SEQUENCE_COUNT;seq++){
      const clip=midiClips[type][seq];
      if(clip.length)continue;
      const pattern=getTrackPattern(track,seq);
      const notes=getStepNotes(type,seq);
      pattern.forEach((on,step)=>{if(on)clip.push({id:newMidiId(),note:notes[step],start:step,duration:.82,velocity:.82});});
    }
  });
}
function rebuildMidiClipFromStep(type,sequence=activeSequence){
  const track=tracks.find(t=>t.type===type);
  if(!track)return;
  const clip=midiClips[type][sequence];
  clip.splice(0,clip.length);
  const pattern=getTrackPattern(track,sequence);
  const notes=getStepNotes(type,sequence);
  pattern.forEach((on,step)=>{if(on)clip.push({id:newMidiId(),note:notes[step],start:step,duration:.82,velocity:.82});});
}
function updateMidiEventForStep(type,step,on){
  const clip=clipFor(type);
  const atStep=clip.filter(ev=>Math.floor(ev.start)===step);
  if(!on){for(const ev of atStep){const i=clip.indexOf(ev);if(i>=0)clip.splice(i,1);}}
  else if(!atStep.length){clip.push({id:newMidiId(),note:getStepNotes(type)[step],start:step,duration:.82,velocity:.82});}
  if(typeof renderPianoRoll==="function"&&midiEditorTarget===type)renderPianoRoll();
}
function updateMidiPitchForStep(type,step,note){
  const clip=clipFor(type);
  const ev=clip.find(item=>Math.floor(item.start)===step);
  if(ev)ev.note=note;
  else{const track=tracks.find(t=>t.type===type);if(track&&getTrackPattern(track)[step])clip.push({id:newMidiId(),note:note,start:step,duration:.82,velocity:.82});}
  if(typeof renderPianoRoll==="function"&&midiEditorTarget===type)renderPianoRoll();
}

let activeSequence=0;
let copiedPattern=null;



const noteNames=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
function noteName(midi){return noteNames[midi%12]+(Math.floor(midi/12)-1)}
let audio=null,master=null,analyser=null,filter=null,reverbNode=null,reverbWet=null,reverbDry=null,synthDelayNode=null,synthDelayFeedbackNode=null,synthDelayWet=null,recordDestination=null;
let synthVisualizerAnalyser=null;
let synthVisualizerSink=null;
let audioInputStream=null,audioInputSource=null,audioInputGain=null;
let running=false,currentStep=0,nextNoteTime=0,timerId=null;

let muted=new Set();
let soloed=new Set();

/* ===== ASSIGNABLE 8-CHANNEL MIXER ROUTING ===== */
const MIXER_CHANNEL_COUNT=8;
let mixerBuses=[];
let currentTrackType=null;
let mixerChannelMuted=new Set();
let mixerChannelSoloed=new Set();

const mixerChannelState=Array.from({length:MIXER_CHANNEL_COUNT},(_,index)=>({
  name:"CH "+(index+1),
  level:.82,
  low:0,
  mid:0,
  high:0,
  pan:0
}));
