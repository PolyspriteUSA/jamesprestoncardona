(function(){
  function getCollapseBody(id){
    return document.querySelector(
      '[data-collapse-id="'+id+'"]'
    );
  }

  function setCollapsedState(id,collapsed){
    const body=getCollapseBody(id);
    if(!body)return;

    const container=
      document.querySelector(
        '[data-collapse-section="'+id+'"]'
      );

    body.hidden=collapsed;

    if(container){
      container.classList.toggle(
        "is-collapsed",
        collapsed
      );
    }

    document
      .querySelectorAll(
        '[data-collapse-target="'+id+'"]'
      )
      .forEach(function(button){
        button.setAttribute(
          "aria-expanded",
          collapsed ? "false" : "true"
        );

        const icon=
          button.querySelector(".collapse-icon");

        const label=
          button.querySelector(".collapse-label");

        if(icon){
          icon.textContent=
            collapsed ? "+" : "−";
        }

        if(label){
          label.textContent=
            collapsed ? "Expand" : "Collapse";
        }
      });
  }

  document
    .querySelectorAll("[data-collapse-target]")
    .forEach(function(button){
      button.addEventListener(
        "click",
        function(){
          const id=
            button.getAttribute(
              "data-collapse-target"
            );

          const body=getCollapseBody(id);
          if(!body)return;

          setCollapsedState(
            id,
            !body.hidden
          );
        }
      );
    });

  [
    "synth",
    "sequencer",
    "audio-recorder",
    "mixing-console"
  ].forEach(function(id){
    setCollapsedState(id,false);
  });
})();

/* ===== compatibility block ===== */
(function(){
  function updateSynthKnob(input){
    const wrap=input.closest(".synth-rotary-wrap");
    if(!wrap)return;

    const knob=wrap.querySelector(".synth-rotary-knob");
    if(!knob)return;

    const min=parseFloat(input.min||0);
    const max=parseFloat(input.max||1);
    const value=parseFloat(input.value||0);

    const normalized=
      max>min
        ?(value-min)/(max-min)
        :0;

    const degrees=
      -135+
      Math.max(
        0,
        Math.min(1,normalized)
      )*270;

    knob.style.setProperty(
    "--knob-angle",
    degrees+"deg"
  );
  }

  function initSynthKnobs(){
    document
      .querySelectorAll(".synth-rotary-input")
      .forEach(function(input){
        updateSynthKnob(input);

        if(
          input.dataset.knobFallbackBound!=="1"
        ){
          input.dataset.knobFallbackBound="1";

          input.addEventListener(
            "input",
            function(){
              updateSynthKnob(input);
            }
          );
        }
      });
  }

  if(document.readyState==="loading"){
    document.addEventListener(
      "DOMContentLoaded",
      initSynthKnobs,
      {once:true}
    );
  }else{
    initSynthKnobs();
  }
})();

