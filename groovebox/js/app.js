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
  const pairs=[
    ["openAudioSettings","audioSettingsModal"],
    ["openMidiSettings","midiSettingsModal"]
  ];
  let active=null;
  const closeActive=()=>{
    if(!active)return;
    active.classList.remove("open");
    active.setAttribute("aria-hidden","true");
    document.body.classList.remove("mixer-settings-open");
    active=null;
  };
  pairs.forEach(([buttonId,modalId])=>{
    const button=document.getElementById(buttonId);
    const modal=document.getElementById(modalId);
    if(!button||!modal)return;
    button.addEventListener("click",()=>{
      closeActive();
      active=modal;
      modal.classList.add("open");
      modal.setAttribute("aria-hidden","false");
      document.body.classList.add("mixer-settings-open");
      const focusable=modal.querySelector("button,select,input");
      if(focusable)focusable.focus();
    });
  });
  document.querySelectorAll("[data-mixer-settings-close]").forEach(el=>el.addEventListener("click",closeActive));
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&active)closeActive();
  });
})();
