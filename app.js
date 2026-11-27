'use strict';
const menu=document.querySelector('.menu');
const nav=document.querySelector('#nav');
if(menu&&nav){
  const setMenu=(open)=>{menu.setAttribute('aria-expanded',String(open));nav.dataset.open=String(open)};
  menu.addEventListener('click',()=>setMenu(menu.getAttribute('aria-expanded')!=='true'));
  nav.addEventListener('click',event=>{if(event.target.closest('a'))setMenu(false)});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){setMenu(false);menu.focus()}});
}
const amount=document.querySelector('#amount');
const result=document.querySelector('#result');
const currency=document.querySelector('#currency');
const directions=[...document.querySelectorAll('[data-direction]')];
const rate=128.45;
let direction='usd';
const format=new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
function recalculate(){
  const value=amount.valueAsNumber;
  const target=direction==='usd'?'ETB':'USD';
  currency.textContent=direction==='usd'?'USD':'ETB';
  if(!Number.isFinite(value)||value<0||value>1000000000){result.textContent='Enter a valid amount';return}
  const converted=direction==='usd'?value*rate:value/rate;
  result.textContent=format.format(converted)+' '+target;
}
directions.forEach(button=>button.addEventListener('click',()=>{
  direction=button.dataset.direction;
  directions.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  recalculate();
}));
amount.addEventListener('input',recalculate);
recalculate();
