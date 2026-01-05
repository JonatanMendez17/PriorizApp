import { getNextEventId, getPersonFromEvent } from './storage.js';
import { updateEventPositions } from './calendar.js';
import { saveEventsToStorage } from './storage.js';
import { showContextMenu } from './contextMenu.js';
import { getElements } from './utils.js';
import { SELECTORS, EVENT_TYPES } from './constants.js';

let contextMenuEvent = null;

// Crear elemento de evento
export function createEventElement(person, title, eventId = null) {
    const ev = document.createElement('div');
    ev.className = `event ${person}`;
    ev.textContent = title;
    ev.draggable = true;
    ev.tabIndex = 0;
    
    // Asignar ID único
    if (!eventId) {
        eventId = getNextEventId();
    }
    ev.dataset.eventId = eventId;
    
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
        const title = this.textContent;
        const originalCell = this.parentElement;
        
        const duplicate = createEventElement(person, title);
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

// Duplicar evento
function duplicateEvent(eventElement, clickEvent) {
    const person = getPersonFromEvent(eventElement);
    const title = eventElement.textContent;
    const originalCell = eventElement.parentElement;
    
    const duplicate = createEventElement(person, title);
    originalCell.appendChild(duplicate);
    updateEventPositions(originalCell);
    saveEventsToStorage();
}

export { duplicateEvent };

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

