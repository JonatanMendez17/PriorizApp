import { CONFIG } from './config.js';
import { getElement, createElement, getVisibleElements } from './utils.js';
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
 * Actualiza las posiciones de los eventos en una celda
 * Solo considera eventos visibles según los filtros activos
 * @param {HTMLElement} cell - Celda del calendario
 */
export function updateEventPositions(cell) {
    if (!cell) return;
    
    const allEvents = Array.from(cell.querySelectorAll(SELECTORS.EVENT));
    const visibleEvents = getVisibleElements(allEvents);
    const { EVENT_SPACING, EVENT_START_TOP, MIN_CELL_HEIGHT, CELL_PADDING } = CONFIG;
    
    const totalVisibleEvents = visibleEvents.length;
    const MIN_EVENT_HEIGHT = 24;
    
    // Calcular altura mínima necesaria para esta celda basada solo en eventos visibles
    let requiredHeight = MIN_CELL_HEIGHT;
    if (totalVisibleEvents > 0) {
        const totalSpacing = (totalVisibleEvents - 1) * EVENT_SPACING;
        const minHeightNeeded = EVENT_START_TOP + (totalVisibleEvents * MIN_EVENT_HEIGHT) + totalSpacing + CELL_PADDING;
        requiredHeight = Math.max(MIN_CELL_HEIGHT, minHeightNeeded);
    }
    
    // Sincronizar todas las celdas en la misma fila de tiempo
    const calendar = cell.closest('.calendar');
    if (calendar) {
        const timeValue = cell.dataset.time;
        const allCells = Array.from(calendar.querySelectorAll('.cell'));
        const sameTimeCells = allCells.filter(c => c.dataset.time === timeValue);
        
        // Calcular altura máxima necesaria para todas las celdas de esta fila (solo eventos visibles)
        let maxHeight = requiredHeight;
        sameTimeCells.forEach(c => {
            const cAllEvents = Array.from(c.querySelectorAll(SELECTORS.EVENT));
            const cVisibleEvents = getVisibleElements(cAllEvents);
            if (cVisibleEvents.length > 0) {
                const cTotalSpacing = (cVisibleEvents.length - 1) * EVENT_SPACING;
                const cMinHeightNeeded = EVENT_START_TOP + (cVisibleEvents.length * MIN_EVENT_HEIGHT) + cTotalSpacing + CELL_PADDING;
                if (cMinHeightNeeded > maxHeight) maxHeight = cMinHeightNeeded;
            }
        });
        
        if (maxHeight < MIN_CELL_HEIGHT) maxHeight = MIN_CELL_HEIGHT;
        
        // Aplicar altura máxima a todas las celdas de esta fila
        sameTimeCells.forEach(c => {
            c.style.height = maxHeight + 'px';
            
            // Distribuir solo eventos visibles en esta celda
            const cAllEvents = Array.from(c.querySelectorAll(SELECTORS.EVENT));
            const cVisibleEvents = getVisibleElements(cAllEvents);
            
            if (cVisibleEvents.length > 0) {
                const availableHeight = maxHeight - EVENT_START_TOP - CELL_PADDING;
                const totalSpacing = (cVisibleEvents.length - 1) * EVENT_SPACING;
                const eventHeight = Math.max(MIN_EVENT_HEIGHT, (availableHeight - totalSpacing) / cVisibleEvents.length);
                
                // Posicionar solo eventos visibles
                cVisibleEvents.forEach((event, index) => {
                    event.style.height = eventHeight + 'px';
                    event.style.minHeight = eventHeight + 'px';
                    event.style.top = (EVENT_START_TOP + index * (eventHeight + EVENT_SPACING)) + 'px';
                });
            }
        });
        
        // Actualizar celda de tiempo
        const allTimes = Array.from(calendar.querySelectorAll(SELECTORS.TIME));
        const allCellsOrdered = Array.from(calendar.querySelectorAll(SELECTORS.CELL));
        const cellIndex = allCellsOrdered.indexOf(cell);
        const totalDays = CONFIG.DAYS.length - 1;
        const rowIndex = Math.floor(cellIndex / totalDays);
        
        if (rowIndex < allTimes.length) {
            allTimes[rowIndex].style.height = maxHeight + 'px';
            allTimes[rowIndex].style.minHeight = maxHeight + 'px';
        }
    } else {
        // Si no hay calendario padre, solo ajustar esta celda
        cell.style.height = requiredHeight + 'px';
        
        if (visibleEvents.length > 0) {
            const availableHeight = requiredHeight - EVENT_START_TOP - CELL_PADDING;
            const totalSpacing = (visibleEvents.length - 1) * EVENT_SPACING;
            const eventHeight = Math.max(MIN_EVENT_HEIGHT, (availableHeight - totalSpacing) / visibleEvents.length);
            
            visibleEvents.forEach((event, index) => {
                event.style.height = eventHeight + 'px';
                event.style.minHeight = eventHeight + 'px';
                event.style.top = (EVENT_START_TOP + index * (eventHeight + EVENT_SPACING)) + 'px';
            });
        }
    }
}

