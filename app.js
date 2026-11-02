(()=>{
const $=s=>document.querySelector(s);
const mk=(tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e};
const newCanvas=(w,h=w)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
const NEON_BG='#0B0B1A', INK='#1E1C45';
/* Todas las láminas se trabajan en un cuadrado de N×N píxeles; los trazos se guardan en unidades 0–400 */
const N=1024, UPX=N/400, LINE_T=140;

/* ======================= catálogo ======================= */
const CATS=[['todos','Todos','#FFC93C'],['obras','Mis obras','#FF8FB8'],['mios','Mis dibujos','#FF9E7A'],['animales','Animales','#7ED9A8'],['vehiculos','Vehículos','#8EC5FF'],
  ['naturaleza','Naturaleza','#B8E07A'],['dulces','Dulces','#FFB3CF'],['halloween','Halloween','#FFA45C'],['letras','Letras y números','#C7B8FF']];
const CAT_COLOR=Object.fromEntries(CATS.map(c=>[c[0],c[2]]));
const NUMS=[null,['#7EC8F0','celeste'],['#FFD23F','amarillo'],['#6CC24A','verde'],['#FF8A3D','naranja'],['#E8424C','rojo'],['#9B6BD6','morado'],
  ['#8B5A3C','marrón'],['#FF8FB8','rosado'],['#2F6FD6','azul'],['#FFFFFF','blanco'],['#9AA0B4','gris'],['#34324A','negro']];
const COLORS=[['#E8424C','rojo'],['#FF6F59','coral'],['#FF8A3D','naranja'],['#FFD23F','amarillo'],['#FFF07A','limón'],['#B6E04A','lima'],
  ['#6CC24A','verde'],['#2E8B57','verde bosque'],['#2BB3A3','turquesa'],['#7EC8F0','celeste'],['#2F6FD6','azul'],['#26338C','azul marino'],
  ['#9B6BD6','morado'],['#D4B3F5','lila'],['#FF8FB8','rosado'],['#E0389A','fucsia'],['#F7C9A0','durazno'],['#8B5A3C','marrón'],['#FFFFFF','blanco'],['#34324A','negro']];
const NEON=[['#FF3EA5','rosa neón'],['#FF5E3A','coral neón'],['#FF9A1F','naranja neón'],['#FFF23A','amarillo neón'],['#B6FF3A','lima neón'],
  ['#3DFF7A','verde neón'],['#22E6FF','cian neón'],['#4D7CFF','azul neón'],['#B44DFF','violeta neón'],['#FFFFFF','blanco']];
const TOOL_NAMES={cubeta:'Cubeta',pincel:'Pinceles',brillo:'Brillo',arco:'Arcoíris',sello:'Sellos',goma:'Goma'};
const TOOLSET={colorear:['cubeta','pincel','brillo','arco','sello','goma'],libre:['pincel','brillo','arco','sello','goma'],neon:['pincel','brillo','arco','sello','goma']};
const TEX=[['solido','Sólido'],['brillo','Brillo'],['crayon','Crayón'],['rayas','Rayas']];
/* tipos de pincel, de la línea más fina a la más ancha; w = grosor de la muestra */
const BRUSHES=[['lapiz','Lápiz',8],['plumon','Plumón',20],['pincel','Pincel',18],['crayon','Crayón',18],['acuarela','Acuarela',20],['spray','Spray',22],['brocha','Brocha',22]];
/* pinceles que se pintan en una capa aparte y se mezclan con transparencia (la acuarela no se oscurece al repasar el mismo trazo) */
const BUF={acuarela:{a:.5,blur:.16}};
const SIZES=[2,5,10,18,30,48], DOTS=[4,7,11,16,22,30];
const STAMPS=[['estrella','Estrella'],['corazon','Corazón'],['flor','Flor'],['burbuja','Burbuja'],['luna','Luna'],['diamante','Diamante']];
const ID_RE=/^[a-z0-9-]{1,40}$/, HEX=/^#[0-9A-Fa-f]{6}$/;

/* formas para los sellos */
const f1=v=>Math.round(v*10)/10;
const C=(x,y,r)=>`M${f1(x-r)} ${f1(y)}a${r} ${r} 0 1 0 ${f1(2*r)} 0a${r} ${r} 0 1 0 ${f1(-2*r)} 0Z`;
const P=(...p)=>'M'+p.map(q=>f1(q[0])+' '+f1(q[1])).join('L')+'Z';
const ST=(cx,cy,r,k=.5)=>{const p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*k:r;p.push([cx+rr*Math.cos(a),cy+rr*Math.sin(a)])}return P(...p)};
const STAMP_PATHS={estrella:new Path2D(ST(0,0,50,.48)),corazon:new Path2D('M0 42C-62 0 -46 -48 0 -22C46 -48 62 0 0 42Z'),
  flor:new Path2D([0,1,2,3,4].map(i=>{const a=-Math.PI/2+i*2*Math.PI/5;return C(28*Math.cos(a),28*Math.sin(a),21)}).join('')),
  florC:new Path2D(C(0,0,17)),burbuja:new Path2D(C(0,0,44)),
  luna:new Path2D('M12 -44A44 44 0 1 0 44 14A34 34 0 1 1 12 -44Z'),diamante:new Path2D(P([0,-46],[40,-8],[0,46],[-40,-8]))};

const ICONS={
cubeta:`<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 12h15l-2 13a2 2 0 0 1-2 1.7h-7a2 2 0 0 1-2-1.7Z" fill="#fff" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><ellipse cx="13.5" cy="12" rx="7.5" ry="2.8" fill="var(--cur)" stroke="currentColor" stroke-width="2.2"/><path d="M21 12.5c3 .3 4.6 2.2 4.6 5v2.5" fill="none" stroke="var(--cur)" stroke-width="3.2" stroke-linecap="round"/><circle cx="25.6" cy="24.5" r="2.4" fill="var(--cur)" stroke="currentColor" stroke-width="1.6"/><path d="M8 11a5.5 5.5 0 0 1 11 0" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
pincel:`<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M27 4 15.5 16.5" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><path d="M27 4 15.5 16.5" stroke="#E9B872" stroke-width="2.4" stroke-linecap="round"/><path d="M13 15.5l3.5 3.5c-1.2 4.2-4.6 7.2-10.5 8 .8-5.9 3-9.6 7-11.5Z" fill="var(--cur)" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>`,
crayon:`<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M10 18 21 7l4 4-11 11Z" fill="var(--cur)" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M13.5 14.5 18 10l4 4-4.5 4.5Z" fill="#fff" fill-opacity=".8"/><path d="M10 18l4 4-8 3Z" fill="var(--cur)" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>`,
brillo:`<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M13 4c.9 6 2.8 8 8.5 9-5.7 1-7.6 3-8.5 9-.9-6-2.8-8-8.5-9 5.7-1 7.6-3 8.5-9Z" fill="var(--cur)" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M24 18c.5 3 1.4 4 4.2 4.5-2.8.5-3.7 1.5-4.2 4.5-.5-3-1.4-4-4.2-4.5 2.8-.5 3.7-1.5 4.2-4.5Z" fill="var(--cur)" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
arco:`<svg viewBox="0 0 32 32" fill="none" stroke-linecap="round" stroke-width="3.4" aria-hidden="true"><path d="M4 25a12 12 0 0 1 24 0" stroke="#E8424C"/><path d="M8.2 25a7.8 7.8 0 0 1 15.6 0" stroke="#FFC22E"/><path d="M12.4 25a3.6 3.6 0 0 1 7.2 0" stroke="#2F6FD6"/></svg>`,
sello:`<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3.5l3.6 7.6 8.3 1.1-6.1 5.8 1.5 8.2L16 22.3l-7.3 3.9 1.5-8.2-6.1-5.8 8.3-1.1Z" fill="var(--cur)" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>`,
goma:`<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 20.5 16.5 9l9 9L17 26.5h-6Z" fill="#FF9FBF" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M5 20.5l6 6h6l3.3-3.3-9-9Z" fill="#fff" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M15 26.5h12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
};
const STAMP_ICONS={
estrella:ICONS.sello,
corazon:`<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 27C4 19 3 10 9.5 7.5c3-1.2 5.3.4 6.5 2.5 1.2-2.1 3.5-3.7 6.5-2.5C29 10 28 19 16 27Z" fill="var(--cur)" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>`,
flor:`<svg viewBox="0 0 32 32" aria-hidden="true"><g fill="var(--cur)" stroke="currentColor" stroke-width="2"><circle cx="16" cy="8" r="5"/><circle cx="23.6" cy="13.5" r="5"/><circle cx="20.7" cy="22.5" r="5"/><circle cx="11.3" cy="22.5" r="5"/><circle cx="8.4" cy="13.5" r="5"/></g><circle cx="16" cy="16" r="4.2" fill="#FFD23F" stroke="currentColor" stroke-width="2"/></svg>`,
burbuja:`<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="11" fill="var(--cur)" stroke="currentColor" stroke-width="2.2"/><ellipse cx="12" cy="11.5" rx="3.4" ry="2" transform="rotate(-35 12 11.5)" fill="#fff" fill-opacity=".85"/></svg>`,
luna:`<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M19 4.5A11.5 11.5 0 1 0 27.5 21 9 9 0 1 1 19 4.5Z" fill="var(--cur)" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>`,
diamante:`<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 4l10 9.5L16 28 6 13.5Z" fill="var(--cur)" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M6 13.5h20" stroke="currentColor" stroke-width="1.6"/></svg>`,
};

/* lista de dibujos: se llena desde dibujos/dibujos.json y con los que agrega el usuario */
let DRAWINGS=[];
const byId=id=>DRAWINGS.find(d=>d.id===id);

/* ======================= estado guardado ======================= */
const KEY='pinta-y-brilla-v3';
let state={fills:{},strokes:{},done:{},nums:{},when:{}};
/* miniaturas: id del dibujo (coloreado), n~id (por números), libre y neon */
const THUMB_RE=/^(n~)?[a-z0-9-]{1,40}$/;
const ui={cat:'todos',tool:'cubeta',brush:'pincel',color:0,neon:6,size:2,tex:'solido',stamp:'estrella',clip:true,num:1,sound:true,music:false,compact:true,voice:''};
const PAINT_TOOLS=new Set(['brillo','arco','sello','goma',...BRUSHES.map(b=>b[0])]);
const TOOLS_OK=new Set(Object.keys(TOOL_NAMES)),BRUSH_OK=new Set(BRUSHES.map(b=>b[0]));
const TEX_OK=new Set(TEX.map(t=>t[0])),STAMP_OK=new Set(STAMPS.map(s=>s[0]));
const inRange=(v,a,b)=>typeof v==='number'&&Number.isFinite(v)&&v>=a&&v<=b;
const intIn=(v,a,b)=>Number.isInteger(v)&&v>=a&&v<b;
const keyOk=k=>k==='libre'||k==='neon'||(/^[cn]:/.test(k)&&ID_RE.test(k.slice(2)));
function cleanNums(v){
  if(!v||typeof v!=='object'||!Array.isArray(v.pal)||!Array.isArray(v.seeds))return null;
  const pal=v.pal.slice(0,24).filter(h=>typeof h==='string'&&HEX.test(h));if(pal.length<1||pal.length!==v.pal.length)return null;
  const seeds=v.seeds.slice(0,800).filter(s=>Array.isArray(s)&&inRange(s[0],0,1)&&inRange(s[1],0,1)&&intIn(s[2],1,pal.length+1)).map(s=>[s[0],s[1],s[2]]);
  return seeds.length?{pal,seeds}:null;
}
function cleanState(s){
  const out={fills:{},strokes:{},done:{},nums:{},when:{}};
  if(!s||typeof s!=='object')return out;
  if(s.fills&&typeof s.fills==='object')for(const [k,f] of Object.entries(s.fills)){
    if(!/^[cn]:/.test(k)||!keyOk(k)||!f||typeof f!=='object')continue;const o={};
    for(const [i,v] of Object.entries(f))if(/^\d{1,7}$/.test(i)&&v&&HEX.test(v.c)&&(!v.t||TEX_OK.has(v.t)))o[i]={c:v.c,t:v.t||'solido'};
    out.fills[k]=o;
  }
  if(s.strokes&&typeof s.strokes==='object')for(const [k,arr] of Object.entries(s.strokes)){
    if(!keyOk(k)||!Array.isArray(arr))continue;
    out.strokes[k]=arr.slice(-600).filter(st=>st&&PAINT_TOOLS.has(st.t)&&HEX.test(st.c)&&inRange(st.w,.5,100)&&Number.isInteger(st.r)&&st.r>=-1&&st.r<1e7
      &&Number.isInteger(st.seed)&&Array.isArray(st.pts)&&st.pts.length>0&&st.pts.length<5000
      &&st.pts.every(p=>Array.isArray(p)&&inRange(p[0],-50,450)&&inRange(p[1],-50,450)))
      .map(st=>{const o={t:st.t,c:st.c,w:st.w,r:st.r,seed:st.seed,pts:st.pts.map(p=>[p[0],p[1]])};
        if(st.t==='sello')o.k=STAMP_OK.has(st.k)?st.k:'estrella';if(st.g)o.g=1;return o});
  }
  if(s.done&&typeof s.done==='object')for(const k of Object.keys(s.done))if(ID_RE.test(k))out.done[k]=true;
  if(s.nums&&typeof s.nums==='object')for(const [k,v] of Object.entries(s.nums)){const c=ID_RE.test(k)&&cleanNums(v);if(c)out.nums[k]=c}
  if(s.when&&typeof s.when==='object')for(const [k,v] of Object.entries(s.when).slice(0,500))if(THUMB_RE.test(k)&&inRange(v,1,1e14))out.when[k]=v;
  return out;
}
function cleanUi(u){
  if(!u||typeof u!=='object')return;
  if(CATS.some(c=>c[0]===u.cat))ui.cat=u.cat;
  if(u.tool==='crayon'){ui.tool='pincel';ui.brush='crayon'}else if(TOOLS_OK.has(u.tool))ui.tool=u.tool;
  if(BRUSH_OK.has(u.brush))ui.brush=u.brush;
  if(intIn(u.color,0,COLORS.length))ui.color=u.color;
  if(intIn(u.neon,0,NEON.length))ui.neon=u.neon;
  if(intIn(u.size,0,SIZES.length))ui.size=u.size;
  if(TEX_OK.has(u.tex))ui.tex=u.tex;
  if(STAMP_OK.has(u.stamp))ui.stamp=u.stamp;
  if(typeof u.clip==='boolean')ui.clip=u.clip;
  if(typeof u.sound==='boolean')ui.sound=u.sound;
  if(typeof u.music==='boolean')ui.music=u.music;
  if(typeof u.compact==='boolean')ui.compact=u.compact;
  if(typeof u.voice==='string'&&u.voice.length<=300)ui.voice=u.voice;
}
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object'){state=cleanState(s.state);cleanUi(s.ui)}}catch(e){}
let saveT,saveWarned=false;
const save=()=>{clearTimeout(saveT);saveT=setTimeout(()=>{
  try{localStorage.setItem(KEY,JSON.stringify({state,ui}));saveWarned=false}
  catch(e){if(!saveWarned){saveWarned=true;toast('No queda espacio para guardar. Borra algún dibujo.')}}},500)};

/* IndexedDB: dibujos agregados por el usuario y miniaturas coloreadas */
const idb=(()=>{
  let p=null;
  const open=()=>p||(p=new Promise((res,rej)=>{try{const r=indexedDB.open('pinta-y-brilla',1);
    r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('imgs'))d.createObjectStore('imgs',{keyPath:'id'});if(!d.objectStoreNames.contains('thumbs'))d.createObjectStore('thumbs')};
    r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}catch(e){rej(e)}}));
  const run=(store,mode,fn)=>open().then(d=>new Promise((res,rej)=>{const t=d.transaction(store,mode),o=fn(t.objectStore(store));
    t.oncomplete=()=>res(o&&'result' in o?o.result:undefined);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error)}));
  return{
    all:s=>run(s,'readonly',st=>st.getAll()),
    entries:s=>open().then(d=>new Promise((res,rej)=>{const t=d.transaction(s,'readonly'),st=t.objectStore(s),k=st.getAllKeys(),v=st.getAll();
      t.oncomplete=()=>res(k.result.map((key,i)=>[key,v.result[i]]));t.onerror=()=>rej(t.error)})),
    put:(s,v,k)=>run(s,'readwrite',st=>k===undefined?st.put(v):st.put(v,k)),
    del:(s,k)=>run(s,'readwrite',st=>st.delete(k)),
  };
})();
const thumbs={};

const ed={on:false,mode:'colorear',d:null,R:null,token:0};
let dirtyWork=false; /* hubo cambios desde que se abrió: sube la obra al principio de Mis obras */
const history=[];
const pushHist=h=>{dirtyWork=true;history.push(h);if(history.length>200)history.shift()};
const key=()=>ed.mode==='colorear'?'c:'+ed.d.id:ed.mode==='numeros'?'n:'+ed.d.id:ed.mode;
const fillsOf=k=>state.fills[k]||(state.fills[k]={});
const strokesOf=k=>state.strokes[k]||(state.strokes[k]=[]);
const curColor=()=>ed.mode==='neon'?NEON[ui.neon][0]:COLORS[ui.color][0];

