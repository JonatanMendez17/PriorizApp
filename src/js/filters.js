import { updateAllEventPositions } from './calendar.js';
import { getElements } from './utils.js';

/**
 * Estado de visibilidad de filtros
 */
export let visible = {
    jonatan: true,
    mariana: false,
    caleb: false,
    catalina: false
};

let pendingRaf = null;

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
        updateAllEventPositions();
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

    // Cancelar RAF previo para que toggles rápidos generen un solo recálculo
    if (pendingRaf) cancelAnimationFrame(pendingRaf);
    pendingRaf = requestAnimationFrame(() => {
        pendingRaf = null;
        updateAllEventPositions();
    });
}

