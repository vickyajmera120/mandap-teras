import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Customer, CustomerRequest } from '../models';

@Injectable({
    providedIn: 'root'
})
export class CustomerService {
    private readonly API_URL = '/api/customers';

    constructor(private http: HttpClient) { }

    getAll(): Observable<Customer[]> {
        return this.http.get<Customer[]>(this.API_URL);
    }

    getById(id: number): Observable<Customer> {
        return this.http.get<Customer>(`${this.API_URL}/${id}`);
    }

    search(query: string): Observable<Customer[]> {
        return this.http.get<Customer[]>(`${this.API_URL}/search`, {
            params: { query }
        });
    }

    create(customer: CustomerRequest): Observable<Customer> {
        return this.http.post<Customer>(this.API_URL, customer);
    }

    update(id: number, customer: CustomerRequest): Observable<Customer> {
        return this.http.put<Customer>(`${this.API_URL}/${id}`, customer);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/${id}`);
    }

    getAuditHistory(id: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.API_URL}/${id}/audit`);
    }
}
