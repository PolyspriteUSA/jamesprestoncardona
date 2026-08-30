function formatTapeTime(seconds){
  const safe=
    Math.max(
      0,
      Math.floor(
        Number.isFinite(seconds)
          ?seconds
          :0
      )
    );

  const minutes=
    Math.floor(safe/60);

  const secs=
    safe%60;

  return (
    String(minutes).padStart(2,"0")+
    ":"+
    String(secs).padStart(2,"0")
  );
}

function setTapeState(state,message){
  const deck=$("tapeDeck");
  if(!deck)return;

  deck.classList.toggle(
    "recording",
    state==="recording"
  );

  deck.classList.toggle(
    "playing",
    state==="playing"
  );

  $("tapeRecordBtn").classList.toggle(
    "active",
    state==="recording"
  );

  $("tapeStatus").textContent=
    message||state;
}

function stopTapeTimer(){
  if(tapeTimerId){
    clearInterval(tapeTimerId);
    tapeTimerId=null;
  }
}

function updateTapeButtons(){
  const hasTape=!!tapeUrl;

  $("tapePlayBtn").disabled=!hasTape;
  $("tapeDownloadBtn").disabled=!hasTape;
  $("tapeClearBtn").disabled=!hasTape;
}

function clearTapePlayback(){
  if(tapePlayer){
    try{
      tapePlayer.pause();
      tapePlayer.currentTime=0;
    }catch(error){}

    tapePlayer=null;
  }

  setTapeState(
    "ready",
    tapeUrl
      ?"Tape loaded"
      :"Ready"
  );
}

async function startTapeRecording(){
  ensureAudio();

  if(audio.state==="suspended"){
    await audio.resume();
  }

  if(!recordDestination){
    setTapeState(
      "ready",
      "Recorder unavailable"
    );
    return;
  }

  if(
    tapeRecorder&&
    tapeRecorder.state==="recording"
  ){
    return;
  }

  clearTapePlayback();

  const mimeTypes=[
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus"
  ];

  const mimeType=
    mimeTypes.find(
      type=>MediaRecorder.isTypeSupported(type)
    )||"";

  try{
    tapeRecorder=
      mimeType
        ?new MediaRecorder(
            recordDestination.stream,
            {mimeType}
          )
        :new MediaRecorder(
            recordDestination.stream
          );
  }catch(error){
    setTapeState(
      "ready",
      "Tape recording unsupported"
    );
    return;
  }

  tapeRecorderChunks=[];
  tapeRecordStart=performance.now();

  $("tapeTime").textContent="00:00";

  tapeRecorder.ondataavailable=event=>{
    if(event.data&&event.data.size){
      tapeRecorderChunks.push(
        event.data
      );
    }
  };

  tapeRecorder.onstop=()=>{
    stopTapeTimer();

    const duration=
      Math.max(
        0,
        (performance.now()-tapeRecordStart)/1000
      );

    if(tapeUrl){
      URL.revokeObjectURL(tapeUrl);
      tapeUrl="";
    }

    tapeBlob=
      new Blob(
        tapeRecorderChunks,
        {
          type:
            tapeRecorder.mimeType||
            "audio/webm"
        }
      );

    tapeUrl=
      URL.createObjectURL(tapeBlob);

    $("tapeTime").textContent=
      formatTapeTime(duration);

    setTapeState(
      "ready",
      "Session recorded"
    );

    updateTapeButtons();
  };

  tapeRecorder.start();
  setTapeState(
    "recording",
    "Recording session"
  );

  tapeTimerId=setInterval(()=>{
    const elapsed=
      (performance.now()-tapeRecordStart)/1000;

    $("tapeTime").textContent=
      formatTapeTime(elapsed);
  },250);
}

function stopTapeRecording(){
  if(
    tapeRecorder&&
    tapeRecorder.state==="recording"
  ){
    tapeRecorder.stop();
    return;
  }

  clearTapePlayback();
}

function playTapeRecording(){
  if(!tapeUrl)return;

  clearTapePlayback();

  tapePlayer=
    new Audio(tapeUrl);

  setTapeState(
    "playing",
    "Playing tape"
  );

  tapePlayer.addEventListener(
    "ended",
    ()=>{
      tapePlayer=null;
      setTapeState(
        "ready",
        "Tape loaded"
      );
    },
    {once:true}
  );

  tapePlayer.play().catch(()=>{
    tapePlayer=null;
    setTapeState(
      "ready",
      "Playback blocked"
    );
  });
}