/* ===== compatibility block ===== */
(function(){
  function ensureInstrumentMixer(){
    const host=document.getElementById("mixer");
    if(!host)return;

    if(host.children.length>0)return;

    const fallbackTracks=[
      ["Kick","kick",.86],
      ["Snare","snare",.56],
      ["Closed Hat","hat",.34],
      ["Open Hat","openhat",.22],
      ["Perc","perc",.30],
      ["Synth 2","synth2",.34],
      ["Synth 1","synth",.38],
      ["Sample","sample",.70]
    ];

    fallbackTracks.forEach(function(item){
      const strip=document.createElement("div");
      strip.className="channel";

      const label=document.createElement("label");
      label.textContent=item[0];

      const buttons=document.createElement("div");
      buttons.className="channel-buttons";

      const mute=document.createElement("button");
      mute.className="channel-mute";
      mute.type="button";
      mute.dataset.type=item[1];
      mute.textContent="M";

      const solo=document.createElement("button");
      solo.className="channel-solo";
      solo.type="button";
      solo.dataset.type=item[1];
      solo.textContent="S";

      mute.addEventListener("click",function(){
        mute.classList.toggle("on");
      });

      solo.addEventListener("click",function(){
        solo.classList.toggle("on");
      });

      const range=document.createElement("input");
      range.className="vertical-fader";
      range.type="range";
      range.min="0";
      range.max="1";
      range.step=".01";
      range.value=String(item[2]);
      range.dataset.midiKey=
        "instrument-mixer."+
        item[1];

      const out=document.createElement("output");
      out.textContent=
        Math.round(item[2]*100)+"%";

      range.addEventListener("input",function(){
        out.textContent=
          Math.round(
            parseFloat(range.value)*100
          )+"%";

        if(window.tracks){
          const track=
            window.tracks.find(
              function(t){
                return t.type===item[1];
              }
            );

          if(track){
            track.level=
              parseFloat(range.value);
          }
        }
      });

      buttons.append(mute,solo);
      strip.append(label,buttons,range,out);
      host.appendChild(strip);
    });
  }

  function ensureAudioMixer(){
    const host=
      document.getElementById(
        "audioChannelMixer"
      );

    if(!host)return;
    if(host.children.length>0)return;

    for(let i=0;i<4;i++){
      const strip=
        document.createElement("div");

      strip.className=
        "audio-channel-strip";

      const label=
        document.createElement("label");

      label.textContent=
        "Audio "+(i+1);

      const buttons=
        document.createElement("div");

      buttons.className=
        "channel-buttons";

      const mute=
        document.createElement("button");

      mute.className=
        "channel-mute";

      mute.type="button";
      mute.textContent="M";

      const solo=
        document.createElement("button");

      solo.className=
        "channel-solo";

      solo.type="button";
      solo.textContent="S";

      const arm=
        document.createElement("button");

      arm.className=
        "channel-arm";

      arm.type="button";
      arm.textContent="R";

      mute.addEventListener(
        "click",
        function(){
          mute.classList.toggle("on");
        }
      );

      solo.addEventListener(
        "click",
        function(){
          solo.classList.toggle("on");
        }
      );

      arm.addEventListener(
        "click",
        function(){
          document
            .querySelectorAll(
              "#audioChannelMixer .channel-arm"
            )
            .forEach(
              function(button){
                button.classList.remove(
                  "on"
                );
              }
            );

          arm.classList.add("on");
        }
      );

      const range=
        document.createElement("input");

      range.className=
        "vertical-fader";

      range.type="range";
      range.min="0";
      range.max="1";
      range.step=".01";
      range.value="1";
      range.dataset.midiKey=
        "audio-mixer."+
        i;

      const out=
        document.createElement("output");

      out.textContent="100%";

      range.addEventListener(
        "input",
        function(){
          out.textContent=
            Math.round(
              parseFloat(
                range.value
              )*100
            )+"%";
        }
      );

      if(i===0){
        arm.classList.add("on");
      }

      buttons.append(
        arm,
        mute,
        solo
      );

      strip.append(
        label,
        buttons,
        range,
        out
      );

      host.appendChild(strip);
    }
  }

  function restoreMixers(){
    ensureInstrumentMixer();
    ensureAudioMixer();
  }

  if(document.readyState==="loading"){
    document.addEventListener(
      "DOMContentLoaded",
      restoreMixers,
      {once:true}
    );
  }else{
    restoreMixers();
  }

  setTimeout(
    restoreMixers,
    700
  );
})();

/* ===== compatibility block ===== */
(function(){
  function setSynthStatus(message){
    const status=
      document.getElementById("status");

    if(status){
      status.textContent=message;
    }
  }

  window.addEventListener(
    "error",
    function(event){
      if(
        String(
          event.message||""
        ).toLowerCase().includes(
          "audio"
        )
      ){
        setSynthStatus(
          "audio error"
        );
      }
    }
  );
})();

/* ===== compatibility block ===== */
(function(){
  function restoreRecorderTimeline(){
    const ruler=
      document.getElementById(
        "timelineRuler"
      );

    const timeline=
      document.getElementById(
        "audioTimeline"
      );

    if(!ruler||!timeline)return;

    if(ruler.children.length!==16){
      ruler.innerHTML="";

      for(let i=1;i<=16;i++){
        const mark=
          document.createElement("span");

        mark.textContent=String(i);
        ruler.appendChild(mark);
      }
    }

    if(timeline.children.length===0){
      for(let i=0;i<4;i++){
        const row=
          document.createElement("div");

        row.className=
          "audio-track-row";

        row.dataset.audioChannel=
          String(i);

        const label=
          document.createElement("div");

        label.className=
          "audio-track-label";

        label.textContent=
          "Audio "+
          (i+1)+
          (i===0
            ?" • armed"
            :"");

        row.appendChild(label);
        timeline.appendChild(row);
      }
    }
  }

  if(document.readyState==="loading"){
    document.addEventListener(
      "DOMContentLoaded",
      restoreRecorderTimeline,
      {once:true}
    );
  }else{
    restoreRecorderTimeline();
  }

  setTimeout(
    restoreRecorderTimeline,
    800
  );
})();

