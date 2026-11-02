/* Funciona sin internet: guarda la app en el dispositivo la primera vez que se abre */
const CACHE='pinta-y-brilla-521949b980';
const FILES=['./', 'index.html', 'styles.css', 'app.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'fonts/nunito-latin-600-normal.woff2', 'fonts/nunito-latin-800-normal.woff2', 'fonts/nunito-latin-900-normal.woff2', 'fonts/sniglet-latin-800-normal.woff2', 'dibujos/arbol.png', 'dibujos/arcoiris.png', 'dibujos/auto.png', 'dibujos/barco.png', 'dibujos/buho.png', 'dibujos/calabaza.png', 'dibujos/casita.png', 'dibujos/cohete.png', 'dibujos/conejo.png', 'dibujos/cupcake.png', 'dibujos/dibujos.json', 'dibujos/dino.png', 'dibujos/dona.png', 'dibujos/fantasma.png', 'dibujos/flor.png', 'dibujos/gatito-bruja.png', 'dibujos/gato.png', 'dibujos/globo.png', 'dibujos/helado.png', 'dibujos/hongo.png', 'dibujos/letra-a.png', 'dibujos/letra-b.png', 'dibujos/letra-c.png', 'dibujos/letra-d.png', 'dibujos/letra-e.png', 'dibujos/letra-enie.png', 'dibujos/letra-f.png', 'dibujos/letra-g.png', 'dibujos/letra-h.png', 'dibujos/letra-i.png', 'dibujos/letra-j.png', 'dibujos/letra-k.png', 'dibujos/letra-l.png', 'dibujos/letra-m.png', 'dibujos/letra-n.png', 'dibujos/letra-o.png', 'dibujos/letra-p.png', 'dibujos/letra-q.png', 'dibujos/letra-r.png', 'dibujos/letra-s.png', 'dibujos/letra-t.png', 'dibujos/letra-u.png', 'dibujos/letra-v.png', 'dibujos/letra-w.png', 'dibujos/letra-x.png', 'dibujos/letra-y.png', 'dibujos/letra-z.png', 'dibujos/llama.png', 'dibujos/mariquita.png', 'dibujos/murcielago.png', 'dibujos/num-1.png', 'dibujos/num-10.png', 'dibujos/num-2.png', 'dibujos/num-3.png', 'dibujos/num-4.png', 'dibujos/num-5.png', 'dibujos/num-6.png', 'dibujos/num-7.png', 'dibujos/num-8.png', 'dibujos/num-9.png', 'dibujos/paleta.png', 'dibujos/perro.png', 'dibujos/pez.png', 'dibujos/pulpo.png', 'dibujos/sol.png', 'dibujos/torta.png', 'dibujos/tortuga.png', 'dibujos/tren.png'];
/* además de los archivos fijos, guarda los audios de voz/ si existen (voz/voz.json los lista) */
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(async c=>{
  await c.addAll(FILES);
  try{const r=await fetch('voz/voz.json',{cache:'no-cache'});if(r.ok){const j=await r.clone().json();await c.put('voz/voz.json',r);
    const fs=Object.values((j&&j.clips)||{}).filter(f=>typeof f==='string'&&/^[a-z0-9-]{1,80}\.(mp3|ogg|m4a|wav)$/.test(f)).map(f=>'voz/'+f);
    await c.addAll(fs)}}catch(err){}
}).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('pinta-y-brilla-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(hit=>hit||fetch(r).then(res=>{
    if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(r,copy))}return res}).catch(()=>caches.match('index.html'))))
});
