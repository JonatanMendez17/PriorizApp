import { createEventElement } from './events.js';
import { updateEventPositions } from './calendar.js';
import { saveEventsToStorage } from './storage.js';
import { getElement, isValid, handleError } from './utils.js';
import { SELECTORS } from './constants.js';
import { getPersonFromEvent } from './storage.js';

// Estado del modal
let selectedCell = null;
let editingEvent = null;

/**
 * Abre el modal para agregar o editar una actividad
 * @param {HTMLElement} cell - Celda del calendario
 * @param {Event} event - Evento del clic
 * @param {boolean} isEdit - Si está en modo edición
 */
export function openModal(cell, event, isEdit = false) {
    if (!cell) {
        handleError(new Error('Celda no válida'), 'openModal');
        return;
    }
    
    selectedCell = cell;
    if (!isEdit) {
        editingEvent = null;
    }
    
    const modal = getElement(SELECTORS.MODAL);
    const modalContent = getElement(SELECTORS.MODAL_CONTENT);
    const modalTitleText = getElement(SELECTORS.MODAL_TITLE_TEXT);
    const saveButton = modalContent?.querySelector(SELECTORS.MODAL_SAVE_BTN);
    const titleInput = getElement(SELECTORS.MODAL_TITLE_INPUT);
    const personSelect = getElement(SELECTORS.MODAL_PERSON);
    
    if (!modal || !modalContent || !saveButton) {
        handleError(new Error('Elementos del modal no encontrados'), 'openModal');
        return;
    }
    
    // Configurar modal según modo
    if (isEdit) {
        if (modalTitleText) modalTitleText.textContent = "Editar Actividad";
        saveButton.textContent = "Guardar";
    } else {
        if (modalTitleText) modalTitleText.textContent = "Agregar Actividad";
        saveButton.textContent = "Agregar";
        if (titleInput) titleInput.value = "";
        if (personSelect) personSelect.value = "jonatan";
    }
    
    // Posicionar modal
    positionModal(modal, cell, event);
    
    // Mostrar y enfocar
    modal.style.display = "block";
    setTimeout(() => {
        if (titleInput) titleInput.focus();
    }, 10);
}

// Posicionar modal cerca del clic
function positionModal(modal, cell, event) {
    const rect = cell.getBoundingClientRect();
    const clickX = event ? event.clientX : rect.left + rect.width / 2;
    const clickY = event ? event.clientY : rect.top + rect.height / 2;
    
    const modalWidth = 280;
    const modalHeight = 200;
    const padding = 10;
    
    let left = clickX - modalWidth / 2;
    let top = clickY + rect.height / 2 + padding;
    
    // Ajustar si se sale de la pantalla
    if (left < padding) left = padding;
    if (left + modalWidth > window.innerWidth - padding) {
        left = window.innerWidth - modalWidth - padding;
    }
    if (top + modalHeight > window.innerHeight - padding) {
        top = clickY - modalHeight - padding;
    }
    if (top < padding) top = padding;
    
    modal.style.left = left + 'px';
    modal.style.top = top + 'px';
}

/**
 * Abre el modal en modo edición
 * @param {HTMLElement} eventElement - Elemento del evento a editar
 * @param {Event} clickEvent - Evento del clic
 */
export function openEditModal(eventElement, clickEvent) {
    if (!eventElement) {
        handleError(new Error('Elemento de evento no válido'), 'openEditModal');
        return;
    }
    
    editingEvent = eventElement;
    const cell = eventElement.parentElement;
    
    if (!cell || !cell.classList.contains('cell')) {
        handleError(new Error('Celda padre no válida'), 'openEditModal');
        return;
    }
    
    // Obtener datos del evento
    const person = getPersonFromEvent(eventElement);
    const title = eventElement.textContent;
    
    // Cargar datos en el modal
    const personSelect = getElement(SELECTORS.MODAL_PERSON);
    const titleInput = getElement(SELECTORS.MODAL_TITLE_INPUT);
    
    if (personSelect) personSelect.value = person;
    if (titleInput) titleInput.value = title;
    
    // Posicionar modal
    const rect = eventElement.getBoundingClientRect();
    const fakeEvent = {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2
    };
    
    openModal(cell, fakeEvent, true);
}

/**
 * Cierra el modal y limpia el estado
 */
export function closeModal() {
    const modal = getElement(SELECTORS.MODAL);
    if (modal) {
        modal.style.display = "none";
    }
    
    selectedCell = null;
    editingEvent = null;
    
    const titleInput = getElement(SELECTORS.MODAL_TITLE_INPUT);
    const personSelect = getElement(SELECTORS.MODAL_PERSON);
    
    if (titleInput) titleInput.value = "";
    if (personSelect) personSelect.value = "jonatan";
}

/**
 * Guarda un evento desde el modal
 */
export function saveEventFromModal() {
    const personSelect = getElement(SELECTORS.MODAL_PERSON);
    const titleInput = getElement(SELECTORS.MODAL_TITLE_INPUT);
    
    if (!personSelect || !titleInput) {
        handleError(new Error('Elementos del formulario no encontrados'), 'saveEventFromModal');
        return;
    }
    
    const person = personSelect.value;
    const title = titleInput.value.trim();
    
    if (!isValid(title)) {
        return;
    }
    
    if (editingEvent) {
        // Editar evento existente
        editingEvent.className = `event ${person}`;
        editingEvent.textContent = title;
        editingEvent.draggable = true;
        editingEvent.tabIndex = 0;
        
        const cell = editingEvent.parentElement;
        if (cell && cell.classList.contains('cell')) {
            updateEventPositions(cell);
        }
        saveEventsToStorage();
        closeModal();
    } else if (selectedCell) {
        // Crear nuevo evento
        const ev = createEventElement(person, title);
        selectedCell.appendChild(ev);
        updateEventPositions(selectedCell);
        saveEventsToStorage();
        closeModal();
    }
}

// Obtener celda seleccionada para agregar desde menú contextual
export function getSelectedCellForContextMenu() {
    return selectedCell;
}

