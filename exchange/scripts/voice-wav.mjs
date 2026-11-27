// Validate a finite, nonempty RIFF/WAVE audio container, not just magic bytes.
export function inspectWav(bytes){
 if(!Buffer.isBuffer(bytes)||bytes.length<44||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WAVE')return null;
 const end=bytes.readUInt32LE(4)+8;if(end>bytes.length||end<44)return null;
 let fmt=null,data=0;
 for(let at=12;at+8<=end;){
  const tag=bytes.toString('ascii',at,at+4),n=bytes.readUInt32LE(at+4),start=at+8;
  if(n>end-start)return null;
  if(tag==='fmt '&&n>=16){const format=bytes.readUInt16LE(start),channels=bytes.readUInt16LE(start+2),sampleRate=bytes.readUInt32LE(start+4),byteRate=bytes.readUInt32LE(start+8),blockAlign=bytes.readUInt16LE(start+12);if(![1,3,65534].includes(format)||channels<1||channels>32||sampleRate<8000||sampleRate>384000||!byteRate||!blockAlign)return null;fmt={channels,sampleRate,byteRate,blockAlign}}
  if(tag==='data')data+=n;
  at=start+n+(n%2);
 }
 if(!fmt||data<fmt.blockAlign)return null;
 return {channels:fmt.channels,sampleRate:fmt.sampleRate,bytes:data,durationSeconds:data/fmt.byteRate};
}
