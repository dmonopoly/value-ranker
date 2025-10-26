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
import { TemplateKey, getTemplateItems } from '@/lib/ItemTemplates';
import Ranking from "@/models/Ranking";
import { Suspense } from 'react'

// Internal state structure for quick JS manipulations before writing to models/Ranking.
type ItemsState = {
    topic: TemplateKey;
    // Stores key "parking-lot" for unranked items and "tier-<id>" for ranked tiers
    // where <id> is a unique number
    containers: {
        [key: string]: string[];
    };
    // Stores the "tier-<id>" keys in the ranked order
    tierOrder: string[];
    otherBlobIds?: string[];
};

const DEFAULT_CREATE_TEMPLATE: TemplateKey = 'cuisines';

const defaultInitialValues: ItemsState = {
    topic: DEFAULT_CREATE_TEMPLATE,
    containers: {
        "parking-lot": [...getTemplateItems(DEFAULT_CREATE_TEMPLATE)],
    },
    tierOrder: [],
};
const RankingView: React.FC = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const [items, setItems] = useState<ItemsState>(defaultInitialValues);
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
        // usages only; this checks if we should use that promise or if it's out of date.
        let isComponentMounted = true;
        const loadRankingForEdit = async (id: string) => {
            setIsLoading(true);

            try {
                const response = await fetch(`/api/rankings/${id}`);
                if (!response.ok) {
                    throw new Error(`Ranking data not found for id: ${id}. Status: ${response.status}`);
                }
                const data: Ranking = await response.json();

                if (data === null) throw new Error("Ranking data not found.");
                
                if (isComponentMounted) {
                    // Reconstruct the internal state ItemsState from the stored format
                    const newTierOrder: string[] = [];
                    const newContainers: { [key: string]: string[] } = {};
                    data.rankedTiers.forEach((tierItems, index) => {
                        const tierId = `tier-${Date.now() + index}`; // Generate a new unique ID
                        newTierOrder.push(tierId);
                        newContainers[tierId] = tierItems;
                    });
                    newContainers['parking-lot'] = data.unrankedItems || [];
                    console.log('loading edit with ', data);
                    setItems({
                        ...data,  // Keep otherBlobIds, auto-get future fields
                        topic: data.topic || DEFAULT_CREATE_TEMPLATE,
                        tierOrder: newTierOrder,
                        containers: newContainers,
                    });
                }
            } catch (error) {
                if (isComponentMounted) {
                    console.error("Failed to load ranking for editing:", error);
                    router.push('/rankings/new')
                }
            } finally {
                if (isComponentMounted)
                    setIsLoading(false);
            }
        };

        const loadValuesFromOriginFriend = async (id: string) => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/rankings/${id}`);
                if (!response.ok) {
                    throw new Error(`Friend's ranking data not found for id: ${id}. Status: ${response.status}`);
                }
                const data: Ranking = await response.json();
                if (data === null) throw new Error("Friend's ranking data not found.");
                
                if (isComponentMounted) {
                    // Use the friend's ranked items as the initial unranked items
                    const allItems = data.rankedTiers.flat().concat(data.unrankedItems || []);
                    setItems({
                        // No ...prev: Do not want origin friend's otherBlobIds, which is yourself
                        topic: data.topic,
                        tierOrder: [],
                        containers: {
                            'parking-lot': allItems
                        },
                    });
                }
            } catch (error) {
                if (isComponentMounted) {
                    console.error("Failed to load friend's items:", error);
                    router.push('/rankings/new')
                }
            } finally {
                if (isComponentMounted)
                    setIsLoading(false);
            }
        };

        if (editRankingId) {
            loadRankingForEdit(editRankingId);
        } else if (originRankingId) {
            loadValuesFromOriginFriend(originRankingId);
        } else {
            setIsLoading(false);
        }
    
        return () => { isComponentMounted = false; }; // Cleanup function to indicate we have unmounted
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

    const handleChangeTemplate = (templateKey: string) => {
        const hasRankedItems = items.tierOrder.length > 0;

        const currentParkingLot = items.containers['parking-lot'] || [];
        const templateParkingLot = getTemplateItems(items.topic);
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
                return; 
            }
        }
        
        const newTemplate = templateKey as TemplateKey;
        setItems((prev) => ({
            ...prev,
            topic: newTemplate,
            containers: {
                'parking-lot': getTemplateItems(newTemplate).sort(() => 0.5 - Math.random()),
            },
            tierOrder: [],
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

            const dataToSave: Ranking = {
                topic: items.topic,
                rankedTiers: rankedTiersAsArray,
                unrankedItems,
                otherBlobIds: items.otherBlobIds || [], // Ensure this is initialized
            };

            let response: Response;
            if (editRankingId) {
                // Editing an existing ranking.
                console.log('Editing ranking with items: ', items);
                response = await fetch(`/api/rankings/${editRankingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataToSave),
                });

                if (!response.ok) {
                    throw new Error(`Failed to update ranking. Status: ${response.status}`);
                }

                router.push(`/rankings/view?id1=${editRankingId}`);
            } else {
                if (originRankingId && targetRankingId) {
                    // We're a friend updating a target ranking ID that was already created for us.
                    console.log(`Invited friend is submitting to target: ${targetRankingId}`);

                    // The friend's ranking should link back to the person who invited them.
                    dataToSave.otherBlobIds = [originRankingId];

                    response = await fetch(`/api/rankings/${targetRankingId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(dataToSave),
                    });

                    if (!response.ok) {
                        const errorMsg = 'Friend failed to update ranking';
                        console.error(errorMsg, response);
                        throw new Error(errorMsg);
                    }

                    router.push(`/rankings/view?id1=${targetRankingId}&id2=${originRankingId}`);
                } else {
                    // Create a new ranking.
                    response = await fetch('/api/rankings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(dataToSave),
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to create new ranking. Status: ${response.status}`);
                    }

                    // Extract the new ID from the server's response.
                    const { insertedId } = await response.json();
                    if (!insertedId) {
                        throw new Error("API did not return an insertedId.");
                    }

                    router.push(`/rankings/view?id1=${insertedId}`);
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
        <Suspense fallback={<div>Loading...</div>}>
        <div>
            <header className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-700">
                    {originRankingId ? "You've been invited!" : "Rank Anything"}
                </h1>
                <p className="text-gray-500">
                    {
                        originRankingId ?
                            "Rank these items and compare with them!"
                            : "Choose a topic or make your own, rank, and compare with a friend!"
                    }
                </p>
            </header>

            <DndContext
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ValuePool
                        topic={items.topic}
                        items={items.containers["parking-lot"] || []}
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
        </Suspense>
    );
};

export default function RankingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RankingView />
    </Suspense>
  );
}