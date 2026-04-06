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
        const iconInput = getElement(SELECTORS.MODAL_ICON_INPUT);
        if (iconInput) iconInput.value = "";
    }
    
    // Mostrar y enfocar
    modal.style.display = "block";
    setTimeout(() => {
        if (titleInput) titleInput.focus();
    }, 10);
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
    const iconElement = eventElement.querySelector('.event-icon');
    const titleElement = eventElement.querySelector('.event-title');
    const icon = iconElement ? iconElement.textContent : '';
    const title = titleElement ? titleElement.textContent : eventElement.textContent;
    
    // Cargar datos en el modal
    const personSelect = getElement(SELECTORS.MODAL_PERSON);
    const titleInput = getElement(SELECTORS.MODAL_TITLE_INPUT);
    const iconInput = getElement(SELECTORS.MODAL_ICON_INPUT);
    
    if (personSelect) personSelect.value = person;
    if (titleInput) titleInput.value = title;
    if (iconInput) iconInput.value = icon;
    
    openModal(cell, null, true);
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
    const iconInput = getElement(SELECTORS.MODAL_ICON_INPUT);
    
    if (titleInput) titleInput.value = "";
    if (personSelect) personSelect.value = "jonatan";
    if (iconInput) iconInput.value = "";
}

/**
 * Guarda un evento desde el modal
 */
export function saveEventFromModal() {
    const personSelect = getElement(SELECTORS.MODAL_PERSON);
    const titleInput = getElement(SELECTORS.MODAL_TITLE_INPUT);
    const iconInput = getElement(SELECTORS.MODAL_ICON_INPUT);
    
    if (!personSelect || !titleInput) {
        handleError(new Error('Elementos del formulario no encontrados'), 'saveEventFromModal');
        return;
    }
    
    const person = personSelect.value;
    const title = titleInput.value.trim();
    const icon = iconInput ? iconInput.value.trim() : '';
    
    if (!isValid(title)) {
        return;
    }
    
    if (editingEvent) {
        // Editar evento existente
        editingEvent.className = `event ${person}`;
        editingEvent.draggable = true;
        editingEvent.tabIndex = 0;
        
        // Actualizar contenido con icono
        editingEvent.innerHTML = '';
        if (icon) {
            const iconSpan = document.createElement('span');
            iconSpan.className = 'event-icon';
            iconSpan.textContent = icon;
            editingEvent.appendChild(iconSpan);
        }
        const titleSpan = document.createElement('span');
        titleSpan.className = 'event-title';
        titleSpan.textContent = title;
        editingEvent.appendChild(titleSpan);
        
        const cell = editingEvent.parentElement;
        if (cell && cell.classList.contains('cell')) {
            updateEventPositions(cell);
        }
        saveEventsToStorage();
        closeModal();
    } else if (selectedCell) {
        // Crear nuevo evento
        const ev = createEventElement(person, title, null, icon);
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