/* ===== compatibility block ===== */
(function(){
  function bindFallbackPiano(){
    const host=
      document.getElementById(
        "synthKeyboard"
      );

    if(!host)return;

    host
      .querySelectorAll(
        ".synth-key[data-midi]"
      )
      .forEach(function(key){
        if(
          key.dataset.fallbackPianoBound==="1"
        ){
          return;
        }

        key.dataset.fallbackPianoBound="1";

        key.addEventListener(
          "pointerdown",
          async function(){
            const note=
              parseInt(
                key.dataset.midi,
                10
              );

            try{
              if(
                typeof window.ensureAudio==="function"
              ){
                window.ensureAudio();
              }

              if(
                window.audio &&
                window.audio.state==="suspended"
              ){
                await window.audio.resume();
              }

              if(
                typeof window.leadSynth==="function" &&
                window.audio
              ){
                const level=
                  document.getElementById(
                    "synthLevel"
                  );

                window.leadSynth(
                  window.audio.currentTime,
                  note,
                  level
                    ?parseFloat(level.value)
                    :.38
                );
              }
            }catch(error){}

            key.classList.add("on");

            setTimeout(
              function(){
                key.classList.remove("on");
              },
              140
            );
          }
        );
      });
  }

  if(document.readyState==="loading"){
    document.addEventListener(
      "DOMContentLoaded",
      bindFallbackPiano,
      {once:true}
    );
  }else{
    bindFallbackPiano();
  }

  setTimeout(
    bindFallbackPiano,
    900
  );
})();

