import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
    // Default redirect
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },

    // Auth routes (no guard)
    {
        path: 'login',
        loadComponent: () => import('./layouts/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
        children: [
            {
                path: '',
                loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
            }
        ]
    },

    // Protected routes
    {
        path: '',
        loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
        canActivate: [authGuard],
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
            },
            {
                path: 'customers',
                loadComponent: () => import('./features/customers/customers.component').then(m => m.CustomersComponent)
            },
            {
                path: 'events',
                loadComponent: () => import('./features/events/events.component').then(m => m.EventsComponent)
            },
            {
                path: 'billing',
                children: [
                    { path: '', redirectTo: 'new', pathMatch: 'full' },
                    {
                        path: 'new',
                        loadComponent: () => import('./features/billing/new-bill/new-bill.component').then(m => m.NewBillComponent)
                    },
                    {
                        path: 'edit/:id',
                        loadComponent: () => import('./features/billing/new-bill/new-bill.component').then(m => m.NewBillComponent)
                    },
                    {
                        path: 'history',
                        loadComponent: () => import('./features/billing/bill-history/bill-history.component').then(m => m.BillHistoryComponent)
                    }
                ]
            },
            {
                path: 'inventory',
                loadComponent: () => import('./features/inventory/inventory.component').then(m => m.InventoryComponent)
            },
            {
                path: 'users',
                canActivate: [adminGuard],
                loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent)
            },
            {
                path: 'roles',
                canActivate: [adminGuard],
                loadComponent: () => import('./features/roles/roles.component').then(m => m.RolesComponent)
            }
        ]
    },

    // Fallback
    { path: '**', redirectTo: '/dashboard' }
];
