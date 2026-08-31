(function(){
  let frame=0;
  let data=null;
  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
  function meterLoop(){
    frame=requestAnimationFrame(meterLoop);
    const left=document.getElementById('masterVuLeft');
    const right=document.getElementById('masterVuRight');
    const out=document.getElementById('masterVuDb');
    if(!left||!right||!out||typeof analyser==='undefined'||!analyser)return;
    if(!data||data.length!==analyser.fftSize)data=new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);
    let sum=0,peak=0;
    for(let i=0;i<data.length;i++){
      const x=(data[i]-128)/128;
      sum+=x*x;
      peak=Math.max(peak,Math.abs(x));
    }
    const rms=Math.sqrt(sum/data.length);
    const db=rms>0?20*Math.log10(rms):-60;
    const pct=clamp((db+48)/48,0,1);
    const peakDb=20*Math.log10(Math.max(peak,.0001));
    const peakPct=clamp((peakDb+48)/48,0,1);
    const leftPct=clamp(pct*.82+peakPct*.18,0,1);
    const rightPct=clamp(pct*.78+peakPct*.15,0,1);
    const toAngle=v=>-48+(v*96);
    left.style.height='44px';
    right.style.height='44px';
    left.style.transform=`translateX(-50%) rotate(${toAngle(leftPct).toFixed(2)}deg)`;
    right.style.transform=`translateX(-50%) rotate(${toAngle(rightPct).toFixed(2)}deg)`;
    out.textContent=db<=-48?'−∞ dB':db.toFixed(1)+' dB';
  }
  meterLoop();
  window.addEventListener('pagehide',()=>cancelAnimationFrame(frame),{once:true});
})();
