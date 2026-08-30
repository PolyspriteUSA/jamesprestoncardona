function refreshSampleTrackSource(){
  const select=$("sampleTrackSource");
  if(!select)return;

  const previous=
    selectedSampleIndex;

  select.innerHTML="";

  if(sampleLibrary.length===0){
    const option=document.createElement("option");
    option.value="-1";
    option.textContent="No sample loaded";
    select.appendChild(option);
    selectedSampleIndex=-1;
    return;
  }

  sampleLibrary.forEach((sample,index)=>{
    const option=document.createElement("option");
    option.value=String(index);
    option.textContent=
      (index+1)+". "+sample.name;
    select.appendChild(option);
  });

  selectedSampleIndex=
    previous>=0&&previous<sampleLibrary.length
      ?previous
      :0;

  select.value=
    String(selectedSampleIndex);
}

function triggerSequencerSample(t,level=.7,step=0){
  if(!audio)return;

  const sampleId=
    getSampleStepSelections()[step];

  const sample=
    getSampleById(sampleId);

  if(!sample||!sample.buffer)return;

  const source=
    audio.createBufferSource();

  const gain=
    audio.createGain();

  source.buffer=sample.buffer;

  gain.gain.value=
    Math.max(
      0,
      Math.min(
        1,
        level*
        (Number.isFinite(sample.volume)
          ?sample.volume
          :1)
      )
    );

  source.connect(gain);
  out(gain);

  activeSequencerSampleSources.add(source);

  source.addEventListener(
    "ended",
    ()=>activeSequencerSampleSources.delete(source),
    {once:true}
  );

  source.start(t);
}

function formatSampleDuration(seconds){
  if(!Number.isFinite(seconds))return "--";
  const mins=Math.floor(seconds/60);
  const secs=Math.floor(seconds%60);
  return mins+":"+String(secs).padStart(2,"0");
}

function renderSampleSlots(){
  const host=$("sampleSlots");
  host.innerHTML="";
  refreshSampleTrackSource();

  if(sampleLibrary.length===0){
    const empty=document.createElement("div");
    empty.className="sample-empty";
    empty.textContent="No samples loaded";
    host.appendChild(empty);
    return;
  }

  sampleLibrary.forEach((sample,index)=>{
    const slot=document.createElement("div");
    slot.className="sample-slot";
    slot.draggable=true;
    slot.dataset.sampleId=String(sample.id);

    slot.addEventListener("dragstart",event=>{
      slot.classList.add("dragging");

      if(event.dataTransfer){
        event.dataTransfer.effectAllowed="copy";
        event.dataTransfer.setData(
          "application/x-groovebox-sample",
          String(sample.id)
        );
        event.dataTransfer.setData(
          "text/plain",
          sample.name
        );
      }
    });

    slot.addEventListener("dragend",()=>{
      slot.classList.remove("dragging");
    });

    const info=document.createElement("div");
    info.className="sample-info";

    const name=document.createElement("span");
    name.className="sample-name";
    name.textContent=sample.name;

    const meta=document.createElement("span");
    meta.className="sample-meta";
    meta.textContent=
      formatSampleDuration(sample.duration)+
      " • slot "+
      (index+1);

    info.append(name,meta);

    const controls=document.createElement("div");
    controls.className="sample-controls";

    const play=document.createElement("button");
    play.type="button";
    play.textContent="▶";
    play.title="Play sample";

    const volume=document.createElement("input");
    volume.className="sample-volume";
    volume.type="range";
    volume.min=0;
    volume.max=1;
    volume.step=.01;
    volume.value=sample.volume;

    const remove=document.createElement("button");
    remove.type="button";
    remove.textContent="×";
    remove.title="Remove sample";

    play.addEventListener("click",()=>{
      const audioEl=new Audio(sample.url);
      audioEl.volume=sample.volume;

      activeSamplePlayers.add(audioEl);
      play.classList.add("playing");

      const cleanup=()=>{
        activeSamplePlayers.delete(audioEl);
        play.classList.remove("playing");
      };

      audioEl.addEventListener("ended",cleanup,{once:true});
      audioEl.addEventListener("pause",()=>{
        if(audioEl.currentTime===0||audioEl.ended){
          cleanup();
        }
      },{once:true});

      audioEl.play().catch(()=>{
        cleanup();
      });
    });

    volume.addEventListener("input",()=>{
      sample.volume=parseFloat(volume.value);
    });

    remove.addEventListener("click",()=>{
      const removedId=sample.id;

      URL.revokeObjectURL(sample.url);
      sampleLibrary.splice(index,1);

      sampleStepSelections=
        sampleStepSelections.map(
          sequence=>
            sequence.map(
              sampleId=>
                sampleId===removedId
                  ?null
                  :sampleId
            )
        );

      if(sampleLibrary.length===0){
        selectedSampleIndex=-1;
      }else if(selectedSampleIndex>=sampleLibrary.length){
        selectedSampleIndex=sampleLibrary.length-1;
      }else if(index<selectedSampleIndex){
        selectedSampleIndex--;
      }

      renderSampleSlots();
      refreshSamplePadSelects();
    });

    controls.append(play,volume,remove);
    slot.append(info,controls);
    host.appendChild(slot);
  });

  refreshSamplePadSelects();
}

