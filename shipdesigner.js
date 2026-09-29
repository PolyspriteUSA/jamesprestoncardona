import * as THREE from 'three';
import {DEFAULT,PRESETS,GROUPS,KEYS,VERSION,sanitizeDesign,encodeDesign,decodeDesign,readActive,buildShip,disposeShip} from './ship-models.js';

const $ = id=>document.getElementById(id);
const viewport=$('viewport');
let design={...DEFAULT},library=[],savedId=null,undo=[],redo=[],committed='',draftTimer=0,dirty=true,rebuildPending=true;
let storageWarning='';
try {
  const draft=localStorage.getItem(KEYS.draft);if(draft)design=decodeDesign(JSON.parse(draft));
} catch {storageWarning='Could not restore the draft. You can still design and export JSON.';}
try {
  const raw=localStorage.getItem(KEYS.library);
  if(raw){const doc=JSON.parse(raw);if(doc.version!==VERSION||!Array.isArray(doc.designs))throw new Error();library=doc.designs.slice(0,100).map(item=>({id:String(item.id),doc:encodeDesign(decodeDesign(item.doc))}));}
} catch {storageWarning='Saved designs could not be read. Export your work before closing this tab.';}
function status(message,error=false){$('status').textContent=message;$('status').dataset.error=String(error);}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{status('Browser storage is unavailable or full. Export JSON to keep this design.',true);return false;}}
function saveDraft(){clearTimeout(draftTimer);draftTimer=setTimeout(()=>write(KEYS.draft,encodeDesign(design)),250);}
function record(){const next=JSON.stringify(design);if(next!==committed){undo.push(committed);if(undo.length>60)undo.shift();redo=[];committed=next;}updateHistory();}
function updateHistory(){$('undo').disabled=!undo.length;$('redo').disabled=!redo.length;}
function format(key,value){return key==='dihedral'?`${value}°`:key==='engines'?String(value):Number(value.toFixed(2)).toString();}
function sync(){
  $('shipName').value=design.name;$('previewName').textContent=design.name;$('previewRole').textContent=design.role==='enemy'?'Enemy ship':'Player ship';
  document.querySelectorAll('[data-role]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.role===design.role)));
  for(const group of GROUPS)for(const [key,,kind] of group.controls){const input=$(`control-${key}`);if(kind==='boolean')input.checked=design[key];else input.value=design[key];const output=$(`value-${key}`);if(output)output.textContent=format(key,design[key]);}
  document.querySelectorAll('[data-preset]').forEach(b=>{const p=PRESETS[Number(b.dataset.preset)].design;b.setAttribute('aria-pressed',String(JSON.stringify(sanitizeDesign(p))===JSON.stringify(design)));});
  updateHistory();
}
function apply(next,message){design=sanitizeDesign(next);record();sync();rebuildPending=true;saveDraft();if(message)status(message);}

for(const [i,preset] of PRESETS.entries()){
  const button=document.createElement('button');button.type='button';button.className='preset';button.dataset.preset=i;
  const title=document.createElement('strong');title.textContent=preset.label;
  const caption=document.createElement('small');caption.textContent=preset.caption;
  button.append(title,caption);button.addEventListener('click',()=>{savedId=null;apply(preset.design,`${preset.label} loaded. Undo brings your previous design back.`);});$('presets').append(button);
}
for(const [index,group] of GROUPS.entries()){
  const section=document.createElement('details');section.className='section';section.open=index<2;
  const summary=document.createElement('summary');summary.textContent=group.name;
  const number=document.createElement('span');number.textContent=String(index+2).padStart(2,'0');summary.append(number);
  const content=document.createElement('div');content.className='section-content';
  for(const [key,labelText,min,max,step] of group.controls){
    const row=document.createElement('div');row.className='control'+(min==='color'?' color':min==='boolean'?' toggle':'');
    const label=document.createElement('label');label.htmlFor=`control-${key}`;label.textContent=labelText;
    const input=document.createElement('input');input.id=`control-${key}`;input.dataset.key=key;
    if(min==='color')input.type='color';else if(min==='boolean')input.type='checkbox';else {input.type='range';input.min=min;input.max=max;input.step=step;const output=document.createElement('output');output.id=`value-${key}`;output.htmlFor=input.id;label.append(output);}
    input.addEventListener('input',()=>{
      design[key]=min==='boolean'?input.checked:min==='color'?input.value:Number(input.value);
      const output=$(`value-${key}`);if(output)output.textContent=format(key,design[key]);
      rebuildPending=true;saveDraft();status('Draft updated. Save it to your hangar or take a test flight.');
      document.querySelectorAll('[data-preset]').forEach(b=>b.setAttribute('aria-pressed','false'));
    });
    input.addEventListener('change',record);row.append(label,input);content.append(row);
  }
  section.append(summary,content);$('controls').append(section);
}
committed=JSON.stringify(design);sync();
$('shipName').addEventListener('input',()=>{design.name=$('shipName').value.trim().slice(0,48)||'Untitled ship';$('previewName').textContent=design.name;saveDraft();});
$('shipName').addEventListener('change',()=>{record();sync();});
document.querySelectorAll('[data-role]').forEach(b=>b.addEventListener('click',()=>apply({...design,role:b.dataset.role},`Test flight will apply this design as the ${b.dataset.role} ship.`)));
$('undo').addEventListener('click',()=>{if(!undo.length)return;redo.push(JSON.stringify(design));design=JSON.parse(undo.pop());committed=JSON.stringify(design);sync();rebuildPending=true;saveDraft();status('Previous design restored.');});
$('redo').addEventListener('click',()=>{if(!redo.length)return;undo.push(JSON.stringify(design));design=JSON.parse(redo.pop());committed=JSON.stringify(design);sync();rebuildPending=true;saveDraft();status('Change restored.');});
function refreshLibrary(){
  const select=$('savedDesigns');select.replaceChildren(new Option('Choose a saved design',''));
  library.forEach(item=>select.add(new Option(`${item.doc.design.name} · ${item.doc.design.role}`,item.id)));
  if(savedId&&library.some(i=>i.id===savedId))select.value=savedId;
  $('savedCount').textContent=library.length;updateSavedButtons();
}
function updateSavedButtons(){const selected=!!$('savedDesigns').value;$('load').disabled=!selected;$('delete').disabled=!selected;$('delete').textContent='Delete';}
$('savedDesigns').addEventListener('change',updateSavedButtons);
$('save').addEventListener('click',()=>{
  record();const doc=encodeDesign(design),next=library.slice();
  const index=next.findIndex(item=>item.id===savedId&&item.doc.design.name===design.name);
  let id=savedId;
  if(index>=0)next[index]={id,doc};else {if(next.length>=100){status('Your hangar has 100 designs. Export or delete one before saving another.',true);return;}id=globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;next.push({id,doc});}
  if(write(KEYS.library,{version:VERSION,designs:next})){library=next;savedId=id;refreshLibrary();status(`Saved “${design.name}” in this browser.`);}
});
$('load').addEventListener('click',()=>{const item=library.find(i=>i.id===$('savedDesigns').value);if(item){savedId=item.id;apply(decodeDesign(item.doc),`Loaded “${item.doc.design.name}”.`);}});
let deleteReady='',deleteTimer;
$('delete').addEventListener('click',()=>{
  const id=$('savedDesigns').value;if(!id)return;
  if(deleteReady!==id){deleteReady=id;$('delete').textContent='Delete this design?';clearTimeout(deleteTimer);deleteTimer=setTimeout(()=>{deleteReady='';$('delete').textContent='Delete';},4000);return;}
  const next=library.filter(i=>i.id!==id);
  if(write(KEYS.library,{version:VERSION,designs:next})){library=next;if(savedId===id)savedId=null;deleteReady='';refreshLibrary();status('Saved copy deleted. Your current design is still in the editor.');}
});
function download(content,name,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
$('export').addEventListener('click',()=>{download(JSON.stringify(encodeDesign(design),null,2),`${design.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'ship'}-ship.json`,'application/json');status('JSON exported. Import it here to edit this design again.');});
$('import').addEventListener('click',()=>$('importFile').click());
$('importFile').addEventListener('change',async e=>{
  const file=e.target.files[0];if(!file)return;
  try{if(file.size>100000)throw new Error('That file is too large. Choose a Ship Designer JSON export.');const next=decodeDesign(JSON.parse(await file.text()));savedId=null;apply(next,`Imported “${next.name}”. Save it to add it to your hangar.`);}
  catch(error){status(error instanceof SyntaxError?'This file is not valid JSON. Choose a Ship Designer export.':error.message,true);}finally{e.target.value='';}
});
function refreshFleet(){try{const active=readActive(localStorage),names=[];for(const role of ['player','enemy'])if(active[role])names.push(`${role==='player'?'Player':'Enemy'}: ${active[role].name}`);$('fleetStatus').textContent=names.length?names.join(' · '):'Original ships are active.';}catch{$('fleetStatus').textContent='Fleet settings could not be read. Restore original ships to reset them.';}}
$('restore').addEventListener('click',()=>{try{localStorage.removeItem(KEYS.active);refreshFleet();status('Original ships restored for your next Neon Tunnel visit.');}catch{status('Browser storage is unavailable. Fleet settings could not be reset.',true);}});
$('testFlight').addEventListener('click',()=>{
  let active;try{active=readActive(localStorage);}catch{status('Fleet settings could not be read. Open Neon Tunnel fleet and restore original ships first.',true);return;}
  const payload={version:VERSION};for(const role of ['player','enemy'])if(active[role])payload[role]=encodeDesign(active[role]);payload[design.role]=encodeDesign(design);
  if(write(KEYS.active,payload)){write(KEYS.draft,encodeDesign(design));location.href='./neontunnel.html?designer=1';}
});
window.addEventListener('storage',e=>{if(e.key===KEYS.active)refreshFleet();});
refreshLibrary();refreshFleet();if(storageWarning)status(storageWarning,true);

// The procedural mesh is independent of the editor and also used by Neon Tunnel.
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(38,1,.05,100);
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}catch(error){
  $('loading').hidden=true;$('previewError').hidden=false;$('errorText').textContent='This browser could not start WebGL. Try enabling hardware acceleration or opening this page in another browser. Your saved designs and exports are still available.';
  throw error;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,window.matchMedia('(pointer: coarse)').matches?1.5:2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;viewport.append(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xf0e1ff,0x30213b,2.8));
const keyLight=new THREE.DirectionalLight(0xffe8fb,4);keyLight.position.set(-4,7,-5);scene.add(keyLight);
const rimLight=new THREE.DirectionalLight(0xb78aff,3);rimLight.position.set(4,2,4);scene.add(rimLight);
const fillLight=new THREE.DirectionalLight(0xe9d7ef,1.3);fillLight.position.set(1,-2,-3);scene.add(fillLight);
const grid=new THREE.GridHelper(24,32,0x88749a,0x65516d);grid.material.transparent=true;grid.material.opacity=.16;scene.add(grid);
let ship,theta=2.45,phi=1.08,zoom=.82,radius=3,autoRotate=false,previousTime=0,frame=0;
function rebuild(){
  const next=buildShip(design),box=new THREE.Box3().setFromObject(next),center=box.getCenter(new THREE.Vector3());
  next.position.sub(center);radius=box.getBoundingSphere(new THREE.Sphere()).radius;
  if(ship){scene.remove(ship);disposeShip(ship);}ship=next;scene.add(ship);grid.position.y=box.min.y-center.y-.18;rebuildPending=false;dirty=true;
}
function updateCamera(){
  const v=THREE.MathUtils.degToRad(camera.fov),h=2*Math.atan(Math.tan(v/2)*camera.aspect);
  const distance=radius/Math.sin(Math.min(v,h)/2)*1.18*zoom;
  camera.far=Math.max(100,distance+radius*3);camera.position.set(distance*Math.sin(phi)*Math.sin(theta),distance*Math.cos(phi),distance*Math.sin(phi)*Math.cos(theta));camera.lookAt(0,0,0);camera.updateProjectionMatrix();
}
function resize(){const w=Math.max(viewport.clientWidth,1),h=Math.max(viewport.clientHeight,1);camera.aspect=w/h;renderer.setSize(w,h,false);dirty=true;}
const observer=new ResizeObserver(resize);observer.observe(viewport);resize();
function viewSelected(name){document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===name)));}
function stopRotate(){autoRotate=false;$('rotate').setAttribute('aria-pressed','false');}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{
  const positions={perspective:[2.45,1.08],front:[Math.PI,Math.PI/2],side:[Math.PI/2,Math.PI/2],top:[Math.PI,.001]};[theta,phi]=positions[b.dataset.view];stopRotate();viewSelected(b.dataset.view);dirty=true;
}));
$('rotate').addEventListener('click',()=>{autoRotate=!autoRotate;$('rotate').setAttribute('aria-pressed',String(autoRotate));if(autoRotate)viewSelected('');dirty=true;});
$('fit').addEventListener('click',()=>{zoom=.82;dirty=true;});
const pointers=new Map();let pinch=0;
function pinchDistance(){const a=[...pointers.values()];return a.length===2?Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y):0;}
viewport.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;stopRotate();viewport.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});pinch=pinchDistance();});
viewport.addEventListener('pointermove',e=>{
  const old=pointers.get(e.pointerId);if(!old)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size===2){const distance=pinchDistance();if(pinch&&distance)zoom=THREE.MathUtils.clamp(zoom*pinch/distance,.6,2.5);pinch=distance;}
  else if(pointers.size===1){theta-=(e.clientX-old.x)*.007;phi=THREE.MathUtils.clamp(phi-(e.clientY-old.y)*.007,.001,Math.PI-.05);}
  viewSelected('');dirty=true;
});
for(const event of ['pointerup','pointercancel','lostpointercapture'])viewport.addEventListener(event,e=>{pointers.delete(e.pointerId);pinch=pinchDistance();});
viewport.addEventListener('wheel',e=>{e.preventDefault();zoom=THREE.MathUtils.clamp(zoom*Math.exp(e.deltaY*.001),.6,2.5);dirty=true;},{passive:false});
viewport.addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(e.key))return;e.preventDefault();stopRotate();
  if(e.key==='ArrowLeft')theta-=.12;if(e.key==='ArrowRight')theta+=.12;if(e.key==='ArrowUp')phi-=.12;if(e.key==='ArrowDown')phi+=.12;
  if(e.key==='+'||e.key==='=')zoom/=1.1;if(e.key==='-')zoom*=1.1;phi=THREE.MathUtils.clamp(phi,.001,Math.PI-.05);zoom=THREE.MathUtils.clamp(zoom,.6,2.5);viewSelected('');dirty=true;
});
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);$('previewError').hidden=false;$('errorText').textContent='The graphics connection was interrupted. Your draft is saved; reload to resume the preview.';write(KEYS.draft,encodeDesign(design));});
function animate(time){
  frame=requestAnimationFrame(animate);const dt=Math.min((time-previousTime)/1000||0,.05);previousTime=time;
  if(document.hidden)return;if(rebuildPending)rebuild();if(autoRotate){theta+=dt*.22;dirty=true;}
  if(dirty){updateCamera();renderer.render(scene,camera);dirty=false;}
}
window.addEventListener('pagehide',()=>{clearTimeout(draftTimer);write(KEYS.draft,encodeDesign(design));});
$('loading').hidden=true;frame=requestAnimationFrame(animate);
