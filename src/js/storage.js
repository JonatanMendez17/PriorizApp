import { CONFIG } from './config.js';
import { createEventElement } from './events.js';
import { updateEventPositions } from './calendar.js';
import { getElements, handleError } from './utils.js';
import { SELECTORS, STORAGE_VERSION } from './constants.js';
import { showNotification, showConfirm } from './notifications.js';

// Obtener el siguiente ID único para eventos
export function getNextEventId() {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (saved) {
        const events = JSON.parse(saved);
        const maxId = events.reduce((max, e) => Math.max(max, e.id || 0), 0);
        return maxId + 1;
    }
    return 1;
}

// Obtener la persona de un elemento de evento
export function getPersonFromEvent(eventElement) {
    for (const person of CONFIG.PEOPLE) {
        if (eventElement.classList.contains(person)) {
            return person;
        }
    }
    return 'jonatan';
}

/**
 * Guarda todas las actividades en localStorage
 */
export function saveEventsToStorage() {
    const allEvents = [];
    const cells = getElements(SELECTORS.CELL);
    
    cells.forEach(cell => {
        const events = cell.querySelectorAll(SELECTORS.EVENT);
        events.forEach(event => {
            const iconElement = event.querySelector('.event-icon');
            const titleElement = event.querySelector('.event-title');
            const icon = iconElement ? iconElement.textContent : '';
            const title = titleElement ? titleElement.textContent : event.textContent;
            
            allEvents.push({
                id: event.dataset.eventId,
                day: cell.dataset.day,
                time: cell.dataset.time,
                person: getPersonFromEvent(event),
                title: title,
                icon: icon
            });
        });
    });
    
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(allEvents));
}

/**
 * Carga actividades desde localStorage
 */
export function loadEventsFromStorage() {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (!saved) return;
    
    try {
        const events = JSON.parse(saved);
        events.forEach(eventData => {
            const cell = document.querySelector(`${SELECTORS.CELL}[data-day="${eventData.day}"][data-time="${eventData.time}"]`);
            if (cell) {
                const ev = createEventElement(
                    eventData.person, 
                    eventData.title, 
                    eventData.id, 
                    eventData.icon || ''
                );
                cell.appendChild(ev);
            }
        });
        
        // Actualizar posiciones de todas las celdas
        getElements(SELECTORS.CELL).forEach(cell => {
            updateEventPositions(cell);
        });
    } catch (error) {
        handleError(error, 'loadEventsFromStorage');
    }
}

// Exportar copia de seguridad
export function exportBackup() {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (!saved) {
        showNotification('No hay actividades para exportar', 'info', 3000);
        return;
    }
    
    try {
        const events = JSON.parse(saved);
        const backup = {
            version: STORAGE_VERSION,
            exportDate: new Date().toISOString(),
            events: events
        };
        
        const dataStr = JSON.stringify(backup, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `organizador_semanal_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showNotification(`Copia de seguridad exportada correctamente (${events.length} actividades)`, 'success', 4000);
    } catch (error) {
        handleError(error, 'exportBackup');
        showNotification('Error al exportar: ' + error.message, 'error', 5000);
    }
}

// Importar copia de seguridad
export async function importBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const backup = JSON.parse(e.target.result);
            const events = backup.events || backup;
            
            if (!Array.isArray(events)) {
                throw new Error('Formato de archivo inválido');
            }
            
            const confirmed = await showConfirm(
                `¿Estás seguro de que quieres importar ${events.length} actividades? Esto reemplazará todas las actividades actuales.`,
                'Importar Copia de Seguridad'
            );
            
            if (!confirmed) {
                event.target.value = '';
                return;
            }
            
            // Limpiar actividades actuales
            getElements(SELECTORS.EVENT).forEach(event => event.remove());
            
            // Cargar nuevas actividades
            events.forEach(eventData => {
                const cell = document.querySelector(`.cell[data-day="${eventData.day}"][data-time="${eventData.time}"]`);
                if (cell) {
                    const ev = createEventElement(
                        eventData.person, 
                        eventData.title, 
                        eventData.id, 
                        eventData.icon || ''
                    );
                    cell.appendChild(ev);
                }
            });
            
            // Actualizar posiciones y guardar
            getElements(SELECTORS.CELL).forEach(cell => {
                updateEventPositions(cell);
            });
            saveEventsToStorage();
            
            showNotification(`${events.length} actividades importadas correctamente`, 'success', 4000);
        } catch (error) {
            handleError(error, 'importBackup');
            showNotification('Error al importar: ' + error.message, 'error', 5000);
        }
    };
    
    reader.onerror = function() {
        showNotification('Error al leer el archivo', 'error', 4000);
    };
    
    reader.readAsText(file);
    event.target.value = '';
}

