"use client"; 

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SharePopup from '@/components/SharePopup';
import { ORIGIN_ID_PARAM, TARGET_ID_PARAM } from '@/lib/ParamConstants';
import { updateRankingWithConfirmation } from '@/lib/rankingApi';
import Ranking from '@/models/Ranking';
import { Suspense } from 'react'
import { getTopicDisplayName } from '@/lib/ItemTemplates';

const RankingDisplay = ({ title, ranking }: { title: string, ranking: Ranking | null }) => {
    if (!ranking) return <div>Loading {title}...</div>;

    const { rankedTiers, unrankedItems } = ranking;

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">{title}</h2>
            <div className="space-y-6">
                {(!rankedTiers || rankedTiers.length === 0) && (
                    <div className="text-gray-500 italic">No ranked items yet. Check back later!</div>
                )}
                {rankedTiers?.length > 0 && (
                    <div>
                        <h3 className="text-xl font-bold mb-3 text-gray-700">Ranked</h3>
                        <div className="space-y-3">
                            {/* Map directly over the array, the order is guaranteed! */}
                            {rankedTiers.map((tierItems, index) => (
                                <div key={index} className="flex items-start">
                                    <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-gray-200 rounded-full font-bold text-gray-600 mr-4">{index + 1}</div>
                                    <div className="flex flex-wrap gap-2">
                                        {tierItems.map(item => <span key={item} className="bg-blue-100 text-blue-800 px-3 py-1 text-sm font-medium rounded-full">{item}</span>)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {unrankedItems?.length > 0 && (
                    <div>
                        <h3 className="text-xl font-bold mb-3 text-gray-700">Unranked</h3>
                        <div className="flex flex-wrap gap-2">
                            {unrankedItems.map(item => <span key={item} className="bg-gray-100 text-gray-700 px-3 py-1 text-sm font-medium rounded-full">{item}</span>)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const SummaryView: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [ranking1, setRanking1] = useState<Ranking | null>(null);
    const [ranking2, setRanking2] = useState<Ranking | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showPopup, setShowPopup] = useState(false);
    const [shareableLink, setShareableLink] = useState('');

    const id1 = searchParams.get('id1');
    const id2 = searchParams.get('id2');

    useEffect(() => {
        const fetchRanking = async (id: string | null): Promise<Ranking | null> => {
            if (!id) return null;
            try {
                const response = await fetch(`/api/rankings/${id}`);
                if (!response.ok) throw new Error("Ranking not found");
                return await response.json();
            } catch (error) {
                console.error(`Failed to fetch ranking for id ${id}:`, error);
                return null;
            }
        };

        const loadData = async () => {
            setIsLoading(true);
            const [data1, data2] = await Promise.all([fetchRanking(id1), fetchRanking(id2)]);
            setRanking1(data1);
            if (id2) setRanking2(data2);
            setIsLoading(false);
        };

        loadData();
    }, [id1, id2]);

    const handleQuizFriend = async () => {
        if (!id1) return;

        // 0. Update our db entry to include a new friend id, which
        // points to an entry that the shared-to friend will update.
        let friendRankingId: string;
        try {
            // Create other entry that friend will fill out.
            const response = await fetch('/api/rankings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            if (!response.ok) throw new Error("Failed to save ranking data.");

            const responseData = await response.json();
            friendRankingId = responseData.insertedId;

            // Update our own entry to include the new friend id.
            if (!ranking1) throw new Error("Current ranking data is missing.");
            ranking1.otherBlobIds = [friendRankingId];  // Overwrite any existing one for simplicity
            setRanking1(ranking1);
            
            // Skip confirmation since we're only updating metadata, not ranks.
            const updateOwnEntryResponse = await updateRankingWithConfirmation(id1, ranking1, { skipConfirmation: true });
            if (!updateOwnEntryResponse || !updateOwnEntryResponse.ok) {
                throw new Error(`Failed to update own entry with metadata pointing to new entry for other friend to fill out. Response: ${updateOwnEntryResponse}`);
            }
        } catch (error) {
            console.error(`Failed to prepare new ranking for friend:`, error);
            return null;
        }

        // 1. Construct the quiz link using the current URL origin, the current ranking id as the friend id param,
        // and the friendRankingId.
        if (!friendRankingId) throw new Error("friendRankingId is null");
        const quizLink = `${window.location.origin}/rankings/new?${ORIGIN_ID_PARAM}=${id1}&${TARGET_ID_PARAM}=${friendRankingId}`;
        setShareableLink(quizLink);

        // 2. Copy the link to the clipboard
        navigator.clipboard.writeText(quizLink).then(() => {
            setShowPopup(true);
        }).catch(err => {
            console.error('Failed to copy link: ', err);
            alert('Failed to copy link to clipboard.');
        });
    };

    const handleGetSharedLink = () => {
        const friendRankingId = ranking1?.otherBlobIds?.[0];
        if (!friendRankingId) throw new Error("No friend ranking ID found even though we should have already generated a shared link; cannot reconstruct shared link")
        if (!id1) throw new Error("id1 is null; cannot reconstruct shared link");

        const quizLink = `${window.location.origin}/rankings/new?${ORIGIN_ID_PARAM}=${id1}&${TARGET_ID_PARAM}=${friendRankingId}`;
        setShareableLink(quizLink);
        navigator.clipboard.writeText(quizLink).then(() => {
            setShowPopup(true);
        }).catch(err => {
            console.error('Failed to copy link: ', err);
            alert('Failed to copy link to clipboard.');
        });
    }

    const handleViewSharedResults = () => {
        router.push(`/rankings/view?id1=${id1}&id2=${ranking1?.otherBlobIds?.[0]}`)
    };
    
    if (isLoading) {
        return <div className="min-h-screen flex justify-center">Loading view...</div>;
    }
    
    if (!ranking1) {
         return <div className="min-h-screen flex justify-center">Could not load ranking data. The link may be invalid.</div>;
    }

    return (
        <div>
            {showPopup && <SharePopup shareableLink={shareableLink} onClose={() => setShowPopup(false)} />}
            
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-3xl mx-auto">
                <header className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">
                        {ranking1.topic ? getTopicDisplayName(ranking1.topic) : "Results"}
                    </h1>
                </header>

                {/* Main Content Area */}
                <div className={ranking2 ? "grid grid-cols-1 md:grid-cols-2 gap-8" : "grid grid-cols-1 justify-items-center"}>
                    <RankingDisplay title="You" ranking={ranking1} />
                    {ranking2 ? <RankingDisplay title="Them" ranking={ranking2} /> : ""}
                </div>
                
                {/* Action Buttons */}
                <div className="mt-8 text-center space-y-3 border-t pt-6">
                    {!id2 && (
                        <>
                            <Link 
                                href={`/rankings/edit?id=${id1}`}
                                className="text-gray-500 hover:text-gray-800 text-sm font-medium transition inline-block"
                            >
                                Edit Your Ranking
                            </Link>
                            { (ranking1.otherBlobIds?.length ?? 0) === 0 && (
                                <button 
                                    onClick={handleQuizFriend}
                                    className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 transition"
                                >
                                    Ask Friend to Rank
                                </button>
                            )}
                            { (ranking1.otherBlobIds?.length ?? 0) > 0 && (
                                <>
                                    <button 
                                        onClick={handleGetSharedLink}
                                        className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 transition"
                                    >
                                        Get Shared Link
                                    </button>
                                    <button 
                                        onClick={handleViewSharedResults}
                                        className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 transition"
                                    >
                                        View Shared Results
                                    </button>
                                </>
                            )}
                        </>
                    )}
                    {id2 && (
                        <Link 
                            href={`/rankings/new`}
                            className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-green-600 transition inline-block"
                        >
                            Create New Ranking
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function SummaryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SummaryView />
    </Suspense>
  );
}