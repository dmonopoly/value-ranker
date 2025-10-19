import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type ValueItemProps = {
    id: string;
    onDelete?: (id: string) => void;
};

/**
 * ValueItem represents an individual draggable item.
 * 
 * @param id - The unique identifier for the item.
 * @returns 
 */
const ValueItem: React.FC<ValueItemProps> = ({ id }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging // This property is true when the item is being dragged
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        cursor: 'grab',
        // If this item is being dragged, make it invisible.
        // The DragOverlay will show the clone instead.
        opacity: isDragging ? 0 : 1,
        // Give it a higher z-index while dragging to prevent other items
        // from appearing on top of it as it moves out of the way.
        zIndex: isDragging ? 999 : 'auto',
    };

    // const handleDelete = (e: React.MouseEvent) => {
    //     // Prevent the drag event from firing when clicking the delete button
    //     e.stopPropagation(); 
    //     onDelete?.(id);
    // };
    
    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            {...attributes} 
            {...listeners}
            className="bg-white p-2 text-sm rounded-lg shadow text-center border border-gray-200 touch-none relative"
        >
            {/* 
                The "x" button only renders if onDelete exists and the item is NOT being dragged.
                TODO: This doesn't work yet; needs investigation; deprioritized for now.
            */}
            {/* {onDelete && !isDragging && (
                <button 
                    onClick={handleDelete}
                    className="absolute -top-1 -left-1 w-4 h-4 bg-gray-400 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-500 transition-colors"
                    aria-label={`Delete ${id}`}
                >
                    &times;
                </button>
            )} */}
            {id}
        </div>
    );
};

export default ValueItem;