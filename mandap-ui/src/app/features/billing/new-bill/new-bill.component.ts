import { Component, OnInit, inject, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService, BillService, InventoryService, ToastService, RentalOrderService } from '@core/services';
import { Customer, InventoryItem, BillRequest, BillItem, Bill, BillUpdateRequest, RentalOrderItem } from '@core/models';
import { CurrencyInrPipe, LoadingSpinnerComponent, ModalComponent } from '@shared';
import { NgSelectModule } from '@ng-select/ng-select';

interface ItemEntry {
  item: InventoryItem;
  quantity: number;
  rate: number;
  total: number;
}

@Component({
  selector: 'app-new-bill',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CurrencyInrPipe, LoadingSpinnerComponent, NgSelectModule, ModalComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-[var(--color-text-primary)]">{{ billId() ? 'Edit Bill' : 'Create New Bill' }}</h1>
          <p class="text-[var(--color-text-secondary)] mt-1">{{ billId() ? 'Update existing invoice' : 'Generate invoice for Mandap services' }}</p>
        </div>
      </div>
      
      @if (isLoading()) {
        <app-loading-spinner></app-loading-spinner>
      } @else {
        <div class="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-2xl border border-[var(--color-border)] p-6">
          <!-- Bill Header -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div>
              <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Customer *</label>
              <ng-select
                [items]="customers()"
                bindLabel="name"
                bindValue="id"
                [(ngModel)]="selectedCustomerId"
              (change)="onCustomerChange($event)"
                placeholder="Select Customer"
                class="custom-select"
              >
                 <ng-template ng-option-tmp let-item="item">
                  <div class="flex flex-col">
                    <span class="font-medium text-white">{{ item.name }}</span>
                    <span class="text-xs text-slate-400">{{ item.mobile }}</span>
                  </div>
                </ng-template>
                <ng-template ng-label-tmp let-item="item">
                   <span class="text-[var(--color-text-primary)]">{{ item.name }}</span>
                </ng-template>
                <ng-template ng-header-tmp>
                  <button (click)="openAddCustomerModal()" class="w-full py-2 px-3 text-left text-sm text-teal-400 hover:bg-slate-700/50 transition-colors flex items-center gap-2 border-b border-slate-700">
                    <i class="fas fa-plus"></i> Add New Customer
                  </button>
                </ng-template>
              </ng-select>
            </div>
            <div>
              <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Bill Date *</label>
              <input 
                type="date"
                [(ngModel)]="billDate"
                class="w-full px-4 py-2.5 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500 transition-all shadow-sm"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Pal Number(s) *</label>
              <ng-select
                [items]="[]"
                [addTag]="true"
                [multiple]="true"
                [selectOnTab]="true"
                [isOpen]="false"
                [(ngModel)]="palNumbers"
                placeholder="Enter Pal No(s)"
                class="custom-select"
              >
              </ng-select>
              <p class="text-xs text-slate-500 mt-1">Type number and press Enter</p>
            </div>
          </div>
          
          <!-- Unreturned Items Warning -->
          @if (unreturnedItems().length > 0) {
            <div class="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <div class="flex items-center gap-3 mb-3">
                <i class="fas fa-exclamation-triangle text-red-400 text-xl"></i>
                <h3 class="text-red-400 font-semibold">Unreturned Items Warning</h3>
              </div>
              <p class="text-sm text-red-300/80 mb-3">This customer has unreturned rental items. Please collect or charge for these items:</p>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-left text-red-300/60">
                      <th class="py-2 px-3">Item</th>
                      <th class="py-2 px-3 text-center">Outstanding Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of unreturnedItems(); track item.inventoryItemId) {
                      <tr class="border-t border-red-500/20">
                        <td class="py-2 px-3 text-red-200">{{ item.itemNameGujarati }}</td>
                        <td class="py-2 px-3 text-center text-red-300 font-medium">{{ item.outstandingQty }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
          
          <!-- Bill Type and Status -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div>
              <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Bill Type</label>
              <div class="flex gap-4">
                <label class="flex items-center gap-2 cursor-pointer group">
                  <input type="radio" name="billType" value="INVOICE" [(ngModel)]="billType" class="text-teal-500 focus:ring-teal-500 bg-[var(--color-bg-input)] border-[var(--color-border)]">
                  <span class="text-slate-300 group-hover:text-white transition-colors">Invoice</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer group">
                  <input type="radio" name="billType" value="ESTIMATE" [(ngModel)]="billType" class="text-teal-500 focus:ring-teal-500 bg-slate-700 border-slate-600">
                  <span class="text-slate-300 group-hover:text-white transition-colors">Estimate</span>
                </label>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Payment Status</label>
              <div class="flex gap-4">
                <label class="flex items-center gap-2 cursor-pointer group">
                  <input type="radio" name="paymentStatus" value="DUE" [(ngModel)]="paymentStatus" class="text-teal-500 focus:ring-teal-500 bg-slate-700 border-slate-600">
                  <span class="text-slate-300 group-hover:text-white transition-colors">Due</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer group">
                  <input type="radio" name="paymentStatus" value="PAID" [(ngModel)]="paymentStatus" class="text-teal-500 focus:ring-teal-500 bg-slate-700 border-slate-600">
                  <span class="text-slate-300 group-hover:text-white transition-colors">Paid</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer group">
                  <input type="radio" name="paymentStatus" value="PARTIAL" [(ngModel)]="paymentStatus" class="text-teal-500 focus:ring-teal-500 bg-slate-700 border-slate-600">
                  <span class="text-slate-300 group-hover:text-white transition-colors">Partial</span>
                </label>
              </div>
            </div>
          </div>
          
          <!-- Items Section -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <!-- Left Items -->
            <div class="bg-[var(--color-bg-hover)]/30 rounded-xl p-4">
              <div class="flex items-center gap-3 mb-3 px-3 text-xs uppercase tracking-wider font-semibold text-slate-400">
                <span class="flex-1 text-[var(--color-text-secondary)]">Item</span>
                <span class="w-20 text-center text-[var(--color-text-secondary)]">Qty</span>
                <span class="w-24 text-center text-[var(--color-text-secondary)]">Rate</span>
                <span class="w-24 text-right text-[var(--color-text-secondary)]">Total</span>
              </div>
              <div class="space-y-3">
                @for (entry of leftItems(); track entry.item.id) {
                  <div class="flex items-center gap-3 bg-[var(--color-bg-input)] rounded-lg p-3 border border-[var(--color-border)]">
                    <span class="flex-1 text-[var(--color-text-primary)] font-medium">{{ entry.item.nameGujarati }}</span>
                    <input 
                      type="number"
                      [value]="entry.quantity"
                      (input)="updateQuantity(entry, $event)"
                      min="0"
                      class="w-20 px-3 py-2 bg-[var(--color-bg-hover)]/50 border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] text-center focus:outline-none focus:border-teal-500 transition-colors"
                      placeholder="Qty"
                    >
                    <input 
                      type="number"
                      [value]="entry.rate"
                      readonly
                      class="w-24 px-3 py-2 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)] text-center cursor-not-allowed focus:outline-none"
                    >
                    <span class="w-24 text-right text-teal-400 font-medium whitespace-nowrap">{{ entry.total | currencyInr }}</span>
                  </div>
                }
              </div>
            </div>
            
            <!-- Right Items -->
            <div class="bg-[var(--color-bg-hover)]/30 rounded-xl p-4">
              <div class="flex items-center gap-3 mb-3 px-3 text-xs uppercase tracking-wider font-semibold text-slate-400">
                <span class="flex-1">Item</span>
                <span class="w-20 text-center text-[var(--color-text-secondary)]">Qty</span>
                <span class="w-24 text-center text-[var(--color-text-secondary)]">Rate</span>
                <span class="w-24 text-right text-[var(--color-text-secondary)]">Total</span>
              </div>
              <div class="space-y-3">
                @for (entry of rightItems(); track entry.item.id) {
                  <div class="flex items-center gap-3 bg-[var(--color-bg-input)] rounded-lg p-3 border border-[var(--color-border)]">
                    <span class="flex-1 text-[var(--color-text-primary)] font-medium">{{ entry.item.nameGujarati }}</span>
                    <input 
                      type="number"
                      [value]="entry.quantity"
                      (input)="updateQuantity(entry, $event)"
                      min="0"
                      class="w-20 px-3 py-2 bg-[var(--color-bg-hover)]/50 border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] text-center focus:outline-none focus:border-teal-500 transition-colors"
                      placeholder="Qty"
                    >
                    <input 
                      type="number"
                      [value]="entry.rate"
                      readonly
                      class="w-24 px-3 py-2 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)] text-center cursor-not-allowed focus:outline-none"
                    >
                    <span class="w-24 text-right text-teal-400 font-medium whitespace-nowrap">{{ entry.total | currencyInr }}</span>
                  </div>
                }
              </div>
            </div>
          </div>
          
          <!-- Totals Section -->
          <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <!-- Remarks -->
            <div class="w-full md:w-1/2">
              <label class="block text-sm font-medium text-slate-300 mb-2">Remarks</label>
              <textarea 
                [(ngModel)]="remarks"
                rows="3"
                class="w-full px-4 py-3 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-teal-500 transition-all"
                placeholder="Any additional notes..."
              ></textarea>
            </div>
            
            <!-- Totals -->
            <div class="w-full md:w-auto bg-[var(--color-bg-hover)]/30 rounded-xl p-6 min-w-[300px]">
              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-slate-400">Total Amount:</span>
                  <span class="text-xl font-bold text-white">{{ totalAmount() | currencyInr }}</span>
                </div>
                <div class="flex justify-between items-center gap-4">
                  <span class="text-slate-400">Deposit:</span>
                  <input 
                    type="number"
                    [ngModel]="deposit()"
                    (ngModelChange)="deposit.set($event)"
                    min="0"
                    class="w-32 px-3 py-2 bg-slate-600/50 border border-slate-500 rounded-lg text-white text-right focus:outline-none focus:border-teal-500"
                  >
                </div>
                <div class="border-t border-slate-600 pt-3 flex justify-between items-center">
                  <span class="text-slate-300 font-medium">Net Payable:</span>
                  <span class="text-2xl font-bold text-teal-400">{{ netPayable() | currencyInr }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-700/50">
            <button 
              (click)="resetForm()"
              class="px-6 py-3 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
            >
              <i class="fas fa-redo mr-2"></i>Reset
            </button>
            <button 
              (click)="saveBill()"
              [disabled]="isSaving() || !isFormValid()"
              class="px-8 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 shadow-lg shadow-teal-500/30 transition-all"
            >
              @if (isSaving()) {
                <i class="fas fa-spinner fa-spin mr-2"></i>Saving...
              } @else {
                <i class="fas fa-save mr-2"></i>{{ billId() ? 'Update Bill' : 'Save Bill' }}
              }
            </button>
          </div>
        </div>
      }

      <!-- Add Customer Modal -->
      <app-modal #customerModal title="Add New Customer" size="sm">
        <form [formGroup]="customerForm" (ngSubmit)="saveCustomer()">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Customer Name *</label>
              <input 
                type="text"
                formControlName="name"
                class="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-all"
                placeholder="Enter name"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Mobile Number *</label>
              <input 
                type="text"
                formControlName="mobile"
                class="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-all"
                placeholder="Enter mobile"
              >
            </div>
          </div>
          
          <div class="flex gap-3 mt-6">
            <button 
              type="button"
              (click)="customerModal.close()"
              class="flex-1 py-3 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              [disabled]="customerForm.invalid || isSavingCustomer()"
              class="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 transition-all"
            >
              @if (isSavingCustomer()) {
                <i class="fas fa-spinner fa-spin mr-2"></i>
              }
              Save
            </button>
          </div>
        </form>
      </app-modal>
    </div>
  `
})
export class NewBillComponent implements OnInit {
  @ViewChild('customerModal') customerModal!: ModalComponent;
  private fb = inject(FormBuilder);
  private customerService = inject(CustomerService);
  private billService = inject(BillService);
  private inventoryService = inject(InventoryService);
  private toastService = inject(ToastService);
  private rentalOrderService = inject(RentalOrderService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  billId = signal<number | null>(null);
  existingBill = signal<Bill | null>(null);

  customers = signal<Customer[]>([]);
  inventoryItems = signal<InventoryItem[]>([]);

  leftItems = signal<ItemEntry[]>([]);
  rightItems = signal<ItemEntry[]>([]);

  isLoading = signal(true);
  isSaving = signal(false);
  isSavingCustomer = signal(false);
  unreturnedItems = signal<RentalOrderItem[]>([]);

  customerForm!: FormGroup;

  // Form fields
  selectedCustomerId: number | null = null;
  billDate = new Date().toISOString().split('T')[0];
  palNumbers: string[] = ['1'];
  billType: 'INVOICE' | 'ESTIMATE' = 'INVOICE';
  paymentStatus: 'DUE' | 'PAID' | 'PARTIAL' = 'DUE';
  deposit = signal(0);
  remarks = '';

  // Computed totals
  totalAmount = computed(() => {
    const leftTotal = this.leftItems().reduce((sum, e) => sum + e.total, 0);
    const rightTotal = this.rightItems().reduce((sum, e) => sum + e.total, 0);
    return leftTotal + rightTotal;
  });

  netPayable = computed(() => {
    return Math.max(0, this.totalAmount() - this.deposit());
  });

  ngOnInit(): void {
    this.customerForm = this.fb.group({
      name: ['', Validators.required],
      mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]]
    });
    this.loadData();
  }

  private loadData(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.billId.set(parseInt(idParam));
    }

    // Load all data in parallel
    this.customerService.getAll().subscribe(c => this.customers.set(c));

    // Load inventory and potentially bill details
    this.inventoryService.getAll().subscribe(items => {
      this.inventoryItems.set(items);

      if (this.billId()) {
        this.billService.getById(this.billId()!).subscribe({
          next: (bill) => {
            this.existingBill.set(bill);
            this.patchForm(bill);
            this.initializeItems(items, bill.items);
            this.isLoading.set(false);
          },
          error: () => {
            this.toastService.error('Failed to load bill details');
            this.router.navigate(['/billing/history']);
          }
        });
      } else {
        this.initializeItems(items);
        this.isLoading.set(false);
      }
    });
  }

  private patchForm(bill: Bill): void {
    this.selectedCustomerId = bill.customerId;
    // Format date properly if needed (assuming YYYY-MM-DD from string or array)
    if (Array.isArray(bill.billDate)) {
      const d = bill.billDate;
      this.billDate = `${d[0]}-${d[1].toString().padStart(2, '0')}-${d[2].toString().padStart(2, '0')}`;
    } else {
      this.billDate = bill.billDate.toString().split('T')[0];
    }
    this.palNumbers = bill.palNumbers ? bill.palNumbers.split(',') : ['1'];
    this.billType = bill.billType;
    this.paymentStatus = bill.paymentStatus;
    this.deposit.set(bill.deposit);
    this.remarks = bill.remarks || '';
  }

  private initializeItems(items: InventoryItem[], billItems?: BillItem[]): void {
    const itemMap = new Map<number, BillItem>();
    if (billItems) {
      billItems.forEach(bi => itemMap.set(bi.itemId, bi));
    }

    const mapToEntry = (item: InventoryItem) => {
      const existing = itemMap.get(item.id);
      return {
        item,
        quantity: existing ? existing.quantity : 0,
        rate: existing ? existing.rate : item.defaultRate,
        total: existing ? (existing.quantity * existing.rate) : 0
      };
    };

    // Calculate split index (halfway point)
    const activeItems = items.filter(i => i.active); // Already sorted by backend
    const half = Math.ceil(activeItems.length / 2);

    // Split into left and right columns
    const leftList = activeItems.slice(0, half);
    const rightList = activeItems.slice(half);

    this.leftItems.set(leftList.map(mapToEntry));
    this.rightItems.set(rightList.map(mapToEntry));
  }



  onCustomerChange(customer: Customer): void {
    if (customer?.id) {
      this.rentalOrderService.getUnreturnedItemsByCustomer(customer.id).subscribe({
        next: (items) => this.unreturnedItems.set(items),
        error: () => this.unreturnedItems.set([])
      });
    } else {
      this.unreturnedItems.set([]);
    }
  }

  updateQuantity(entry: ItemEntry, event: globalThis.Event): void {
    const qty = parseInt((event.target as HTMLInputElement).value) || 0;
    entry.quantity = qty;
    entry.total = qty * entry.rate;
    this.leftItems.update(items => [...items]);
    this.rightItems.update(items => [...items]);
  }

  updateRate(entry: ItemEntry, event: globalThis.Event): void {
    const rate = parseFloat((event.target as HTMLInputElement).value) || 0;
    entry.rate = rate;
    entry.total = entry.quantity * rate;
    this.leftItems.update(items => [...items]);
    this.rightItems.update(items => [...items]);
  }

  isFormValid(): boolean {
    return !!this.selectedCustomerId && !!this.billDate;
  }

  resetForm(): void {
    this.selectedCustomerId = null;
    this.billDate = new Date().toISOString().split('T')[0];
    this.palNumbers = ['1'];
    this.billType = 'INVOICE';
    this.paymentStatus = 'DUE';
    this.deposit.set(0);
    this.remarks = '';
    this.initializeItems(this.inventoryItems());
  }

  saveBill(): void {
    if (!this.isFormValid()) {
      this.toastService.warning('Please fill in all required fields');
      return;
    }

    this.isSaving.set(true);

    // Collect items with quantity > 0
    const allItems = [...this.leftItems(), ...this.rightItems()];
    const billItems: BillItem[] = allItems
      .filter(e => e.quantity > 0)
      .map(e => ({
        itemId: e.item.id,
        quantity: e.quantity,
        rate: e.rate
      }));

    const billRequest: BillRequest = {
      customerId: this.selectedCustomerId!,
      billDate: this.billDate,
      palNumbers: this.palNumbers.join(','),
      billType: this.billType,
      paymentStatus: this.paymentStatus,
      deposit: this.deposit(),
      remarks: this.remarks,
      items: billItems
    };

    if (this.billId()) {
      const updateRequest: BillUpdateRequest = {
        palNumbers: this.palNumbers.join(','),
        billType: this.billType,
        paymentStatus: this.paymentStatus,
        deposit: this.deposit(),
        remarks: this.remarks,
        items: billItems
      };
      // Also need to support event/customer/date updates if backend allows, or create new DTO
      // For now, assuming BillUpdateRequest is what we use, but standard Update usually doesn't change customer/event
      // Let's modify BillUpdateRequest to include these or cast to any if needed, OR just use create semantics but call update

      // Actually, the user asked to change quantity and price. 
      // We should check if backend update supports full update.
      // Looking at BillController.updateBill -> calls billService.updateBill -> takes BillDTO.
      // BillDTO usually contains everything.

      // Let's use the full object cast to BillUpdateRequest (or extend it in our mind)
      // Since TS might complain, let's cast or construct a full object if the interface allows

      // Wait, BillUpdateRequest in frontend only has a few fields. I need to update the model first if I want to send everything.
      // But let's assume for now we use the defined model. If I need to update customer/event, I should add them to BillUpdateRequest.

      // Ideally we should use a consistent DTO. Let's send the full 'BillRequest' structure but call update.

      this.billService.update(this.billId()!, { ...billRequest } as any).subscribe({
        next: (bill) => {
          this.toastService.success(`Bill ${bill.billNumber} updated successfully!`);
          this.router.navigate(['/billing/history']);
        },
        error: () => this.isSaving.set(false),
        complete: () => this.isSaving.set(false)
      });
    } else {
      this.billService.create(billRequest).subscribe({
        next: (bill) => {
          this.toastService.success(`Bill ${bill.billNumber} created successfully!`);
          this.router.navigate(['/billing/history']);
        },
        error: () => this.isSaving.set(false),
        complete: () => this.isSaving.set(false)
      });
    }
  }

  openAddCustomerModal(): void {
    this.customerForm.reset();
    this.customerModal.open();
  }

  saveCustomer(): void {
    if (this.customerForm.invalid) return;

    this.isSavingCustomer.set(true);
    const data = this.customerForm.value;

    this.customerService.create(data).subscribe({
      next: (customer) => {
        this.customers.update(list => [...list, customer]);
        this.selectedCustomerId = customer.id;
        this.customerModal.close();
        this.toastService.success('Customer created successfully');
        this.isSavingCustomer.set(false);
      },
      error: () => this.isSavingCustomer.set(false)
    });
  }
}

