import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <!-- Decorative Background -->
      <div class="fixed inset-0 pointer-events-none overflow-hidden">
        <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/10 rounded-full blur-3xl"></div>
      </div>
      
      <router-outlet></router-outlet>
      
      <!-- Toast Notifications -->
      <app-toast></app-toast>
    </div>
  `
})
export class AuthLayoutComponent { }

