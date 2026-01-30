import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const toastService = inject(ToastService);
    const injector = inject(Injector);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMessage = 'An error occurred';

            if (error.status === 401) {
                // Unauthorized - redirect to login
                const authService = injector.get(AuthService);
                authService.logout();
                errorMessage = 'Session expired. Please login again.';
            } else if (error.status === 403) {
                errorMessage = 'You do not have permission to perform this action.';
            } else if (error.status === 404) {
                errorMessage = 'Resource not found.';
            } else if (error.status === 0) {
                errorMessage = 'Unable to connect to server.';
            } else if (error.error?.message) {
                errorMessage = error.error.message;
            }

            toastService.error(errorMessage);
            return throwError(() => error);
        })
    );
};
