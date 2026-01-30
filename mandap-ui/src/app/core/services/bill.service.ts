import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Bill, BillRequest, BillUpdateRequest } from '../models';

@Injectable({
    providedIn: 'root'
})
export class BillService {
    private readonly API_URL = '/api/bills';

    constructor(private http: HttpClient) { }

    getAll(): Observable<Bill[]> {
        return this.http.get<Bill[]>(this.API_URL);
    }

    getById(id: number): Observable<Bill> {
        return this.http.get<Bill>(`${this.API_URL}/${id}`);
    }

    getByNumber(billNumber: string): Observable<Bill> {
        return this.http.get<Bill>(`${this.API_URL}/number/${billNumber}`);
    }

    getByCustomer(customerId: number): Observable<Bill[]> {
        return this.http.get<Bill[]>(`${this.API_URL}/customer/${customerId}`);
    }

    getByEvent(eventId: number): Observable<Bill[]> {
        return this.http.get<Bill[]>(`${this.API_URL}/event/${eventId}`);
    }

    getByYear(year: number): Observable<Bill[]> {
        return this.http.get<Bill[]>(`${this.API_URL}/year/${year}`);
    }

    search(query: string): Observable<Bill[]> {
        return this.http.get<Bill[]>(`${this.API_URL}/search`, {
            params: { query }
        });
    }

    create(bill: BillRequest): Observable<Bill> {
        return this.http.post<Bill>(this.API_URL, bill);
    }

    update(id: number, bill: BillUpdateRequest): Observable<Bill> {
        return this.http.put<Bill>(`${this.API_URL}/${id}`, bill);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/${id}`);
    }
}
