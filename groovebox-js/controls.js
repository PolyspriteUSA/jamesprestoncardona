function buildSynthKeyboard(octave){
  const host=$("synthKeyboard");
  if(!host)return;

  host.innerHTML="";

  const baseMidi=(octave+1)*12;
  const whitePositions={
    0:0,
    2:1,
    4:2,
    5:3,
    7:4,
    9:5,
    11:6,
    12:7
  };

  const blackLeft={
    1:1,
    3:2,
    6:4,
    8:5,
    10:6
  };

  keyboardIntervals.forEach(interval=>{
    const note=baseMidi+interval;
    const b=document.createElement("button");

    b.type="button";
    b.dataset.midi=String(note);

    const isBlack=
      keyboardBlackIntervals.has(
        interval
      );

    b.className=
      "synth-key"+
      (isBlack?" black":"");

    b.textContent=
      isBlack
        ?""
        :noteName(note);

    if(isBlack){
      b.style.setProperty(
        "--black-slot",
        String(blackLeft[interval])
      );
    }else{
      b.style.setProperty(
        "--white-slot",
        String(whitePositions[interval])
      );
    }

    const trigger=async()=>{
      ensureAudio();

      if(audio.state==="suspended"){
        await audio.resume();
      }

      if(arpEnabled){
        arpNoteOn(note,activeSynthEditor);
      }else{
        leadSynth(
          audio.currentTime,
          note,
          parseFloat(getSynthParamValue("synthLevel",activeSynthEditor)),
          activeSynthEditor
        );
        recordMidiNoteOn(note,.9,activeSynthEditor);
      }

      b.classList.add("on");

      setTimeout(
        ()=>b.classList.remove("on"),
        140
      );

      pulseVisual();
    };

    b.addEventListener(
      "pointerdown",
      trigger
    );
    const releaseRecorded=()=>{if(arpEnabled)arpNoteOff(note,activeSynthEditor);else recordMidiNoteOff(note,activeSynthEditor);};
    b.addEventListener("pointerup",releaseRecorded);
    b.addEventListener("pointercancel",releaseRecorded);
    b.addEventListener("pointerleave",event=>{if(event.buttons)releaseRecorded();});

    host.appendChild(b);
  });
}
$("arpToggle").addEventListener("click",toggleArp);
$("arpLatch").addEventListener("click",toggleArpLatch);
$("arpRate").addEventListener("change",refreshArpTimer);
$("arpMode").addEventListener("change",()=>{arpCounter=0;arpDirection=1;});
$("arpOctaves").addEventListener("change",()=>{arpCounter=0;});

function updateKeyScale(){
  const slider=$("keyScale");
  const output=$("keyScaleOut");

  if(!slider||!output)return;

  const octave=
    Math.max(
      0,
      Math.min(
        8,
        parseInt(slider.value,10)||4
      )
    );

  output.textContent=
    "C"+
    octave+
    "–C"+
    (octave+1);

  buildSynthKeyboard(octave);
}

$("keyScale").addEventListener(
  "input",
  updateKeyScale
);

updateKeyScale();

function bind(id,outId,format,fn){
  const el=$(id),outEl=$(outId);
  const update=()=>{outEl.textContent=format(el.value);if(fn)fn(parseFloat(el.value))};
  el.addEventListener("input",update);update();
}
bind("osc1Octave","osc1OctaveOut",v=>String(+v));
bind("osc1Pitch","osc1PitchOut",v=>Math.round(v)+" st");
bind("osc1Detune","osc1DetuneOut",v=>Math.round(v)+" ct");
bind("osc1Level","osc1LevelOut",v=>Math.round(v*100)+"%");
bind("osc1Cutoff","osc1CutoffOut",v=>Math.round(v)+" Hz");
bind("osc1Res","osc1ResOut",v=>(+v).toFixed(1));

bind("osc2Octave","osc2OctaveOut",v=>String(+v));
bind("osc2Pitch","osc2PitchOut",v=>Math.round(v)+" st");
bind("osc2Detune","osc2DetuneOut",v=>Math.round(v)+" ct");
bind("osc2Level","osc2LevelOut",v=>Math.round(v*100)+"%");
bind("osc2Cutoff","osc2CutoffOut",v=>Math.round(v)+" Hz");
bind("osc2Res","osc2ResOut",v=>(+v).toFixed(1));

