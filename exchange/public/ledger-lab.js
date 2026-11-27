'use strict';
// Educational accounting dataset: integer USD cents, not customer assets.
const ACCOUNTS=Object.freeze({cash:'Virtual cash',btc:'Bitcoin practice allocation',eth:'Ethereum practice allocation',reserve:'Practice reserve',capital:'Sample capital',expense:'Practice expenses'});
const JOURNAL=Object.freeze([
 {id:'LAB-001',date:'2026-11-01',memo:'Opening fictional capital',lines:[['cash',1000000],['capital',-1000000]]},
 {id:'LAB-002',date:'2026-11-03',memo:'Sample BTC allocation',lines:[['btc',300000],['cash',-300000]]},
 {id:'LAB-003',date:'2026-11-04',memo:'Sample ETH allocation',lines:[['eth',200000],['cash',-200000]]},
 {id:'LAB-004',date:'2026-11-05',memo:'Sample reserve allocation',lines:[['reserve',100000],['cash',-100000]]},
 {id:'LAB-005',date:'2026-11-06',memo:'Illustrative operating expense',lines:[['expense',1250],['cash',-1250]]}
]);
function reconcile(entries){
 const balances=Object.fromEntries(Object.keys(ACCOUNTS).map(a=>[a,0]));const ids=new Set();const errors=[];
 for(const e of entries){if(!e||typeof e.id!=='string'||ids.has(e.id)||!Array.isArray(e.lines)||e.lines.length<2){errors.push('Invalid or duplicate journal');continue}ids.add(e.id);
 let total=0,valid=true,positive=false,negative=false;
 for(const line of e.lines){if(!Array.isArray(line)||line.length!==2||!Object.hasOwn(ACCOUNTS,line[0])||!Number.isSafeInteger(line[1])||line[1]===0){valid=false;break}total+=line[1];positive||=line[1]>0;negative||=line[1]<0;if(!Number.isSafeInteger(total)){valid=false;break}}
 if(!valid||!positive||!negative||total!==0){errors.push(e.id+': invalid or unbalanced');continue}
 const next={...balances};for(const [a,v] of e.lines)next[a]+=v;if(Object.values(next).some(v=>!Number.isSafeInteger(v))){errors.push(e.id+': overflow');continue}Object.assign(balances,next)}
 const debit=Object.values(balances).reduce((s,v)=>s+Math.max(0,v),0),credit=Object.values(balances).reduce((s,v)=>s+Math.max(0,-v),0);
 return {ok:errors.length===0&&debit===credit,errors,balances,debit,credit,netAssets:balances.cash+balances.btc+balances.eth+balances.reserve};
}
const money=v=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(v/100);
function filteredJournal(q,account){const term=String(q||'').trim().toLowerCase();return JOURNAL.filter(e=>(e.id+' '+e.memo+' '+e.date).toLowerCase().includes(term)&&(account==='all'||e.lines.some(l=>l[0]===account)))}
function csvStatement(entries){const escape=v=>'"'+String(v).replace(/"/g,'""')+'"';return ['DEMO ONLY,NOT A FINANCIAL STATEMENT','Journal,Date,Description,Account,Debit USD,Credit USD',...entries.flatMap(e=>e.lines.map(([a,v])=>[e.id,e.date,e.memo,ACCOUNTS[a],(Math.max(0,v)/100).toFixed(2),(Math.max(0,-v)/100).toFixed(2)].map(escape).join(',')))].join('\r\n')}
function mount(){const $=id=>document.getElementById(id);const make=(tag,v)=>{const n=document.createElement(tag);n.textContent=v;return n};const result=reconcile(JOURNAL);$('net-assets').textContent=money(result.netAssets);$('debit').textContent=money(result.debit);$('credit').textContent=money(result.credit);$('reconcile').textContent=result.ok?'BALANCED · SAMPLE ONLY':'REVIEW REQUIRED';$('performance').textContent=money(result.netAssets-1000000)+' sample change since opening allocation; no live performance.';
 for(const a of ['cash','btc','eth','reserve']){const v=result.balances[a],row=document.createElement('div');row.className='allocation-row';row.append(make('span',ACCOUNTS[a]),make('strong',money(v)));const bar=document.createElement('progress');bar.max=result.netAssets;bar.value=v;bar.setAttribute('aria-label',ACCOUNTS[a]+' allocation');row.append(bar);$('allocations').append(row)}
 for(const [a,label] of Object.entries(ACCOUNTS)){const opt=make('option',label);opt.value=a;$('account').append(opt)}
 const render=()=>{const entries=filteredJournal($('search').value,$('account').value);const body=$('journal');body.replaceChildren();for(const e of entries)for(const [a,v] of e.lines){const row=document.createElement('tr');for(const cell of [e.id,e.date,e.memo,ACCOUNTS[a],v>0?money(v):'—',v<0?money(-v):'—'])row.append(make('td',cell));body.append(row)}$('entry-count').textContent=entries.length+' sample journals'};
 $('search').oninput=render;$('account').onchange=render;$('export').onclick=()=>{const url=URL.createObjectURL(new Blob([csvStatement(filteredJournal($('search').value,$('account').value))],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='birrex-demo-ledger.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 $('integrity-test').onclick=()=>{$('test-result').textContent=reconcile([...JOURNAL,{id:'LAB-TEST',lines:[['cash',100],['capital',-99]]}]).ok?'Unexpected result':'PASS: intentionally unbalanced sample rejected.'};
 render();try{document.documentElement.dataset.theme=localStorage.getItem('birrex.theme')==='light'?'light':'dark'}catch{}
}
if(typeof document!=='undefined')mount();