/* ======================= voz ======================= */
/* 1) Si existen audios grabados en voz/ (voz neuronal o voz real), se usan: suenan naturales.
   2) Si no, la mejor voz en español del dispositivo (prefiere las "naturales"/"neuronales"/"mejoradas" y las de Perú o Latinoamérica),
      o la que el usuario eligió en el menú. Tono normal: subirlo es lo que más la hace sonar robótica. */
/* Dentro de la app Android (Capacitor) el WebView no trae voz ni descargas: se usan los plugins nativos */
const CAP=window.Capacitor,NATIVE=!!(CAP&&CAP.isNativePlatform&&CAP.isNativePlatform());
const plug=n=>(NATIVE&&CAP.Plugins&&CAP.Plugins[n])||null;
const TTS=plug('TextToSpeech');
const norm=t=>String(t).trim().toLowerCase();
const CLIP_RE=/^[a-z0-9-]{1,80}\.(mp3|ogg|m4a|wav)$/;
let voices=[],voice=null,clips={},hasClips=false,curAudio=null,sayTok=0;
function scoreVoice(v){
  if(!/^es([-_]|$)/i.test(v.lang))return -999;const n=v.name;let s=0;
  if(/natural|neural|online|premium|enhanced|mejorad|siri/i.test(n))s+=50;
  if(/google/i.test(n))s+=30;
  if(/^es[-_]PE/i.test(v.lang))s+=12;else if(/^es[-_](419|MX|US|CO|AR|CL|EC|BO|VE)/i.test(v.lang))s+=8;else if(/^es[-_]ES/i.test(v.lang))s+=2;
  if(/compact|eloquence|espeak|grandma|grandpa|rocko|shelley|sandy|eddy|flo|reed/i.test(n))s-=40;
  if(/-network$/i.test(n))s+=25;  /* voces "en línea" de Google en Android: suenan más naturales */
  if(v.localService===false)s+=5;return s;
}
function setVoices(list){
  voices=list.map(v=>Object.assign({},v,{lang:String(v.lang||'').replace('_','-')})).filter(v=>scoreVoice(v)>=-40).sort((a,b)=>scoreVoice(b)-scoreVoice(a));
  voice=voices.find(v=>v.voiceURI===ui.voice)||voices[0]||null;
  if(!$('#voices').hidden)renderVoices();
}
function loadVoices(){
  if(TTS){TTS.getSupportedVoices().then(r=>setVoices(((r&&r.voices)||[]).map((v,i)=>Object.assign({},v,{_idx:i})))).catch(()=>setVoices([]));return}
  try{setVoices(speechSynthesis.getVoices())}catch(e){setVoices([])}
}
try{if(!TTS)speechSynthesis.onvoiceschanged=loadVoices}catch(e){}
loadVoices();
fetch('voz/voz.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(j=>{
  if(!j||!j.clips||typeof j.clips!=='object')return;
  for(const [t,f] of Object.entries(j.clips))if(typeof t==='string'&&t.length<=120&&typeof f==='string'&&CLIP_RE.test(f))clips[norm(t)]=f;
  hasClips=Object.keys(clips).length>0;
}).catch(()=>{});
const useClips=()=>hasClips&&(ui.voice===''||ui.voice==='grabada');
function stopVoice(){sayTok++;if(TTS)TTS.stop().catch(()=>{});else try{speechSynthesis.cancel()}catch(e){}if(curAudio){try{curAudio.pause()}catch(e){}curAudio=null}}
function speak(text){
  if(TTS){const o={text,lang:voice?voice.lang:'es-US',rate:.95,pitch:1,volume:1,category:'ambient'};if(voice&&voice._idx!=null)o.voice=voice._idx;TTS.speak(o).catch(()=>{});return}
  try{const u=new SpeechSynthesisUtterance(text);u.lang=voice?voice.lang:'es-419';if(voice)u.voice=voice;u.rate=.95;u.pitch=1;speechSynthesis.speak(u)}catch(e){}}
/* t puede ser un texto o una lista de partes (["3","rojo"]) que se dicen seguidas */
function say(t){
  if(!ui.sound||!t)return;const parts=(Array.isArray(t)?t:[t]).map(String);stopVoice();const tok=sayTok;
  if(useClips()&&parts.every(p=>clips[norm(p)])){
    let i=0;const next=()=>{if(tok!==sayTok||i>=parts.length)return;const a=new Audio('voz/'+clips[norm(parts[i++])]);curAudio=a;
      a.onended=next;a.onerror=next;a.play().catch(()=>{if(tok===sayTok)speak(parts.slice(i-1).join(', '))})};
    next();return;
  }
  speak(parts.join(', '));
}

/* ======================= texturas ======================= */
const rng=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const hash=s=>{let h=2166136261;for(const ch of s)h=Math.imul(h^ch.charCodeAt(0),16777619);return h};
function sparkle(x,cx,cy,s){x.beginPath();x.moveTo(cx,cy-s*2);x.quadraticCurveTo(cx,cy,cx+s*2,cy);x.quadraticCurveTo(cx,cy,cx,cy+s*2);
  x.quadraticCurveTo(cx,cy,cx-s*2,cy);x.quadraticCurveTo(cx,cy,cx,cy-s*2);x.fill()}
const texStore={};
function texCanvas(c,t){
  const k=c+t;if(texStore[k])return texStore[k];
  const n=48,cv=newCanvas(n*3),x=cv.getContext('2d');x.scale(3,3);const r=rng(hash(k));
  x.fillStyle=c;x.fillRect(0,0,n,n);
  if(t==='brillo'){for(let i=0;i<14;i++){x.fillStyle=i%3?'rgba(255,255,255,.92)':'rgba(255,236,150,.95)';sparkle(x,r()*n,r()*n,1+r()*2.4)}}
  if(t==='crayon'||t==='trazo'){
    x.globalCompositeOperation='destination-out';
    for(let i=0;i<(t==='trazo'?320:140);i++){x.fillStyle=`rgba(0,0,0,${.2+r()*.55})`;x.fillRect(r()*n,r()*n,.7+r()*1.6,.5+r()*.9)}
    x.globalCompositeOperation='source-over';
    for(let i=0;i<40;i++){x.strokeStyle='rgba(255,255,255,.22)';x.lineWidth=.6;const px=r()*n,py=r()*n;x.beginPath();x.moveTo(px,py);x.lineTo(px+4,py-4);x.stroke()}
  }
  if(t==='rayas'){x.strokeStyle='rgba(255,255,255,.45)';x.lineWidth=4;for(let i=-n;i<n*2;i+=12){x.beginPath();x.moveTo(i,0);x.lineTo(i+n,n);x.stroke()}}
  return texStore[k]=cv;
}
const patStore=new WeakMap();
function pat(x,id,make){let m=patStore.get(x);if(!m){m={};patStore.set(x,m)}
  if(!m[id]){const p=x.createPattern(make(),'repeat');try{p.setTransform(new DOMMatrix().scale(1/3))}catch(e){}m[id]=p}return m[id]}
function texPreview(c,t){const cv=newCanvas(40),x=cv.getContext('2d');x.drawImage(texCanvas(c,t),0,0,80,80,0,0,40,40);return cv.toDataURL()}
/* teselas de textura en píxeles de la lámina (48 unidades = 123 px), para la cubeta */
const TILE=128,tileStore={};
const hexRGB=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const pack=(r,g,b)=>((255<<24)|(b<<16)|(g<<8)|r)>>>0;
function tileFor(c,t){
  const k=c+t;if(tileStore[k])return tileStore[k];
  const cv=newCanvas(TILE),x=cv.getContext('2d',{willReadFrequently:true});x.fillStyle='#FFFFFF';x.fillRect(0,0,TILE,TILE);
  x.drawImage(texCanvas(c,t),0,0,TILE,TILE);
  return tileStore[k]=new Uint32Array(x.getImageData(0,0,TILE,TILE).data.buffer.slice(0));
}

/* ======================= preparar una lámina ======================= */
/* 1) se coloca la imagen en N×N sobre blanco; 2) píxeles oscuros = línea; 3) zonas claras conectadas = regiones;
   4) cada píxel de línea se asigna a la región más cercana, así el color llega hasta debajo de la línea y no quedan bordes blancos */
const loadImg=src=>new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=()=>rej(new Error('img'));im.src=src});
function prepare(im){
  const T=N*N,c=newCanvas(N),x=c.getContext('2d',{willReadFrequently:true});
  x.fillStyle='#FFFFFF';x.fillRect(0,0,N,N);
  const s=Math.min(N/im.naturalWidth,N/im.naturalHeight),w=im.naturalWidth*s,h=im.naturalHeight*s;
  x.imageSmoothingQuality='high';x.drawImage(im,(N-w)/2,(N-h)/2,w,h);
  const px=x.getImageData(0,0,N,N).data,lum=new Uint8Array(T);
  for(let i=0,j=0;i<T;i++,j+=4)lum[i]=(px[j]*299+px[j+1]*587+px[j+2]*114)/1000|0;
  /* regiones */
  const lab=new Int32Array(T).fill(-1),stack=new Int32Array(T);let k=0;const sizes=[];
  for(let i=0;i<T;i++){if(lum[i]<LINE_T||lab[i]>=0)continue;let sp=0,n=0;stack[sp++]=i;lab[i]=k;
    while(sp){const q=stack[--sp];n++;const qx=q%N;
      if(qx>0&&lab[q-1]<0&&lum[q-1]>=LINE_T){lab[q-1]=k;stack[sp++]=q-1}
      if(qx<N-1&&lab[q+1]<0&&lum[q+1]>=LINE_T){lab[q+1]=k;stack[sp++]=q+1}
      if(q>=N&&lab[q-N]<0&&lum[q-N]>=LINE_T){lab[q-N]=k;stack[sp++]=q-N}
      if(q<T-N&&lab[q+N]<0&&lum[q+N]>=LINE_T){lab[q+N]=k;stack[sp++]=q+N}}
    sizes.push(n);k++}
  /* las zonas diminutas (ruido) no se pintan solas: se unen a su vecina */
  const MIN=Math.round(T*.00006),remap=new Int32Array(k).fill(-1);let K=0;
  for(let i=0;i<k;i++)if(sizes[i]>=MIN)remap[i]=K++;
  for(let i=0;i<T;i++)if(lab[i]>=0)lab[i]=remap[lab[i]];
  /* dueño de cada píxel = región más cercana (BFS desde todas las regiones) */
  const own=K<32000?Int16Array.from(lab):Int32Array.from(lab),q=stack;let head=0,tail=0;
  for(let i=0;i<T;i++)if(own[i]>=0)q[tail++]=i;
  while(head<tail){const i=q[head++],o=own[i],ix=i%N;
    if(ix>0&&own[i-1]<0){own[i-1]=o;q[tail++]=i-1}
    if(ix<N-1&&own[i+1]<0){own[i+1]=o;q[tail++]=i+1}
    if(i>=N&&own[i-N]<0){own[i-N]=o;q[tail++]=i-N}
    if(i<T-N&&own[i+N]<0){own[i+N]=o;q[tail++]=i+N}}
  /* lista de píxeles por región (orden de conteo) y su caja */
  const off=new Int32Array(K+1),bb=new Int32Array(K*4);
  for(let r=0;r<K;r++){bb[r*4]=N;bb[r*4+1]=N;bb[r*4+2]=-1;bb[r*4+3]=-1}
  for(let i=0;i<T;i++){const o=own[i];if(o<0)continue;off[o+1]++;const ix=i%N,iy=(i/N)|0,b=o*4;
    if(ix<bb[b])bb[b]=ix;if(iy<bb[b+1])bb[b+1]=iy;if(ix>bb[b+2])bb[b+2]=ix;if(iy>bb[b+3])bb[b+3]=iy}
  for(let r=0;r<K;r++)off[r+1]+=off[r];
  const list=new Int32Array(off[K]),fillp=off.slice(0,K);
  for(let i=0;i<T;i++){const o=own[i];if(o>=0)list[fillp[o]++]=i}
  /* capa de línea: color tinta con transparencia según lo oscuro del píxel (conserva el suavizado) */
  const oc=newCanvas(N),ox=oc.getContext('2d'),oi=ox.createImageData(N,N),o32=new Uint32Array(oi.data.buffer);
  const [ir,ig,ib]=hexRGB(INK);
  for(let i=0;i<T;i++){const l=lum[i];if(l>=215)continue;const a=Math.min(255,((215-l)*255/165)|0);o32[i]=((a<<24)|(ib<<16)|(ig<<8)|ir)>>>0}
  ox.putImageData(oi,0,0);
  /* capa de relleno */
  const fc=newCanvas(N),fx2=fc.getContext('2d'),fimg=fx2.createImageData(N,N),f32=new Uint32Array(fimg.data.buffer);
  f32.fill(0xFFFFFFFF);fx2.putImageData(fimg,0,0);
  /* con menos de 32 000 zonas basta la mitad de memoria para las etiquetas */
  return{K,lab:K<32000?Int16Array.from(lab):lab,own,off,list,bb,line:oc,F:fc,Fx:fx2,fimg,f32,masks:new Map(),pos:null};
}
function regionAt(R,u){const x=Math.max(0,Math.min(N-1,Math.floor(u[0]*UPX))),y=Math.max(0,Math.min(N-1,Math.floor(u[1]*UPX)));return R.own[y*N+x]}
function paintRegion(R,id,v,put=true){
  if(id<0||id>=R.K)return;
  const f=R.f32,L=R.list,a=R.off[id],b=R.off[id+1];
  if(!v){for(let k=a;k<b;k++)f[L[k]]=0xFFFFFFFF}
  else if(!v.t||v.t==='solido'){const [r,g,bl]=hexRGB(v.c),val=pack(r,g,bl);for(let k=a;k<b;k++)f[L[k]]=val}
  else{const t=tileFor(v.c,v.t);for(let k=a;k<b;k++){const p=L[k];f[p]=t[(((p/N)|0)&127)*TILE+((p%N)&127)]}}
  if(put){const o=id*4;R.Fx.putImageData(R.fimg,0,0,R.bb[o],R.bb[o+1],R.bb[o+2]-R.bb[o]+1,R.bb[o+3]-R.bb[o+1]+1)}
}
function rebuildFills(){const R=ed.R;if(!R)return;R.f32.fill(0xFFFFFFFF);const f=state.fills[key()]||{};
  for(const i in f)paintRegion(R,+i,f[i],false);R.Fx.putImageData(R.fimg,0,0);R.fillKey=key()}
function maskFor(id){
  const R=ed.R;if(R.masks.has(id))return R.masks.get(id);
  const c=newCanvas(N),x=c.getContext('2d'),im=x.createImageData(N,N),m=new Uint32Array(im.data.buffer);
  for(let k=R.off[id];k<R.off[id+1];k++)m[R.list[k]]=0xFF000000;x.putImageData(im,0,0);
  R.masks.set(id,c);if(R.masks.size>8)R.masks.delete(R.masks.keys().next().value);return c;
}
/* punto más interior de cada región (para poner el número) en una rejilla de 4 px */
function positions(R){
  if(R.pos)return R.pos;
  const st=4,G=N/st,own=new Int32Array(G*G);
  for(let y=0;y<G;y++)for(let x=0;x<G;x++)own[y*G+x]=R.lab[(y*st+2)*N+x*st+2];
  const dist=new Float32Array(G*G),R2=Math.SQRT2;
  for(let y=0;y<G;y++)for(let x=0;x<G;x++){const k=y*G+x,o=own[k];
    dist[k]=(o<0||x===0||y===0||x===G-1||y===G-1||own[k-1]!==o||own[k+1]!==o||own[k-G]!==o||own[k+G]!==o)?0:1e9}
  for(let y=1;y<G-1;y++)for(let x=1;x<G-1;x++){const k=y*G+x;if(dist[k])dist[k]=Math.min(dist[k],dist[k-1]+1,dist[k-G]+1,dist[k-G-1]+R2,dist[k-G+1]+R2)}
  for(let y=G-2;y>0;y--)for(let x=G-2;x>0;x--){const k=y*G+x;if(dist[k])dist[k]=Math.min(dist[k],dist[k+1]+1,dist[k+G]+1,dist[k+G+1]+R2,dist[k+G-1]+R2)}
  const pos={};
  for(let k=0;k<G*G;k++){const o=own[k];if(o<0)continue;if(!pos[o]||dist[k]>pos[o].d)pos[o]={x:((k%G)*st+2)/UPX,y:(((k/G)|0)*st+2)/UPX,d:dist[k]}}
  for(const o in pos)pos[o].d=pos[o].d*st/UPX;
  for(let r=0;r<R.K;r++)if(!pos[r]){const p=R.list[(R.off[r]+R.off[r+1])>>1];if(p!==undefined)pos[r]={x:(p%N)/UPX,y:((p/N)|0)/UPX,d:2}}
  return R.pos=pos;
}

/* ======================= pintar por números ======================= */
const numsFor=d=>state.nums[d.id]||d.nums||null;
function palette(d){const n=numsFor(d);if(!n)return [];if(!n.pal)return NUMS;return [null,...n.pal.map(h=>[h,colorName(h)])]}
function colorName(h){const [r,g,b]=hexRGB(h);let best='color',bd=1e9;
  for(const [c,nm] of COLORS.concat(NUMS.slice(1))){const [r2,g2,b2]=hexRGB(c),dd=(r-r2)**2+(g-g2)**2+(b-b2)**2;if(dd<bd){bd=dd;best=nm}}return best}
