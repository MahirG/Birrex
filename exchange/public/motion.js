'use strict';
(function(){
 const reduce=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
 const seen=new WeakSet();let observer=null,queued=false,progress=null,header=null,resize=null,raf=0;const animations=new Set();
 const clampProgress=(top,scrollHeight,viewport)=>Math.min(1,Math.max(0,scrollHeight>viewport?top/(scrollHeight-viewport):0));
 const syncProgress=()=>{raf=0;if(progress)progress.value=clampProgress(window.scrollY||0,document.documentElement.scrollHeight,window.innerHeight)};
 const onScroll=()=>{if(!raf)raf=requestAnimationFrame(syncProgress)};
 function reveal(el){if(seen.has(el))return;seen.add(el);if(reduce?.matches||typeof el.animate!=='function'||el.contains(document.activeElement))return;const a=el.animate([{opacity:.68,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,easing:'cubic-bezier(.2,.75,.25,1)',fill:'none'});animations.add(a);a.onfinish=a.oncancel=()=>animations.delete(a)}
 function scan(){queued=false;const current=document.querySelector('.top');if(current!==header){if(resize&&header)resize.unobserve(header);header=current;if(header){progress=document.createElement('progress');progress.className='scroll-progress';progress.max=1;progress.value=0;progress.setAttribute('aria-hidden','true');header.append(progress);if(resize)resize.observe(header)}else progress=null}
 if(observer&&!reduce?.matches){for(const el of document.querySelectorAll('main > .welcome, main > .panel, main > .grid > .panel, main > .institution-metrics > .panel, main > .lessons > .panel'))if(!seen.has(el))observer.observe(el)}onScroll()}
 function queue(){if(!queued){queued=true;requestAnimationFrame(scan)}}
 function begin(){if(typeof IntersectionObserver==='function'){observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){observer.unobserve(e.target);reveal(e.target)}},{threshold:.05,rootMargin:'0px 0px -8px 0px'})}
 if(typeof ResizeObserver==='function')resize=new ResizeObserver(onScroll);if(resize)resize.observe(document.documentElement);
 if(typeof MutationObserver==='function')new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});
 window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',onScroll,{passive:true});
 const change=()=>{if(reduce?.matches){for(const a of animations)a.cancel();observer?.disconnect()}else queue()};if(reduce?.addEventListener)reduce.addEventListener('change',change);else if(reduce?.addListener)reduce.addListener(change);
 document.addEventListener('click',e=>{const target=e.target instanceof Element?e.target:null;const skip=target?.closest('a.skip');if(skip){const main=document.querySelector('main');if(main){e.preventDefault();main.setAttribute('tabindex','-1');main.focus({preventScroll:true});main.scrollIntoView({block:'start',behavior:'auto'})}}for(const m of document.querySelectorAll('.header-menu[open]'))if(!m.contains(target)||target?.closest('.header-menu-list a'))m.open=false});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){for(const m of document.querySelectorAll('.header-menu[open]')){m.open=false;m.querySelector('summary')?.focus()}}});
 scan();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',begin,{once:true});else begin();
})();