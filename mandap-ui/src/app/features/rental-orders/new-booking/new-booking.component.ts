import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RentalOrderService, CustomerService, InventoryService, ToastService } from '@core/services';
import { RentalOrder, RentalOrderItem, Customer, InventoryItem } from '@core/models';
import { LoadingSpinnerComponent } from '@shared';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-new-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent, NgSelectModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-[var(--color-text-primary)]">{{ isEditMode() ? 'Edit Booking' : 'New Booking' }}</h1>
          <p class="text-[var(--color-text-secondary)] mt-1">
            {{ isEditMode() ? 'Update existing booking details' : 'Create a new rental booking' }}
          </p>
        </div>
        <button
          (click)="goBack()"
          class="px-4 py-2 bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-card)] transition-colors border border-[var(--color-border)] flex items-center gap-2"
        >
          <i class="fas fa-arrow-left"></i> Back to Orders
        </button>
      </div>

      @if (isLoading()) {
        <app-loading-spinner></app-loading-spinner>
      } @else {
        <div class="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-2xl border border-[var(--color-border)] p-6">

          <!-- Customer & Dates -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Customer *</label>
              <ng-select
                [items]="customers()"
                bindLabel="name"
                bindValue="id"
                [(ngModel)]="newOrder.customerId"
                (change)="onCustomerSelect($event)"
                [searchFn]="customerSearchFn"
                [disabled]="isEditMode()"
                placeholder="Search customer by name or mobile..."
                class="custom-select"
              >
                <ng-template ng-option-tmp let-item="item">
                  <div class="flex items-center justify-between w-full">
                    <div class="flex flex-col">
                      <span class="font-medium text-[var(--color-text-primary)]">{{ item.name }}</span>
                      <span class="text-xs text-[var(--color-text-muted)]">{{ item.mobile }}</span>
                    </div>
                    <div class="flex gap-1">
                      @if (item.hasUnbilledOrders) {
                        <span class="px-1.5 py-0.5 bg-amber-500/20 text-amber-500 text-[10px] font-bold rounded uppercase">Active</span>
                      } @else if (item.hasBilledOrders) {
                        <span class="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] font-bold rounded uppercase">History</span>
                      }
                    </div>
                  </div>
                </ng-template>
                <ng-template ng-label-tmp let-item="item">
                  <span class="text-[var(--color-text-primary)]">{{ item.name }} ({{ item.mobile }})</span>
                </ng-template>
              </ng-select>
            </div>
            <div>
              <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Order Date</label>
              <input
                type="date"
                [(ngModel)]="newOrder.orderDate"
                class="w-full px-4 py-3 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Expected Return</label>
              <input
                type="date"
                [(ngModel)]="newOrder.expectedReturnDate"
                class="w-full px-4 py-3 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500"
              >
            </div>
          </div>

          <!-- Remarks -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Remarks</label>
            <textarea
              [(ngModel)]="newOrder.remarks"
              rows="2"
              class="w-full px-4 py-3 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-teal-500 transition-all"
              placeholder="Address, notes, or any additional info..."
            ></textarea>
          </div>

          <!-- Item Selection -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Add Items</label>
            <div class="flex gap-2">
              <div class="flex-1 min-w-0">
                <ng-select
                  [items]="inventoryItems()"
                  bindLabel="nameGujarati"
                  bindValue="id"
                  [(ngModel)]="selectedInventoryItemId"
                  [searchFn]="itemSearchFn"
                  placeholder="Search item by Gujarati or English name..."
                  class="custom-select"
                >
                  <ng-template ng-option-tmp let-item="item">
                    <div class="flex justify-between items-center">
                      <div>
                        <span class="font-medium text-[var(--color-text-primary)]">{{ item.nameGujarati }}</span>
                        <span class="text-[var(--color-text-muted)] ml-1">({{ item.nameEnglish }})</span>
                      </div>
                      <span class="text-sm text-[var(--color-text-muted)]">Avail: {{ item.availableStock - (item.pendingDispatchQty || 0) }}</span>
                    </div>
                  </ng-template>
                  <ng-template ng-label-tmp let-item="item">
                    <span class="text-[var(--color-text-primary)]">{{ item.nameGujarati }} ({{ item.nameEnglish }})</span>
                  </ng-template>
                </ng-select>
              </div>
              <input
                type="number"
                [(ngModel)]="selectedQty"
                min="1"
                placeholder="Qty"
                class="w-24 px-4 py-3 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500"
              >
              <button
                (click)="addItem()"
                class="px-4 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
              >
                <i class="fas fa-plus"></i>
              </button>
            </div>
          </div>

          <!-- Selected Items Table -->
          @if (newOrder.items.length > 0) {
            <div class="border border-[var(--color-border)] rounded-xl overflow-hidden mb-6">
              <table class="w-full">
                <thead class="bg-[var(--color-bg-hover)]/30">
                  <tr>
                    <th class="text-left py-3 px-4 text-[var(--color-text-secondary)] text-sm font-medium">#</th>
                    <th class="text-left py-3 px-4 text-[var(--color-text-secondary)] text-sm font-medium">Item Name</th>
                    <th class="text-left py-3 px-4 text-[var(--color-text-secondary)] text-sm font-medium">English Name</th>
                    <th class="text-center py-3 px-4 text-[var(--color-text-secondary)] text-sm font-medium">Quantity</th>
                    <th class="text-center py-3 px-4 text-[var(--color-text-secondary)] text-sm font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of newOrder.items; track item.inventoryItemId; let i = $index) {
                    <tr class="border-t border-[var(--color-border)]/50 hover:bg-[var(--color-bg-hover)]/30 transition-colors">
                      <td class="py-3 px-4 text-[var(--color-text-muted)]">{{ i + 1 }}</td>
                      <td class="py-3 px-4 text-[var(--color-text-primary)] font-medium">{{ item.itemNameGujarati }}</td>
                      <td class="py-3 px-4 text-[var(--color-text-secondary)]">{{ item.itemNameEnglish }}</td>
                      <td class="py-3 px-4 text-center">
                        <input
                          type="number"
                          [(ngModel)]="item.bookedQty"
                          min="1"
                          class="w-24 px-3 py-2 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg text-center text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500"
                        >
                      </td>
                      <td class="py-3 px-4 text-center">
                        <button (click)="removeItem(i)" class="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                          <i class="fas fa-trash text-xs"></i>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="border border-dashed border-[var(--color-border)] rounded-xl p-8 text-center text-[var(--color-text-muted)] mb-6">
              <i class="fas fa-boxes text-3xl mb-3 opacity-50"></i>
              <p>No items added yet. Use the search above to add items.</p>
            </div>
          }

          <!-- Actions -->
          <div class="flex justify-end gap-4 pt-6 border-t border-[var(--color-border)]">
            <button
              (click)="goBack()"
              class="px-6 py-3 rounded-xl bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)] transition-colors border border-[var(--color-border)]"
            >
              Cancel
            </button>
            @if (isEditMode()) {
              <button
                (click)="deleteBooking()"
                [disabled]="isSaving() || !!newOrder.billId || hasDispatchedItems()"
                class="px-6 py-3 rounded-xl bg-red-500/10 text-red-500 font-semibold hover:bg-red-500/20 transition-all border border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                [title]="!!newOrder.billId ? 'Cannot delete because bill is generated' : (hasDispatchedItems() ? 'Cannot delete because items were dispatched' : '')"
              >
                <i class="fas fa-trash mr-2"></i>Delete
              </button>
            }
            @if (isEditMode() && newOrder.status === 'BOOKED') {
              <button
                (click)="cancelBooking()"
                [disabled]="isSaving() || !!newOrder.billId || hasDispatchedItems()"
                class="px-6 py-3 rounded-xl bg-orange-500/10 text-orange-500 font-semibold hover:bg-orange-500/20 transition-all border border-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                [title]="!!newOrder.billId ? 'Cannot cancel because bill is generated' : (hasDispatchedItems() ? 'Cannot cancel because items are dispatched' : '')"
              >
                <i class="fas fa-ban mr-2"></i>Cancel Booking
              </button>
            }
            <button
              (click)="saveBooking()"
              [disabled]="isSaving() || !newOrder.customerId || newOrder.items.length === 0"
              class="px-8 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 shadow-lg shadow-teal-500/30 transition-all"
            >
              @if (isSaving()) {
                <i class="fas fa-spinner fa-spin mr-2"></i>
              } @else {
                <i class="fas fa-save mr-2"></i>
              }
              {{ isEditMode() ? 'Update Booking' : 'Create Booking' }}
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class NewBookingComponent implements OnInit {
  private rentalOrderService = inject(RentalOrderService);
  private customerService = inject(CustomerService);
  private inventoryService = inject(InventoryService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  customers = signal<Customer[]>([]);
  inventoryItems = signal<InventoryItem[]>([]);

  isLoading = signal(true);
  isSaving = signal(false);
  isEditMode = signal(false);
  orderId = signal<number | null>(null);

  newOrder: RentalOrder = { customerId: 0, orderDate: new Date().toISOString().split('T')[0], items: [] };
  selectedInventoryItemId: number | null = null;
  selectedQty = 1;

  // Custom search functions for ng-select (substring matching)
  customerSearchFn = (term: string, item: Customer) => {
    term = term.toLowerCase();
    return (item.name?.toLowerCase().includes(term) || item.mobile?.toLowerCase().includes(term)) ?? false;
  };

  itemSearchFn = (term: string, item: InventoryItem) => {
    term = term.toLowerCase();
    return (item.nameGujarati?.toLowerCase().includes(term) || item.nameEnglish?.toLowerCase().includes(term)) ?? false;
  };

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.orderId.set(parseInt(idParam));
      this.isEditMode.set(true);
    }

    this.loadData();
  }

  private loadData(): void {
    // Load customers
    this.customerService.getAll().subscribe({
      next: (customers) => this.customers.set(customers)
    });

    // Load inventory items
    this.inventoryService.getAll().subscribe({
      next: (items) => {
        this.inventoryItems.set(items.filter(i => i.active));

        // If editing, load existing order
        if (this.orderId()) {
          this.rentalOrderService.getById(this.orderId()!).subscribe({
            next: (order) => {
              this.newOrder = {
                ...order,
                items: order.items?.map(item => ({
                  inventoryItemId: item.inventoryItemId,
                  itemNameGujarati: item.itemNameGujarati,
                  itemNameEnglish: item.itemNameEnglish,
                  bookedQty: item.bookedQty,
                  dispatchedQty: item.dispatchedQty,
                  returnedQty: item.returnedQty
                })) || []
              };
              this.isLoading.set(false);
            },
            error: () => {
              this.toastService.error('Failed to load booking');
              this.router.navigate(['/rental-orders']);
            }
          });
        } else {
          this.isLoading.set(false);
        }
      }
    });
  }

  onCustomerSelect(customer: Customer): void {
    if (!customer?.id) return;
    this.newOrder.customerId = customer.id;
  }

  addItem(): void {
    if (!this.selectedInventoryItemId || this.selectedQty < 1) return;

    const invItem = this.inventoryItems().find(i => i.id === this.selectedInventoryItemId);
    if (!invItem) return;

    if (this.newOrder.items.find(i => i.inventoryItemId === invItem.id)) {
      this.toastService.error('Item already added');
      return;
    }

    if (this.selectedQty > invItem.availableStock) {
      this.toastService.error(`Only ${invItem.availableStock} available`);
      return;
    }

    this.newOrder.items.push({
      inventoryItemId: invItem.id,
      itemNameGujarati: invItem.nameGujarati,
      itemNameEnglish: invItem.nameEnglish,
      bookedQty: this.selectedQty
    });

    this.selectedInventoryItemId = null;
    this.selectedQty = 1;
  }

  removeItem(index: number): void {
    this.newOrder.items.splice(index, 1);
  }

  saveBooking(): void {
    this.isSaving.set(true);

    if (this.isEditMode() && this.orderId()) {
      this.rentalOrderService.update(this.orderId()!, this.newOrder).subscribe({
        next: () => {
          this.toastService.success('Booking updated successfully');
          this.router.navigate(['/rental-orders']);
          this.isSaving.set(false);
        },
        error: () => {
          this.isSaving.set(false);
        }
      });
    } else {
      this.rentalOrderService.createBooking(this.newOrder).subscribe({
        next: () => {
          this.toastService.success('Booking created successfully');
          this.router.navigate(['/rental-orders']);
          this.isSaving.set(false);
        },
        error: () => {
          this.isSaving.set(false);
        }
      });
    }
  }

  deleteBooking(): void {
    if (!this.orderId()) return;
    if (!confirm('Are you sure you want to delete this booking? This action cannot be undone.')) return;

    this.isSaving.set(true);
    this.rentalOrderService.delete(this.orderId()!).subscribe({
      next: () => {
        this.toastService.success('Booking deleted successfully');
        this.router.navigate(['/rental-orders']);
        this.isSaving.set(false);
      },
      error: () => {
        this.isSaving.set(false);
      }
    });
  }

  cancelBooking(): void {
    if (!this.orderId()) return;
    if (!confirm('Are you sure you want to CANCEL this booking?')) return;

    this.isSaving.set(true);
    this.rentalOrderService.cancelOrder(this.orderId()!).subscribe({
      next: () => {
        this.toastService.success('Booking cancelled successfully');
        this.router.navigate(['/rental-orders']);
        this.isSaving.set(false);
      },
      error: () => {
        this.isSaving.set(false);
      }
    });
  }

  hasDispatchedItems(): boolean {
    return this.newOrder.items?.some(item => (item.dispatchedQty || 0) > 0) ?? false;
  }

  goBack(): void {
    this.router.navigate(['/rental-orders']);
  }
}
