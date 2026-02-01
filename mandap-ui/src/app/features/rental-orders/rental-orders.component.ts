import { Component, OnInit, inject, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { RentalOrderService, CustomerService, InventoryService, ToastService } from '@core/services';
import { RentalOrder, RentalOrderItem, RentalOrderStatus, Customer, InventoryItem } from '@core/models';
import { LoadingSpinnerComponent, ModalComponent } from '@shared';

@Component({
  selector: 'app-rental-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LoadingSpinnerComponent, ModalComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-[var(--color-text-primary)]">Rental Orders</h1>
          <p class="text-[var(--color-text-secondary)] mt-1">Manage bookings, dispatch, and returns</p>
        </div>
        <button 
          (click)="openNewOrderModal()"
          class="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
        >
          <i class="fas fa-plus"></i> New Booking
        </button>
      </div>

      <!-- Status Filter Tabs -->
      <!-- Filters moved to table headers -->

      @if (isLoading()) {
        <app-loading-spinner></app-loading-spinner>
      } @else {
        <div class="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-2xl border border-[var(--color-border)] overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-[var(--color-bg-hover)]/30">
                <tr>
                  <th class="py-3 px-4 text-left align-top min-w-[140px]">
                    <div class="text-[var(--color-text-secondary)] font-medium text-sm mb-2">Order #</div>
                    <input 
                      type="text" 
                      [ngModel]="orderNumberFilter()"
                      (ngModelChange)="orderNumberFilter.set($event)"
                      placeholder="Search..." 
                      class="w-full px-2 py-1 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500"
                    >
                  </th>
                  <th class="py-3 px-4 text-left align-top min-w-[200px]">
                    <div class="text-[var(--color-text-secondary)] font-medium text-sm mb-2">Customer</div>
                    <input 
                      type="text" 
                      [ngModel]="customerFilter()"
                      (ngModelChange)="customerFilter.set($event)"
                      placeholder="Name or Mobile..." 
                      class="w-full px-2 py-1 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500"
                    >
                  </th>
                  <th class="py-3 px-4 text-center align-top text-[var(--color-text-secondary)] font-medium text-sm">Order Date</th>
                  <th class="py-3 px-4 text-center align-top text-[var(--color-text-secondary)] font-medium text-sm">Items</th>
                  <th class="py-3 px-4 text-center align-top min-w-[160px]">
                    <div class="text-[var(--color-text-secondary)] font-medium text-sm mb-2">Status</div>
                    <!-- Simple multiselect simulation for now, or just a dropdown -->
                    <select 
                      [ngModel]="statusFilter()"
                      (ngModelChange)="statusFilter.set($event)"
                      class="w-full px-2 py-1 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500"
                    >
                       <option value="ALL">All Statuses</option>
                       @for (tab of statusOptions; track tab.value) {
                         <option [value]="tab.value">{{ tab.label }}</option>
                       }
                    </select>
                  </th>
                  <th class="py-3 px-4 text-center align-top text-[var(--color-text-secondary)] font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (order of filteredOrders(); track order.id) {
                  <tr class="border-t border-[var(--color-border)]/50 hover:bg-[var(--color-bg-hover)]/50 transition-colors">
                    <td class="py-3 px-4 text-[var(--color-text-primary)] font-mono font-medium">{{ order.orderNumber }}</td>
                    <td class="py-3 px-4">
                      <div class="text-[var(--color-text-primary)]">{{ order.customerName }}</div>
                      <div class="text-xs text-[var(--color-text-muted)]">{{ order.customerMobile }}</div>
                    </td>
                    <td class="py-3 px-4 text-center text-[var(--color-text-secondary)]">{{ order.orderDate }}</td>
                    <td class="py-3 px-4 text-center text-[var(--color-text-secondary)]">{{ order.items.length || 0 }}</td>
                    <td class="py-3 px-4 text-center">
                      <span [class]="getStatusClass(order.status!)" class="px-2.5 py-1 rounded-full text-xs font-medium">
                        {{ order.status }}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-center">
                      <div class="flex justify-center gap-2">
                        <button 
                          (click)="viewOrder(order)"
                          class="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                          title="View Details"
                        >
                          <i class="fas fa-eye text-xs"></i>
                        </button>
                        <button 
                          (click)="editOrder(order)"
                          class="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 transition-colors"
                          title="Edit Order"
                        >
                          <i class="fas fa-edit text-xs"></i>
                        </button>
                        @if (canDispatch(order)) {
                          <button 
                            (click)="openDispatchModal(order)"
                            class="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors"
                            title="Dispatch Items"
                          >
                            <i class="fas fa-truck text-xs"></i>
                          </button>
                        }
                        @if (canReceive(order)) {
                          <button 
                            (click)="openReceiveModal(order)"
                            class="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                            title="Receive Items"
                          >
                            <i class="fas fa-hand-holding text-xs"></i>
                          </button>
                        }
                        @if (!order.billId && order.status !== 'CANCELLED') {
                          <button 
                            (click)="generateBill(order)"
                            class="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                            title="Generate Bill"
                          >
                            <i class="fas fa-file-invoice-dollar text-xs"></i>
                          </button>
                        }
                        <button 
                          (click)="printOrder(order)"
                          class="w-8 h-8 rounded-lg bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 transition-colors"
                          title="Print Order"
                        >
                          <i class="fas fa-print text-xs"></i>
                        </button>
                        <button 
                          (click)="deleteOrder(order)"
                          class="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                          title="Delete Order"
                        >
                          <i class="fas fa-trash text-xs"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="py-8 text-center text-[var(--color-text-muted)]">No rental orders found</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Print Template (Hidden by default, visible on print) -->
      @if (selectedPrintOrder()) {
        <div id="print-section" class="hidden print:block fixed inset-0 bg-white z-[9999] p-8 text-black">
          <!-- Header -->
          <div class="text-center border-b-2 border-gray-800 pb-4 mb-6">
            <h1 class="text-3xl font-bold uppercase tracking-wider mb-2">Mandap Decoration</h1>
          </div>

          <!-- Order Info -->
          <div class="flex justify-between mb-8">
            <div>
              <p class="text-sm text-gray-500">Order No:</p>
              <p class="font-bold text-lg">{{ selectedPrintOrder()?.orderNumber }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm text-gray-500">Date:</p>
              <p class="font-bold">{{ selectedPrintOrder()?.orderDate }}</p>
            </div>
          </div>

          <!-- Customer Info -->
          <div class="mb-8 p-4 border border-gray-200 rounded-lg">
            <h3 class="font-bold border-b border-gray-200 pb-2 mb-2">Customer Details</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-500">Name:</p>
                <p class="font-medium">{{ selectedPrintOrder()?.customerName }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Mobile:</p>
                <p class="font-medium">{{ selectedPrintOrder()?.customerMobile }}</p>
              </div>
              @if (selectedPrintOrder()?.remarks) {
                <div class="col-span-2">
                   <p class="text-sm text-gray-500">Remarks/Address:</p>
                   <p class="font-medium">{{ selectedPrintOrder()?.remarks }}</p>
                </div>
              }
            </div>
          </div>

          <!-- Items Table -->
          <table class="w-full mb-8 text-sm">
            <thead>
              <tr class="border-b-2 border-gray-800">
                <th class="text-left py-2 w-10">#</th>
                <th class="text-left py-2">Item Name</th>
                <th class="text-center py-2">Booked</th>
                <th class="text-center py-2">Disp.</th>
                <th class="text-center py-2">Ret.</th>
                <th class="text-center py-2">Out.</th>
              </tr>
            </thead>
            <tbody>
              @for (item of selectedPrintOrder()?.items; track item.id; let i = $index) {
                <tr class="border-b border-gray-200">
                  <td class="py-2 text-gray-600">{{ i + 1 }}</td>
                  <td class="py-2 font-medium">{{ item.itemNameGujarati || item.itemNameEnglish }}</td>
                  <td class="py-2 text-center">{{ item.bookedQty }}</td>
                  <td class="py-2 text-center text-gray-600">{{ item.dispatchedQty || 0 }}</td>
                  <td class="py-2 text-center text-gray-600">{{ item.returnedQty || 0 }}</td>
                  <td class="py-2 text-center font-bold" [class.text-red-600]="(item.outstandingQty || 0) > 0">{{ item.outstandingQty || 0 }}</td>
                </tr>
              }
            </tbody>
          </table>

          <!-- Footer -->
          <div class="mt-12 pt-4 border-t-2 border-gray-800 flex justify-between items-end">
            <div class="text-center">
              <p class="h-12"></p> <!-- Space for sign -->
              <p class="text-sm font-bold border-t border-gray-400 pt-1 px-8">Customer Signature</p>
            </div>
            <div class="text-center">
              <p class="h-12"></p> <!-- Space for sign -->
              <p class="text-sm font-bold border-t border-gray-400 pt-1 px-8">Authorized Signature</p>
            </div>
          </div>
          
          <div class="text-center text-xs text-gray-400 mt-8">
            <p>Thank you for your business!</p>
          </div>
        </div>
      }


      <!-- New Booking Modal -->
      <app-modal #newOrderModal [title]="isEditMode() ? 'Edit Booking' : 'New Booking'" size="lg">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Customer *</label>
            <select 
              [ngModel]="newOrder.customerId"
              (ngModelChange)="onCustomerChange($event)"
              [disabled]="isEditMode()"
              class="w-full px-4 py-3 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500 disabled:opacity-50"
            >
              <option [ngValue]="null">Select Customer</option>
              @for (customer of customers(); track customer.id) {
                <option [ngValue]="customer.id">{{ customer.name }} ({{ customer.mobile }})</option>
              }
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
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

          <!-- Item Selection -->
          <div>
            <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Add Items</label>
            <div class="flex gap-2">
              <div class="flex-1 min-w-0" title="Select Item">
                <select 
                  [(ngModel)]="selectedInventoryItemId"
                  class="w-full px-4 py-3 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500 truncate"
                >
                  <option [ngValue]="null">Select Item</option>
                  @for (item of inventoryItems(); track item.id) {
                    <option [ngValue]="item.id" [title]="item.nameGujarati + ' (' + item.nameEnglish + ')'">
                      {{ item.nameGujarati }} ({{ item.nameEnglish }}) - Avail: {{ item.availableStock - (item.pendingDispatchQty || 0) }}
                    </option>
                  }
                </select>
              </div>
              <input 
                type="number" 
                [(ngModel)]="selectedQty"
                min="1"
                placeholder="Qty"
                class="w-24 px-4 py-3 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500"
              >
              <button 
                (click)="addItemToNewOrder()"
                class="px-4 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
              >
                <i class="fas fa-plus"></i>
              </button>
            </div>
          </div>

          <!-- Selected Items Table -->
          @if (newOrder.items.length > 0) {
            <div class="border border-[var(--color-border)] rounded-xl overflow-hidden">
              <table class="w-full">
                <thead class="bg-[var(--color-bg-hover)]/30">
                  <tr>
                    <th class="text-left py-2 px-4 text-[var(--color-text-secondary)] text-sm">Item</th>
                    <th class="text-center py-2 px-4 text-[var(--color-text-secondary)] text-sm">Qty</th>
                    <th class="text-center py-2 px-4 text-[var(--color-text-secondary)] text-sm"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of newOrder.items; track item.inventoryItemId; let i = $index) {
                    <tr class="border-t border-[var(--color-border)]/50">
                      <td class="py-2 px-4 text-[var(--color-text-primary)]">{{ item.itemNameGujarati }}</td>
                      <td class="py-2 px-4 text-center">
                        <input 
                          type="number" 
                          [(ngModel)]="item.bookedQty" 
                          min="1" 
                          class="w-20 px-2 py-1 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded text-center text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500"
                        >
                      </td>
                      <td class="py-2 px-4 text-center">
                        <button (click)="removeItemFromNewOrder(i)" class="text-red-400 hover:text-red-300">
                          <i class="fas fa-trash text-xs"></i>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          <div class="flex gap-3 mt-6">
            <button 
              (click)="newOrderModal.close()"
              class="flex-1 py-3 rounded-xl bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)] transition-colors border border-[var(--color-border)]"
            >
              Cancel
            </button>
            @if (isEditMode()) {
              <button 
                (click)="deleteFromModal()"
                class="flex-1 py-3 rounded-xl bg-red-500/10 text-red-500 font-semibold hover:bg-red-500/20 transition-all border border-red-500/20"
              >
                Delete
              </button>
            }
            @if (isEditMode() && newOrder.status === 'BOOKED') {
              <button 
                (click)="cancelOrderFromModal()"
                [disabled]="isSaving()"
                class="flex-1 py-3 rounded-xl bg-orange-500/10 text-orange-500 font-semibold hover:bg-orange-500/20 transition-all border border-orange-500/20"
              >
                Cancel Booking
              </button>
            }
            <button 
              (click)="saveBooking()"
              [disabled]="isSaving() || !newOrder.customerId || newOrder.items.length === 0"
              class="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 transition-all"
            >
              @if (isSaving()) {
                <i class="fas fa-spinner fa-spin mr-2"></i>
              }
              {{ isEditMode() ? 'Update Booking' : 'Create Booking' }}
            </button>
          </div>
        </div>
      </app-modal>

      <!-- Dispatch Modal -->
      <app-modal #dispatchModal title="Dispatch Items" size="lg">
        @if (selectedOrder()) {
          <div class="space-y-4">
            <div class="text-[var(--color-text-secondary)]">
              Order: <span class="text-[var(--color-text-primary)] font-mono">{{ selectedOrder()!.orderNumber }}</span>
            </div>
            <div class="border border-[var(--color-border)] rounded-xl overflow-hidden">
              <table class="w-full">
                <thead class="bg-[var(--color-bg-hover)]/30">
                  <tr>
                    <th class="text-left py-2 px-4 text-[var(--color-text-secondary)] text-sm">Item</th>
                    <th class="text-center py-2 px-4 text-[var(--color-text-secondary)] text-sm">Booked</th>
                    <th class="text-center py-2 px-4 text-[var(--color-text-secondary)] text-sm">Already Disp.</th>
                    <th class="text-center py-2 px-4 text-[var(--color-text-secondary)] text-sm">Remaining</th>
                    <th class="text-center py-2 px-4 text-[var(--color-text-secondary)] text-sm">Dispatch Now</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of dispatchUIItems; track item.inventoryItemId; let i = $index) {
                    <tr class="border-t border-[var(--color-border)]/50">
                      <td class="py-2 px-4 text-[var(--color-text-primary)]">{{ item.itemNameGujarati }}</td>
                      <td class="py-2 px-4 text-center text-[var(--color-text-secondary)]">{{ item.bookedQty }}</td>
                      <td class="py-2 px-4 text-center text-[var(--color-text-secondary)]">{{ item.originalDispatchedQty }}</td>
                      <td class="py-2 px-4 text-center font-medium" [class.text-amber-500]="item.remainingQty > 0" [class.text-green-500]="item.remainingQty === 0">{{ item.remainingQty }}</td>
                      <td class="py-2 px-4 text-center">
                        <input 
                          type="number" 
                          [(ngModel)]="item.toDispatchQty"
                          [attr.max]="item.remainingQty"
                          min="0"
                          class="w-24 px-2 py-1 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded text-center text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500 disabled:opacity-50"
                          [disabled]="item.remainingQty === 0"
                        >
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <div class="flex gap-3 mt-6">
              <button (click)="dispatchModal.close()" class="flex-1 py-3 rounded-xl bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">Cancel</button>
              <button (click)="dispatchOrder()" [disabled]="isSaving() || !canDispatchAny()" class="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold disabled:opacity-50">
                @if (isSaving()) { <i class="fas fa-spinner fa-spin mr-2"></i> }
                Dispatch
              </button>
            </div>
          </div>
        }
      </app-modal>

      <!-- Receive Modal -->
      <app-modal #receiveModal title="Receive Items" size="md">
        @if (selectedOrder()) {
          <div class="space-y-4">
            <div class="text-[var(--color-text-secondary)]">
              Order: <span class="text-[var(--color-text-primary)] font-mono">{{ selectedOrder()!.orderNumber }}</span>
            </div>
            <div class="border border-[var(--color-border)] rounded-xl overflow-hidden">
              <table class="w-full">
                <thead class="bg-[var(--color-bg-hover)]/30">
                  <tr>
                    <th class="text-left py-2 px-4 text-[var(--color-text-secondary)] text-sm">Item</th>
                    <th class="text-center py-2 px-4 text-[var(--color-text-secondary)] text-sm">Booked</th>
                    <th class="text-center py-2 px-4 text-[var(--color-text-secondary)] text-sm">Outstanding</th>
                    <th class="text-center py-2 px-4 text-[var(--color-text-secondary)] text-sm">Return Qty</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of receiveItems; track item.inventoryItemId; let i = $index) {
                    <tr class="border-t border-[var(--color-border)]/50">
                      <td class="py-2 px-4 text-[var(--color-text-primary)]">{{ item.itemNameGujarati }}</td>
                      <td class="py-2 px-4 text-center text-[var(--color-text-secondary)]">{{ item.bookedQty }}</td>
                      <td class="py-2 px-4 text-center text-[var(--color-text-secondary)]">{{ item.outstandingQty }}</td>
                      <td class="py-2 px-4 text-center">
                        <input 
                          type="number" 
                          [(ngModel)]="item.returnedQty"
                          [attr.max]="item.outstandingQty || 0"
                          min="0"
                          class="w-20 px-2 py-1 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded text-center text-[var(--color-text-primary)]"
                        >
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <div class="flex gap-3 mt-6">
              <button (click)="receiveModal.close()" class="flex-1 py-3 rounded-xl bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">Cancel</button>
              <button (click)="receiveOrder()" [disabled]="isSaving()" class="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold disabled:opacity-50">
                @if (isSaving()) { <i class="fas fa-spinner fa-spin mr-2"></i> }
                Receive
              </button>
            </div>
          </div>
        }
      </app-modal>

      <!-- View Order Modal -->
      <app-modal #viewModal title="Order Details" size="lg">
        @if (selectedOrder()) {
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div><span class="text-[var(--color-text-muted)]">Order #:</span> <span class="text-[var(--color-text-primary)] font-mono">{{ selectedOrder()!.orderNumber }}</span></div>
              <div><span class="text-[var(--color-text-muted)]">Status:</span> <span [class]="getStatusClass(selectedOrder()!.status!)" class="px-2 py-0.5 rounded-full text-xs">{{ selectedOrder()!.status }}</span></div>
              <div><span class="text-[var(--color-text-muted)]">Customer:</span> <span class="text-[var(--color-text-primary)]">{{ selectedOrder()!.customerName }}</span></div>
            </div>
            <div class="border border-[var(--color-border)] rounded-xl overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-[var(--color-bg-hover)]/30">
                  <tr>
                    <th class="text-left py-2 px-4 text-[var(--color-text-secondary)]">Item</th>
                    <th class="text-center py-2 px-4 text-[var(--color-text-secondary)]">Booked</th>
                    <th class="text-center py-2 px-4 text-[var(--color-text-secondary)]">Dispatched</th>
                    <th class="text-center py-2 px-4 text-[var(--color-text-secondary)]">Returned</th>
                    <th class="text-center py-2 px-4 text-[var(--color-text-secondary)]">Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of selectedOrder()!.items; track item.inventoryItemId) {
                    <tr class="border-t border-[var(--color-border)]/50">
                      <td class="py-2 px-4 text-[var(--color-text-primary)]">{{ item.itemNameGujarati }}</td>
                      <td class="py-2 px-4 text-center text-[var(--color-text-secondary)]">{{ item.bookedQty }}</td>
                      <td class="py-2 px-4 text-center text-[var(--color-text-secondary)]">{{ item.dispatchedQty }}</td>
                      <td class="py-2 px-4 text-center text-[var(--color-text-secondary)]">{{ item.returnedQty }}</td>
                      <td class="py-2 px-4 text-center font-semibold" [class]="(item.outstandingQty || 0) > 0 ? 'text-red-400' : 'text-green-400'">{{ item.outstandingQty }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      </app-modal>
    </div>
  `
})
export class RentalOrdersComponent implements OnInit {
  @ViewChild('newOrderModal') newOrderModal!: ModalComponent;
  @ViewChild('dispatchModal') dispatchModal!: ModalComponent;
  @ViewChild('receiveModal') receiveModal!: ModalComponent;
  @ViewChild('viewModal') viewModal!: ModalComponent;

  private rentalOrderService = inject(RentalOrderService);
  private customerService = inject(CustomerService);
  private inventoryService = inject(InventoryService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  orders = signal<RentalOrder[]>([]);
  customers = signal<Customer[]>([]);
  inventoryItems = signal<InventoryItem[]>([]);

  statusFilter = signal<string>('ALL');
  orderNumberFilter = signal('');
  customerFilter = signal('');

  isLoading = signal(true);
  isSaving = signal(false);
  selectedOrder = signal<RentalOrder | null>(null);
  selectedPrintOrder = signal<RentalOrder | null>(null);
  isEditMode = signal(false);
  existingOrderId = signal<number | null>(null);

  statusOptions = [
    { label: 'Booked', value: 'BOOKED' },
    { label: 'Dispatched', value: 'DISPATCHED' },
    { label: 'Partially Returned', value: 'PARTIALLY_RETURNED' },
    { label: 'Returned', value: 'RETURNED' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' }
  ];

  filteredOrders = computed(() => {
    let result = this.orders();

    // Status Filter
    const sFilter = this.statusFilter();
    if (sFilter !== 'ALL') {
      result = result.filter(o => o.status === sFilter);
    }

    // Order Number Filter
    const oFilter = this.orderNumberFilter().toLowerCase();
    if (oFilter) {
      result = result.filter(o => o.orderNumber?.toLowerCase().includes(oFilter));
    }

    // Customer Filter
    const cFilter = this.customerFilter().toLowerCase();
    if (cFilter) {
      result = result.filter(o =>
        o.customerName?.toLowerCase().includes(cFilter) ||
        o.customerMobile?.toLowerCase().includes(cFilter)
      );
    }

    return result;
  });

  printOrder(order: RentalOrder) {
    this.selectedPrintOrder.set(order);
    // Determine title for browser print dialog
    const originalTitle = document.title;
    document.title = `RentalOrder_${order.orderNumber}`;

    // Tiny delay to ensure template renders before printing
    setTimeout(() => {
      window.print();
      // Reset after print dialog closes
      document.title = originalTitle;
      this.selectedPrintOrder.set(null);
    }, 100);
  }

  canDispatch(order: RentalOrder): boolean {
    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') return false;
    // Can dispatch if any item has booked > dispatched
    return order.items?.some(i => (i.bookedQty || 0) > (i.dispatchedQty || 0)) || false;
  }

  canReceive(order: RentalOrder): boolean {
    if (order.status === 'BOOKED' || order.status === 'CANCELLED') return false;
    // Can receive if any item has dispatched > returned
    return order.items?.some(i => (i.dispatchedQty || 0) > (i.returnedQty || 0)) || false;
  }

  // New order form
  newOrder: RentalOrder = { customerId: 0, items: [] };
  selectedInventoryItemId: number | null = null;
  selectedQty = 1;

  // Dispatch/Receive items
  // Dispatch/Receive items
  dispatchUIItems: any[] = [];
  receiveItems: RentalOrderItem[] = [];

  ngOnInit(): void {
    this.loadOrders();
    this.loadCustomers();
    this.loadInventory();
  }

  loadOrders(): void {
    this.rentalOrderService.getAll().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadCustomers(): void {
    this.customerService.getAll().subscribe({
      next: (customers) => this.customers.set(customers)
    });
  }

  loadInventory(): void {
    this.inventoryService.getAll().subscribe({
      next: (items) => this.inventoryItems.set(items.filter(i => i.active))
    });
  }

  setStatusFilter(status: RentalOrderStatus | 'ALL'): void {
    this.statusFilter.set(status);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'BOOKED': return 'bg-blue-500/20 text-blue-400';
      case 'DISPATCHED': return 'bg-orange-500/20 text-orange-400';
      case 'PARTIALLY_RETURNED': return 'bg-yellow-500/20 text-yellow-400';
      case 'RETURNED': return 'bg-green-500/20 text-green-400';
      case 'COMPLETED': return 'bg-slate-500/20 text-slate-400';
      case 'CANCELLED': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  }

  openNewOrderModal(): void {
    this.newOrder = { customerId: 0, orderDate: new Date().toISOString().split('T')[0], items: [] };
    this.selectedInventoryItemId = null;
    this.selectedQty = 1;
    this.isEditMode.set(false);
    this.existingOrderId.set(null);
    this.newOrderModal.open();
  }

  onCustomerChange(customerId: number): void {
    this.newOrder.customerId = customerId;

    if (!customerId) return;

    // Check for existing active order
    const existingOrder = this.orders().find(o =>
      o.customerId === customerId &&
      o.status !== 'COMPLETED' &&
      o.status !== 'CANCELLED'
    );

    if (existingOrder) {
      this.isEditMode.set(true);
      this.existingOrderId.set(existingOrder.id!);

      // Populate form with existing order data
      this.newOrder = {
        ...existingOrder,
        items: existingOrder.items?.map(item => ({
          inventoryItemId: item.inventoryItemId,
          itemNameGujarati: item.itemNameGujarati,
          itemNameEnglish: item.itemNameEnglish,
          bookedQty: item.bookedQty
        })) || []
      };

      this.toastService.info('Customer has an active order. Switched to Edit mode.');
    } else {
      this.isEditMode.set(false);
      this.existingOrderId.set(null);
      // Keep customerId but reset other fields if needed, or just keep as new
    }
  }

  addItemToNewOrder(): void {
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

  removeItemFromNewOrder(index: number): void {
    this.newOrder.items.splice(index, 1);
  }

  saveBooking(): void {
    this.isSaving.set(true);

    if (this.isEditMode() && this.existingOrderId()) {
      this.rentalOrderService.update(this.existingOrderId()!, this.newOrder).subscribe({
        next: () => {
          this.toastService.success('Booking updated successfully');
          this.newOrderModal.close();
          this.loadOrders();
          this.isSaving.set(false);
        },
        error: (err: any) => {
          this.isSaving.set(false);
        }
      });
    } else {
      this.rentalOrderService.createBooking(this.newOrder).subscribe({
        next: () => {
          this.toastService.success('Booking created successfully');
          this.newOrderModal.close();
          this.loadOrders();
          this.isSaving.set(false);
        },
        error: (err: any) => {
          this.isSaving.set(false);
        }
      });
    }
  }

  viewOrder(order: RentalOrder): void {
    this.selectedOrder.set(order);
    this.viewModal.open();
  }

  generateBill(order: RentalOrder): void {
    // Navigate to new bill page with rental order ID
    // We use matrix params or query params. Using matrix params (semicolon) for simplicity with route params logic
    this.router.navigate(['/billing/new', { rentalOrderId: order.id }]);
  }

  openDispatchModal(order: RentalOrder): void {
    this.selectedOrder.set(order);
    this.dispatchUIItems = order.items.map(i => ({
      ...i,
      originalDispatchedQty: i.dispatchedQty || 0,
      remainingQty: (i.bookedQty || 0) - (i.dispatchedQty || 0),
      toDispatchQty: (i.bookedQty || 0) - (i.dispatchedQty || 0) // Default to remaining
    }));
    this.dispatchModal.open();
  }

  canDispatchAny(): boolean {
    return this.dispatchUIItems.some(i => i.toDispatchQty > 0);
  }

  dispatchOrder(): void {
    if (!this.selectedOrder()) return;

    // Filter items with > 0 dispatch qty
    const itemsToDispatch = this.dispatchUIItems
      .filter(i => i.toDispatchQty > 0)
      .map(i => ({
        inventoryItemId: i.inventoryItemId,
        dispatchedQty: i.toDispatchQty, // Send DELTA
        bookedQty: i.bookedQty // Required by DTO usually
      } as RentalOrderItem));

    if (itemsToDispatch.length === 0) {
      this.toastService.warning('Please enter quantity to dispatch for at least one item');
      return;
    }

    this.isSaving.set(true);
    this.rentalOrderService.dispatchItems(this.selectedOrder()!.id!, itemsToDispatch).subscribe({
      next: () => {
        this.toastService.success('Items dispatched successfully');
        this.dispatchModal.close();
        this.loadOrders();
        this.loadInventory();
        this.isSaving.set(false);
      },
      error: (err: any) => {
        this.isSaving.set(false);
      }
    });
  }

  openReceiveModal(order: RentalOrder): void {
    this.selectedOrder.set(order);
    this.receiveItems = order.items
      .filter(i => (i.outstandingQty || 0) > 0)
      .map(i => ({ ...i, returnedQty: i.outstandingQty }));
    this.receiveModal.open();
  }

  receiveOrder(): void {
    if (!this.selectedOrder()) return;
    this.isSaving.set(true);
    this.rentalOrderService.receiveItems(this.selectedOrder()!.id!, this.receiveItems).subscribe({
      next: () => {
        this.toastService.success('Items received');
        this.receiveModal.close();
        this.loadOrders();
        this.loadInventory();
        this.isSaving.set(false);
      },
      error: (err: any) => {
        this.isSaving.set(false);
      }
    });
  }

  editOrder(order: RentalOrder): void {
    this.isEditMode.set(true);
    this.existingOrderId.set(order.id!);

    this.newOrder = {
      ...order,
      items: order.items?.map(item => ({
        inventoryItemId: item.inventoryItemId,
        itemNameGujarati: item.itemNameGujarati,
        itemNameEnglish: item.itemNameEnglish,
        bookedQty: item.bookedQty
      })) || []
    };

    this.newOrderModal.open();
  }

  deleteOrder(order: RentalOrder): void {
    if (!confirm(`Are you sure you want to delete order ${order.orderNumber}?`)) return;

    this.rentalOrderService.delete(order.id!).subscribe({
      next: () => {
        this.toastService.success('Order deleted successfully');
        this.loadOrders();
      },
      error: (err: any) => {
        // Handled by interceptor
      }
    });
  }

  deleteFromModal(): void {
    if (!this.existingOrderId()) return;

    // Use window.confirm for now as requested
    if (!confirm('Are you sure you want to delete this booking? This action cannot be undone.')) return;

    this.isSaving.set(true);
    this.rentalOrderService.delete(this.existingOrderId()!).subscribe({
      next: () => {
        this.toastService.success('Order deleted successfully');
        this.newOrderModal.close();
        this.loadOrders();
        this.isSaving.set(false);
      },
      error: (err) => {
        this.isSaving.set(false);
      }
    });
  }

  cancelOrderFromModal(): void {
    if (!this.existingOrderId()) return;

    if (!confirm('Are you sure you want to CANCEL this booking?')) return;

    this.isSaving.set(true);
    this.rentalOrderService.cancelOrder(this.existingOrderId()!).subscribe({
      next: () => {
        this.toastService.success('Order cancelled successfully');
        this.newOrderModal.close();
        this.loadOrders();
        this.isSaving.set(false);
      },
      error: (err: any) => {
        this.isSaving.set(false);
      }
    });
  }
}
