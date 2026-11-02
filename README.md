# Ejercicio — Clase 2: De prompt a especificación
**Proyecto:** Sistema Banco de Alimentos · **Feature:** Registro y Despacho de Entregas

| # | Entregable | Archivo |
|---|---|---|
| 1 | Contexto persistente para el agente | [`CONTEXT.md`](CONTEXT.md) |
| 2 | Especificación del feature (con criterios de aceptación) | [`SPEC.md`](SPEC.md) |
| 3 | Skill de marca y diseño | [`skills/diseno-marca/SKILL.md`](skills/diseno-marca/SKILL.md) |
| 4 | Implementación: prompt + código funcionando | [`PROMPT_IMPLEMENTACION.md`](PROMPT_IMPLEMENTACION.md) · [`app/`](app/) |

## Probar la app
Abre `app/index.html` con doble clic (no necesita internet ni instalación). Datos de ejemplo incluidos:
- **Los Pérez** recibieron comida hace 2 días → bloqueo por equidad (CA-1).
- **Atún** en 2 lotes (10 que vencen antes, 5 después) → FEFO (CA-2).
- **Arroz** 20 bolsas → baja a 18 al entregar 2 (CA-3).
- **Fideos** vencidos y **Leche** que vence en 2 días → CA-5 y alerta "Vence pronto".

Si quieres empezar de cero: Almacén → "Restaurar datos de ejemplo".

## Pruebas automáticas
```bash
npm i playwright
node tests/aceptacion.js     # 12 pruebas: CA-1 a CA-9 + UX + seguridad + almacén
```

## Decisiones de experto
- **Contraste:** los colores originales (#27AE60 y #E74C3C) con texto blanco dan 2.9:1 y 3.8:1 (fallan WCAG AA). Los botones usan #1E8449 (4.7:1) y #C0392B (5.4:1).
- **Equidad:** ciclo de 7 días móviles, con "permiso especial" explícito y registrado, en lugar de un bloqueo sin salida.
- **Vencidos:** se excluyen siempre de la entrega (el original solo cubría FEFO).
- **Seguridad:** el texto escrito por el usuario nunca se inserta con `innerHTML`.
- **Preguntas abiertas para Jorge:** ¿ciclo calendario o 7 días móviles?, ¿canasta según tamaño de familia?, ¿copia de seguridad de los datos?
