/* Modo demostración: contesta como el panel (mismo formato) con una carta de ejemplo, para mostrar la web sin conexión. NO se usa cuando hay PANEL_URL. */
(function () {
  const L = (id, nombre, categoria, precio, descripcion, estacion) => ({ productoId: id, nombre, categoria, precioBase: precio, descripcion: descripcion || '', imagenUrl: '', presentaciones: [], estacion: estacion || 'cocina' });
  const PRODUCTOS = [
    L('p01', 'Pan de masa madre', 'Panadería', 4800, 'Hogaza de fermentación lenta, corteza crocante.'),
    L('p02', 'Focaccia de romero', 'Panadería', 5200, 'Con sal en escamas y aceite de oliva.'),
    L('p03', 'Medialuna de manteca', 'Panadería', 1600, 'Hojaldrada, de horno del día.'),
    L('p04', 'Croissant de almendras', 'Panadería', 3900, 'Relleno de crema de almendras.'),
    L('p05', 'Espresso', 'Café', 2400, 'Café de especialidad.', 'barra'),
    L('p06', 'Cappuccino', 'Café', 3600, '', 'barra'),
    L('p07', 'Flat white', 'Café', 3800, 'Doble shot, leche texturizada.', 'barra'),
    L('p08', 'Café de filtro', 'Café', 3200, 'Método V60, de temporada.', 'barra'),
    L('p09', 'Tabla de quesos y fiambres', 'Para compartir', 18500, 'Selección de la casa con pan y dulces.'),
    L('p10', 'Tostado de jamón crudo', 'Para compartir', 9800, 'Pan de masa madre, queso fontina y rúcula.'),
    L('p11', 'Hummus con pan', 'Para compartir', 7900, 'Garbanzos, tahini y pimentón ahumado.'),
    L('p12', 'Torta de zanahoria', 'Dulces', 5600, 'Con frosting de queso crema y nueces.'),
    L('p13', 'Budín de limón', 'Dulces', 4200, 'Glaseado cítrico.'),
    L('p14', 'Alfajor de maicena', 'Dulces', 2800, 'Dulce de leche y coco.'),
    L('p15', 'Copa de Malbec', 'Vinos', 4500, 'Valle de Uco.', 'barra'),
    L('p16', 'Copa de Chardonnay', 'Vinos', 4500, 'Fresco y mineral.', 'barra'),
    L('p17', 'Botella Malbec reserva', 'Vinos', 22000, '750 ml.', 'barra')
  ];
  const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
  const ls = { get: (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* nada */ } } };
  const hoy = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const ETIQ = { por_confirmar: 'Esperando que el personal lo confirme', nuevo: 'Recibido', preparando: 'En preparación', listo: 'Listo, ya te lo llevan', entregado: 'Entregado' };
  const estadoPor = (seg) => (seg < 7 ? 'por_confirmar' : seg < 15 ? 'nuevo' : seg < 28 ? 'preparando' : seg < 42 ? 'listo' : 'entregado');

  async function llamar(action, d) {
    await pausa(220);
    if (action === 'carta') return { ok: true, productos: PRODUCTOS, config: { nombreNegocio: 'Pastora', whatsappNumero: '' }, demo: true };
    if (action === 'disponibilidad') {
      const n = Number(d.personas) || 2, horarios = [];
      if (!d.fecha || d.fecha < hoy()) return { ok: false, code: 'VALIDACION', mensaje: 'Elegí una fecha válida.' };
      const ahora = new Date(), esHoy = d.fecha === hoy(), min = ahora.getHours() * 60 + ahora.getMinutes();
      for (let t = 9 * 60; t <= 20 * 60 + 30; t += 30) {
        if (esHoy && t < min + 20) continue;
        if ((t / 30 + n + Number(d.fecha.slice(-2))) % 7 === 0) continue;   // algunos horarios «completos» para que se vea real
        horarios.push({ hora: String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'), zonas: ['Salón', 'Vereda'] });
      }
      if (n > 8) return { ok: true, fecha: d.fecha, personas: n, zonas: ['Salón', 'Vereda'], horarios: [], mensaje: 'Para grupos de más de 8 personas escribinos por WhatsApp y lo coordinamos.' };
      return { ok: true, fecha: d.fecha, personas: n, zonas: ['Salón', 'Vereda'], duracionMin: 90, horarios: horarios, mensaje: horarios.length ? '' : 'No hay lugar ese día. Probá otro día o escribinos por WhatsApp.' };
    }
    if (action === 'crearReserva') {
      if (!d.nombre || String(d.nombre).trim().length < 2) return { ok: false, code: 'VALIDACION', mensaje: 'Revisá los datos de la reserva.', campos: { nombre: 'Escribí tu nombre.' } };
      if (!/\d{3}.*\d{6,}|\d{9,}/.test(String(d.telefono || '').replace(/\D/g, '') ? String(d.telefono) : '')) return { ok: false, code: 'VALIDACION', mensaje: 'Revisá los datos de la reserva.', campos: { telefono: 'Poné tu teléfono con código de área, por ejemplo 342 5123456.' } };
      const n = (ls.get('demo_nres') || 0) + 1; ls.set('demo_nres', n);
      return { ok: true, reservaId: d.reservaId, numero: n, estado: 'pendiente', fecha: d.fecha, hora: d.hora, personas: d.personas, zona: d.zona || 'Salón', whatsappUrl: '' };
    }
    const token = String(d.token || '');
    if (!/^[A-Za-z0-9]{24,48}$/.test(token)) return { ok: false, code: 'NO_ENCONTRADO', mensaje: 'Este código ya no está activo. Pedile ayuda al personal.' };
    const est = ls.get('demo_mesa_' + token) || { pedidos: [], aviso: '' };
    if (action === 'mesaQr') {
      const ahora = Date.now(), pedidos = [];
      est.pedidos.forEach((p) => p.items.forEach((i) => { const e = estadoPor((ahora - p.t) / 1000); pedidos.push({ nombre: i.nombre, detalle: '', cantidad: i.cantidad, estado: e, estadoTexto: ETIQ[e] }); }));
      return { ok: true, negocio: 'Pastora', whatsappNumero: '', mesa: { numero: 5, zona: 'Salón' }, productos: PRODUCTOS, aviso: est.aviso && ahora - est.avisoT < 90000 ? est.aviso : '', pedidos: pedidos, mostrarEstado: true, demo: true };
    }
    if (action === 'qrPedir') {
      if (!Array.isArray(d.items) || !d.items.length) return { ok: false, code: 'VALIDACION', mensaje: 'Elegí al menos un plato o bebida.' };
      if (!est.pedidos.some((p) => p.id === d.pedidoQrId)) { est.pedidos.push({ id: d.pedidoQrId, t: Date.now(), items: d.items.map((i) => ({ nombre: (PRODUCTOS.find((p) => p.productoId === i.productoId) || {}).nombre || 'Pedido', cantidad: i.cantidad })) }); ls.set('demo_mesa_' + token, est); }
      return { ok: true, renglones: d.items.length, avisos: [], mensaje: 'Recibimos tu pedido. El personal lo confirma y avisa a cocina.' };
    }
    if (action === 'qrLlamar') {
      est.aviso = { mozo: 'llamo', carta: 'pidio_carta', cuenta: 'pidio_cuenta' }[d.motivo] || ''; est.avisoT = Date.now(); ls.set('demo_mesa_' + token, est);
      return { ok: true, aviso: est.aviso, mensaje: 'Ya avisamos al personal.' };
    }
    return { ok: false, code: 'NO_ENCONTRADO', mensaje: 'Esa acción no existe.' };
  }
  window.PastoraDemo = { llamar };
})();
