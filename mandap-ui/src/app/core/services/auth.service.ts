import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { LoginRequest, LoginResponse } from '../models';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly API_URL = '/api/auth';

    // Signals for reactive state
    private tokenSignal = signal<string | null>(localStorage.getItem('authToken'));
    private userSignal = signal<LoginResponse | null>(
        JSON.parse(localStorage.getItem('currentUser') || 'null')
    );

    // Computed values
    isAuthenticated = computed(() => !!this.tokenSignal());
    currentUser = computed(() => this.userSignal());
    isAdmin = computed(() => this.userSignal()?.roles?.includes('ADMIN') ?? false);

    constructor(
        private http: HttpClient,
        private router: Router
    ) { }

    get token(): string | null {
        return this.tokenSignal();
    }

    login(credentials: LoginRequest): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials).pipe(
            tap(response => {
                this.tokenSignal.set(response.token);
                this.userSignal.set(response);
                localStorage.setItem('authToken', response.token);
                localStorage.setItem('currentUser', JSON.stringify(response));
            }),
            catchError(error => {
                console.error('Login failed:', error);
                return throwError(() => error);
            })
        );
    }

    logout(): void {
        this.tokenSignal.set(null);
        this.userSignal.set(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        this.router.navigate(['/login']);
    }

    hasRole(role: string): boolean {
        return this.userSignal()?.roles?.includes(role) ?? false;
    }

    hasPermission(permission: string): boolean {
        return this.userSignal()?.permissions?.includes(permission) ?? false;
    }

    getCurrentUser(): Observable<LoginResponse> {
        return this.http.get<LoginResponse>(`${this.API_URL}/me`);
    }
}
