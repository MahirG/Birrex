import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
const origin='http://127.0.0.1:3910',upstream='http://127.0.0.1:3900';
const files={'/voice-studio':['voice-studio.html','text/html; charset=utf-8'],'/voice-studio.js':['voice-studio.js','text/javascript; charset=utf-8'],'/voice-studio.css':['voice-studio.css','text/css; charset=utf-8']};
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; media-src blob:; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"};
let busy=false;
export function createVoiceBridge(fetcher=fetch){
return createServer(async(req,res)=>{
 const send=(status,body,type='text/plain; charset=utf-8')=>{res.writeHead(status,{...headers,'Content-Type':type});res.end(body)};
 if(req.headers.host!=='127.0.0.1:3910')return send(403,'Invalid host');
 if(req.headers.origin&&req.headers.origin!==origin)return send(403,'Invalid origin');
 const path=req.url;
 if(req.method==='GET'&&path==='/'){res.writeHead(302,{...headers,Location:'/voice-studio'});return res.end()}
 if(req.method==='GET'&&Object.hasOwn(files,path)){const [file,type]=files[path];return send(200,readFileSync(new URL('../public/'+file,import.meta.url)),type)}
 if(req.method==='GET'&&path==='/engine/status'){let available=false;try{const r=await fetcher(upstream+'/v1/audio/voices',{redirect:'error',signal:AbortSignal.timeout(3500)});available=r.ok&&Array.isArray((await r.json()).voices)}catch{}return send(200,JSON.stringify({available}),'application/json')}
 if(path!=='/engine/speech'||req.method!=='POST')return send(404,'Not found');
 if(req.headers.origin!==origin||req.headers['content-type']!=='application/json')return send(403,'Same-origin JSON required');
 if(busy)return send(429,'Engine busy');busy=true;
 try{let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>10000)return send(413,'Request too large')}let data;try{data=JSON.parse(body)}catch{return send(400,'Invalid JSON')}
 if(!data||typeof data.input!=='string'||!data.input.trim()||data.input.length>2000||![.85,1,1.15].includes(data.speed))return send(400,'Invalid input');
 const r=await fetcher(upstream+'/v1/audio/speech',{method:'POST',redirect:'error',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'tts-1',voice:'default',input:data.input.trim(),response_format:'wav',speed:data.speed}),signal:AbortSignal.timeout(120000)});
 if(!r.ok||!r.headers.get('content-type')?.startsWith('audio/')||!r.body)return send(502,'Engine unavailable');
 const parts=[];let size=0;const reader=r.body.getReader();try{while(true){const x=await reader.read();if(x.done)break;size+=x.value.length;if(size>25*1024*1024){await reader.cancel();return send(413,'Audio exceeds size limit')}parts.push(Buffer.from(x.value))}}finally{reader.releaseLock()}
 const wav=Buffer.concat(parts);if(wav.length<12||wav.toString('ascii',0,4)!=='RIFF'||wav.toString('ascii',8,12)!=='WAVE')return send(502,'Invalid WAV');
 return send(200,wav,'audio/wav');
 }catch{return send(502,'Local engine failed')}finally{busy=false}
});
}
if(process.argv[1]&&new URL('file://'+process.argv[1]).href===import.meta.url)createVoiceBridge().listen(3910,'127.0.0.1',()=>console.log('BirrEX Voice Studio: '+origin+'/voice-studio'));
