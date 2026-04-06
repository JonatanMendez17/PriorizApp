/**
 * Módulo principal de inicialización de la aplicación
 * Centraliza la configuración de event listeners y la inicialización
 */

import { SELECTORS, KEYBOARD_KEYS, EVENT_TYPES } from './constants.js';
import { getElement, getElements, handleError } from './utils.js';
import { createCalendar, updateEventPositions } from './calendar.js';
import { loadEventsFromStorage, exportBackup, importBackup, saveEventsToStorage } from './storage.js';
import { openModal, closeModal, saveEventFromModal } from './modal.js';
import { handleDragOver, handleDragLeave, handleDrop } from './dragDrop.js';
import { toggle, applyFilters } from './filters.js';
import { addFromContextMenu, editFromContextMenu, deleteFromContextMenu, hideContextMenu } from './contextMenu.js';

/**
 * Configura los event listeners de las celdas del calendario
 */
function setupCellListeners() {
    const cells = getElements(SELECTORS.CELL);
    
    cells.forEach(cell => {
        // Click en celda para abrir modal
        cell.addEventListener(EVENT_TYPES.CLICK, (e) => {
            if (!e.target.classList.contains('event')) {
                openModal(cell, e);
            }
        });
        
        // Drag and drop
        cell.addEventListener(EVENT_TYPES.DRAG_OVER, handleDragOver);
        cell.addEventListener(EVENT_TYPES.DROP, handleDrop);
        cell.addEventListener(EVENT_TYPES.DRAG_LEAVE, handleDragLeave);
    });
}

/**
 * Configura los event listeners del modal
 */
function setupModalListeners() {
    // Cerrar modal al hacer clic fuera
    document.addEventListener(EVENT_TYPES.CLICK, (event) => {
        const modal = getElement(SELECTORS.MODAL);
        const modalContent = getElement(SELECTORS.MODAL_CONTENT);
        
        if (modal && modalContent && 
            modal.style.display === 'block' && 
            !modalContent.contains(event.target) && 
            !event.target.closest(SELECTORS.CELL)) {
            closeModal();
        }
    });
    
    // Botón de cerrar
    const closeBtn = getElement(SELECTORS.CLOSE_BTN);
    if (closeBtn) {
        closeBtn.addEventListener(EVENT_TYPES.CLICK, closeModal);
    }

    // Guardar con Enter desde el input de título
    const titleInput = getElement(SELECTORS.MODAL_TITLE_INPUT);
    if (titleInput) {
        titleInput.addEventListener(EVENT_TYPES.KEYDOWN, (e) => {
            if (e.key === KEYBOARD_KEYS.ENTER) {
                e.preventDefault();
                saveEventFromModal();
            }
        });
    }
}

/**
 * Configura los event listeners del teclado
 */
function setupKeyboardListeners() {
    document.addEventListener(EVENT_TYPES.KEYDOWN, (event) => {
        // Cerrar modal y menú contextual con Escape
        if (event.key === KEYBOARD_KEYS.ESCAPE) {
            closeModal();
            hideContextMenu();
        }
        
        // Eliminar evento con Delete o Backspace
        if ((event.key === KEYBOARD_KEYS.DELETE || event.key === KEYBOARD_KEYS.BACKSPACE) && 
            document.activeElement?.classList.contains('event')) {
            event.preventDefault();
            const eventElement = document.activeElement;
            const cell = eventElement.parentElement;
            
            if (cell && cell.classList.contains('cell')) {
                eventElement.remove();
                updateEventPositions(cell);
                saveEventsToStorage();
            }
        }
    });
}

/**
 * Configura los event listeners del menú contextual
 */
function setupContextMenuListeners() {
    const contextAdd = getElement(SELECTORS.CONTEXT_ADD);
    const contextEdit = getElement(SELECTORS.CONTEXT_EDIT);
    const contextDelete = getElement(SELECTORS.CONTEXT_DELETE);
    
    if (contextAdd) {
        contextAdd.addEventListener(EVENT_TYPES.CLICK, (e) => {
            e.stopPropagation();
            addFromContextMenu();
        });
    }
    
    if (contextEdit) {
        contextEdit.addEventListener(EVENT_TYPES.CLICK, (e) => {
            e.stopPropagation();
            editFromContextMenu();
        });
    }
    
    if (contextDelete) {
        contextDelete.addEventListener(EVENT_TYPES.CLICK, (e) => {
            e.stopPropagation();
            deleteFromContextMenu();
        });
    }
    
    // Cerrar menú contextual al hacer clic fuera
    document.addEventListener(EVENT_TYPES.CLICK, (e) => {
        const contextMenu = getElement(SELECTORS.CONTEXT_MENU);
        if (contextMenu && 
            !contextMenu.contains(e.target) && 
            contextMenu.style.display === 'block') {
            hideContextMenu();
        }
    });
}

/**
 * Configura los event listeners de backup
 */
function setupBackupListeners() {
    const exportBtn = getElement(SELECTORS.EXPORT_BTN);
    const importInput = getElement(SELECTORS.IMPORT_INPUT);
    
    if (exportBtn) {
        exportBtn.addEventListener(EVENT_TYPES.CLICK, exportBackup);
    }
    
    if (importInput) {
        importInput.addEventListener(EVENT_TYPES.CHANGE, importBackup);
    }
}

/**
 * Configura los event listeners del selector de iconos
 */
function setupIconSelectorListeners() {
    const iconOptions = getElements('.icon-option');
    const iconInput = getElement(SELECTORS.MODAL_ICON_INPUT);
    
    iconOptions.forEach(option => {
        option.addEventListener(EVENT_TYPES.CLICK, () => {
            const icon = option.dataset.icon;
            if (iconInput) {
                iconInput.value = icon;
                iconInput.focus();
            }
        });
    });
}

/**
 * Expone funciones globales necesarias para HTML
 */
function exposeGlobalFunctions() {
    window.toggle = toggle;
    window.closeModal = closeModal;
    window.saveEventFromModal = saveEventFromModal;
}

/**
 * Inicializa la aplicación
 */
export function init() {
    try {
        // Crear calendario y configurar listeners
        createCalendar();
        setupCellListeners();
        loadEventsFromStorage();
        applyFilters();
        
        // Configurar otros listeners
        setupModalListeners();
        setupKeyboardListeners();
        setupContextMenuListeners();
        setupBackupListeners();
        setupIconSelectorListeners();
        
        // Exponer funciones globales
        exposeGlobalFunctions();
        
    } catch (error) {
        handleError(error, 'init');
    }
}

