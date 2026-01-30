import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    message: string;
    type: ToastType;
    id: number;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private counter = 0;
    toasts = signal<Toast[]>([]);

    show(message: string, type: ToastType = 'info', duration: number = 3000): void {
        const id = ++this.counter;
        const toast: Toast = { message, type, id };

        this.toasts.update(toasts => [...toasts, toast]);

        setTimeout(() => {
            this.remove(id);
        }, duration);
    }

    success(message: string, duration?: number): void {
        this.show(message, 'success', duration);
    }

    error(message: string, duration?: number): void {
        this.show(message, 'error', duration);
    }

    warning(message: string, duration?: number): void {
        this.show(message, 'warning', duration);
    }

    info(message: string, duration?: number): void {
        this.show(message, 'info', duration);
    }

    remove(id: number): void {
        this.toasts.update(toasts => toasts.filter(t => t.id !== id));
    }
}
