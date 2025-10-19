import React from 'react';

// This is a simple, non-interactive component for display only.
const SimpleValueItem = ({ id }: { id: string }) => (
    <div className="bg-white p-2 text-sm rounded-lg shadow text-center border border-gray-200">
        {id}
    </div>
);

type TierDragOverlayProps = {
    tierItems: string[];
    rank: number;
};

/**
 * This component renders a visual clone of a tier for the DragOverlay
 */
const TierDragOverlay: React.FC<TierDragOverlayProps> = ({ tierItems, rank }) => {
    return (
        <div className="flex items-center gap-4 p-2 bg-white rounded-lg shadow-xl">
            <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-gray-200 rounded-full font-bold text-gray-600">
                {rank}
            </div>
            <div className="flex flex-wrap gap-2">
                {tierItems.map(item => 
                    <SimpleValueItem key={item} id={item} />)}
            </div>
        </div>
    );
};

export default TierDragOverlay;