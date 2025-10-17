"use client"; 

import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { ValuePoolPageType } from '../lib/ValuePoolPageType';
import ValueItem from './ValueItem';

type ValuePoolProps = {
    items: string[];
    pageType: ValuePoolPageType;
    onAddNewValue: (value: string) => void;
    onChangeTemplate: (id: string) => void;
    onDeleteItem: (id: string) => void;
};

/**
 * The value pool is the "parking lot" where unranked values are stored.
 */
const ValuePool: React.FC<ValuePoolProps> = ({ items, pageType, onAddNewValue, onChangeTemplate, onDeleteItem }) => {
    const { setNodeRef } = useDroppable({ id: 'parking-lot' });
    const [newValue, setNewValue] = useState('');

    const handleAddClick = () => {
        onAddNewValue(newValue);
        setNewValue(''); // Clear the input after adding
    };

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleAddClick();
        }
    };

    return (
        <div className="flex flex-col">
            <h2 className="font-bold text-center text-gray-600 mb-2">Items</h2>
            <div className="p-2">
                <div className="flex flex-col sm:flex-row gap-2 mb-2">
                    <input 
                        type="text"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Add your own item..."
                        className="flex-grow p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button 
                        onClick={handleAddClick}
                        className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition w-full sm:w-auto"
                    >
                        Add
                    </button>
                </div>
                {pageType === 'create' && (
                    <div className="mb-2">
                        <div className="inline-block text-sm text-gray-400 mb-2 mr-2">Or preload a template</div>
                        <select id="template-select"
                            onChange={(e) => onChangeTemplate(e.target.value)}
                            className="inline-block p-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none h-full"
                            aria-label="Select a value template"
                        >
                            <option value="blank">Blank</option>
                            <option value="basic_values">Core Values</option>
                            <option value="cuisines">Cuisines</option>
                            <option value="funny_situations">Funny Situations</option>
                            <option value="love_languages">Love Languages</option>
                            <option value="romantic_gestures">Romantic Gestures</option>
                            {/* <option value="detailed_values">Detailed Values</option> */}
                        </select>
                    </div>
                )}
            </div>

            <SortableContext items={items} strategy={rectSortingStrategy}>
                <div 
                    ref={setNodeRef}
                    className="bg-gray-100 rounded-xl shadow-inner p-3 flex flex-wrap gap-2 min-h-[100px] overflow-y-auto content-start"
                >
                    {items.length === 0 && <div className="text-gray-500 pt-2 pl-2 pr-2 pb-2">No items to rank yet</div>}
                    {items.map(item =>
                        // @ts-ignore
                        <ValueItem key={item} id={item} onDelete={onDeleteItem} />)}
                    {items.length > 0 && <div className="w-full text-center text-gray-400 pt-2 pl-2 pr-2 pb-2">Leave unranked items here</div>}
                </div>
            </SortableContext>
        </div>
    );
};

export default ValuePool;