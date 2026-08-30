function resizeOscVisualizer(){
  if(!oscVizCanvas||!oscVizCtx)return;

  const rect=
    oscVizCanvas.getBoundingClientRect();

  const ratio=
    Math.min(
      window.devicePixelRatio||1,
      2
    );

  const width=
    Math.max(
      240,
      Math.floor(rect.width*ratio)
    );

  const height=
    Math.max(
      150,
      Math.floor(rect.height*ratio)
    );

  if(
    oscVizCanvas.width!==width ||
    oscVizCanvas.height!==height
  ){
    oscVizCanvas.width=width;
    oscVizCanvas.height=height;
  }
}

let oscVizPhase=0;

function drawOscVisualizer(){
  if(!oscVizCanvas||!oscVizCtx)return;

  resizeOscVisualizer();

  const width=oscVizCanvas.width;
  const height=oscVizCanvas.height;
  const now=performance.now()*.001;

  oscVizCtx.clearRect(
    0,
    0,
    width,
    height
  );

  const bg=
    oscVizCtx.createLinearGradient(
      0,
      0,
      0,
      height
    );

  bg.addColorStop(
    0,
    "rgba(9,8,16,.96)"
  );

  bg.addColorStop(
    1,
    "rgba(4,4,8,.96)"
  );

  oscVizCtx.fillStyle=bg;
  oscVizCtx.fillRect(
    0,
    0,
    width,
    height
  );

  oscVizCtx.strokeStyle=
    "rgba(255,255,255,.055)";

  oscVizCtx.lineWidth=1;

  for(let i=1;i<8;i++){
    const x=
      width*(i/8);

    oscVizCtx.beginPath();
    oscVizCtx.moveTo(x,0);
    oscVizCtx.lineTo(x,height);
    oscVizCtx.stroke();
  }

  for(let i=1;i<5;i++){
    const y=
      height*(i/5);

    oscVizCtx.beginPath();
    oscVizCtx.moveTo(0,y);
    oscVizCtx.lineTo(width,y);
    oscVizCtx.stroke();
  }

  let hasLiveSignal=false;

  if(synthVisualizerAnalyser){
    if(
      !oscVizData ||
      oscVizData.length!==
        synthVisualizerAnalyser.fftSize
    ){
      oscVizData=
        new Uint8Array(
          synthVisualizerAnalyser.fftSize
        );
    }

    synthVisualizerAnalyser
      .getByteTimeDomainData(
        oscVizData
      );

    let peak=0;

    for(let i=0;i<oscVizData.length;i++){
      peak=
        Math.max(
          peak,
          Math.abs(
            oscVizData[i]-128
          )
        );
    }

    hasLiveSignal=peak>2;
  }

  const gradient=
    oscVizCtx.createLinearGradient(
      0,
      0,
      width,
      0
    );

  gradient.addColorStop(
    0,
    "rgba(113,73,255,.98)"
  );

  gradient.addColorStop(
    .5,
    "rgba(166,108,255,1)"
  );

  gradient.addColorStop(
    1,
    "rgba(255,66,208,.98)"
  );

  oscVizCtx.strokeStyle=gradient;
  oscVizCtx.lineWidth=
    Math.max(
      2,
      width/300
    );

  oscVizCtx.shadowBlur=16;
  oscVizCtx.shadowColor=
    "rgba(166,108,255,.55)";

  oscVizCtx.beginPath();

  if(hasLiveSignal){
    const slice=
      width/
      Math.max(
        1,
        oscVizData.length-1
      );

    for(
      let i=0;
      i<oscVizData.length;
      i++
    ){
      const normalized=
        (oscVizData[i]-128)/128;

      const x=i*slice;

      const y=
        height*.5+
        normalized*
        height*.42;

      if(i===0){
        oscVizCtx.moveTo(x,y);
      }else{
        oscVizCtx.lineTo(x,y);
      }
    }
  }else{
    oscVizPhase+=.035;

    const points=180;

    for(let i=0;i<points;i++){
      const t=i/(points-1);
      const x=t*width;

      const idle=
        Math.sin(
          t*Math.PI*5+
          now*1.7+
          oscVizPhase
        )*
        Math.sin(
          t*Math.PI
        );

      const secondary=
        Math.sin(
          t*Math.PI*11-
          now*.8
        )*.28;

      const y=
        height*.5+
        (
          idle+
          secondary
        )*
        height*.055;

      if(i===0){
        oscVizCtx.moveTo(x,y);
      }else{
        oscVizCtx.lineTo(x,y);
      }
    }
  }

  oscVizCtx.stroke();
  oscVizCtx.shadowBlur=0;

  oscVizCtx.fillStyle=
    hasLiveSignal
      ?"rgba(255,255,255,.68)"
      :"rgba(166,108,255,.42)";

  oscVizCtx.font=
    Math.max(
      10,
      Math.floor(width/35)
    )+
    "px Arial";

  oscVizCtx.fillText(
    hasLiveSignal
      ?"LIVE"
      :"READY",
    12,
    20
  );
}