function required(){
  const R=ed.R,d=ed.d;if(!R||!d)return new Map();const n=numsFor(d),sig=d.id+':'+(n?n.seeds.length+':'+(n.pal?n.pal.join(''):'std'):'none');
  if(R.reqFor===sig)return R.req;
  const m=new Map();
  if(n)for(const [sx,sy,num] of n.seeds){const x=Math.min(N-1,Math.floor(sx*N)),y=Math.min(N-1,Math.floor(sy*N));
    let id=R.lab[y*N+x];if(id<0)id=R.own[y*N+x];if(id>=0&&!m.has(id))m.set(id,num)}
  R.req=m;R.reqFor=sig;return m;
}
const numsList=()=>[...new Set(required().values())].sort((a,b)=>a-b);
const numDone=n=>{const f=fillsOf(key());for(const [id,v] of required())if(v===n&&!f[id])return false;return true};
const allDone=()=>{const f=fillsOf(key());for(const id of required().keys())if(!f[id])return false;return required().size>0};
function pickNum(){const ns=numsList();ui.num=ns.find(n=>!numDone(n))||ns[0]||1}
let flash={i:-1,t:0},hiKey='';
const H=newCanvas(N/2),Hx=H.getContext('2d'),Himg=Hx.createImageData(N/2,N/2),H32=new Uint32Array(Himg.data.buffer);
function buildHighlight(){
  const R=ed.R,f=fillsOf(key()),k=ed.d.id+':'+ui.num+':'+Object.keys(f).length;if(hiKey===k)return;hiKey=k;
  H32.fill(0);const val=((44<<24)|(54<<16)|(90<<8)|255)>>>0,h=N/2;
  for(const [id,n] of required()){if(n!==ui.num||f[id])continue;for(let j=R.off[id];j<R.off[id+1];j++){const p=R.list[j];H32[(((p/N)|0)>>1)*h+((p%N)>>1)]=val}}
  Hx.putImageData(Himg,0,0);
}

/* ======================= trazos ======================= */
function segLine(x,a,b){x.beginPath();x.moveTo(a[0],a[1]);x.lineTo(b[0]+(a===b?.01:0),b[1]);x.stroke()}
function drawStamp(x,s,S){
  const p=s.pts[0],sz=14+s.w*2.2,k=s.k||'estrella';
  x.save();x.translate(p[0],p[1]);x.rotate(((s.seed%50)-25)*Math.PI/180);x.scale(sz/50,sz/50);x.lineJoin='round';
  if(s.g){x.shadowColor=s.c;x.shadowBlur=s.w*1.3*S}
  x.fillStyle=s.c;x.fill(STAMP_PATHS[k]);x.shadowBlur=0;
  x.lineWidth=5;x.strokeStyle=s.g?'rgba(255,255,255,.85)':INK;x.stroke(STAMP_PATHS[k]);
  if(k==='flor'){x.fillStyle='#FFD23F';x.fill(STAMP_PATHS.florC);x.stroke(STAMP_PATHS.florC)}
  if(k==='burbuja'){x.fillStyle='rgba(255,255,255,.8)';x.beginPath();x.ellipse(-15,-16,11,6,-.6,0,Math.PI*2);x.fill()}
  x.restore();
}
function drawSeg(x,s,i){
  const S=x.canvas.width/400;x.setTransform(S,0,0,S,0,0);x.lineCap='round';x.lineJoin='round';
  if(s.t==='sello'){if(i===0)drawStamp(x,s,S);return}
  const b=s.pts[i],a=i?s.pts[i-1]:b;
  if(s.t==='goma'){x.globalCompositeOperation='destination-out';x.strokeStyle='#000';x.lineWidth=s.w;segLine(x,a,b);x.globalCompositeOperation='source-over';return}
  if(s.t==='spray'){
    /* puntitos al azar alrededor del trazo, siempre iguales al repetirlo (semilla fija) */
    const r=rng(s.seed*13+i*7919),Rr=s.w*.9,len=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.min(90,Math.round(5+s.w*.8+len*s.w*.07));
    x.fillStyle=s.c;if(s.g){x.shadowColor=s.c;x.shadowBlur=4*S}
    for(let k=0;k<n;k++){const t=r(),ang=r()*Math.PI*2,rad=Rr*Math.sqrt(r()),dr=Math.max(.35,s.w*.028)*(.6+r()*.8);
      x.beginPath();x.arc(a[0]+(b[0]-a[0])*t+Math.cos(ang)*rad,a[1]+(b[1]-a[1])*t+Math.sin(ang)*rad,dr,0,Math.PI*2);x.fill()}
    x.shadowBlur=0;return;
  }
  if(s.t==='plumon'){
    /* punta biselada a 45°: trazo ancho en una dirección y fino en la otra */
    const h=s.w*.5,nx=h*.7071,ny=-h*.7071;
    if(s.g){x.shadowColor=s.c;x.shadowBlur=s.w*1.2*S}
    x.fillStyle=x.strokeStyle=s.c;x.lineWidth=Math.max(.8,s.w*.1);
    x.beginPath();x.moveTo(a[0]+nx,a[1]+ny);x.lineTo(b[0]+nx,b[1]+ny);x.lineTo(b[0]-nx,b[1]-ny);x.lineTo(a[0]-nx,a[1]-ny);x.closePath();x.fill();x.stroke();
    x.shadowBlur=0;return;
  }
  if(s.t==='brocha'){
    /* brocha ancha con cerdas: base de color y vetas claras y oscuras paralelas al trazo */
    let dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy);if(l<.01){dx=1;dy=0;l=1}
    const nx=-dy/l,ny=dx/l,Wd=s.w*1.5,kb=9,[cr,cg,cb]=hexRGB(s.c);
    if(s.g){x.shadowColor=s.c;x.shadowBlur=s.w*1.2*S}
    /* cada cerda es una línea con un tono un poco más claro u oscuro; como repiten posición en cada tramo, forman vetas continuas */
    for(let j=0;j<kb;j++){const r=rng(s.seed+j*101),o=(j/(kb-1)-.5)*Wd*.86,m=(r()-.5)*.36,
      mix=v=>Math.round(m>0?v+(255-v)*m:v*(1+m));
      x.strokeStyle=`rgb(${mix(cr)},${mix(cg)},${mix(cb)})`;x.lineWidth=Wd/kb*(1.5+r()*.5);
      segLine(x,[a[0]+nx*o,a[1]+ny*o],[b[0]+nx*o,b[1]+ny*o])}
    x.shadowBlur=0;return;
  }
  const col=s.t==='arco'?`hsl(${(s.seed+i*5)%360} 92% ${s.g?62:56}%)`:s.c;
  if(s.g){x.shadowColor=col;x.shadowBlur=s.w*1.4*S}
  x.strokeStyle=(s.t==='crayon'||s.t==='lapiz')?pat(x,'cr'+col,()=>texCanvas(col,'trazo')):col;
  x.lineWidth=s.t==='crayon'?s.w*1.15:s.t==='lapiz'?Math.max(1,s.w*.55):s.t==='acuarela'?s.w*1.35:s.w;segLine(x,a,b);
  if(s.g){x.shadowBlur=0;x.strokeStyle='rgba(255,255,255,.8)';x.lineWidth=Math.max(1.2,s.w*.3);segLine(x,a,b)}
  if(s.t==='brillo'){
    const r=rng(s.seed*31+i*977),len=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.round(len/(s.w*.7)));
    for(let k=0;k<n;k++){if(r()>.55)continue;const t=r();
      x.fillStyle=r()<.7?'rgba(255,255,255,.95)':'#FFF3A6';
      sparkle(x,a[0]+(b[0]-a[0])*t+(r()-.5)*s.w*.9,a[1]+(b[1]-a[1])*t+(r()-.5)*s.w*.9,s.w*(.12+r()*.16))}
  }
}

/* capas en pantalla: L = trazos, T = trazo en curso, K = trazo recortado, B = copia de L */
const cv=$('#cv'),fx=$('#fx'),ctx=cv.getContext('2d');
const L=newCanvas(2),T=newCanvas(2),K=newCanvas(2),B=newCanvas(2);
const Lx=L.getContext('2d'),Tx=T.getContext('2d'),Kx=K.getContext('2d'),Bx=B.getContext('2d');
let dpr=Math.min(window.devicePixelRatio||1,2.5),layerKey='';
function clearCtx(x){x.setTransform(1,0,0,1,0,0);x.globalCompositeOperation='source-over';x.clearRect(0,0,x.canvas.width,x.canvas.height)}
const clipOf=s=>s.r>=0&&s.t!=='goma'&&!!ed.R&&s.r<ed.R.K;
const needsBuf=s=>clipOf(s)||!!BUF[s.t];
/* pasa el trazo de T a L: recortado a su zona si va "sin salirse" y con transparencia si es acuarela (el desenfoque solo al terminar, para no frenar el dibujo) */
function compositeK(s,final){
  Kx.setTransform(1,0,0,1,0,0);Kx.globalCompositeOperation='copy';Kx.drawImage(T,0,0);
  if(clipOf(s)){Kx.globalCompositeOperation='destination-in';Kx.drawImage(maskFor(s.r),0,0,K.width,K.height)}
  Kx.globalCompositeOperation='source-over';
  const b=BUF[s.t];Lx.save();Lx.setTransform(1,0,0,1,0,0);
  if(b){Lx.globalAlpha=b.a;if(final&&'filter' in Lx)Lx.filter=`blur(${Math.max(.6,s.w*b.blur*L.width/400).toFixed(1)}px)`}
  Lx.drawImage(K,0,0);Lx.restore();
}
function restoreB(){Lx.setTransform(1,0,0,1,0,0);Lx.globalCompositeOperation='copy';Lx.drawImage(B,0,0);Lx.globalCompositeOperation='source-over'}
function replay(s){
  if(needsBuf(s)){clearCtx(Tx);s.pts.forEach((_,i)=>drawSeg(Tx,s,i));compositeK(s,true)}
  else s.pts.forEach((_,i)=>drawSeg(Lx,s,i));
}
function rebuildLayer(){clearCtx(Lx);(state.strokes[key()]||[]).forEach(replay);layerKey=key()+':'+L.width}

/* ---------- render ---------- */
let rq=0,active=null,clipDirty=false;
const req=()=>{if(!rq)rq=requestAnimationFrame(()=>{rq=0;render()})};
function render(){
  if(!ed.on||cv.width<4)return;
  const px=cv.width,S=px/400,x=ctx;
  x.setTransform(1,0,0,1,0,0);x.globalCompositeOperation='source-over';x.shadowBlur=0;x.imageSmoothingQuality='high';
  if(ed.mode==='libre'||ed.mode==='neon'){
    if(active&&active.buf&&clipDirty){clipDirty=false;restoreB();compositeK(active.s,false)}
    else if(!active&&layerKey!==key()+':'+L.width)rebuildLayer();
    x.setTransform(S,0,0,S,0,0);x.fillStyle=ed.mode==='neon'?NEON_BG:'#FFFFFF';x.fillRect(0,0,400,400);
    if(ed.mode==='neon'){x.fillStyle='rgba(255,255,255,.07)';for(let i=10;i<400;i+=20)for(let j=10;j<400;j+=20)x.fillRect(i-1,j-1,2,2)}
    x.setTransform(1,0,0,1,0,0);x.drawImage(L,0,0);return;
  }
  const R=ed.R;if(!R){x.fillStyle='#FFFFFF';x.fillRect(0,0,px,px);return}
  if(R.fillKey!==key())rebuildFills();
  if(active&&active.buf&&clipDirty){clipDirty=false;restoreB();compositeK(active.s,false)}
  else if(!active&&ed.mode==='colorear'&&layerKey!==key()+':'+L.width)rebuildLayer();
  x.drawImage(R.F,0,0,px,px);
  if(ed.mode==='colorear')x.drawImage(L,0,0);
  if(ed.mode==='numeros'){buildHighlight();x.drawImage(H,0,0,px,px)}
  x.drawImage(R.line,0,0,px,px);
  if(ed.mode==='numeros'){
    const pos=positions(R),f=fillsOf(key()),now=performance.now();x.setTransform(S,0,0,S,0,0);x.textAlign='center';x.textBaseline='middle';x.lineJoin='round';
    for(const [id,n] of required()){if(f[id])continue;const l=pos[id];if(!l)continue;
      const sel=n===ui.num,fl=flash.i===id&&now<flash.t,fs=Math.max(8,Math.min(18,l.d*.95));
      x.font=`${sel?900:800} ${sel?fs+2:fs}px Nunito, system-ui, sans-serif`;
      x.lineWidth=3;x.strokeStyle='rgba(255,255,255,.9)';x.strokeText(String(n),l.x,l.y+1);
      x.fillStyle=fl?'#E8424C':sel?'#E5482A':'#7C82AE';x.fillText(String(n),l.x,l.y+1)}
  }
}

/* ======================= galería ======================= */
const grid=$('#grid'),catsEl=$('#cats');
CATS.forEach(([id,name,col])=>{const b=mk('button','cat'),dot=mk('i');dot.style.background=col;b.append(dot,name);b.setAttribute('role','tab');b.dataset.cat=id;
  b.onclick=()=>{ui.cat=id;renderGrid();save()};catsEl.append(b)});
let loadState='loading';
function renderGrid(){
  [...catsEl.children].forEach(b=>b.setAttribute('aria-selected',b.dataset.cat===ui.cat));
  grid.innerHTML='';
  if(ui.cat==='obras'){renderObras();return}
  if(ui.cat==='todos'||ui.cat==='mios'){
    const a=mk('div','card add'),b=mk('button','open');
    b.append(mk('span','plus','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>'),
      mk('span','nm','Agregar dibujo'),mk('small',null,'PNG o JPG de líneas negras sobre blanco'));
    b.onclick=()=>$('#filein').click();a.append(b);grid.append(a);
  }
  if(loadState==='loading'&&ui.cat!=='mios'){for(let i=0;i<5;i++)grid.append(mk('div','skel'));return}
  const list=DRAWINGS.filter(d=>ui.cat==='todos'||d.cat===ui.cat);
  list.forEach(d=>{
    const card=mk('div','card'),b=mk('button','open');b.setAttribute('aria-label','Colorear '+d.name);
    const tape=mk('span','tape');tape.style.background=CAT_COLOR[d.cat]||'#C7B8FF';
    const im=mk('img','thumb');im.alt='';im.decoding='async';im.loading='lazy';im.src=thumbs[d.id]||d.src;
    const nm=mk('span','nm');nm.textContent=d.name;
    b.append(im,nm);b.onclick=()=>openEditor('colorear',d);card.append(tape,b);
    if(state.done[d.id])card.append(mk('span','badge','★'));
    if(isLocked(d)){card.classList.add('locked');card.append(mk('span','lockb',LOCK_SVG));b.setAttribute('aria-label',d.name+', bloqueado');b.onclick=askUnlock}
    if(d.custom){const del=mk('button','del','✕');del.setAttribute('aria-label','Quitar '+d.name);let t;
      del.onclick=e=>{e.stopPropagation();if(!del.classList.contains('armed')){del.classList.add('armed');del.textContent='¿Quitar?';
        t=setTimeout(()=>{del.classList.remove('armed');del.textContent='✕'},2600);return}clearTimeout(t);removeCustom(d)};
      card.append(del)}
    grid.append(card);
  });
  if(loadState==='error'&&ui.cat!=='mios'){
    const s=mk('div','state'),p=mk('p');p.textContent='No se pudieron cargar los dibujos. Revisa la conexión y vuelve a intentar.';
    const r=mk('button','act');r.textContent='Reintentar';r.onclick=()=>{loadState='loading';renderGrid();loadCatalog()};s.append(p,r);grid.append(s);
  }else if(!list.length){const s=mk('div','state'),p=mk('p');
    p.textContent=ui.cat==='mios'?'Aún no agregaste dibujos. Toca "Agregar dibujo" y elige una imagen de líneas negras sobre fondo blanco.':'No hay dibujos en esta categoría.';
    s.append(p);grid.append(s)}
}
/* Mis obras: lo último que pintó, primero */
const FREE={libre:'Dibujo libre',neon:'Pizarra neón'};
function renderObras(){
  const items=Object.entries(state.when).filter(([id])=>thumbs[id]).sort((a,b)=>b[1]-a[1]).map(([id])=>{
    if(FREE[id])return{id,name:FREE[id],open:()=>openEditor(id,null)};
    const num=id.startsWith('n~'),d=byId(num?id.slice(2):id);if(!d)return null;
    return{id,name:d.name,sub:num?'Por números':'',done:state.done[d.id],open:()=>openEditor(num?'numeros':'colorear',d)}}).filter(Boolean);
  items.forEach(o=>{
    const card=mk('div','card'),b=mk('button','open');b.setAttribute('aria-label','Seguir pintando '+o.name);
    const im=mk('img','thumb');im.alt='';im.decoding='async';im.src=thumbs[o.id];
    const nm=mk('span','nm');nm.textContent=o.sub?o.name+' · '+o.sub:o.name;
    b.append(im,nm);b.onclick=o.open;card.append(b);if(o.done)card.append(mk('span','badge','★'));grid.append(card)});
  if(!items.length){
    if(loadState==='loading'&&Object.keys(state.when).length){for(let i=0;i<3;i++)grid.append(mk('div','skel'));return}
    const s=mk('div','state'),p=mk('p');p.textContent='Aquí se guardan los dibujos que pintes. Elige uno y empieza.';s.append(p);grid.append(s)}
}
$('#go-libre').onclick=()=>openEditor('libre',null);
$('#go-neon').onclick=()=>openEditor('neon',null);

