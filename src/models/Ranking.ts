import { TemplateKey } from "../lib/ItemTemplates";

export default class Ranking {
    constructor(public topic: TemplateKey, public rankedTiers: string[][], public unrankedItems: string[], public otherBlobIds?: string[]) {}
}