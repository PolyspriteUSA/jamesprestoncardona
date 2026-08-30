function mixerChannelForType(type){
  const track=tracks.find(item=>item.type===type);
  return track
    ?Math.max(0,Math.min(MIXER_CHANNEL_COUNT-1,Number(track.mixerChannel)||0))
    :0;
}

function mixerChannelAudible(index){
  if(mixerChannelMuted.has(index))return false;
  if(mixerChannelSoloed.size>0&&!mixerChannelSoloed.has(index))return false;
  return true;
}

function makeMixerBus(index){
  const input=audio.createGain();

  const low=audio.createBiquadFilter();
  low.type="lowshelf";
  low.frequency.value=180;

  const mid=audio.createBiquadFilter();
  mid.type="peaking";
  mid.frequency.value=1000;
  mid.Q.value=.85;

  const high=audio.createBiquadFilter();
  high.type="highshelf";
  high.frequency.value=6500;

  const pan=audio.createStereoPanner();
  const fader=audio.createGain();

  input.connect(low);
  low.connect(mid);
  mid.connect(high);
  high.connect(pan);
  pan.connect(fader);
  fader.connect(filter);

  const bus={input,low,mid,high,pan,fader};
  mixerBuses[index]=bus;
  applyMixerChannelState(index);
  return bus;
}

function buildMixerBuses(){
  if(!audio||mixerBuses.length)return;
  for(let i=0;i<MIXER_CHANNEL_COUNT;i++)makeMixerBus(i);
}

function applyMixerChannelState(index){
  if(!audio)return;
  const state=mixerChannelState[index];
  const bus=mixerBuses[index];
  if(!state||!bus)return;

  const now=audio.currentTime;
  bus.low.gain.setTargetAtTime(state.low,now,.015);
  bus.mid.gain.setTargetAtTime(state.mid,now,.015);
  bus.high.gain.setTargetAtTime(state.high,now,.015);
  bus.pan.pan.setTargetAtTime(state.pan,now,.015);
  bus.fader.gain.setTargetAtTime(
    mixerChannelAudible(index)?state.level:0,
    now,
    .012
  );
}

function refreshAllMixerBusStates(){
  if(!audio)return;
  for(let i=0;i<MIXER_CHANNEL_COUNT;i++)applyMixerChannelState(i);
}

function routeToMixer(node,trackType){
  ensureAudio();
  buildMixerBuses();
  const index=mixerChannelForType(trackType||currentTrackType);
  const bus=mixerBuses[index];
  node.connect(bus?bus.input:filter);
}

function refreshMixerAssignmentLabels(){
  document.querySelectorAll("[data-mixer-channel-label]").forEach(label=>{
    const index=parseInt(label.dataset.mixerChannelLabel,10);
    const sources=tracks
      .filter(track=>mixerChannelForType(track.type)===index)
      .map(track=>track.name);
    label.textContent=sources.length?sources.join(" + "):"Unassigned";
  });
}
