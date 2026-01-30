import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'currencyInr',
    standalone: true
})
export class CurrencyInrPipe implements PipeTransform {
    transform(value: number | string | null | undefined, showSymbol: boolean = true): string {
        if (value === null || value === undefined) {
            return showSymbol ? '₹ 0' : '0';
        }

        const num = typeof value === 'string' ? parseFloat(value) : value;

        if (isNaN(num)) {
            return showSymbol ? '₹ 0' : '0';
        }

        const formatted = num.toLocaleString('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });

        return showSymbol ? `₹ ${formatted}` : formatted;
    }
}

