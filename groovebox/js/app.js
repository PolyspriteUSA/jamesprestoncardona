(function(){
  window.GrooveboxApp={
    version:"modular-1",
    modules:[
      "audio-engine","drum-machine","synth","arp","transport",
      "sequencer","mixer","midi","project-save","visualizer"
    ]
  };
  document.documentElement.dataset.grooveboxBuild="modular-1";
})();


(function(){
  const modalMap={
    openAudioSettings:"audioSettingsModal",
    openMidiSettings:"midiSettingsModal"
  };

  let activeModal=null;
  let returnFocus=null;

  function closeMixerSettings(){
    if(!activeModal)return;
    activeModal.classList.remove("open");
    activeModal.setAttribute("aria-hidden","true");
    activeModal.style.removeProperty("display");
    activeModal.style.removeProperty("visibility");
    activeModal.style.removeProperty("opacity");
    activeModal.style.removeProperty("pointer-events");
    document.body.classList.remove("mixer-settings-open");
    const focusTarget=returnFocus;
    activeModal=null;
    returnFocus=null;
    if(focusTarget&&typeof focusTarget.focus==="function")focusTarget.focus();
  }

  function openMixerSettings(modal,trigger){
    if(!modal)return;
    closeMixerSettings();
    activeModal=modal;
    returnFocus=trigger||null;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden","false");
    modal.style.display="flex";
    modal.style.visibility="visible";
    modal.style.opacity="1";
    modal.style.pointerEvents="auto";
    document.body.classList.add("mixer-settings-open");
    requestAnimationFrame(()=>{
      const focusable=modal.querySelector("select,input,button:not([disabled])");
      if(focusable)focusable.focus();
    });
  }

  Object.entries(modalMap).forEach(([buttonId,modalId])=>{
    const button=document.getElementById(buttonId);
    const modal=document.getElementById(modalId);
    if(!button||!modal)return;
    button.setAttribute("aria-controls",modalId);
    button.setAttribute("aria-haspopup","dialog");
    button.addEventListener("click",event=>{
      event.preventDefault();
      event.stopPropagation();
      openMixerSettings(modal,button);
    });
  });

  document.addEventListener("click",event=>{
    if(event.target.closest("[data-mixer-settings-close]")){
      event.preventDefault();
      closeMixerSettings();
    }
  });

  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&activeModal)closeMixerSettings();
  });

  window.GrooveboxMixerSettings={
    openAudio:()=>openMixerSettings(document.getElementById("audioSettingsModal"),document.getElementById("openAudioSettings")),
    openMidi:()=>openMixerSettings(document.getElementById("midiSettingsModal"),document.getElementById("openMidiSettings")),
    close:closeMixerSettings
  };
})();