function runOscVisualizer(){
  try{
    drawOscVisualizer();
  }catch(error){}
  requestAnimationFrame(
    runOscVisualizer
  );
}

runOscVisualizer();

window.addEventListener(
  "resize",
  resizeOscVisualizer
);

let pageBgFreqData=null;
let pageBgTimeData=null;
let pageBgBass=0;
let pageBgMid=0;
let pageBgHigh=0;
let pageBgEnergy=0;

function rangeAverage(data,start,end){
  const a=Math.max(0,Math.floor(start));
  const b=Math.min(data.length,Math.ceil(end));

  if(b<=a)return 0;

  let total=0;

  for(let i=a;i<b;i++){
    total+=data[i];
  }

  return total/((b-a)*255);
}

function updatePageReactiveBackground(){
  const glowA=document.querySelector(".glow-a");
  const glowB=document.querySelector(".glow-b");
  const grid=document.querySelector(".page-reactive-grid");
  const pulse=document.querySelector(".page-reactive-pulse");

  if(!glowA||!glowB||!grid||!pulse)return;

  if(!analyser||!audio){
    return;
  }

  if(
    !pageBgFreqData ||
    pageBgFreqData.length!==analyser.frequencyBinCount
  ){
    pageBgFreqData=
      new Uint8Array(analyser.frequencyBinCount);

    pageBgTimeData=
      new Uint8Array(analyser.fftSize);
  }

  analyser.getByteFrequencyData(pageBgFreqData);
  analyser.getByteTimeDomainData(pageBgTimeData);

  const hzPerBin=
    (audio.sampleRate/2)/
    pageBgFreqData.length;

  const bass=
    rangeAverage(
      pageBgFreqData,
      35/hzPerBin,
      180/hzPerBin
    );

  const mid=
    rangeAverage(
      pageBgFreqData,
      180/hzPerBin,
      2200/hzPerBin
    );

  const high=
    rangeAverage(
      pageBgFreqData,
      2200/hzPerBin,
      9000/hzPerBin
    );

  let rms=0;

  for(let i=0;i<pageBgTimeData.length;i++){
    const sample=
      (pageBgTimeData[i]-128)/128;

    rms+=sample*sample;
  }

  rms=
    Math.sqrt(
      rms/pageBgTimeData.length
    );

  const smooth=.84;

  pageBgBass=
    pageBgBass*smooth+
    bass*(1-smooth);

  pageBgMid=
    pageBgMid*smooth+
    mid*(1-smooth);

  pageBgHigh=
    pageBgHigh*smooth+
    high*(1-smooth);

  pageBgEnergy=
    pageBgEnergy*smooth+
    Math.min(1,rms*2.6)*
    (1-smooth);

  glowA.style.opacity=
    String(.10+pageBgMid*.48);

  glowA.style.transform=
    "scale("+
    (1+pageBgBass*.11)+
    ") translate3d("+
    (pageBgMid*9)+
    "px,"+
    (-pageBgBass*8)+
    "px,0)";

  glowA.style.filter=
    "blur("+
    (54+pageBgEnergy*38)+
    "px)";

  glowB.style.opacity=
    String(.07+pageBgHigh*.42);

  glowB.style.transform=
    "scale("+
    (1+pageBgHigh*.08)+
    ") translate3d("+
    (-pageBgMid*10)+
    "px,"+
    (pageBgBass*8)+
    "px,0)";

  glowB.style.filter=
    "blur("+
    (62+pageBgEnergy*42)+
    "px)";

  grid.style.opacity=
    String(.11+pageBgHigh*.22);

  grid.style.backgroundSize=
    (44+pageBgBass*8)+
    "px "+
    (44+pageBgBass*8)+
    "px";

  pulse.style.opacity=
    String(pageBgEnergy*.28);

  pulse.style.transform=
    "scale("+
    (.98+pageBgBass*.09)+
    ")";
}

const host=$("three");
let synthFieldCanvas=null;
let synthFieldCtx=null;
let synthFieldStars=[];
let synthFieldPhase=0;

function initSynthField(){
  if(!host)return;

  host.innerHTML="";

  synthFieldCanvas=
    document.createElement("canvas");

  synthFieldCanvas.className=
    "native-synth-field";

  synthFieldCanvas.setAttribute(
    "aria-hidden",
    "true"
  );

  host.appendChild(
    synthFieldCanvas
  );

  synthFieldCtx=
    synthFieldCanvas.getContext("2d");

  synthFieldStars=
    Array.from(
      {length:120},
      ()=>({
        x:Math.random(),
        y:Math.random(),
        s:.35+Math.random()*1.5,
        p:Math.random()*Math.PI*2
      })
    );

  resizeSynthField();
}

