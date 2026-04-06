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
 * Retorna los eventos visibles de una persona en una celda
 */
function getVisiblePersonEvents(cell, person) {
    return Array.from(cell.querySelectorAll(`.event.${person}`))
        .filter(ev => window.getComputedStyle(ev).display !== 'none');
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
    const sameTimeCells = allCells.filter(c => c.dataset.time === timeValue);

    // Personas activas en esta franja horaria (al menos un evento visible en cualquier día)
    const activePeople = CONFIG.PEOPLE.filter(person =>
        sameTimeCells.some(c => getVisiblePersonEvents(c, person).length > 0)
    );

    // Altura de la fila: suficiente para el máximo de eventos apilados por persona
    let maxStack = 0;
    sameTimeCells.forEach(c => {
        activePeople.forEach(person => {
            const count = getVisiblePersonEvents(c, person).length;
            if (count > maxStack) maxStack = count;
        });
    });

    const rowHeight = activePeople.length === 0
        ? MIN_CELL_HEIGHT
        : Math.max(
            MIN_CELL_HEIGHT,
            EVENT_START_TOP + maxStack * (EV_H + EVENT_SPACING) - EVENT_SPACING + CELL_PADDING
          );

    // Aplicar layout columnar a todas las celdas de la franja
    sameTimeCells.forEach(c => {
        c.style.height = rowHeight + 'px';

        if (activePeople.length === 0) return;

        const cellWidth = c.getBoundingClientRect().width || 120;
        const availWidth = cellWidth - CELL_PADDING * 2;
        const colWidth = Math.floor(
            (availWidth - COL_GAP * (activePeople.length - 1)) / activePeople.length
        );

        activePeople.forEach((person, colIdx) => {
            const personEvents = getVisiblePersonEvents(c, person);
            const colX = CELL_PADDING + colIdx * (colWidth + COL_GAP);

            personEvents.forEach((ev, rowIdx) => {
                ev.style.position = 'absolute';
                ev.style.left   = colX + 'px';
                ev.style.top    = (EVENT_START_TOP + rowIdx * (EV_H + EVENT_SPACING)) + 'px';
                ev.style.width  = colWidth + 'px';
                ev.style.maxWidth = colWidth + 'px';
                ev.style.height = EV_H + 'px';
                ev.style.minHeight = EV_H + 'px';
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

