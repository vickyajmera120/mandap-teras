import { Component, OnInit, inject, signal, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BillService, ToastService } from '@core/services';
import { Bill, BillType, PaymentStatus, BillUpdateRequest } from '@core/models';
import { CurrencyInrPipe, DateFormatPipe, StatusBadgeComponent, LoadingSpinnerComponent, ModalComponent } from '@shared';
import { PaymentHistoryModalComponent } from '../payment-history-modal/payment-history-modal.component';

@Component({
  selector: 'app-bill-history',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyInrPipe, DateFormatPipe, StatusBadgeComponent, LoadingSpinnerComponent, ModalComponent, PaymentHistoryModalComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-[var(--color-text-primary)]">Bill History</h1>
          <p class="text-[var(--color-text-secondary)] mt-1">View and manage all bills</p>
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
                  <th class="py-3 px-4 text-left align-top min-w-[120px]">
                    <div class="flex items-center gap-2 mb-2 cursor-pointer group" (click)="onSort('billNumber')">
                      <div class="text-[var(--color-text-secondary)] font-medium text-sm group-hover:text-[var(--color-text-primary)] transition-colors">Bill No</div>
                      @if (sortColumn() === 'billNumber') {
                        <i [class]="sortDirection() === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'" class="text-xs text-teal-500"></i>
                      } @else {
                        <i class="fas fa-sort text-xs text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"></i>
                      }
                    </div>
                    <input type="text" [ngModel]="billNoFilter()" (ngModelChange)="billNoFilter.set($event)" placeholder="Search..." class="w-full px-2 py-1 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500">
                  </th>
                  <th class="py-3 px-4 text-left align-top min-w-[150px]">
                    <div class="flex items-center gap-2 mb-2 cursor-pointer group" (click)="onSort('customerName')">
                      <div class="text-[var(--color-text-secondary)] font-medium text-sm group-hover:text-[var(--color-text-primary)] transition-colors">Customer</div>
                      @if (sortColumn() === 'customerName') {
                        <i [class]="sortDirection() === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'" class="text-xs text-teal-500"></i>
                      } @else {
                        <i class="fas fa-sort text-xs text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"></i>
                      }
                    </div>
                    <input type="text" [ngModel]="customerFilter()" (ngModelChange)="customerFilter.set($event)" placeholder="Name..." class="w-full px-2 py-1 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500">
                  </th>
                  <th class="py-3 px-4 text-left align-top min-w-[120px]">
                    <div class="text-[var(--color-text-secondary)] font-medium text-sm mb-2">Mobile</div>
                    <input type="text" [ngModel]="mobileFilter()" (ngModelChange)="mobileFilter.set($event)" placeholder="Mobile..." class="w-full px-2 py-1 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500">
                  </th>
                  <th class="py-3 px-4 text-left align-top min-w-[120px]">
                    <div class="flex items-center gap-2 mb-2 cursor-pointer group" (click)="onSort('palNumbers')">
                      <div class="text-[var(--color-text-secondary)] font-medium text-sm group-hover:text-[var(--color-text-primary)] transition-colors">Pal No(s)</div>
                      @if (sortColumn() === 'palNumbers') {
                        <i [class]="sortDirection() === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'" class="text-xs text-teal-500"></i>
                      } @else {
                        <i class="fas fa-sort text-xs text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"></i>
                      }
                    </div>
                    <input type="text" [ngModel]="palFilter()" (ngModelChange)="palFilter.set($event)" placeholder="Pal #..." class="w-full px-2 py-1 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500">
                  </th>
                  <th class="py-3 px-4 text-center align-top min-w-[100px]">
                    <div class="flex items-center justify-center gap-2 mb-2 cursor-pointer group" (click)="onSort('billType')">
                      <div class="text-[var(--color-text-secondary)] font-medium text-sm group-hover:text-[var(--color-text-primary)] transition-colors">Type</div>
                       @if (sortColumn() === 'billType') {
                        <i [class]="sortDirection() === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'" class="text-xs text-teal-500"></i>
                      } @else {
                        <i class="fas fa-sort text-xs text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"></i>
                      }
                    </div>
                    <select [ngModel]="typeFilter()" (ngModelChange)="typeFilter.set($event)" class="w-full px-1 py-1 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500">
                      <option value="">All</option>
                      <option value="ESTIMATE">ESTIMATE</option>
                      <option value="INVOICE">INVOICE</option>
                    </select>
                  </th>
                  <th class="py-3 px-4 text-center align-top min-w-[100px]">
                    <div class="flex items-center justify-center gap-2 mb-2 cursor-pointer group" (click)="onSort('paymentStatus')">
                      <div class="text-[var(--color-text-secondary)] font-medium text-sm group-hover:text-[var(--color-text-primary)] transition-colors">Status</div>
                       @if (sortColumn() === 'paymentStatus') {
                        <i [class]="sortDirection() === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'" class="text-xs text-teal-500"></i>
                      } @else {
                        <i class="fas fa-sort text-xs text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"></i>
                      }
                    </div>
                    <select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)" class="w-full px-1 py-1 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500">
                      <option value="">All</option>
                      <option value="DUE">DUE</option>
                      <option value="PAID">PAID</option>
                      <option value="PARTIAL">PARTIAL</option>
                    </select>
                  </th>
                  <th class="py-3 px-4 text-right align-top cursor-pointer group" (click)="onSort('totalAmount')">
                    <div class="flex items-center justify-end gap-2 mb-8">
                       <div class="text-[var(--color-text-secondary)] font-semibold text-sm group-hover:text-[var(--color-text-primary)] transition-colors">Total</div>
                       @if (sortColumn() === 'totalAmount') {
                        <i [class]="sortDirection() === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'" class="text-xs text-teal-500"></i>
                      } @else {
                        <i class="fas fa-sort text-xs text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"></i>
                      }
                    </div>
                  </th>
                  <th class="py-3 px-4 text-right align-top cursor-pointer group" (click)="onSort('netPayable')">
                    <div class="flex items-center justify-end gap-2 mb-8">
                       <div class="text-[var(--color-text-secondary)] font-semibold text-sm group-hover:text-[var(--color-text-primary)] transition-colors">Net Payable</div>
                       @if (sortColumn() === 'netPayable') {
                        <i [class]="sortDirection() === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'" class="text-xs text-teal-500"></i>
                      } @else {
                        <i class="fas fa-sort text-xs text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"></i>
                      }
                    </div>
                  </th>
                  <th class="py-3 px-4 text-left align-top text-[var(--color-text-secondary)] font-semibold">Date</th>
                  <th class="py-3 px-4 text-center align-top text-[var(--color-text-secondary)] font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (bill of filteredBills(); track bill.id) {
                    <tr class="border-t border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] transition-colors bg-[var(--color-bg-input)]">
                    <td class="py-3 px-4 text-teal-400 font-medium">{{ bill.billNumber }}</td>
                    <td class="py-3 px-4 text-[var(--color-text-primary)]">{{ bill.customerName }}</td>
                    <td class="py-3 px-4 text-slate-400">{{ bill.customerMobile }}</td>
                    <td class="py-3 px-4">
                      @if (bill.palNumbers) {
                         <div class="flex flex-wrap gap-1">
                           @for (pal of bill.palNumbers.split(','); track pal) {
                             <span class="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300">{{ pal.trim() }}</span>
                           }
                         </div>
                       } @else {
                         <span class="text-[var(--color-text-muted)]">-</span>
                       }
                    </td>
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
                          (click)="openPaymentModal(bill)"
                          class="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 transition-colors"
                          title="Payments"
                        >
                          <i class="fas fa-wallet text-xs"></i>
                        </button>
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
            
            <!-- Payments -->
            @if (selectedBill()!.payments?.length) {
              <div>
                <p class="text-slate-400 text-sm mb-2">Payments</p>
                <div class="bg-slate-700/30 rounded-lg overflow-hidden">
                  <table class="w-full text-sm">
                    <thead class="bg-slate-700/50">
                      <tr>
                        <th class="text-left py-2 px-3 text-slate-300">Date</th>
                        <th class="text-left py-2 px-3 text-slate-300">Method</th>
                        <th class="text-left py-2 px-3 text-slate-300">Remarks</th>
                        <th class="text-right py-2 px-3 text-slate-300">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (payment of selectedBill()!.payments; track payment.id) {
                        <tr class="border-t border-slate-600/30">
                          <td class="py-2 px-3 text-white">{{ payment.paymentDate | dateFormat }}</td>
                          <td class="py-2 px-3 text-slate-300">{{ payment.paymentMethod }}</td>
                          <td class="py-2 px-3 text-slate-400 italic">
                            {{ payment.remarks }}
                            @if (payment.isDeposit) {
                                <span class="ml-2 text-xs text-yellow-500 border border-yellow-500/50 px-1 rounded">Deposit</span>
                            }
                          </td>
                          <td class="py-2 px-3 text-right text-teal-400">{{ payment.amount | currencyInr }}</td>
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

      <!-- Payment History Modal -->
      @if (showPaymentModal() && selectedBillForPayment()) {
          <app-payment-history-modal 
            [billId]="selectedBillForPayment()!.id"
            [billNumber]="selectedBillForPayment()!.billNumber"
            [totalAmount]="selectedBillForPayment()!.totalAmount"
            (close)="closePaymentModal()"
            (paymentChanged)="loadBills()" 
          ></app-payment-history-modal>
      }
    </div>
  `
})
export class BillHistoryComponent implements OnInit {
  @ViewChild('viewModal') viewModal!: ModalComponent;

  private billService = inject(BillService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  bills = signal<Bill[]>([]);
  selectedBill = signal<Bill | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  showPaymentModal = signal(false);
  selectedBillForPayment = signal<Bill | null>(null);

  // Filters
  billNoFilter = signal('');
  customerFilter = signal('');
  mobileFilter = signal('');
  palFilter = signal('');
  typeFilter = signal('');
  statusFilter = signal('');

  // Sorting
  sortColumn = signal<string | null>(null);
  sortDirection = signal<'asc' | 'desc'>('asc');

  filteredBills = computed(() => {
    let result = this.bills();

    // Filters
    const bFilter = this.billNoFilter().toLowerCase();
    if (bFilter) result = result.filter(b => b.billNumber.toLowerCase().includes(bFilter));

    const cFilter = this.customerFilter().toLowerCase();
    if (cFilter) result = result.filter(b => b.customerName?.toLowerCase().includes(cFilter));

    const mFilter = this.mobileFilter().toLowerCase();
    if (mFilter) result = result.filter(b => b.customerMobile?.toLowerCase().includes(mFilter));

    const pFilter = this.palFilter().toLowerCase();
    if (pFilter) result = result.filter(b => b.palNumbers?.toLowerCase().includes(pFilter));

    const tFilter = this.typeFilter();
    if (tFilter) result = result.filter(b => b.billType === tFilter);

    const sFilter = this.statusFilter();
    if (sFilter) result = result.filter(b => b.paymentStatus === sFilter);

    // Sorting
    const col = this.sortColumn();
    const dir = this.sortDirection();

    if (col) {
      result = [...result].sort((a, b) => {
        let valA: any = '';
        let valB: any = '';

        switch (col) {
          case 'billNumber': valA = a.billNumber; valB = b.billNumber; break;
          case 'customerName': valA = a.customerName; valB = b.customerName; break;
          case 'palNumbers': valA = a.palNumbers; valB = b.palNumbers; break;
          case 'billType': valA = a.billType; valB = b.billType; break;
          case 'paymentStatus': valA = a.paymentStatus; valB = b.paymentStatus; break;
          case 'totalAmount': valA = a.totalAmount; valB = b.totalAmount; break;
          case 'netPayable': valA = a.netPayable; valB = b.netPayable; break;
        }

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return dir === 'asc' ? -1 : 1;
        if (valA > valB) return dir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  });

  onSort(column: string) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }


  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.billService.getAll().subscribe({
      next: (bills) => {
        this.bills.set(bills);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  loadBills() {
    this.loadData();
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

  openPaymentModal(bill: Bill) {
    this.selectedBillForPayment.set(bill);
    this.showPaymentModal.set(true);
  }

  closePaymentModal() {
    this.showPaymentModal.set(false);
    this.selectedBillForPayment.set(null);
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

    let paymentsHtml = '';
    if (bill.payments && bill.payments.length > 0) {
      const rows = bill.payments.map(p => `
            <tr>
                <td style="padding: 6px; border-bottom: 1px solid #eee; font-size: 12px;">${new Date(p.paymentDate).toLocaleDateString('en-IN')}</td>
                <td style="padding: 6px; border-bottom: 1px solid #eee; font-size: 12px;">${p.paymentMethod}</td>
                <td style="padding: 6px; border-bottom: 1px solid #eee; font-size: 12px; font-style: italic;">${p.remarks || ''}</td>
                <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: right; font-size: 12px;">₹${p.amount}</td>
            </tr>
        `).join('');
      paymentsHtml = `
            <div style="margin-top: 20px;">
                <h3 style="font-size: 14px; margin-bottom: 5px; color: #555;">Payment History</h3>
                <table style="font-size: 12px;">
                    <thead>
                        <tr style="background: #f0f0f0;">
                            <th style="padding: 6px; text-align: left; background: #eee; color: #333;">Date</th>
                            <th style="padding: 6px; text-align: left; background: #eee; color: #333;">Method</th>
                            <th style="padding: 6px; text-align: left; background: #eee; color: #333;">Remarks</th>
                            <th style="padding: 6px; text-align: right; background: #eee; color: #333;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }

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
        
        ${paymentsHtml}

        <div class="total">
          <p>Total Amount: ₹${bill.totalAmount?.toLocaleString('en-IN')}</p>
          <p>Total Payment: ₹${bill.deposit?.toLocaleString('en-IN')}</p>
          <p class="net">Net Payable: ₹${bill.netPayable?.toLocaleString('en-IN')}</p>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }
}
