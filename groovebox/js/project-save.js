/* ===== GROOVEBOX PROJECT SAVE / LOAD / AUTO SAVE ===== */
(function(){
  const PROJECT_VERSION=1;
  const AUTO_SAVE_KEY="jpc-groovebox-project-v1";
  const saveBtn=document.getElementById("saveProjectBtn");
  const openBtn=document.getElementById("openProjectBtn");
  const fileInput=document.getElementById("openProjectFile");
  const status=document.getElementById("projectSaveStatus");
  let autosaveTimer=null;
  let restoring=false;

  function setStatus(text,kind=""){
    if(!status)return;
    status.textContent=text;
    status.classList.remove("saved","error");
    if(kind)status.classList.add(kind);
  }

  function clone(value){
    return JSON.parse(JSON.stringify(value));
  }

  function captureControls(){
    const out={};
    document.querySelectorAll("input[id],select[id],textarea[id]").forEach(control=>{
      if(control.id==="openProjectFile" || control.type==="file")return;
      out[control.id]=control.type==="checkbox" || control.type==="radio"
        ?{checked:control.checked}
        :{value:control.value};
    });
    return out;
  }

  function captureProject(){
    try{
      if(typeof saveActiveSynthState==="function")saveActiveSynthState();
    }catch(error){}

    return {
      format:"JPC Groovebox Project",
      version:PROJECT_VERSION,
      savedAt:new Date().toISOString(),
      controls:captureControls(),
      activeSequence:typeof activeSequence!=="undefined"?activeSequence:0,
      activeSynthEditor:typeof activeSynthEditor!=="undefined"?activeSynthEditor:"synth",
      midiEditorTarget:typeof midiEditorTarget!=="undefined"?midiEditorTarget:"synth",
      midiEditorMode:typeof midiEditorMode!=="undefined"?midiEditorMode:"step",
      tracks:typeof tracks!=="undefined"?tracks.map(track=>({
        type:track.type,
        level:track.level,
        mixerChannel:track.mixerChannel,
        patterns:clone(track.patterns)
      })):[],
      synthSequences:typeof synthSequences!=="undefined"?clone(synthSequences):[],
      synth2Sequences:typeof synth2Sequences!=="undefined"?clone(synth2Sequences):[],
      midiClips:typeof midiClips!=="undefined"?clone(midiClips):{synth:[],synth2:[]},
      synthParameterStates:typeof synthParameterStates!=="undefined"?clone(synthParameterStates):{},
      mixerChannelState:typeof mixerChannelState!=="undefined"?clone(mixerChannelState):[],
      mixerMuted:typeof mixerChannelMuted!=="undefined"?[...mixerChannelMuted]:[],
      mixerSoloed:typeof mixerChannelSoloed!=="undefined"?[...mixerChannelSoloed]:[],
      trackMuted:typeof muted!=="undefined"?[...muted]:[],
      trackSoloed:typeof soloed!=="undefined"?[...soloed]:[],
      sampleStepSelections:typeof sampleStepSelections!=="undefined"?clone(sampleStepSelections):[]
    };
  }

  function downloadProject(){
    const project=captureProject();
    const blob=new Blob([JSON.stringify(project,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    const stamp=new Date().toISOString().slice(0,16).replace(/[T:]/g,"-");
    a.href=url;
    a.download="groovebox-project-"+stamp+".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    try{localStorage.setItem(AUTO_SAVE_KEY,JSON.stringify(project));}catch(error){}
    setStatus("Saved", "saved");
  }

  function restoreControls(saved){
    if(!saved||typeof saved!=="object")return;
    Object.entries(saved).forEach(([id,state])=>{
      const control=document.getElementById(id);
      if(!control||control.type==="file")return;
      if("checked" in state)control.checked=!!state.checked;
      if("value" in state)control.value=state.value;
      control.dispatchEvent(new Event("input",{bubbles:true}));
      control.dispatchEvent(new Event("change",{bubbles:true}));
    });
  }

  function restoreProject(project){
    if(!project || project.format!=="JPC Groovebox Project")throw new Error("Not a Groovebox project file.");
    restoring=true;
    try{
      if(typeof stopPlayback==="function")stopPlayback();
      else document.getElementById("stopBtn")?.click();

      if(Array.isArray(project.tracks) && typeof tracks!=="undefined"){
        project.tracks.forEach(savedTrack=>{
          const track=tracks.find(item=>item.type===savedTrack.type);
          if(!track)return;
          if(Array.isArray(savedTrack.patterns))track.patterns=clone(savedTrack.patterns);
          if(Number.isFinite(Number(savedTrack.level)))track.level=Number(savedTrack.level);
          if(Number.isFinite(Number(savedTrack.mixerChannel)))track.mixerChannel=Number(savedTrack.mixerChannel);
        });
      }

      if(Array.isArray(project.synthSequences) && typeof synthSequences!=="undefined")synthSequences=clone(project.synthSequences);
      if(Array.isArray(project.synth2Sequences) && typeof synth2Sequences!=="undefined")synth2Sequences=clone(project.synth2Sequences);

      if(project.midiClips && typeof midiClips!=="undefined"){
        ["synth","synth2"].forEach(type=>{
          if(!Array.isArray(project.midiClips[type]))return;
          midiClips[type].splice(0,midiClips[type].length,...clone(project.midiClips[type]));
        });
      }

      if(project.synthParameterStates && typeof synthParameterStates!=="undefined"){
        if(project.synthParameterStates.synth)synthParameterStates.synth=clone(project.synthParameterStates.synth);
        if(project.synthParameterStates.synth2)synthParameterStates.synth2=clone(project.synthParameterStates.synth2);
      }

      if(Array.isArray(project.mixerChannelState) && typeof mixerChannelState!=="undefined"){
        project.mixerChannelState.forEach((saved,index)=>{
          if(!mixerChannelState[index]||!saved)return;
          Object.assign(mixerChannelState[index],saved);
        });
      }

      if(typeof mixerChannelMuted!=="undefined"){mixerChannelMuted.clear();(project.mixerMuted||[]).forEach(v=>mixerChannelMuted.add(Number(v)));}
      if(typeof mixerChannelSoloed!=="undefined"){mixerChannelSoloed.clear();(project.mixerSoloed||[]).forEach(v=>mixerChannelSoloed.add(Number(v)));}
      if(typeof muted!=="undefined"){muted.clear();(project.trackMuted||[]).forEach(v=>muted.add(v));}
      if(typeof soloed!=="undefined"){soloed.clear();(project.trackSoloed||[]).forEach(v=>soloed.add(v));}
      if(Array.isArray(project.sampleStepSelections) && typeof sampleStepSelections!=="undefined")sampleStepSelections=clone(project.sampleStepSelections);

      restoreControls(project.controls);

      const bank=Math.max(0,Math.min(3,Number(project.activeSequence)||0));
      if(typeof switchSequence==="function")switchSequence(bank);
      else if(typeof activeSequence!=="undefined")activeSequence=bank;

      const synthType=project.activeSynthEditor==="synth2"?"synth2":"synth";
      if(typeof switchSynthEditor==="function")switchSynthEditor(synthType);

      if(typeof project.midiEditorTarget==="string" && typeof midiEditorTarget!=="undefined")midiEditorTarget=project.midiEditorTarget==="synth2"?"synth2":"synth";
      if(typeof setMidiEditorTarget==="function")setMidiEditorTarget(midiEditorTarget);
      if(typeof setMidiEditorMode==="function")setMidiEditorMode(project.midiEditorMode==="piano"?"piano":"step");

      if(typeof buildAssignableMixer==="function")buildAssignableMixer();
      if(typeof refreshAllMixerBusStates==="function")refreshAllMixerBusStates();
      if(typeof refreshMixerAssignmentLabels==="function")refreshMixerAssignmentLabels();
      if(typeof refreshSequenceView==="function")refreshSequenceView();
      if(typeof refreshSequenceStatus==="function")refreshSequenceStatus();
      if(typeof syncTrackButtons==="function")syncTrackButtons();
      if(typeof renderPianoRoll==="function")renderPianoRoll();
      if(typeof renderSampleSlots==="function")renderSampleSlots();

      try{localStorage.setItem(AUTO_SAVE_KEY,JSON.stringify(captureProject()));}catch(error){}
      setStatus("Loaded", "saved");
    }finally{
      restoring=false;
    }
  }

  function queueAutosave(){
    if(restoring)return;
    clearTimeout(autosaveTimer);
    setStatus("Editing…");
    autosaveTimer=setTimeout(()=>{
      try{
        localStorage.setItem(AUTO_SAVE_KEY,JSON.stringify(captureProject()));
        setStatus("Auto Saved","saved");
      }catch(error){
        setStatus("Save Full","error");
      }
    },650);
  }

  saveBtn?.addEventListener("click",downloadProject);
  openBtn?.addEventListener("click",()=>fileInput?.click());
  fileInput?.addEventListener("change",async()=>{
    const file=fileInput.files?.[0];
    if(!file)return;
    try{
      restoreProject(JSON.parse(await file.text()));
    }catch(error){
      console.error(error);
      setStatus("Load Error","error");
      alert("Could not open this Groovebox project file.");
    }finally{fileInput.value="";}
  });

  document.addEventListener("input",event=>{
    if(event.target.closest("#midiLearnMenu"))return;
    queueAutosave();
  },true);
  document.addEventListener("change",queueAutosave,true);
  document.addEventListener("click",event=>{
    if(event.target.closest("button") && !event.target.closest("#saveProjectBtn,#openProjectBtn"))queueAutosave();
  },true);

  // Restore the last local session automatically when available.
  setTimeout(()=>{
    try{
      const saved=localStorage.getItem(AUTO_SAVE_KEY);
      if(saved){restoreProject(JSON.parse(saved));setStatus("Restored","saved");}
    }catch(error){console.warn("Groovebox auto-restore skipped:",error);}
  },350);
})();
