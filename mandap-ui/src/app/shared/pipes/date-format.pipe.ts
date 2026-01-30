import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'dateFormat',
    standalone: true
})
export class DateFormatPipe implements PipeTransform {
    transform(value: string | Date | null | undefined, format: 'short' | 'long' = 'short'): string {
        if (!value) {
            return '-';
        }

        const date = typeof value === 'string' ? new Date(value) : value;

        if (isNaN(date.getTime())) {
            return '-';
        }

        if (format === 'long') {
            return date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
        }

        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
}

