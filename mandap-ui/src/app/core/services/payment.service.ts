import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Payment } from '../models/payment.model';

@Injectable({
    providedIn: 'root'
})
export class PaymentService {
    private http = inject(HttpClient);
    private apiUrl = '/api/payments';

    getPaymentsByBillId(billId: number): Observable<Payment[]> {
        return this.http.get<Payment[]>(`${this.apiUrl}/bill/${billId}`);
    }

    addPayment(payment: Payment): Observable<Payment> {
        return this.http.post<Payment>(this.apiUrl, payment);
    }

    updatePayment(id: number, payment: Payment): Observable<Payment> {
        return this.http.put<Payment>(`${this.apiUrl}/${id}`, payment);
    }

    deletePayment(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