function saveTapeRecording(){
  if(!tapeUrl||!tapeBlob)return;

  const link=
    document.createElement("a");

  const extension=
    tapeBlob.type.includes("ogg")
      ?"ogg"
      :"webm";

  link.href=tapeUrl;
  link.download=
    "neon-groovebox-session."+
    extension;

  document.body.appendChild(link);
  link.click();
  link.remove();
}

function clearTapeRecording(){
  if(
    tapeRecorder&&
    tapeRecorder.state==="recording"
  ){
    tapeRecorder.stop();
  }

  stopTapeTimer();
  clearTapePlayback();

  if(tapeUrl){
    URL.revokeObjectURL(tapeUrl);
    tapeUrl="";
  }

  tapeBlob=null;
  tapeRecorderChunks=[];

  $("tapeTime").textContent="00:00";

  setTapeState(
    "ready",
    "Ready"
  );

  updateTapeButtons();
}

$("tapeRecordBtn").addEventListener(
  "click",
  startTapeRecording
);

$("tapeStopBtn").addEventListener(
  "click",
  stopTapeRecording
);

$("tapePlayBtn").addEventListener(
  "click",
  playTapeRecording
);

$("tapeDownloadBtn").addEventListener(
  "click",
  saveTapeRecording
);

$("tapeClearBtn").addEventListener(
  "click",
  clearTapeRecording
);

updateTapeButtons();

function buildTimelineRuler(){
  const ruler=$("timelineRuler");
  ruler.innerHTML="";
  for(let i=0;i<16;i++){
    const mark=document.createElement("span");
    mark.textContent=i+1;
    ruler.appendChild(mark);
  }
}

function buildAudioChannelMixer(){
  const host=$("audioChannelMixer");
  host.innerHTML="";

  audioChannels.forEach((channel,index)=>{
    const strip=document.createElement("div");
    strip.className=
      "audio-channel-strip"+
      (channel.armed?" armed":"");

    const name=document.createElement("div");
    name.className="audio-channel-name";
    name.textContent=channel.name;

    const range=document.createElement("input");
    range.type="range";
    range.min=0;
    range.max=1;
    range.step=.01;
    range.value=channel.level;
    range.dataset.midiKey=
      "audio-mixer."+
      channelIndex;
    range.title=channel.name+" level";

    const controls=document.createElement("div");
    controls.className="audio-channel-controls";

    const arm=document.createElement("button");
    arm.className="arm"+(channel.armed?" on":"");
    arm.textContent="R";
    arm.title="Record arm";

    const mute=document.createElement("button");
    mute.className=channel.muted?"on":"";
    mute.textContent="M";
    mute.title="Mute";

    const solo=document.createElement("button");
    solo.className=channel.solo?"on":"";
    solo.textContent="S";
    solo.title="Solo";

    arm.addEventListener("click",()=>{
      audioChannels.forEach((item,i)=>{
        item.armed=i===index;
      });
      activeAudioChannel=index;
      buildAudioChannelMixer();
      renderAudioTimeline();
    });

    mute.addEventListener("click",()=>{
      channel.muted=!channel.muted;
      buildAudioChannelMixer();
    });

    solo.addEventListener("click",()=>{
      channel.solo=!channel.solo;
      buildAudioChannelMixer();
    });

    const levelOut=document.createElement("output");
    levelOut.className="audio-channel-level";
    levelOut.textContent=
      Math.round(channel.level*100)+"%";

    range.addEventListener("input",()=>{
      channel.level=parseFloat(range.value);
      levelOut.textContent=
        Math.round(channel.level*100)+"%";
    });

    controls.append(arm,mute,solo);
    strip.append(name,controls,range,levelOut);
    host.appendChild(strip);
  });
}

function getTimelineSeconds(){
  const totalWindow=16;

  const secondsPerBar=
    (60/(parseFloat($("bpm").value)||124))*4;

  return totalWindow*secondsPerBar;
}

function positionPercentFromDrop(row,event){
  const rect=row.getBoundingClientRect();

  if(rect.width<=0)return 0;

  return Math.max(
    0,
    Math.min(
      96,
      ((event.clientX-rect.left)/rect.width)*100
    )
  );
}

