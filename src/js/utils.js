/**
 * Utilidades generales de la aplicación
 */

/**
 * Obtiene elementos visibles de un array de elementos DOM
 * @param {NodeList|Array} elements - Lista de elementos
 * @returns {Array} - Elementos visibles
 */
export function getVisibleElements(elements) {
    return Array.from(elements).filter(element => {
        const style = window.getComputedStyle(element);
        return style.display !== 'none';
    });
}

/**
 * Valida si un valor es válido
 * @param {*} value - Valor a validar
 * @returns {boolean}
 */
export function isValid(value) {
    return value !== null && value !== undefined && value !== '';
}

/**
 * Obtiene un elemento del DOM de forma segura
 * @param {string} selector - Selector CSS
 * @returns {HTMLElement|null}
 */
export function getElement(selector) {
    return document.querySelector(selector);
}

/**
 * Obtiene múltiples elementos del DOM
 * @param {string} selector - Selector CSS
 * @returns {NodeList}
 */
export function getElements(selector) {
    return document.querySelectorAll(selector);
}

/**
 * Crea un elemento DOM con atributos
 * @param {string} tag - Etiqueta HTML
 * @param {Object} attributes - Atributos del elemento
 * @param {string} textContent - Contenido de texto
 * @returns {HTMLElement}
 */
export function createElement(tag, attributes = {}, textContent = '') {
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'dataset') {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                element.dataset[dataKey] = dataValue;
            });
        } else {
            element.setAttribute(key, value);
        }
    });
    if (textContent) {
        element.textContent = textContent;
    }
    return element;
}

/**
 * Debounce para optimizar llamadas de función
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function}
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Maneja errores de forma consistente
 * @param {Error} error - Error a manejar
 * @param {string} context - Contexto donde ocurrió el error
 */
export function handleError(error, context = '') {
    console.error(`Error ${context ? `en ${context}` : ''}:`, error);
    // Aquí se podría agregar un sistema de logging más sofisticado
}

