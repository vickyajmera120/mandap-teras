import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Event, EventRequest, EventType } from '../models';

@Injectable({
    providedIn: 'root'
})
export class EventService {
    private readonly API_URL = '/api/events';

    constructor(private http: HttpClient) { }

    getAll(): Observable<Event[]> {
        return this.http.get<Event[]>(this.API_URL);
    }

    getById(id: number): Observable<Event> {
        return this.http.get<Event>(`${this.API_URL}/${id}`);
    }

    getByYear(year: number): Observable<Event[]> {
        return this.http.get<Event[]>(`${this.API_URL}/year/${year}`);
    }

    getByType(type: EventType): Observable<Event[]> {
        return this.http.get<Event[]>(`${this.API_URL}/type/${type}`);
    }

    getYears(): Observable<number[]> {
        return this.http.get<number[]>(`${this.API_URL}/years`);
    }

    create(event: EventRequest): Observable<Event> {
        return this.http.post<Event>(this.API_URL, event);
    }

    update(id: number, event: EventRequest): Observable<Event> {
        return this.http.put<Event>(`${this.API_URL}/${id}`, event);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/${id}`);
    }
}
