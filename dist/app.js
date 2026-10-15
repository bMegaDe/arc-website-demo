// Critically damped spring. Retargeting preserves the current position AND velocity.
// Only transform/opacity change per frame; no gesture is required for navigation.
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const mobile=matchMedia('(max-width: 680px)');
const surfaces=new WeakMap();
function springSurface(element,open,done=()=>{}){
  let state=surfaces.get(element);
  if(!state){state={position:0,velocity:0,target:0,frame:0,last:0,done};surfaces.set(element,state);}
  state.target=open?1:0;state.done=done;
  const paint=()=>{const p=state.position;element.style.opacity=String(Math.min(1,Math.max(0,p)));element.style.transform=reducedMotion.matches?'none':`translateY(${(1-p)*(element.tagName==='DIALOG'?12:-10)}px) scale(${.97+.03*p})`;element.style.visibility='visible';};
  if(reducedMotion.matches){cancelAnimationFrame(state.frame);state.frame=0;state.position=state.target;state.velocity=0;paint();state.done();return;}
  const step=time=>{
    const dt=Math.min((time-state.last)/1000,.064);state.last=time;
    const omega=2*Math.PI/.35;const offset=state.position-state.target;const c=state.velocity+omega*offset;const decay=Math.exp(-omega*dt);
    state.position=state.target+(offset+c*dt)*decay;state.velocity=(state.velocity-omega*c*dt)*decay;paint();
    if(Math.abs(state.position-state.target)<.001&&Math.abs(state.velocity)<.01){state.position=state.target;state.velocity=0;paint();state.frame=0;state.done();}else state.frame=requestAnimationFrame(step);
  };
  paint();if(!state.frame){state.last=performance.now();state.frame=requestAnimationFrame(step);}
}
const menu=document.querySelector('.menu-toggle');
const nav=document.querySelector('#navigation');
function setMenu(open){
  menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Menü schließen':'Menü öffnen');
  if(open){nav.classList.add('is-open');nav.classList.remove('is-closing');nav.inert=false;}
  else{nav.classList.remove('is-open');nav.classList.add('is-closing');nav.inert=true;}
  springSurface(nav,open,()=>{if(!open){nav.classList.remove('is-closing');nav.style.visibility='hidden';}});
}
menu?.addEventListener('click',()=>setMenu(menu.getAttribute('aria-expanded')!=='true'));
document.addEventListener('click',e=>{if(mobile.matches&&menu.getAttribute('aria-expanded')==='true'&&!e.target.closest('.header'))setMenu(false);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu?.getAttribute('aria-expanded')==='true'){setMenu(false);menu.focus();}});
mobile.addEventListener('change',()=>{const state=surfaces.get(nav);if(state){cancelAnimationFrame(state.frame);surfaces.delete(nav);}nav.classList.remove('is-open','is-closing');nav.removeAttribute('style');nav.inert=mobile.matches;menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Menü öffnen');});
nav.inert=mobile.matches;
const cookies=document.querySelector('#cookies');
function closeCookies(){springSurface(cookies,false,()=>cookies.close());}
document.querySelectorAll('[data-cookie-open]').forEach(b=>b.addEventListener('click',()=>{if(!cookies.open)cookies.showModal();springSurface(cookies,true);}));
document.querySelectorAll('.dialog-close,.cookie-done').forEach(b=>b.addEventListener('click',closeCookies));
cookies.addEventListener('cancel',e=>{e.preventDefault();closeCookies();});
const form=document.querySelector('#contact-form');
form?.addEventListener('submit',e=>{e.preventDefault();const data=new FormData(form);const text=`Guten Tag liebes ARC-Team,\n\n${data.get('message')}\n\nName: ${data.get('name')}\nPraxis / Firma: ${data.get('company')}\nE-Mail: ${data.get('email')}\nFachgebiet: ${data.get('field')}`;document.querySelector('#email-copy').value=text;document.querySelector('#email-launch').href=`mailto:info@arc-arc.de?subject=${encodeURIComponent('Kontaktanfrage: '+data.get('company'))}&body=${encodeURIComponent(text)}`;document.querySelector('#email-result').hidden=false;document.querySelector('#form-status').textContent='Ihre E-Mail ist vorbereitet. Öffnen Sie Ihr E-Mail-Programm oder kopieren Sie den Text. Es wurde noch nichts versendet.';document.querySelector('#email-copy').focus();});
document.querySelector('#copy-message')?.addEventListener('click',async()=>{const field=document.querySelector('#email-copy');try{await navigator.clipboard.writeText(field.value);document.querySelector('#form-status').textContent='Nachricht kopiert. Sie können sie in eine E-Mail an info@arc-arc.de einfügen.';}catch{field.select();document.querySelector('#form-status').textContent='Bitte den markierten Text mit Strg+C kopieren.';}});
