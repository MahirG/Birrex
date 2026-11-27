'use strict';const VERSION='0.9.6',CACHE='birrex-'+VERSION;
const PAGES=['/','/ledger-lab','/readiness','/p2p-lab'];
const STATIC=['/styles.css','/app.js','/motion.js','/vendor/react.js','/vendor/react-dom.js','/icon.svg','/icon-192.svg','/ledger-lab.js','/p2p-lab.js','/market-insights.js','/status.js'];
const versioned=p=>p+'?v='+VERSION;
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll([...PAGES,...STATIC.map(versioned),'/manifest.webmanifest'])).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('birrex-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);if(r.method!=='GET'||u.origin!==self.location.origin||u.pathname==='/private-beta'||u.pathname==='/market-insights'||u.pathname==='/status'||u.pathname.startsWith('/api/')||u.pathname.startsWith('/cdn-cgi/'))return;
 if(STATIC.includes(u.pathname)&&u.searchParams.get('v')===VERSION){e.respondWith(caches.open(CACHE).then(async c=>{const hit=await c.match(r);if(hit)return hit;const response=await fetch(r);if(response.ok)await c.put(r,response.clone());return response}));return}
 if(r.mode==='navigate'&&PAGES.includes(u.pathname)){e.respondWith(fetch(r).catch(()=>caches.open(CACHE).then(c=>c.match(u.pathname)).then(c=>c||Response.error())));}
});