async function loadCatalog(){
  try{
    const r=await fetch('dibujos/dibujos.json',{cache:'no-cache'});if(!r.ok)throw new Error(r.status);
    const j=await r.json();const out=[];const stdPal=NUMS.slice(1).map(c=>c[0]);
    for(const e of (Array.isArray(j&&j.dibujos)?j.dibujos:[])){
      if(!e||!ID_RE.test(e.id)||typeof e.name!=='string'||!/^[a-z0-9-]{1,40}\.png$/.test(e.file)||!CAT_COLOR[e.cat]||['todos','mios','obras'].includes(e.cat))continue;
      /* las láminas incluidas numeran con la paleta fija NUMS (pal:null) */
      const n=cleanNums({pal:stdPal,seeds:Array.isArray(e.numeros)?e.numeros:[]});if(n)n.pal=null;
      out.push({id:e.id,name:e.name.slice(0,40),say:typeof e.say==='string'?e.say.slice(0,60):null,cat:e.cat,src:'dibujos/'+e.file,nums:n,premium:e.pack==='premium'});
    }
    DRAWINGS=out.concat(DRAWINGS.filter(d=>d.custom));loadState='ok';
  }catch(e){loadState='error'}
  renderGrid();if(puz.on&&!puz.d)renderPuzList();
}
async function loadCustom(){
  try{
    const recs=await idb.all('imgs');
    for(const r of recs.sort((a,b)=>a.created-b.created)){if(!r||!ID_RE.test(r.id)||!(r.blob instanceof Blob)||byId(r.id))continue;
      const nm=String(r.name||'').slice(0,30),n=DRAWINGS.filter(d=>d.custom).length+1;  /* nombres viejos que eran solo números */
      DRAWINGS.push({id:r.id,name:/\p{L}{2,}/u.test(nm)?nm:'Mi dibujo '+n,cat:'mios',src:URL.createObjectURL(r.blob),custom:true,nums:null})}
    for(const [k,v] of await idb.entries('thumbs'))if(THUMB_RE.test(k)&&typeof v==='string'&&v.startsWith('data:image/'))thumbs[k]=v;
  }catch(e){}
  renderGrid();
}

/* ======================= agregar dibujos propios ======================= */
const OK_TYPES=new Set(['image/png','image/jpeg','image/webp']);
/* nombre del dibujo agregado: se quitan números y nombres automáticos de cámara o capturas (IMG_2024…, 224971.jpg);
   si no queda una palabra, se llama "Mi dibujo 1", "Mi dibujo 2"… */
const cleanName=n=>{
  let t=n.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').replace(/[^\p{L}\p{N} ]/gu,' ')
    .replace(/\b(img|image|imagen|dsc|dcim|pxl|screenshot|captura|de pantalla|whatsapp|wa|photo|foto|picsart|pinterest|download|descarga|copia|copy|at)\b/gi,' ')
    .replace(/\b[\p{N}]+\b/gu,' ').replace(/\s+/g,' ').trim().slice(0,28);
  if(!/\p{L}{2,}/u.test(t)){const k=DRAWINGS.filter(d=>d.custom).length+1;t='Mi dibujo '+k}
  return t.charAt(0).toUpperCase()+t.slice(1);
};
$('#filein').addEventListener('change',async e=>{
  const f=e.target.files&&e.target.files[0];e.target.value='';if(!f)return;
  if(!OK_TYPES.has(f.type)){toast('Usa una imagen PNG, JPG o WebP');return}
  if(f.size>10*1024*1024){toast('La imagen pesa más de 10 MB');return}
  const url=URL.createObjectURL(f);let im;
  try{im=await loadImg(url)}catch(err){URL.revokeObjectURL(url);toast('Esa imagen no se pudo abrir');return}
  URL.revokeObjectURL(url);
  if(im.naturalWidth<200||im.naturalHeight<200){toast('La imagen es muy pequeña (mínimo 200 px)');return}
  /* imágenes gigantes (más de 8000 px) pueden colgar un celular de gama baja */
  if(im.naturalWidth>8000||im.naturalHeight>8000){toast('La imagen es demasiado grande (máximo 8000 px)');return}
  if(im.naturalWidth>8000||im.naturalHeight>8000){toast('La imagen es demasiado grande');return}
  /* limpieza: escala de grises con niveles ajustados, para que el gris de un JPG se vuelva blanco */
  const c=newCanvas(N),x=c.getContext('2d',{willReadFrequently:true});x.fillStyle='#FFFFFF';x.fillRect(0,0,N,N);
  const s=Math.min(N/im.naturalWidth,N/im.naturalHeight),w=im.naturalWidth*s,h=im.naturalHeight*s;
  x.imageSmoothingQuality='high';x.drawImage(im,(N-w)/2,(N-h)/2,w,h);
  const data=x.getImageData(0,0,N,N),p=data.data,TT=N*N,hist=new Uint32Array(256);
  for(let j=0;j<p.length;j+=4){const l=(p[j]*299+p[j+1]*587+p[j+2]*114)/1000|0;p[j]=l;hist[l]++}
  const pct=q=>{let acc=0;for(let v=0;v<256;v++){acc+=hist[v];if(acc>=TT*q)return v}return 255};
  const lo=pct(.01),hi=Math.max(pct(.55),lo+1);
  if(hi-lo<40){toast('Esa imagen no parece un dibujo para colorear');return}
  let dark=0;
  for(let j=0;j<p.length;j+=4){let v=Math.round((p[j]-lo)*255/(hi-lo));v=v<0?0:v>255?255:v;if(v>232)v=255;p[j]=p[j+1]=p[j+2]=v;p[j+3]=255;if(v<LINE_T)dark++}
  if(dark/TT>.45){toast('Tiene demasiadas partes oscuras. Usa líneas negras sobre fondo blanco.');return}
  x.putImageData(data,0,0);
  const blob=await new Promise(r=>c.toBlob(r,'image/png'));if(!blob){toast('No se pudo guardar la imagen');return}
  const rec={id:'u-'+Date.now().toString(36)+Math.floor(Math.random()*1296).toString(36),name:cleanName(f.name),blob,created:Date.now()};
  let stored=true;try{await idb.put('imgs',rec)}catch(err){stored=false}
  const d={id:rec.id,name:rec.name,cat:'mios',src:URL.createObjectURL(blob),custom:true,nums:null};
  DRAWINGS.push(d);ui.cat='mios';save();
  if(!stored)toast('Se agregó, pero no se podrá guardar al cerrar');
  openEditor('colorear',d);
});
async function removeCustom(d){
  DRAWINGS=DRAWINGS.filter(x=>x.id!==d.id);prepCache.delete(d.id);
  ['c:','n:'].forEach(p=>{delete state.fills[p+d.id];delete state.strokes[p+d.id]});delete state.nums[d.id];delete state.done[d.id];delete thumbs[d.id];delete thumbs['n~'+d.id];delete state.when[d.id];delete state.when['n~'+d.id];
  try{URL.revokeObjectURL(d.src)}catch(e){}
  try{await idb.del('imgs',d.id);await idb.del('thumbs',d.id);await idb.del('thumbs','n~'+d.id)}catch(e){}
  save();renderGrid();toast('Dibujo quitado');
}

/* ======================= editor ======================= */
const panel=$('#panel'),prepCache=new Map();
/* láminas preparadas que se guardan en memoria: 1 en equipos de 2 GB o menos */
const PREP_MAX=(navigator.deviceMemory||4)<=2?1:2;
async function getPrepared(d){
  if(prepCache.has(d.id)){const R=prepCache.get(d.id);prepCache.delete(d.id);prepCache.set(d.id,R);return R}
  const im=await loadImg(d.src);const R=prepare(im);prepCache.set(d.id,R);
  if(prepCache.size>PREP_MAX)prepCache.delete(prepCache.keys().next().value);return R;
}
async function openEditor(mode,d){
  if(d&&isLocked(d)){askUnlock();return}
  const tok=++ed.token;
  ed.on=true;ed.mode=mode;ed.d=d;ed.R=null;dirtyWork=false;zoom.s=1;zoom.x=zoom.y=0;zoom.pinch=null;applyZoom();active=null;layerKey='';hiKey='';disarm();
  $('#home').hidden=true;$('#editor').hidden=false;
  if(mode!=='numeros'&&!TOOLSET[mode].includes(ui.tool))ui.tool=TOOLSET[mode][0];
  refreshEditor();resize();
  say(mode==='neon'?'Pizarra neón':mode==='libre'?'Dibujo libre':(d.say||d.name));
  if(d){
    $('#busy').hidden=false;
    await new Promise(r=>setTimeout(r,30));
    try{const R=await getPrepared(d);if(tok!==ed.token)return;ed.R=R;R.fillKey=null}
    catch(e){if(tok!==ed.token)return;$('#busy').hidden=true;toast('No se pudo abrir este dibujo');showHome();return}
    $('#busy').hidden=true;
    if(ed.mode==='numeros')pickNum();
    refreshEditor();
  }
  wasComplete=isComplete();
}
function storeThumb(){
  if(!ed.on||cv.width<4||(ed.d&&!ed.R))return;
  const id=ed.mode==='colorear'?ed.d.id:ed.mode==='numeros'?'n~'+ed.d.id:ed.mode,k=key();
  const has=Object.keys(state.fills[k]||{}).length||(state.strokes[k]||[]).length;
  if(!has){delete state.when[id];if(thumbs[id]){delete thumbs[id];idb.del('thumbs',id).catch(()=>{})}return}
  render();const c=newCanvas(220),x=c.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(cv,0,0,220,220);
  const url=c.toDataURL('image/jpeg',.82);thumbs[id]=url;idb.put('thumbs',url,id).catch(()=>{});
  if(dirtyWork){state.when[id]=Date.now();dirtyWork=false}else if(!state.when[id])state.when[id]=Date.now();save();
}
function showHome(){storeThumb();ed.on=false;ed.token++;active=null;setMenu(false);stopVoice();
  $('#busy').hidden=true;$('#editor').hidden=true;$('#home').hidden=false;renderGrid();save()}
$('#back').onclick=showHome;
document.querySelectorAll('#seg button').forEach(b=>b.onclick=()=>{
  if(ed.mode===b.dataset.m||active)return;storeThumb();
  ed.mode=b.dataset.m;disarm();hiKey='';layerKey='';
  if(ed.mode==='numeros')pickNum();else if(!TOOLSET.colorear.includes(ui.tool))ui.tool='cubeta';
  refreshEditor();req();wasComplete=isComplete();
});
function updateProg(){
  const el=$('#eprog');if(!numsReady()){el.hidden=true;return}
  const f=fillsOf(key()),rq2=[...required().keys()];el.hidden=false;el.textContent=rq2.filter(i=>f[i]).length+' / '+rq2.length;
}
/* panel plegable en celulares: colores en una fila; pinceles y opciones detrás de "Más" */
const PT_MORE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 4.5l5 5L10 19H5v-5z"/><path d="M12 7l5 5"/></svg><span>Más</span>';
const PT_LESS='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg><span>Menos</span>';
function paintToggle(){const b=$('#ptoggle');panel.classList.toggle('compact',ui.compact);b.innerHTML=ui.compact?PT_MORE:PT_LESS;
  b.setAttribute('aria-expanded',!ui.compact);b.setAttribute('aria-label',ui.compact?'Mostrar pinceles y opciones':'Ocultar pinceles y opciones')}
