import { ObjectId } from "mongodb";

export default class Ranking {
    constructor(public rankedTiers: string[][], public unrankedItems: string[], public otherBlobIds?: string[], public _id?: ObjectId) {}
}