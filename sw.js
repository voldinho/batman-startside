const CACHE='batman-startside-v73';
const CORE=['./','./index.html','./manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE))));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET') return;
 if(new URL(e.request.url).pathname.endsWith('/news.json')){e.respondWith(fetch(e.request,{cache:'no-store'}));return;}
 const u=new URL(e.request.url);
 if(u.origin===location.origin){
  e.respondWith(fetch(e.request).then(r=>{
   const copy=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); return r;
  }).catch(()=>caches.match(e.request)));
 }
});