$('#ptoggle').onclick=()=>{ui.compact=!ui.compact;paintToggle();save()};
function refreshEditor(){
  paintToggle();
  const drawingMode=ed.mode==='colorear'||ed.mode==='numeros';
  $('#ename').textContent=drawingMode?ed.d.name:ed.mode==='neon'?'Pizarra neón':'Dibujo libre';
  $('#seg').hidden=!drawingMode;
  document.querySelectorAll('#seg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.m===ed.mode));
  panel.style.setProperty('--cur',curColor());
  updateProg();renderTools();renderSwatches();renderOpts();req();save();
}
const numsReady=()=>ed.mode==='numeros'&&!!ed.R&&required().size>0;
function renderTools(){
  const el=$('#tools');el.innerHTML='';el.hidden=ed.mode==='numeros';if(el.hidden)return;
  const set=TOOLSET[ed.mode];el.style.setProperty('--n',set.length);
  set.forEach(t=>{const b=mk('button','tool',ICONS[t]+`<span>${TOOL_NAMES[t]}</span>`);b.setAttribute('aria-pressed',ui.tool===t);
    b.onclick=()=>{ui.tool=t;refreshEditor()};el.append(b)});
}
function renderSwatches(){
  const el=$('#swatches');el.innerHTML='';el.hidden=false;
  if(ed.mode==='numeros'){
    if(!numsReady()){el.hidden=true;return}
    const pal=palette(ed.d);
    numsList().forEach(n=>{if(!pal[n])return;const [c,name]=pal[n],dn=numDone(n),b=mk('button','sw',dn?'✓':String(n));
      const [r,g,bl]=hexRGB(c);b.style.background=c;b.style.color=(r*299+g*587+bl*114)/1000>150?'#26235C':'#FFFFFF';b.setAttribute('aria-label',`Número ${n}, ${name}`);
      b.setAttribute('aria-pressed',ui.num===n);if(dn)b.classList.add('done');
      b.onclick=()=>{ui.num=n;renderSwatches();renderOpts();req();save();say([String(n),name])};el.append(b)});
    return;
  }
  requestAnimationFrame(()=>{const c=el.querySelector('[aria-pressed="true"]');if(c&&el.scrollWidth>el.clientWidth)c.scrollIntoView({inline:'center',block:'nearest'})});
  const pal=ed.mode==='neon'?NEON:COLORS,sel=ed.mode==='neon'?ui.neon:ui.color;
  pal.forEach(([c,name],i)=>{const b=mk('button','sw');b.style.background=c;b.setAttribute('aria-label',name);
    b.setAttribute('aria-pressed',ui.tool!=='goma'&&i===sel);
    b.onclick=()=>{if(ed.mode==='neon')ui.neon=i;else ui.color=i;if(ui.tool==='goma')ui.tool=ed.mode==='colorear'?'cubeta':'pincel';refreshEditor();say(name)};
    el.append(b)});
}
function sizeButtons(el){
  SIZES.forEach((_,i)=>{const b=mk('button','dotb');const s=mk('span');s.style.width=s.style.height=DOTS[i]+'px';b.append(s);
    b.setAttribute('aria-label','Grosor '+(i+1));b.setAttribute('aria-pressed',ui.size===i);b.onclick=()=>{ui.size=i;renderOpts();save()};el.append(b)});
}
function renderOpts(){
  const el=$('#opts');el.innerHTML='';
  if(ed.mode==='numeros'){
    if(!ed.R){el.append(mk('p','hint','Preparando…'));return}
    if(!numsReady()){
      const box=mk('div','empty'),p=mk('p','hint');
      p.textContent='Este dibujo aún no tiene números. Píntalo en "Colorear" con la cubeta y luego crea los números desde aquí.';
      const filled=Object.keys(state.fills['c:'+ed.d.id]||{}).length;
      const b=mk('button','chip go');b.textContent='Crear números con mi coloreado';b.disabled=filled<2;
      b.onclick=createNumbers;box.append(p,b);el.append(box);return}
    const f=fillsOf(key()),rq2=[...required().keys()];
    el.append(mk('p','hint',`Pinta las zonas con el <b>${ui.num}</b> · ${rq2.filter(i=>f[i]).length} de ${rq2.length}`));
    if(state.nums[ed.d.id]){const r=mk('button','chip');r.textContent='Rehacer números';r.onclick=()=>{
      delete state.nums[ed.d.id];delete state.fills['n:'+ed.d.id];delete state.done[ed.d.id];ed.R.fillKey=null;hiKey='';refreshEditor()};el.append(r)}
    return;
  }
  if(ui.tool==='cubeta'){
    TEX.forEach(([id,name])=>{const b=mk('button','chip');b.setAttribute('aria-pressed',ui.tex===id);
      const pv=mk('span','pv');pv.style.backgroundImage=`url(${texPreview(curColor(),id)})`;b.append(pv,name);
      b.onclick=()=>{ui.tex=id;renderOpts();save()};el.append(b)});
    return;
  }
  if(ui.tool==='pincel'){
    const row=mk('div','btypes');row.setAttribute('role','radiogroup');row.setAttribute('aria-label','Tipo de pincel');
    BRUSHES.forEach(([id,name,w])=>{const b=mk('button','btype');b.setAttribute('role','radio');b.setAttribute('aria-checked',ui.brush===id);
      const c=newCanvas(400,200);c.className='bprev';drawPreview(c,id,w);const lb=mk('span');lb.textContent=name;b.append(c,lb);
      b.onclick=()=>{ui.brush=id;renderOpts();save();say(name)};row.append(b)});
    el.append(row);
  }
  if(ui.tool==='sello'){
    STAMPS.forEach(([id,name])=>{const b=mk('button','dotb',STAMP_ICONS[id]);b.setAttribute('aria-label','Sello '+name);
      b.setAttribute('aria-pressed',ui.stamp===id);b.querySelector('svg').style.width='26px';
      b.onclick=()=>{ui.stamp=id;renderOpts();save()};el.append(b)});
  }
  sizeButtons(el);
  if(ed.mode==='colorear'&&ui.tool!=='goma'){
    const sw=mk('button','switch','Sin salirse <span class="track"></span>');sw.setAttribute('role','switch');sw.setAttribute('aria-checked',ui.clip);
    sw.onclick=()=>{ui.clip=!ui.clip;renderOpts();save()};el.append(sw);
  }
}
/* muestra de cada pincel: una onda con el color elegido */
function drawPreview(c,id,w){
  const x=c.getContext('2d'),col=curColor(),[r,g,b]=hexRGB(col),light=(r*299+g*587+b*114)/1000>225;
  x.clearRect(0,0,400,200);if(light||ed.mode==='neon'){x.fillStyle=ed.mode==='neon'?NEON_BG:'#9AA0B4';x.beginPath();x.roundRect?x.roundRect(0,0,400,200,40):x.rect(0,0,400,200);x.fill()}
  const pts=[];for(let k=0;k<=34;k++)pts.push([40+k*9.4,100+Math.sin(k/34*Math.PI*2)*46]);
  const s={t:id,c:col,w,r:-1,pts,seed:7};if(ed.mode==='neon')s.g=1;
  if(BUF[id]){const tc=newCanvas(400,200),tx=tc.getContext('2d');pts.forEach((_,i)=>drawSeg(tx,s,i));
    x.save();x.globalAlpha=BUF[id].a;if('filter' in x)x.filter='blur(2px)';x.drawImage(tc,0,0);x.restore()}
  else pts.forEach((_,i)=>drawSeg(x,s,i));
  x.setTransform(1,0,0,1,0,0);
}
/* convierte el coloreado con cubeta en una plantilla de pintar por números */
function createNumbers(){
  const R=ed.R,f=state.fills['c:'+ed.d.id]||{},pos=positions(R),pal=[],seeds=[];
  for(const [id,v] of Object.entries(f)){const p=pos[id];if(!p||+id>=R.K)continue;let n=pal.indexOf(v.c);if(n<0){if(pal.length>=24)continue;pal.push(v.c);n=pal.length-1}
    seeds.push([+(p.x/400).toFixed(4),+(p.y/400).toFixed(4),n+1])}
  if(seeds.length<2){toast('Pinta al menos dos zonas con la cubeta');return}
  state.nums[ed.d.id]={pal,seeds};delete state.fills['n:'+ed.d.id];delete state.done[ed.d.id];R.fillKey=null;hiKey='';pickNum();refreshEditor();
  toast(`Listo: ${seeds.length} zonas con ${pal.length} colores`);say('Listo. Ahora a pintar por números');
}

/* ---------- toques y trazos ---------- */
const toPt=e=>{const r=cv.getBoundingClientRect();return[f1((e.clientX-r.left)/r.width*400),f1((e.clientY-r.top)/r.height*400)]};
function tapFill(pt){
  const R=ed.R,id=regionAt(R,pt);if(id<0)return;const k=key(),f=fillsOf(k);
  pushHist({key:k,kind:'fill',idx:id,prev:f[id]||null});f[id]={c:curColor(),t:ui.tex};paintRegion(R,id,f[id]);sfx('pop');req();save();checkComplete();
}
function tapNumber(pt){
  if(!numsReady())return;
  const R=ed.R,id=regionAt(R,pt);if(id<0)return;const n=required().get(id);if(n===undefined)return;
  const k=key(),f=fillsOf(k);if(f[id])return;
  if(n!==ui.num){flash={i:id,t:performance.now()+700};req();setTimeout(req,720);toast(`Esa zona es el ${n}`);sfx('error');return}
  pushHist({key:k,kind:'fill',idx:id,prev:null});f[id]={c:palette(ed.d)[n][0],t:'solido'};paintRegion(R,id,f[id]);sfx('ok');
  if(numDone(n))pickNum();
  renderSwatches();renderOpts();updateProg();req();save();
  if(allDone())celebrate();
}
function addPoint(pt){
  const s=active.s,last=s.pts[s.pts.length-1];
  if(Math.hypot(pt[0]-last[0],pt[1]-last[1])<1.5)return;
  s.pts.push(pt);const i=s.pts.length-1;
  if(active.buf){drawSeg(Tx,s,i);clipDirty=true}else drawSeg(Lx,s,i);
}
/* ---------- zoom: dos dedos agrandan y mueven la lámina; un dedo pinta ---------- */
const zoomer=$('#zoomer'),zreset=$('#zreset'),touches=new Map();
const zoom={s:1,x:0,y:0,pinch:null};let pendingTap=null,hiResT=0;
function applyZoom(){zoomer.style.transform=zoom.s===1?'':`translate(${zoom.x}px,${zoom.y}px) scale(${zoom.s})`;zreset.hidden=zoom.s===1}
function clampZoom(){const W=paper.clientWidth;zoom.s=Math.min(3,Math.max(1,zoom.s));
  zoom.x=Math.min(0,Math.max(W-W*zoom.s,zoom.x));zoom.y=Math.min(0,Math.max(W-W*zoom.s,zoom.y))}
function resetZoom(){if(zoom.s===1&&!zoom.pinch)return;zoom.s=1;zoom.x=zoom.y=0;zoom.pinch=null;applyZoom();resize()}
zreset.onclick=resetZoom;
const local=e=>{const r=paper.getBoundingClientRect();return[e.clientX-r.left-paper.clientLeft,e.clientY-r.top-paper.clientTop]};
function startPinch(){
  /* el segundo dedo cancela lo que empezó el primero (un trazo corto o un toque pendiente) */
  pendingTap=null;
  if(active){const st=strokesOf(key());if(st[st.length-1]===active.s&&active.s.pts.length<25){st.pop();history.pop();active=null;layerKey='';rebuildLayer();req()}else endStroke()}
  const [a,b]=[...touches.values()],m=[(a[0]+b[0])/2,(a[1]+b[1])/2];
  zoom.pinch={d:Math.hypot(a[0]-b[0],a[1]-b[1])||1,s:zoom.s,cx:(m[0]-zoom.x)/zoom.s,cy:(m[1]-zoom.y)/zoom.s};
}
function movePinch(){const [a,b]=[...touches.values()],p=zoom.pinch,m=[(a[0]+b[0])/2,(a[1]+b[1])/2];
  zoom.s=p.s*Math.hypot(a[0]-b[0],a[1]-b[1])/p.d;clampZoom();zoom.x=m[0]-p.cx*zoom.s;zoom.y=m[1]-p.cy*zoom.s;clampZoom();applyZoom()}
function endPinch(){zoom.pinch=null;if(zoom.s<1.08){zoom.s=1;zoom.x=zoom.y=0}applyZoom();
  clearTimeout(hiResT);hiResT=setTimeout(resize,120)}   /* vuelve a dibujar con más resolución */
const forget=e=>{touches.delete(e.pointerId);if(zoom.pinch&&touches.size<2)endPinch()};
cv.addEventListener('pointerdown',e=>{
  e.preventDefault();
  if(e.pointerType==='touch'){touches.set(e.pointerId,local(e));if(touches.size===2){startPinch();return}if(touches.size>2)return}
  if(active||zoom.pinch)return;
  const drawingMode=ed.mode==='colorear'||ed.mode==='numeros';if(drawingMode&&!ed.R)return;
  const pt=toPt(e);
  /* los toques (cubeta y números) se aplican al levantar el dedo, por si llega un segundo dedo para hacer zoom */
  if(ed.mode==='numeros'||(ui.tool==='cubeta'&&ed.mode==='colorear')){
    if(e.pointerType!=='touch'){if(ed.mode==='numeros')tapNumber(pt);else tapFill(pt);return}
    pendingTap={id:e.pointerId,pt,x:e.clientX,y:e.clientY};return}
  if(layerKey!==key()+':'+L.width)rebuildLayer();
  try{cv.setPointerCapture(e.pointerId)}catch(err){}
  const t=ui.tool==='pincel'?ui.brush:ui.tool;
  const s={t,c:curColor(),w:SIZES[ui.size]*(t==='goma'?1.6:1),r:-1,pts:[pt],seed:(Math.random()*1e6)|0};
  if(s.t==='sello')s.k=ui.stamp;
  if(ed.mode==='neon'&&s.t!=='goma')s.g=1;
  if(ed.mode==='colorear'&&ui.clip&&s.t!=='goma')s.r=regionAt(ed.R,pt);
  strokesOf(key()).push(s);pushHist({key:key(),kind:'stroke'});
  active={s,buf:needsBuf(s),id:e.pointerId};
  if(active.buf){Bx.setTransform(1,0,0,1,0,0);Bx.globalCompositeOperation='copy';Bx.drawImage(L,0,0);Bx.globalCompositeOperation='source-over';
    clearCtx(Tx);drawSeg(Tx,s,0);clipDirty=true}
  else drawSeg(Lx,s,0);
  if(s.t==='sello'){sfx('sello');if(active.buf){restoreB();compositeK(s,true)}clipDirty=false;active=null;layerKey=key()+':'+L.width;save()}
  req();
});
cv.addEventListener('pointermove',e=>{
  if(touches.has(e.pointerId)){touches.set(e.pointerId,local(e));if(zoom.pinch&&touches.size>=2){movePinch();return}}
  if(pendingTap&&e.pointerId===pendingTap.id&&Math.hypot(e.clientX-pendingTap.x,e.clientY-pendingTap.y)>24)pendingTap=null;
  if(!active||e.pointerId!==active.id)return;
  const evs=e.getCoalescedEvents?e.getCoalescedEvents():[e];
  (evs.length?evs:[e]).forEach(ev=>{if(active.s.pts.length<5000)addPoint(toPt(ev))});req();
});
const endStroke=e=>{if(!active||(e&&e.pointerId!==active.id))return;
  if(active.buf){restoreB();compositeK(active.s,true);clipDirty=false}
  active=null;layerKey=key()+':'+L.width;req();save();checkComplete()};
cv.addEventListener('pointerup',e=>{const was=zoom.pinch;forget(e);
  if(pendingTap&&e.pointerId===pendingTap.id&&!was){const pt=pendingTap.pt;pendingTap=null;if(ed.mode==='numeros')tapNumber(pt);else tapFill(pt)}
  endStroke(e)});
cv.addEventListener('pointercancel',e=>{forget(e);pendingTap=null;endStroke(e)});

/* ---------- deshacer / borrar ---------- */
$('#undo').onclick=()=>{
  if(active)return;const k=key();
  for(let i=history.length-1;i>=0;i--){if(history[i].key!==k)continue;
    const h=history.splice(i,1)[0];
    if(h.kind==='stroke'){strokesOf(k).pop();layerKey=''}
    else if(h.kind==='fill'){const f=fillsOf(k);if(h.prev)f[h.idx]=h.prev;else delete f[h.idx];if(ed.R)paintRegion(ed.R,h.idx,f[h.idx]||null)}
    else{state.fills[k]=h.fills;state.strokes[k]=h.strokes;layerKey='';if(ed.R)ed.R.fillKey=null}
    hiKey='';if(ed.mode==='numeros'){pickNum();renderSwatches();renderOpts();updateProg()}
    req();save();return}
  toast('No hay nada que deshacer');
};
/* ---------- menú ⋯ (guardar, voz, borrar) ---------- */
const moreBtn=$('#more'),menu=$('#menu');
function setMenu(open){menu.hidden=!open;moreBtn.setAttribute('aria-expanded',open);if(!open)disarm()}
moreBtn.onclick=e=>{e.stopPropagation();setMenu(menu.hidden);if(!menu.hidden){const f=menu.querySelector('.mitem:not([hidden])');if(f)f.focus()}};
document.addEventListener('pointerdown',e=>{if(!menu.hidden&&!e.target.closest('.more-wrap'))setMenu(false)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('#voices').hidden)closeVoices();else if(!$('#pgate').hidden)closeParents();else if(!$('#party').hidden)closeParty();else if(!menu.hidden){setMenu(false);moreBtn.focus()}else if(dots.on)dotsBack();else if(puz.on)puzBack()}});
const clearBtn=$('#clear'),clearIcon=clearBtn.innerHTML;let armed=false,armT;
function disarm(){armed=false;clearTimeout(armT);clearBtn.innerHTML=clearIcon;clearBtn.classList.remove('armed')}
clearBtn.onclick=()=>{
  if(!armed){armed=true;clearBtn.innerHTML=clearIcon.replace('Borrar todo','¿Seguro? Toca otra vez');clearBtn.classList.add('armed');armT=setTimeout(disarm,3000);return}
  disarm();setMenu(false);const k=key(),pf=state.fills[k]||{},ps=state.strokes[k]||[];
  if(!Object.keys(pf).length&&!ps.length)return;
  pushHist({key:k,kind:'clear',fills:pf,strokes:ps});state.fills[k]={};state.strokes[k]=[];layerKey='';hiKey='';wasComplete=false;if(ed.R)ed.R.fillKey=null;
  if(ed.mode==='numeros'){pickNum();renderSwatches();renderOpts();updateProg()}
  req();save();toast('Hoja limpia');
};

/* ---------- guardar dibujo como imagen (solo en la app instalada; el visor de artefactos bloquea descargas) ---------- */
const saveBtn=$('#savepic');
let inFrame=true;try{inFrame=window.self!==window.top}catch(e){}
saveBtn.hidden=inFrame;$('#party-save').hidden=inFrame;
saveBtn.onclick=()=>{setMenu(false);savePicture()};
function savePicture(){
  if(active)return;render();
  const name=(ed.d?ed.d.id:ed.mode)+'-'+new Date().toISOString().slice(0,10)+'.png';
  cv.toBlob(async blob=>{
    if(!blob){toast('No se pudo guardar la imagen');return}
    if(plug('Filesystem')&&plug('Share')){
      try{await nativeShare(blob,name)}catch(e){if(!/cancel/i.test(String(e&&e.message)))toast('No se pudo guardar la imagen')}
      return;
    }
    const file=new File([blob],name,{type:'image/png'});
    try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'Mi dibujo'});return}}
    catch(e){if(e&&e.name==='AbortError')return}
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),4000);toast('Dibujo guardado');
  },'image/png');
}
const SND_ON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>';
const SND_OFF='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>';
const sndBtn=$('#snd');
const MUS_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5.5l11-2V16"/><circle cx="6.5" cy="18" r="2.5" fill="currentColor"/><circle cx="17.5" cy="16" r="2.5" fill="currentColor"/></svg>';
const musBtn=$('#mus');
function paintSnd(){
  sndBtn.innerHTML=(ui.sound?SND_ON:SND_OFF)+`<span>${ui.sound?'Voz y sonidos: sí':'Voz y sonidos: no'}</span>`;
  musBtn.innerHTML=MUS_ICON+`<span>${ui.music?'Música: sí':'Música: no'}</span>`;
  $('#pz-sound').setAttribute('aria-checked',ui.sound);$('#pz-music').setAttribute('aria-checked',ui.music)}
function setSound(v){ui.sound=v;paintSnd();save();if(v)say('Voz activada');else stopVoice()}
function setMusic(v){ui.music=v;paintSnd();save();if(v){getActx();setTimeout(startMusic,80)}else stopMusic()}
sndBtn.onclick=()=>setSound(!ui.sound);
musBtn.onclick=()=>setMusic(!ui.music);
paintSnd();

/* ---------- elegir voz ---------- */
const REGION={PE:'Perú',MX:'México',US:'Estados Unidos',ES:'España',AR:'Argentina',CO:'Colombia',CL:'Chile',EC:'Ecuador',BO:'Bolivia',VE:'Venezuela','419':'Latinoamérica'};
const prettyVoice=v=>{const m=/^[a-z]{2,3}-[a-z0-9]{2,3}-x-([a-z]+)-(local|network)$/i.exec(v.name);if(m)return 'Voz '+m[1].toUpperCase();return prettyName(v)};
const prettyName=v=>v.name.replace(/^(Microsoft|Google|Apple)\s+/i,'').replace(/\s*Online\s*\(Natural\)/i,'').replace(/\s*-\s*(Spanish|Español).*$/i,'').trim()||v.name;
const SAMPLE='¡Hola! Vamos a pintar juntos';
let voicesFocus=null;
function renderVoices(){
  const list=$('#vlist');list.innerHTML='';
  const play='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5Z"/></svg>';
  const item=(id,title,sub,natural)=>{const b=mk('button','vitem');b.setAttribute('role','radio');
    const cur=ui.voice===id||(ui.voice===''&&((id==='grabada'&&hasClips)||(!hasClips&&voice&&id===voice.voiceURI)));
    b.setAttribute('aria-checked',cur);const t=mk('span','vt'),bb=mk('b'),sm=mk('small');bb.textContent=title;sm.textContent=sub;t.append(bb,sm);
    const tag=mk('span','tag'+(natural?'':' basic'));tag.textContent=natural?'Natural':'Básica';
    b.append(t,tag,mk('span','vplay',play));
    b.onclick=()=>{ui.voice=id;loadVoices();save();renderVoices();say(SAMPLE)};list.append(b)};
  if(hasClips)item('grabada','Voz grabada','La más natural · funciona sin internet',true);
  voices.forEach(v=>{const rg=(v.lang.split(/[-_]/)[1]||'').toUpperCase();
    item(v.voiceURI,prettyVoice(v),(REGION[rg]||v.lang)+(v.localService===false?' · necesita internet':''),scoreVoice(v)>=30)});
  const note=$('#voices-note'),anyNatural=hasClips||voices.some(v=>scoreVoice(v)>=30);
  note.textContent=!voices.length&&!hasClips?'Este navegador no tiene voces en español.'
    :anyNatural?'Toca una voz para escucharla. Las marcadas como "Natural" suenan menos robóticas.'
    :'Este dispositivo solo tiene voces básicas. En Android instala o actualiza "Servicios de voz de Google"; en iPhone o iPad descarga una voz "mejorada" en Ajustes › Accesibilidad › Contenido leído › Voces.';
}
function openVoices(){setMenu(false);loadVoices();renderVoices();voicesFocus=document.activeElement;$('#voices').hidden=false;
  const c=$('#vlist').querySelector('[aria-checked="true"]')||$('#voices-ok');c.focus()}
