# SPEC — Feature: Registro y Despacho de Entregas

| | |
|---|---|
| **Proyecto** | Sistema Banco de Alimentos |
| **Feature** | Registro y Despacho de Entregas (núcleo del sistema) |
| **Estado** | Listo para implementar |
| **Contexto** | Ver `CONTEXT.md` · Marca: `skills/diseno-marca/SKILL.md` |

## 1. Definición del problema
Sin registro, las familias hacen fila y reciben comida de forma desorganizada: algunas reciben varias veces y otras ninguna, lo que genera conflictos. Además, los voluntarios no saben qué producto entregar primero, y la comida se vence en el almacén.

**Resultado deseado:** que cualquier voluntario nuevo, sin capacitación, entregue una canasta equitativa y priorizando lo que vence primero, en menos de 1 minuto.

## 2. Alcance
**Incluye (MVP):**
- Buscar familia por nombre o código.
- Canasta sugerida automáticamente con FEFO.
- Bloqueo por equidad (7 días) con excepción explícita.
- Descuento de inventario y registro en historial.
- Pantalla de confirmación.
- Apoyo mínimo para que el flujo sea usable: registrar comida que llega, registrar familias, ver historial.

**No incluye (fuera de alcance):** login/roles, sincronización entre dispositivos, reportes avanzados, impresión de comprobantes, códigos de barras.

## 3. Diseño de la solución
Vista **"Entregar Comida"** en 3 pasos:

1. **Elegir familia** — búsqueda por nombre o código. Cada familia muestra si ya recibió comida este ciclo.
2. **Revisar y confirmar** — canasta sugerida con los lotes que vencen primero ya seleccionados; el voluntario puede ajustar cantidades. Si la familia ya recibió comida en los últimos 7 días, se muestra un banner rojo y el botón de confirmar queda bloqueado.
3. **¡Listo!** — pantalla grande verde con "¡Entrega Exitosa a [Familia]!".

### Reglas
| # | Regla |
|---|---|
| R1 | **FEFO:** para cada producto se toma stock de los lotes ordenados por fecha de vencimiento ascendente (desempate por orden de llegada). |
| R2 | **Lotes vencidos** (`vence < hoy`) quedan excluidos de la entrega y se avisan en el Almacén. Un lote que vence hoy sigue siendo válido hoy. |
| R3 | **Equidad:** bloqueo si la última entrega de la familia ocurrió hace **menos de 7 días** (por defecto). Se informa cuándo podrá recibir otra vez. |
| R4 | **Excepción:** el bloqueo puede saltarse solo con un segundo paso explícito ("Sí, entregar de todos modos"); la entrega queda marcada como *permiso especial*. |
| R5 | **Stock:** la cantidad entregada de un producto no supera su stock vigente. |
| R6 | **Atomicidad:** al confirmar se revalida todo (equidad y stock); descuento y registro se guardan juntos. |
| R7 | La **canasta base** sugerida es configurable en código (`CANASTA` en `app.js`): Arroz 2, Atún 3, Fideos 2, Lentejas 1, Leche 1. El voluntario puede ajustar cantidades y agregar otros alimentos. |

### Modelo de datos (`localStorage`, clave `bancoAlimentos.v1`)
```
familias:   { id, codigo, nombre, personas }
lotes:      { id, producto, unidad, cantidad, vence: "YYYY-MM-DD" }
entregas:   { id, familiaId, familiaNombre, fecha: ISO, excepcion: bool,
              items: [{ producto, unidad, cantidad, lotes: [{ loteId, cantidad, vence }] }] }
```

## 4. Criterios de aceptación (verificables)

**CA-1 · Validación de equidad**
*Dado* que la familia "Los Pérez" recibió comida hace 2 días,
*cuando* el voluntario intenta registrar una nueva entrega para ellos,
*entonces* se muestra un mensaje de advertencia en rojo y la entrega queda bloqueada por defecto.

**CA-2 · Selección automática FEFO**
*Dado* que hay 10 latas de atún que vencen primero y 5 que vencen después,
*cuando* el voluntario prepara una entrega,
*entonces* el sistema toma primero las 10 del lote más próximo a vencer (y solo después las del siguiente).

**CA-3 · Descuento de inventario**
*Dado* que hay 20 bolsas de arroz en stock,
*cuando* se confirma la entrega de 2 bolsas a una familia,
*entonces* el inventario se actualiza de inmediato a 18 bolsas.

**CA-4 · Confirmación visual**
*Dado* que el voluntario confirma la entrega,
*cuando* el proceso termina,
*entonces* se muestra una pantalla con letras grandes verdes: "¡Entrega Exitosa a [Nombre Familia]!".

### Criterios adicionales (casos borde)
**CA-5 · Lotes vencidos:** *dado* un lote vencido de fideos, *cuando* se prepara una entrega, *entonces* nunca se toma de ese lote y el Almacén lo marca "Vencido — sepáralo".
**CA-6 · Stock insuficiente:** *dado* que se pide más de lo que hay, *cuando* el voluntario sube la cantidad, *entonces* el sistema no pasa del máximo disponible y lo explica.
**CA-7 · Excepción registrada:** *dado* una familia bloqueada, *cuando* se autoriza el permiso especial y se confirma, *entonces* la entrega se guarda marcada como "Permiso especial".
**CA-8 · Equidad tras entregar:** *dado* una entrega recién confirmada, *entonces* esa familia aparece bloqueada en el siguiente intento.
**CA-9 · Canasta vacía:** *cuando* todas las cantidades son 0, *entonces* el botón de confirmar está desactivado y se explica por qué.

## 5. Experiencia y accesibilidad
- Máximo 3 pasos; paso actual siempre visible.
- Texto ≥ 18 px, botones ≥ 48 px, contraste AA.
- Productos que vencen en menos de 3 días: borde rojo + etiqueta "Vence pronto" (no depender solo del color).
- Mensajes: "Comida Guardada", "No se encontró la familia", "Esta familia ya recibió comida hace 2 días".

## 6. Métricas de éxito
- Un voluntario nuevo completa una entrega sin ayuda en < 60 s.
- 0 familias con más de una entrega por ciclo (salvo excepciones registradas).
- Reducción de comida vencida en almacén respecto al mes anterior.

## 7. Riesgos y preguntas abiertas
| Riesgo / duda | Decisión del MVP |
|---|---|
| Datos solo en un navegador; si se borra, se pierden | Fuera de alcance; siguiente iteración: exportar/importar copia de seguridad. |
| ¿Ciclo semanal = calendario o 7 días móviles? | 7 días móviles (más simple de explicar). Confirmar con Jorge. |
| ¿La canasta depende del tamaño de la familia? | No en el MVP; el voluntario ajusta cantidades. |
| Sin login, cualquiera puede usar la excepción | Se exige confirmación explícita y queda en historial para que Jorge revise. |

## 8. Trazabilidad criterio → prueba
Todas las pruebas están en `tests/aceptacion.js` (Playwright) y se ejecutan con `node tests/aceptacion.js`.
