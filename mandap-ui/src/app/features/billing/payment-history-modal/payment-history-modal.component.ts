import { Component, Input, Output, EventEmitter, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService, ToastService } from '@core/services';
import { Payment } from '@core/models';
import { CurrencyInrPipe, DateFormatPipe, LoadingSpinnerComponent } from '@shared';

@Component({
    selector: 'app-payment-history-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, CurrencyInrPipe, DateFormatPipe, LoadingSpinnerComponent],
    template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" (click)="close.emit()">
      <div class="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
          <div>
            <h2 class="text-xl font-bold text-[var(--color-text-primary)]">Payment History</h2>
            <p class="text-sm text-[var(--color-text-secondary)]">Bill #{{ billNumber }}</p>
          </div>
          <button (click)="close.emit()" class="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          
          <!-- Summary Cards -->
          <div class="grid grid-cols-3 gap-4">
            <div class="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <div class="text-sm text-slate-400 mb-1">Total Bill</div>
              <div class="text-lg font-bold text-white">{{ totalAmount | currencyInr }}</div>
            </div>
            <div class="bg-teal-900/20 p-4 rounded-xl border border-teal-800/30">
              <div class="text-sm text-teal-400 mb-1">Total Paid</div>
              <div class="text-lg font-bold text-teal-400">{{ totalPaid() | currencyInr }}</div>
            </div>
            <div class="bg-red-900/20 p-4 rounded-xl border border-red-800/30">
              <div class="text-sm text-red-400 mb-1">Balance Due</div>
              <div class="text-lg font-bold text-red-400">{{ balanceDue() | currencyInr }}</div>
            </div>
          </div>

          <!-- Add Payment Form -->
          <div class="bg-[var(--color-bg-input)] p-4 rounded-xl border border-[var(--color-border)]">
            <h3 class="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
              {{ editingPayment() ? 'Edit Payment' : 'Add Payment' }}
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
               <div>
                  <label class="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Amount</label>
                  <input type="number" [(ngModel)]="formAmount" class="w-full px-3 py-2 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500">
               </div>
               <div>
                  <label class="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Date</label>
                  <input type="date" [(ngModel)]="formDate" class="w-full px-3 py-2 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500">
               </div>
               <div>
                  <label class="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Method</label>
                  <select [(ngModel)]="formMethod" class="w-full px-3 py-2 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500">
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="ONLINE">Online</option>
                  </select>
               </div>
               @if (formMethod === 'CHEQUE' || formMethod === 'ONLINE') {
                 <div>
                    <label class="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">{{ formMethod === 'CHEQUE' ? 'Cheque No' : 'Transaction ID' }}</label>
                    <input type="text" [(ngModel)]="formChequeNo" class="w-full px-3 py-2 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500">
                 </div>
               }
               <div class="md:col-span-2">
                  <label class="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Remarks</label>
                  <input type="text" [(ngModel)]="formRemarks" class="w-full px-3 py-2 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500">
               </div>
            </div>
            <div class="flex justify-end gap-2">
              @if (editingPayment()) {
                <button (click)="cancelEdit()" class="px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">Cancel</button>
              }
              <button 
                (click)="savePayment()" 
                [disabled]="!isValidForm() || isSaving()"
                class="px-4 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                @if (isSaving()) { <i class="fas fa-spinner fa-spin"></i> }
                {{ editingPayment() ? 'Update' : 'Add' }}
              </button>
            </div>
          </div>

          <!-- Payments List -->
           @if (isLoading()) {
              <app-loading-spinner></app-loading-spinner>
           } @else {
             <table class="w-full">
               <thead class="text-xs text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">
                 <tr>
                   <th class="pb-2 text-left">Date</th>
                   <th class="pb-2 text-left">Method</th>
                   <th class="pb-2 text-left">Details</th>
                   <th class="pb-2 text-right">Amount</th>
                   <th class="pb-2 text-center w-20">Actions</th>
                 </tr>
               </thead>
               <tbody class="text-sm">
                 @for (payment of payments(); track payment.id) {
                   <tr class="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-hover)]/50">
                     <td class="py-3 text-[var(--color-text-primary)]">{{ payment.paymentDate | dateFormat }}</td>
                     <td class="py-3">
                       <span class="px-2 py-0.5 rounded text-xs font-medium" 
                         [class.bg-green-900/30]="payment.paymentMethod === 'CASH'" [class.text-green-400]="payment.paymentMethod === 'CASH'"
                         [class.bg-blue-900/30]="payment.paymentMethod === 'CHEQUE'" [class.text-blue-400]="payment.paymentMethod === 'CHEQUE'"
                         [class.bg-purple-900/30]="payment.paymentMethod === 'ONLINE'" [class.text-purple-400]="payment.paymentMethod === 'ONLINE'"
                       >
                         {{ payment.paymentMethod }}
                       </span>
                     </td>
                     <td class="py-3 text-[var(--color-text-secondary)]">
                       <div class="flex flex-col">
                         @if (payment.chequeNumber) { <span class="text-xs">{{ payment.chequeNumber }}</span> }
                         @if (payment.remarks) { <span class="text-xs italic">{{ payment.remarks }}</span> }
                       </div>
                     </td>
                     <td class="py-3 text-right font-medium text-[var(--color-text-primary)]">{{ payment.amount | currencyInr }}</td>
                     <td class="py-3 text-center">
                       <div class="flex items-center justify-center gap-2">
                         <button (click)="editPayment(payment)" class="p-1 text-blue-400 hover:bg-blue-400/10 rounded"><i class="fas fa-edit"></i></button>
                         <button (click)="deletePayment(payment)" class="p-1 text-red-400 hover:bg-red-400/10 rounded"><i class="fas fa-trash"></i></button>
                       </div>
                     </td>
                   </tr>
                 }
                 @if (payments().length === 0) {
                   <tr>
                     <td colspan="5" class="py-8 text-center text-[var(--color-text-muted)] italic">No payments recorded yet.</td>
                   </tr>
                 }
               </tbody>
             </table>
           }

        </div>
      </div>
    </div>
  `
})
export class PaymentHistoryModalComponent implements OnInit {
    @Input() billId!: number;
    @Input() billNumber!: string;
    @Input() totalAmount: number = 0;
    @Output() close = new EventEmitter<void>();
    @Output() paymentChanged = new EventEmitter<void>();

    private paymentService = inject(PaymentService);
    private toast = inject(ToastService);

    payments = signal<Payment[]>([]);
    isLoading = signal(true);
    isSaving = signal(false);

    // Form
    editingPayment = signal<Payment | null>(null);
    formAmount: number = 0;
    formDate: string = new Date().toISOString().split('T')[0];
    formMethod: 'CASH' | 'CHEQUE' | 'ONLINE' = 'CASH';
    formChequeNo: string = '';
    formRemarks: string = '';

    totalPaid = computed(() => this.payments().reduce((sum, p) => sum + p.amount, 0));
    balanceDue = computed(() => this.totalAmount - this.totalPaid());

    ngOnInit() {
        this.loadPayments();
    }

    loadPayments() {
        this.isLoading.set(true);
        this.paymentService.getPaymentsByBillId(this.billId).subscribe({
            next: (data) => {
                this.payments.set(data);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error loading payments', err);
                this.toast.error('Failed to load payments');
                this.isLoading.set(false);
            }
        });
    }

    savePayment() {
        if (!this.isValidForm()) return;

        this.isSaving.set(true);
        const paymentData: Payment = {
            billId: this.billId,
            amount: this.formAmount,
            paymentDate: this.formDate,
            paymentMethod: this.formMethod,
            chequeNumber: this.formChequeNo,
            remarks: this.formRemarks
        };

        if (this.editingPayment()) {
            // Update
            this.paymentService.updatePayment(this.editingPayment()!.id!, paymentData).subscribe({
                next: (updated) => {
                    this.payments.update(list => list.map(p => p.id === updated.id ? updated : p));
                    this.resetForm();
                    this.toast.success('Payment updated');
                    this.paymentChanged.emit();
                    this.isSaving.set(false);
                },
                error: (err) => {
                    console.error('Error updating payment', err);
                    this.toast.error('Failed to update payment');
                    this.isSaving.set(false);
                }
            });
        } else {
            // Add
            this.paymentService.addPayment(paymentData).subscribe({
                next: (newPayment) => {
                    this.payments.update(list => [...list, newPayment]);
                    this.resetForm();
                    this.toast.success('Payment added');
                    this.paymentChanged.emit();
                    this.isSaving.set(false);
                },
                error: (err) => {
                    console.error('Error adding payment', err);
                    this.toast.error('Failed to add payment');
                    this.isSaving.set(false);
                }
            });
        }
    }

    deletePayment(payment: Payment) {
        if (!confirm('Are you sure you want to delete this payment?')) return;

        this.isLoading.set(true);
        this.paymentService.deletePayment(payment.id!).subscribe({
            next: () => {
                this.payments.update(list => list.filter(p => p.id !== payment.id));
                this.toast.success('Payment deleted');
                this.paymentChanged.emit();
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error deleting payment', err);
                this.toast.error('Failed to delete payment');
                this.isLoading.set(false);
            }
        });

    }

    editPayment(payment: Payment) {
        this.editingPayment.set(payment);
        this.formAmount = payment.amount;
        this.formDate = payment.paymentDate;
        this.formMethod = payment.paymentMethod;
        this.formChequeNo = payment.chequeNumber || '';
        this.formRemarks = payment.remarks || '';
    }

    cancelEdit() {
        this.resetForm();
    }

    resetForm() {
        this.editingPayment.set(null);
        this.formAmount = 0;
        this.formDate = new Date().toISOString().split('T')[0];
        this.formMethod = 'CASH';
        this.formChequeNo = '';
        this.formRemarks = '';
    }

    isValidForm(): boolean {
        return this.formAmount > 0 && !!this.formDate;
    }
}
