/* Pruebas de aceptación (CA-1 a CA-9) con Playwright.
 * Uso:  node tests/aceptacion.js   (requiere: npm i playwright)
 */
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const URL = 'file://' + path.resolve(__dirname, '../app/index.html');
const CLAVE = 'bancoAlimentos.v1';
let pasadas = 0;

async function nuevaPagina(browser) {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL);
  return page;
}
const leer = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), CLAVE);
const elegir = (page, nombre) => page.locator(`li[data-familia="${nombre}"] button`).click();
const stock = (e, producto) => e.lotes.filter((l) => l.producto === producto).reduce((s, l) => s + l.cantidad, 0);

async function prueba(nombre, fn, browser) {
  const page = await nuevaPagina(browser);
  try { await fn(page); pasadas++; console.log('  ✔', nombre); }
  catch (e) { console.error('  ✘', nombre, '\n   ', e.message); process.exitCode = 1; }
  finally { await page.context().close(); }
}

(async () => {
  const browser = await chromium.launch();
  console.log('Criterios de aceptación — Banco de Alimentos');

  await prueba('CA-1 Equidad: Los Pérez (hace 2 días) quedan bloqueados con aviso rojo', async (p) => {
    await elegir(p, 'Los Pérez');
    const alerta = p.locator('#alerta-equidad');
    assert.match(await alerta.innerText(), /ya recibió comida hace 2 días/);
    assert.ok(await p.locator('#btn-confirmar').isDisabled(), 'el botón debe estar bloqueado');
    const color = await alerta.evaluate((el) => getComputedStyle(el).backgroundColor);
    assert.strictEqual(color, 'rgb(253, 237, 236)'); // banner rojo suave
  }, browser);

  await prueba('CA-2 FEFO: atún sale primero del lote que vence antes', async (p) => {
    await elegir(p, 'Familia Gómez');
    const atun = p.locator('li[data-producto="Atún"]');
    const mas = atun.locator('.btn-mas');
    for (let i = 0; i < 9; i++) await mas.click();      // 3 sugeridas + 9 = 12
    assert.strictEqual(await atun.locator('.valor').innerText(), '12');
    const detalle = await atun.locator('.lotes').innerText();
    assert.match(detalle, /^Saldrá: 10 que vencen el .* \+ 2 que vencen el /);
    await p.locator('#btn-confirmar').click();
    const e = await leer(p);
    const atunLotes = e.lotes.filter((l) => l.producto === 'Atún');
    assert.strictEqual(atunLotes.length, 1, 'el lote más próximo (10) debe agotarse');
    assert.strictEqual(atunLotes[0].cantidad, 3, 'del segundo lote quedan 5 − 2 = 3');
  }, browser);

  await prueba('CA-3 Inventario: 2 bolsas de arroz → de 20 a 18', async (p) => {
    assert.strictEqual(stock(await leer(p), 'Arroz'), 20);
    await elegir(p, 'Familia Gómez');
    assert.strictEqual(await p.locator('li[data-producto="Arroz"] .valor').innerText(), '2');
    await p.locator('#btn-confirmar').click();
    assert.strictEqual(stock(await leer(p), 'Arroz'), 18);
  }, browser);

  await prueba('CA-4 Confirmación: "¡Entrega Exitosa a [Familia]!" grande y verde', async (p) => {
    await elegir(p, 'Familia Gómez');
    await p.locator('#btn-confirmar').click();
    const titulo = p.locator('#exito h2');
    assert.strictEqual(await titulo.innerText(), '¡Entrega Exitosa a Familia Gómez!');
    const est = await titulo.evaluate((el) => ({ c: getComputedStyle(el).color, f: parseFloat(getComputedStyle(el).fontSize) }));
    assert.strictEqual(est.c, 'rgb(30, 132, 73)');
    assert.ok(est.f >= 40, `tamaño ${est.f}px debe ser ≥ 40`);
  }, browser);

  await prueba('CA-5 Vencidos: los fideos vencidos nunca se usan y se marcan en el Almacén', async (p) => {
    await elegir(p, 'Familia Gómez');
    assert.match(await p.locator('#app').innerText(), /comida vencida/i);
    const fideos = p.locator('li[data-producto="Fideos"]');
    assert.match(await fideos.locator('.lotes').innerText(), /^Saldrá: 2 que vencen/);
    await p.locator('#btn-confirmar').click();
    const e = await leer(p);
    const vencido = e.lotes.find((l) => l.producto === 'Fideos' && l.vence < new Date().toISOString().slice(0, 10));
    assert.strictEqual(vencido.cantidad, 4, 'el lote vencido no se toca');
    await p.getByRole('button', { name: /Almacén/ }).click();
    assert.match(await p.locator('#app').innerText(), /Vencido — sepáralo/);
  }, browser);

  await prueba('CA-6 Stock insuficiente: no pasa del máximo y lo explica', async (p) => {
    await elegir(p, 'Familia Gómez');
    const lentejas = p.locator('li[data-producto="Lentejas"]');
    for (let i = 0; i < 20; i++) { if (await lentejas.locator('.btn-mas').isDisabled()) break; await lentejas.locator('.btn-mas').click(); }
    assert.strictEqual(await lentejas.locator('.valor').innerText(), '15');
    assert.ok(await lentejas.locator('.btn-mas').isDisabled());
    assert.match(await lentejas.innerText(), /Es todo lo que hay \(15\)/);
  }, browser);

  await prueba('CA-7 Excepción: con permiso especial se entrega y queda marcada', async (p) => {
    await elegir(p, 'Los Pérez');
    await p.locator('#btn-excepcion').click();
    await p.locator('#btn-excepcion-si').click();
    assert.ok(await p.locator('#aviso-excepcion').isVisible());
    await p.locator('#btn-confirmar').click();
    assert.match(await p.locator('#exito').innerText(), /¡Entrega Exitosa a Los Pérez!/);
    const e = await leer(p);
    assert.strictEqual(e.entregas.filter((x) => x.familiaId === 'f1').pop().excepcion, true);
    await p.getByRole('button', { name: /Historial/ }).click();
    assert.match(await p.locator('#app').innerText(), /Permiso especial/);
  }, browser);

  await prueba('CA-8 Equidad tras entregar: la familia queda bloqueada', async (p) => {
    await elegir(p, 'Familia Gómez');
    await p.locator('#btn-confirmar').click();
    await p.locator('#btn-nueva').click();
    await elegir(p, 'Familia Gómez');
    assert.match(await p.locator('#alerta-equidad').innerText(), /ya recibió comida hoy/);
    assert.ok(await p.locator('#btn-confirmar').isDisabled());
  }, browser);

  await prueba('CA-9 Canasta vacía: confirmar está desactivado', async (p) => {
    await elegir(p, 'Familia Gómez');
    for (const prod of ['Arroz', 'Atún', 'Fideos', 'Lentejas', 'Leche']) {
      const it = p.locator(`li[data-producto="${prod}"]`);
      while (!(await it.locator('.btn-menos').isDisabled())) await it.locator('.btn-menos').click();
    }
    assert.ok(await p.locator('#btn-confirmar').isDisabled());
    assert.match(await p.locator('#resumen').innerText(), /Todavía no elegiste/);
  }, browser);

  await prueba('UX: tamaños mínimos (texto ≥18px, botones ≥48px) y búsqueda por código', async (p) => {
    const f = await p.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize));
    assert.ok(f >= 18);
    const cajas = await p.locator('button.btn, button.tab').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()));
    assert.ok(cajas.length > 0 && cajas.every((b) => b.height >= 48 && b.width >= 48), 'todos los botones ≥ 48×48');
    await p.locator('#busqueda').fill('F-004');
    assert.strictEqual(await p.locator('li[data-familia]').count(), 1);
    await p.locator('#busqueda').fill('zzz');
    assert.match(await p.locator('#lista-familias').innerText(), /No se encontró la familia/);
  }, browser);

  await prueba('Seguridad: un nombre con HTML se muestra como texto, no se ejecuta', async (p) => {
    await p.getByRole('button', { name: /Familias/ }).click();
    await p.locator('#nombre').fill('<img src=x onerror=window.__hack=1>');
    await p.locator('#personas').fill('3');
    await p.getByRole('button', { name: /Guardar familia/ }).click();
    assert.strictEqual(await p.evaluate(() => window.__hack), undefined);
    assert.match(await p.locator('#app').innerText(), /<img src=x/);
  }, browser);

  await prueba('Almacén: "Comida Guardada" suma al lote y rechaza fechas vencidas', async (p) => {
    await p.getByRole('button', { name: /Almacén/ }).click();
    await p.locator('#producto').fill('Frijoles');
    await p.locator('#cantidad').fill('7');
    await p.locator('#vence').fill('2000-01-01');
    await p.getByRole('button', { name: /Guardar comida/ }).click();
    assert.match(await p.locator('#banner').innerText(), /ya está vencida/);
    const manana = new Date(Date.now() + 5 * 864e5);
    const f = `${manana.getFullYear()}-${String(manana.getMonth() + 1).padStart(2, '0')}-${String(manana.getDate()).padStart(2, '0')}`;
    await p.locator('#producto').fill('frijoles');
    await p.locator('#cantidad').fill('7');
    await p.locator('#vence').fill(f);
    await p.getByRole('button', { name: /Guardar comida/ }).click();
    assert.match(await p.locator('#banner').innerText(), /Comida Guardada/);
    assert.strictEqual(stock(await leer(p), 'frijoles'), 7);
  }, browser);

  await browser.close();
  console.log(`\n${pasadas} pruebas pasaron.`);
  if (process.exitCode) console.log('Hay pruebas fallidas.');
})();
