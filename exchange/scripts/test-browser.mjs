import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {chromium,firefox,webkit} from 'playwright';
const map={"/":["index.html","text/html; charset=utf-8"],"/styles.css":["styles.css","text/css; charset=utf-8"],"/app.js":["app.js","text/javascript; charset=utf-8"],"/vendor/react.js":["vendor/react.js","text/javascript; charset=utf-8"],"/vendor/react-dom.js":["vendor/react-dom.js","text/javascript; charset=utf-8"],"/manifest.webmanifest":["manifest.webmanifest","application/manifest+json"],"/sw.js":["sw.js","text/javascript; charset=utf-8"],"/icon.svg":["icon.svg","image/svg+xml"],"/icon-192.svg":["icon-192.svg","image/svg+xml"],"/market-insights":["market-insights.html","text/html; charset=utf-8"],"/market-insights.js":["market-insights.js","text/javascript; charset=utf-8"],"/p2p-lab":["p2p-lab.html","text/html; charset=utf-8"],"/p2p-lab.js":["p2p-lab.js","text/javascript; charset=utf-8"],"/ledger-lab":["ledger-lab.html","text/html; charset=utf-8"],"/ledger-lab.js":["ledger-lab.js","text/javascript; charset=utf-8"],"/readiness":["readiness.html","text/html; charset=utf-8"],"/motion.js":["motion.js","text/javascript; charset=utf-8"],"/status":["status.html","text/html; charset=utf-8"],"/status.js":["status.js","text/javascript; charset=utf-8"],"/licenses/react.txt":["../LICENSE.react","text/plain; charset=utf-8"]};
const assets=Object.fromEntries(Object.entries(map).map(([path,[file,type]])=>[path,{body:readFileSync(new URL('../public/'+file,import.meta.url),'utf8'),type}]));
const worker=readFileSync(new URL('../worker-template.js',import.meta.url),'utf8');
const handler=new Function('assets',worker.replace('export default','return'))(assets);
const now=Math.floor(Date.now()/1000);
const fixture={symbol:'BTC',name:'Bitcoin',price:100,change24h:1,marketCap:1000,volume24h:200,updatedAt:new Date(now*1000).toISOString()};
const row={attempted_at:now,fetched_at:now,payload:JSON.stringify([fixture]),quote_count:1};
const env={IDENTITY:{prepare(sql){return {bind(){return this},async first(){return sql.includes('market_diagnostics')?{outcome:'success',checked_at:now}:row},async all(){return {results:[]}}}}}};
let origin;
const server=createServer(async(req,res)=>{try{const response=await handler.fetch(new Request(origin+req.url,{method:req.method,headers:req.headers}),env,{waitUntil(){}});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()))}catch(e){res.writeHead(500);res.end('Fixture server error');console.error(e)}});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
origin='http://127.0.0.1:'+server.address().port;
const engines={chromium,firefox,webkit};
const targets=process.argv.slice(2).length?process.argv.slice(2):Object.keys(engines);
const routes=['home','markets','trade','p2p','assets','learn','search','settings','notifications'];
const pages=['/market-insights','/p2p-lab','/ledger-lab','/readiness','/status'];
try{
 for(const engine of targets){
  assert.ok(engines[engine]);
  const browser=await engines[engine].launch({headless:true});
  try{
   for(const width of [320,390,1280]){
    const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce',serviceWorkers:'block'});
    try{
     const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
     const noOverflow=async label=>{const d=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,document:document.documentElement.scrollWidth}));assert.ok(d.document<=d.viewport+2,engine+' '+width+' '+label+' horizontal overflow '+JSON.stringify(d))};
     assert.equal((await page.goto(origin+'/#home')).status(),200);
     await page.locator('main[data-route="home"]').waitFor({state:'visible'});
     assert.equal(await page.locator('.app-skeleton').count(),0);
     for(const route of routes){await page.evaluate(value=>location.hash=value,route);await page.locator('main[data-route="'+route+'"]').waitFor({state:'visible'});await noOverflow(route)}
     await page.evaluate(()=>location.hash='home');await page.locator('main[data-route="home"]').waitFor();
     await page.locator('header .header-menu summary').click();
     const language=page.locator('#lang');await language.waitFor();
     for(const locale of ['am','om','en']){await language.selectOption(locale);await page.waitForFunction(lang=>document.documentElement.lang===lang,locale)}
     await page.keyboard.press('Escape');
     for(const path of pages){assert.equal((await page.goto(origin+path)).status(),200,path);await page.locator('main').waitFor();await noOverflow(path)}
     await page.waitForFunction(()=>document.getElementById('status-app')?.textContent==='Available');
     assert.match(await page.locator('#status-time').textContent(),/Verified cached quotes: 1/);
     assert.equal((await context.request.get(origin+'/private-beta')).status(),403);
     assert.equal((await context.request.post(origin+'/api/orders')).status(),405);
     assert.deepEqual(errors,[],engine+' '+width+' browser exceptions');
     console.log('PASS '+engine+' '+width+'px: routes, languages, status fixture and blocked endpoints');
    }finally{await context.close()}
   }
  }finally{await browser.close()}
 }
}finally{await new Promise(resolve=>server.close(resolve))}
