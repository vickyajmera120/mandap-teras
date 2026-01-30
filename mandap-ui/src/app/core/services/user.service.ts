import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, UserRequest } from '../models';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private readonly API_URL = '/api/users';

    constructor(private http: HttpClient) { }

    getAll(): Observable<User[]> {
        return this.http.get<User[]>(this.API_URL);
    }

    getById(id: number): Observable<User> {
        return this.http.get<User>(`${this.API_URL}/${id}`);
    }

    create(user: UserRequest): Observable<User> {
        return this.http.post<User>(this.API_URL, user);
    }

    update(id: number, user: UserRequest): Observable<User> {
        return this.http.put<User>(`${this.API_URL}/${id}`, user);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/${id}`);
    }
}
