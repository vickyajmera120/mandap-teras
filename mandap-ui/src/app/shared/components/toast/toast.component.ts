import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '@core/services';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
      @for (toast of toastService.toasts(); track toast.id) {
        <div 
          class="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-slide-in-right min-w-[300px]"
          [ngClass]="{
            'bg-green-600': toast.type === 'success',
            'bg-red-600': toast.type === 'error',
            'bg-orange-500': toast.type === 'warning',
            'bg-blue-600': toast.type === 'info'
          }"
        >
          <i [ngClass]="{
            'fas fa-check-circle': toast.type === 'success',
            'fas fa-times-circle': toast.type === 'error',
            'fas fa-exclamation-triangle': toast.type === 'warning',
            'fas fa-info-circle': toast.type === 'info'
          }" class="text-white text-lg"></i>
          <span class="flex-1 text-white text-sm">{{ toast.message }}</span>
          <button 
            (click)="toastService.remove(toast.id)"
            class="text-white/70 hover:text-white transition-colors"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastComponent {
  toastService = inject(ToastService);
}

