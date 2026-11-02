# Paso 2 — Nueva SPEC: Panel del Coordinador (Resumen de la semana)

| | |
|---|---|
| **Proyecto** | Sistema Banco de Alimentos (continúa el de la Clase 2) |
| **Feature nuevo** | Panel del Coordinador: "Resumen de la semana" |
| **Persona** | Jorge, el coordinador (ver `ICP.md`) |
| **Contexto / marca** | `../ejercicio-2/CONTEXT.md` y `../ejercicio-2/skills/diseno-marca/SKILL.md` |

## 1. Problema
El feature de la Clase 2 resuelve el momento de la entrega (voluntarios). Pero Jorge sigue sin respuesta a sus preguntas semanales: *¿qué se me va a vencer?, ¿a quién le falta recibir?, ¿estamos rescatando comida o botándola?* Hoy lo adivina revisando estantes y la libreta. Sin esas cifras no puede corregir ni rendir cuentas a donantes y a la parroquia.

## 2. Solución
Una pestaña **Resumen** que, con los datos que ya se registran al entregar y guardar comida, muestra en una pantalla:

1. **Cuatro cifras de la semana** (últimos 7 días): familias atendidas, entregas, unidades entregadas y **comida rescatada (%)**.
2. **Entrégalo primero:** lotes vigentes que vencen en 7 días o menos, ordenados por fecha.
3. **Familias que aún no reciben esta semana** (y pueden recibir hoy).
4. **Comida perdida** esta semana y comida vencida todavía sin separar.
5. **Mensaje listo para WhatsApp** con el resumen, que Jorge copia y pega en el grupo de voluntarios o donantes.

Al marcar comida vencida como "Ya la separé" se registra como pérdida, para que la tasa de rescate sea real.

### Reglas
| # | Regla |
|---|---|
| P1 | **Semana** = últimos 7 días móviles, igual que el ciclo de equidad. |
| P2 | **Familias atendidas** = familias distintas con al menos una entrega en la semana. **Cobertura** = atendidas ÷ familias registradas. |
| P3 | **Comida rescatada (%)** = unidades entregadas ÷ (unidades entregadas + unidades perdidas), ambas en la semana. Sin datos: se muestra "—". |
| P4 | **Perdida** = unidades de lotes vencidos que Jorge retiró ("Ya la separé"). Quedan registradas con fecha. |
| P5 | "Entrégalo primero" solo incluye lotes **vigentes** con vencimiento ≤ 7 días; menos de 3 días se marca "Vence pronto". |
| P6 | **Pendientes** = familias sin entrega en los últimos 7 días. |
| P7 | Todo funciona **sin internet** y con las mismas reglas de diseño (texto ≥ 18 px, botones ≥ 48 px, lenguaje sin jerga). |

### Modelo de datos (nuevo)
```
desperdicio: [{ id, producto, unidad, cantidad, vence, fecha: ISO }]   // en bancoAlimentos.v1
```

## 3. Criterios de aceptación

**CA-10 · Cifras de la semana**
*Dado* que en los últimos 7 días hubo 2 entregas a 2 familias distintas de 5 registradas,
*cuando* Jorge abre el Resumen,
*entonces* ve "2 de 5 familias atendidas (40%)" y la cantidad de entregas y unidades.

**CA-11 · Se actualiza al entregar**
*Dado* el Resumen anterior, *cuando* se confirma una entrega a otra familia, *entonces* el Resumen muestra 3 de 5 (60%) y esa familia sale de pendientes.

**CA-12 · Entrégalo primero**
*Dado* una leche que vence en 2 días y un atún que vence en 12, *cuando* Jorge abre el Resumen, *entonces* "Entrégalo primero" muestra la leche con "Vence pronto" y **no** muestra el atún ni lotes vencidos.

**CA-13 · Familias pendientes**
*Dado* que Gómez, Torres y Mendoza no recibieron en 7 días, *cuando* se abre el Resumen, *entonces* las tres aparecen como pendientes y ninguna con entrega reciente.

**CA-14 · Comida rescatada**
*Dado* 7 unidades entregadas y 3 perdidas en la semana, *entonces* "Comida rescatada" muestra 70%. *Cuando* Jorge retira 4 unidades vencidas con "Ya la separé", *entonces* pasa a 50% y la comida queda registrada como perdida.

**CA-15 · Mensaje para WhatsApp**
*Dado* el Resumen, *cuando* Jorge pulsa "Copiar mensaje", *entonces* el texto incluye familias atendidas, comida rescatada, lo que vence pronto y las familias pendientes; si el navegador no deja copiar, el texto queda seleccionado para copiarlo a mano.

**CA-16 · Sin datos**
*Dado* que no hay entregas ni pérdidas en la semana, *entonces* "Comida rescatada" muestra "—" y los listados muestran mensajes claros, sin errores.

## 4. Métricas de éxito

**Métrica estrella (North Star):** **Comida rescatada** = % de comida que sale entregada en vez de vencerse. **Meta: ≥ 90% a las 4 semanas** de uso (línea base del ejemplo: 70%).

| Tipo | Métrica | Meta | Cómo se mide |
|---|---|---|---|
| Impacto | Comida rescatada (%) | ≥ 90% | Cifra del propio Resumen (P3) |
| Impacto | Cobertura semanal de familias | ≥ 80% | Atendidas ÷ registradas (P2) |
| Equidad | Familias con más de una entrega por ciclo, sin permiso especial | 0 | Historial: entregas separadas < 7 días sin la marca "Permiso especial" |
| Time to value | Jorge ve su primer Resumen útil | < 2 minutos | Prueba de uso con 3 coordinadores |
| Time to value | Voluntario nuevo completa una entrega | < 60 s | Prueba de uso con 5 voluntarios mayores |
| Adopción | Jorge abre el Resumen al menos 1 vez por semana | ≥ 4 de 4 semanas | Observación / entrevista semanal (la app es local y no envía datos) |
| Calidad | Pruebas de aceptación en verde | 100% | `node tests/aceptacion.js` |

**Contramétricas (para no empeorar otra cosa):** tiempo por entrega no sube más de 10 s; ningún mensaje con jerga técnica.

## 5. Fuera de alcance
Gráficos históricos de varias semanas, exportar a Excel, sincronizar entre dispositivos, envío automático de WhatsApp. Siguiente iteración sugerida: exportar/importar copia de seguridad.

## 6. Riesgos y preguntas abiertas
| Riesgo / duda | Decisión del MVP |
|---|---|
| Las métricas dependen de que se registre todo | El Resumen indica cuántas entregas hay; Jorge ve rápido si faltan registros. |
| Los datos viven en un solo navegador | Se documenta; copia de seguridad es la siguiente iteración. |
| ¿Semana de calendario o 7 días móviles? | 7 días móviles. Confirmar con Jorge. |
| No hay analítica de uso (privacidad y offline) | Se mide con pruebas de uso y entrevistas, no con tracking. |
