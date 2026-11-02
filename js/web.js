(function () {
  const N = window.NEGOCIO, P = window.Panel, $ = (s) => document.querySelector(s), esc = P.esc;
  let WSP = N.whatsapp || '';
  $('#textoInicio').textContent = N.textoInicio || '';
  if (P.modoDemo()) $('#pieDemo').textContent = 'Demostración con datos de ejemplo · ';
  const toast = (m) => { const t = $('#toast'); t.textContent = m; t.classList.add('ver'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('ver'), 3200); };

  /* barra y accesos fijos */
  const barra = $('#barra'), fija = $('#fija');
  const alScroll = () => { const y = window.scrollY, h = window.innerHeight; barra.classList.toggle('fondo', y > 40); const rs = $('#reservar'), rr = rs ? rs.getBoundingClientRect() : null, enRes = !!rr && rr.top < h * 0.35 && rr.bottom > h * 0.4; fija.classList.toggle('ver', y > h * (document.documentElement.classList.contains('js-motion') ? 0.3 : 0.55) && !enRes); };
  addEventListener('scroll', alScroll, { passive: true }); alScroll();
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('ver'); io.unobserve(e.target); } }), { threshold: 0.12 }) : null;
  document.documentElement.classList.contains('js-motion') || document.querySelectorAll('.reveal').forEach((el) => (io ? io.observe(el) : el.classList.add('ver')));

  /* ---------- carta ---------- */
  function pintarCarta(d) {
    WSP = N.whatsapp || (d.config && d.config.whatsappNumero) || WSP;
    const cats = P.porCategoria(d.productos), tabs = $('#cartaTabs'), lista = $('#cartaLista');
    if (!cats.size) { lista.innerHTML = '<p class="aviso">La carta se está actualizando. Escribinos por WhatsApp y te contamos qué hay hoy.</p>'; tabs.innerHTML = ''; pintarContacto(); return; }
    tabs.innerHTML = Array.from(cats.keys()).map((c, i) => '<a class="chip" role="tab" href="#cat' + i + '" data-i="' + i + '">' + esc(c) + '</a>').join('');
    lista.innerHTML = Array.from(cats.entries()).map(([c, ps], i) => '<section class="cat" id="cat' + i + '" aria-labelledby="h' + i + '"><h3 id="h' + i + '">' + esc(c) + '</h3>' + ps.map((p) => {
      const pr = P.precioDe(p);
      return '<article class="plato"><b>' + esc(p.nombre) + '</b><span class="precio">' + (pr.desde ? 'desde ' : '') + P.pesos(pr.valor) + '</span>' + (p.descripcion ? '<p>' + esc(p.descripcion) + '</p>' : '') + '</article>';
    }).join('') + '</section>').join('');
    $('#cartaNota').textContent = d.demo ? 'Carta de ejemplo para la demostración.' : '';
    pintarContacto();
    window.__cartaLista = true; if (window.Mov) window.Mov.carta();
    const secs = Array.from(lista.querySelectorAll('.cat')), chips = Array.from(tabs.querySelectorAll('.chip'));
    if ('IntersectionObserver' in window) { const o = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { const i = secs.indexOf(e.target); chips.forEach((c, j) => c.classList.toggle('on', i === j)); const on = chips[i]; if (on && tabs.scrollWidth > tabs.clientWidth) tabs.scrollTo({ left: on.offsetLeft - 40, behavior: 'smooth' }); } }), { rootMargin: '-35% 0px -60% 0px' }); secs.forEach((s) => o.observe(s)); }
  }
  P.carta(pintarCarta).then((d) => { if (d && d.ok) pintarCarta(d); else $('#cartaLista').innerHTML = '<p class="aviso mal">No pudimos cargar la carta. ' + esc((d && d.mensaje) || '') + ' <a href="#carta" onclick="location.reload()">Reintentar</a></p>'; });

  /* ---------- reserva ---------- */
  const f = { personas: 2, hora: '', zona: '', reservaId: P.idAleatorio('res'), seq: 0 };
  const hoyStr = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const fecha = $('#fecha'); fecha.min = hoyStr(); fecha.value = hoyStr();
  const max = new Date(); max.setDate(max.getDate() + 60); fecha.max = max.getFullYear() + '-' + String(max.getMonth() + 1).padStart(2, '0') + '-' + String(max.getDate()).padStart(2, '0');
  const horas = $('#horas');
  const marcarMal = (input, msg) => { const c = input.closest('.campo'); c.classList.toggle('mal', !!msg); const e = c.querySelector('.error'); if (e) { e.textContent = msg || ''; e.hidden = !msg; } };
  async function horarios() {
    const mi = ++f.seq; f.hora = ''; $('#eHora').hidden = true;
    horas.innerHTML = '<span class="esq" style="width:84px;height:44px;border-radius:999px"></span><span class="esq" style="width:84px;height:44px;border-radius:999px"></span><span class="esq" style="width:84px;height:44px;border-radius:999px"></span>';
    if (!fecha.value) { horas.innerHTML = '<p class="horas-vacio">Elegí un día.</p>'; return; }
    const d = await P.llamar('disponibilidad', { fecha: fecha.value, personas: f.personas, zona: f.zona });
    if (mi !== f.seq) return;
    if (!d || !d.ok) { horas.innerHTML = '<p class="horas-vacio">' + esc((d && d.mensaje) || 'No pudimos ver los horarios.') + '</p>'; return; }
    const zs = d.zonas || [], sel = $('#zona');
    if (zs.length > 1) { $('#campoZona').hidden = false; if (sel.options.length !== zs.length + 1) sel.innerHTML = '<option value="">Cualquiera</option>' + zs.map((z) => '<option>' + esc(z) + '</option>').join(''); sel.value = f.zona; }
    if (!d.horarios.length) { horas.innerHTML = '<p class="horas-vacio">' + esc(d.mensaje || 'No hay lugar ese día.') + (WSP ? ' <a href="' + esc(P.whatsappLink(WSP, 'Hola! Quería reservar para ' + f.personas + ' el ' + fecha.value)) + '" style="color:var(--oro)">Escribinos por WhatsApp</a>' : '') + '</p>'; return; }
    horas.innerHTML = d.horarios.map((h) => '<button type="button" class="chip" aria-pressed="false" data-h="' + esc(h.hora) + '">' + esc(h.hora) + '</button>').join('');
  }
  horas.addEventListener('click', (e) => { const b = e.target.closest('[data-h]'); if (!b) return; f.hora = b.dataset.h; horas.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b))); $('#eHora').hidden = true; });
  $('#menos').onclick = () => { f.personas = Math.max(1, f.personas - 1); $('#pers').textContent = f.personas; horarios(); };
  $('#mas').onclick = () => { f.personas = Math.min(20, f.personas + 1); $('#pers').textContent = f.personas; horarios(); };
  fecha.addEventListener('change', horarios);
  $('#zona').addEventListener('change', (e) => { f.zona = e.target.value; horarios(); });
  horarios();

  $('#formRes').addEventListener('submit', async (e) => {
    e.preventDefault();
    const eF = $('#eForm'); eF.hidden = true; ['#nombre', '#tel'].forEach((s) => marcarMal($(s), ''));
    let mal = false;
    if (!f.hora) { const e2 = $('#eHora'); e2.textContent = 'Elegí un horario.'; e2.hidden = false; mal = true; }
    if (!$('#nombre').value.trim()) { marcarMal($('#nombre'), 'Escribí tu nombre.'); mal = true; }
    if (!$('#tel').value.trim()) { marcarMal($('#tel'), 'Dejanos un teléfono para confirmarte.'); mal = true; }
    if (mal) return;
    const b = $('#enviar'); b.disabled = true; b.textContent = 'Enviando…';
    const d = await P.llamar('crearReserva', { reservaId: f.reservaId, nombre: $('#nombre').value.trim(), telefono: $('#tel').value.trim(), personas: f.personas, fecha: fecha.value, hora: f.hora, zona: f.zona || undefined, nota: $('#nota').value.trim() || undefined });
    b.disabled = false; b.textContent = 'Reservar';
    if (!d || !d.ok) {
      if (d && d.campos) { if (d.campos.nombre) marcarMal($('#nombre'), d.campos.nombre); if (d.campos.telefono) marcarMal($('#tel'), d.campos.telefono); if (d.campos.hora || d.campos.fecha) { eF.textContent = d.campos.hora || d.campos.fecha; eF.hidden = false; } }
      if (!d || !d.campos || !Object.keys(d.campos).length) { eF.textContent = (d && d.mensaje) || 'No pudimos reservar. Probá de nuevo.'; eF.hidden = false; }
      if (d && (d.code === 'CONFLICTO' || (d.mensaje || '').match(/lugar/))) { f.reservaId = P.idAleatorio('res'); horarios(); }
      return;
    }
    const ok = $('#okRes'), dia = new Date(d.fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    const wa = d.whatsappUrl || P.whatsappLink(WSP, 'Hola! Soy ' + $('#nombre').value.trim() + '. Reservé para ' + d.personas + ' el ' + dia + ' a las ' + d.hora + '.');
    ok.innerHTML = '<div class="ok-reserva"><span class="tilde" aria-hidden="true"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path pathLength="1" d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><h3>¡Listo, ' + esc($('#nombre').value.trim().split(' ')[0]) + '!</h3><p style="margin:0;color:var(--suave);max-width:34ch">' + (d.estado === 'confirmada' ? 'Tu reserva está confirmada.' : 'Recibimos tu reserva. Te la confirmamos por teléfono o WhatsApp.') + '</p><dl><dt>Día</dt><dd>' + esc(dia) + '</dd><dt>Hora</dt><dd>' + esc(d.hora) + '</dd><dt>Personas</dt><dd>' + esc(d.personas) + '</dd>' + (d.zona ? '<dt>Lugar</dt><dd>' + esc(d.zona) + '</dd>' : '') + '<dt>Reserva</dt><dd>#' + esc(d.numero) + '</dd></dl>' + (wa ? '<a class="btn btn-oro" href="' + esc(wa) + '" rel="noopener">Avisar por WhatsApp</a>' : '') + '<button class="btn btn-chico" type="button" id="otra">Hacer otra reserva</button></div>';
    $('#formRes').hidden = true; ok.hidden = false; if (window.Mov) { window.Mov.exito(ok); setTimeout(() => { window.Mov.refrescar(); window.Mov.irA('#tRes', { offset: -120, duration: 1.1 }); }, 80); } else ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
    $('#otra').onclick = () => { f.reservaId = P.idAleatorio('res'); ok.hidden = true; $('#formRes').hidden = false; horarios(); };
  });

  function pintarContacto() {
    const wsp = N.whatsapp || WSP, ig = N.instagram;
    $('#datos').innerHTML = (N.direccion ? '<span><b>Dónde:</b> ' + esc(N.direccion) + '</span>' : '') + (N.horarios ? '<span><b>Horarios:</b> ' + esc(N.horarios) + '</span>' : '');
    $('#contactos').innerHTML = (wsp ? '<a class="btn btn-chico" href="' + esc(P.whatsappLink(wsp, 'Hola Pastora!')) + '" rel="noopener">WhatsApp</a>' : '') + (ig ? '<a class="btn btn-chico" href="https://instagram.com/' + esc(ig) + '" rel="noopener">Instagram</a>' : '');
  }
  pintarContacto();
})();