function addSampleClipToChannel(channelIndex,sample,startPercent=0){
  if(!sample)return;

  const duration=
    Number.isFinite(sample.duration)
      ?sample.duration
      :(sample.buffer
          ?sample.buffer.duration
          :1);

  audioChannels[channelIndex].clips.push({
    id:clipCounter++,
    name:sample.name,
    duration:Math.max(.05,duration||1),
    url:sample.url,
    startPercent,
    loop:false,
    sourceType:"sample",
    ownsUrl:false
  });

  renderAudioTimeline();

  setRecordingStatus(
    "Added "+
    sample.name+
    " to "+
    audioChannels[channelIndex].name
  );
}

function addDroppedAudioFile(channelIndex,file,startPercent=0){
  if(!file||!file.type.startsWith("audio/"))return;

  const url=URL.createObjectURL(file);
  const probe=new Audio(url);

  const clip={
    id:clipCounter++,
    name:file.name,
    duration:1,
    url,
    startPercent,
    loop:false,
    sourceType:"file",
    ownsUrl:true
  };

  audioChannels[channelIndex].clips.push(clip);
  renderAudioTimeline();

  probe.addEventListener(
    "loadedmetadata",
    ()=>{
      if(Number.isFinite(probe.duration)){
        clip.duration=Math.max(.05,probe.duration);
      }

      renderAudioTimeline();
    },
    {once:true}
  );

  setRecordingStatus(
    "Dropped "+
    file.name+
    " onto "+
    audioChannels[channelIndex].name
  );
}

function renderAudioTimeline(){
  const timeline=$("audioTimeline");
  timeline.innerHTML="";

  audioChannels.forEach((channel,index)=>{
    const row=document.createElement("div");
    row.className="audio-track-row";
    row.dataset.audioChannel=String(index);

    const label=document.createElement("div");
    label.className="audio-track-label";
    label.textContent=
      channel.name+
      (channel.armed?" • armed":"");

    row.appendChild(label);

    row.addEventListener("dragenter",event=>{
      event.preventDefault();
      row.classList.add("drag-over");
    });

    row.addEventListener("dragover",event=>{
      event.preventDefault();
      row.classList.add("drag-over");

      if(event.dataTransfer){
        event.dataTransfer.dropEffect="copy";
      }
    });

    row.addEventListener("dragleave",event=>{
      if(!row.contains(event.relatedTarget)){
        row.classList.remove("drag-over");
      }
    });

    row.addEventListener("drop",event=>{
      event.preventDefault();
      row.classList.remove("drag-over");

      const startPercent=
        positionPercentFromDrop(
          row,
          event
        );

      const sampleIdText=
        event.dataTransfer
          ?event.dataTransfer.getData(
              "application/x-groovebox-sample"
            )
          :"";

      const sampleId=
        parseInt(sampleIdText,10);

      if(Number.isFinite(sampleId)){
        addSampleClipToChannel(
          index,
          getSampleById(sampleId),
          startPercent
        );
        return;
      }

      const files=
        event.dataTransfer
          ?[...event.dataTransfer.files]
          :[];

      const audioFile=
        files.find(
          file=>file.type.startsWith("audio/")
        );

      if(audioFile){
        addDroppedAudioFile(
          index,
          audioFile,
          startPercent
        );
      }
    });

    channel.clips.forEach(clip=>{
      if(typeof clip.loop!=="boolean"){
        clip.loop=false;
      }

      if(!clip.sourceType){
        clip.sourceType="recorded";
      }

      const el=document.createElement("div");
      el.className=
        "audio-clip"+
        (clip.sourceType==="sample"
          ?" sample-clip"
          :"");

      const timelineSeconds=
        getTimelineSeconds();

      const width=
        Math.max(
          4,
          Math.min(
            100,
            (clip.duration/timelineSeconds)*100
          )
        );

      el.style.left=(clip.startPercent||0)+"%";
      el.style.width=width+"%";

      el.title=
        clip.name+
        " • "+
        clip.duration.toFixed(2)+
        " s"+
        (clip.loop?" • looping":"");

      const text=document.createElement("span");
      text.textContent=clip.name;

      const controls=
        document.createElement("div");

      controls.className=
        "audio-clip-controls";

      const loop=
        document.createElement("button");

      loop.type="button";
      loop.className=
        "audio-clip-loop"+
        (clip.loop?" on":"");

      loop.textContent="Loop";
      loop.title=
        clip.loop
          ?"Disable loop"
          :"Enable loop";

      loop.addEventListener("click",event=>{
        event.stopPropagation();
        clip.loop=!clip.loop;
        renderAudioTimeline();

        setRecordingStatus(
          clip.name+
          (clip.loop
            ?" loop enabled"
            :" loop disabled")
        );
      });

      controls.appendChild(loop);
      el.append(text,controls);

      el.addEventListener("click",event=>{
        if(
          event.target.closest(
            ".audio-clip-controls"
          )
        ){
          return;
        }

        playAudioClip(channel,clip);
      });

      row.appendChild(el);
    });

    timeline.appendChild(row);
  });
}

