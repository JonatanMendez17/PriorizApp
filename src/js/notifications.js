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
    
    const iconDiv = document.createElement('div');
    iconDiv.className = 'notification-icon';
    iconDiv.textContent = icons[type] || icons.info;

    const msgDiv = document.createElement('div');
    msgDiv.className = 'notification-message';
    msgDiv.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'notification-close';
    closeBtn.setAttribute('aria-label', 'Cerrar');
    closeBtn.textContent = '×';

    notification.appendChild(iconDiv);
    notification.appendChild(msgDiv);
    notification.appendChild(closeBtn);
    
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
        
        const header = document.createElement('div');
        header.className = 'confirm-header';
        const h3 = document.createElement('h3');
        h3.className = 'confirm-title';
        h3.textContent = title;
        header.appendChild(h3);

        const body = document.createElement('div');
        body.className = 'confirm-body';
        const p = document.createElement('p');
        p.className = 'confirm-message';
        p.textContent = message;
        body.appendChild(p);

        const actions = document.createElement('div');
        actions.className = 'confirm-actions';
        const cancelBtnEl = document.createElement('button');
        cancelBtnEl.className = 'confirm-btn confirm-btn-cancel';
        cancelBtnEl.textContent = 'Cancelar';
        const okBtnEl = document.createElement('button');
        okBtnEl.className = 'confirm-btn confirm-btn-ok';
        okBtnEl.textContent = 'Aceptar';
        actions.appendChild(cancelBtnEl);
        actions.appendChild(okBtnEl);

        dialog.appendChild(header);
        dialog.appendChild(body);
        dialog.appendChild(actions);
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // Animar entrada
        requestAnimationFrame(() => {
            overlay.classList.add('show');
        });
        
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
        
        cancelBtnEl.addEventListener('click', () => close(false));
        okBtnEl.addEventListener('click', () => close(true));
        
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
        cancelBtnEl.focus();
    });
}

