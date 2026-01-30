import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    theme = signal<Theme>(this.getInitialTheme());

    constructor() {
        effect(() => {
            const currentTheme = this.theme();
            document.body.classList.remove('light-theme', 'dark-theme');
            document.body.classList.add(`${currentTheme}-theme`);
            localStorage.setItem('theme', currentTheme);
        });
    }

    toggleTheme() {
        this.theme.update(t => t === 'dark' ? 'light' : 'dark');
    }

    private getInitialTheme(): Theme {
        const saved = localStorage.getItem('theme') as Theme;
        if (saved) return saved;
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
}
