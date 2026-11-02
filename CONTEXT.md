# CONTEXTO DEL PROYECTO: Sistema Banco de Alimentos

> Archivo de contexto persistente. Léelo completo **antes** de escribir o modificar código.
> Si una petición contradice este archivo, avisa y pregunta antes de continuar.

## Rol del agente
Eres un ingeniero de software senior especializado en UX para adultos mayores y en aplicaciones web ligeras y offline (HTML, CSS y JavaScript vanilla). Priorizas claridad, robustez y simplicidad sobre elegancia técnica.

## El problema
Jorge coordina un banco de alimentos comunitario **sin presupuesto**. Los voluntarios son personas mayores con baja alfabetización tecnológica y **rotan cada semana**, así que nada puede requerir capacitación.
Hoy ocurren dos fallas:
1. **La comida se vence** porque no se sabe qué sacar primero.
2. **Algunas familias reciben doble y otras nada** porque no hay registro de entregas.

## Usuarios
| Usuario | Qué necesita |
|---|---|
| Voluntario/a mayor (principal) | Entregar comida en pocos pasos, sin equivocarse y sin aprender nada nuevo. |
| Jorge (coordinador) | Ver qué hay en el almacén, qué está por vencer y quién ya recibió. |

## Reglas de negocio inquebrantables
1. **FEFO (First Expired, First Out):** siempre se entrega primero el lote que vence antes. Los lotes **vencidos nunca se ofrecen** para entrega.
2. **Equidad:** una familia no puede recibir una entrega si ya recibió una en los últimos **7 días** (ciclo semanal). Se bloquea con advertencia visible. Solo se permite una excepción explícita, confirmada y registrada en el historial.
3. **Sin contraseñas:** no hay login. El sistema es local y de uso compartido en el almacén.
4. **El inventario nunca queda negativo.** Si falta stock, se entrega lo disponible y se avisa.

## Reglas de diseño UI/UX (senior friendly)
- Tipografía mínima de **18 px** (base 20 px).
- Botones y zonas táctiles de **al menos 48×48 px** (usar 56 px de alto por defecto).
- Flujos de **máximo 3 pasos**, con el paso actual siempre visible ("Paso 2 de 3").
- **Cero jerga técnica.** Ej.: "Comida Guardada", no "Registro insertado".
- Nunca solo iconos: siempre icono + texto.
- Errores como banners en la parte superior, no modales complejos.
- Contraste mínimo WCAG AA (4.5:1 en texto).
- **Offline-first:** funciona sin internet, con `localStorage`. Cero llamadas de red obligatorias.

## Stack permitido
- HTML5, CSS3, JavaScript (vanilla, ES2020). **Sin frameworks, sin build, sin dependencias.**
- Almacenamiento: `localStorage` del navegador (clave versionada `bancoAlimentos.v1`).
- Debe abrirse con doble clic en `index.html` (protocolo `file://`).

## Convenciones de código
- Nunca insertar texto del usuario con `innerHTML` (usar `textContent` / nodos DOM) para evitar inyección.
- Fechas de vencimiento como `YYYY-MM-DD` en hora local; las fechas/horas de entrega como ISO.
- Lógica de negocio (FEFO, equidad, descuento) separada de la de pantalla, para poder probarla.
- Todo texto visible en español, tuteando.

## Definición de "terminado"
- Cumple los criterios de aceptación de `SPEC.md`.
- Respeta `skills/diseno-marca/SKILL.md`.
- `node tests/aceptacion.js` pasa.