function renderRecords(){
  const host=$("recordsList");
  if(!host)return;

  host.innerHTML="";

  const records=[];

  audioChannels.forEach((channel,channelIndex)=>{
    channel.clips.forEach(clip=>{
      if(clip.sourceType==="recorded"){
        records.push({
          channel,
          channelIndex,
          clip
        });
      }
    });
  });

  if(records.length===0){
    const empty=document.createElement("div");
    empty.className="records-empty";
    empty.textContent="No recordings yet";
    host.appendChild(empty);
    return;
  }

  records.forEach(item=>{
    const row=document.createElement("div");
    row.className="record-item";

    const info=document.createElement("div");
    info.className="record-info";

    const name=document.createElement("div");
    name.className="record-name";
    name.textContent=item.clip.name;

    const meta=document.createElement("div");
    meta.className="record-meta";
    meta.textContent=
      item.channel.name+
      " • "+
      item.clip.duration.toFixed(2)+
      " s";

    const controls=document.createElement("div");
    controls.className="record-controls";

    const play=document.createElement("button");
    play.className="btn";
    play.type="button";
    play.textContent="Play";

    const add=document.createElement("button");
    add.className="btn";
    add.type="button";
    add.textContent="Add to Track";

    play.addEventListener("click",()=>{
      playAudioClip(
        item.channel,
        item.clip
      );
    });

    add.addEventListener("click",()=>{
      const targetIndex=
        audioChannels.findIndex(
          channel=>channel.armed
        );

      const destination=
        targetIndex>=0
          ?targetIndex
          :0;

      audioChannels[destination].clips.push({
        id:clipCounter++,
        name:item.clip.name+" Copy",
        duration:item.clip.duration,
        url:item.clip.url,
        startPercent:0,
        loop:false,
        sourceType:"recorded-copy",
        ownsUrl:false
      });

      renderAudioTimeline();

      setRecordingStatus(
        "Added "+
        item.clip.name+
        " to "+
        audioChannels[destination].name
      );
    });

    info.append(name,meta);
    controls.append(play,add);
    row.append(info,controls);
    host.appendChild(row);
  });
}

function setRecordingStatus(text,active=false){
  const status=$("recordingStatus");
  status.textContent=text;
  status.classList.toggle("active",active);
}

async function startAudioRecording(){
  ensureAudio();

  if(audio.state==="suspended"){
    await audio.resume();
  }

  if(!recordDestination){
    setRecordingStatus(
      "Recording output is unavailable"
    );
    return;
  }

  if(audioRecorder&&audioRecorder.state==="recording"){
    return;
  }

  const armedIndex=
    audioChannels.findIndex(channel=>channel.armed);

  activeAudioChannel=
    armedIndex>=0
      ?armedIndex
      :0;

  const mimeTypes=[
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus"
  ];

  const mimeType=
    mimeTypes.find(type=>MediaRecorder.isTypeSupported(type))||"";

  try{
    audioRecorder=
      mimeType
        ?new MediaRecorder(
            recordDestination.stream,
            {mimeType}
          )
        :new MediaRecorder(
            recordDestination.stream
          );
  }catch(error){
    setRecordingStatus(
      "Audio recording is not supported in this browser"
    );
    return;
  }

  audioRecorderChunks=[];
  audioRecordStart=performance.now();

  audioRecorder.ondataavailable=event=>{
    if(event.data&&event.data.size){
      audioRecorderChunks.push(event.data);
    }
  };

  audioRecorder.onstop=()=>{
    const duration=
      Math.max(
        .05,
        (performance.now()-audioRecordStart)/1000
      );

    const blob=
      new Blob(
        audioRecorderChunks,
        {type:audioRecorder.mimeType||"audio/webm"}
      );

    const url=URL.createObjectURL(blob);

    audioChannels[activeAudioChannel].clips.push({
      id:clipCounter,
      name:"Take "+clipCounter,
      duration,
      url,
      startPercent:0,
      loop:false,
      sourceType:"recorded",
      ownsUrl:true
    });

    clipCounter++;
    renderAudioTimeline();
    renderRecords();

    setRecordingStatus(
      "Recorded "+
      duration.toFixed(2)+
      " seconds to "+
      audioChannels[activeAudioChannel].name
    );
  };

  audioRecorder.start();

  $("audioRecordBtn").classList.add("active");

  setRecordingStatus(
    "Recording "+
    audioChannels[activeAudioChannel].name+
    "...",
    true
  );
}

