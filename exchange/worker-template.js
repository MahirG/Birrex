const ISSUER='https://twilight-shadow-6cc0.cloudflareaccess.com';
const AUDIENCE='3043cccab1eab257a716296e7530dbe7d1ab39a92f6b313ec1ac1864ab697f28';
const locales=['en','am','om'],themes=['dark','light'];
const validPreferences=(locale,theme)=>locales.includes(locale)&&themes.includes(theme);
const validClaims=(c,now)=>c&&c.iss===ISSUER&&Array.isArray(c.aud)&&c.aud.includes(AUDIENCE)&&Number.isFinite(c.exp)&&c.exp>now&&Number.isFinite(c.iat)&&c.iat<=now+60&&(!('nbf' in c)||(Number.isFinite(c.nbf)&&c.nbf<=now))&&typeof c.sub==='string'&&c.sub.length>0&&c.sub.length<=200;
function decode64(s){if(!/^[A-Za-z0-9_-]+$/.test(s))throw Error('Invalid encoding');const x=s.replace(/-/g,'+').replace(/_/g,'/');return Uint8Array.from(atob(x.padEnd(Math.ceil(x.length/4)*4,'=')),c=>c.charCodeAt(0))}
let jwksCache=null;
async function verifiedSubject(req){
 try{
 const token=req.headers.get('Cf-Access-Jwt-Assertion');if(!token||token.length>8192)return null;
 const parts=token.split('.');if(parts.length!==3)return null;
 const decoder=new TextDecoder();const header=JSON.parse(decoder.decode(decode64(parts[0])));const claims=JSON.parse(decoder.decode(decode64(parts[1])));
 if(header.alg!=='RS256'||typeof header.kid!=='string'||!validClaims(claims,Math.floor(Date.now()/1000)))return null;
 if(!jwksCache||jwksCache.expires<Date.now()||!jwksCache.keys.some(k=>k.kid===header.kid)){
 const response=await fetch(ISSUER+'/cdn-cgi/access/certs',{signal:AbortSignal.timeout(5000)});if(!response.ok)return null;const data=await response.json();if(!Array.isArray(data.keys))return null;jwksCache={keys:data.keys,expires:Date.now()+300000};
 }
 const jwk=jwksCache.keys.find(k=>k.kid===header.kid&&k.kty==='RSA');if(!jwk)return null;
 const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 const valid=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode64(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1]));
 return valid?claims.sub:null;
 }catch{return null}
}
const privateHeaders={'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; style-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"};
function privatePage(locale,theme,saved=false){const options=(values,labels,current)=>values.map((v,i)=>'<option value="'+v+'"'+(v===current?' selected':'')+'>'+labels[i]+'</option>').join('');return '<!doctype html><html lang="en" data-theme="'+theme+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BirrEX private beta</title><link rel="stylesheet" href="/styles.css"></head><body><header class="top"><a class="brand" href="/">Birr<em>EX</em></a><span class="tag">0.4.0</span></header><main><section class="panel"><span class="kicker">IDENTITY &amp; SECURITY</span><h1>Private beta workspace</h1><p>Authenticated through Cloudflare Access. Preferences are saved to the BirrEX database. No financial account, identity documents or payment information is collected.</p><p role="status">'+(saved?'Preferences saved.':'Your private preferences')+'</p><form method="post" action="/private-beta"><label>Preferred language<select name="locale">'+options(locales,['English','አማርኛ','Afaan Oromo'],locale)+'</select></label><label>Preferred theme<select name="theme">'+options(themes,['Dark','Light'],theme)+'</select></label><button class="primary">Save preferences</button></form><a class="legal" href="/market-insights">Read-only market insights</a><a class="legal" href="/cdn-cgi/access/logout">Sign out of Access</a><a href="/">Back to exchange</a></section></main></body></html>'}
async function privateBeta(req,env){const subject=await verifiedSubject(req);if(!subject)return new Response('Private beta: verified Cloudflare Access session required.',{status:403,headers:{'Cache-Control':'no-store'}});if(!env.IDENTITY)return new Response('Identity database unavailable.',{status:503,headers:{'Cache-Control':'no-store'}});if(req.method==='POST'){if(req.headers.get('Origin')!==new URL(req.url).origin||!/^application\/x-www-form-urlencoded(?:;|$)/i.test(req.headers.get('Content-Type')||''))return new Response('Invalid origin or content type',{status:403});const reader=req.body?.getReader();if(!reader)return new Response('Invalid body',{status:400});let total=0;const decoder=new TextDecoder();let body='';for(;;){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>1024){await reader.cancel();return new Response('Request too large',{status:413})}body+=decoder.decode(value,{stream:true})}body+=decoder.decode();const data=new URLSearchParams(body),locale=data.get('locale'),theme=data.get('theme');if(!validPreferences(locale,theme))return new Response('Invalid preferences',{status:400});await env.IDENTITY.prepare('INSERT INTO beta_preferences(subject,locale,theme,updated_at) VALUES(?,?,?,?) ON CONFLICT(subject) DO UPDATE SET locale=excluded.locale,theme=excluded.theme,updated_at=excluded.updated_at').bind(subject,locale,theme,Math.floor(Date.now()/1000)).run();return new Response(null,{status:303,headers:{Location:'/private-beta?saved=1','Cache-Control':'no-store'}})}
 if(req.method!=='GET'&&req.method!=='HEAD')return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD, POST'}});
 const row=await env.IDENTITY.prepare('SELECT locale,theme FROM beta_preferences WHERE subject=?').bind(subject).first();const locale=row&&locales.includes(row.locale)?row.locale:'en',theme=row&&themes.includes(row.theme)?row.theme:'dark';return new Response(req.method==='HEAD'?null:privatePage(locale,theme,new URL(req.url).searchParams.get('saved')==='1'),{headers:privateHeaders})}
const marketIds={1:['BTC','Bitcoin'],1027:['ETH','Ethereum'],825:['USDT','Tether'],5426:['SOL','Solana'],1839:['BNB','BNB']};
const MARKET_TTL=900,MARKET_RETENTION=7*86400;
const finiteOrNull=n=>Number.isFinite(n)&&n>=0?n:null;
function normalizeQuotes(data,now=Date.now()){
 if(!data||data.status?.error_code!==0||!data.data)return [];
 const items=Array.isArray(data.data)?data.data:Object.values(data.data).flat();
 return Object.entries(marketIds).flatMap(([id,[symbol,name]])=>{
  const item=items.find(x=>String(x?.id)===id);
  const q=Array.isArray(item?.quote)?item.quote.find(x=>x.symbol==='USD'):item?.quote?.USD;
  const stamp=Date.parse(q?.last_updated||item?.last_updated);
  if(!q||!Number.isFinite(q.price)||q.price<=0||!Number.isFinite(q.percent_change_24h)||!Number.isFinite(stamp)||stamp>now+300000)return [];
  return [{symbol,name,price:q.price,change24h:q.percent_change_24h,marketCap:finiteOrNull(q.market_cap),volume24h:finiteOrNull(q.volume_24h),updatedAt:new Date(stamp).toISOString()}];
 });
}
function parsePayload(s){try{const a=JSON.parse(s);return Array.isArray(a)?a.filter(q=>Object.values(marketIds).some(([symbol])=>symbol===q.symbol)&&Number.isFinite(q.price)&&q.price>0&&Number.isFinite(Date.parse(q.updatedAt))):[]}catch{return[]}}
async function marketSnapshot(env){
 const db=env.IDENTITY;const now=Math.floor(Date.now()/1000);
 if(!db)return {state:'unavailable',quotes:[],history:[],fetchedAt:0};
 let row=await db.prepare('SELECT attempted_at,fetched_at,payload FROM market_cache WHERE id=1').first();
 if(env.CMC_API_KEY&&(!row||now-row.attempted_at>=MARKET_TTL)){
  const lease=await db.prepare('UPDATE market_cache SET attempted_at=? WHERE id=1 AND attempted_at<=? RETURNING attempted_at').bind(now,now-MARKET_TTL).first();
  if(lease){
   try{
    const response=await fetch('https://pro-api.coinmarketcap.com/v3/cryptocurrency/quotes/latest?id=1,1027,825,5426,1839&convert=USD',{headers:{'X-CMC_PRO_API_KEY':env.CMC_API_KEY,Accept:'application/json'},signal:AbortSignal.timeout(6000)});
    if(response.ok){
     const quotes=normalizeQuotes(await response.json());
     if(quotes.length){
      const writes=[db.prepare('UPDATE market_cache SET fetched_at=?,payload=? WHERE id=1 AND attempted_at=?').bind(now,JSON.stringify(quotes),now),...quotes.map(q=>db.prepare('INSERT OR IGNORE INTO market_observations(symbol,observed_at,price) VALUES(?,?,?)').bind(q.symbol,Math.floor(Date.parse(q.updatedAt)/1000),q.price)),db.prepare('DELETE FROM market_observations WHERE observed_at<?').bind(now-MARKET_RETENTION)];
      await db.batch(writes);
     }
    }
   }catch{/* stale cache retained; attempt lease throttles upstream errors */}
   row=await db.prepare('SELECT attempted_at,fetched_at,payload FROM market_cache WHERE id=1').first();
  }
 }
 const quotes=parsePayload(row?.payload||'[]');const age=now-(row?.fetched_at||0);
 const state=quotes.length?(age>MARKET_TTL*2?'stale':'available'):(env.CMC_API_KEY?'unavailable':'not_configured');
 const history=quotes.length?(await db.prepare('SELECT symbol,observed_at,price FROM market_observations WHERE observed_at>=? ORDER BY observed_at ASC LIMIT 4000').bind(now-MARKET_RETENTION).all()).results:[];
 return {state,quotes,history,fetchedAt:row?.fetched_at||0,refreshSeconds:MARKET_TTL};
}
const htmlEscape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function marketPage(req,env){
 if(!['GET','HEAD'].includes(req.method))return new Response('Read-only page',{status:405,headers:{Allow:'GET, HEAD'}});
 let snapshot;try{snapshot=await marketSnapshot(env)}catch{snapshot={state:'unavailable',quotes:[],history:[],fetchedAt:0,refreshSeconds:MARKET_TTL}}
 const template=assets['/market-insights'].body;const payload=htmlEscape(JSON.stringify(snapshot));
 return new Response(req.method==='HEAD'?null:template.replace('data-market="__MARKET__"','data-market="'+payload+'"'),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow','Content-Security-Policy':"default-src 'none'; style-src 'self'; script-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"}});
}
export default {async fetch(request,env,ctx){const u=new URL(request.url),path=u.pathname==='/index.html'?'/':u.pathname;if(path==='/private-beta'){try{return await privateBeta(request,env)}catch{return new Response('Private beta temporarily unavailable',{status:503,headers:{'Cache-Control':'no-store'}})}}if(path==='/market-insights')return marketPage(request,env);if(path==='/api/market')return new Response('Market information is displayed within BirrEX.',{status:410,headers:{'Cache-Control':'no-store'}});const headers={'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow','Permissions-Policy':'camera=(), microphone=(), geolocation=()','Content-Security-Policy':"default-src 'none'; style-src 'self'; script-src 'self'; img-src 'self' data:; manifest-src 'self'; worker-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",'Cache-Control':'no-cache'};if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{...headers,Allow:'GET, HEAD'}});const a=Object.hasOwn(assets,path)?assets[path]:null;if(!a)return new Response(request.method==='HEAD'?null:'Not found',{status:404,headers});return new Response(request.method==='HEAD'?null:a.body,{headers:{...headers,'Content-Type':a.type}})}};