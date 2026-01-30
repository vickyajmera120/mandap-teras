import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';


export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = localStorage.getItem('authToken');

    // Skip auth header for login endpoint
    if (req.url.includes('/auth/login')) {
        return next(req);
    }

    if (token) {
        console.log('AuthInterceptor: Attaching token', token.substring(0, 10) + '...');
        const authReq = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${token}`)
        });
        return next(authReq);
    } else {
        console.log('AuthInterceptor: No token found in localStorage');
    }

    return next(req);
};