function stopAudioRecording(){
  if(
    audioRecorder&&
    audioRecorder.state==="recording"
  ){
    audioRecorder.stop();
  }

  stopTimelinePlayback();

  $("audioRecordBtn").classList.remove("active");

  if(
    !audioRecorder ||
    audioRecorder.state!=="recording"
  ){
    setRecordingStatus(
      "Recorded audio playback stopped"
    );
  }
}

function channelCanPlay(channel){
  if(channel.muted)return false;

  const anySolo=
    audioChannels.some(item=>item.solo);

  if(anySolo&&!channel.solo)return false;

  return true;
}

function playAudioClip(channel,clip){
  if(!channelCanPlay(channel))return;

  const player=new Audio(clip.url);

  player.volume=
    Math.max(
      0,
      Math.min(1,channel.level)
    );

  player.loop=!!clip.loop;

  activeTimelinePlayers.add(player);

  const cleanup=()=>{
    activeTimelinePlayers.delete(player);
  };

  player.addEventListener(
    "ended",
    cleanup,
    {once:true}
  );

  player.play().catch(cleanup);
}

function stopTimelinePlayback(){
  activeTimelinePlayers.forEach(player=>{
    try{
      player.pause();
      player.currentTime=0;
    }catch(error){}
  });

  activeTimelinePlayers.clear();
}

function playAllAudioClips(){
  stopTimelinePlayback();

  const timelineMs=
    getTimelineSeconds()*1000;

  audioChannels.forEach(channel=>{
    if(!channelCanPlay(channel))return;

    channel.clips.forEach(clip=>{
      const delay=
        Math.max(
          0,
          ((clip.startPercent||0)/100)*
          timelineMs
        );

      setTimeout(()=>{
        playAudioClip(channel,clip);
      },delay);
    });
  });

  setRecordingStatus(
    "Playing recorded audio"+
    (
      audioChannels.some(
        channel=>
          channel.clips.some(
            clip=>clip.loop
          )
      )
        ?" • loops active"
        :""
    )
  );
}

function clearAudioRecordings(){
  stopTimelinePlayback();

  audioChannels.forEach(channel=>{
    channel.clips.forEach(clip=>{
      if(clip.ownsUrl){
        URL.revokeObjectURL(clip.url);
      }
    });

    channel.clips=[];
  });

  renderAudioTimeline();
  renderRecords();
  setRecordingStatus("Audio timeline cleared");
}


$("recordsClearBtn").addEventListener(
  "click",
  ()=>{
    audioChannels.forEach(channel=>{
      channel.clips=
        channel.clips.filter(
          clip=>clip.sourceType!=="recorded"
        );
    });

    stopTimelinePlayback();
    renderAudioTimeline();
    renderRecords();
    setRecordingStatus("Records cleared");
  }
);

renderRecords();

$("audioRecordBtn").addEventListener(
  "click",
  startAudioRecording
);

$("audioStopBtn").addEventListener(
  "click",
  stopAudioRecording
);

$("audioPlayBtn").addEventListener(
  "click",
  playAllAudioClips
);

$("audioClearBtn").addEventListener(
  "click",
  clearAudioRecordings
);

buildTimelineRuler();
buildAudioChannelMixer();
renderAudioTimeline();

const mixer=$("mixer");