function closeVoices(){$('#voices').hidden=true;if(voicesFocus&&voicesFocus.focus)voicesFocus.focus()}
$('#voicebtn').onclick=openVoices;

/* ---------- desbloquear todo: compra única con Google Play Billing ----------
   Las láminas marcadas "premium" en dibujos.json se abren con la compra "desbloquear_todo".
   En la app Android se confirma con Google Play al abrir (si hubo reembolso, se vuelve a bloquear).
   La web no vende nada: muestra el aviso de la app. */
const PRODUCT_ID='desbloquear_todo',PREM_KEY='pinta-y-brilla-premium';
const LOCK_SVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/></svg>';
const BILL=plug('NativePurchases');
let premium=false,priceText='',buying=false;
try{premium=localStorage.getItem(PREM_KEY)==='1'}catch(e){}
const isLocked=d=>!!(d&&d.premium&&!premium);
function setPremium(v){if(premium===v)return;premium=v;try{v?localStorage.setItem(PREM_KEY,'1'):localStorage.removeItem(PREM_KEY)}catch(e){}paintShop();if(!ed.on)renderGrid();try{if(puz.on&&!puz.d)renderPuzList()}catch(e){}}
const owned=list=>(list||[]).some(t=>t&&t.productIdentifier===PRODUCT_ID&&(t.purchaseState===undefined||String(t.purchaseState)==='1'||t.purchaseState==='PURCHASED'));
async function checkPurchases(){
  if(!BILL)return;
  try{const {purchases}=await BILL.getPurchases({productType:'inapp'});setPremium(owned(purchases))}catch(e){}  /* sin respuesta de Play: se mantiene lo guardado */
  try{const {products}=await BILL.getProducts({productIdentifiers:[PRODUCT_ID],productType:'inapp'});
    const p=products&&products[0];if(p&&typeof p.priceString==='string'){priceText=p.priceString.slice(0,24);paintShop()}}catch(e){}
}
function paintShop(){
  const t=$('#pshop-t'),sub=$('#pshop-sub'),buy=$('#pz-buy'),res=$('#pz-restore');
  const total=DRAWINGS.filter(d=>!d.custom&&d.cat!=='letras').length,free=DRAWINGS.filter(d=>!d.custom&&d.cat!=='letras'&&!d.premium).length;
  if(premium){t.textContent='Todo desbloqueado';sub.textContent='Gracias por apoyar a Pukllay Studio. Ya tienes todas las láminas.';buy.hidden=true;res.hidden=true;return}
  t.textContent='Todas las láminas';buy.hidden=false;res.hidden=!BILL;
  sub.textContent=`${free||15} láminas gratis de ${total||30}. Con un solo pago desbloqueas todas y las que lleguen después.`;
  if(!BILL){buy.textContent='Disponible en la app de Google Play';buy.disabled=true}
  else{buy.disabled=buying;buy.textContent=buying?'Abriendo Google Play…':priceText?`Desbloquear todo · ${priceText}`:'Desbloquear todo'}
}
function askUnlock(){toast('Pide a un adulto que lo desbloquee');say('Pide ayuda a un adulto para desbloquear más dibujos');openParents(true)}
$('#pz-buy').onclick=async()=>{
  if(!BILL||buying||premium)return;buying=true;paintShop();
  try{const t=await BILL.purchaseProduct({productIdentifier:PRODUCT_ID,productType:'inapp'});
    if(owned([t])){setPremium(true);toast('¡Listo! Todo desbloqueado');sfx('ok')}
    else toast('Tu pago está pendiente. Se desbloqueará cuando Google lo confirme.');
  }catch(e){if(!/cancel/i.test(String(e&&e.message)))toast('No se pudo completar la compra. Inténtalo otra vez.')}
  buying=false;paintShop();
};
$('#pz-restore').onclick=async()=>{if(!BILL)return;const before=premium;await checkPurchases();
  toast(premium?(before?'Ya estaba desbloqueado':'¡Compra restaurada!'):'No encontramos una compra con esta cuenta de Google')};
if(BILL){checkPurchases();try{BILL.addListener('transactionUpdated',()=>checkPurchases())}catch(e){}}

/* ---------- zona para padres (candado con una suma) ---------- */
let gateFocus=null,resetT=0;
function newGate(){
  const a=6+Math.floor(Math.random()*4),b=6+Math.floor(Math.random()*4),r=a+b,opts=new Set([r]);
  while(opts.size<3){const v=r+[-3,-2,-1,1,2,3][Math.floor(Math.random()*6)];opts.add(v)}
  $('#gate-q').textContent=`${a} + ${b}`;const box=$('#gate-opts');box.innerHTML='';
  [...opts].sort(()=>Math.random()-.5).forEach(v=>{const btn=mk('button','pbtn');btn.textContent=v;
    btn.onclick=()=>{if(v===r){$('#gate').hidden=true;$('#pzone').hidden=false;paintSnd();paintShop();(gateShop&&!premium?$('#pz-buy'):$('#pz-sound')).focus()}
      else{toast('Esa no es. Prueba otra suma.');newGate();box.firstChild.focus()}};box.append(btn)});
}
let gateShop=false;
function openParents(shop){gateShop=shop===true;gateFocus=document.activeElement;newGate();paintShop();$('#gate').hidden=false;$('#pzone').hidden=true;disarmReset();
  $('#pgate').hidden=false;$('#gate-opts').firstChild.focus()}
function closeParents(){$('#pgate').hidden=true;disarmReset();if(gateFocus&&gateFocus.focus)gateFocus.focus()}
function disarmReset(){clearTimeout(resetT);const b=$('#pz-reset');b.classList.remove('armed');b.firstChild.textContent='Borrar todo el progreso'}
$('#parents').onclick=()=>openParents(false);
$('#pgate-close').onclick=closeParents;
$('#pgate').addEventListener('pointerdown',e=>{if(e.target.id==='pgate')closeParents()});
$('#pz-sound').onclick=()=>setSound(!ui.sound);
$('#pz-music').onclick=()=>setMusic(!ui.music);
$('#pz-voice').onclick=()=>{$('#pgate').hidden=true;disarmReset();openVoices();voicesFocus=$('#parents')};
$('#pz-reset').onclick=()=>{
  const b=$('#pz-reset');
  if(!b.classList.contains('armed')){b.classList.add('armed');b.firstChild.textContent='Toca otra vez para borrar';resetT=setTimeout(disarmReset,3000);return}
  disarmReset();
  /* borra colores, trazos, estrellas y obras; conserva los dibujos agregados y sus números */
  state={fills:{},strokes:{},done:{},nums:state.nums,when:{}};
  for(const id of Object.keys(thumbs)){delete thumbs[id];idb.del('thumbs',id).catch(()=>{})}
  prepCache.clear();history.length=0;
  try{localStorage.setItem(KEY,JSON.stringify({state,ui}))}catch(e){}
  renderGrid();toast('Listo: el progreso quedó en cero');
};

/* ---------- solo en la app Android ---------- */
const blobB64=b=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(',')[1]);r.onerror=rej;r.readAsDataURL(b)});
/* guarda el PNG en la caché de la app y abre el menú de Android para guardarlo en Fotos o compartirlo */
async function nativeShare(blob,name){
  const w=await plug('Filesystem').writeFile({path:name,data:await blobB64(blob),directory:'CACHE'});
  await plug('Share').share({title:'Mi dibujo',files:[w.uri],dialogTitle:'Guardar o compartir el dibujo'});
}
const APP=plug('App');
if(APP){
  /* botón Atrás de Android: cierra lo que esté abierto antes de salir de la app */
  APP.addListener('backButton',()=>{
    if(!$('#voices').hidden)closeVoices();else if(!$('#pgate').hidden)closeParents();else if(!$('#party').hidden)closeParty();else if(!menu.hidden)setMenu(false);
    else if(dots.on)dotsBack();else if(puz.on)puzBack();else if(ed.on)showHome();else APP.exitApp();
  });
  APP.addListener('pause',()=>{stopVoice();stopMusic();save()});
  APP.addListener('resume',()=>{if(BILL)checkPurchases()});
}
$('#voices-ok').onclick=closeVoices;
$('#voices').addEventListener('pointerdown',e=>{if(e.target.id==='voices')closeVoices()});

/* ---------- felicitación al terminar ---------- */
/* Se felicita sola cuando todas las zonas principales (≥0,5 % de la hoja) tienen color, ya sea con cubeta o con pincel "sin salirse";
   y siempre que el niño toque "¡Terminé!" */
let wasComplete=false;
/* zonas que cuentan para terminar: las numeradas; si la lámina no tiene números, las grandes que no tocan el borde (el fondo blanco no hace falta pintarlo) */
function bigRegions(){const R=ed.R,rq=required();if(rq.size)return[...rq.keys()];  /* con números: las zonas numeradas */
  if(R.big)return R.big;const min=N*N*.005,a=[],bb=R.bb;
  for(let r=0;r<R.K;r++){const b=r*4,edge=bb[b]<=1||bb[b+1]<=1||bb[b+2]>=N-2||bb[b+3]>=N-2;if(R.off[r+1]-R.off[r]>=min&&!edge)a.push(r)}return R.big=a}
function colorComplete(){
  if(ed.mode!=='colorear'||!ed.R)return false;
  const f=state.fills[key()]||{},sr=new Set();for(const s of state.strokes[key()]||[])if(s.r>=0)sr.add(s.r);
  const big=bigRegions();return big.length>0&&big.every(r=>f[r]||sr.has(r));
}
function checkComplete(){const c=colorComplete();if(c&&!wasComplete){wasComplete=true;setTimeout(celebrate,250)}else if(!c)wasComplete=false}
const isComplete=()=>ed.mode==='numeros'?allDone():colorComplete();
const PRAISE=['¡Te quedó precioso!','¡Eres un gran artista!','¡Qué colores tan bonitos!','¡Lo hiciste genial!','¡Excelente trabajo!','¡Wow, qué obra de arte!','¡Muy bien, campeón del color!'];
let lastPraise=-1,partyFocus=null;
function hasPaint(){const k=key();return Object.keys(state.fills[k]||{}).length>0||(state.strokes[k]||[]).length>0}
function celebrate(){
  if(!ed.on||active)return;
  $('#party-more').textContent='Seguir pintando';$('#party-save').hidden=inFrame;
  if(!hasPaint()){toast('Primero pinta un poquito');say('Primero pinta un poquito');return}
  setMenu(false);
  let i;do{i=Math.floor(Math.random()*PRAISE.length)}while(i===lastPraise&&PRAISE.length>1);lastPraise=i;
  const phrase=PRAISE[i],drawing=ed.mode==='colorear'||ed.mode==='numeros';
  let sub='';
  if(drawing){const first=!state.done[ed.d.id];state.done[ed.d.id]=true;save();storeThumb();
    sub=first?`Ganaste una estrella por ${ed.d.name}.`:`Terminaste ${ed.d.name} otra vez.`}
  else sub='Tu dibujo está listo.';
  render();const c=newCanvas(440),x=c.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(cv,0,0,440,440);
  $('#party-img').src=c.toDataURL('image/jpeg',.88);
  $('#party-t').textContent=phrase;$('#party-s').textContent=sub;
  const p=$('#party');partyFocus=document.activeElement;p.hidden=false;
  const pf=$('#party-fx');pf.width=Math.round(innerWidth*dpr);pf.height=Math.round(innerHeight*dpr);
  confetti(pf,200);tada();setTimeout(()=>say(phrase),650);
  $('#party-more').focus();
}
function closeParty(){$('#party').hidden=true;stopVoice();if(partyFocus&&partyFocus.focus)partyFocus.focus()}
$('#party-more').onclick=()=>{closeParty();
  if(puz.on&&puz.done&&puz.nextN){puz.n=puz.nextN;puz.nextN=0;try{localStorage.setItem(PUZ_KEY,String(puz.n))}catch(e){}paintLevels();puzBuild();say('Arma el rompecabezas')}};
$('#party-home').onclick=()=>{closeParty();if(dots.on)openDotsList();else if(puz.on)openPuzList();else showHome()};
$('#party-save').onclick=savePicture;
$('#party').addEventListener('pointerdown',e=>{if(e.target.id==='party')closeParty()});
$('#finish').onclick=celebrate;
/* ---------- sonidos con Web Audio (sin archivos) ---------- */
let actx=null;
function getActx(){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();if(actx.state==='suspended')actx.resume();return actx}catch(e){return null}}
function tone(a,f,st,dur,vol,type,f2,dst){const o=a.createOscillator(),g=a.createGain();o.type=type||'triangle';o.frequency.setValueAtTime(f,st);
  if(f2)o.frequency.exponentialRampToValueAtTime(f2,st+dur*.6);
  g.gain.setValueAtTime(0,st);g.gain.linearRampToValueAtTime(vol,st+.012);g.gain.exponentialRampToValueAtTime(.001,st+dur);
  o.connect(g);g.connect(dst||a.destination);o.start(st);o.stop(st+dur+.05)}
/* fanfarria al terminar (do-mi-sol-do); suena solo si "Voz y sonidos" está activo */
function tada(){if(!ui.sound)return;const a=getActx();if(!a)return;const t0=a.currentTime+.03;
  [523.25,659.25,783.99,1046.5].forEach((f,i)=>tone(a,f,t0+i*.12,i===3?.8:.2,.2))}
/* efectos cortos: pop al rellenar, dos notas al acertar un número, brillo del sello, tono grave suave al equivocarse */
let lastSfx=0;
function sfx(kind){
  if(!ui.sound)return;const now=performance.now();if(now-lastSfx<50)return;lastSfx=now;const a=getActx();if(!a)return;const t=a.currentTime+.01;
  if(kind==='pop'){const f=[523.25,587.33,659.25,783.99,880][Math.floor(Math.random()*5)];tone(a,f*.75,t,.16,.16,'sine',f*1.3)}
  else if(kind==='ok'){tone(a,659.25,t,.14,.14);tone(a,987.77,t+.08,.24,.12)}
  else if(kind==='sello'){tone(a,1318.5,t,.28,.08,'sine');tone(a,1975.5,t+.05,.32,.05,'sine')}
  else if(kind==='error'){tone(a,233.08,t,.22,.12,'sine',185)}
}
/* música de fondo: melodía pentatónica suave que se inventa sola; apagada de fábrica */
const MEL=[261.63,293.66,329.63,392,440,523.25,587.33,659.25],BASS=[130.81,110,87.31,98];
let musicT=null,musicGain=null;
function startMusic(){
  if(!ui.music||musicT||document.hidden)return;const a=getActx();if(!a)return;
  if(a.state!=='running'){a.resume().then(()=>{if(a.state==='running')startMusic()}).catch(()=>{});return}
  musicGain=a.createGain();musicGain.gain.setValueAtTime(0,a.currentTime);musicGain.gain.linearRampToValueAtTime(.05,a.currentTime+2);musicGain.connect(a.destination);
  let next=a.currentTime+.15,step=0,idx=2;const g=musicGain;
  musicT=setInterval(()=>{while(next<a.currentTime+.8){
    if(step%16===0)tone(a,BASS[(step/16|0)%4],next,3.2,.55,'sine',0,g);
    if(step%2===0||Math.random()<.3){idx=Math.max(0,Math.min(MEL.length-1,idx+[-2,-1,-1,0,1,1,2][Math.floor(Math.random()*7)]));
      if(Math.random()<.85)tone(a,MEL[idx],next,1.1,.5,'sine',0,g)}
    next+=.21;step++}},200);
}
function stopMusic(){clearInterval(musicT);musicT=null;const g=musicGain;musicGain=null;if(!g||!actx)return;
  try{g.gain.cancelScheduledValues(actx.currentTime);g.gain.setValueAtTime(g.gain.value,actx.currentTime);g.gain.linearRampToValueAtTime(0,actx.currentTime+.4)}catch(e){}
  setTimeout(()=>{try{g.disconnect()}catch(e){}},600)}
/* el audio solo puede empezar después de un toque */
document.addEventListener('pointerdown',()=>{if(ui.music&&!musicT){getActx();setTimeout(startMusic,60)}},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopMusic();stopVoice()}else if(dots.on&&dots.f)dotsLoop()});

