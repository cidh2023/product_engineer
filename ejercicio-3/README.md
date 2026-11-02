# Ejercicio — Clase 3: Lanzamiento a producción
**Proyecto:** Sistema Banco de Alimentos · **Feature nuevo:** Panel del Coordinador (Resumen de la semana)

| Paso | Entregable | Archivo |
|---|---|---|
| 1 | ICP y User Persona | [`ICP.md`](ICP.md) |
| 2 | Nueva SPEC con criterios de aceptación y métricas de éxito | [`SPEC.md`](SPEC.md) |
| 3 | App en línea | Ver "Producción" abajo |
| 4 | Formulario | Respuestas sugeridas abajo |

## Qué cambió respecto a la Clase 2
- Nueva pestaña **Resumen** para Jorge: familias atendidas, comida rescatada (%), "Entrégalo primero", familias pendientes y mensaje listo para WhatsApp.
- Registro de **comida perdida** al retirar lotes vencidos, para medir la métrica estrella.
- Cabecera con la propuesta de valor del ICP y confirmaciones dentro de la página (sin `confirm()`).
- 20 pruebas de aceptación: `node tests/aceptacion.js` (CA-1 a CA-9 de la Clase 2 + CA-10 a CA-16 nuevos).

## Producción
- **URL funcionando:** publicada como página web de Claude (archivo único `publicar/banco-de-alimentos.html`). Es privada hasta que se comparta desde el menú *Share* de la página.
- **Alternativa con dominio propio (gratis):** la app es estática. Opciones:
  - *Netlify Drop:* arrastra la carpeta `app/` a https://app.netlify.com/drop.
  - *GitHub Pages:* la app ya está copiada en `docs/`. Settings → Pages → *Deploy from a branch* → rama `main`, carpeta `/docs`. URL: https://cidh2023.github.io/product_engineer/ (si cambias `ejercicio-3/app/`, copia los 3 archivos de nuevo a `docs/`).
  - *Vercel:* importar el repo con *Root Directory* `ejercicio-3/app` (sin build).

## Formulario (Tarea 3)
- **URL Repo:** https://github.com/cidh2023/product_engineer
- **URL funcionando:** la de la página publicada (o la de Netlify/Pages si prefieres)
- **ICP / User persona:** resumen en [`ICP.md`](ICP.md)