/* ===== compatibility block ===== */
(function(){
  let fallbackAudio=null;
  let fallbackMaster=null;
  let fallbackAnalyser=null;
  let visualData=null;
  let visualPhase=0;

  function byId(id){
    return document.getElementById(id);
  }

  function ensureFallbackAudio(){
    if(fallbackAudio)return fallbackAudio;

    const AudioContextClass=
      window.AudioContext||
      window.webkitAudioContext;

    if(!AudioContextClass)return null;

    fallbackAudio=
      new AudioContextClass();

    fallbackMaster=
      fallbackAudio.createGain();

    fallbackMaster.gain.value=.72;

    fallbackAnalyser=
      fallbackAudio.createAnalyser();

    fallbackAnalyser.fftSize=1024;
    fallbackAnalyser.smoothingTimeConstant=.62;

    fallbackMaster.connect(
      fallbackAnalyser
    );

    fallbackAnalyser.connect(
      fallbackAudio.destination
    );

    window.grooveboxFallbackAnalyser=
      fallbackAnalyser;

    return fallbackAudio;
  }

  function midiToFrequency(note){
    return 440*
      Math.pow(
        2,
        (note-69)/12
      );
  }

  function numberValue(id,fallback){
    const el=byId(id);

    if(!el)return fallback;

    const value=
      parseFloat(el.value);

    return Number.isFinite(value)
      ?value
      :fallback;
  }

  function textValue(id,fallback){
    const el=byId(id);

    return el
      ?el.value
      :fallback;
  }

  async function playFallbackSynth(note){
    const audio=
      ensureFallbackAudio();

    if(!audio)return;

    if(audio.state==="suspended"){
      await audio.resume();
    }

    const now=
      audio.currentTime;

    const attack=
      Math.max(
        .005,
        numberValue(
          "synthAttack",
          .03
        )
      );

    const decay=
      Math.max(
        .01,
        numberValue(
          "synthDecay",
          .12
        )
      );

    const sustain=
      Math.max(
        .02,
        Math.min(
          1,
          numberValue(
            "synthSustain",
            .68
          )
        )
      );

    const release=
      Math.max(
        .05,
        numberValue(
          "synthRelease",
          .42
        )
      );

    const level=
      Math.max(
        .02,
        Math.min(
          .8,
          numberValue(
            "synthLevel",
            .38
          )
        )
      );

    const env=
      audio.createGain();

    env.gain.setValueAtTime(
      .0001,
      now
    );

    env.gain.exponentialRampToValueAtTime(
      level,
      now+attack
    );

    env.gain.exponentialRampToValueAtTime(
      Math.max(
        .001,
        level*sustain
      ),
      now+attack+decay
    );

    env.gain.setValueAtTime(
      Math.max(
        .001,
        level*sustain
      ),
      now+
      attack+
      decay+
      .18
    );

    env.gain.exponentialRampToValueAtTime(
      .001,
      now+
      attack+
      decay+
      .18+
      release
    );

    const postFilter=
      audio.createBiquadFilter();

    postFilter.type=
      textValue(
        "synthFilterType",
        "lowpass"
      );

    postFilter.frequency.value=
      numberValue(
        "synthFilterCutoff",
        4200
      );

    postFilter.Q.value=
      numberValue(
        "synthFilterRes",
        4
      );

    env.connect(postFilter);
    postFilter.connect(fallbackMaster);

    const oscillatorSpecs=[
      {
        wave:textValue(
          "osc1Wave",
          "sawtooth"
        ),
        octave:numberValue(
          "osc1Octave",
          0
        ),
        pitch:numberValue(
          "osc1Pitch",
          0
        ),
        detune:numberValue(
          "osc1Detune",
          -4
        ),
        gain:numberValue(
          "osc1Level",
          .7
        ),
        cutoff:numberValue(
          "osc1Cutoff",
          3200
        ),
        resonance:numberValue(
          "osc1Res",
          5
        )
      },
      {
        wave:textValue(
          "osc2Wave",
          "square"
        ),
        octave:numberValue(
          "osc2Octave",
          0
        ),
        pitch:numberValue(
          "osc2Pitch",
          0
        ),
        detune:numberValue(
          "osc2Detune",
          7
        ),
        gain:numberValue(
          "osc2Level",
          .48
        ),
        cutoff:numberValue(
          "osc2Cutoff",
          1800
        ),
        resonance:numberValue(
          "osc2Res",
          7
        )
      }
    ];

    oscillatorSpecs.forEach(spec=>{
      const osc=
        audio.createOscillator();

      const gain=
        audio.createGain();

      const filter=
        audio.createBiquadFilter();

      osc.type=spec.wave;

      const semitones=
        spec.octave*12+
        spec.pitch;

      osc.frequency.value=
        midiToFrequency(
          note+semitones
        );

      osc.detune.value=
        spec.detune;

      gain.gain.value=
        Math.max(
          0,
          Math.min(
            1,
            spec.gain
          )
        );

      filter.type="lowpass";
      filter.frequency.value=
        spec.cutoff;

      filter.Q.value=
        spec.resonance;

      osc.connect(gain);
      gain.connect(filter);
      filter.connect(env);

      osc.start(now);

      osc.stop(
        now+
        attack+
        decay+
        .18+
        release+
        .08
      );
    });

    const status=
      byId("status");

    if(status){
      status.textContent=
        "synth live";
    }

    setTimeout(
      function(){
        if(
          status &&
          status.textContent===
          "synth live"
        ){
          status.textContent="ready";
        }
      },
      700
    );
  }

  function bindKeyboard(){
    const host=
      byId("synthKeyboard");

    if(!host)return;

    if(
      host.dataset.fallbackSynthBound===
      "1"
    ){
      return;
    }

    host.dataset.fallbackSynthBound="1";

    host.addEventListener(
      "pointerdown",
      function(event){
        const key=
          event.target.closest(
            ".synth-key"
          );

        if(
          !key ||
          !host.contains(key)
        ){
          return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        const note=
          parseInt(
            key.dataset.midi,
            10
          );

        if(!Number.isFinite(note)){
          return;
        }

        playFallbackSynth(note);

        key.classList.add("on");

        setTimeout(
          function(){
            key.classList.remove("on");
          },
          160
        );
      },
      true
    );
  }

  function drawVisualizer(){
    const canvas=
      byId("oscVisualizer");

    if(!canvas){
      requestAnimationFrame(
        drawVisualizer
      );
      return;
    }

    const ctx=
      canvas.getContext("2d");

    if(!ctx){
      requestAnimationFrame(
        drawVisualizer
      );
      return;
    }

    const rect=
      canvas.getBoundingClientRect();

    const ratio=
      Math.min(
        window.devicePixelRatio||1,
        2
      );

    const w=
      Math.max(
        320,
        Math.floor(
          rect.width*ratio
        )
      );

    const h=
      Math.max(
        180,
        Math.floor(
          rect.height*ratio
        )
      );

    if(
      canvas.width!==w ||
      canvas.height!==h
    ){
      canvas.width=w;
      canvas.height=h;
    }

    ctx.clearRect(0,0,w,h);

    const bg=
      ctx.createLinearGradient(
        0,
        0,
        0,
        h
      );

    bg.addColorStop(
      0,
      "rgba(10,8,18,.98)"
    );

    bg.addColorStop(
      1,
      "rgba(4,4,8,.98)"
    );

    ctx.fillStyle=bg;
    ctx.fillRect(0,0,w,h);

    ctx.strokeStyle=
      "rgba(255,255,255,.055)";

    ctx.lineWidth=1;

    for(let i=1;i<8;i++){
      const x=w*i/8;
      ctx.beginPath();
      ctx.moveTo(x,0);
      ctx.lineTo(x,h);
      ctx.stroke();
    }

    for(let i=1;i<5;i++){
      const y=h*i/5;
      ctx.beginPath();
      ctx.moveTo(0,y);
      ctx.lineTo(w,y);
      ctx.stroke();
    }

    let analyser=
      window.grooveboxFallbackAnalyser||
      window.grooveboxSynthAnalyser||
      null;

    let live=false;

    if(analyser){
      if(
        !visualData ||
        visualData.length!==
        analyser.fftSize
      ){
        visualData=
          new Uint8Array(
            analyser.fftSize
          );
      }

      analyser.getByteTimeDomainData(
        visualData
      );

      let peak=0;

      for(
        let i=0;
        i<visualData.length;
        i++
      ){
        peak=
          Math.max(
            peak,
            Math.abs(
              visualData[i]-128
            )
          );
      }

      live=peak>1;
    }

    const gradient=
      ctx.createLinearGradient(
        0,
        0,
        w,
        0
      );

    gradient.addColorStop(
      0,
      "rgba(113,73,255,1)"
    );

    gradient.addColorStop(
      .5,
      "rgba(166,108,255,1)"
    );

    gradient.addColorStop(
      1,
      "rgba(255,66,208,1)"
    );

    ctx.strokeStyle=gradient;
    ctx.lineWidth=
      Math.max(
        2,
        w/300
      );

    ctx.shadowBlur=14;
    ctx.shadowColor=
      "rgba(166,108,255,.55)";

    ctx.beginPath();

    if(live){
      const slice=
        w/
        Math.max(
          1,
          visualData.length-1
        );

      visualData.forEach(
        function(value,index){
          const x=
            index*slice;

          const sample=
            (value-128)/128;

          const y=
            h*.5+
            sample*h*.40;

          if(index===0){
            ctx.moveTo(x,y);
          }else{
            ctx.lineTo(x,y);
          }
        }
      );
    }else{
      visualPhase+=.035;

      for(let i=0;i<220;i++){
        const t=i/219;
        const x=t*w;

        const wave=
          Math.sin(
            t*Math.PI*8+
            visualPhase
          )*
          .7+
          Math.sin(
            t*Math.PI*17-
            visualPhase*.5
          )*
          .18;

        const y=
          h*.5+
          wave*
          Math.sin(
            Math.PI*t
          )*
          h*.05;

        if(i===0){
          ctx.moveTo(x,y);
        }else{
          ctx.lineTo(x,y);
        }
      }
    }

    ctx.stroke();
    ctx.shadowBlur=0;

    ctx.fillStyle=
      live
        ?"rgba(255,255,255,.8)"
        :"rgba(166,108,255,.52)";

    ctx.font=
      Math.max(
        10,
        Math.floor(w/38)
      )+
      "px Arial";

    ctx.fillText(
      live
        ?"LIVE SYNTH"
        :"SYNTH READY",
      12,
      20
    );

    requestAnimationFrame(
      drawVisualizer
    );
  }

  bindKeyboard();

  const keyScale=
    byId("keyScale");

  if(keyScale){
    keyScale.addEventListener(
      "input",
      function(){
        setTimeout(
          bindKeyboard,
          0
        );
      }
    );
  }

  new MutationObserver(
    bindKeyboard
  ).observe(
    document.body,
    {
      childList:true,
      subtree:true
    }
  );

  drawVisualizer();
})();

/* ===== compatibility block ===== */
(function(){
  const ids=[
    "synthFilterCutoff",
    "synthFilterRes",
    "synthFilterDrive",
    "bassFilterCutoff",
    "bassFilterRes",
    "bassFilterDrive"
  ];

  function updateFilterKnob(input){
    const knob=
      document.querySelector(
        '[data-knob-for="'+
        input.id+
        '"]'
      );

    if(!knob)return;

    let indicator=
      knob.querySelector(
        ".filter-knob-indicator"
      );

    if(!indicator){
      indicator=
        document.createElement("span");

      indicator.className=
        "filter-knob-indicator";

      knob.appendChild(indicator);
    }

    const min=
      parseFloat(
        input.min||0
      );

    const max=
      parseFloat(
        input.max||1
      );

    const value=
      parseFloat(
        input.value||0
      );

    const normalized=
      max>min
        ?(value-min)/(max-min)
        :0;

    const angle=
      -135+
      Math.max(
        0,
        Math.min(
          1,
          normalized
        )
      )*270;

    indicator.style.transform=
      "translate(-50%,-100%) rotate("+
      angle+
      "deg)";
  }

  function initFilterKnobs(){
    ids.forEach(function(id){
      const input=
        document.getElementById(id);

      if(!input)return;

      updateFilterKnob(input);

      if(
        input.dataset.filterVisualBound===
        "1"
      ){
        return;
      }

      input.dataset.filterVisualBound="1";

      input.addEventListener(
        "input",
        function(){
          updateFilterKnob(input);
        }
      );

      input.addEventListener(
        "change",
        function(){
          updateFilterKnob(input);
        }
      );
    });
  }

  if(document.readyState==="loading"){
    document.addEventListener(
      "DOMContentLoaded",
      initFilterKnobs,
      {once:true}
    );
  }else{
    initFilterKnobs();
  }

  setTimeout(
    initFilterKnobs,
    500
  );
})();

/* ===== compatibility block ===== */
(function(){
  function activatePatternBank(index){
    const bank=
      Math.max(
        0,
        Math.min(
          3,
          Number(index)||0
        )
      );

    try{
      if(typeof switchSequence==="function"){
        switchSequence(bank);
      }else{
        activeSequence=bank;

        if(typeof refreshSequenceView==="function"){
          refreshSequenceView();
        }

        if(typeof refreshSequenceStatus==="function"){
          refreshSequenceStatus();
        }
      }
    }catch(error){
      console.warn(
        "Pattern bank switch failed:",
        error
      );
      return;
    }

    document
      .querySelectorAll(
        "#sequenceButtons .sequence-btn"
      )
      .forEach(button=>{
        button.classList.toggle(
          "active",
          Number(button.dataset.seq)===bank
        );

        button.setAttribute(
          "aria-pressed",
          Number(button.dataset.seq)===bank
            ?"true"
            :"false"
        );
      });

    const status=
      document.getElementById(
        "sequenceStatus"
      );

    if(status){
      const first=
        bank*16+1;

      status.textContent=
        "Editing Sequence "+
        (bank+1)+
        " · steps "+
        first+
        "–"+
        (first+15);
    }
  }

  const container=
    document.getElementById(
      "sequenceButtons"
    );

  if(!container)return;

  container
    .querySelectorAll(".sequence-btn")
    .forEach(button=>{
      button.setAttribute(
        "aria-pressed",
        button.classList.contains("active")
          ?"true"
          :"false"
      );
    });

  container.addEventListener(
    "pointerdown",
    event=>{
      const button=
        event.target.closest(
          ".sequence-btn"
        );

      if(!button)return;

      event.preventDefault();
      event.stopPropagation();

      activatePatternBank(
        button.dataset.seq
      );
    }
  );

  container.addEventListener(
    "keydown",
    event=>{
      const button=
        event.target.closest(
          ".sequence-btn"
        );

      if(
        !button ||
        (
          event.key!=="Enter" &&
          event.key!==" "
        )
      ){
        return;
      }

      event.preventDefault();

      activatePatternBank(
        button.dataset.seq
      );
    }
  );
})();

/* ===== compatibility block ===== */
(function(){
  const slider=
    document.getElementById(
      "keyScale"
    );

  const output=
    document.getElementById(
      "keyScaleOut"
    );

  const keyboard=
    document.getElementById(
      "synthKeyboard"
    );

  if(
    !slider ||
    !output ||
    !keyboard
  ){
    return;
  }

  const intervals=[
    0,1,2,3,4,5,6,
    7,8,9,10,11,12
  ];

  const black=
    new Set([1,3,6,8,10]);

  const whiteSlots={
    0:0,
    2:1,
    4:2,
    5:3,
    7:4,
    9:5,
    11:6,
    12:7
  };

  const blackSlots={
    1:1,
    3:2,
    6:4,
    8:5,
    10:6
  };

  const names=[
    "C","C#","D","D#","E","F",
    "F#","G","G#","A","A#","B"
  ];

  function noteName(midi){
    const octave=
      Math.floor(midi/12)-1;

    return (
      names[midi%12]+
      octave
    );
  }

  function rebuildKeyboard(){
    const octave=
      Math.max(
        0,
        Math.min(
          8,
          parseInt(
            slider.value,
            10
          )||4
        )
      );

    slider.value=
      String(octave);

    output.textContent=
      "C"+
      octave+
      "–C"+
      (octave+1);

    const baseMidi=
      (octave+1)*12;

    keyboard.innerHTML="";

    intervals.forEach(interval=>{
      const midi=
        baseMidi+interval;

      const key=
        document.createElement(
          "button"
        );

      key.type="button";
      key.className=
        "synth-key"+
        (
          black.has(interval)
            ?" black"
            :""
        );

      key.dataset.midi=
        String(midi);

      if(black.has(interval)){
        key.style.setProperty(
          "--black-slot",
          String(
            blackSlots[interval]
          )
        );
      }else{
        key.style.setProperty(
          "--white-slot",
          String(
            whiteSlots[interval]
          )
        );

        key.textContent=
          noteName(midi);
      }

      keyboard.appendChild(key);
    });
  }

  slider.addEventListener(
    "input",
    rebuildKeyboard
  );

  slider.addEventListener(
    "change",
    rebuildKeyboard
  );

  rebuildKeyboard();
})();

/* ===== compatibility block ===== */
(function(){
  const menu=
    document.getElementById(
      "midiLearnMenu"
    );

  const meta=
    document.getElementById(
      "midiLearnMeta"
    );

  const learnButton=
    document.getElementById(
      "midiLearnStart"
    );

  const clearButton=
    document.getElementById(
      "midiLearnClear"
    );

  if(
    !menu ||
    !meta ||
    !learnButton ||
    !clearButton
  ){
    return;
  }

  let menuControl=null;

  function closeMenu(){
    menu.classList.remove(
      "open"
    );

    menu.setAttribute(
      "aria-hidden",
      "true"
    );
  }

  function openMenu(
    control,
    x,
    y
  ){
    menuControl=control;

    const targetKey=
      midiControlKey(control);

    const mapping=
      Object.values(
        midiLearnMappings
      ).find(
        item=>
          item&&
          item.target===targetKey
      );

    meta.textContent=
      describeMidiControl(control)+
      (
        mapping
          ?" · CC "+mapping.cc+
            " Ch "+mapping.channel
          :" · not mapped"
      );

    clearButton.disabled=
      !mapping;

    menu.classList.add(
      "open"
    );

    menu.setAttribute(
      "aria-hidden",
      "false"
    );

    const width=210;
    const height=128;

    menu.style.left=
      Math.min(
        x,
        innerWidth-width-8
      )+
      "px";

    menu.style.top=
      Math.min(
        y,
        innerHeight-height-8
      )+
      "px";
  }

  document.addEventListener(
    "contextmenu",
    event=>{
      const control=
        event.target.closest(
          'input[type="range"]'
        );

      if(!control){
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      openMenu(
        control,
        event.clientX,
        event.clientY
      );
    }
  );

  learnButton.addEventListener(
    "click",
    async()=>{
      if(!menuControl)return;

      closeMenu();

      if(!midiAccess){
        await connectMidi();
      }

      if(
        midiAccess &&
        !activeMidiInput
      ){
        refreshMidiInputs();
      }

      if(!activeMidiInput){
        showMidiLearnToast(
          "Connect your Korg nanoKONTROL first."
        );
        return;
      }

      startMidiLearn(
        menuControl
      );
    }
  );

  clearButton.addEventListener(
    "click",
    ()=>{
      if(!menuControl)return;

      const targetKey=
        midiControlKey(
          menuControl
        );

      const removed=
        removeMappingsForTarget(
          targetKey
        );

      closeMenu();

      showMidiLearnToast(
        removed
          ?"MIDI mapping cleared."
          :"No MIDI mapping on this control."
      );
    }
  );

  document.addEventListener(
    "pointerdown",
    event=>{
      if(
        menu.classList.contains("open") &&
        !menu.contains(event.target)
      ){
        closeMenu();
      }
    }
  );

  document.addEventListener(
    "keydown",
    event=>{
      if(event.key==="Escape"){
        closeMenu();

        if(midiLearnTarget){
          midiLearnTarget=null;
          clearMidiLearnHighlight();

          setMidiStatus(
            activeMidiInput
              ?"Connected: "+
                (
                  activeMidiInput.name||
                  "MIDI Controller"
                )
              :"MIDI disconnected",
            !!activeMidiInput
          );

          showMidiLearnToast(
            "MIDI Learn cancelled."
          );
        }
      }
    }
  );

  new MutationObserver(
    refreshMidiMappedVisuals
  ).observe(
    document.body,
    {
      childList:true,
      subtree:true
    }
  );

  refreshMidiMappedVisuals();
})();

/* ===== compatibility block ===== */
(function(){
  if(
    typeof initializeSynthParameterStates==="function"
  ){
    initializeSynthParameterStates();
  }

  if(
    typeof switchSynthEditor==="function"
  ){
    switchSynthEditor("synth");
  }
})();

/* ===== compatibility block ===== */
(function(){
  function organizeGrooveboxSections(){
    const sequencer=document.querySelector(".sequencer-card");
    const mixerBlock=document.querySelector(".embedded-mixer[data-collapse-section='mixing-console']");
    const recorder=document.querySelector(".audio-recorder[data-collapse-section='audio-recorder']");

    if(!sequencer||!mixerBlock)return;

    const mixerSection=document.createElement("section");
    mixerSection.className="card groovebox-mixer-section";
    mixerSection.dataset.section="mixer";
    mixerBlock.parentNode.insertBefore(mixerSection,mixerBlock);
    mixerSection.appendChild(mixerBlock);

    if(sequencer.parentNode){
      sequencer.parentNode.insertBefore(mixerSection,sequencer.nextSibling);
    }

    const head=mixerBlock.querySelector(".mixing-console-head strong");
    const sub=mixerBlock.querySelector(".mixing-console-head span");
    if(head)head.textContent="Mixer";
    if(sub)sub.textContent="8 assignable channels • EQ • pan • level";

    const instHead=mixerBlock.querySelector(".embedded-mixer-head strong");
    const instSub=mixerBlock.querySelector(".embedded-mixer-head span");
    if(instHead)instHead.textContent="Channel Mixer";
    if(instSub)instSub.textContent="route each sequencer row to CH 1–8";

    if(recorder&&mixerSection.parentNode){
      const recorderSection=document.createElement("section");
      recorderSection.className="card groovebox-mixer-section groovebox-recorder-section";
      recorder.parentNode.insertBefore(recorderSection,recorder);
      recorderSection.appendChild(recorder);
      mixerSection.parentNode.insertBefore(recorderSection,mixerSection.nextSibling);
    }
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",organizeGrooveboxSections,{once:true});
  }else{
    organizeGrooveboxSections();
  }
})();
