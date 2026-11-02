# Prompt de implementación

Adjunta al agente (Cursor, Claude, v0, etc.) estos tres archivos y envía el prompt siguiente.

- `CONTEXT.md` (Paso 1)
- `SPEC.md` (Paso 2)
- `skills/diseno-marca/SKILL.md` (Paso 3)

---

```text
Siguiendo estrictamente CONTEXT.md (rol, reglas UX senior, stack sin frameworks),
SPEC.md (feature "Registro y Despacho de Entregas" con sus criterios de aceptación
CA-1 a CA-9) y la skill de diseño de marca (paleta, tipografía, componentes, tono),
genera el código completo del MVP.

Entregables:
1. app/index.html, app/styles.css, app/app.js (sin dependencias; abrir con doble clic).
2. Datos de prueba (seed) en localStorage, con fechas RELATIVAS a hoy, que permitan probar:
   - FEFO: atún en dos lotes (10 que vencen antes y 5 que vencen después).
   - Equidad: "Los Pérez" con una entrega hace 2 días.
   - Descuento: 20 bolsas de arroz.
   - Un lote vencido y un lote que vence en menos de 3 días.
3. Flujo de máximo 3 pasos: elegir familia → revisar y confirmar → ¡Entrega Exitosa!.
4. Pantallas de apoyo: Almacén (registrar comida que llega), Familias e Historial.
5. tests/aceptacion.js con Playwright que verifique CA-1 a CA-9.

Restricciones: separar la lógica de negocio de la interfaz, no usar innerHTML con
texto del usuario, respetar contraste AA (usa los tonos oscuros de la skill para fondos
de botón) y no inventar reglas que no estén en la spec: si algo es ambiguo, anótalo
como pregunta abierta.
```

## Verificación
```bash
npm i playwright   # solo si no lo tienes
node tests/aceptacion.js
```
