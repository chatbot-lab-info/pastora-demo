/* iNGENIA · conexión con el panel del restó (BASE FIJA: no se toca entre clientes). Habla con las acciones públicas del panel:
   carta · disponibilidad · crearReserva · mesaQr · qrPedir · qrLlamar. Nunca manda precios ni totales: el panel los pone. */
(function () {
  const N = window.NEGOCIO || {};
  const modoDemo = () => !N.PANEL_URL || /[?&]demo=1/.test(location.search);
  const $ARS = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
  const pesos = (n) => $ARS.format(Number(n) || 0).replace(/\s/g, '');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const idAleatorio = (pre) => { const a = new Uint8Array(12); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => { a[i] = Math.random() * 255; }); return (pre || 'id') + '-' + Array.from(a, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 20); };

  async function llamar(action, payload) {
    if (modoDemo()) return window.PastoraDemo.llamar(action, payload || {});
    const url = N.PANEL_URL + '?action=' + encodeURIComponent(action) + '&payload=' + encodeURIComponent(JSON.stringify(payload || {}));
    try { return await (await fetch(url)).json(); }
    catch (e) { return { ok: false, code: 'RED', mensaje: 'No pudimos conectar. Revisá tu internet y probá de nuevo.' }; }
  }
  const guardada = (k) => { try { return JSON.parse(sessionStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const guardar = (k, v) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } };

  /* carta: se muestra al instante lo último que se vio y se renueva por detrás */
  async function carta(alActualizar) {
    const previa = guardada('carta:' + (N.PANEL_URL || 'demo'));
    const fresca = llamar('carta').then((d) => { if (d && d.ok) guardar('carta:' + (N.PANEL_URL || 'demo'), d); return d; });
    if (previa && alActualizar) { fresca.then((d) => { if (d && d.ok) alActualizar(d); }); return previa; }
    return fresca;
  }
  const porCategoria = (productos) => { const m = new Map(); (productos || []).forEach((p) => { const c = p.categoria || 'Otros'; if (!m.has(c)) m.set(c, []); m.get(c).push(p); }); return m; };
  const precioDe = (p) => { const pr = (p.presentaciones || []).map((x) => Number(x.precio)).filter((n) => n > 0); return pr.length ? { desde: true, valor: Math.min.apply(null, pr) } : { desde: false, valor: Number(p.precioBase) || 0 }; };
  const whatsappLink = (num, texto) => num ? 'https://wa.me/' + String(num).replace(/\D/g, '') + (texto ? '?text=' + encodeURIComponent(texto) : '') : '';

  window.Panel = { llamar, carta, porCategoria, precioDe, pesos, esc, idAleatorio, modoDemo, whatsappLink };
})();
