import * as THREE from 'three';

export const VERSION = 1;
export const KEYS = Object.freeze({draft:'jpc.ship-designer.draft.v1',library:'jpc.ship-designer.library.v1',active:'jpc.ship-designer.active.v1'});
export const GROUPS = [
  {name:'Hull & cockpit',controls:[['length','Hull length',2.2,4.8,.05],['width','Hull width',.45,1.5,.05],['height','Hull depth',.15,.75,.025],['nose','Nose taper',.2,.65,.01],['cockpit','Cockpit size',.4,1.4,.05]]},
  {name:'Wings',controls:[['span','Wingspan',2,6,.05],['sweep','Wing sweep',-.65,1.1,.025],['chord','Wing depth',.4,1.7,.025],['dihedral','Wing angle',-20,35,1]]},
  {name:'Engines & details',controls:[['engines','Engine count',1,4,1],['spread','Engine spacing',.3,1.5,.025],['engineSize','Engine size',.12,.32,.01],['exhaust','Exhaust length',.15,1.5,.05],['finHeight','Fin height',.1,.85,.025],['fins','Tail fins','boolean'],['weapons','Weapon pods','boolean']]},
  {name:'Materials & color',controls:[['body','Hull color','color'],['armor','Armor color','color'],['glass','Cockpit color','color'],['accent','Light color','color'],['metalness','Metallic finish',0,1,.05],['roughness','Surface roughness',.15,.9,.05]]}
];
export const DEFAULT = Object.freeze({name:'Vesper',role:'enemy',length:3.3,width:.8,height:.36,nose:.42,cockpit:.85,span:4.5,sweep:.55,chord:1.1,dihedral:8,engines:2,spread:.85,engineSize:.22,exhaust:.75,finHeight:.5,fins:true,weapons:true,body:'#383440',armor:'#8b789f',glass:'#20152f',accent:'#ff38d1',metalness:.55,roughness:.4});
export const PRESETS = Object.freeze([
  {label:'Vesper',caption:'Enemy interceptor',design:{...DEFAULT}},
  {label:'Wraith',caption:'Enemy forward wing',design:{...DEFAULT,name:'Wraith',span:4.1,sweep:-.55,chord:.75,dihedral:-9,width:.6,engines:2,spread:1.15,finHeight:.7,armor:'#665084',accent:'#bd8bff'}},
  {label:'Manta',caption:'Enemy heavy fighter',design:{...DEFAULT,name:'Manta',length:2.8,width:1.3,height:.5,span:5.6,sweep:.2,chord:1.55,engines:4,spread:.6,engineSize:.19,fins:false,armor:'#69636e',accent:'#f188df'}},
  {label:'Specter',caption:'Player racer',design:{...DEFAULT,name:'Specter',role:'player',length:3.9,width:.65,height:.27,nose:.55,span:3.6,sweep:.95,chord:.7,dihedral:15,exhaust:1.1,body:'#29262f',armor:'#7752ae',accent:'#bd8bff'}}
]);
export function sanitizeDesign(value = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) value = {};
  const d = {...DEFAULT};
  d.name = typeof value.name === 'string' ? value.name.trim().slice(0,48) || 'Untitled ship' : DEFAULT.name;
  d.role = value.role === 'player' ? 'player' : 'enemy';
  for (const group of GROUPS) for (const [key,,min,max,step] of group.controls) {
    const v = value[key];
    if (min === 'boolean') { if(typeof v === 'boolean') d[key]=v; }
    else if (min === 'color') { if(typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)) d[key]=v; }
    else if (typeof v === 'number' && Number.isFinite(v)) d[key] = Math.round(THREE.MathUtils.clamp(v,min,max)/step)*step;
  }
  return d;
}
export function encodeDesign(design) { return {kind:'jpc-ship-design',version:VERSION,design:sanitizeDesign(design)}; }
export function decodeDesign(doc) {
  if (!doc || doc.kind!=='jpc-ship-design' || doc.version!==VERSION || !doc.design || typeof doc.design!=='object' || Array.isArray(doc.design) || !Number.isFinite(doc.design.length) || !Number.isFinite(doc.design.span)) throw new Error('Choose a Ship Designer JSON export (version 1).');
  return sanitizeDesign(doc.design);
}
export function readActive(storage) {
  const raw = storage.getItem(KEYS.active);
  if (!raw) return {};
  const doc = JSON.parse(raw);
  if (doc.version!==VERSION) throw new Error('Unsupported fleet version.');
  const active = {};
  for (const role of ['player','enemy']) if (doc[role]) active[role]=decodeDesign(doc[role]);
  return active;
}

