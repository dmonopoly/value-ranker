import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import RankingTier from './RankingTier';

// A sub-component for the placeholder dropzone that appears during a drag
const NewTierDropZone = () => {
    const { setNodeRef, isOver } = useDroppable({ id: 'new-tier-drop-zone' });

    // Style the drop zone to give feedback when an item is dragged over it
    const style: React.CSSProperties = {
        backgroundColor: isOver ? '#e0f2fe' : 'transparent',
        borderColor: isOver ? '#38bdf8' : '#e5e7eb',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center justify-center p-4 border-2 border-dashed rounded-lg text-gray-400 transition-colors"
        >
            Drop here to create a new rank
        </div>
    );
};

// The props for the main RankingBoard component
type RankingBoardProps = {
    tierOrder: string[];
    containers: { [key: string]: string[] };
    activeDraggedId?: string | null;
};

const RankingBoard: React.FC<RankingBoardProps> = ({ tierOrder, containers }) => {
    return (
        <div className="flex flex-col">
            <div className="text-center px-2 mb-2"><span className="font-bold text-green-600">More Valued</span></div>
            
            <div className="relative w-full bg-white rounded-xl shadow-inner p-3 space-y-2">
                {/* This context makes the tiers themselves re-orderable */}
                <SortableContext items={tierOrder} strategy={verticalListSortingStrategy}>
                    {/* Map over the explicit tierOrder array to render tiers in the correct order */}
                    {tierOrder.map((tierId, index) => (
                        <RankingTier 
                            key={tierId} 
                            id={tierId} 
                            items={containers[tierId]} 
                            rank={index + 1} 
                        />
                    ))}
                </SortableContext>

                {<NewTierDropZone />}
            </div>
            
            <div className="text-center px-2 mt-2"><span className="font-bold text-red-600">Less Valued</span></div>
        </div>
    );
};

export default RankingBoard;