async function addSampleFiles(files){
  const list=[...files].filter(
    file=>file.type.startsWith("audio/")
  );

  if(list.length===0)return;

  ensureAudio();

  for(const file of list){
    const url=URL.createObjectURL(file);
    const probe=new Audio(url);

    const sample={
      id:sampleIdCounter++,
      name:file.name,
      url,
      duration:NaN,
      volume:.85,
      buffer:null
    };

    sampleLibrary.push(sample);

    probe.addEventListener(
      "loadedmetadata",
      ()=>{
        sample.duration=probe.duration;
        renderSampleSlots();
      },
      {once:true}
    );

    try{
      const bytes=
        await file.arrayBuffer();

      sample.buffer=
        await audio.decodeAudioData(
          bytes.slice(0)
        );
    }catch(error){
      sample.buffer=null;
    }
  }

  if(selectedSampleIndex<0&&sampleLibrary.length){
    selectedSampleIndex=0;
  }

  const firstSample=
    sampleLibrary[0];

  if(firstSample){
    const sampleTrack=
      tracks.find(
        track=>track.type==="sample"
      );

    if(sampleTrack){
      sampleStepSelections.forEach(
        (sequenceSelections,sequenceIndex)=>{
          const pattern=
            getTrackPattern(
              sampleTrack,
              sequenceIndex
            );

          sequenceSelections.forEach(
            (selection,step)=>{
              if(
                selection==null &&
                pattern[step]
              ){
                sequenceSelections[step]=
                  firstSample.id;
              }
            }
          );
        }
      );
    }
  }

  renderSampleSlots();
  refreshSamplePadSelects();
}

function stopAllSamples(){
  activeSamplePlayers.forEach(player=>{
    try{
      player.pause();
      player.currentTime=0;
    }catch(error){}
  });

  activeSequencerSampleSources.forEach(source=>{
    try{
      source.stop();
    }catch(error){}
  });

  activeSamplePlayers.clear();
  activeSequencerSampleSources.clear();
  renderSampleSlots();
}

$("sampleFiles").addEventListener("change",event=>{
  addSampleFiles(event.target.files);
  event.target.value="";
});

$("sampleTrackSource").addEventListener(
  "change",
  event=>{
    selectedSampleIndex=
      parseInt(
        event.target.value,
        10
      );

    if(!Number.isFinite(selectedSampleIndex)){
      selectedSampleIndex=-1;
    }
  }
);

$("sampleStopAll").addEventListener(
  "click",
  stopAllSamples
);

renderSampleSlots();

const audioChannels=[
  {name:"Audio 1",level:1,muted:false,solo:false,armed:true,clips:[]},
  {name:"Audio 2",level:1,muted:false,solo:false,armed:false,clips:[]},
  {name:"Audio 3",level:1,muted:false,solo:false,armed:false,clips:[]},
  {name:"Audio 4",level:1,muted:false,solo:false,armed:false,clips:[]}
];

let audioRecorder=null;
let audioRecorderChunks=[];
let audioRecordStart=0;
let activeAudioChannel=0;
let clipCounter=1;
const activeTimelinePlayers=new Set();

let tapeRecorder=null;
let tapeRecorderChunks=[];
let tapeRecordStart=0;
let tapeTimerId=null;
let tapeBlob=null;
let tapeUrl="";
let tapePlayer=null;
