import { CONFIG } from './config.js';
import { getElement, createElement } from './utils.js';
import { SELECTORS } from './constants.js';

/**
 * Módulo de gestión del calendario
 * Maneja la creación y actualización de la estructura del calendario
 */

/**
 * Crea la estructura del calendario
 */
export function createCalendar() {
    const calendar = getElement(SELECTORS.CALENDAR);
    if (!calendar) {
        console.error('No se encontró el elemento calendario');
        return;
    }
    
    // Agregar celda vacía para la esquina
    calendar.appendChild(document.createElement("div"));
    
    // Agregar encabezados de días
    const totalDays = CONFIG.DAYS.length - 1; // Excluir el elemento vacío
    for (let d = 1; d <= totalDays; d++) {
        const header = createElement('div', { className: 'header' }, CONFIG.DAYS[d]);
        calendar.appendChild(header);
    }
    
    // Crear celdas de tiempo y eventos
    for (let h = CONFIG.START_HOUR; h < CONFIG.END_HOUR; h++) {
        for (let m of [0, 30]) {
            const timeText = `${String(h).padStart(2, "0")}:${m === 0 ? "00" : "30"}`;
            const time = createElement('div', { className: 'time' }, timeText);
            calendar.appendChild(time);
            
            for (let d = 1; d <= totalDays; d++) {
                const cell = createElement('div', {
                    className: 'cell',
                    dataset: { day: d, time: `${h}:${m}` }
                });
                calendar.appendChild(cell);
            }
        }
    }
}

/**
 * Retorna los eventos visibles de una persona en una celda.
 * Usa style.display en lugar de getComputedStyle para evitar
 * forzar un recalculo de estilos por cada evento.
 */
function getVisiblePersonEvents(cell, person) {
    return Array.from(cell.querySelectorAll(`.event.${person}`))
        .filter(ev => ev.style.display !== 'none');
}

/**
 * Actualiza las posiciones de los eventos en una celda.
 * Cada persona activa ocupa una columna fija dentro de la celda,
 * siempre en el mismo orden (CONFIG.PEOPLE), lo que permite leer
 * el calendario sin confusión aunque haya muchos eventos activos.
 * @param {HTMLElement} cell - Celda del calendario
 */
export function updateEventPositions(cell) {
    if (!cell) return;

    const EV_H = 24;   // altura fija por evento
    const COL_GAP = 4; // separación entre columnas de personas
    const { EVENT_SPACING, EVENT_START_TOP, MIN_CELL_HEIGHT, CELL_PADDING } = CONFIG;

    const calendar = cell.closest('.calendar');
    if (!calendar) return;

    const timeValue = cell.dataset.time;
    const allCells = Array.from(calendar.querySelectorAll('.cell'));
    const sameTimeCells = Array.from(calendar.querySelectorAll(`.cell[data-time="${timeValue}"]`));

    // Altura de la fila: máximo de eventos apilados en cualquier celda de la franja
    let maxStack = 0;
    sameTimeCells.forEach(c => {
        CONFIG.PEOPLE.forEach(person => {
            const count = getVisiblePersonEvents(c, person).length;
            if (count > maxStack) maxStack = count;
        });
    });

    const rowHeight = maxStack === 0
        ? MIN_CELL_HEIGHT
        : Math.max(
            MIN_CELL_HEIGHT,
            EVENT_START_TOP + maxStack * (EV_H + EVENT_SPACING) - EVENT_SPACING + CELL_PADDING
          );

    // Espacio vertical disponible para eventos dentro de la fila
    const totalAvail = rowHeight - EVENT_START_TOP - CELL_PADDING;

    // Aplicar layout columnar a cada celda de forma independiente
    sameTimeCells.forEach(c => {
        c.style.height = rowHeight + 'px';

        // Personas con eventos en ESTA celda (columnas por celda, no por fila)
        const cellPeople = CONFIG.PEOPLE.filter(p => getVisiblePersonEvents(c, p).length > 0);
        if (cellPeople.length === 0) return;

        const cellWidth = c.getBoundingClientRect().width || 120;
        const availWidth = cellWidth - CELL_PADDING * 2;
        const colWidth = Math.floor(
            (availWidth - COL_GAP * (cellPeople.length - 1)) / cellPeople.length
        );

        // Modo ícono: cuando las 4 personas tienen eventos visibles en esta celda
        const isIconOnly = cellPeople.length === CONFIG.PEOPLE.length;

        cellPeople.forEach((person, colIdx) => {
            const personEvents = getVisiblePersonEvents(c, person);
            const n = personEvents.length;
            const colX = CELL_PADDING + colIdx * (colWidth + COL_GAP);

            // Expandir eventos para llenar el espacio vertical disponible
            const evHeight = n >= maxStack
                ? EV_H
                : Math.max(EV_H, Math.floor((totalAvail - (n - 1) * EVENT_SPACING) / n));

            personEvents.forEach((ev, rowIdx) => {
                ev.classList.toggle('icon-only', isIconOnly);

                ev.style.position  = 'absolute';
                ev.style.left      = colX + 'px';
                ev.style.top       = (EVENT_START_TOP + rowIdx * (evHeight + EVENT_SPACING)) + 'px';
                ev.style.width     = colWidth + 'px';
                ev.style.maxWidth  = colWidth + 'px';
                ev.style.height    = evHeight + 'px';
                ev.style.minHeight = evHeight + 'px';
            });
        });
    });

    // Sincronizar altura de la celda de tiempo correspondiente
    const cellIndex = allCells.indexOf(cell);
    const totalDays = CONFIG.DAYS.length - 1;
    const rowIndex = Math.floor(cellIndex / totalDays);
    const allTimes = Array.from(calendar.querySelectorAll(SELECTORS.TIME));
    if (rowIndex < allTimes.length) {
        allTimes[rowIndex].style.height = rowHeight + 'px';
        allTimes[rowIndex].style.minHeight = rowHeight + 'px';
    }
}

