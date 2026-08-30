function noiseBuffer(){
  ensureAudio();
  const b=audio.createBuffer(1,audio.sampleRate*.5,audio.sampleRate);
  const d=b.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  return b;
}
let noise=null;
function kick(t,v=.9){
  ensureAudio();
  const o=audio.createOscillator(),g=audio.createGain();
  o.type="sine";
  o.frequency.setValueAtTime(150,t);
  o.frequency.exponentialRampToValueAtTime(48,t+.16);
  g.gain.setValueAtTime(v,t);
  g.gain.exponentialRampToValueAtTime(.001,t+.36);
  o.connect(g);out(g);o.start(t);o.stop(t+.4);
}
function snare(t,v=.55){
  ensureAudio(); if(!noise)noise=noiseBuffer();
  const src=audio.createBufferSource(),g=audio.createGain(),hp=audio.createBiquadFilter();
  src.buffer=noise;hp.type="highpass";hp.frequency.value=1300;
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.17);
  src.connect(hp);hp.connect(g);out(g);src.start(t);src.stop(t+.2);
  const o=audio.createOscillator(),og=audio.createGain();
  o.type="triangle";o.frequency.value=180;og.gain.setValueAtTime(v*.35,t);og.gain.exponentialRampToValueAtTime(.001,t+.11);
  o.connect(og);out(og);o.start(t);o.stop(t+.13);
}
function hat(t,v=.3,open=false){
  ensureAudio(); if(!noise)noise=noiseBuffer();
  const src=audio.createBufferSource(),g=audio.createGain(),bp=audio.createBiquadFilter();
  src.buffer=noise;bp.type="highpass";bp.frequency.value=6200;
  const len=open?.34:.055;
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+len);
  src.connect(bp);bp.connect(g);out(g);src.start(t);src.stop(t+len+.02);
}
function perc(t,v=.25){
  ensureAudio();
  const o=audio.createOscillator(),g=audio.createGain();
  o.type="triangle";o.frequency.setValueAtTime(420,t);o.frequency.exponentialRampToValueAtTime(210,t+.08);
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.12);
  o.connect(g);out(g);o.start(t);o.stop(t+.14);
}
function bass(t,n=36,v=.45){
  ensureAudio();

  const o=audio.createOscillator();
  const g=audio.createGain();
  const bassFilter=audio.createBiquadFilter();
  const bassDrive=audio.createWaveShaper();

  o.type="sawtooth";
  o.frequency.value=midiToHz(n);

  const a=.01;
  const r=.22;

  bassFilter.type=
    $("bassFilterType").value;

  bassFilter.frequency.value=
    parseFloat(
      $("bassFilterCutoff").value
    );

  bassFilter.Q.value=
    parseFloat(
      $("bassFilterRes").value
    );

  bassDrive.curve=
    makeDriveCurve(
      parseFloat(
        $("bassFilterDrive").value
      )
    );

  bassDrive.oversample="2x";

  g.gain.setValueAtTime(.0001,t);

  g.gain.exponentialRampToValueAtTime(
    Math.max(.001,v),
    t+a
  );

  g.gain.exponentialRampToValueAtTime(
    .001,
    t+a+r
  );

  o.connect(g);
  g.connect(bassFilter);
  bassFilter.connect(bassDrive);
  out(bassDrive);

  o.start(t);
  o.stop(t+a+r+.03);
}
