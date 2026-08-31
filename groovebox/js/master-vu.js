(function(){
  let frame=0;
  let data=null;
  let smoothL=0;
  let smoothR=0;

  function clamp(v,min,max){
    return Math.max(min,Math.min(max,v));
  }

  function meterLoop(){
    frame=requestAnimationFrame(meterLoop);

    const left=document.getElementById("masterVuLeft");
    const right=document.getElementById("masterVuRight");
    const out=document.getElementById("masterVuDb");

    if(!left||!right||!out||typeof analyser==="undefined"||!analyser)return;

    if(!data||data.length!==analyser.fftSize){
      data=new Uint8Array(analyser.fftSize);
    }

    analyser.getByteTimeDomainData(data);

    let sum=0;
    let peak=0;
    for(let i=0;i<data.length;i++){
      const x=(data[i]-128)/128;
      sum+=x*x;
      peak=Math.max(peak,Math.abs(x));
    }

    const rms=Math.sqrt(sum/data.length);
    const db=rms>0?20*Math.log10(rms):-60;
    const peakDb=20*Math.log10(Math.max(peak,.0001));

    const body=clamp((db+48)/48,0,1);
    const transient=clamp((peakDb+48)/48,0,1);
    const targetL=clamp(body*.82+transient*.18,0,1);
    const targetR=clamp(body*.79+transient*.16,0,1);

    // Slightly damped analog-style needle response.
    smoothL+=(targetL-smoothL)*(targetL>smoothL?.30:.11);
    smoothR+=(targetR-smoothR)*(targetR>smoothR?.27:.10);

    const toAngle=v=>-48+(v*96);
    left.style.setProperty("--vu-angle",toAngle(smoothL).toFixed(2)+"deg");
    right.style.setProperty("--vu-angle",toAngle(smoothR).toFixed(2)+"deg");
    out.textContent=db<=-48?"−∞ dB":db.toFixed(1)+" dB";
  }

  meterLoop();
  window.addEventListener("pagehide",()=>cancelAnimationFrame(frame),{once:true});
})();
