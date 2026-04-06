# CLAUDE.md — PriorizApp

Organizador semanal familiar. App web vanilla (sin build tools, sin frameworks).
Se abre directamente con un servidor HTTP estático — no hay `npm install`, no hay compilación.

## Cómo levantar el proyecto

```bash
node -e "const http=require('http'),fs=require('fs'),path=require('path');const s=http.createServer((req,res)=>{let f=path.join('D:/PriorizApp',req.url==='/'?'index.html':req.url);const ext=path.extname(f);const mime={'html':'text/html','css':'text/css','js':'application/javascript','json':'application/json'};try{res.writeHead(200,{'Content-Type':mime[ext.slice(1)]||'text/plain'});res.end(fs.readFileSync(f));}catch{res.writeHead(404);res.end('Not found');}});s.listen(3000,()=>console.log('Server on http://localhost:3000'));"
```

El módulo `type="module"` de `index.html` requiere un servidor HTTP — no se puede abrir como `file://`.

## Stack

- HTML5 + CSS3 + JavaScript ES Modules (sin transpilación)
- LocalStorage para persistencia
- Sin dependencias externas, sin package.json

## Estructura

```
index.html              Punto de entrada, HTML estático
src/
  css/
    styles.css          Importa todos los módulos CSS (@import)
    variables.css       Tokens de diseño (colores, sombras)
    base.css            Reset y tipografía
    calendar.css        Grid del calendario y celdas
    events.css          Estilos de etiquetas de actividad
    filters.css         Toggle switches de personas
    modal.css           Modal de agregar/editar
    context-menu.css    Menú contextual (clic derecho)
    notifications.css   Toasts y diálogo de confirmación
    backup.css          Botones de exportar/importar
    animations.css      Keyframes y transiciones
  js/
    script.js           Punto de entrada, inicializa app.js
    app.js              Monta todos los event listeners
    calendar.js         Crea la grilla y maneja el layout de eventos
    events.js           Crea elementos de evento, maneja drag start/end
    modal.js            Abre/cierra/guarda el modal
    filters.js          Toggle de visibilidad por persona
    contextMenu.js      Lógica del menú contextual
    dragDrop.js         Handlers de dragover/dragleave/drop
    storage.js          Lee/escribe localStorage, export/import backup
    notifications.js    Toast y diálogo de confirmación custom
    config.js           Constantes de configuración (CONFIG)
    constants.js        Selectores CSS, teclas, tipos de evento
    utils.js            Helpers DOM (getElement, createElement, debounce)
```

## Personas

Las 4 personas están hardcodeadas en dos lugares que deben mantenerse sincronizados:

- `src/js/config.js` → `CONFIG.PEOPLE = ['jonatan', 'mariana', 'caleb', 'catalina']`
- `src/css/variables.css` → variables `--jonatan`, `--mariana`, `--caleb`, `--catalina`
- `index.html` → toggles del filtro y opciones del `<select>` del modal

Para agregar una persona hay que actualizar los tres.

## Layout del calendario

El layout de eventos usa columnas por celda (no por fila):

- Cada celda calcula sus propias columnas según las personas que tienen eventos **en esa celda**
- El orden de columnas siempre sigue `CONFIG.PEOPLE`
- La **altura de fila** sí es compartida entre todos los días de una misma franja horaria (`maxStack`)
- Cuando las 4 personas tienen eventos en la misma celda, los eventos pasan a modo `icon-only` (ocultan el texto)
- Si una celda tiene menos eventos apilados que el máximo de la fila, los eventos se expanden verticalmente

La función principal es `updateEventPositions(cell)` en `calendar.js` para actualizaciones individuales y `updateAllEventPositions()` para actualizaciones en lote (filtros, carga inicial). **Siempre usar `updateAllEventPositions` cuando se afectan múltiples celdas** — evita thrashing de reflow al separar lecturas de escrituras.

## Visibilidad de eventos

La visibilidad se controla con `element.style.display` (`'inline-flex'` o `'none'`).
**No usar `getComputedStyle` para chequear visibilidad** — fuerza recalculo de estilos por cada elemento. Usar `ev.style.display !== 'none'`.

## Persistencia

- `saveEventsToStorage()` — serializa todos los eventos del DOM a localStorage
- `loadEventsFromStorage()` — reconstruye los eventos desde localStorage al iniciar
- El backup exporta JSON con versión y fecha; importa con confirmación del usuario

## Seguridad

Todo contenido de usuario (títulos, íconos) debe insertarse con `textContent`, nunca con `innerHTML`. Los mensajes de notificaciones y confirmaciones también usan `textContent`/`createElement`.

## Convenciones

- Los módulos JS se importan con rutas relativas (`./calendar.js`)
- Los selectores CSS viven en `constants.js` (`SELECTORS`)
- Las constantes de teclado están en `KEYBOARD_KEYS`
- Los errores se manejan con `handleError(error, 'nombreFuncion')` de `utils.js`
- Las funciones expuestas al HTML inline (`toggle`, `closeModal`, `saveEventFromModal`) se asignan en `exposeGlobalFunctions()` en `app.js`
