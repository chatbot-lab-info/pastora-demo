/* Movimiento de la web de Pastora (GSAP + ScrollTrigger + Lenis, todo local, sin CDN).
   Si el visitante pidió "reducir animaciones" o algo falla, esta capa no corre y la web se ve igual (estática). */
(function () {
  const root = document.documentElement;
  if (!root.classList.contains('js-motion')) return;
  if (!window.gsap || !window.ScrollTrigger || !window.Lenis) { root.classList.remove('js-motion'); return; }
  gsap.registerPlugin(ScrollTrigger);
  const $ = (s, c) => (c || document).querySelector(s), $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const suave = 'power3.out', fino = 'power2.inOut';
  const fino_ = matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* scroll suave (Lenis) integrado con ScrollTrigger */
  const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothTouch: false, anchors: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  const irA = (dest, opt) => {
    const el = typeof dest === 'string' ? $(dest) : dest;
    if (!el) return;
    lenis.scrollTo(el === $('#inicio') ? 0 : el, Object.assign({ offset: -54, duration: 1.7, easing: (x) => 1 - Math.pow(1 - x, 4) }, opt || {}));
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const h = a.getAttribute('href'); if (h.length < 2) return;
    const el = $(h); if (!el) return;
    e.preventDefault();
    if (h === '#carta' || h === '#reservar') {
      /* si la portada sigue fijada, las salidas rápidas llevan directo a la sección */
      irA(el);
    } else irA(el);
  });

  /* ---- Portada: entrada ---- */
  const logo = $('.hero-logo'), lema = $('.hero-lema'), btns = $$('.hero-cta .btn'), abajo = $('.hero-abajo');
  const fachada = $('.capa-fachada'), fImg = $('.capa-fachada img'), salon = $('.capa-salon'), sImg = $('.capa-salon img');
  const arco = $('.arco'), arcoPath = $('.arco path'), velo = $('.velo'), heroIn = $('.hero-in'), intro = $('.intro-in');
  gsap.set(fImg, { scale: 1.05 });
  const entrada = gsap.timeline({ defaults: { ease: suave } });
  entrada
    .fromTo(fachada, { scale: 1.16 }, { scale: 1, duration: 2.8, ease: 'power2.out' }, 0)
    .fromTo(logo, { opacity: 1, clipPath: 'inset(0 100% 0 0)', y: 10 }, { clipPath: 'inset(0 0% 0 0)', y: 0, duration: 1.7, ease: fino }, 0.25)
    .fromTo(lema, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 1.2 }, 1.25)
    .fromTo(btns, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.14 }, 1.55)
    .fromTo(abajo, { opacity: 0 }, { opacity: 1, duration: 1, ease: suave }, 2.2);
  entrada.eventCallback('onComplete', () => { gsap.set([logo, lema, btns], { clearProps: 'clipPath,y' }); });

  /* ---- Portada: escena que se recorre (fachada → arco → salón) ---- */
  let escena;
  const armarEscena = () => {
    if (escena) { escena.scrollTrigger && escena.scrollTrigger.kill(); escena.kill(); }
    const W = innerWidth, H = innerHeight, ah = Math.min(H * 0.62, W * 0.84 * 1.4), aw = ah * 100 / 140;
    const l = (W - aw) / 2, t = (H - ah) / 2, r = aw / 2;
    const pasoVentana = (q) => { const k = 1 - q; salon.style.clipPath = 'inset(' + t * k + 'px ' + l * k + 'px ' + t * k + 'px ' + l * k + 'px round ' + r * k + 'px ' + r * k + 'px 0px 0px)'; };
    const o = { q: 0 };
    gsap.set(salon, { visibility: 'hidden', autoAlpha: 0 }); pasoVentana(0);
    gsap.set(sImg, { scale: 1.4 });
    gsap.set(arco, { autoAlpha: 0, scale: 1 });
    gsap.set(arcoPath, { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set(intro, { autoAlpha: 0, y: 30 });
    gsap.set($$('.iconos path'), { strokeDashoffset: 1 });
    gsap.set(velo, { opacity: 1 });
    const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.escena', start: 'top top', end: () => '+=' + Math.round(innerHeight * 3.1), pin: '.escena-pin', scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true } });
    tl.to(heroIn, { autoAlpha: 0, y: -50, duration: 1.4, ease: 'power1.in' }, 0)
      .to(abajo, { autoAlpha: 0, duration: 0.6 }, 0)
      .to(fImg, { scale: 1.34, duration: 9 }, 0)
      .set(arco, { autoAlpha: 1 }, 1.5)
      .to(arcoPath, { strokeDashoffset: 0, duration: 2.2, ease: 'power1.inOut' }, 1.5)
      .to(salon, { autoAlpha: 1, duration: 0.9, ease: 'power1.out' }, 2.9)
      .to(velo, { opacity: 0.5, duration: 2, ease: 'power1.inOut' }, 3)
      .to(sImg, { scale: 1, duration: 5.4, ease: 'power2.out' }, 3.6)
      .to(o, { q: 1, duration: 4.4, ease: 'power2.inOut', onUpdate: () => pasoVentana(o.q) }, 3.9)
      .to(arco, { scale: 1.9, autoAlpha: 0, duration: 2.6, ease: 'power2.in' }, 4.1)
      .to(intro, { autoAlpha: 1, y: 0, duration: 1.5, ease: 'power2.out' }, 7.6)
      .to($$('.iconos path'), { strokeDashoffset: 0, duration: 1.6, stagger: 0.28, ease: 'power1.inOut' }, 7.9)
      .to(velo, { opacity: 1, duration: 1.4 }, 7.3)
      .to({}, { duration: 1.6 }, 9.4);
    escena = tl;
  };
  armarEscena();
  let ancho = innerWidth;
  addEventListener('resize', () => { if (Math.abs(innerWidth - ancho) > 60) { ancho = innerWidth; armarEscena(); ScrollTrigger.refresh(); } });

  /* ---- Barra: se esconde al bajar y vuelve al subir ---- */
  const barra = $('#barra');
  let ultimo = 0;
  addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > 160 && y > ultimo + 4) barra.classList.add('oculta');
    else if (y < ultimo - 4 || y <= 160) barra.classList.remove('oculta');
    ultimo = y;
  }, { passive: true });

  /* ---- Secciones: entradas con scroll ---- */
  ScrollTrigger.batch('.reveal', { start: 'top 88%', once: true, onEnter: (b) => gsap.to(b, { autoAlpha: 1, y: 0, duration: 1.2, ease: suave, stagger: 0.12, overwrite: true }) });
  const ilu = $('.encontranos .ilu');
  if (ilu) gsap.fromTo(ilu, { y: 50 }, { y: -30, ease: 'none', scrollTrigger: { trigger: '.encontranos', start: 'top bottom', end: 'bottom top', scrub: 0.6 } });

  /* ---- Carta: se anima cuando termina de pintarse ---- */
  const carta = () => {
    $$('.cat').forEach((c) => {
      const h = $('h3', c), platos = $$('.plato', c);
      if (c.dataset.mov) return; c.dataset.mov = '1';
      gsap.timeline({ scrollTrigger: { trigger: c, start: 'top 82%', once: true } })
        .to(h, { clipPath: 'inset(0 0% 0 0)', duration: 1.3, ease: fino }, 0)
        .to(h, { '--l': 1, duration: 1.4, ease: fino }, 0.25)
        .to(platos, { opacity: 1, y: 0, duration: 0.9, ease: suave, stagger: 0.07 }, 0.3);
    });
    const chips = $$('#cartaTabs .chip');
    if (chips.length && !$('#cartaTabs').dataset.mov) { $('#cartaTabs').dataset.mov = '1'; gsap.to(chips, { opacity: 1, duration: 0.8, stagger: 0.07, ease: suave, scrollTrigger: { trigger: '#carta', start: 'top 80%', once: true } }); }
    ScrollTrigger.refresh();
  };
  /* ---- Reserva enviada: el tilde se dibuja ---- */
  const exito = (card) => {
    const tilde = $('.tilde', card); if (!tilde) return;
    gsap.fromTo(tilde, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(1.8)' });
    gsap.fromTo($('path', tilde), { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, delay: 0.25, ease: fino });
    gsap.from($$('.ok-reserva > *:not(.tilde)', card), { opacity: 0, y: 18, duration: 0.8, stagger: 0.08, delay: 0.3, ease: suave });
  };

  /* ---- Cursor y botones magnéticos (solo mouse) ---- */
  if (fino_) {
    const cur = $('#cursor'), qx = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3' }), qy = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3' });
    addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; cur.classList.add('ver'); qx(e.clientX); qy(e.clientY); }, { passive: true });
    document.addEventListener('pointerover', (e) => { cur.classList.toggle('grande', !!e.target.closest('a,button,.chip,input,select,textarea,label')); });
    $$('.btn-oro, .hero-cta .btn').forEach((b) => {
      const mx = gsap.quickTo(b, 'x', { duration: 0.5, ease: 'power3' }), my = gsap.quickTo(b, 'y', { duration: 0.5, ease: 'power3' });
      b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * 0.18); my((e.clientY - r.top - r.height / 2) * 0.28); });
      b.addEventListener('pointerleave', () => { mx(0); my(0); });
    });
  }

  /* las fuentes e imágenes cambian las alturas: recalcular */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  addEventListener('load', () => ScrollTrigger.refresh());
  window.Mov = { listo: true, lenis, irA, carta, exito, refrescar: () => ScrollTrigger.refresh() };
  if (window.__cartaLista) carta();
})();