bind("synthAttack","synthAttackOut",v=>(+v).toFixed(2)+" s");
bind("synthDecay","synthDecayOut",v=>(+v).toFixed(2)+" s");
bind("synthSustain","synthSustainOut",v=>Math.round(v*100)+"%");
bind("synthRelease","synthReleaseOut",v=>(+v).toFixed(2)+" s");
bind("synthDelay","synthDelayOut",v=>Math.round(v*100)+"%",v=>{
  if(synthDelayWet){
    synthDelayWet.gain.setTargetAtTime(v,audio.currentTime,.02);
  }
});
bind("synthDelayTime","synthDelayTimeOut",v=>Math.round(v*1000)+" ms",v=>{
  if(synthDelayNode){
    synthDelayNode.delayTime.setTargetAtTime(v,audio.currentTime,.02);
  }
});
bind("synthDelayFeedback","synthDelayFeedbackOut",v=>Math.round(v*100)+"%",v=>{
  if(synthDelayFeedbackNode){
    synthDelayFeedbackNode.gain.setTargetAtTime(v,audio.currentTime,.02);
  }
});
bind("synthLevel","synthLevelOut",v=>Math.round(v*100)+"%");



function updateSynthRotaryKnob(input){
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
    Math.max(0,Math.min(1,normalized))*270;

  knob.style.setProperty(
    "--knob-angle",
    degrees+"deg"
  );
}

document
  .querySelectorAll(".synth-rotary-input")
  .forEach(input=>{
    if(!input.closest(".synth-rotary-wrap")){
      const wrap=document.createElement("div");
      wrap.className="synth-rotary-wrap";

      const knob=document.createElement("div");
      knob.className="synth-rotary-knob";
      knob.setAttribute("aria-hidden","true");

      input.parentNode.insertBefore(wrap,input);
      wrap.appendChild(input);
      wrap.appendChild(knob);
    }

    updateSynthRotaryKnob(input);

    input.addEventListener(
      "input",
      ()=>updateSynthRotaryKnob(input)
    );
  });

function updateRotaryKnob(input){
  const knob=
    document.querySelector(
      '[data-knob-for="'+input.id+'"]'
    );

  if(!knob)return;

  const min=parseFloat(input.min||0);
  const max=parseFloat(input.max||1);
  const value=parseFloat(input.value||0);

  const t=
    max>min
      ?(value-min)/(max-min)
      :0;

  const degrees=
    -135+
    Math.max(0,Math.min(1,t))*270;

  knob.style.setProperty(
    "--knob-angle",
    degrees+"deg"
  );
}

document
  .querySelectorAll(".rotary-range")
  .forEach(input=>{
    updateRotaryKnob(input);

    input.addEventListener(
      "input",
      ()=>updateRotaryKnob(input)
    );
  });

bind("bassFilterCutoff","bassFilterCutoffOut",v=>Math.round(v)+" Hz");
bind("bassFilterRes","bassFilterResOut",v=>(+v).toFixed(1));
bind("bassFilterDrive","bassFilterDriveOut",v=>Math.round(v*100)+"%");

bind("synthFmCutoff","synthFmCutoffOut",v=>Math.round(v)+" Hz");
bind("synthFmRes","synthFmResOut",v=>(+v).toFixed(1));
bind("synthFmRate","synthFmRateOut",v=>(+v).toFixed(2)+" Hz");
bind("synthFmDepth","synthFmDepthOut",v=>Math.round(v)+" Hz");
bind("synthFmRate2","synthFmRate2Out",v=>(+v).toFixed(2)+" Hz");
bind("synthFmDepth2","synthFmDepth2Out",v=>Math.round(v)+" Hz");

bind("synthFilterCutoff","synthFilterCutoffOut",v=>Math.round(v)+" Hz");
bind("synthFilterRes","synthFilterResOut",v=>(+v).toFixed(1));
bind("synthFilterDrive","synthFilterDriveOut",v=>Math.round(v*100)+"%");
bind("reverb","reverbOut",v=>Math.round(v*100)+"%",v=>{
  if(reverbWet){
    reverbWet.gain.setTargetAtTime(v,audio.currentTime,.02);
  }
});
bind("reverbDecay","reverbDecayOut",v=>(+v).toFixed(1)+" s",()=>{
  refreshMasterReverb();
});
bind("drive","driveOut",v=>Math.round(v*100)+"%");
bind("master","masterOut",v=>Math.round(v*100)+"%",v=>{if(master)master.gain.setTargetAtTime(v,audio.currentTime,.02)});
$("bpm").addEventListener("input",()=>{$("bpmReadout").textContent=$("bpm").value});






const oscVizCanvas=$("oscVisualizer");
const oscVizCtx=
  oscVizCanvas
    ?oscVizCanvas.getContext("2d")
    :null;

let oscVizData=null;
