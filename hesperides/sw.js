const CACHE='heldkraft-hesperides-v1-4-launch';
const ASSETS=['./','./index.html','./styles.css','./app.js','./ui.js','./state.js','./core.js','./portions.js','./picker-ui.js','./food-db.js','./manifest.webmanifest','./icon.svg','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install',e=>e.waitUntil(
  caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())
));
self.addEventListener('activate',e=>e.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('heldkraft-hesperides-')&&k!==CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim())
));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin!==self.location.origin||!url.pathname.includes('/hesperides/'))return;
  const shell=e.request.mode==='navigate'||/\.(?:css|js|html)$/.test(url.pathname);
  if(shell){
    e.respondWith(fetch(e.request).then(response=>{
      if(response.ok)caches.open(CACHE).then(c=>c.put(e.request,response.clone())).catch(()=>{});
      return response;
    }).catch(()=>caches.match(e.request).then(x=>x||caches.match(url.origin+url.pathname)).then(x=>x||caches.match('./index.html'))));
  }else{
    e.respondWith(caches.match(e.request).then(x=>x||fetch(e.request).then(response=>{
      if(response.ok)caches.open(CACHE).then(c=>c.put(e.request,response.clone())).catch(()=>{});
      return response;
    })));
  }
});