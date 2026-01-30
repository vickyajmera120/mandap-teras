// Inventory Model
export type ItemSide = 'LEFT' | 'RIGHT';

export interface InventoryItem {
    id: number;
    nameGujarati: string;
    nameEnglish: string;
    side: ItemSide;
    defaultRate: number;
    displayOrder: number;
    active: boolean;
}

export interface InventoryUpdateRequest {
    nameGujarati?: string;
    nameEnglish?: string;
    defaultRate?: number;
    active?: boolean;
}
