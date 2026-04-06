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
 * Organiza eventos de forma flexible: horizontalmente si hay espacio, verticalmente si no
 * @param {HTMLElement} cell - Celda del calendario
 */
export function updateEventPositions(cell) {
    if (!cell) return;
    
    const allEvents = Array.from(cell.querySelectorAll(SELECTORS.EVENT));
    const visibleEvents = getVisibleElements(allEvents);

    // Ordenar eventos por persona para agruparlos visualmente
    visibleEvents.sort((a, b) => {
        const ia = CONFIG.PEOPLE.findIndex(p => a.classList.contains(p));
        const ib = CONFIG.PEOPLE.findIndex(p => b.classList.contains(p));
        return ia - ib;
    });

    const { EVENT_SPACING, EVENT_START_TOP, MIN_CELL_HEIGHT, CELL_PADDING, EVENT_HORIZONTAL_SPACING, MIN_EVENT_WIDTH } = CONFIG;
    
    const totalVisibleEvents = visibleEvents.length;
    const MIN_EVENT_HEIGHT = 24;
    
    // Función para calcular el layout de eventos (distribución flexible)
    function calculateEventLayout(events, cellWidth) {
        if (events.length === 0) return [];
        
        // Crear un contenedor temporal para medir eventos
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.visibility = 'hidden';
        tempContainer.style.display = 'inline-block';
        document.body.appendChild(tempContainer);
        
        // Medir el tamaño natural de cada evento
        const eventSizes = events.map(event => {
            const clone = event.cloneNode(true);
            // Copiar estilos computados
            const computedStyle = window.getComputedStyle(event);
            clone.style.cssText = computedStyle.cssText;
            // Sobrescribir propiedades de posicionamiento para medir
            clone.style.position = 'static';
            clone.style.width = 'auto';
            clone.style.height = 'auto';
            clone.style.display = 'inline-flex';
            clone.style.visibility = 'visible';
            clone.style.opacity = '1';
            tempContainer.appendChild(clone);
            
            const rect = clone.getBoundingClientRect();
            const width = Math.ceil(rect.width);
            const height = Math.max(MIN_EVENT_HEIGHT, Math.ceil(rect.height));
            
            tempContainer.removeChild(clone);
            return { width, height };
        });
        
        document.body.removeChild(tempContainer);
        
        // Calcular espacio disponible
        const availableWidth = cellWidth - (CELL_PADDING * 2);
        
        // Organizar en filas
        const rows = [];
        let currentRow = [];
        let currentRowWidth = 0;
        let currentRowHeight = 0;
        
        events.forEach((event, index) => {
            const size = eventSizes[index];
            // Respetar ancho mínimo para que los eventos siempre sean legibles
            const eventWidth = Math.max(size.width, MIN_EVENT_WIDTH);
            const eventHeight = size.height;

            const neededWidth = currentRow.length === 0
                ? eventWidth
                : currentRowWidth + EVENT_HORIZONTAL_SPACING + eventWidth;

            const finalEventWidth = Math.min(eventWidth, availableWidth);

            if (neededWidth <= availableWidth) {
                const x = currentRow.length === 0 ? 0 : currentRowWidth + EVENT_HORIZONTAL_SPACING;
                currentRow.push({ event, x, width: finalEventWidth, height: eventHeight });
                currentRowWidth = x + finalEventWidth;
                currentRowHeight = Math.max(currentRowHeight, eventHeight);
            } else {
                // Nueva fila - guardar la fila actual
                if (currentRow.length > 0) {
                    rows.push({ items: currentRow, height: currentRowHeight });
                }
                const newRowEventWidth = Math.min(eventWidth, availableWidth);
                currentRow = [{ event, x: 0, width: newRowEventWidth, height: eventHeight }];
                currentRowWidth = newRowEventWidth;
                currentRowHeight = eventHeight;
            }
        });
        
        // Agregar última fila
        if (currentRow.length > 0) {
            rows.push({ items: currentRow, height: currentRowHeight });
        }
        
        // Calcular posiciones centradas para cada fila
        const layout = [];
        let currentY = EVENT_START_TOP;
        
        rows.forEach(row => {
            // Calcular el ancho total de la fila
            const totalRowWidth = row.items.reduce((sum, item, index) => {
                return sum + item.width + (index > 0 ? EVENT_HORIZONTAL_SPACING : 0);
            }, 0);
            
            // Calcular el offset para centrar la fila
            const rowOffset = (availableWidth - totalRowWidth) / 2;
            
            // Asignar posiciones centradas a cada item de la fila
            let currentX = 0;
            row.items.forEach(item => {
                layout.push({
                    event: item.event,
                    x: rowOffset + currentX,
                    y: currentY,
                    width: item.width,
                    height: item.height
                });
                currentX += item.width + EVENT_HORIZONTAL_SPACING;
            });
            
            currentY += row.height + EVENT_SPACING;
        });
        
        return layout;
    }
    
    // Calcular altura necesaria basada en layout flexible
    function calculateRequiredHeight(events, cellWidth) {
        if (events.length === 0) return MIN_CELL_HEIGHT;
        
        const layout = calculateEventLayout(events, cellWidth);
        
        if (layout.length === 0) return MIN_CELL_HEIGHT;
        
        // Encontrar la fila más baja
        let maxBottom = 0;
        layout.forEach(item => {
            const bottom = item.y + item.height;
            if (bottom > maxBottom) maxBottom = bottom;
        });
        
        const requiredHeight = maxBottom + CELL_PADDING;
        return Math.max(MIN_CELL_HEIGHT, requiredHeight);
    }
    
    // Calcular altura mínima necesaria para esta celda
    const cellRect = cell.getBoundingClientRect();
    let requiredHeight = calculateRequiredHeight(visibleEvents, cellRect.width);
    
    // Sincronizar todas las celdas en la misma fila de tiempo
    const calendar = cell.closest('.calendar');
    if (calendar) {
        const timeValue = cell.dataset.time;
        const allCells = Array.from(calendar.querySelectorAll('.cell'));
        const sameTimeCells = allCells.filter(c => c.dataset.time === timeValue);
        
        // Calcular altura máxima necesaria para todas las celdas de esta fila
        let maxHeight = requiredHeight;
        sameTimeCells.forEach(c => {
            const cAllEvents = Array.from(c.querySelectorAll(SELECTORS.EVENT));
            const cVisibleEvents = getVisibleElements(cAllEvents);
            if (cVisibleEvents.length > 0) {
                const cRect = c.getBoundingClientRect();
                const cRequiredHeight = calculateRequiredHeight(cVisibleEvents, cRect.width);
                if (cRequiredHeight > maxHeight) maxHeight = cRequiredHeight;
            }
        });
        
        if (maxHeight < MIN_CELL_HEIGHT) maxHeight = MIN_CELL_HEIGHT;
        
        // Aplicar altura máxima a todas las celdas de esta fila
        sameTimeCells.forEach(c => {
            c.style.height = maxHeight + 'px';
            
            // Distribuir eventos visibles en esta celda
            const cAllEvents = Array.from(c.querySelectorAll(SELECTORS.EVENT));
            const cVisibleEvents = getVisibleElements(cAllEvents);
            
            if (cVisibleEvents.length > 0) {
                const cRect = c.getBoundingClientRect();
                const layout = calculateEventLayout(cVisibleEvents, cRect.width);
                
                // Aplicar posiciones y tamaños
                layout.forEach(item => {
                    item.event.style.position = 'absolute';
                    item.event.style.left = (CELL_PADDING + item.x) + 'px';
                    item.event.style.top = item.y + 'px';
                    item.event.style.width = item.width + 'px';
                    item.event.style.maxWidth = item.width + 'px';
                    item.event.style.height = item.height + 'px';
                    item.event.style.minHeight = item.height + 'px';
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
            const cellRect = cell.getBoundingClientRect();
            const layout = calculateEventLayout(visibleEvents, cellRect.width, requiredHeight);
            
            layout.forEach(item => {
                item.event.style.position = 'absolute';
                item.event.style.left = (CELL_PADDING + item.x) + 'px';
                item.event.style.top = item.y + 'px';
                item.event.style.width = item.width + 'px';
                item.event.style.maxWidth = item.width + 'px';
                item.event.style.height = item.height + 'px';
                item.event.style.minHeight = item.height + 'px';
            });
        }
    }
}