// Every design faces -Z. The game rotates the enemy model toward the player.
export function buildShip(input) {
  const d = sanitizeDesign(input), ship = new THREE.Group();
  ship.name = d.name;
  const hull = new THREE.MeshStandardMaterial({color:d.body,metalness:d.metalness,roughness:d.roughness,emissive:d.body,emissiveIntensity:.22,flatShading:true});
  const armor = new THREE.MeshStandardMaterial({color:d.armor,metalness:d.metalness*.8,roughness:d.roughness,emissive:d.armor,emissiveIntensity:.13,flatShading:true});
  const glass = new THREE.MeshStandardMaterial({color:d.glass,metalness:.7,roughness:.18,emissive:d.accent,emissiveIntensity:.08});
  const light = new THREE.MeshBasicMaterial({color:d.accent,toneMapped:false});
  const flame = new THREE.MeshBasicMaterial({color:d.accent,transparent:true,opacity:.48,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,toneMapped:false});
  const rim = new THREE.LineBasicMaterial({color:d.accent,transparent:true,opacity:.44,toneMapped:false});
  const add = (geo,mat,x=0,y=0,z=0,parent=ship) => { const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);return m; };
  const ring = [[0,1],[.72,.7],[1,0],[.72,-.7],[0,-1],[-.72,-.7],[-1,0],[-.72,.7]];
  const sections = [[-d.length*.54,.035,.05],[-d.length*(.54-d.nose),.82,.86],[d.length*.18,1,1],[d.length*.4,.7,.78]];
  const vertices=[],indices=[];
  for (const [z,w,h] of sections) for(const [x,y] of ring) vertices.push(x*d.width*w*.5,y*d.height*h*.5,z);
  for(let s=0;s<sections.length-1;s++)for(let i=0;i<8;i++){const a=s*8+i,b=s*8+(i+1)%8,c=a+8,e=b+8;indices.push(a,c,b,b,c,e);}
  // End caps, oriented outwards.
  for(let i=1;i<7;i++){indices.push(0,i,i+1);indices.push(24,24+i+1,24+i);}
  const bodyGeo=new THREE.BufferGeometry();bodyGeo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));bodyGeo.setIndex(indices);bodyGeo.computeVertexNormals();
  add(bodyGeo,hull);
  function plate(points,thickness,mat,parent=ship) {
    const shape=new THREE.Shape();points.forEach(([x,z],i)=>i?shape.lineTo(x,z):shape.moveTo(x,z));shape.closePath();
    const geo=new THREE.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:false,steps:1});geo.rotateX(Math.PI/2);geo.translate(0,thickness/2,0);
    return add(geo,mat,0,0,0,parent);
  }
  const canopy=add(new THREE.SphereGeometry(1,16,10),glass,0,d.height*.47,-d.length*.16);
  canopy.scale.set(d.width*.35*d.cockpit,d.height*.55*d.cockpit,d.length*.16*d.cockpit);
  const spine=add(new THREE.BoxGeometry(d.width*.22,.035,d.length*.24),armor,0,d.height*.5,d.length*.23);
  for(const side of [-1,1]) {
    const root=d.width*.24, reach=Math.max(.4,d.span*.5-root);
    const points=[[0,-d.chord*.48],[reach,d.sweep-d.chord*.12],[reach*.86,d.sweep+d.chord*.28],[0,d.chord*.62]];
    const wingGroup=new THREE.Group();wingGroup.position.set(side*root,-d.height*.15,0);wingGroup.scale.x=side;wingGroup.rotation.z=side*THREE.MathUtils.degToRad(d.dihedral);ship.add(wingGroup);
    plate(points,.07,hull,wingGroup);
    const panel=plate(points.map(([x,z])=>[x*.78+.08,z*.75]),.018,armor,wingGroup);panel.position.y=.05;
    const lineGeo=new THREE.BufferGeometry().setFromPoints(points.map(([x,z])=>new THREE.Vector3(x,.065,z)).concat([new THREE.Vector3(points[0][0],.065,points[0][1])]));wingGroup.add(new THREE.Line(lineGeo,rim));
    if(d.weapons) {
      const x=reach*.66,z=d.sweep*.66;
      add(new THREE.BoxGeometry(.13,.12,.65),hull,x,-.07,z-.15,wingGroup);
      add(new THREE.BoxGeometry(.085,.045,.03),light,x,-.07,z-.49,wingGroup);
    }
    if(d.fins) {
      const fin=plate([[0,-.38],[d.finHeight,-.06],[d.finHeight*.72,.42],[0,.48]],.045,armor);
      fin.rotation.z=side*Math.PI/2;fin.position.set(side*d.width*.32,d.height*.28,d.length*.21);
      // Both fins extend upward, with a slight outward cant.
      if(side===1)fin.rotation.z=Math.PI/2-.2;else {fin.scale.x=-1;fin.rotation.z=-Math.PI/2+.2;}
    }
  }
  const engineGeo=new THREE.CylinderGeometry(d.engineSize*.92,d.engineSize, .62,12);engineGeo.rotateX(Math.PI/2);
  const coreGeo=new THREE.CircleGeometry(d.engineSize*.72,16);
  const plumeGeo=new THREE.ConeGeometry(d.engineSize*.67,d.exhaust,12,1,true);plumeGeo.rotateX(Math.PI/2);plumeGeo.translate(0,0,d.exhaust*.5);
  for(let i=0;i<d.engines;i++) {
    const x=(i-(d.engines-1)/2)*d.spread,z=d.length*.34;
    add(engineGeo,hull,x,-d.height*.1,z);
    const collar=add(new THREE.CylinderGeometry(d.engineSize*1.05,d.engineSize*1.05,.07,12),armor,x,-d.height*.1,z+.23);collar.rotation.x=Math.PI/2;
    add(coreGeo,light,x,-d.height*.1,z+.315);
    const plume=add(plumeGeo,flame,x,-d.height*.1,z+.33);plume.name='ship-exhaust';
  }
  ship.userData.color=new THREE.Color(d.accent).getHex();
  ship.userData.design=d;
  return ship;
}
export function disposeShip(ship) {
  const geometries=new Set(),materials=new Set();
  ship.traverse(part=>{if(part.geometry)geometries.add(part.geometry);if(part.material)for(const m of Array.isArray(part.material)?part.material:[part.material])materials.add(m);});
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
}
export function gameShip(design,role) {
  const root=new THREE.Group(),orientation=new THREE.Group(),model=buildShip(design);root.add(orientation);orientation.add(model);
  const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3());
  // Match the existing visual footprint and keep the game's collision balance.
  const scale=(role==='player'?2.8:1.8)/Math.max(size.x,size.z);
  model.scale.setScalar(scale);model.position.copy(box.getCenter(new THREE.Vector3())).multiplyScalar(-scale);
  if(role==='enemy'){orientation.rotation.y=Math.PI;root.traverse(p=>{if(p.name==='ship-exhaust')p.name='enemy-exhaust';});}
  root.userData.color=new THREE.Color(design.accent).getHex();
  return root;
}
