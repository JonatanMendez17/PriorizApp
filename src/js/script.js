/**
 * Punto de entrada principal de la aplicación
 */
import { init } from './app.js';

// Inicializar aplicación cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM ya está listo
    init();
}