function resizeSynthField(){
  if(
    !synthFieldCanvas ||
    !synthFieldCtx ||
    !host
  ){
    return;
  }

  const rect=
    host.getBoundingClientRect();

  const ratio=
    Math.min(
      window.devicePixelRatio||1,
      2
    );

  synthFieldCanvas.width=
    Math.max(
      1,
      Math.floor(rect.width*ratio)
    );

  synthFieldCanvas.height=
    Math.max(
      1,
      Math.floor(rect.height*ratio)
    );

  synthFieldCanvas.style.width="100%";
  synthFieldCanvas.style.height="100%";
}

function drawSynthField(){
  if(
    !synthFieldCanvas ||
    !synthFieldCtx
  ){
    return;
  }

  const ctx=synthFieldCtx;
  const w=synthFieldCanvas.width;
  const h=synthFieldCanvas.height;

  ctx.clearRect(0,0,w,h);

  const bg=
    ctx.createLinearGradient(
      0,
      0,
      w,
      h
    );

  bg.addColorStop(
    0,
    "rgba(5,5,8,1)"
  );

  bg.addColorStop(
    .55,
    "rgba(12,8,24,1)"
  );

  bg.addColorStop(
    1,
    "rgba(7,5,13,1)"
  );

  ctx.fillStyle=bg;
  ctx.fillRect(0,0,w,h);

  let energy=0;
  let bassEnergy=0;

  if(analyser){
    const data=
      new Uint8Array(
        analyser.frequencyBinCount
      );

    analyser.getByteFrequencyData(data);

    let total=0;
    let bassTotal=0;
    const bassBins=
      Math.min(
        10,
        data.length
      );

    for(let i=0;i<data.length;i++){
      total+=data[i];
    }

    for(let i=0;i<bassBins;i++){
      bassTotal+=data[i];
    }

    energy=
      data.length
        ?total/(data.length*255)
        :0;

    bassEnergy=
      bassBins
        ?bassTotal/(bassBins*255)
        :0;
  }

  synthFieldPhase+=
    .006+
    energy*.012;

  const cx=w*.5;
  const cy=h*.5;

  synthFieldStars.forEach((star,index)=>{
    const twinkle=
      .28+
      .45*
      (
        .5+
        .5*
        Math.sin(
          synthFieldPhase*2+
          star.p+
          index*.07
        )
      );

    ctx.fillStyle=
      index%2
        ?"rgba(113,73,255,"+
          (twinkle*.48)+")"
        :"rgba(255,66,208,"+
          (twinkle*.40)+")";

    ctx.beginPath();
    ctx.arc(
      star.x*w,
      star.y*h,
      star.s*
      (1+energy*1.8),
      0,
      Math.PI*2
    );
    ctx.fill();
  });

  const ringCount=8;

  for(let i=0;i<ringCount;i++){
    const base=
      Math.min(w,h)*
      (
        .10+
        i*.045
      );

    const pulse=
      1+
      Math.sin(
        synthFieldPhase*2+
        i*.52
      )*.025+
      bassEnergy*.08;

    ctx.beginPath();
    ctx.ellipse(
      cx,
      cy,
      base*pulse*1.55,
      base*pulse*.72,
      Math.sin(
        synthFieldPhase*.45+
        i*.18
      )*.22,
      0,
      Math.PI*2
    );

    ctx.strokeStyle=
      i%2
        ?"rgba(113,73,255,"+
          (.12+energy*.24)+")"
        :"rgba(255,66,208,"+
          (.10+energy*.22)+")";

    ctx.lineWidth=
      Math.max(
        1,
        w/900
      );

    ctx.stroke();
  }

  const glow=
    ctx.createRadialGradient(
      cx,
      cy,
      0,
      cx,
      cy,
      Math.min(w,h)*.30
    );

  glow.addColorStop(
    0,
    "rgba(166,108,255,"+
    (.20+energy*.30)+")"
  );

  glow.addColorStop(
    .45,
    "rgba(113,73,255,"+
    (.08+energy*.12)+")"
  );

  glow.addColorStop(
    1,
    "rgba(5,5,8,0)"
  );

  ctx.fillStyle=glow;
  ctx.beginPath();
  ctx.arc(
    cx,
    cy,
    Math.min(w,h)*.30,
    0,
    Math.PI*2
  );
  ctx.fill();
}

function animate(){
  try{
    updatePageReactiveBackground();
  }catch(error){}

  try{
    drawSynthField();
  }catch(error){}

  requestAnimationFrame(animate);
}

initSynthField();

window.addEventListener(
  "resize",
  resizeSynthField
);

if(
  typeof ResizeObserver!=="undefined" &&
  host
){
  new ResizeObserver(
    resizeSynthField
  ).observe(host);
}

animate();
