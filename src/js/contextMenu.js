import { openModal, openEditModal } from './modal.js';
import { getContextMenuEvent, clearContextMenuEvent } from './events.js';
import { updateEventPositions } from './calendar.js';
import { saveEventsToStorage } from './storage.js';
import { getElement, handleError } from './utils.js';
import { SELECTORS } from './constants.js';

/**
 * Muestra el menú contextual en la posición especificada
 * @param {number} x - Coordenada X
 * @param {number} y - Coordenada Y
 */
export function showContextMenu(x, y) {
    const contextMenu = getElement(SELECTORS.CONTEXT_MENU);
    if (!contextMenu) {
        handleError(new Error('Menú contextual no encontrado'), 'showContextMenu');
        return;
    }
    
    contextMenu.style.display = 'block';
    contextMenu.style.left = x + 'px';
    contextMenu.style.top = y + 'px';
    
    // Ajustar si se sale de la pantalla
    const rect = contextMenu.getBoundingClientRect();
    const padding = 10;
    
    if (rect.right > window.innerWidth) {
        contextMenu.style.left = (window.innerWidth - rect.width - padding) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
        contextMenu.style.top = (window.innerHeight - rect.height - padding) + 'px';
    }
}

/**
 * Oculta el menú contextual
 */
export function hideContextMenu() {
    const contextMenu = getElement(SELECTORS.CONTEXT_MENU);
    if (contextMenu) {
        contextMenu.style.display = 'none';
    }
    clearContextMenuEvent();
}

/**
 * Agrega una nueva actividad desde el menú contextual
 */
export function addFromContextMenu() {
    const contextMenuEvent = getContextMenuEvent();
    if (!contextMenuEvent) {
        handleError(new Error('No hay evento seleccionado'), 'addFromContextMenu');
        return;
    }
    
    const cell = contextMenuEvent.parentElement;
    if (!cell || !cell.classList.contains('cell')) {
        handleError(new Error('Celda padre no válida'), 'addFromContextMenu');
        return;
    }
    
    const rect = contextMenuEvent.getBoundingClientRect();
    const fakeEvent = {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2
    };
    
    hideContextMenu();
    openModal(cell, fakeEvent);
}

/**
 * Edita una actividad desde el menú contextual
 */
export function editFromContextMenu() {
    const contextMenuEvent = getContextMenuEvent();
    if (!contextMenuEvent) {
        handleError(new Error('No hay evento seleccionado'), 'editFromContextMenu');
        return;
    }
    
    hideContextMenu();
    const rect = contextMenuEvent.getBoundingClientRect();
    const fakeEvent = {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2
    };
    openEditModal(contextMenuEvent, fakeEvent);
}

/**
 * Elimina una actividad desde el menú contextual
 */
export function deleteFromContextMenu() {
    const contextMenuEvent = getContextMenuEvent();
    if (!contextMenuEvent) {
        handleError(new Error('No hay evento seleccionado'), 'deleteFromContextMenu');
        return;
    }
    
    const cell = contextMenuEvent.parentElement;
    contextMenuEvent.remove();
    
    if (cell && cell.classList.contains('cell')) {
        updateEventPositions(cell);
    }
    
    saveEventsToStorage();
    hideContextMenu();
}

