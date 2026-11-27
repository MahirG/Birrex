'use strict';
const PROFILES=Object.freeze([
{id:'a',name:'Demo merchant A',status:'reviewed',score:98,reviews:240,checks:['Sample identity review complete','Sample conduct review complete'],feedback:['Clear explanations in the exercise.','Responded calmly in the training case.']},
{id:'b',name:'Demo merchant B',status:'reviewed',score:94,reviews:178,checks:['Sample identity review complete','Sample conduct review complete'],feedback:['Provided clear sample terms.','Explained the practice complaint process.']},
{id:'c',name:'Demo merchant C',status:'pending',score:89,reviews:96,checks:['Sample identity review pending','Sample conduct review pending'],feedback:['Further review needed in this example.']},
{id:'d',name:'Demo merchant D',status:'restricted',score:65,reviews:30,checks:['Sample review flagged','Training restriction active'],feedback:['Example conduct concern under review.']}
]);
const CASES=Object.freeze({unclear:{label:'Unclear terms',opening:'The fictional profile provides inconsistent information.',advice:'Request a clear explanation, or stop if the information remains unclear.'},pressure:{label:'Pressure to act quickly',opening:'A scripted message pressures the participant to act immediately.',advice:'Do not act under pressure. Stop and ask for a review.'},identity:{label:'Unverified identity',opening:'The example profile has not completed its fictional verification.',advice:'Avoid proceeding with an unverified party. Escalate the concern.'}});
const ACTIONS=Object.freeze({clarify:'Ask for clarification',stop:'Stop the exercise',report:'Request safety review',dismiss:'Close with no action',restrict:'Recommend simulated restriction',educate:'Record educational feedback'});
const allowed=Object.freeze({open:['clarify','stop','report'],clarified:['stop','report'],stopped:['report'],review:['dismiss','restrict','educate'],closed:[]});
function newCase(id){return {id:Object.hasOwn(CASES,id)?id:'unclear',stage:'open',history:[]}}
function transition(c,action){
 if(!c||!Object.hasOwn(CASES,c.id)||!Object.hasOwn(allowed,c.stage)||!allowed[c.stage].includes(action))return null;
 const stage=action==='clarify'?'clarified':action==='stop'?'stopped':action==='report'?'review':'closed';
 return {id:c.id,stage,history:[...c.history,action]};
}
function filterProfiles(query,status,sort){
 const term=String(query||'').trim().toLowerCase();
 const list=PROFILES.filter(p=>p.name.toLowerCase().includes(term)&&(status==='all'||status===p.status));
 return list.sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):sort==='reviews'?b.reviews-a.reviews:b.score-a.score);
}
function labelStatus(s){return {reviewed:'Sample reviewed',pending:'Review pending',restricted:'Restricted example'}[s]||'Unknown'}
const $=id=>document.getElementById(id);
const make=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
function mount(){
 let exercise=newCase('unclear');let selected=null;
 const showProfile=id=>{const p=PROFILES.find(x=>x.id===id);if(!p)return;selected=id;$('profile').hidden=false;$('profile-name').textContent=p.name+' · fictional profile';$('profile-summary').textContent=labelStatus(p.status)+' · illustrative reputation '+p.score+'% · '+p.reviews+' sample reviews';
 $('profile-checks').replaceChildren(make('h4','Sample verification checklist'),...p.checks.map(v=>make('p','• '+v)));
 $('profile-reviews').replaceChildren(make('h4','Scripted feedback'),...p.feedback.map(v=>make('p',v)));
 $('profile-name').tabIndex=-1;$('profile-name').focus()};
 const renderProfiles=()=>{const list=filterProfiles($('merchant-search').value,$('merchant-status').value,$('merchant-sort').value);$('merchant-count').textContent=list.length+' SAMPLE PROFILES';const grid=$('merchant-grid');grid.replaceChildren();for(const p of list){const card=make('article',undefined,'lab-merchant');const header=make('div',undefined,'head');header.append(make('span',p.name.slice(-1),'coin'),make('span',labelStatus(p.status),'tag'));card.append(header,make('h3',p.name),make('p',p.score+'% sample reputation','lab-score'),make('small',p.reviews+' fictional reviews'));const b=make('button','View sample profile','outline full');b.type='button';b.addEventListener('click',()=>showProfile(p.id));card.append(b);grid.append(card)}if(!list.length)grid.append(make('p','No matching sample profiles.'));if(selected&&!list.some(p=>p.id===selected)){$('profile').hidden=true;selected=null}};
 function renderCase(){const scenario=CASES[exercise.id];const stageLabels={open:'Open exercise',clarified:'Clarification requested',stopped:'Exercise stopped',review:'Safety review pending',closed:'Practice case closed'};$('case-stage').textContent=stageLabels[exercise.stage]+' · '+scenario.label;
 const chat=$('case-chat');chat.replaceChildren(make('p','Scenario · '+scenario.opening,'lab-bubble'),make('p','Safety guidance · '+scenario.advice,'lab-bubble guidance'));
 for(const a of exercise.history){if(['clarify','stop','report'].includes(a)){chat.append(make('p','Participant · '+ACTIONS[a],'lab-bubble participant'));if(a==='clarify')chat.append(make('p','Scripted response · No further detail is available. Consider stopping or requesting a review.','lab-bubble'));if(a==='report')chat.append(make('p','System · Educational safety review opened.','lab-bubble'))}}
 const act=$('case-actions'),review=$('review-actions');act.replaceChildren();review.replaceChildren();const target=exercise.stage==='review'?review:act;
 for(const a of allowed[exercise.stage]){const b=make('button',ACTIONS[a],a==='report'?'primary':'outline');b.type='button';b.onclick=()=>{const next=transition(exercise,a);if(next){exercise=next;renderCase();$('case-stage').tabIndex=-1;$('case-stage').focus()}};target.append(b)}
 const last=exercise.history[exercise.history.length-1];$('case-review').replaceChildren(make('p',exercise.stage==='closed'?'Practice decision: '+ACTIONS[last]+'. No real action was taken.':exercise.stage==='review'?'Review the scripted concern, then choose an educational outcome.':'A safety review becomes available when the participant reports a concern.'));
 const history=$('case-history');history.replaceChildren(...exercise.history.map(a=>make('li',ACTIONS[a])));if(!exercise.history.length)history.append(make('li','Exercise started.'))}
 $('profile-close').onclick=()=>{$('profile').hidden=true;selected=null;$('merchant-search').focus()};for(const id of ['merchant-search','merchant-status','merchant-sort'])$(id).addEventListener(id==='merchant-search'?'input':'change',renderProfiles);
 $('case-select').onchange=e=>{exercise=newCase(e.target.value);renderCase()};$('reset-case').onclick=()=>{exercise=newCase($('case-select').value);renderCase()};
 try{document.documentElement.dataset.theme=localStorage.getItem('birrex.theme')==='light'?'light':'dark'}catch{}
 $('lab-theme').onclick=()=>{const t=document.documentElement.dataset.theme==='light'?'dark':'light';document.documentElement.dataset.theme=t;try{localStorage.setItem('birrex.theme',t)}catch{}};
 renderProfiles();renderCase();
}
if(typeof document!=='undefined')mount();