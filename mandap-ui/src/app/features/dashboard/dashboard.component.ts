import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CustomerService, BillService, RentalOrderService } from '@core/services';
import { Bill, RentalOrder } from '@core/models';
import { CurrencyInrPipe, DateFormatPipe, StatusBadgeComponent, LoadingSpinnerComponent } from '@shared';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsOption } from 'echarts';

interface DashboardStats {
  totalCustomers: number;
  billsThisYear: number;
  totalRevenue: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyInrPipe, DateFormatPipe, StatusBadgeComponent, LoadingSpinnerComponent, NgxEchartsDirective],
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
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        <!-- Charts Row -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Fulfillment Pulse Chart -->
          <div class="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-2xl border border-[var(--color-border)] p-6">
              <h3 class="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Fulfillment Pulse</h3>
              <div echarts [options]="fulfillmentOptions()" class="h-80 w-full"></div>
          </div>

          <!-- Bill Status Chart -->
          <div class="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-2xl border border-[var(--color-border)] p-6">
              <h3 class="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Bill Status Distribution</h3>
              <div echarts [options]="billStatusOptions()" class="h-80 w-full"></div>
          </div>

          <!-- Financial Overview Chart -->
          <div class="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-2xl border border-[var(--color-border)] p-6">
              <h3 class="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Financial Overview</h3>
              <div echarts [options]="financialOptions()" class="h-80 w-full"></div>
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
  private billService = inject(BillService);
  private rentalOrderService = inject(RentalOrderService);

  isLoading = signal(true);
  stats = signal<DashboardStats>({
    totalCustomers: 0,
    billsThisYear: 0,
    totalRevenue: 0
  });
  recentBills = signal<Bill[]>([]);

  billStatusOptions = signal<EChartsOption>({});
  financialOptions = signal<EChartsOption>({});
  fulfillmentOptions = signal<EChartsOption>({});

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

    // Load bills & orders
    const currentYear = new Date().getFullYear();

    // Using forkJoin would be cleaner but following existing pattern for consistency
    this.billService.getAll().subscribe({
      next: (bills) => {
        const yearBills = bills.filter(b => new Date(b.billDate).getFullYear() === currentYear);
        const totalRevenue = yearBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

        this.stats.update(s => ({
          ...s,
          billsThisYear: yearBills.length,
          totalRevenue
        }));

        this.generateBillCharts(bills);

        // Get 5 most recent bills
        this.recentBills.set(
          bills.sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime()).slice(0, 5)
        );
      }
    });

    this.rentalOrderService.getAll().subscribe({
      next: (orders) => {
        this.generateFulfillmentCharts(orders);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  private generateBillCharts(bills: Bill[]): void {
    // 1. Bill Status Counts
    const paid = bills.filter(b => b.paymentStatus === 'PAID').length;
    const partial = bills.filter(b => b.paymentStatus === 'PARTIAL').length;
    const due = bills.filter(b => b.paymentStatus === 'DUE').length;

    this.billStatusOptions.set({
      tooltip: {
        trigger: 'item'
      },
      legend: {
        bottom: '0%',
        left: 'center',
        textStyle: { color: '#ffffff', fontSize: 10 },
        itemWidth: 10,
        itemHeight: 10
      },
      series: [
        {
          name: 'Bill Status',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#1e293b',
            borderWidth: 2
          },
          label: {
            show: true,
            position: 'inside',
            formatter: '{c}', // Show count
            color: '#fff',
            fontWeight: 'bold'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
              fontWeight: 'bold',
              color: '#fff'
            }
          },
          labelLine: {
            show: false
          },
          data: [
            { value: paid, name: 'Paid', itemStyle: { color: '#2dd4bf' } }, // teal-400
            { value: partial, name: 'Partial', itemStyle: { color: '#fbbf24' } }, // amber-400
            { value: due, name: 'Due', itemStyle: { color: '#f43f5e' } } // rose-500
          ]
        }
      ]
    });

    // 2. Financial Overview
    const totalAmount = bills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const totalPaid = bills.reduce((sum, b) => {
      // Calculate paid amount: Total - NetPayable (assuming NetPayable is remaining)
      const due = b.netPayable || 0;
      const total = b.totalAmount || 0;
      return sum + (total - due);
    }, 0);
    const totalDue = totalAmount - totalPaid;

    this.financialOptions.set({
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `${params.name}: ₹${params.value.toLocaleString('en-IN')} (${params.percent}%)`;
        }
      },
      legend: {
        bottom: '0%',
        left: 'center',
        textStyle: { color: '#ffffff', fontSize: 10 },
        itemWidth: 10,
        itemHeight: 10
      },
      series: [
        {
          name: 'Financials',
          type: 'pie',
          radius: '50%',
          data: [
            { value: totalPaid, name: 'Received', itemStyle: { color: '#34d399' } }, // emerald-400
            { value: totalDue, name: 'Due', itemStyle: { color: '#f87171' } } // red-400
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          label: {
            color: '#fff',
            formatter: '{b}: {c}'
          }
        }
      ]
    });
  }

  private generateFulfillmentCharts(orders: RentalOrder[]): void {
    const active = orders.filter(o => o.status !== 'CANCELLED' && o.status !== 'COMPLETED');

    // Categorize
    const pendingDispatch = active.filter(o =>
      o.items?.some(i => (i.bookedQty || 0) > (i.dispatchedQty || 0))
    ).length;

    const pendingReturn = active.filter(o =>
      o.items?.some(i => (i.dispatchedQty || 0) > (i.returnedQty || 0))
    ).length;

    const completed = orders.filter(o => o.status === 'COMPLETED' || o.status === 'RETURNED').length;
    const bookedOnly = orders.filter(o => o.status === 'BOOKED' && !o.items?.some(i => (i.dispatchedQty || 0) > 0)).length;

    this.fulfillmentOptions.set({
      tooltip: { trigger: 'item' },
      legend: {
        bottom: '0%',
        left: 'center',
        textStyle: { color: '#ffffff', fontSize: 10 },
        itemWidth: 10,
        itemHeight: 10
      },
      series: [
        {
          name: 'Fulfillment',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#1e293b',
            borderWidth: 2
          },
          label: {
            show: true,
            position: 'inside',
            formatter: '{c}',
            color: '#fff',
            fontWeight: 'bold'
          },
          data: [
            { value: pendingDispatch, name: 'To Dispatch', itemStyle: { color: '#f97316' } }, // orange-500
            { value: pendingReturn, name: 'Pending Return', itemStyle: { color: '#22c55e' } }, // green-500
            { value: bookedOnly, name: 'Upcoming', itemStyle: { color: '#3b82f6' } }, // blue-500
            { value: completed, name: 'Completed', itemStyle: { color: '#94a3b8' } } // slate-400
          ]
        }
      ]
    });
  }
}
