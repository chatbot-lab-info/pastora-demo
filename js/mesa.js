(function () {
  const N = window.NEGOCIO, P = window.Panel, esc = P.esc, app = document.getElementById('app');
  const m = location.search.match(/[?&](?:mesa|t)=([A-Za-z0-9]+)/), token = m ? m[1] : '';
  const S = { mesa: null, productos: [], cats: null, tab: 'carta', cart: new Map(), pedidoQrId: P.idAleatorio('qr'), pedidos: [], mostrarEstado: true, aviso: '', enviando: false, demo: false, ultimoEnviado: 0, avisoPedido: '' };
  const I = {
    carta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4z"/><path d="M9 9h6M9 13h6"/></svg>',
    pedido: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1.2 11.2a1.5 1.5 0 0 1-1.5 1.3H7.7a1.5 1.5 0 0 1-1.5-1.3L5 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>',
    mesa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="8" rx="8" ry="3"/><path d="M12 11v9M8 20h8"/></svg>',
    mozo: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 17h12M5 17a7 7 0 0 1 14 0M12 6V4M10 4h4"/></svg>',
    cuenta: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z"/><path d="M9 8h6M9 12h6"/></svg>'
  };
  const toast = (t) => { const e = document.getElementById('toast'); e.textContent = t; e.classList.add('ver'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('ver'), 3200); };
  const total = () => { let t = 0; S.cart.forEach((l, id) => { const p = S.productos.find((x) => x.productoId === id); if (p) t += P.precioDe(p).valor * l.cantidad; }); return t; };
  const cuenta = () => { let n = 0; S.cart.forEach((l) => { n += l.cantidad; }); return n; };

  function pantallaError(msg) { app.innerHTML = '<div class="vacio" style="min-height:100svh;align-content:center"><img src="../img/monograma.png" alt="" width="84" height="84" style="border-radius:50%"><h2>Este código no está activo</h2><p>' + esc(msg || 'Pedile ayuda a quien te atiende y te lo resuelve enseguida.') + '</p></div>'; }

  function aplicar(d) {
    S.mesa = d.mesa; S.productos = d.productos || []; S.cats = P.porCategoria(S.productos); S.pedidos = d.pedidos || []; S.mostrarEstado = d.mostrarEstado !== false; S.aviso = d.aviso || ''; S.demo = !!d.demo;
  }
  async function cargar() {
    if (!token) return pantallaError('Escaneá de nuevo el código QR de tu mesa.');
    const d = await P.llamar('mesaQr', { token });
    if (!d || !d.ok) return pantallaError((d && d.mensaje) || 'No pudimos cargar tu mesa. Revisá tu internet y probá de nuevo.');
    aplicar(d); dibujar();
    setInterval(sondear, 9000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) sondear(); });
  }
  async function sondear() {
    if (document.hidden || S.enviando) return;
    const d = await P.llamar('mesaQr', { token });
    if (!d || !d.ok) return;
    const antes = JSON.stringify([S.pedidos, S.aviso]); aplicar(d);
    if (antes !== JSON.stringify([S.pedidos, S.aviso])) {
      const listos = S.pedidos.filter((p) => p.estado === 'listo').length;
      if (listos && listos !== S.avisoPedido) { S.avisoPedido = listos; toast('Tu pedido está listo, ya te lo llevan.'); }
      dibujar('dato');
    }
  }

  /* ---------- dibujo: la cáscara (cabecera, barra, botón flotante) se arma una vez; solo cambia la vista ---------- */
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches, G = !RM && window.gsap;
  const TABS = [['carta', 'Carta', I.carta], ['pedido', 'Mi pedido', I.pedido], ['mesa', 'Mi mesa', I.mesa]];
  let montado = false, cantAntes = 0, estadosAntes = '';
  const $ = (s) => document.getElementById(s);
  function montar() {
    app.innerHTML = '<header class="m-cab"><img src="../img/monograma.png" alt="Pastora" width="42" height="42"><div><h1>Mesa <span class="num">' + esc(S.mesa.numero) + '</span></h1><small>' + esc(S.mesa.zona || '') + (S.mesa.zona ? ' · ' : '') + esc(N.nombre) + '</small></div>' + (S.demo ? '<span class="dem">Demo</span>' : '') + '</header>' +
      '<main id="vista" class="m-vista"></main>' +
      '<button type="button" class="flota" id="flota" data-tab="pedido" aria-label="Ver mi pedido"><span>Ver mi pedido · <b id="fN">0</b></span><b id="fT"></b></button>' +
      '<nav class="barra-m" aria-label="Secciones"><i class="ind" id="ind" aria-hidden="true"></i>' + TABS.map(([k, t, ic]) => '<button type="button" data-tab="' + k + '">' + ic + '<span>' + t + '</span>' + (k === 'pedido' ? '<i class="n" id="badge" hidden></i>' : '') + '</button>').join('') + '</nav>';
    montado = true;
    if (G) gsap.from(app.querySelector('.m-cab'), { y: -30, opacity: 0, duration: 0.9, ease: 'power3.out' });
  }
  function cascara() {
    const n = cuenta(), i = TABS.findIndex((t) => t[0] === S.tab);
    app.querySelectorAll('.barra-m [data-tab]').forEach((b) => { if (b.dataset.tab === S.tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    $('ind').style.transform = 'translateX(' + i * 100 + '%)';
    const bd = $('badge'); bd.hidden = !n; bd.textContent = n;
    if (n > cantAntes && G) gsap.fromTo(bd, { scale: 0.4 }, { scale: 1, duration: 0.55, ease: 'back.out(3)' });
    cantAntes = n;
    $('fN').textContent = n; $('fT').textContent = P.pesos(total());
    $('flota').classList.toggle('ver', S.tab === 'carta' && n > 0);
  }
  function entrar(v) {
    if (!G) return;
    const el = [].concat(Array.from(v.querySelectorAll('.m-bienvenida > *, .m-acciones .m-acc, .m-tabs, .m-pan > *, .vacio > *, .est, .lin')), Array.from(v.querySelectorAll('.m-cat h3')).slice(0, 1), Array.from(v.querySelectorAll('.m-it')).slice(0, 7));
    gsap.fromTo(el, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.055, clearProps: 'opacity,transform', overwrite: true });
  }
  function popear(id) {
    if (!G) return;
    const b = app.querySelector('[data-sumar="' + CSS.escape(id) + '"]'); const c = b && b.closest('.ctl, .lin'); if (!c) return;
    gsap.fromTo(c.querySelector('.paso b, .mas') || c, { scale: 0.7 }, { scale: 1, duration: 0.55, ease: 'back.out(3)', clearProps: 'transform' });
  }
  function dibujar(modo, pop) {
    if (!montado) montar();
    const keepY = window.scrollY, v = $('vista');
    cascara();
    const html = S.tab === 'carta' ? vistaCarta() : S.tab === 'pedido' ? vistaPedido() : vistaMesa();
    if (modo === 'dato') {
      v.innerHTML = html; window.scrollTo(0, keepY);
      if (pop) popear(pop);
      const ea = Array.from(v.querySelectorAll('.est')).map((e) => e.dataset.e).join();
      if (estadosAntes && ea !== estadosAntes && G) gsap.fromTo(v.querySelectorAll('.est i'), { scale: 2.2 }, { scale: 1, duration: 0.7, ease: 'back.out(3)', clearProps: 'transform' });
      estadosAntes = ea; return;
    }
    estadosAntes = '';
    const cambiar = () => { v.innerHTML = html; window.scrollTo(0, 0); estadosAntes = Array.from(v.querySelectorAll('.est')).map((e) => e.dataset.e).join(); entrar(v); };
    if (G && v.childElementCount) { gsap.killTweensOf(v); gsap.to(v, { opacity: 0, y: 8, duration: 0.15, ease: 'power1.in', onComplete: () => { cambiar(); gsap.set(v, { opacity: 1, y: 0 }); } }); } else { cambiar(); }
  }
  function accionesHtml() {
    const a = S.aviso;
    return '<div class="m-acciones"><button class="m-acc' + (a === 'llamo' ? ' listo' : '') + '" data-llamar="mozo">' + I.mozo + '<b>Llamar al mozo</b><small>' + (a === 'llamo' ? 'Ya avisamos, enseguida viene' : 'Te atendemos en la mesa') + '</small></button><button class="m-acc' + (a === 'pidio_cuenta' ? ' listo' : '') + '" data-llamar="cuenta">' + I.cuenta + '<b>Pedir la cuenta</b><small>' + (a === 'pidio_cuenta' ? 'Ya avisamos, pagás en la mesa' : 'Pagás al mozo, en la mesa') + '</small></button></div>';
  }
  function vistaCarta() {
    if (!S.cats.size) return '<div class="vacio"><h2>La carta se está actualizando</h2><p>Llamá al mozo y te cuenta qué hay hoy.</p></div>' + accionesHtml();
    const chips = Array.from(S.cats.keys()).map((c, i) => '<button type="button" class="chip" data-ir="mc' + i + '">' + esc(c) + '</button>').join('');
    const cats = Array.from(S.cats.entries()).map(([c, ps], i) => '<section class="m-cat" id="mc' + i + '"><h3>' + esc(c) + '</h3>' + ps.map(itemHtml).join('') + '</section>').join('');
    return '<div class="m-bienvenida"><span class="cap">Bienvenidos</span><h2>¿Qué se les antoja?</h2><p>Armá tu pedido desde acá. El mozo lo confirma y sale a cocina. La cuenta se paga en la mesa.</p></div>' + accionesHtml() + '<div class="m-tabs" role="tablist" aria-label="Categorías">' + chips + '</div>' + cats + '<div class="m-pie">' + (S.demo ? 'Demostración con datos de ejemplo · ' : '') + 'Sistema by <a href="https://wa.me/5493425969853" rel="noopener">iNGENIA</a></div>';
  }
  function itemHtml(p) {
    const pr = P.precioDe(p), l = S.cart.get(p.productoId);
    return '<article class="m-it"><b>' + esc(p.nombre) + '</b>' + (p.descripcion ? '<p>' + esc(p.descripcion) + '</p>' : '') + '<span class="pr">' + (pr.desde ? 'desde ' : '') + P.pesos(pr.valor) + '</span><div class="ctl">' + (l ? stepper(p.productoId, l.cantidad) : '<button class="mas" type="button" data-sumar="' + esc(p.productoId) + '" aria-label="Agregar ' + esc(p.nombre) + '">+</button>') + '</div></article>';
  }
  const stepper = (id, c) => '<div class="paso" role="group" aria-label="Cantidad"><button type="button" data-restar="' + esc(id) + '" aria-label="Quitar uno">−</button><b aria-live="polite">' + c + '</b><button type="button" data-sumar="' + esc(id) + '" aria-label="Agregar uno">+</button></div>';
  function vistaPedido() {
    if (!S.cart.size) return '<div class="vacio"><h2>Todavía no pediste nada</h2><p>Elegí de la carta lo que quieras y lo ves acá antes de mandarlo.</p><button class="btn btn-oro" type="button" data-tab="carta">Ver la carta</button></div>';
    const lineas = Array.from(S.cart.entries()).map(([id, l]) => { const p = S.productos.find((x) => x.productoId === id); if (!p) return ''; const pr = P.precioDe(p); return '<div class="lin"><b>' + esc(p.nombre) + '</b>' + stepper(id, l.cantidad) + '<span class="imp">' + P.pesos(pr.valor * l.cantidad) + '</span><span></span>' + (l.nota !== undefined ? '<div class="nota"><input data-nota="' + esc(id) + '" value="' + esc(l.nota) + '" maxlength="120" placeholder="Ej.: sin cebolla, bien caliente" aria-label="Nota para ' + esc(p.nombre) + '"></div>' : '<button class="lnk" type="button" data-agnota="' + esc(id) + '">Agregar una nota</button>') + '</div>'; }).join('');
    return '<div class="m-pan"><h2>Tu pedido</h2><div>' + lineas + '</div><div class="tot"><span>Total estimado</span><span>' + P.pesos(total()) + '</span></div><p class="aviso">No se paga acá: el mozo confirma tu pedido y la cuenta la pagás en la mesa. El importe final lo calcula el local.</p><p class="aviso mal" id="ePedido" role="alert" hidden></p><button class="btn btn-oro" type="button" id="enviarPedido"' + (S.enviando ? ' disabled' : '') + '>' + (S.enviando ? 'Enviando…' : 'Enviar pedido') + '</button></div>';
  }
  function vistaMesa() {
    const lista = S.pedidos.length ? S.pedidos.map((p) => '<div class="est" data-e="' + esc(p.estado) + '"><i></i><b><span class="num">' + esc(p.cantidad) + '</span> × ' + esc(p.nombre) + '</b><small>' + esc(p.estadoTexto || '') + '</small></div>').join('') : '<div class="vacio"><h2>Sin pedidos todavía</h2><p>' + (S.mostrarEstado ? 'Cuando mandes algo, acá ves cómo avanza.' : 'Cuando mandes algo, el personal te lo lleva a la mesa.') + '</p></div>';
    return '<div class="m-pan"><h2>Tu mesa</h2>' + (S.mostrarEstado ? '<div>' + lista + '</div>' : (S.pedidos.length ? '<p class="aviso ok">Tu pedido está en camino. El personal te lo lleva a la mesa.</p>' : lista)) + '</div>' + accionesHtml();
  }

  /* ---------- acciones (un solo oyente: la vista se repinta sin perder nada) ---------- */
  const vibra = () => { try { if (navigator.vibrate) navigator.vibrate(10); } catch (e) {} };
  app.addEventListener('click', (e) => {
    const t = e.target.closest('[data-tab],[data-ir],[data-sumar],[data-restar],[data-agnota],[data-llamar],#enviarPedido'); if (!t) return;
    const d = t.dataset;
    if (d.tab) { if (d.tab !== S.tab) { S.tab = d.tab; dibujar(); } else window.scrollTo({ top: 0, behavior: 'smooth' }); }
    else if (d.ir) document.getElementById(d.ir).scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
    else if (d.sumar) { const l = S.cart.get(d.sumar) || { cantidad: 0 }; l.cantidad = Math.min(30, l.cantidad + 1); S.cart.set(d.sumar, l); vibra(); dibujar('dato', d.sumar); }
    else if (d.restar) { const l = S.cart.get(d.restar); if (!l) return; l.cantidad--; if (l.cantidad <= 0) S.cart.delete(d.restar); dibujar('dato', d.restar); }
    else if (d.agnota) { S.cart.get(d.agnota).nota = ''; dibujar('dato'); const i = app.querySelector('[data-nota="' + d.agnota + '"]'); if (i) i.focus(); }
    else if (d.llamar) llamar(d.llamar);
    else if (t.id === 'enviarPedido') enviar();
  });
  app.addEventListener('input', (e) => { const i = e.target.closest('[data-nota]'); if (!i) return; const l = S.cart.get(i.dataset.nota); if (l) l.nota = i.value; });
  async function llamar(motivo) {
    S.aviso = motivo === 'cuenta' ? 'pidio_cuenta' : 'llamo'; dibujar('dato');
    const d = await P.llamar('qrLlamar', { token, motivo });
    if (!d || !d.ok) { S.aviso = ''; dibujar('dato'); return toast((d && d.mensaje) || 'No pudimos avisar. Probá de nuevo.'); }
    toast(d.mensaje || 'Ya avisamos al personal.');
  }
  async function enviar() {
    if (S.enviando || !S.cart.size) return;
    S.enviando = true; dibujar('dato');
    const items = Array.from(S.cart.entries()).map(([id, l]) => ({ productoId: id, cantidad: l.cantidad, nota: (l.nota || '').trim() || undefined }));
    const d = await P.llamar('qrPedir', { token, pedidoQrId: S.pedidoQrId, items });
    S.enviando = false;
    if (!d || !d.ok) { dibujar('dato'); const e = document.getElementById('ePedido'); if (e) { e.textContent = (d && d.mensaje) || 'No pudimos enviar el pedido. Probá de nuevo.'; e.hidden = false; } return; }
    S.cart.clear(); S.pedidoQrId = P.idAleatorio('qr'); S.tab = 'mesa';
    const r = await P.llamar('mesaQr', { token }); if (r && r.ok) aplicar(r);
    dibujar(); toast(d.mensaje || 'Recibimos tu pedido.');
  }
  cargar();
})();
