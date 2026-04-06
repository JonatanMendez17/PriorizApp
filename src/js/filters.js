import { updateEventPositions } from './calendar.js';
import { getElements } from './utils.js';
import { SELECTORS } from './constants.js';

/**
 * Estado de visibilidad de filtros
 */
export let visible = {
    jonatan: true,
    mariana: false,
    caleb: false,
    catalina: false
};

/**
 * Aplica el estado actual de visibilidad a todos los eventos del DOM
 */
export function applyFilters() {
    Object.entries(visible).forEach(([person, isVisible]) => {
        getElements('.' + person).forEach(el => {
            el.style.display = isVisible ? 'inline-flex' : 'none';
        });
    });
    requestAnimationFrame(() => {
        getElements(SELECTORS.CELL).forEach(cell => {
            updateEventPositions(cell);
        });
    });
}

/**
 * Toggle de visibilidad de filtro
 * @param {string} person - Nombre de la persona
 */
export function toggle(person) {
    if (!visible.hasOwnProperty(person)) {
        console.warn(`Persona "${person}" no encontrada en filtros`);
        return;
    }
    
    visible[person] = !visible[person];
    getElements('.' + person).forEach(e => {
        e.style.display = visible[person] ? 'inline-flex' : 'none';
    });
    
    // Actualizar posiciones de todas las celdas después de cambiar filtros
    // Usar requestAnimationFrame para asegurar que el DOM se haya actualizado
    requestAnimationFrame(() => {
        getElements(SELECTORS.CELL).forEach(cell => {
            updateEventPositions(cell);
        });
    });
}

