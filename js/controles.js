/* Controles propios con la piel de la web: lista desplegable y calendario (reemplazan los del navegador, que no se pueden diseñar).
   Los <select>/<input type=date> originales quedan ocultos y siguen siendo la fuente de verdad: web.js no se entera del cambio. */
(function () {
  const $ = (s, c) => (c || document).querySelector(s), el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h) e.innerHTML = h; return e; };
  const CHEV = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  const abiertos = new Set();
  const marca = () => setTimeout(() => document.body.classList.toggle('ctl-abierto', abiertos.size > 0), 0);
  const visible = (pop) => setTimeout(() => { const r = pop.getBoundingClientRect(), falta = r.bottom - (innerHeight - 16); if (falta > 0) { if (window.Mov && Mov.lenis) Mov.lenis.scrollTo(window.scrollY + falta, { duration: 0.6 }); else window.scrollBy({ top: falta, behavior: 'smooth' }); } }, 120);
  const cerrarTodos = (salvo) => abiertos.forEach((f) => { if (f !== salvo) f(); });
  document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.ctl-wrap')) cerrarTodos(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarTodos(); });
  const ocultar = (n) => { n.classList.add('nativo'); n.tabIndex = -1; n.setAttribute('aria-hidden', 'true'); };

  /* ---------- lista desplegable ---------- */
  function lista(sel) {
    const wrap = el('div', 'ctl-wrap'), b = el('button', 'ctl-b'), ul = el('ul', 'ctl-l');
    b.type = 'button'; b.setAttribute('aria-haspopup', 'listbox'); b.setAttribute('aria-expanded', 'false');
    const lab = sel.getAttribute('aria-labelledby'); if (lab) b.setAttribute('aria-labelledby', lab);
    ul.setAttribute('role', 'listbox'); ul.hidden = true;
    sel.parentNode.insertBefore(wrap, sel); wrap.append(b, ul, sel); ocultar(sel);
    let idx = -1;
    const pintar = () => {
      const ops = Array.from(sel.options);
      ul.innerHTML = ''; ops.forEach((o, i) => { const li = el('li', 'ctl-o' + (o.value === sel.value ? ' on' : ''), '<span></span>'); li.firstChild.textContent = o.textContent; li.setAttribute('role', 'option'); li.setAttribute('aria-selected', String(o.value === sel.value)); li.dataset.i = i; ul.appendChild(li); });
      const act = sel.options[sel.selectedIndex]; b.innerHTML = '<span></span>' + CHEV; b.firstChild.textContent = act ? act.textContent : '';
    };
    const resaltar = (i) => { idx = i; ul.querySelectorAll('.ctl-o').forEach((li, j) => li.classList.toggle('foco', j === i)); const li = ul.children[i]; if (li && li.scrollIntoView) li.scrollIntoView({ block: 'nearest' }); };
    const abrir = () => { cerrarTodos(cerrar); pintar(); ul.hidden = false; requestAnimationFrame(() => wrap.classList.add('abierto')); b.setAttribute('aria-expanded', 'true'); abiertos.add(cerrar); marca(); visible(ul); resaltar(Math.max(0, sel.selectedIndex)); };
    function cerrar() { wrap.classList.remove('abierto'); b.setAttribute('aria-expanded', 'false'); abiertos.delete(cerrar); marca(); setTimeout(() => { if (!wrap.classList.contains('abierto')) ul.hidden = true; }, 220); }
    const elegir = (i) => { if (i < 0 || i >= sel.options.length) return; sel.selectedIndex = i; sel.dispatchEvent(new Event('change', { bubbles: true })); pintar(); cerrar(); b.focus(); };
    b.addEventListener('click', () => (wrap.classList.contains('abierto') ? cerrar() : abrir()));
    ul.addEventListener('click', (e) => { const li = e.target.closest('.ctl-o'); if (li) elegir(+li.dataset.i); });
    ul.addEventListener('pointermove', (e) => { const li = e.target.closest('.ctl-o'); if (li) resaltar(+li.dataset.i); });
    b.addEventListener('keydown', (e) => {
      const abierto = wrap.classList.contains('abierto');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!abierto) abrir(); else resaltar(Math.min(sel.options.length - 1, Math.max(0, idx + (e.key === 'ArrowDown' ? 1 : -1)))); }
      else if ((e.key === 'Enter' || e.key === ' ') && abierto) { e.preventDefault(); elegir(idx); }
      else if (e.key === 'Tab') cerrar();
    });
    new MutationObserver(pintar).observe(sel, { childList: true });
    sel.addEventListener('change', pintar); pintar();
  }

  /* ---------- calendario ---------- */
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const parse = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
  const largo = (d) => { const t = d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }); return t.charAt(0).toUpperCase() + t.slice(1); };
  function calendario(inp) {
    const wrap = el('div', 'ctl-wrap'), b = el('button', 'ctl-b'), pop = el('div', 'ctl-cal');
    b.type = 'button'; b.setAttribute('aria-haspopup', 'dialog'); b.setAttribute('aria-expanded', 'false');
    const lab = inp.id === 'fecha' ? 'lFecha' : ''; if (lab) b.setAttribute('aria-labelledby', lab + ' ctl-fecha-v');
    pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Elegí el día'); pop.hidden = true;
    inp.parentNode.insertBefore(wrap, inp); wrap.append(b, pop, inp); ocultar(inp);
    let vista = parse(inp.value) || new Date(); vista = new Date(vista.getFullYear(), vista.getMonth(), 1);
    const min = () => parse(inp.min), max = () => parse(inp.max);
    const etiqueta = () => { const d = parse(inp.value); b.innerHTML = '<span id="ctl-fecha-v">' + (d ? largo(d) : 'Elegí un día') + '</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>'; };
    function pintar(dir) {
      const mn = min(), mx = max(), sel = parse(inp.value), hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      const ini = new Date(vista.getFullYear(), vista.getMonth(), 1), off = (ini.getDay() + 6) % 7, dias = new Date(vista.getFullYear(), vista.getMonth() + 1, 0).getDate();
      const antes = !mn || new Date(vista.getFullYear(), vista.getMonth(), 0) >= mn, desp = !mx || new Date(vista.getFullYear(), vista.getMonth() + 1, 1) <= mx;
      let h = '<div class="cal-cab"><button type="button" class="cal-nav" data-m="-1" aria-label="Mes anterior"' + (antes ? '' : ' disabled') + '><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg></button><b class="cal-mes" aria-live="polite">' + MESES[vista.getMonth()] + ' <span>' + vista.getFullYear() + '</span></b><button type="button" class="cal-nav" data-m="1" aria-label="Mes siguiente"' + (desp ? '' : ' disabled') + '><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button></div><div class="cal-sem" aria-hidden="true">' + ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((x) => '<span>' + x + '</span>').join('') + '</div><div class="cal-dias' + (dir ? ' ' + dir : '') + '" role="grid">';
      for (let i = 0; i < off; i++) h += '<i></i>';
      for (let d = 1; d <= dias; d++) {
        const f = new Date(vista.getFullYear(), vista.getMonth(), d), no = (mn && f < mn) || (mx && f > mx);
        h += '<button type="button" class="cal-d' + (sel && +f === +sel ? ' on' : '') + (+f === +hoy ? ' hoy' : '') + '" data-f="' + iso(f) + '"' + (no ? ' disabled' : '') + ' aria-label="' + largo(f) + '"' + (sel && +f === +sel ? ' aria-pressed="true"' : '') + '>' + d + '</button>';
      }
      pop.innerHTML = h + '</div>';
    }
    const abrir = () => { cerrarTodos(cerrar); const d = parse(inp.value); if (d) vista = new Date(d.getFullYear(), d.getMonth(), 1); pintar(); pop.hidden = false; requestAnimationFrame(() => wrap.classList.add('abierto')); b.setAttribute('aria-expanded', 'true'); abiertos.add(cerrar); marca(); visible(pop); setTimeout(() => { const x = $('.cal-d.on,.cal-d:not([disabled])', pop); if (x) x.focus({ preventScroll: true }); }, 60); };
    function cerrar() { wrap.classList.remove('abierto'); b.setAttribute('aria-expanded', 'false'); abiertos.delete(cerrar); marca(); setTimeout(() => { if (!wrap.classList.contains('abierto')) pop.hidden = true; }, 220); }
    b.addEventListener('click', () => (wrap.classList.contains('abierto') ? cerrar() : abrir()));
    pop.addEventListener('click', (e) => {
      const n = e.target.closest('.cal-nav'); if (n) { vista = new Date(vista.getFullYear(), vista.getMonth() + (+n.dataset.m), 1); pintar(n.dataset.m > 0 ? 'sig' : 'ant'); const o = $('.cal-nav[data-m="' + n.dataset.m + '"]', pop); if (o && !o.disabled) o.focus({ preventScroll: true }); return; }
      const d = e.target.closest('.cal-d'); if (d && !d.disabled) { inp.value = d.dataset.f; inp.dispatchEvent(new Event('change', { bubbles: true })); etiqueta(); cerrar(); b.focus(); }
    });
    pop.addEventListener('keydown', (e) => {
      const d = e.target.closest('.cal-d'); if (!d) return;
      const paso = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key]; if (!paso) return; e.preventDefault();
      const todos = Array.from(pop.querySelectorAll('.cal-d:not([disabled])')), i = todos.indexOf(d) + paso; if (todos[i]) todos[i].focus();
    });
    inp.addEventListener('change', etiqueta); etiqueta();
  }

  const z = $('#zona'), f = $('#fecha'); if (z) lista(z); if (f) calendario(f);
})();
