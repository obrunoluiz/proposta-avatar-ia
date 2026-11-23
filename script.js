(() => {
  const nav=document.querySelector('#nav');
  const scroll=()=>{const max=document.documentElement.scrollHeight-innerHeight;document.documentElement.style.setProperty('--sp',max>0?scrollY/max:0);nav?.classList.toggle('scrolled',scrollY>30)};
  addEventListener('scroll',scroll,{passive:true});scroll();
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('[data-filter]').forEach(b=>{const on=b===button;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});
    document.querySelectorAll('[data-category]').forEach(card=>card.hidden=button.dataset.filter!=='Todos os projetos'&&card.dataset.category!==button.dataset.filter);
  }));
  document.querySelector('#briefing').addEventListener('submit',async e=>{e.preventDefault();const message=document.querySelector('#project-message').value.trim();const status=document.querySelector('#contact-status');try{await navigator.clipboard.writeText(message);status.textContent='Mensagem copiada. Os canais de contato estarão disponíveis em breve.'}catch{status.textContent='Sua mensagem está pronta. Selecione o texto para copiar.'}});
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.animate([{opacity:0,transform:'translateY(20px)'},{opacity:1,transform:'translateY(0)'}],{duration:600,easing:'ease-out'});io.unobserve(e.target)}}),{threshold:.1});document.querySelectorAll('.service-card,.project-card,.about-photo').forEach(e=>io.observe(e))}
})();
