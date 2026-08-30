function makeMixerRotary(labelText,min,max,step,value,onInput,format){
  const group=document.createElement("label");
  group.className="mixer-knob-control";

  const label=document.createElement("span");
  label.textContent=labelText;

  const wrap=document.createElement("div");
  wrap.className="mixer-knob-wrap";

  const input=document.createElement("input");
  input.type="range";
  input.className="mixer-knob-input";
  input.min=min;
  input.max=max;
  input.step=step;
  input.value=value;

  const knob=document.createElement("span");
  knob.className="mixer-knob-face";

  const out=document.createElement("output");
  const updateVisual=()=>{
    const lo=parseFloat(input.min);
    const hi=parseFloat(input.max);
    const val=parseFloat(input.value);
    const ratio=(val-lo)/(hi-lo||1);
    knob.style.setProperty("--angle",(-135+ratio*270)+"deg");
    out.textContent=format(val);
  };

  input.addEventListener("input",()=>{
    updateVisual();
    onInput(parseFloat(input.value));
  });

  wrap.append(input,knob);
  group.append(label,wrap,out);
  updateVisual();
  return group;
}

function buildAssignableMixer(){
  mixer.innerHTML="";
  mixer.classList.add("assignable-mixer");

  mixerChannelState.forEach((state,index)=>{
    const strip=document.createElement("div");
    strip.className="channel mixer-console-strip";
    strip.dataset.channelIndex=index;

    const channelHead=document.createElement("div");
    channelHead.className="mixer-channel-head";

    const number=document.createElement("strong");
    number.textContent="CH "+(index+1);

    const assignment=document.createElement("span");
    assignment.className="mixer-assignment-label";
    assignment.dataset.mixerChannelLabel=index;

    channelHead.append(number,assignment);

    const high=makeMixerRotary(
      "HI",-12,12,.5,state.high,
      value=>{state.high=value;applyMixerChannelState(index);},
      value=>(value>0?"+":"")+value.toFixed(1)
    );

    const mid=makeMixerRotary(
      "MID",-12,12,.5,state.mid,
      value=>{state.mid=value;applyMixerChannelState(index);},
      value=>(value>0?"+":"")+value.toFixed(1)
    );

    const low=makeMixerRotary(
      "LOW",-12,12,.5,state.low,
      value=>{state.low=value;applyMixerChannelState(index);},
      value=>(value>0?"+":"")+value.toFixed(1)
    );

    const pan=makeMixerRotary(
      "PAN",-1,1,.01,state.pan,
      value=>{state.pan=value;applyMixerChannelState(index);},
      value=>Math.abs(value)<.03?"C":(value<0?"L":"R")+Math.round(Math.abs(value)*100)
    );

    const knobStack=document.createElement("div");
    knobStack.className="mixer-knob-stack";
    knobStack.append(high,mid,low,pan);

    const faderWrap=document.createElement("label");
    faderWrap.className="mixer-fader-control";

    const faderLabel=document.createElement("span");
    faderLabel.textContent="LEVEL";

    const fader=document.createElement("input");
    fader.className="vertical-fader mixer-channel-fader";
    fader.type="range";
    fader.min=0;
    fader.max=1;
    fader.step=.01;
    fader.value=state.level;
    fader.setAttribute("aria-label","Mixer channel "+(index+1)+" level");

    const faderOut=document.createElement("output");
    faderOut.textContent=Math.round(state.level*100)+"%";

    fader.addEventListener("input",()=>{
      state.level=parseFloat(fader.value);
      faderOut.textContent=Math.round(state.level*100)+"%";
      applyMixerChannelState(index);
    });

    faderWrap.append(faderLabel,fader,faderOut);

    const buttons=document.createElement("div");
    buttons.className="channel-buttons mixer-channel-buttons";

    const muteButton=document.createElement("button");
    muteButton.type="button";
    muteButton.className="channel-mute";
    muteButton.textContent="M";

    const soloButton=document.createElement("button");
    soloButton.type="button";
    soloButton.className="channel-solo";
    soloButton.textContent="S";

    muteButton.addEventListener("click",()=>{
      if(mixerChannelMuted.has(index))mixerChannelMuted.delete(index);
      else mixerChannelMuted.add(index);
      muteButton.classList.toggle("on",mixerChannelMuted.has(index));
      refreshAllMixerBusStates();
    });

    soloButton.addEventListener("click",()=>{
      if(mixerChannelSoloed.has(index))mixerChannelSoloed.delete(index);
      else mixerChannelSoloed.add(index);
      soloButton.classList.toggle("on",mixerChannelSoloed.has(index));
      refreshAllMixerBusStates();
    });

    buttons.append(muteButton,soloButton);
    strip.append(channelHead,knobStack,faderWrap,buttons);
    mixer.appendChild(strip);
  });

  refreshMixerAssignmentLabels();
}

buildAssignableMixer();
syncTrackButtons();
