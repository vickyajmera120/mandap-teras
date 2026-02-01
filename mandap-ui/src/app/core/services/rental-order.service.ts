import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RentalOrder, RentalOrderItem } from '../models/rental-order.model';

@Injectable({
    providedIn: 'root'
})
export class RentalOrderService {
    private readonly API_URL = '/api/rental-orders';

    constructor(private http: HttpClient) { }

    getAll(): Observable<RentalOrder[]> {
        return this.http.get<RentalOrder[]>(this.API_URL);
    }

    getActive(): Observable<RentalOrder[]> {
        return this.http.get<RentalOrder[]>(`${this.API_URL}/active`);
    }

    getById(id: number): Observable<RentalOrder> {
        return this.http.get<RentalOrder>(`${this.API_URL}/${id}`);
    }

    createBooking(order: RentalOrder): Observable<RentalOrder> {
        return this.http.post<RentalOrder>(this.API_URL, order);
    }

    update(id: number, order: RentalOrder): Observable<RentalOrder> {
        return this.http.put<RentalOrder>(`${this.API_URL}/${id}`, order);
    }

    dispatchItems(orderId: number, items: RentalOrderItem[]): Observable<RentalOrder> {
        return this.http.put<RentalOrder>(`${this.API_URL}/${orderId}/dispatch`, items);
    }

    receiveItems(orderId: number, items: RentalOrderItem[]): Observable<RentalOrder> {
        return this.http.put<RentalOrder>(`${this.API_URL}/${orderId}/receive`, items);
    }

    getUnreturnedItemsByCustomer(customerId: number): Observable<RentalOrderItem[]> {
        return this.http.get<RentalOrderItem[]>(`${this.API_URL}/customer/${customerId}/unreturned`);
    }

    getUnreturnedOrdersByCustomer(customerId: number): Observable<RentalOrder[]> {
        return this.http.get<RentalOrder[]>(`${this.API_URL}/customer/${customerId}/unreturned-orders`);
    }

    cancelOrder(id: number): Observable<RentalOrder> {
        return this.http.put<RentalOrder>(`${this.API_URL}/${id}/cancel`, {});
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/${id}`);
    }
}