/**
 * Actualiza las posiciones de todos los eventos del calendario en un único
 * recorrido del DOM, evitando thrashing de reflow al separar lecturas y escrituras.
 * Usar en lugar de llamar updateEventPositions() por cada celda.
 */
export function updateAllEventPositions() {
    const calendarEl = getElement(SELECTORS.CALENDAR);
    if (!calendarEl) return;

    const EV_H = 24;
    const COL_GAP = 4;
    const { EVENT_SPACING, EVENT_START_TOP, MIN_CELL_HEIGHT, CELL_PADDING } = CONFIG;
    const totalDays = CONFIG.DAYS.length - 1;

    // ── LECTURA ──────────────────────────────────────────────────────────────
    const allCells = Array.from(calendarEl.querySelectorAll('.cell'));
    const allTimes = Array.from(calendarEl.querySelectorAll(SELECTORS.TIME));

    // Agrupar celdas por franja horaria (preservando orden de aparición)
    const timeGroups = new Map();
    allCells.forEach(cell => {
        const t = cell.dataset.time;
        if (!timeGroups.has(t)) timeGroups.set(t, []);
        timeGroups.get(t).push(cell);
    });

    // Leer todos los anchos de celda de una vez (un único reflow de layout)
    const cellWidths = new Map();
    allCells.forEach(cell => {
        cellWidths.set(cell, cell.getBoundingClientRect().width || 120);
    });

    // ── CÁLCULO ───────────────────────────────────────────────────────────────
    // Precalcular layout para cada franja sin tocar el DOM todavía
    const rowResults = [];
    let timeRowIdx = 0;

    timeGroups.forEach(sameTimeCells => {
        // Máximo de eventos apilados en cualquier celda de la franja
        let maxStack = 0;
        sameTimeCells.forEach(c => {
            CONFIG.PEOPLE.forEach(person => {
                const count = getVisiblePersonEvents(c, person).length;
                if (count > maxStack) maxStack = count;
            });
        });

        const rowHeight = maxStack === 0
            ? MIN_CELL_HEIGHT
            : Math.max(MIN_CELL_HEIGHT,
                EVENT_START_TOP + maxStack * (EV_H + EVENT_SPACING) - EVENT_SPACING + CELL_PADDING);

        const totalAvail = rowHeight - EVENT_START_TOP - CELL_PADDING;

        const cellLayouts = sameTimeCells.map(c => {
            const cellPeople = CONFIG.PEOPLE.filter(p => getVisiblePersonEvents(c, p).length > 0);
            const isIconOnly = cellPeople.length === CONFIG.PEOPLE.length;
            const cellWidth  = cellWidths.get(c);
            const availWidth = cellWidth - CELL_PADDING * 2;
            const colCount   = cellPeople.length;
            const colWidth   = colCount > 0
                ? Math.floor((availWidth - COL_GAP * (colCount - 1)) / colCount)
                : 0;

            const evUpdates = [];
            cellPeople.forEach((person, colIdx) => {
                const personEvents = getVisiblePersonEvents(c, person);
                const n       = personEvents.length;
                const colX    = CELL_PADDING + colIdx * (colWidth + COL_GAP);
                const evHeight = n >= maxStack
                    ? EV_H
                    : Math.max(EV_H, Math.floor((totalAvail - (n - 1) * EVENT_SPACING) / n));

                personEvents.forEach((ev, rowIdx) => {
                    evUpdates.push({ ev, isIconOnly, colX, rowIdx, evHeight, colWidth, EVENT_START_TOP, EVENT_SPACING });
                });
            });

            return { cell: c, rowHeight, evUpdates };
        });

        rowResults.push({ cellLayouts, rowHeight, timeRowIdx });
        timeRowIdx++;
    });

    // ── ESCRITURA ─────────────────────────────────────────────────────────────
    // Aplicar todos los cambios al DOM de una vez
    rowResults.forEach(({ cellLayouts, rowHeight, timeRowIdx: tri }) => {
        cellLayouts.forEach(({ cell, evUpdates }) => {
            cell.style.height = rowHeight + 'px';

            evUpdates.forEach(({ ev, isIconOnly, colX, rowIdx, evHeight, colWidth, EVENT_START_TOP, EVENT_SPACING }) => {
                ev.classList.toggle('icon-only', isIconOnly);
                ev.style.position  = 'absolute';
                ev.style.left      = colX + 'px';
                ev.style.top       = (EVENT_START_TOP + rowIdx * (evHeight + EVENT_SPACING)) + 'px';
                ev.style.width     = colWidth + 'px';
                ev.style.maxWidth  = colWidth + 'px';
                ev.style.height    = evHeight + 'px';
                ev.style.minHeight = evHeight + 'px';
            });
        });

        if (tri < allTimes.length) {
            allTimes[tri].style.height    = rowHeight + 'px';
            allTimes[tri].style.minHeight = rowHeight + 'px';
        }
    });
}