/* ======================= unir puntos ======================= */
/* figuras en unidades de 0 a 400; p = puntos en orden, c = color al revelar, x = detalles que aparecen al final (círculos o líneas) */
const DOT_FIGS=(()=>{
  const star=[],heart=[];
  for(let k=0;k<10;k++){const r=k%2?62:150,a=-Math.PI/2+k*Math.PI/5;star.push([200+r*Math.cos(a),210+r*Math.sin(a)])}
  for(let k=0;k<12;k++){const t=k/12*Math.PI*2;heart.push([200+160*Math.sin(t)**3,185-10*(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))])}
  const F=[
    {id:'cometa',name:'Cometa',say:'una cometa',c:'#9B6BD6',p:[[200,50],[300,170],[200,300],[100,170]],x:[{l:[[200,300],[176,332],[222,352],[186,384]]},{l:[[200,50],[200,300]]},{l:[[100,170],[300,170]]}]},
    {id:'casa',name:'Casa',say:'una casa',c:'#FF8A3D',p:[[200,60],[340,180],[305,180],[305,340],[95,340],[95,180],[60,180]],x:[{l:[[170,340],[170,262],[230,262],[230,340]]},{o:[250,220,18]}]},
    {id:'helado',name:'Helado',say:'un helado',c:'#FF8FB8',p:[[200,355],[138,205],[112,168],[132,110],[200,80],[268,110],[288,168],[262,205]],x:[{l:[[138,205],[262,205]]},{o:[200,62,14]}]},
    {id:'gatito',name:'Gatito',say:'un gatito',c:'#FFB347',p:[[110,110],[155,165],[245,165],[290,110],[300,215],[270,290],[200,318],[130,290],[100,215]],x:[{o:[160,225,11]},{o:[240,225,11]},{l:[[188,258],[200,270],[212,258]]}]},
    {id:'barco',name:'Barco',say:'un barco',c:'#2F6FD6',p:[[60,262],[185,262],[185,70],[310,240],[202,240],[202,262],[340,262],[300,340],[100,340]],x:[{l:[[40,372],[90,358],[140,372],[190,358],[240,372],[290,358],[340,372]]}]},
    {id:'estrella',name:'Estrella',say:'una estrella',c:'#FFD23F',p:star,x:[{o:[175,200,9]},{o:[225,200,9]},{l:[[180,232],[200,246],[220,232]]}]},
    {id:'cohete',name:'Cohete',say:'un cohete',c:'#E8424C',p:[[200,48],[245,110],[250,250],[296,310],[245,300],[230,332],[170,332],[155,300],[104,310],[150,250],[155,110]],x:[{o:[200,170,24]},{l:[[180,332],[190,370],[200,350],[210,370],[220,332]]}]},
    {id:'pez',name:'Pez',say:'un pez',c:'#2BB3A3',p:[[70,200],[120,140],[200,115],[270,140],[310,180],[370,120],[345,200],[370,280],[310,220],[270,260],[200,285],[120,260]],x:[{o:[125,185,10]},{l:[[220,140],[240,200],[220,260]]}]},
    {id:'corazon',name:'Corazón',say:'un corazón',c:'#E8424C',p:heart,x:[]},
    {id:'arbol',name:'Árbol',say:'un árbol',c:'#6CC24A',p:[[200,48],[270,140],[240,140],[300,220],[262,220],[330,300],[222,300],[222,352],[178,352],[178,300],[70,300],[138,220],[100,220],[160,140],[130,140]],x:[]},
  ];
  for(const f of F){f.p=f.p.map(([x,y])=>[Math.round(x),Math.round(y)]);
    const cx=f.p.reduce((a,q)=>a+q[0],0)/f.p.length,cy=f.p.reduce((a,q)=>a+q[1],0)/f.p.length;
    f.lab=f.p.map(([x,y])=>{const dx=x-cx,dy=y-cy,d=Math.hypot(dx,dy)||1;return[Math.max(16,Math.min(384,x+dx/d*26)),Math.max(16,Math.min(384,y+dy/d*26))]})}
  return F;
})();
const dotsEl=$('#dots'),dcv=$('#dcv'),dcx=dcv.getContext('2d'),dstage=$('#dots-stage'),dpaper=$('#dots-paper');
const dots={on:false,f:null,next:0,done:false,drag:null,flash:-1,flashT:0,reveal:0,anim:0,last:0};
const NEXT_C='#2F6FD6';
function figPath(x,f){x.beginPath();f.p.forEach((q,i)=>i?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1]));x.closePath()}
function drawExtras(x,f){x.strokeStyle=INK;x.lineWidth=5;for(const e of f.x){
  if(e.o){if(!e.o[2])continue;x.beginPath();x.arc(e.o[0],e.o[1],e.o[2],0,Math.PI*2);x.fillStyle='#FFFFFF';x.fill();x.stroke()}
  else{x.beginPath();e.l.forEach((q,i)=>i?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1]));x.stroke()}}}
function drawFigure(x,f,alpha){x.globalAlpha=alpha;x.fillStyle=f.c;figPath(x,f);x.fill();x.globalAlpha=1;x.strokeStyle=INK;x.lineWidth=5;figPath(x,f);x.stroke();drawExtras(x,f)}
const dotsThumbs={};
function dotsPreview(f,done){const k=f.id+(done?':1':':0');if(dotsThumbs[k])return dotsThumbs[k];
  const c=newCanvas(220),x=c.getContext('2d'),s=220/400;x.fillStyle='#FFFFFF';x.fillRect(0,0,220,220);x.setTransform(s,0,0,s,0,0);x.lineJoin=x.lineCap='round';
  if(done)drawFigure(x,f,1);
  else{x.font='900 34px Nunito, system-ui, sans-serif';x.textAlign='center';x.textBaseline='middle';
    f.p.forEach((q,i)=>{x.beginPath();x.arc(q[0],q[1],13,0,Math.PI*2);x.fillStyle='#FFFFFF';x.fill();x.lineWidth=5;x.strokeStyle=INK;x.stroke();
      x.fillStyle=INK;x.fillText(i+1,f.lab[i][0],f.lab[i][1])})}
  return dotsThumbs[k]=c.toDataURL('image/png')}
function renderDotsList(){const g=$('#dots-grid');g.innerHTML='';
  DOT_FIGS.forEach(f=>{const done=!!state.done['puntos-'+f.id],card=mk('div','card'),b=mk('button','open');
    b.setAttribute('aria-label',done?`${f.name}, ${f.p.length} puntos`:`Dibujo sorpresa de ${f.p.length} puntos`);
    const im=mk('img','thumb');im.alt='';im.decoding='async';im.src=dotsPreview(f,done);
    const nm=mk('span','nm');nm.textContent=done?f.name:`${f.p.length} puntos`;
    b.append(im,nm);b.onclick=()=>openDots(f);card.append(b);if(done)card.append(mk('span','badge','★'));g.append(card)})}
function showDotsScreen(){$('#home').hidden=true;$('#editor').hidden=true;dotsEl.hidden=false;dots.on=true}
function openDotsList(){showDotsScreen();cancelAnimationFrame(dots.anim);dots.f=null;
  $('#dots-name').textContent='Unir puntos';$('#dots-prog').hidden=true;dpaper.hidden=true;$('#dots-list').hidden=false;
  $('#dots-hint').textContent='Elige uno y une los puntos en orden: 1, 2, 3…';renderDotsList()}
function openDots(f){showDotsScreen();Object.assign(dots,{f,next:0,done:false,drag:null,flash:-1,reveal:0});
  $('#dots-name').textContent='¿Qué será?';const pr=$('#dots-prog');pr.hidden=false;pr.textContent=`0 / ${f.p.length}`;
  $('#dots-list').hidden=true;dpaper.hidden=false;$('#dots-hint').textContent='Toca el 1 para empezar';
  sizeDots();dotsLoop();say('Toca el uno para empezar')}
function dotsBack(){if(!$('#party').hidden){closeParty();return}if(dots.f)openDotsList();else leaveDots()}
function leaveDots(){dots.on=false;dots.f=null;cancelAnimationFrame(dots.anim);stopVoice();dotsEl.hidden=true;$('#home').hidden=false;renderGrid()}
$('#go-dots').onclick=()=>{openDotsList();say('Unir puntos')};
$('#dots-back').onclick=dotsBack;
function sizeDots(){if(!dots.f)return;const s=Math.max(160,Math.floor(Math.min(dstage.clientWidth,dstage.clientHeight-8)));
  dpaper.style.width=dpaper.style.height=s+'px';const px=Math.round(s*dpr);if(dcv.width!==px){dcv.width=dcv.height=px}drawDots(performance.now())}
new ResizeObserver(sizeDots).observe(dstage);
function dotsLoop(){cancelAnimationFrame(dots.anim);dots.last=performance.now();
  const step=t=>{if(!dots.on||!dots.f||document.hidden)return;
    if(dots.done&&dots.reveal<1)dots.reveal=Math.min(1,dots.reveal+(t-dots.last)/700);dots.last=t;drawDots(t);
    if(!(dots.done&&dots.reveal>=1))dots.anim=requestAnimationFrame(step)};
  dots.anim=requestAnimationFrame(step)}
function drawDots(now){const f=dots.f;if(!f||!dcv.width)return;const W=dcv.width,s=W/400,x=dcx;
  x.setTransform(1,0,0,1,0,0);x.fillStyle='#FFFFFF';x.fillRect(0,0,W,W);x.setTransform(s,0,0,s,0,0);x.lineJoin=x.lineCap='round';
  if(dots.done){drawFigure(x,f,dots.reveal);return}
  const P=f.p;x.strokeStyle=INK;x.lineWidth=5;x.beginPath();for(let i=0;i<dots.next;i++){const q=P[i];i?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1])}x.stroke();
  if(dots.drag&&dots.next>0){const q=P[dots.next-1];x.save();x.setLineDash([6,9]);x.lineWidth=3;x.globalAlpha=.45;x.beginPath();x.moveTo(q[0],q[1]);x.lineTo(dots.drag[0],dots.drag[1]);x.stroke();x.restore()}
  x.textAlign='center';x.textBaseline='middle';
  P.forEach((q,i)=>{const isNext=i===dots.next,vis=i<dots.next,fl=i===dots.flash&&now<dots.flashT;
    const r=isNext&&!reduceMotion()?12+2.5*Math.sin(now/170):isNext?13:9;
    x.beginPath();x.arc(q[0],q[1],r,0,Math.PI*2);x.fillStyle=vis?INK:isNext?NEXT_C:fl?'#E8424C':'#FFFFFF';x.fill();x.lineWidth=3;x.strokeStyle=INK;x.stroke();
    x.font=`900 ${isNext?27:22}px Nunito, system-ui, sans-serif`;x.lineWidth=6;x.strokeStyle='#FFFFFF';x.strokeText(i+1,f.lab[i][0],f.lab[i][1]);
    x.fillStyle=vis?'#9AA0B4':isNext?NEXT_C:INK;x.fillText(i+1,f.lab[i][0],f.lab[i][1])})}
const reduceMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const dPt=e=>{const r=dcv.getBoundingClientRect();return[(e.clientX-r.left)/r.width*400,(e.clientY-r.top)/r.height*400]};
function nearestDot(pt){let b=-1,bd=1e9;dots.f.p.forEach((q,i)=>{const d=Math.hypot(q[0]-pt[0],q[1]-pt[1]);if(d<bd){bd=d;b=i}});return[b,bd]}
function advance(){const f=dots.f,i=dots.next;dots.next++;sfx('pop');say(String(i+1));
  $('#dots-prog').textContent=`${dots.next} / ${f.p.length}`;
  if(dots.next>=f.p.length)finishDots();else $('#dots-hint').textContent=`Muy bien. Ahora el ${dots.next+1}`}
function wrongDot(i){dots.flash=i;dots.flashT=performance.now()+650;sfx('error');$('#dots-hint').textContent=`Ese es el ${i+1}. Busca el ${dots.next+1}`}
function finishDots(){const f=dots.f;dots.done=true;dots.drag=null;dots.reveal=0;dotsLoop();
  $('#dots-name').textContent=f.name;$('#dots-hint').textContent=`¡Es ${f.say}!`;
  state.done['puntos-'+f.id]=true;save();setTimeout(()=>say(`¡Es ${f.say}!`),450);
  setTimeout(()=>{if(dots.f===f&&dots.on)dotsParty(f)},1500)}
function dotsParty(f){
  let i;do{i=Math.floor(Math.random()*PRAISE.length)}while(i===lastPraise&&PRAISE.length>1);lastPraise=i;
  const c=newCanvas(440),x=c.getContext('2d');x.drawImage(dcv,0,0,440,440);$('#party-img').src=c.toDataURL('image/jpeg',.88);
  $('#party-t').textContent=PRAISE[i];$('#party-s').textContent=`Uniste los ${f.p.length} puntos y apareció ${f.say}.`;
  $('#party-more').textContent='Ver mi dibujo';$('#party-save').hidden=true;$('#party-home').textContent='Otro dibujo';
  const p=$('#party');partyFocus=document.activeElement;p.hidden=false;
  const pf=$('#party-fx');pf.width=Math.round(innerWidth*dpr);pf.height=Math.round(innerHeight*dpr);
  confetti(pf,200);tada();setTimeout(()=>say(PRAISE[i]),900);$('#party-more').focus()}
dcv.addEventListener('pointerdown',e=>{if(!dots.f||dots.done)return;e.preventDefault();try{dcv.setPointerCapture(e.pointerId)}catch(_){}
  const pt=dPt(e),[i,d]=nearestDot(pt);
  if(d<36&&i===dots.next)advance();else if(d<30&&i>dots.next)wrongDot(i);
  dots.drag=dots.next>0&&!dots.done?pt:null;if(!dots.done)drawDots(performance.now())});
dcv.addEventListener('pointermove',e=>{if(!dots.drag||dots.done)return;const pt=dPt(e),[i,d]=nearestDot(pt);dots.drag=pt;
  if(i===dots.next&&d<24)advance()});
const dotsUp=()=>{dots.drag=null};dcv.addEventListener('pointerup',dotsUp);dcv.addEventListener('pointercancel',dotsUp);

/* ---------- rompecabezas ---------- */
const PUZ_KEY='pinta-y-brilla-puz',puzEl=$('#puz'),pcv=$('#pcv'),pcx=pcv.getContext('2d'),pstage=$('#puz-stage');
const puz={on:false,d:null,n:2,img:null,pieces:[],drag:null,done:false,anim:0,L:null,token:0,glow:0};
try{const v=+localStorage.getItem(PUZ_KEY);if([2,3,4].includes(v))puz.n=v}catch(e){}
const puzImgs={},puzList=()=>DRAWINGS.filter(d=>!d.custom&&!/^(letra|num)-/.test(d.id)).sort((a,b)=>isLocked(a)-isLocked(b));
const puzSrc=d=>'dibujos/color/'+d.id+'.webp';
function puzLoad(d){if(puzImgs[d.id])return puzImgs[d.id];
  return puzImgs[d.id]=new Promise((ok,bad)=>{const im=new Image();im.decoding='async';im.onload=()=>ok(im);im.onerror=()=>{delete puzImgs[d.id];bad(new Error('img'))};im.src=puzSrc(d)})}
