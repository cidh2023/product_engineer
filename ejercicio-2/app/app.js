/* Banco de Alimentos — MVP "Registro y Despacho de Entregas"
 * Vanilla JS, sin dependencias, offline con localStorage.
 * Secciones: 1) utilidades  2) almacenamiento  3) lógica de negocio  4) interfaz
 */
(() => {
  'use strict';

  /* ================= 1) Utilidades ================= */
  const CLAVE = 'bancoAlimentos.v1';
  const CICLO_DIAS = 7;      // R3: equidad (ciclo semanal móvil)
  const ALERTA_DIAS = 3;     // vence "pronto" si faltan menos de 3 días
  const MS_DIA = 86400000;

  // R7: canasta base sugerida (editable por Jorge)
  const CANASTA = [
    { producto: 'Arroz', cantidad: 2 },
    { producto: 'Atún', cantidad: 3 },
    { producto: 'Fideos', cantidad: 2 },
    { producto: 'Lentejas', cantidad: 1 },
    { producto: 'Leche', cantidad: 1 },
  ];

  const norm = (s) => String(s).trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const pad = (n) => String(n).padStart(2, '0');
  const fechaTexto = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const hoy = () => fechaTexto(new Date());
  const aFecha = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const diasEntre = (desde, hasta) => Math.round((aFecha(hasta) - aFecha(desde)) / MS_DIA);
  const sumarDias = (s, n) => { const d = aFecha(s); d.setDate(d.getDate() + n); return fechaTexto(d); };
  const bonita = (s) => aFecha(s).toLocaleDateString('es', { day: 'numeric', month: 'short' });
  const hace = (n) => (n <= 0 ? 'hoy' : n === 1 ? 'ayer' : `hace ${n} días`);
  const plural = (n, uno, varios) => (n === 1 ? uno : varios);

  /* ================= 2) Almacenamiento ================= */
  let estado = null;
  let guardadoOk = true;

  function datosIniciales() {
    const h = hoy();
    const ahora = new Date();
    const hace_ = (dias) => new Date(ahora.getTime() - dias * MS_DIA).toISOString();
    const familias = [
      { id: 'f1', codigo: 'F-001', nombre: 'Los Pérez', personas: 4 },
      { id: 'f2', codigo: 'F-002', nombre: 'Familia Gómez', personas: 3 },
      { id: 'f3', codigo: 'F-003', nombre: 'Familia Torres', personas: 6 },
      { id: 'f4', codigo: 'F-004', nombre: 'Familia Mendoza', personas: 2 },
      { id: 'f5', codigo: 'F-005', nombre: 'Familia Rojas', personas: 5 },
    ];
    const lotes = [
      { id: 'l1', producto: 'Arroz', unidad: 'bolsas', cantidad: 20, vence: sumarDias(h, 120) },
      { id: 'l2', producto: 'Atún', unidad: 'latas', cantidad: 10, vence: sumarDias(h, 12) },   // vence antes
      { id: 'l3', producto: 'Atún', unidad: 'latas', cantidad: 5, vence: sumarDias(h, 45) },    // vence después
      { id: 'l4', producto: 'Fideos', unidad: 'paquetes', cantidad: 12, vence: sumarDias(h, 90) },
      { id: 'l5', producto: 'Fideos', unidad: 'paquetes', cantidad: 4, vence: sumarDias(h, -3) }, // vencido
      { id: 'l6', producto: 'Lentejas', unidad: 'bolsas', cantidad: 15, vence: sumarDias(h, 150) },
      { id: 'l7', producto: 'Leche', unidad: 'cajas', cantidad: 6, vence: sumarDias(h, 2) },     // vence pronto
      { id: 'l8', producto: 'Leche', unidad: 'cajas', cantidad: 14, vence: sumarDias(h, 30) },
      { id: 'l9', producto: 'Aceite', unidad: 'botellas', cantidad: 8, vence: sumarDias(h, 200) },
    ];
    const entregas = [
      { id: 'e1', familiaId: 'f1', familiaNombre: 'Los Pérez', fecha: hace_(2), excepcion: false,
        items: [{ producto: 'Arroz', unidad: 'bolsas', cantidad: 2, lotes: [{ loteId: 'l1', cantidad: 2, vence: sumarDias(h, 120) }] }] },
      { id: 'e2', familiaId: 'f3', familiaNombre: 'Familia Torres', fecha: hace_(9), excepcion: false,
        items: [{ producto: 'Atún', unidad: 'latas', cantidad: 3, lotes: [{ loteId: 'l2', cantidad: 3, vence: sumarDias(h, 12) }] }] },
    ];
    return { familias, lotes, entregas };
  }

  function cargar() {
    try {
      const crudo = localStorage.getItem(CLAVE);
      if (crudo) {
        const e = JSON.parse(crudo);
        if (e && Array.isArray(e.familias) && Array.isArray(e.lotes) && Array.isArray(e.entregas)) return e;
      }
    } catch (_) { guardadoOk = false; }
    const nuevo = datosIniciales();
    estado = nuevo;
    guardar();
    return nuevo;
  }

  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(estado)); guardadoOk = true; }
    catch (_) { guardadoOk = false; }
  }

  /* ================= 3) Lógica de negocio ================= */

  // R1 + R2: lotes vigentes de un producto, ordenados FEFO
  function lotesVigentes(producto) {
    const h = hoy();
    return estado.lotes
      .filter((l) => norm(l.producto) === norm(producto) && l.cantidad > 0 && l.vence >= h)
      .sort((a, b) => a.vence.localeCompare(b.vence) || a.id.localeCompare(b.id));
  }
  const disponible = (producto) => lotesVigentes(producto).reduce((s, l) => s + l.cantidad, 0);

  // R1 + R5: reparte una cantidad entre lotes, primero los que vencen antes
  function asignar(producto, cantidad) {
    let resto = cantidad;
    const lotes = [];
    for (const l of lotesVigentes(producto)) {
      if (resto <= 0) break;
      const tomar = Math.min(l.cantidad, resto);
      lotes.push({ loteId: l.id, cantidad: tomar, vence: l.vence });
      resto -= tomar;
    }
    return { lotes, faltan: resto };
  }

  // R3: ¿la familia ya recibió comida en el ciclo?
  function estadoEquidad(familiaId) {
    const propias = estado.entregas.filter((e) => e.familiaId === familiaId);
    if (!propias.length) return { bloqueada: false, ultima: null };
    const ultima = propias.map((e) => e.fecha).sort().pop();
    const dias = diasEntre(fechaTexto(new Date(ultima)), hoy());
    return {
      bloqueada: dias < CICLO_DIAS,
      dias,
      puedeDesde: sumarDias(fechaTexto(new Date(ultima)), CICLO_DIAS),
      ultima,
    };
  }

  // R6: confirma validando de nuevo y guardando todo junto
  function confirmarEntrega(familiaId, carrito, conExcepcion) {
    const fam = estado.familias.find((f) => f.id === familiaId);
    if (!fam) return { ok: false, mensaje: 'No se encontró la familia.' };
    const eq = estadoEquidad(familiaId);
    if (eq.bloqueada && !conExcepcion) {
      return { ok: false, mensaje: `${fam.nombre} ya recibió comida ${hace(eq.dias)}.` };
    }
    const items = [];
    const plan = [];
    for (const it of carrito) {
      if (it.cantidad <= 0) continue;
      const a = asignar(it.producto, it.cantidad);
      if (a.faltan > 0) {
        return { ok: false, mensaje: `Ya no alcanza ${it.producto}. Revisa las cantidades.` };
      }
      plan.push(a);
      items.push({ producto: it.producto, unidad: it.unidad, cantidad: it.cantidad, lotes: a.lotes });
    }
    if (!items.length) return { ok: false, mensaje: 'Elige al menos un alimento para entregar.' };

    // Todo validado: ahora sí se descuenta (nunca a medias)
    for (const a of plan) {
      for (const t of a.lotes) {
        const lote = estado.lotes.find((l) => l.id === t.loteId);
        lote.cantidad -= t.cantidad;
      }
    }
    estado.lotes = estado.lotes.filter((l) => l.cantidad > 0);
    const entrega = {
      id: uid(), familiaId: fam.id, familiaNombre: fam.nombre,
      fecha: new Date().toISOString(), excepcion: !!(eq.bloqueada && conExcepcion), items,
    };
    estado.entregas.push(entrega);
    guardar();
    return { ok: true, entrega };
  }

  // Guardar comida que llega (suma al lote si coincide producto, unidad y fecha)
  function guardarComida({ producto, unidad, cantidad, vence }) {
    const nombre = String(producto).trim();
    if (!nombre) return { ok: false, mensaje: 'Escribe qué comida llegó.' };
    if (!Number.isInteger(cantidad) || cantidad < 1) return { ok: false, mensaje: 'La cantidad debe ser 1 o más.' };
    if (!vence) return { ok: false, mensaje: 'Elige la fecha en que vence.' };
    if (vence < hoy()) return { ok: false, mensaje: 'Esa comida ya está vencida. No se puede guardar.' };
    const existente = estado.lotes.find((l) => norm(l.producto) === norm(nombre));
    const canonico = existente ? existente.producto : nombre;
    const lote = estado.lotes.find((l) => norm(l.producto) === norm(canonico) && l.unidad === unidad && l.vence === vence);
    if (lote) lote.cantidad += cantidad;
    else estado.lotes.push({ id: uid(), producto: canonico, unidad, cantidad, vence });
    guardar();
    return { ok: true };
  }

  function guardarFamilia(nombre, personas) {
    const n = String(nombre).trim();
    if (!n) return { ok: false, mensaje: 'Escribe el nombre de la familia.' };
    if (!Number.isInteger(personas) || personas < 1) return { ok: false, mensaje: 'Indica cuántas personas son (1 o más).' };
    if (estado.familias.some((f) => norm(f.nombre) === norm(n))) return { ok: false, mensaje: 'Esa familia ya está registrada.' };
    const num = estado.familias.reduce((m, f) => Math.max(m, parseInt(f.codigo.split('-')[1], 10) || 0), 0) + 1;
    estado.familias.push({ id: uid(), codigo: `F-${String(num).padStart(3, '0')}`, nombre: n, personas });
    guardar();
    return { ok: true };
  }

  /* ================= 4) Interfaz ================= */
  const $app = document.getElementById('app');
  const $tabs = document.getElementById('tabs');
  const $banner = document.getElementById('banner');

  const ui = {
    pestana: 'entregar',
    paso: 1,
    familiaId: null,
    busqueda: '',
    carrito: [],            // [{ producto, unidad, cantidad }]
    pidiendoExcepcion: false,
    excepcionOk: false,
    ultimaEntrega: null,
  };

  function h(tag, attrs, ...hijos) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === false || v == null) continue;
      if (k === 'class') e.className = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (v === true) e.setAttribute(k, '');
      else e.setAttribute(k, v);
    }
    for (const hijo of hijos.flat()) {
      if (hijo == null || hijo === false) continue;
      e.append(hijo.nodeType ? hijo : document.createTextNode(String(hijo)));
    }
    return e;
  }

  function aviso(tipo, titulo, detalle) {
    $banner.replaceChildren(
      h('div', { class: `banner banner-${tipo}`, role: tipo === 'error' ? 'alert' : 'status' },
        titulo, detalle ? h('p', {}, detalle) : null)
    );
  }
  const limpiarAviso = () => $banner.replaceChildren();

  function irA(pestana) {
    ui.pestana = pestana;
    limpiarAviso();
    if (pestana === 'entregar') reiniciarEntrega();
    dibujar();
  }

  function reiniciarEntrega() {
    ui.paso = 1; ui.familiaId = null; ui.busqueda = '';
    ui.carrito = []; ui.pidiendoExcepcion = false; ui.excepcionOk = false; ui.ultimaEntrega = null;
  }

  function dibujar() {
    const pestanas = [
      ['entregar', '🧺 Entregar Comida'],
      ['almacen', '📦 Almacén'],
      ['familias', '👨‍👩‍👧 Familias'],
      ['historial', '📋 Historial'],
    ];
    $tabs.replaceChildren(...pestanas.map(([id, texto]) =>
      h('button', { class: 'tab', type: 'button', 'aria-current': ui.pestana === id ? 'page' : false, onclick: () => irA(id) }, texto)));

    if (!guardadoOk && !$banner.firstChild) {
      aviso('aviso', 'Atención: no se puede guardar en este navegador.', 'Lo que registres se perderá al cerrar la página.');
    }

    const vistas = { entregar: vistaEntregar, almacen: vistaAlmacen, familias: vistaFamilias, historial: vistaHistorial };
    $app.replaceChildren(vistas[ui.pestana]());
  }

  /* ---------- Entregar: pasos ---------- */
  function cabeceraPaso(n, titulo) {
    return h('div', {},
      h('div', { class: 'paso' }, `Paso ${n} de 3`),
      h('div', { class: 'pasos-barra', 'aria-hidden': 'true' },
        [1, 2, 3].map((i) => h('span', { class: i <= n ? 'hecho' : '' }))),
      h('h2', {}, titulo));
  }

  function vistaEntregar() {
    if (ui.paso === 1) return paso1();
    if (ui.paso === 2) return paso2();
    return paso3();
  }

  function paso1() {
    const lista = h('ul', { class: 'lista', id: 'lista-familias' });
    const buscador = h('input', {
      id: 'busqueda', type: 'search', autocomplete: 'off', placeholder: 'Ej.: Gómez o F-002', value: ui.busqueda,
      oninput: (e) => { ui.busqueda = e.target.value; pintarFamilias(lista); },
    });
    buscador.value = ui.busqueda;
    pintarFamilias(lista);
    return h('section', {},
      cabeceraPaso(1, '¿Quién recibe la comida?'),
      h('div', { class: 'campo' }, h('label', { for: 'busqueda' }, 'Busca por nombre o código'), buscador),
      lista);
  }

  function pintarFamilias(lista) {
    const q = norm(ui.busqueda);
    const encontradas = estado.familias.filter((f) => !q || norm(f.nombre).includes(q) || norm(f.codigo).includes(q));
    if (!encontradas.length) {
      lista.replaceChildren(h('li', { class: 'banner banner-aviso' },
        'No se encontró la familia.', h('p', {}, 'Revisa el nombre o regístrala en la sección Familias.')));
      return;
    }
    lista.replaceChildren(...encontradas.map((f) => {
      const eq = estadoEquidad(f.id);
      const etiqueta = eq.bloqueada
        ? h('span', { class: 'etiqueta etiqueta-roja' }, `⛔ Ya recibió comida ${hace(eq.dias)}`)
        : eq.ultima
          ? h('span', { class: 'etiqueta etiqueta-verde' }, `✔ Puede recibir (última: ${hace(eq.dias)})`)
          : h('span', { class: 'etiqueta etiqueta-verde' }, '✔ Primera vez');
      return h('li', { class: 'tarjeta', 'data-familia': f.nombre },
        h('div', { class: 'info' },
          h('strong', {}, f.nombre),
          h('span', { class: 'suave' }, `${f.codigo} · ${f.personas} ${plural(f.personas, 'persona', 'personas')}`),
          h('div', {}, etiqueta)),
        h('button', { class: 'btn btn-primario', type: 'button', onclick: () => elegirFamilia(f.id) }, '👉 Elegir'));
    }));
  }

  function elegirFamilia(id) {
    ui.familiaId = id;
    ui.paso = 2;
    ui.pidiendoExcepcion = false;
    ui.excepcionOk = false;
    ui.carrito = CANASTA.map((c) => {
      const lote = estado.lotes.find((l) => norm(l.producto) === norm(c.producto));
      const nombre = lote ? lote.producto : c.producto;
      return { producto: nombre, unidad: lote ? lote.unidad : 'unidades', cantidad: Math.min(c.cantidad, disponible(nombre)) };
    });
    limpiarAviso();
    dibujar();
    $app.focus();
  }

  function paso2() {
    const fam = estado.familias.find((f) => f.id === ui.familiaId);
    const eq = estadoEquidad(fam.id);
    const bloqueado = eq.bloqueada && !ui.excepcionOk;
    const total = ui.carrito.reduce((s, i) => s + i.cantidad, 0);

    const partes = [
      h('button', { class: 'enlace', type: 'button', onclick: () => { reiniciarEntrega(); limpiarAviso(); dibujar(); } }, '← Cambiar familia'),
      cabeceraPaso(2, `Comida para ${fam.nombre}`),
    ];

    if (eq.bloqueada && !ui.excepcionOk) {
      const acciones = ui.pidiendoExcepcion
        ? h('div', { class: 'acciones' },
            h('button', { class: 'btn btn-alerta', id: 'btn-excepcion-si', type: 'button',
              onclick: () => { ui.excepcionOk = true; ui.pidiendoExcepcion = false; dibujar(); } }, 'Sí, entregar de todos modos'),
            h('button', { class: 'btn', type: 'button', onclick: () => { ui.pidiendoExcepcion = false; dibujar(); } }, 'No, volver'))
        : h('div', { class: 'acciones' },
            h('button', { class: 'btn', id: 'btn-excepcion', type: 'button',
              onclick: () => { ui.pidiendoExcepcion = true; dibujar(); } }, '🔑 Pedir permiso especial'));
      partes.push(h('div', { class: 'banner banner-error', id: 'alerta-equidad', role: 'alert' },
        `⛔ ${fam.nombre} ya recibió comida ${hace(eq.dias)}.`,
        h('p', {}, `Podrá recibir otra entrega el ${bonita(eq.puedeDesde)}. Así la comida alcanza para todas las familias.`),
        ui.pidiendoExcepcion ? h('p', {}, 'Solo el coordinador debería autorizar esto. Quedará anotado en el Historial. ¿Seguro?') : null,
        acciones));
    } else if (eq.bloqueada && ui.excepcionOk) {
      partes.push(h('div', { class: 'banner banner-aviso', id: 'aviso-excepcion' },
        '🔑 Permiso especial activado.', h('p', {}, 'Esta entrega quedará marcada en el Historial.')));
    }

    const vencidos = estado.lotes.filter((l) => l.vence < hoy() && l.cantidad > 0);
    if (vencidos.length) {
      partes.push(h('div', { class: 'banner banner-aviso' },
        `Hay comida vencida en el almacén (${[...new Set(vencidos.map((l) => l.producto))].join(', ')}).`,
        h('p', {}, 'No se entregará. Sepárala en la sección Almacén.')));
    }

    partes.push(h('ul', { class: 'lista', style: 'margin-top:16px' }, ui.carrito.map(itemCarrito)));
    partes.push(selectorOtro());

    partes.push(h('div', { class: 'resumen', id: 'resumen' },
      total > 0
        ? `Vas a entregar ${total} ${plural(total, 'producto', 'productos')} a ${fam.nombre}.`
        : 'Todavía no elegiste ningún alimento. Sube alguna cantidad con el botón ＋.'));

    partes.push(h('button', {
      class: 'btn btn-primario btn-grande', id: 'btn-confirmar', type: 'button',
      disabled: bloqueado || total === 0, onclick: confirmar,
    }, '✅ Confirmar entrega'));

    return h('section', {}, partes);
  }

  function itemCarrito(it) {
    const max = disponible(it.producto);
    const vigentes = lotesVigentes(it.producto);
    const primero = vigentes[0];
    const pronto = primero && diasEntre(hoy(), primero.vence) < ALERTA_DIAS;
    const { lotes } = asignar(it.producto, it.cantidad);
    const detalle = it.cantidad > 0
      ? 'Saldrá: ' + lotes.map((t) => `${t.cantidad} que ${plural(t.cantidad, 'vence', 'vencen')} el ${bonita(t.vence)}`).join(' + ')
      : (max === 0 ? 'Sin existencias en el almacén.' : `Hay ${max} ${it.unidad}.`);

    return h('li', { class: `tarjeta ${pronto ? 'pronto' : ''}`, 'data-producto': it.producto },
      h('div', { class: 'info' },
        h('strong', {}, it.producto),
        h('span', { class: 'suave lotes' }, detalle),
        pronto ? h('div', {}, h('span', { class: 'etiqueta etiqueta-roja' }, '⚠ Vence pronto')) : null,
        it.cantidad >= max && max > 0 ? h('div', {}, h('span', { class: 'etiqueta etiqueta-gris' }, `Es todo lo que hay (${max})`)) : null),
      h('div', { class: 'cantidad' },
        h('button', { class: 'btn btn-menos', type: 'button', 'aria-label': `Quitar uno de ${it.producto}`,
          disabled: it.cantidad <= 0, onclick: () => cambiarCantidad(it.producto, -1) }, '−'),
        h('span', { class: 'valor', 'aria-live': 'polite' }, it.cantidad),
        h('button', { class: 'btn btn-mas', type: 'button', 'aria-label': `Agregar uno de ${it.producto}`,
          disabled: it.cantidad >= max, onclick: () => cambiarCantidad(it.producto, 1) }, '＋')));
  }

  function cambiarCantidad(producto, delta) {
    const it = ui.carrito.find((i) => i.producto === producto);
    it.cantidad = Math.max(0, Math.min(disponible(producto), it.cantidad + delta));
    dibujar();
  }

  function selectorOtro() {
    const enCarrito = new Set(ui.carrito.map((i) => norm(i.producto)));
    const otros = [...new Map(estado.lotes
      .filter((l) => disponible(l.producto) > 0 && !enCarrito.has(norm(l.producto)))
      .map((l) => [norm(l.producto), l])).values()];
    if (!otros.length) return null;
    const sel = h('select', { id: 'otro-alimento', 'aria-label': 'Agregar otro alimento' },
      h('option', { value: '' }, 'Agregar otro alimento…'),
      otros.map((l) => h('option', { value: l.producto }, l.producto)));
    sel.addEventListener('change', () => {
      if (!sel.value) return;
      const l = otros.find((o) => o.producto === sel.value);
      ui.carrito.push({ producto: l.producto, unidad: l.unidad, cantidad: 1 });
      dibujar();
    });
    return h('div', { class: 'campo', style: 'margin-top:16px' }, sel);
  }

  function confirmar() {
    const r = confirmarEntrega(ui.familiaId, ui.carrito, ui.excepcionOk);
    if (!r.ok) {
      aviso('error', r.mensaje);
      dibujar();
      return;
    }
    ui.ultimaEntrega = r.entrega;
    ui.paso = 3;
    limpiarAviso();
    dibujar();
    $app.focus();
  }

  function paso3() {
    const e = ui.ultimaEntrega;
    return h('section', { class: 'exito', id: 'exito', role: 'status' },
      h('div', { class: 'grande', 'aria-hidden': 'true' }, '✅'),
      h('h2', {}, `¡Entrega Exitosa a ${e.familiaNombre}!`),
      e.excepcion ? h('p', {}, '🔑 Quedó anotada como permiso especial.') : null,
      h('ul', {}, e.items.map((i) => h('li', {}, `• ${i.cantidad} ${i.unidad} de ${i.producto}`))),
      h('button', { class: 'btn btn-primario btn-grande', id: 'btn-nueva', type: 'button',
        onclick: () => { reiniciarEntrega(); dibujar(); } }, '➕ Hacer otra entrega'));
  }

  /* ---------- Almacén ---------- */
  function vistaAlmacen() {
    const h0 = hoy();
    const orden = [...estado.lotes].sort((a, b) => a.vence.localeCompare(b.vence));
    const productos = [...new Set(estado.lotes.map((l) => l.producto))].sort((a, b) => a.localeCompare(b, 'es'));

    const form = h('form', { id: 'form-comida', novalidate: true,
      onsubmit: (ev) => {
        ev.preventDefault();
        const f = ev.target;
        const r = guardarComida({
          producto: f.producto.value, unidad: f.unidad.value,
          cantidad: parseInt(f.cantidad.value, 10), vence: f.vence.value,
        });
        if (!r.ok) { aviso('error', r.mensaje); return; }
        aviso('ok', '✅ Comida Guardada');
        dibujar();
      } },
      h('div', { class: 'campo' }, h('label', { for: 'producto' }, '¿Qué comida llegó?'),
        h('input', { id: 'producto', name: 'producto', list: 'productos', autocomplete: 'off', placeholder: 'Ej.: Frijoles' }),
        h('datalist', { id: 'productos' }, productos.map((p) => h('option', { value: p })))),
      h('div', { class: 'fila' },
        h('div', { class: 'campo' }, h('label', { for: 'cantidad' }, '¿Cuántas?'),
          h('input', { id: 'cantidad', name: 'cantidad', type: 'number', min: '1', inputmode: 'numeric' })),
        h('div', { class: 'campo' }, h('label', { for: 'unidad' }, 'Se cuentan en'),
          h('select', { id: 'unidad', name: 'unidad' },
            ['unidades', 'bolsas', 'latas', 'paquetes', 'cajas', 'botellas'].map((u) => h('option', { value: u }, u))))),
      h('div', { class: 'campo' }, h('label', { for: 'vence' }, '¿Cuándo vence?'),
        h('input', { id: 'vence', name: 'vence', type: 'date', min: h0 })),
      h('button', { class: 'btn btn-primario btn-grande', type: 'submit' }, '💾 Guardar comida'));

    const lista = orden.length
      ? h('ul', { class: 'lista' }, orden.map((l) => {
          const dias = diasEntre(h0, l.vence);
          const vencido = dias < 0;
          const pronto = !vencido && dias < ALERTA_DIAS;
          return h('li', { class: `tarjeta ${vencido ? 'vencido' : pronto ? 'pronto' : ''}`, 'data-lote': l.producto },
            h('div', { class: 'info' },
              h('strong', {}, `${l.producto}: ${l.cantidad} ${l.unidad}`),
              h('span', { class: 'suave' }, `Vence el ${bonita(l.vence)}`),
              vencido ? h('div', {}, h('span', { class: 'etiqueta etiqueta-roja' }, '⛔ Vencido — sepáralo'))
                : pronto ? h('div', {}, h('span', { class: 'etiqueta etiqueta-roja' }, '⚠ Vence pronto')) : null),
            vencido ? h('button', { class: 'btn btn-alerta', type: 'button',
              onclick: () => { estado.lotes = estado.lotes.filter((x) => x.id !== l.id); guardar(); aviso('ok', 'Comida vencida retirada del almacén.'); dibujar(); } }, '🗑 Ya la separé') : null);
        }))
      : h('p', {}, 'El almacén está vacío. Registra lo que llegó arriba.');

    const totales = h('p', { class: 'suave' }, productos.map((p) => `${p}: ${disponible(p)}`).join(' · ') || '');

    return h('section', {},
      h('h2', {}, 'Registra lo que llegó'), form,
      h('div', { class: 'bloque' }, h('h2', {}, 'Lo que hay en el almacén'),
        h('p', { class: 'suave' }, 'Ordenado por fecha: lo que vence primero aparece primero. (Los totales no incluyen lo vencido.)'),
        totales, lista),
      h('div', { class: 'bloque' },
        h('button', { class: 'enlace', type: 'button', id: 'btn-reiniciar', onclick: () => {
          if (window.confirm('Esto borra todo lo registrado y vuelve a los datos de ejemplo. ¿Seguro?')) {
            estado = datosIniciales(); guardar(); limpiarAviso(); reiniciarEntrega(); aviso('ok', 'Datos de ejemplo restaurados.'); dibujar();
          }
        } }, 'Restaurar datos de ejemplo')));
  }

  /* ---------- Familias ---------- */
  function vistaFamilias() {
    const form = h('form', { id: 'form-familia', novalidate: true,
      onsubmit: (ev) => {
        ev.preventDefault();
        const f = ev.target;
        const r = guardarFamilia(f.nombre.value, parseInt(f.personas.value, 10));
        if (!r.ok) { aviso('error', r.mensaje); return; }
        aviso('ok', '✅ Familia Guardada');
        dibujar();
      } },
      h('div', { class: 'fila' },
        h('div', { class: 'campo' }, h('label', { for: 'nombre' }, 'Nombre de la familia'),
          h('input', { id: 'nombre', name: 'nombre', autocomplete: 'off', placeholder: 'Ej.: Familia Castro' })),
        h('div', { class: 'campo' }, h('label', { for: 'personas' }, '¿Cuántas personas son?'),
          h('input', { id: 'personas', name: 'personas', type: 'number', min: '1', inputmode: 'numeric' }))),
      h('button', { class: 'btn btn-primario btn-grande', type: 'submit' }, '💾 Guardar familia'));

    return h('section', {},
      h('h2', {}, 'Registrar una familia nueva'), form,
      h('div', { class: 'bloque' }, h('h2', {}, 'Familias registradas'),
        h('ul', { class: 'lista' }, estado.familias.map((f) => h('li', { class: 'tarjeta' },
          h('div', { class: 'info' }, h('strong', {}, f.nombre),
            h('span', { class: 'suave' }, `${f.codigo} · ${f.personas} ${plural(f.personas, 'persona', 'personas')}`)))))));
  }

  /* ---------- Historial ---------- */
  function vistaHistorial() {
    const lista = [...estado.entregas].sort((a, b) => b.fecha.localeCompare(a.fecha));
    return h('section', {},
      h('h2', {}, 'Entregas realizadas'),
      lista.length
        ? h('ul', { class: 'lista' }, lista.map((e) => {
            const dias = diasEntre(fechaTexto(new Date(e.fecha)), hoy());
            return h('li', { class: 'tarjeta' },
              h('div', { class: 'info' },
                h('strong', {}, e.familiaNombre),
                h('span', { class: 'suave' }, `${hace(dias)[0].toUpperCase()}${hace(dias).slice(1)} · ${bonita(fechaTexto(new Date(e.fecha)))}`),
                h('span', { class: 'suave' }, e.items.map((i) => `${i.cantidad} ${i.producto}`).join(', ')),
                e.excepcion ? h('div', {}, h('span', { class: 'etiqueta etiqueta-roja' }, '🔑 Permiso especial')) : null));
          }))
        : h('p', {}, 'Todavía no hay entregas.'));
  }

  /* ---------- Arranque ---------- */
  estado = cargar();
  dibujar();
})();
