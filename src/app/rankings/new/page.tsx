"use client"; 

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
    DndContext, 
    DragOverlay, 
    DragStartEvent, 
    DragEndEvent, 
    UniqueIdentifier, 
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import ValuePool from '@/components/ValuePool';
import RankingBoard from '@/components/RankingBoard';
import ValueItem from '@/components/ValueItem';
import TierDragOverlay from '@/components/TierDragOverlay';
import { ORIGIN_ID_PARAM, TARGET_ID_PARAM } from '@/lib/ParamConstants';
import { SavedRankingFormat } from '@/lib/SavedRankingFormat';
import { TEMPLATES, TemplateKey } from '@/lib/ItemTemplates';
import { ObjectId } from "mongodb";
import Ranking from "@/models/Ranking";

// Internal state structure for quick JS manipulations before writing to SavedRankingFormat
type ItemsState = {
    // Stores key "parking-lot" for unranked items and "tier-<id>" for ranked tiers
    // where <id> is a unique number
    containers: {
        [key: string]: string[];
    };
    // Stores the "tier-<id>" keys in the ranked order
    tierOrder: string[];
    otherBlobIds?: string[];
};

const DEFAULT_CREATE_TEMPLATE: TemplateKey = 'blank';

const defaultInitialValues: ItemsState = {
    containers: {
        "parking-lot": [...TEMPLATES[DEFAULT_CREATE_TEMPLATE]],
    },
    tierOrder: [],
};
const RankingPage: React.FC = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const [items, setItems] = useState<ItemsState>(defaultInitialValues);

    // The default must match the first option in the dropdown in ValuePool.
    const [activeTemplate, setActiveTemplate] = useState<TemplateKey>(DEFAULT_CREATE_TEMPLATE);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeDraggedId, setActiveDraggedId] = useState<string | null>(null);

    // Case 0: Create page
    // Case 1: Edit page
    const editRankingId = searchParams.get('id');

    // Case 2: Invited to Rank page; both these params should be present
    // The id of the ranking that originated the invite
    const originRankingId = searchParams.get(ORIGIN_ID_PARAM);
    // The id of the ranking that was created for the invitee to update
    const targetRankingId = searchParams.get(TARGET_ID_PARAM);

    useEffect(() => {
        // Tracks if component is still mounted to avoid race conditions. Wrap around async result
        // usages only; basically this checks if we should use that promise or if it's out of date.
        let current = true;
        const loadRankingForEdit = async (id: string) => {
            setIsLoading(true);

            try {
                const data = await collections.rankings?.findOne({ _id: new ObjectId(id) }) as Ranking;
                if (data === null) throw new Error("Ranking data not found.");
                
                if (current) {  // Update state only if current
                    // Reconstruct the internal state ItemsState from the stored format
                    const newTierOrder: string[] = [];
                    const newContainers: { [key: string]: string[] } = {};
                    data.rankedTiers.forEach((tierItems, index) => {
                        const tierId = `tier-${Date.now() + index}`; // Generate a new unique ID
                        newTierOrder.push(tierId);
                        newContainers[tierId] = tierItems;
                    });
                    newContainers['parking-lot'] = data.unrankedItems || [];
                    setItems({ tierOrder: newTierOrder, containers: newContainers,
                        // Fields other than tierOrder and containers are the same
                        ...data });
                }
            } catch (error) {
                if (current) {
                    console.error("Failed to load ranking for editing:", error);
                    router.push('/new')
                    // navigate('/new');
                }
            } finally {
                if (current)
                    setIsLoading(false);
            }
        };

        const loadValuesFromOriginFriend = async (id: string) => {
            setIsLoading(true);
            try {
                const data = await collections.rankings?.findOne({ _id: new ObjectId(id) }) as Ranking;
                if (data === null) throw new Error("Friend's ranking data not found.");
                
                if (current) {
                    // Use the friend's ranked items as the initial unranked items
                    const allItems = data.rankedTiers.flat().concat(data.unrankedItems || []);
                    setItems({
                        // No ...prev intentionally
                        tierOrder: [],
                        containers: {
                            'parking-lot': allItems
                        },
                    });
                }
            } catch (error) {
                if (current) {
                    console.error("Failed to load friend's items:", error);
                    router.push('/new')
                    // navigate('/new');
                }
            } finally {
                if (current)
                    setIsLoading(false);
            }
        };

        if (editRankingId) {
            loadRankingForEdit(editRankingId);
        } else if (originRankingId) {
            loadValuesFromOriginFriend(originRankingId);
        } else {
            setItems(defaultInitialValues);
            setIsLoading(false);
        }
    
        return () => { current = false; }; // Cleanup function to set current to false on unmount
    }, [editRankingId, originRankingId, router]);
    
    const addNewValue = (value: string) => {
        const trimmedValue = value.trim();
        if (!trimmedValue) return;
        const allItems = Object.values(items.containers).flat();
        if (allItems.includes(trimmedValue)) {
            alert("This value already exists.");
            return;
        }
        setItems((prev) => ({
            ...prev,
            containers: {
                ...prev.containers,
                'parking-lot': [...prev.containers['parking-lot'], trimmedValue],
            }
        }));
    };
    
    function findContainer(id: UniqueIdentifier): string | undefined {
        if (id in items.containers) {
            return id as string;
        }
        return Object.keys(items.containers).find((key) => items.containers[key].includes(id as string));
    }

    function updateTemplateSelectDropdown(val: string){
        const dropdown = document.getElementById('template-select') as HTMLSelectElement;
        if (dropdown) {
            dropdown.value = val;
        }
    }

    const handleChangeTemplate = (templateKey: TemplateKey) => {
        const hasRankedItems = items.tierOrder.length > 0;

        const currentParkingLot = items.containers['parking-lot'] || [];
        const templateParkingLot = TEMPLATES[activeTemplate];
        const currentSet = new Set(currentParkingLot);
        const templateSet = new Set(templateParkingLot);
        const customItemsInParkingLot = currentSet.size !== templateSet.size || 
                               currentParkingLot.some(item => !templateSet.has(item));

        if (hasRankedItems || customItemsInParkingLot) {
            const userIsSure = window.confirm(
                "Loading a new template will clear your current ranking progress. Are you sure?"
            );
            if (!userIsSure) {
                // If user cancels, reset the dropdown to show the current active template
                updateTemplateSelectDropdown(activeTemplate);
                return; 
            }
        }
        
        setActiveTemplate(templateKey);
        setItems((prev) => ({
            ...prev,
            tierOrder: [],
            containers: {
                'parking-lot': TEMPLATES[templateKey].sort(() => 0.5 - Math.random()),
            },
        }));
    };

    // TODO: This doesn't trigger yet; needs investigation; deprioritized for now.
    const handleDeleteItem = (idToDelete: string) => {
        console.log("Deleting item 0:", idToDelete);
        setItems((prev) => {
            console.log("Deleting item 1:", idToDelete);
            // Create a copy of the containers to avoid direct mutation
            const newContainers = { ...prev.containers };
            
            // Find the container that holds the item to delete (should be 'parking-lot')
            const containerKey = findContainer(idToDelete);
            
            if (containerKey) {
                if (containerKey !== 'parking-lot') {
                    console.error("handleDeleteItem: Found non-parking-lot container.");
                    return prev;
                }
                // Filter out the deleted item from its container
                newContainers[containerKey] = newContainers[containerKey].filter(
                    (item) => item !== idToDelete
                );
                console.log('newContainers after deletion:', newContainers);
            }

            return {
                ...prev,
                containers: newContainers,
            };
        });
    };
    
    function handleDragStart(event: DragStartEvent) {
        setActiveDraggedId(event.active.id as string);
    }

    function handleDragEnd(event: DragEndEvent) {
        console.log(items);
        const { active, over } = event;
        setActiveDraggedId(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Prevent dropping a tier into the new tier zone; only items can be dropped there
        if (activeId.startsWith('tier-') && overId === 'new-tier-drop-zone') {
            return;
        }
        
        // Scenario 1: Reordering the tiers themselves
        if (activeId.startsWith('tier-') && overId.startsWith('tier-') && activeId !== overId) {
            setItems((prev) => {
                const oldIndex = prev.tierOrder.indexOf(activeId);
                const newIndex = prev.tierOrder.indexOf(overId);
                return {
                    ...prev,
                    tierOrder: arrayMove(prev.tierOrder, oldIndex, newIndex),
                };
            });
            return;
        }

        const activeContainer = findContainer(activeId);
        if (!activeContainer) return;

        // Scenario 2: Dropping an item into the "new tier" zone
        if (overId === 'new-tier-drop-zone') {
            const newTierId = `tier-${Date.now()}`;
            setItems(prev => {
                const newSourceItems = prev.containers[activeContainer].filter(id => id !== activeId);
                const newContainers = {
                    ...prev.containers,
                    [activeContainer]: newSourceItems,
                    [newTierId]: [activeId]
                };
                let newTierOrder = prev.tierOrder;

                // Clean up the source tier if it becomes empty
                if (newSourceItems.length === 0 && activeContainer !== 'parking-lot') {
                    newTierOrder = prev.tierOrder.filter(id => id !== activeContainer);
                    delete newContainers[activeContainer];
                }
                
                return {
                    ...prev,
                    tierOrder: [...newTierOrder, newTierId],
                    containers: newContainers
                };
            });
            return;
        }
        
        const overContainer = findContainer(overId);
        if (!overContainer) return;

        // Scenario 3: Moving an item
        if (activeContainer === overContainer) {
            // Reordering within the same container
            if (activeId !== overId) {
                setItems((prev) => {
                    const containerItems = prev.containers[activeContainer];
                    const oldIndex = containerItems.indexOf(activeId);
                    const newIndex = containerItems.indexOf(overId);
                    return {
                        ...prev,
                        containers: {
                            ...prev.containers,
                            [activeContainer]: arrayMove(containerItems, oldIndex, newIndex),
                        }
                    };
                });
            }
        } else {
            // Moving between different containers
            setItems((prev) => {
                const sourceItems = [...prev.containers[activeContainer]];
                const destinationItems = [...prev.containers[overContainer]];
                
                const sourceIndex = sourceItems.indexOf(activeId);
                const [movedItem] = sourceItems.splice(sourceIndex, 1);
                
                const destinationIndex = destinationItems.indexOf(overId);
                const newIndex = destinationIndex >= 0 ? destinationIndex : destinationItems.length;
                destinationItems.splice(newIndex, 0, movedItem);

                const newContainers = {
                    ...prev.containers,
                    [activeContainer]: sourceItems,
                    [overContainer]: destinationItems,
                };
                
                let newTierOrder = prev.tierOrder;

                // Clean up the source tier if it becomes empty
                if (sourceItems.length === 0 && activeContainer !== 'parking-lot') {
                    newTierOrder = prev.tierOrder.filter(id => id !== activeContainer);
                    delete newContainers[activeContainer];
                }

                return { ...prev, tierOrder: newTierOrder, containers: newContainers };
            });
        }
    }
    
    const handleFinishRanking = async () => {
        setIsSaving(true);
        try {
            const rankedTiersAsArray = items.tierOrder.map(tierId => items.containers[tierId]);
            const unrankedItems = items.containers['parking-lot'] || [];

            let response: Response;
            if (editRankingId) {
                // Editing an existing ranking.
                console.log('handleFinishRanking: items:', items);
                const dataToSave: Ranking = { 
                    rankedTiers: rankedTiersAsArray,
                    unrankedItems,
                    otherBlobIds: items.otherBlobIds,
                };
                const result = await collections.rankings?.updateOne({_id: new ObjectId(editRankingId)}, { $set: dataToSave });
                if (!result) throw new Error("Original ranking creator failed to update data.");
                // navigate(`/view?id1=${editRankingId}`);
                router.push(`/view?id1=${editRankingId}`);
            } else {
                const dataToSave: SavedRankingFormat = { 
                    rankedTiers: rankedTiersAsArray,
                    unrankedItems,
                    otherBlobIds: originRankingId ? [originRankingId] : []
                };
                if (originRankingId && targetRankingId) {
                    // TODO
                    // We're a friend updating a target ranking ID that was already created for us.
                    const result = await collections.rankings?.updateOne({_id: new ObjectId(targetRankingId)}, { $set: dataToSave });
                    // response = await fetch('https://jsonblob.com/api/jsonBlob/' + targetRankingId, {
                    //     method: 'PUT',
                    //     headers: { 'Content-Type': 'application/json' },
                    //     body: JSON.stringify(dataToSave),
                    // });

                    if (!result) throw new Error("Shared-to friend failed to update data.");
                    // navigate(`/view?id1=${targetRankingId}&id2=${originRankingId}`);
                    router.push(`/view?id1=${targetRankingId}&id2=${originRankingId}`);
                } else {
                    // Creating a new ranking.
                    response = await fetch('/api/rankings/create', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(dataToSave),
                    });

                    if (!response.ok) throw new Error("Failed to save ranking data.");

                    // const blobUrl = response.headers.get('location');
                    // if (!blobUrl) throw new Error("Could not get blob URL from response.");
                    // const newRankingId = blobUrl.substring(blobUrl.lastIndexOf('/') + 1);

                    const newRankingId = result.insertedId.toString();
                    // navigate(`/view?id1=${newRankingId}`);
                    router.push(`/view?id1=${newRankingId}`);
                }
            } 
        } catch (error) {
            console.error("Failed to finish ranking:", error);
            alert("Sorry, we couldn't save your ranking. Please try again.");
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="text-center p-10">Loading...</div>;
    }
    const isDraggingTier = activeDraggedId && activeDraggedId.startsWith('tier-');

    return (
        <div>
            <header className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-700">
                    {originRankingId ? "You've been invited!" : "Rank Anything"}
                </h1>
                <p className="text-gray-500">
                    {
                        originRankingId ?
                            "Someone wants to get to know you better. Rank these items and compare with them!"
                            : "Add your own items, rank, and invite someone else to get to know them better!"
                    }
                </p>
            </header>

            <DndContext
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ValuePool items={items.containers["parking-lot"] || []}
                        pageType={originRankingId? 'invited' : editRankingId ? 'edit' : 'create'}
                        onAddNewValue={addNewValue}
                        onChangeTemplate={handleChangeTemplate}
                        onDeleteItem={handleDeleteItem} />
                    <RankingBoard 
                        tierOrder={items.tierOrder}
                        containers={items.containers}
                    />
                </div>
                <DragOverlay>
                    {isDraggingTier ? (
                        <TierDragOverlay 
                            rank={items.tierOrder.indexOf(activeDraggedId) + 1}
                            tierItems={items.containers[activeDraggedId]} 
                        />
                    ) : activeDraggedId ? (
                        <ValueItem id={activeDraggedId} />
                    ) : null}
                </DragOverlay>
            </DndContext>

            <footer className="text-center mt-6">
                <button 
                    onClick={handleFinishRanking}
                    disabled={isSaving}
                    className="bg-green-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-green-600 transition disabled:bg-gray-400"
                >
                    {isSaving ? 'Saving...' : (originRankingId ? "See You and Your Friend's Results" : "Finish Ranking")}
                </button>
            </footer>
        </div>
    );
};

export default RankingPage;