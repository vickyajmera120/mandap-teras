import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService, ThemeService, LayoutService } from '@core/services';

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
    <nav 
      class="fixed left-0 top-0 h-screen bg-[var(--color-sidebar)] backdrop-blur-xl border-r border-[var(--color-border)] flex flex-col z-50 transition-all duration-300"
      [class.w-64]="!layoutService.isSidebarCollapsed()"
      [class.w-20]="layoutService.isSidebarCollapsed()"
    >
      <!-- Logo & Toggle -->
      <div class="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
        <div class="flex items-center gap-3 overflow-hidden whitespace-nowrap">
          <div class="min-w-[3rem] w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg shadow-teal-500/30">
            <i class="fas fa-campground text-xl text-white"></i>
          </div>
          <div [class.opacity-0]="layoutService.isSidebarCollapsed()" [class.hidden]="layoutService.isSidebarCollapsed()" class="transition-opacity duration-200">
            <h1 class="text-lg font-bold text-[var(--color-text-primary)]">ફાગણ સુદ ૧૩</h1>
            <p class="text-xs text-[var(--color-text-secondary)]">Mandap Billing</p>
          </div>
        </div>
        
        <button 
          (click)="layoutService.toggleSidebar()"
          class="absolute -right-3 top-8 w-6 h-6 rounded-full bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-teal-500 flex items-center justify-center shadow-sm z-50"
        >
          <i [class]="layoutService.isSidebarCollapsed() ? 'fas fa-chevron-right' : 'fas fa-chevron-left'" class="text-xs"></i>
        </button>
      </div>
      
      <!-- Navigation -->
      <div class="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        <ul class="space-y-1 px-3">
          @for (item of navItems; track item.path) {
            @if (!item.adminOnly || authService.isAdmin()) {
              <li>
                <a 
                  [routerLink]="item.path"
                  routerLinkActive="bg-teal-600/20 text-teal-400 border-l-4 border-teal-500"
                  class="flex items-center gap-3 px-4 py-3 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-all duration-200 whitespace-nowrap group relative"
                  [title]="layoutService.isSidebarCollapsed() ? item.label : ''"
                >
                  <i [class]="item.icon + ' w-5 text-center min-w-[1.25rem]'"></i>
                  <span 
                    [class.opacity-0]="layoutService.isSidebarCollapsed()" 
                    [class.w-0]="layoutService.isSidebarCollapsed()"
                    class="transition-all duration-200 overflow-hidden"
                  >
                    {{ item.label }}
                  </span>
                  
                  <!-- Tooltip for collapsed state -->
                  @if (layoutService.isSidebarCollapsed()) {
                    <div class="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                      {{ item.label }}
                    </div>
                  }
                </a>
              </li>
            }
          }
        </ul>
      </div>
      
      <!-- User Info & Logout -->
      <div class="p-4 border-t border-[var(--color-border)] overflow-hidden">
        <div class="flex items-center gap-3 mb-3 whitespace-nowrap">
          <div class="min-w-[2.5rem] w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <i class="fas fa-user text-white"></i>
          </div>
          <div [class.opacity-0]="layoutService.isSidebarCollapsed()" [class.hidden]="layoutService.isSidebarCollapsed()" class="transition-opacity duration-200">
            <p class="text-sm font-medium text-[var(--color-text-primary)]">{{ authService.currentUser()?.fullName }}</p>
            <p class="text-xs text-[var(--color-text-secondary)]">{{ authService.currentUser()?.roles?.[0] }}</p>
          </div>
        </div>
        
        <div class="flex flex-col gap-2">
          <button 
            (click)="themeService.toggleTheme()"
            class="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 transition-colors whitespace-nowrap justify-center"
            [title]="layoutService.isSidebarCollapsed() ? (themeService.theme() === 'dark' ? 'Light' : 'Dark') : ''"
          >
            <i [class]="themeService.theme() === 'dark' ? 'fas fa-sun' : 'fas fa-moon'"></i>
            <span [class.hidden]="layoutService.isSidebarCollapsed()">{{ themeService.theme() === 'dark' ? 'Light' : 'Dark' }}</span>
          </button>

          <button 
            (click)="authService.logout()"
            class="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors whitespace-nowrap justify-center"
            [title]="layoutService.isSidebarCollapsed() ? 'Logout' : ''"
          >
            <i class="fas fa-sign-out-alt"></i>
            <span [class.hidden]="layoutService.isSidebarCollapsed()">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  `
})
export class SidebarComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  layoutService = inject(LayoutService);

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

