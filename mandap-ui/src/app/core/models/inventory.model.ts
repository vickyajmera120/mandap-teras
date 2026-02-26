// Inventory Model

export interface InventoryItem {
    id: number;
    nameGujarati: string;
    nameEnglish: string;
    defaultRate: number;
    displayOrder: number;
    active: boolean;
    totalStock: number;
    availableStock: number;
    pendingDispatchQty?: number;
}

export interface InventoryUpdateRequest {
    nameGujarati?: string;
    nameEnglish?: string;
    defaultRate?: number;
    active?: boolean;
    totalStock?: number;
    availableStock?: number;
}
