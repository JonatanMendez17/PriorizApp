import { getNextEventId, getPersonFromEvent } from './storage.js';
import { updateEventPositions } from './calendar.js';
import { saveEventsToStorage } from './storage.js';
import { showContextMenu } from './contextMenu.js';
import { getElements } from './utils.js';
import { SELECTORS, EVENT_TYPES } from './constants.js';

let contextMenuEvent = null;

/**
 * Crea un elemento de evento
 * @param {string} person - Persona asignada
 * @param {string} title - Título de la actividad
 * @param {string|number} eventId - ID único del evento
 * @param {string} icon - Icono/emoji de la actividad
 */
export function createEventElement(person, title, eventId = null, icon = '') {
    const ev = document.createElement('div');
    ev.className = `event ${person}`;
    ev.draggable = true;
    ev.tabIndex = 0;
    
    // Asignar ID único
    if (!eventId) {
        eventId = getNextEventId();
    }
    ev.dataset.eventId = eventId;
    
    // Crear contenido con icono y título
    const titleSpan = document.createElement('span');
    titleSpan.className = 'event-title';
    titleSpan.textContent = title;

    if (icon) {
        const iconSpan = document.createElement('span');
        iconSpan.className = 'event-icon';
        iconSpan.textContent = icon;
        ev.appendChild(iconSpan);
    }
    ev.appendChild(titleSpan);
    
    // Event listeners
    ev.addEventListener(EVENT_TYPES.DRAG_START, handleDragStart);
    ev.addEventListener(EVENT_TYPES.DRAG_END, handleDragEnd);
    ev.addEventListener(EVENT_TYPES.CLICK, handleEventClick);
    ev.addEventListener(EVENT_TYPES.CONTEXT_MENU, handleEventContextMenu);
    
    return ev;
}

// Manejar clic en evento
function handleEventClick(e) {
    e.stopPropagation();
    this.focus();
    
    // Duplicar con Alt + clic
    if (e.altKey) {
        const person = getPersonFromEvent(this);
        const titleElement = this.querySelector('.event-title');
        const title = titleElement ? titleElement.textContent : this.textContent;
        const iconElement = this.querySelector('.event-icon');
        const icon = iconElement ? iconElement.textContent : '';
        const originalCell = this.parentElement;

        const duplicate = createEventElement(person, title, null, icon);
        originalCell.appendChild(duplicate);
        updateEventPositions(originalCell);
        saveEventsToStorage();
    }
}

// Manejar menú contextual en evento
function handleEventContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    contextMenuEvent = this;
    showContextMenu(e.clientX, e.clientY);
}

// Obtener evento seleccionado en menú contextual
export function getContextMenuEvent() {
    return contextMenuEvent;
}

// Limpiar evento seleccionado en menú contextual
export function clearContextMenuEvent() {
    contextMenuEvent = null;
}

// Drag and Drop handlers
let draggedElement = null;

export function getDraggedElement() {
    return draggedElement;
}

export function setDraggedElement(element) {
    draggedElement = element;
}

export function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

export function handleDragEnd(e) {
    this.classList.remove('dragging');
    getElements(SELECTORS.CELL).forEach(cell => {
        cell.classList.remove('drag-over');
    });
}

