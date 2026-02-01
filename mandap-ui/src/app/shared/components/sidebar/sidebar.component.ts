import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService, ThemeService } from '@core/services';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="fixed left-0 top-0 h-screen w-64 bg-[var(--color-sidebar)] backdrop-blur-xl border-r border-[var(--color-border)] flex flex-col z-50 transition-colors duration-300">
      <!-- Logo -->
      <div class="p-6 border-b border-[var(--color-border)]">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg shadow-teal-500/30">
            <i class="fas fa-campground text-xl text-white"></i>
          </div>
          <div>
            <h1 class="text-lg font-bold text-[var(--color-text-primary)]">ફાગણ સુદ ૧૩</h1>
            <p class="text-xs text-[var(--color-text-secondary)]">Mandap Billing</p>
          </div>
        </div>
      </div>
      
      <!-- Navigation -->
      <div class="flex-1 py-4 overflow-y-auto">
        <ul class="space-y-1 px-3">
          @for (item of navItems; track item.path) {
            @if (!item.adminOnly || authService.isAdmin()) {
              <li>
                <a 
                  [routerLink]="item.path"
                  routerLinkActive="bg-teal-600/20 text-teal-400 border-l-4 border-teal-500"
                  class="flex items-center gap-3 px-4 py-3 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-all duration-200"
                >
                  <i [class]="item.icon + ' w-5 text-center'"></i>
                  <span>{{ item.label }}</span>
                </a>
              </li>
            }
          }
        </ul>
      </div>
      
      <!-- User Info & Logout -->
      <div class="p-4 border-t border-[var(--color-border)]">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <i class="fas fa-user text-white"></i>
          </div>
          <div>
            <p class="text-sm font-medium text-[var(--color-text-primary)]">{{ authService.currentUser()?.fullName }}</p>
            <p class="text-xs text-[var(--color-text-secondary)]">{{ authService.currentUser()?.roles?.[0] }}</p>
          </div>
        </div>
        
        <div class="flex gap-2">
          <button 
            (click)="themeService.toggleTheme()"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 transition-colors"
          >
            <i [class]="themeService.theme() === 'dark' ? 'fas fa-sun' : 'fas fa-moon'"></i>
            <span>{{ themeService.theme() === 'dark' ? 'Light' : 'Dark' }}</span>
          </button>

          <button 
            (click)="authService.logout()"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <i class="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  `
})
export class SidebarComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);

  navItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'fas fa-home' },
    { path: '/customers', label: 'Customers', icon: 'fas fa-users' },
    { path: '/billing/new', label: 'New Bill', icon: 'fas fa-file-invoice-dollar' },
    { path: '/billing/history', label: 'Bill History', icon: 'fas fa-history' },
    { path: '/inventory', label: 'Inventory', icon: 'fas fa-boxes' },
    { path: '/rental-orders', label: 'Rental Orders', icon: 'fas fa-truck' },
    { path: '/users', label: 'Users', icon: 'fas fa-user-cog', adminOnly: true },
    { path: '/roles', label: 'Roles', icon: 'fas fa-shield-alt', adminOnly: true },
  ];
}

