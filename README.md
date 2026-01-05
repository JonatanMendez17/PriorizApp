# PriorizApp - Organizador Semanal

Aplicación web para organizar y gestionar actividades semanales de múltiples personas.

## Características

- 📅 **Calendario semanal** con vista de horas (6:00 - 24:00)
- 🎯 **Filtros por persona** para mostrar/ocultar actividades
- ➕ **Gestión de actividades**: agregar, editar y eliminar eventos
- 🎨 **Iconos personalizados** para categorizar actividades
- 🖱️ **Drag & Drop** para mover actividades entre celdas
- 💾 **Almacenamiento local** con respaldo y restauración
- ⌨️ **Atajos de teclado** para una navegación rápida


## Tecnologías

- HTML5
- CSS3
- JavaScript (ES6+)
- LocalStorage API

## Estructura del Proyecto

```
PriorizApp/
├── index.html          # Página principal
├── src/
│   ├── css/           # Estilos de la aplicación
│   └── js/            # Módulos JavaScript
│       ├── app.js     # Inicialización principal
│       ├── calendar.js
│       ├── events.js
│       ├── modal.js
│       ├── storage.js
│       └── ...
```

## Funcionalidades Principales

- **Calendario**: Vista semanal con horas configurables
- **Eventos**: Gestión completa de actividades con iconos
- **Persistencia**: Guardado automático en LocalStorage
- **Backup**: Exportar e importar copias de seguridad en JSON