function paintLevels(){document.querySelectorAll('#puz-lv button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.n===puz.n))}
function renderPuzList(){const g=$('#puz-grid');g.innerHTML='';
  if(loadState==='loading'){for(let i=0;i<5;i++)g.append(mk('div','skel'));return}
  const list=puzList();
  if(!list.length){const s=mk('div','state'),p=mk('p');p.textContent='No se pudieron cargar los rompecabezas. Revisa la conexión y vuelve a intentar.';
    const r=mk('button','act');r.textContent='Reintentar';r.onclick=()=>{loadState='loading';renderPuzList();loadCatalog()};s.append(p,r);g.append(s);return}
  list.forEach(d=>{const card=mk('div','card'),b=mk('button','open');b.setAttribute('aria-label',`Rompecabezas de ${d.name}, ${puz.n*puz.n} piezas`);
    const tape=mk('span','tape');tape.style.background=CAT_COLOR[d.cat]||'#C7B8FF';
    const im=mk('img','thumb');im.alt='';im.decoding='async';im.loading='lazy';im.src=puzSrc(d);
    const nm=mk('span','nm');nm.textContent=d.name;b.append(im,nm);b.onclick=()=>openPuz(d);card.append(tape,b);
    const pips=mk('span','pips');pips.setAttribute('aria-hidden','true');
    [2,3,4].forEach(n=>pips.append(mk('i',state.done[`puz-${d.id}-${n}`]?'on':null)));card.append(pips);
    if(isLocked(d)){card.classList.add('locked');card.append(mk('span','lockb',LOCK_SVG));b.setAttribute('aria-label',d.name+', bloqueado');b.onclick=askUnlock}
    g.append(card)})}
function showPuzScreen(){$('#home').hidden=true;$('#editor').hidden=true;puzEl.hidden=false;puz.on=true}
function openPuzList(){showPuzScreen();cancelAnimationFrame(puz.anim);puz.d=null;puz.token++;puz.pieces=[];puz.drag=null;
  $('#puz-name').textContent='Rompecabezas';$('#puz-prog').hidden=true;pcv.hidden=true;$('#puz-list').hidden=false;
  $('#puz-hint').textContent='Elige cuántas piezas y luego un dibujo';paintLevels();renderPuzList()}
async function openPuz(d){if(isLocked(d)){askUnlock();return}
  showPuzScreen();const tk=++puz.token;Object.assign(puz,{d,img:null,pieces:[],drag:null,done:false,glow:0,nextN:0});
  $('#puz-name').textContent=d.name;$('#puz-list').hidden=true;pcv.hidden=false;$('#puz-prog').hidden=true;
  $('#puz-hint').textContent='Preparando…';puzDraw();
  let img;try{img=await puzLoad(d)}catch(e){if(tk!==puz.token)return;toast('No se pudo abrir. Intenta otra vez');openPuzList();return}
  if(tk!==puz.token||!puz.on)return;puz.img=img;puzBuild();
  $('#puz-hint').textContent='Arrastra cada pieza a su lugar';say('Arma el rompecabezas')}
function puzBack(){if(!$('#party').hidden){closeParty();return}if(puz.d)openPuzList();else leavePuz()}
function leavePuz(){puz.on=false;puz.d=null;puz.token++;cancelAnimationFrame(puz.anim);stopVoice();puzEl.hidden=true;$('#home').hidden=false;renderGrid()}
$('#go-puz').onclick=()=>{openPuzList();say('Rompecabezas')};
$('#puz-back').onclick=puzBack;
document.querySelectorAll('#puz-lv button').forEach(b=>b.onclick=()=>{const n=+b.dataset.n;if(n===puz.n&&!puz.done)return;puz.n=n;
  try{localStorage.setItem(PUZ_KEY,String(n))}catch(e){}paintLevels();sfx('pop');
  if(puz.d&&puz.img)puzBuild();else renderPuzList()});

/* forma de cada pieza: bordes con pestañas que encajan con la vecina (+1 hacia abajo/derecha, -1 al revés) */
const TAB=[[.34,0],[.40,0,.42,.06,.39,.12],[.34,.22,.42,.31,.5,.31],[.58,.31,.66,.22,.61,.12],[.58,.06,.60,0,.66,0]];
function edgeTo(x,ax,ay,bx,by,nx,ny,dir,c){
  if(!dir){x.lineTo(bx,by);return}
  const P=(t,h)=>[ax+(bx-ax)*t+nx*h*c*dir,ay+(by-ay)*t+ny*h*c*dir];
  /* la curva es simétrica: sirve igual en los dos sentidos del recorrido */
  x.lineTo(...P(TAB[0][0],TAB[0][1]));
  for(let k=1;k<5;k++){const s=TAB[k];x.bezierCurveTo(...P(s[0],s[1]),...P(s[2],s[3]),...P(s[4],s[5]))}
  x.lineTo(bx,by)}
function piecePath(x,p,ox,oy,c){const{i,j}=p,n=puz.n,E=puz.E;
  const top=i?E.h[i][j]:0,bot=i<n-1?E.h[i+1][j]:0,lef=j?E.v[i][j]:0,rig=j<n-1?E.v[i][j+1]:0;
  x.beginPath();x.moveTo(ox,oy);
  edgeTo(x,ox,oy,ox+c,oy,0,1,top,c);
  edgeTo(x,ox+c,oy,ox+c,oy+c,1,0,rig,c);
  edgeTo(x,ox+c,oy+c,ox,oy+c,0,1,bot,c);
  edgeTo(x,ox,oy+c,ox,oy,1,0,lef,c);
  x.closePath()}
function puzLayout(){const W=pstage.clientWidth,H=pstage.clientHeight;if(W<50||H<50)return null;
  const tall=H>W*1.1,gap=12;let B,bx,by,tray;
  if(tall){B=Math.floor(Math.min(W-16,H*.56));bx=(W-B)/2;by=6;tray={x:6,y:by+B+gap,w:W-12,h:H-(by+B+gap)-4}}
  else{B=Math.floor(Math.min(H-12,W*.56));by=(H-B)/2;bx=Math.max(8,(W-B*1.95)/2);tray={x:bx+B+gap,y:6,w:W-bx-B-gap-6,h:H-12}}
  const c=B/puz.n,pad=Math.ceil(c*.34);return{W,H,B,bx,by,c,pad,tray}}
function puzSlots(L,count){const t=L.tray,ratio=t.w/Math.max(1,t.h);
  let cols=Math.max(1,Math.round(Math.sqrt(count*ratio)));let rows=Math.ceil(count/cols);
  while(cols>1&&Math.ceil(count/(cols-1))*(t.w/(cols-1))<=t.h*1.05&&(cols-1)*rows>=count)cols--;rows=Math.ceil(count/cols);
  const sw=t.w/cols,sh=t.h/rows,s=Math.max(.42,Math.min(1,Math.min(sw,sh)/(L.c*1.45)));
  return{s,at:k=>[t.x+sw*(k%cols+.5),t.y+sh*(Math.floor(k/cols)+.5)]}}
function puzBuild(){const n=puz.n;cancelAnimationFrame(puz.anim);puz.done=false;puz.drag=null;puz.glow=0;
  const rnd=()=>Math.random()<.5?1:-1;
  puz.E={h:Array.from({length:n},()=>Array.from({length:n},rnd)),v:Array.from({length:n},()=>Array.from({length:n},rnd))};
  const ps=[];for(let i=0;i<n;i++)for(let j=0;j<n;j++)ps.push({i,j,x:0,y:0,s:1,ts:1,placed:false,slot:0,spr:null});
  const order=ps.map((_,k)=>k);for(let k=order.length-1;k>0;k--){const r=Math.floor(Math.random()*(k+1));[order[k],order[r]]=[order[r],order[k]]}
  order.forEach((k,z)=>{ps[k].slot=z});
  puz.pieces=order.map(k=>ps[k]);   /* orden de dibujo = orden en la bandeja */
  const pr=$('#puz-prog');pr.hidden=false;pr.textContent=`0 / ${n*n}`;
  $('#puz-hint').textContent='Arrastra cada pieza a su lugar';
  puzSize(true)}
function puzSize(fresh){if(!puz.on)return;const L=puzLayout();if(!L)return;
  pcv.style.width=L.W+'px';pcv.style.height=L.H+'px';const pw=Math.round(L.W*dpr),ph=Math.round(L.H*dpr);
  if(pcv.width!==pw||pcv.height!==ph){pcv.width=pw;pcv.height=ph}
  const old=puz.L;puz.L=L;
  if(puz.img&&puz.pieces.length){
    const sameGeom=old&&old.c===L.c;if(!sameGeom||fresh)puzSprites(L);
    const S=puzSlots(L,puz.pieces.length);puz.trayS=S.s;
    puz.pieces.forEach(p=>{if(p.placed){p.x=L.bx+(p.j+.5)*L.c;p.y=L.by+(p.i+.5)*L.c;p.s=p.ts=1}
      else if(fresh||!old||p!==puz.drag?.p){const[sx,sy]=S.at(p.slot);p.hx=sx;p.hy=sy;p.x=sx;p.y=sy;p.s=p.ts=S.s}})}
  puzDraw()}
new ResizeObserver(()=>{if(puz.on&&puz.d)puzSize(false)}).observe(pstage);
function puzSprites(L){const c=L.c,pad=L.pad,side=c+pad*2,px=Math.ceil(side*dpr),img=puz.img,iw=img.naturalWidth;
  puz.pieces.forEach(p=>{const cv=p.spr&&p.spr.width===px?p.spr:newCanvas(px),x=cv.getContext('2d');
    x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,px,px);x.setTransform(dpr,0,0,dpr,0,0);
    piecePath(x,p,pad,pad,c);x.save();x.clip();
    const k=iw/L.B;x.drawImage(img,(p.j*c-pad)*k,(p.i*c-pad)*k,side*k,side*k,0,0,side,side);x.restore();
    x.lineJoin='round';piecePath(x,p,pad,pad,c);x.strokeStyle='rgba(38,35,92,.55)';x.lineWidth=2.4;x.stroke();
    x.strokeStyle='rgba(255,255,255,.85)';x.lineWidth=1;x.stroke();p.spr=cv})}
function rr(x,X,Y,w,h,r){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath()}
function puzDraw(){const L=puz.L,x=pcx;if(!pcv.width)return;
  x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,pcv.width,pcv.height);if(!L||!puz.img)return;x.setTransform(dpr,0,0,dpr,0,0);
  const{bx,by,B,c,pad}=L;
  /* tablero: hoja con la imagen apenas visible y las siluetas de las piezas */
  x.save();x.shadowColor='rgba(38,35,92,.18)';x.shadowOffsetY=4;rr(x,bx-5,by-5,B+10,B+10,16);x.fillStyle='#FFFFFF';x.fill();x.restore();
  rr(x,bx-5,by-5,B+10,B+10,16);x.strokeStyle='#26235C';x.lineWidth=2.5;x.stroke();
  if(!puz.done){x.save();x.globalAlpha=puz.n===2?.32:puz.n===3?.24:.18;x.drawImage(puz.img,bx,by,B,B);x.restore();
    x.save();x.setLineDash([5,6]);x.strokeStyle='rgba(38,35,92,.28)';x.lineWidth=1.5;
    puz.pieces.forEach(p=>{if(!p.placed){piecePath(x,p,bx+p.j*c,by+p.i*c,c);x.stroke()}});x.restore()}
  const side=c+pad*2,draw=(p,shadow)=>{const w=side*p.s;
    if(shadow){x.save();x.shadowColor='rgba(38,35,92,.35)';x.shadowBlur=14;x.shadowOffsetY=8}
    x.drawImage(p.spr,p.x-w/2,p.y-w/2,w,w);if(shadow)x.restore()};
  if(puz.done){x.drawImage(puz.img,bx,by,B,B);
    if(puz.glow>0){x.save();x.globalAlpha=Math.max(0,1-puz.glow)*.6;x.fillStyle='#FFFFFF';x.fillRect(bx,by,B,B);x.restore()}
    return}
  puz.pieces.forEach(p=>{if(p.placed)draw(p,false)});
  puz.pieces.forEach(p=>{if(!p.placed&&p!==puz.drag?.p)draw(p,false)});
  if(puz.drag)draw(puz.drag.p,true)}
function puzTick(){cancelAnimationFrame(puz.anim);let last=performance.now();
  const step=t=>{if(!puz.on)return;const dt=Math.min(64,t-last)/1000;last=t;let busy=false;const k=reduceMotion()?1:Math.min(1,dt*14);
    puz.pieces.forEach(p=>{if(p===puz.drag?.p){if(Math.abs(p.s-1)>.005){p.s+=(1-p.s)*k;busy=true}return}
      const tx=p.placed?puz.L.bx+(p.j+.5)*puz.L.c:p.gx??p.x,ty=p.placed?puz.L.by+(p.i+.5)*puz.L.c:p.gy??p.y;
      if(Math.abs(p.x-tx)>.4||Math.abs(p.y-ty)>.4||Math.abs(p.s-p.ts)>.005){p.x+=(tx-p.x)*k;p.y+=(ty-p.y)*k;p.s+=(p.ts-p.s)*k;busy=true}
      else{p.x=tx;p.y=ty;p.s=p.ts;p.gx=p.gy=undefined}});
    if(puz.done&&puz.glow<1){puz.glow=Math.min(1,puz.glow+dt*1.6);busy=true}
    puzDraw();if(busy||puz.drag)puz.anim=requestAnimationFrame(step)};
  puz.anim=requestAnimationFrame(step)}
const pPt=e=>{const r=pcv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
function puzHit(pt){const L=puz.L;for(let k=puz.pieces.length-1;k>=0;k--){const p=puz.pieces[k];if(p.placed)continue;
    const r=L.c*p.s*.62+10;if(Math.abs(pt[0]-p.x)<r&&Math.abs(pt[1]-p.y)<r)return p}return null}
pcv.addEventListener('pointerdown',e=>{if(!puz.d||!puz.img||puz.done||puz.drag)return;e.preventDefault();
  const pt=pPt(e),p=puzHit(pt);if(!p)return;try{pcv.setPointerCapture(e.pointerId)}catch(_){}
  puz.pieces.splice(puz.pieces.indexOf(p),1);puz.pieces.push(p);p.gx=p.gy=undefined;
  puz.drag={p,id:e.pointerId,dx:p.x-pt[0],dy:p.y-pt[1]};sfx('pop');puzTick()});
pcv.addEventListener('pointermove',e=>{const d=puz.drag;if(!d||e.pointerId!==d.id)return;const pt=pPt(e),L=puz.L;
  d.p.x=Math.max(0,Math.min(L.W,pt[0]+d.dx));d.p.y=Math.max(0,Math.min(L.H,pt[1]+d.dy))});
function puzDrop(e){const d=puz.drag;if(!d||e.pointerId!==d.id)return;puz.drag=null;const p=d.p,L=puz.L;
  const tx=L.bx+(p.j+.5)*L.c,ty=L.by+(p.i+.5)*L.c;
  if(Math.hypot(p.x-tx,p.y-ty)<L.c*.36){p.placed=true;p.ts=1;
    /* las piezas puestas van al fondo para que no tapen a las sueltas */
    puz.pieces.splice(puz.pieces.indexOf(p),1);puz.pieces.unshift(p);
    const left=puz.pieces.filter(q=>!q.placed).length,tot=puz.n*puz.n;$('#puz-prog').textContent=`${tot-left} / ${tot}`;sfx('ok');
    if(!left)puzFinish();else if(left===1)$('#puz-hint').textContent='¡Falta una!';else $('#puz-hint').textContent=`¡Bien! Faltan ${left}`}
  else{const onBoard=p.x>L.bx&&p.x<L.bx+L.B&&p.y>L.by&&p.y<L.by+L.B;
    if(onBoard){p.gx=p.hx;p.gy=p.hy;p.ts=puz.trayS;sfx('error');$('#puz-hint').textContent='Esa va en otro lugar. Mira la forma'}
    else{p.ts=puz.trayS}}
  puzTick()}
pcv.addEventListener('pointerup',puzDrop);
if(/[?&]prueba\b/.test(location.search))window.__t={puz,pcv};pcv.addEventListener('pointercancel',puzDrop);
function puzFinish(){const d=puz.d,n=puz.n;puz.done=true;puz.glow=0;state.done[`puz-${d.id}-${n}`]=true;save();
  $('#puz-hint').textContent=`¡Armaste ${d.say||d.name}!`;setTimeout(()=>say(`¡Muy bien! Es ${d.say||d.name}`),350);puzTick();
  setTimeout(()=>{if(puz.d===d&&puz.on&&puz.done)puzParty(d)},1400)}
function puzParty(d){let i;do{i=Math.floor(Math.random()*PRAISE.length)}while(i===lastPraise&&PRAISE.length>1);lastPraise=i;
  const c=newCanvas(440),x=c.getContext('2d');x.drawImage(puz.img,0,0,440,440);$('#party-img').src=c.toDataURL('image/jpeg',.88);
  const next=puz.n<4?puz.n+1:0;
  $('#party-t').textContent=PRAISE[i];$('#party-s').textContent=`Armaste las ${puz.n*puz.n} piezas.`+(next?` ¿Pruebas con ${next*next}?`:'');
  $('#party-more').textContent=next?`Probar con ${next*next} piezas`:'Ver mi rompecabezas';$('#party-save').hidden=true;$('#party-home').textContent='Otro rompecabezas';
  puz.nextN=next;
  const p=$('#party');partyFocus=document.activeElement;p.hidden=false;
  const pf=$('#party-fx');pf.width=Math.round(innerWidth*dpr);pf.height=Math.round(innerHeight*dpr);
  confetti(pf,200);tada();setTimeout(()=>say(PRAISE[i]),900);$('#party-more').focus()}

/* ---------- efectos ---------- */
let toastT;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2200)}
function confetti(target=fx,count=120){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const x=target.getContext('2d'),Wd=target.width,Hh=target.height;
  const ps=Array.from({length:count},()=>({x:Wd/2+(Math.random()-.5)*Wd*.2,y:Hh*.45,vx:(Math.random()-.5)*Wd*.028,vy:-(Math.random()*Hh*.028+Hh*.008),
    r:(3+Math.random()*5)*dpr,c:COLORS[Math.floor(Math.random()*16)][0],a:Math.random()*6,va:(Math.random()-.5)*.3}));
  const t0=performance.now();
  (function step(t){x.clearRect(0,0,Wd,Hh);ps.forEach(p=>{p.vy+=Hh*.0008;p.x+=p.vx;p.y+=p.vy;p.a+=p.va;
    x.save();x.translate(p.x,p.y);x.rotate(p.a);x.fillStyle=p.c;x.fillRect(-p.r,-p.r/2,p.r*2,p.r);x.restore()});
    if(t-t0<2400)requestAnimationFrame(step);else x.clearRect(0,0,Wd,Hh)})(t0);
}

/* ---------- tamaño ---------- */
const stage=$('#stage'),paper=$('#paper');
function resize(){
  if(!ed.on)return;
  const s=Math.max(160,Math.floor(Math.min(stage.clientWidth,stage.clientHeight-8)));
  paper.style.width=paper.style.height=s+'px';
  /* con zoom se dibuja con más píxeles para que las líneas no se vean borrosas (con tope para no gastar memoria) */
  const cap=(navigator.deviceMemory||4)<=2?1200:1600,base=cv.clientWidth*dpr,px=Math.round(Math.max(base,Math.min(cap,base*zoom.s)));
  if(px>0&&cv.width!==px){if(active){active=null;save()}[cv,fx,L,T,K,B].forEach(c=>{c.width=c.height=px});layerKey=''}
  render();
}
new ResizeObserver(resize).observe(stage);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(req);
renderGrid();loadCustom();loadCatalog();
})();
if('serviceWorker' in navigator&&location.protocol!=='file:'&&!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform())){addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))}
