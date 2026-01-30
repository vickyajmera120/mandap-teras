import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (fullscreen) {
      <div class="fixed inset-0 bg-[var(--color-bg-main)]/80 backdrop-blur-sm flex items-center justify-center z-[9999]">
        <div class="text-center">
          <div class="w-16 h-16 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mx-auto"></div>
          <p class="mt-4 text-[var(--color-text-secondary)]">{{ message }}</p>
        </div>
      </div>
    } @else {
      <div class="flex items-center justify-center p-8">
        <div 
          class="border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin"
          [ngClass]="{
            'w-6 h-6': size === 'sm',
            'w-10 h-10': size === 'md',
            'w-16 h-16': size === 'lg'
          }"
        ></div>
      </div>
    }
  `
})
export class LoadingSpinnerComponent {
  @Input() fullscreen = false;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() message = 'Loading...';
}

