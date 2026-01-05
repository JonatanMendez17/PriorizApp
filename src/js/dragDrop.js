import { updateEventPositions } from './calendar.js';
import { saveEventsToStorage } from './storage.js';
import { getDraggedElement } from './events.js';
import { handleError } from './utils.js';

// Manejar drag over
export function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('drag-over');
    return false;
}

// Manejar drag leave
export function handleDragLeave(e) {
    if (!this.contains(e.relatedTarget)) {
        this.classList.remove('drag-over');
    }
}

// Manejar drop
export function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    this.classList.remove('drag-over');
    
    const draggedElement = getDraggedElement();
    if (draggedElement && draggedElement !== this) {
        const sourceCell = draggedElement.parentElement;
        this.appendChild(draggedElement);
        
        updateEventPositions(this);
        if (sourceCell && sourceCell.classList.contains('cell')) {
            updateEventPositions(sourceCell);
        }
        saveEventsToStorage();
    }
    
    return false;
}

