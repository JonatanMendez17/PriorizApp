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
        e.style.display = visible[person] ? 'flex' : 'none';
    });
    
    // Actualizar posiciones de todas las celdas después de cambiar filtros
    getElements(SELECTORS.CELL).forEach(cell => {
        updateEventPositions(cell);
    });
}

