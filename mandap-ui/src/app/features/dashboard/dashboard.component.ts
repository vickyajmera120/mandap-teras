import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CustomerService, EventService, BillService } from '@core/services';
import { Bill } from '@core/models';
import { CurrencyInrPipe, DateFormatPipe, StatusBadgeComponent, LoadingSpinnerComponent } from '@shared';

interface DashboardStats {
  totalCustomers: number;
  activeEvents: number;
  billsThisYear: number;
  totalRevenue: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyInrPipe, DateFormatPipe, StatusBadgeComponent, LoadingSpinnerComponent],
  template: `
    <div class="space-y-8">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-[var(--color-text-primary)]">Dashboard</h1>
          <p class="text-[var(--color-text-secondary)] mt-1">Welcome to Fagun Sud 13 Mandap Billing System</p>
        </div>
        <a 
          routerLink="/billing/new"
          class="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold hover:from-teal-600 hover:to-teal-700 shadow-lg shadow-teal-500/30 transition-all"
        >
          <i class="fas fa-plus mr-2"></i>New Bill
        </a>
      </div>
      
      @if (isLoading()) {
        <app-loading-spinner></app-loading-spinner>
      } @else {
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Customers -->
          <div class="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-2xl border border-[var(--color-border)] p-6 hover:border-teal-500/50 transition-all group">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <i class="fas fa-users text-xl text-white"></i>
              </div>
              <div>
                <p class="text-3xl font-bold text-[var(--color-text-primary)]">{{ stats().totalCustomers }}</p>
                <p class="text-[var(--color-text-secondary)] text-sm">Total Customers</p>
              </div>
            </div>
          </div>
          
          <!-- Events -->
          <div class="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-2xl border border-[var(--color-border)] p-6 hover:border-teal-500/50 transition-all group">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-green-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <i class="fas fa-calendar-check text-xl text-white"></i>
              </div>
              <div>
                <p class="text-3xl font-bold text-[var(--color-text-primary)]">{{ stats().activeEvents }}</p>
                <p class="text-[var(--color-text-secondary)] text-sm">Active Events</p>
              </div>
            </div>
          </div>
          
          <!-- Bills -->
          <div class="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-2xl border border-[var(--color-border)] p-6 hover:border-pink-500/50 transition-all group">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <i class="fas fa-file-invoice text-xl text-white"></i>
              </div>
              <div>
                <p class="text-3xl font-bold text-[var(--color-text-primary)]">{{ stats().billsThisYear }}</p>
                <p class="text-[var(--color-text-secondary)] text-sm">Bills This Year</p>
              </div>
            </div>
          </div>
          
          <!-- Revenue -->
          <div class="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-2xl border border-[var(--color-border)] p-6 hover:border-yellow-500/50 transition-all group">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <i class="fas fa-rupee-sign text-xl text-white"></i>
              </div>
              <div>
                <p class="text-2xl font-bold text-[var(--color-text-primary)]">{{ stats().totalRevenue | currencyInr }}</p>
                <p class="text-[var(--color-text-secondary)] text-sm">Total Revenue</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Recent Bills -->
        <div class="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-2xl border border-[var(--color-border)] p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-[var(--color-text-primary)]">
              <i class="fas fa-clock text-teal-400 mr-2"></i>Recent Bills
            </h2>
            <a 
              routerLink="/billing/history"
              class="text-teal-400 hover:text-teal-300 text-sm font-medium transition-colors"
            >
              View All <i class="fas fa-arrow-right ml-1"></i>
            </a>
          </div>
          
          @if (recentBills().length === 0) {
            <div class="text-center py-12 text-[var(--color-text-muted)]">
              <i class="fas fa-file-invoice text-4xl mb-4 opacity-50"></i>
              <p>No bills yet. Create your first bill!</p>
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-[var(--color-border)]">
                    <th class="text-left py-3 px-4 text-[var(--color-text-secondary)] font-medium text-sm">Bill No</th>
                    <th class="text-left py-3 px-4 text-[var(--color-text-secondary)] font-medium text-sm">Customer</th>
                    <th class="text-left py-3 px-4 text-[var(--color-text-secondary)] font-medium text-sm">Event</th>
                    <th class="text-left py-3 px-4 text-[var(--color-text-secondary)] font-medium text-sm">Status</th>
                    <th class="text-right py-3 px-4 text-[var(--color-text-secondary)] font-medium text-sm">Amount</th>
                    <th class="text-left py-3 px-4 text-[var(--color-text-secondary)] font-medium text-sm">Date</th>
                  </tr>
                </thead>
                <tbody>
                  @for (bill of recentBills(); track bill.id) {
                    <tr class="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] transition-colors">
                      <td class="py-3 px-4 text-[var(--color-text-primary)] font-medium">{{ bill.billNumber }}</td>
                      <td class="py-3 px-4 text-[var(--color-text-primary)]">{{ bill.customerName }}</td>
                      <td class="py-3 px-4 text-[var(--color-text-secondary)]">{{ bill.eventName }}</td>
                      <td class="py-3 px-4">
                        <app-status-badge [value]="bill.paymentStatus"></app-status-badge>
                      </td>
                      <td class="py-3 px-4 text-right text-teal-400 font-semibold">{{ bill.totalAmount | currencyInr }}</td>
                      <td class="py-3 px-4 text-[var(--color-text-secondary)]">{{ bill.billDate | dateFormat }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private customerService = inject(CustomerService);
  private eventService = inject(EventService);
  private billService = inject(BillService);

  isLoading = signal(true);
  stats = signal<DashboardStats>({
    totalCustomers: 0,
    activeEvents: 0,
    billsThisYear: 0,
    totalRevenue: 0
  });
  recentBills = signal<Bill[]>([]);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    // Load customers
    this.customerService.getAll().subscribe({
      next: (customers) => {
        this.stats.update(s => ({ ...s, totalCustomers: customers.length }));
      }
    });

    // Load events
    this.eventService.getAll().subscribe({
      next: (events) => {
        const activeEvents = events.filter(e => e.active).length;
        this.stats.update(s => ({ ...s, activeEvents }));
      }
    });

    // Load bills
    const currentYear = new Date().getFullYear();
    this.billService.getAll().subscribe({
      next: (bills) => {
        const yearBills = bills.filter(b => new Date(b.billDate).getFullYear() === currentYear);
        const totalRevenue = yearBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

        this.stats.update(s => ({
          ...s,
          billsThisYear: yearBills.length,
          totalRevenue
        }));

        // Get 5 most recent bills
        this.recentBills.set(
          bills.sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime()).slice(0, 5)
        );

        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }
}

