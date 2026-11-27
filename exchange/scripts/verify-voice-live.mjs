// Run only on a host with an installed, warmed VoiceStudio model.
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {createVoiceBridge} from './voice-bridge.mjs';
import {inspectWav} from './voice-wav.mjs';
const origin='http://127.0.0.1:3910';
const s=createVoiceBridge();
await new Promise((resolve,reject)=>{s.once('error',reject);s.listen(3910,'127.0.0.1',resolve)});
try{
 const health=await fetch(origin+'/engine/status',{signal:AbortSignal.timeout(5000)});
 assert.equal((await health.json()).available,true,'VoiceStudio API unreachable or authentication failed. Start the engine and verify its key.');
 const start=performance.now();
 const r=await fetch(origin+'/engine/speech',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({input:'Welcome to BirrEX Academy. This is an educational voice generation test.',speed:1}),signal:AbortSignal.timeout(190000)});
 assert.equal(r.status,200,'VoiceStudio inference failed: '+(r.ok?'':await r.text()));
 assert.match(r.headers.get('content-type')||'',/^audio\/wav/);
 const wav=Buffer.from(await r.arrayBuffer()),metadata=inspectWav(wav);
 assert.ok(metadata&&metadata.durationSeconds>=0.5,'No usable speech-duration WAV returned');
 const output=process.argv[2];if(output)writeFileSync(output,wav,{flag:'wx'});
 console.log(JSON.stringify({inference:'passed',...metadata,elapsedMs:Math.round(performance.now()-start),audioSaved:!!output}));
}finally{await new Promise(resolve=>s.close(resolve))}
