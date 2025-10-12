import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import ValueItem from './ValueItem';

type RankingTierProps = {
    id: string;
    items: string[];
    rank: number;
};

const RankingTier: React.FC<RankingTierProps> = ({ id, items, rank }) => {
    const { setNodeRef: setDroppableNodeRef } = useDroppable({ id });

    const {
        attributes,
        listeners,
        setNodeRef: setSortableNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setSortableNodeRef} style={style} {...attributes} className="flex items-center gap-4 touch-none">
            {/* The drag handle for the entire tier */}
            <div 
                {...listeners} 
                className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-gray-200 rounded-full font-bold text-gray-600 cursor-grab"
            >
                {rank}
            </div>
            <SortableContext items={items} strategy={rectSortingStrategy}>
                <div
                    ref={setDroppableNodeRef}
                    className="ranking-tier w-full flex flex-wrap gap-2 p-2 border-2 border-dashed rounded-lg min-h-[52px]"
                >
                    {items.map(item => <ValueItem key={item} id={item} />)}
                    {items.length === 0 && <span className="text-gray-400 text-sm">Drop here</span>}
                </div>
            </SortableContext>
        </div>
    );
};

export default RankingTier;