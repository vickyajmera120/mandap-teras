import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '@shared/components/sidebar/sidebar.component';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, ToastComponent],
  template: `
    <div class="min-h-screen bg-[var(--color-bg-main)] transition-colors duration-300">
      <!-- Decorative Background -->
      <div class="fixed inset-0 pointer-events-none dark-theme-only">
        <div class="absolute top-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
        <div class="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>
      
      <!-- Sidebar -->
      <app-sidebar></app-sidebar>
      
      <!-- Main Content -->
      <main class="ml-64 min-h-screen relative">
        <div class="p-8">
          <router-outlet></router-outlet>
        </div>
      </main>
      
      <!-- Toast Notifications -->
      <app-toast></app-toast>
    </div>
  `
})
export class MainLayoutComponent { }

