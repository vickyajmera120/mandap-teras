import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-status-badge',
    standalone: true,
    imports: [CommonModule],
    template: `
    <span 
      class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide"
      [ngClass]="badgeClass"
    >
      {{ label || value }}
    </span>
  `
})
export class StatusBadgeComponent {
    @Input() value: string = '';
    @Input() label?: string;
    @Input() type: 'success' | 'danger' | 'warning' | 'info' | 'default' = 'default';

    get badgeClass(): string {
        const classes: Record<string, string> = {
            'success': 'bg-green-500/20 text-green-400',
            'danger': 'bg-red-500/20 text-red-400',
            'warning': 'bg-yellow-500/20 text-yellow-400',
            'info': 'bg-blue-500/20 text-blue-400',
            'default': 'bg-slate-500/20 text-slate-400'
        };

        // Auto-detect type from value if not specified
        if (this.type === 'default') {
            const statusMap: Record<string, string> = {
                'PAID': 'success',
                'DUE': 'danger',
                'PARTIAL': 'warning',
                'INVOICE': 'info',
                'ESTIMATE': 'warning',
                'ACTIVE': 'success',
                'INACTIVE': 'danger'
            };
            return classes[statusMap[this.value?.toUpperCase()] || 'default'];
        }

        return classes[this.type];
    }
}

