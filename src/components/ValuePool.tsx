"use client"; 

import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { ValuePoolPageType } from '../lib/ValuePoolPageType';
import { TEMPLATE_DISPLAY_NAMES, TemplateKey } from '../lib/ItemTemplates';
import ValueItem from './ValueItem';

type ValuePoolProps = {
    topic: TemplateKey;
    items: string[];
    pageType: ValuePoolPageType;
    onAddNewValue: (value: string) => void;
    onChangeTemplate: (templateKey: TemplateKey) => void;
    onDeleteItem: (id: string) => void;
};

/**
 * The value pool is the "parking lot" where unranked values are stored.
 */
const ValuePool: React.FC<ValuePoolProps> = ({ topic, items, pageType, onAddNewValue, onChangeTemplate, onDeleteItem }) => {
    const { setNodeRef } = useDroppable({ id: 'parking-lot' });
    const [newValue, setNewValue] = useState('');

    const handleAddClick = () => {
        onAddNewValue(newValue);
        setNewValue('');
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleAddClick();
        }
    };

    const handleTemplateSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        onChangeTemplate(event.target.value as TemplateKey);
    }

    function shouldDisableTopicSelect() {
        return pageType === 'edit' || pageType === 'invited';
    }

    function getSelectClassName() {
        console.log('topic', topic);
        return `${shouldDisableTopicSelect() ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white'} inline-block p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none h-full`;
    }

    return (
        <div className="flex flex-col">
            <div className="p-2">
                {(
                    <div className="mb-2">
                        <div className="inline-block text-lg font-bold mb-2 mr-2">Topic:</div>
                        <select id="template-select"
                            value={topic}
                            onChange={handleTemplateSelect}
                            disabled={shouldDisableTopicSelect()}
                            className={getSelectClassName()}
                            aria-label="Select a value template"
                        >
                            {(Object.keys(TEMPLATE_DISPLAY_NAMES) as TemplateKey[]).map((key) => (
                                <option key={key} value={key}>
                                    {TEMPLATE_DISPLAY_NAMES[key]}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="flex flex-col sm:flex-row gap-2 mb-2">
                    <input 
                        type="text"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        onKeyDown={handleKeyDown}
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
            </div>

            <SortableContext items={items} strategy={rectSortingStrategy}>
                <div 
                    ref={setNodeRef}
                    className="bg-gray-100 rounded-xl shadow-inner p-3 flex flex-wrap gap-2 min-h-[100px] overflow-y-auto content-start"
                >
                    {items.length === 0 && <div className="text-gray-500 pt-2 pl-2 pr-2 pb-2">No items to rank yet</div>}
                    {items.map(item =>
                        <ValueItem key={item} id={item} onDelete={onDeleteItem} />)}
                    {items.length > 0 && <div className="w-full text-center text-gray-400 pt-2 pl-2 pr-2 pb-2">Leave unranked items here</div>}
                </div>
            </SortableContext>
        </div>
    );
};

export default ValuePool;