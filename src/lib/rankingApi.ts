import Ranking from "@/models/Ranking";

/**
 * Updates a ranking by ID, with confirmation if there are existing ranked items.
 * 
 * @param id - The ranking ID to update
 * @param data - The data to save
 * @param options - Optional settings
 * @param options.skipConfirmation - If true, skips the confirmation dialog (useful for metadata-only updates)
 * @returns The fetch Response, or null if user cancelled
 */
export async function updateRankingWithConfirmation(
    id: string,
    data: Ranking | object,
    options?: { skipConfirmation?: boolean }
): Promise<Response | null> {
    const { skipConfirmation = false } = options || {};

    if (!skipConfirmation) {
        try {
            const existingResponse = await fetch(`/api/rankings/${id}`);
            if (existingResponse.ok) {
                const existingRanking: Ranking = await existingResponse.json();
                
                const hasExistingRankedItems = 
                    existingRanking.rankedTiers && 
                    Array.isArray(existingRanking.rankedTiers) && 
                    existingRanking.rankedTiers.length > 0;

                if (hasExistingRankedItems) {
                    const userConfirmed = window.confirm(
                        "This ranking already has ranked items. Are you sure you want to overwrite them?"
                    );
                    if (!userConfirmed) {
                        return null; // User cancelled
                    }
                }
            }
            // If GET fails (404, etc.), proceed with PUT anyway - it will handle errors
        } catch (error) {
            console.error("Failed to check existing ranking:", error);
            // Proceed with PUT anyway
        }
    }

    return fetch(`/api/rankings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

