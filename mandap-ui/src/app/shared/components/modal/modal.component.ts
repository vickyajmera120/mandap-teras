import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div 
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          (click)="onClose()"
        ></div>
        
        <!-- Modal Content -->
        <div 
          class="relative w-full bg-[var(--color-bg-card)] backdrop-blur-xl rounded-2xl border border-[var(--color-border)] shadow-2xl animate-fade-in"
          [ngClass]="{
            'max-w-md': size === 'sm',
            'max-w-lg': size === 'md',
            'max-w-2xl': size === 'lg',
            'max-w-4xl': size === 'xl'
          }"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
            <h3 class="text-lg font-semibold text-[var(--color-text-primary)]">{{ title }}</h3>
            <button 
              (click)="onClose()"
              class="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <!-- Body -->
          <div class="p-6 max-h-[70vh] overflow-y-auto">
            <ng-content></ng-content>
          </div>
        </div>
      </div>
    }
  `
})
export class ModalComponent {
  @Input() title = 'Modal';
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Output() closed = new EventEmitter<void>();

  isOpen = signal(false);

  open(): void {
    this.isOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  close(): void {
    this.isOpen.set(false);
    document.body.style.overflow = '';
    this.closed.emit();
  }

  onClose(): void {
    this.close();
  }
}

