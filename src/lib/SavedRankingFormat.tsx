/**
 * Deprecated: SavedRankingFormat is the JSON Blob data format for a user's ranking.
 */
export type SavedRankingFormat = {
    rankedTiers: string[][];
    unrankedItems: string[];

    // Array of JSON Blob ids of other rankings to compare with.
    otherBlobIds?: string[];
};