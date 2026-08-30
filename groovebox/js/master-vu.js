(function(){
  let frame=0;
  let data=null;
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
      const a=Math.abs(x);if(a>peak)peak=a;
    }
    const rms=Math.sqrt(sum/data.length);
    const db=rms>0?20*Math.log10(rms):-60;
    const pct=Math.max(0,Math.min(100,(db+54)/54*100));
    const peakPct=Math.max(pct,Math.max(0,Math.min(100,(20*Math.log10(Math.max(peak,.0001))+54)/54*100)));
    left.style.height=pct.toFixed(1)+'%';
    right.style.height=Math.max(0,Math.min(100,pct*.94+peakPct*.06)).toFixed(1)+'%';
    out.textContent=db<=-54?'−∞ dB':db.toFixed(1)+' dB';
  }
  meterLoop();
  window.addEventListener('pagehide',()=>cancelAnimationFrame(frame),{once:true});
})();
