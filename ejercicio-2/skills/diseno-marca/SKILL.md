---
name: diseno-marca-banco-alimentos
description: Diseño de marca y UI para la app del Banco de Alimentos comunitario. Úsala al crear o modificar cualquier pantalla, componente, color, tipografía o mensaje de la aplicación, para mantener una interfaz cálida, accesible y legible para adultos mayores.
---

# SKILL: Diseño de Marca y UI — Banco de Alimentos Comunitario

## Principios
1. **Claridad antes que estilo.** Si dudas entre bonito y legible, elige legible.
2. **Una cosa a la vez.** Cada pantalla tiene una acción principal evidente.
3. **Cálido y humano.** La interfaz suena como un vecino amable, no como un sistema.

## Paleta (accesible y cálida)
| Rol | Color | Uso |
|---|---|---|
| Fondo principal | `#F9F9F9` | Blanco cálido, reduce fatiga visual |
| Texto principal | `#2C3E50` | Gris oscuro, contraste 10.4:1; nunca negro puro |
| Acción positiva | `#1E8449` | Fondo de botones con texto blanco (4.7:1) |
| Alerta / vence pronto | `#C0392B` | Bordes y botones de alerta con texto blanco (5.4:1) |
| Alerta (fondo suave) | `#FDEDEC` con texto `#922B21` | Banners de error (7.1:1) |
| Acento de marca | `#F39C12` | Detalles, barra superior, pestaña activa; **texto oscuro encima** (5.0:1) |

> **Nota experta:** los tonos originales `#27AE60` (verde) y `#E74C3C` (rojo) **no cumplen WCAG AA** con texto blanco (2.9:1 y 3.8:1). Se usan versiones más oscuras para fondos de botón. Los tonos claros se pueden usar solo como decoración, nunca como único portador de información.

**Regla:** el color nunca es la única señal. Todo estado importante lleva además texto o icono ("Vence pronto", "Ya recibió").

## Tipografía
- Familia: `'Atkinson Hyperlegible', 'Nunito', system-ui, sans-serif` (alta legibilidad; con respaldo local para funcionar sin internet).
- Tamaño base **20 px**; H1 **32 px**; H2 **26 px**; texto secundario nunca menor a **18 px**.
- Peso **700** para botones y títulos; **400** para texto corrido.
- Interlineado 1.5.

## Componentes
- **Botones:** `border-radius: 12px`, alto mínimo **56 px**, sombra sutil que indique "se puede presionar". Siempre icono + texto. Estado de foco visible (anillo de 3 px).
- **Tarjetas de producto:** fondo blanco, borde gris claro. Si vence en **menos de 3 días**: borde rojo de 3 px + etiqueta "Vence pronto".
- **Mensajes de error:** nunca modales complejos; **banners** en la parte superior con fondo rojo claro y texto oscuro.
- **Éxito:** pantalla completa limpia, letras grandes verdes (≥ 40 px) y un único botón siguiente.
- **Indicador de pasos:** "Paso 2 de 3" siempre visible.
- **Espaciado:** mínimo 16 px entre botones para evitar toques equivocados.

## Tono de comunicación
- Empático, directo y alentador; usar **"tú"** ("Registra lo que llegó").
- Frases cortas. Un mensaje = una idea.
- Evitar terminología de software. Equivalencias:

| En vez de… | Di… |
|---|---|
| Base de datos | Almacén / Registro |
| Registro insertado | Comida Guardada |
| Error 404 / Not found | No se encontró la familia |
| Validación fallida | Revisa este dato |
| Token / sesión | (no se menciona) |
| Submit | Confirmar entrega |

## Checklist antes de entregar una pantalla
- [ ] Texto ≥ 18 px y contraste AA.
- [ ] Botones ≥ 48 px y separados.
- [ ] Máximo 3 pasos; paso visible.
- [ ] Sin jerga técnica.
- [ ] El color no es la única señal.
- [ ] Funciona sin internet.
