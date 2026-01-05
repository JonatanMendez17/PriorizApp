/**
 * Módulo de notificaciones y confirmaciones personalizadas
 */

/**
 * Muestra una notificación toast
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo: 'success', 'error', 'info'
 * @param {number} duration - Duración en ms (default: 3000)
 */
export function showNotification(message, type = 'info', duration = 3000) {
    // Crear contenedor de notificaciones si no existe
    let container = document.getElementById('notifications-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notifications-container';
        document.body.appendChild(container);
    }
    
    // Crear notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Icono según el tipo
    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ'
    };
    
    notification.innerHTML = `
        <div class="notification-icon">${icons[type] || icons.info}</div>
        <div class="notification-message">${message}</div>
        <button class="notification-close" aria-label="Cerrar">×</button>
    `;
    
    // Agregar al contenedor
    container.appendChild(notification);
    
    // Animar entrada
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });
    
    // Cerrar automáticamente
    const timeout = setTimeout(() => {
        closeNotification(notification);
    }, duration);
    
    // Cerrar manualmente
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        clearTimeout(timeout);
        closeNotification(notification);
    });
    
    // Cerrar al hacer clic en la notificación
    notification.addEventListener('click', (e) => {
        if (e.target === notification || e.target.classList.contains('notification-message')) {
            clearTimeout(timeout);
            closeNotification(notification);
        }
    });
}

/**
 * Cierra una notificación
 * @param {HTMLElement} notification - Elemento de notificación
 */
function closeNotification(notification) {
    notification.classList.remove('show');
    notification.classList.add('hide');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

/**
 * Muestra un diálogo de confirmación personalizado
 * @param {string} message - Mensaje a mostrar
 * @param {string} title - Título del diálogo (opcional)
 * @returns {Promise<boolean>} - Promise que resuelve a true si se confirma, false si se cancela
 */
export function showConfirm(message, title = 'Confirmar') {
    return new Promise((resolve) => {
        // Crear overlay
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        
        // Crear diálogo
        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        
        dialog.innerHTML = `
            <div class="confirm-header">
                <h3 class="confirm-title">${title}</h3>
            </div>
            <div class="confirm-body">
                <p class="confirm-message">${message}</p>
            </div>
            <div class="confirm-actions">
                <button class="confirm-btn confirm-btn-cancel">Cancelar</button>
                <button class="confirm-btn confirm-btn-ok">Aceptar</button>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // Animar entrada
        requestAnimationFrame(() => {
            overlay.classList.add('show');
        });
        
        // Botones
        const cancelBtn = dialog.querySelector('.confirm-btn-cancel');
        const okBtn = dialog.querySelector('.confirm-btn-ok');
        
        const close = (result) => {
            overlay.classList.remove('show');
            overlay.classList.add('hide');
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
                resolve(result);
            }, 200);
        };
        
        cancelBtn.addEventListener('click', () => close(false));
        okBtn.addEventListener('click', () => close(true));
        
        // Cerrar con Escape
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                close(false);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        // Cerrar al hacer clic fuera del diálogo
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                close(false);
            }
        });
        
        // Enfocar botón de cancelar por defecto
        cancelBtn.focus();
    });
}

