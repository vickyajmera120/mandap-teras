import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService, ToastService } from '@core/services';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="relative w-full max-w-md animate-fade-in">
      <!-- Login Card -->
      <div class="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl p-8">
        <!-- Logo & Header -->
        <div class="text-center mb-8">
          <div class="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg shadow-teal-500/30">
            <i class="fas fa-campground text-3xl text-white"></i>
          </div>
          <h1 class="text-3xl font-bold bg-gradient-to-r from-teal-400 to-yellow-400 bg-clip-text text-transparent">
            ફાગણ સુદ ૧૩
          </h1>
          <p class="text-slate-400 mt-2">Mandap Billing System</p>
        </div>
        
        <!-- Login Form -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="space-y-5">
            <!-- Username -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">
                <i class="fas fa-user mr-2 text-slate-400"></i>Username
              </label>
              <input 
                type="text"
                formControlName="username"
                class="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                placeholder="Enter your username"
              >
              @if (loginForm.get('username')?.touched && loginForm.get('username')?.errors?.['required']) {
                <p class="mt-1 text-sm text-red-400">Username is required</p>
              }
            </div>
            
            <!-- Password -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">
                <i class="fas fa-lock mr-2 text-slate-400"></i>Password
              </label>
              <div class="relative">
                <input 
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  class="w-full px-4 py-3 pr-12 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                  placeholder="Enter your password"
                >
                <button 
                  type="button"
                  (click)="showPassword.set(!showPassword())"
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  <i [class]="showPassword() ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
              </div>
              @if (loginForm.get('password')?.touched && loginForm.get('password')?.errors?.['required']) {
                <p class="mt-1 text-sm text-red-400">Password is required</p>
              }
            </div>
            
            <!-- Submit Button -->
            <button 
              type="submit"
              [disabled]="isLoading()"
              class="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50"
            >
              @if (isLoading()) {
                <i class="fas fa-spinner fa-spin mr-2"></i>
                Signing in...
              } @else {
                <i class="fas fa-sign-in-alt mr-2"></i>
                Sign In
              }
            </button>
          </div>
        </form>
        
        <!-- Footer -->
        <p class="text-center text-slate-500 text-sm mt-6">
          (સિદસર, આદપુર, પાલીતાણા)
        </p>
      </div>
      
      <!-- Copyright -->
      <p class="text-center text-slate-500 text-xs mt-6">
        © {{ currentYear }} Mandap Billing System
      </p>
    </div>
  `
})
export class LoginComponent {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private authService = inject(AuthService);
    private toastService = inject(ToastService);

    loginForm: FormGroup;
    showPassword = signal(false);
    isLoading = signal(false);
    currentYear = new Date().getFullYear();

    constructor() {
        this.loginForm = this.fb.group({
            username: ['', Validators.required],
            password: ['', Validators.required]
        });

        // Redirect if already logged in
        if (this.authService.isAuthenticated()) {
            this.router.navigate(['/dashboard']);
        }
    }

    onSubmit(): void {
        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        this.isLoading.set(true);

        this.authService.login(this.loginForm.value).subscribe({
            next: (response) => {
                this.toastService.success(`Welcome back, ${response.fullName}!`);
                const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
                this.router.navigateByUrl(returnUrl);
            },
            error: (error) => {
                this.isLoading.set(false);
                // Error is handled by interceptor
            },
            complete: () => {
                this.isLoading.set(false);
            }
        });
    }
}

