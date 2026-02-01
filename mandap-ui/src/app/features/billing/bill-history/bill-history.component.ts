import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BillService, ToastService } from '@core/services';
import { Bill, BillType, PaymentStatus, BillUpdateRequest } from '@core/models';
import { CurrencyInrPipe, DateFormatPipe, StatusBadgeComponent, LoadingSpinnerComponent, ModalComponent } from '@shared';

@Component({
  selector: 'app-bill-history',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyInrPipe, DateFormatPipe, StatusBadgeComponent, LoadingSpinnerComponent, ModalComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-[var(--color-text-primary)]">Bill History</h1>
          <p class="text-[var(--color-text-secondary)] mt-1">View and manage all bills</p>
        </div>
      </div>
      
      <!-- Filters -->
      <div class="flex flex-wrap items-end gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-400 mb-1">Year</label>
          <select 
            [(ngModel)]="filterYear"
            (ngModelChange)="applyFilters()"
              class="px-4 py-2.5 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500/50"
          >
            <option value="">All Years</option>
            @for (year of years(); track year) {
              <option [value]="year">{{ year }}</option>
            }
          </select>
        </div>
        <div class="flex-1">
          <label class="block text-sm font-medium text-slate-400 mb-1">Search</label>
          <div class="relative">
            <input 
              type="text"
              [(ngModel)]="searchQuery"
              (input)="applyFilters()"
              placeholder="Search by customer or bill no..."
              class="w-full md:w-80 px-4 py-2.5 pl-10 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-teal-500/50"
            >
            <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          </div>
        </div>
      </div>
      
      @if (isLoading()) {
        <app-loading-spinner></app-loading-spinner>
      } @else {
        <!-- Table -->
        <div class="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-2xl border border-[var(--color-border)] overflow-hidden transition-colors">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-[var(--color-bg-hover)]/30">
                <tr>
                  <th class="text-left py-4 px-4 text-[var(--color-text-secondary)] font-semibold">Bill No</th>
                  <th class="text-left py-4 px-4 text-slate-300 font-semibold">Customer</th>
                  <th class="text-left py-4 px-4 text-slate-300 font-semibold">Mobile</th>
                  <th class="text-center py-4 px-4 text-slate-300 font-semibold">Pal No(s)</th>
                  <th class="text-center py-4 px-4 text-slate-300 font-semibold">Type</th>
                  <th class="text-center py-4 px-4 text-slate-300 font-semibold">Status</th>
                  <th class="text-right py-4 px-4 text-slate-300 font-semibold">Total</th>
                  <th class="text-right py-4 px-4 text-slate-300 font-semibold">Net</th>
                  <th class="text-left py-4 px-4 text-slate-300 font-semibold">Date</th>
                  <th class="text-center py-4 px-4 text-slate-300 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (bill of filteredBills(); track bill.id) {
                    <tr class="border-t border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] transition-colors bg-[var(--color-bg-input)]">
                    <td class="py-3 px-4 text-teal-400 font-medium">{{ bill.billNumber }}</td>
                    <td class="py-3 px-4 text-[var(--color-text-primary)]">{{ bill.customerName }}</td>
                    <td class="py-3 px-4 text-slate-400">{{ bill.customerMobile }}</td>
                    <td class="py-3 px-4 text-center text-[var(--color-text-secondary)]">{{ bill.palNumbers }}</td>
                    <td class="py-3 px-4 text-center">
                      <app-status-badge [value]="bill.billType"></app-status-badge>
                    </td>
                    <td class="py-3 px-4 text-center">
                      <app-status-badge [value]="bill.paymentStatus"></app-status-badge>
                    </td>
                    <td class="py-3 px-4 text-right text-slate-300">{{ bill.totalAmount | currencyInr }}</td>
                    <td class="py-3 px-4 text-right text-teal-400 font-semibold">{{ bill.netPayable | currencyInr }}</td>
                    <td class="py-3 px-4 text-slate-400">{{ bill.billDate | dateFormat }}</td>
                    <td class="py-3 px-4">
                      <div class="flex items-center justify-center gap-1">
                        <button 
                          (click)="viewBill(bill)"
                          class="w-8 h-8 rounded-lg bg-slate-600/50 text-slate-300 hover:bg-slate-600 transition-colors"
                          title="View"
                        >
                          <i class="fas fa-eye text-xs"></i>
                        </button>
                        <button 
                          (click)="editBill(bill)"
                          class="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                          title="Edit"
                        >
                          <i class="fas fa-edit text-xs"></i>
                        </button>
                        <button 
                          (click)="deleteBill(bill)"
                          class="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                          title="Delete"
                        >
                          <i class="fas fa-trash text-xs"></i>
                        </button>
                        <button 
                          (click)="printBill(bill)"
                          class="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                          title="Print"
                        >
                          <i class="fas fa-print text-xs"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="11" class="py-16 text-center text-slate-400">
                      <i class="fas fa-file-invoice text-4xl mb-4 opacity-50"></i>
                      <p>No bills found</p>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
      
      <!-- View Bill Modal -->
      <app-modal #viewModal title="Bill Details" size="lg">
        @if (selectedBill()) {
          <div class="space-y-6">
            <!-- Bill Header Info -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p class="text-slate-400 text-sm">Bill Number</p>
                <p class="text-white font-semibold">{{ selectedBill()!.billNumber }}</p>
              </div>
              <div>
                <p class="text-slate-400 text-sm">Customer</p>
                <p class="text-white">{{ selectedBill()!.customerName }}</p>
              </div>
              <div>
                <p class="text-slate-400 text-sm">Date</p>
                <p class="text-white">{{ selectedBill()!.billDate | dateFormat:'long' }}</p>
              </div>
            </div>
            
            <!-- Status Badges -->
            <div class="flex gap-4">
              <div>
                <p class="text-slate-400 text-sm mb-1">Type</p>
                <app-status-badge [value]="selectedBill()!.billType"></app-status-badge>
              </div>
              <div>
                <p class="text-slate-400 text-sm mb-1">Status</p>
                <app-status-badge [value]="selectedBill()!.paymentStatus"></app-status-badge>
              </div>
            </div>
            
            <!-- Items -->
            @if (selectedBill()!.items.length) {
              <div>
                <p class="text-slate-400 text-sm mb-2">Items</p>
                <div class="bg-slate-700/30 rounded-lg overflow-hidden">
                  <table class="w-full text-sm">
                    <thead class="bg-slate-700/50">
                      <tr>
                        <th class="text-left py-2 px-3 text-slate-300">Item</th>
                        <th class="text-center py-2 px-3 text-slate-300">Qty</th>
                        <th class="text-right py-2 px-3 text-slate-300">Rate</th>
                        <th class="text-right py-2 px-3 text-slate-300">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of selectedBill()!.items; track item.id) {
                        <tr class="border-t border-slate-600/30">
                          <td class="py-2 px-3 text-white">{{ item.itemNameGujarati }}</td>
                          <td class="py-2 px-3 text-center text-slate-300">{{ item.quantity }}</td>
                          <td class="py-2 px-3 text-right text-slate-300">{{ item.rate | currencyInr }}</td>
                          <td class="py-2 px-3 text-right text-teal-400">{{ item.total | currencyInr }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }
            
            <!-- Totals -->
            <div class="bg-slate-700/30 rounded-lg p-4 space-y-2">
              <div class="flex justify-between">
                <span class="text-slate-400">Total Amount:</span>
                <span class="text-white font-semibold">{{ selectedBill()!.totalAmount | currencyInr }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Deposit:</span>
                <span class="text-slate-300">{{ selectedBill()!.deposit | currencyInr }}</span>
              </div>
              <div class="flex justify-between border-t border-slate-600 pt-2">
                <span class="text-white font-medium">Net Payable:</span>
                <span class="text-xl text-teal-400 font-bold">{{ selectedBill()!.netPayable | currencyInr }}</span>
              </div>
            </div>
            
            <!-- Actions -->
            <div class="flex gap-3">
              <button 
                (click)="editBill(selectedBill()!); viewModal.close()"
                class="flex-1 py-3 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
              >
                <i class="fas fa-edit mr-2"></i>Edit
              </button>
              <button 
                (click)="printBill(selectedBill()!); viewModal.close()"
                class="flex-1 py-3 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
              >
                <i class="fas fa-print mr-2"></i>Print
              </button>
            </div>
          </div>
        }
      </app-modal>
      

    </div>
  `
})
export class BillHistoryComponent implements OnInit {
  @ViewChild('viewModal') viewModal!: ModalComponent;

  private billService = inject(BillService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  bills = signal<Bill[]>([]);
  filteredBills = signal<Bill[]>([]);
  years = signal<number[]>([]);
  selectedBill = signal<Bill | null>(null);

  isLoading = signal(true);
  isSaving = signal(false);

  // Filters
  filterYear = '';
  searchQuery = '';

  // Filters


  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.billService.getAll().subscribe({
      next: (bills) => {
        this.bills.set(bills);
        this.filteredBills.set(bills);

        // Extract unique years
        const uniqueYears = [...new Set(bills.map(b => new Date(b.billDate).getFullYear()))];
        this.years.set(uniqueYears.sort((a, b) => b - a));

        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  applyFilters(): void {
    let filtered = this.bills();

    if (this.filterYear) {
      const year = parseInt(this.filterYear);
      filtered = filtered.filter(b => new Date(b.billDate).getFullYear() === year);
    }



    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(b =>
        b.billNumber.toLowerCase().includes(query) ||
        b.customerName?.toLowerCase().includes(query) ||
        b.customerMobile?.includes(query)
      );
    }

    this.filteredBills.set(filtered);
  }

  viewBill(bill: Bill): void {
    this.selectedBill.set(bill);
    this.viewModal.open();
  }

  editBill(bill: Bill): void {
    this.router.navigate(['/billing/edit', bill.id]);
  }

  deleteBill(bill: Bill): void {
    if (confirm(`Are you sure you want to delete bill ${bill.billNumber}? This cannot be undone.`)) {
      this.isLoading.set(true);
      this.billService.delete(bill.id).subscribe({
        next: () => {
          this.toastService.success('Bill deleted successfully');
          this.loadData();
        },
        error: (err) => {
          this.toastService.error('Failed to delete bill');
          this.isLoading.set(false);
        }
      });
    }
  }



  printBill(bill: Bill): void {
    // Create print window with bill details
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = bill.items?.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.itemNameGujarati}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.rate}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.total}</td>
      </tr>
    `).join('') || '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill - ${bill.billNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #008080; padding-bottom: 10px; margin-bottom: 20px; }
          .header h1 { color: #008080; margin: 0; }
          .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #008080; color: white; padding: 10px; text-align: left; }
          .total { text-align: right; font-size: 18px; }
          .net { font-size: 24px; color: #008080; font-weight: bold; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ફાગણ સુદ ૧૩</h1>
          <p>Mandap Contractor</p>
        </div>
        <div class="info">
          <div>
            <p><strong>Bill No:</strong> ${bill.billNumber}</p>
            <p><strong>Customer:</strong> ${bill.customerName}</p>
            <p><strong>Mobile:</strong> ${bill.customerMobile}</p>
          </div>
          <div>
            <p><strong>Date:</strong> ${new Date(bill.billDate).toLocaleDateString('en-IN')}</p>
            <p><strong>Pal No(s):</strong> ${bill.palNumbers}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Rate</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div class="total">
          <p>Total Amount: ₹${bill.totalAmount?.toLocaleString('en-IN')}</p>
          <p>Deposit: ₹${bill.deposit?.toLocaleString('en-IN')}</p>
          <p class="net">Net Payable: ₹${bill.netPayable?.toLocaleString('en-IN')}</p>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }
}

