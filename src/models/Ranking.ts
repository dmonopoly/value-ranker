export default class Ranking {
    constructor(public topic: string, public rankedTiers: string[][], public unrankedItems: string[], public otherBlobIds?: string[]) {}
}