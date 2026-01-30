import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Role, RoleRequest, Permission } from '../models';

@Injectable({
    providedIn: 'root'
})
export class RoleService {
    private readonly API_URL = '/api/roles';

    constructor(private http: HttpClient) { }

    getAll(): Observable<Role[]> {
        return this.http.get<Role[]>(this.API_URL);
    }

    getById(id: number): Observable<Role> {
        return this.http.get<Role>(`${this.API_URL}/${id}`);
    }

    getPermissions(): Observable<Permission[]> {
        return this.http.get<Permission[]>(`${this.API_URL}/permissions`);
    }

    create(role: RoleRequest): Observable<Role> {
        return this.http.post<Role>(this.API_URL, role);
    }

    update(id: number, role: RoleRequest): Observable<Role> {
        return this.http.put<Role>(`${this.API_URL}/${id}`, role);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/${id}`);
    }
}
