import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InventoryItem, InventoryUpdateRequest, ItemSide } from '../models';

@Injectable({
    providedIn: 'root'
})
export class InventoryService {
    private readonly API_URL = '/api/inventory';

    constructor(private http: HttpClient) { }

    getAll(): Observable<InventoryItem[]> {
        return this.http.get<InventoryItem[]>(this.API_URL);
    }

    getBySide(side: ItemSide): Observable<InventoryItem[]> {
        return this.http.get<InventoryItem[]>(`${this.API_URL}/side/${side}`);
    }

    getById(id: number): Observable<InventoryItem> {
        return this.http.get<InventoryItem>(`${this.API_URL}/${id}`);
    }

    update(id: number, item: InventoryUpdateRequest): Observable<InventoryItem> {
        return this.http.put<InventoryItem>(`${this.API_URL}/${id}`, item);
    }

    create(item: any): Observable<InventoryItem> {
        return this.http.post<InventoryItem>(this.API_URL, item);
    }

    reorder(itemIds: number[]): Observable<void> {
        return this.http.post<void>(`${this.API_URL}/reorder`, itemIds);
    }

    search(query: string): Observable<InventoryItem[]> {
        return this.http.get<InventoryItem[]>(`${this.API_URL}/search`, { params: { q: query } });
    }

    getItemUsage(id: number): Observable<ItemUsage[]> {
        return this.http.get<ItemUsage[]>(`${this.API_URL}/${id}/usage`);
    }
}

export interface ItemUsage {
    customerId: number;
    customerName: string;
    orderNumber: string;
    bookedQty: number;
    dispatchedQty: number;
    returnedQty: number;
    pendingDispatchQty: number;
    pendingReturnQty: number;
}
