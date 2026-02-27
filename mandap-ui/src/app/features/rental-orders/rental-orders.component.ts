import { Component, OnInit, inject, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { RentalOrderService, ToastService } from '@core/services';
import { RentalOrder, RentalOrderItem, RentalOrderStatus } from '@core/models';
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
          (click)="navigateToNewBooking()"
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
                    <div class="flex items-center gap-2 mb-2 cursor-pointer group" (click)="onSort('orderNumber')">
                      <div class="text-[var(--color-text-secondary)] font-medium text-sm group-hover:text-[var(--color-text-primary)] transition-colors">Order #</div>
                      @if (sortColumn() === 'orderNumber') {
                        <i [class]="sortDirection() === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'" class="text-xs text-teal-500"></i>
                      } @else {
                        <i class="fas fa-sort text-xs text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"></i>
                      }
                    </div>
                    <input 
                      type="text" 
                      [ngModel]="orderNumberFilter()"
                      (ngModelChange)="orderNumberFilter.set($event)"
                      placeholder="Search..." 
                      class="w-full px-2 py-1 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500"
                    >
                  </th>
                  <th class="py-3 px-4 text-left align-top min-w-[200px]">
                    <div class="flex items-center gap-2 mb-2 cursor-pointer group" (click)="onSort('customerName')">
                      <div class="text-[var(--color-text-secondary)] font-medium text-sm group-hover:text-[var(--color-text-primary)] transition-colors">Customer</div>
                       @if (sortColumn() === 'customerName') {
                        <i [class]="sortDirection() === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'" class="text-xs text-teal-500"></i>
                      } @else {
                        <i class="fas fa-sort text-xs text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"></i>
                      }
                    </div>
                    <input 
                      type="text" 
                      [ngModel]="customerFilter()"
                      (ngModelChange)="customerFilter.set($event)"
                      placeholder="Name or Mobile..." 
                      class="w-full px-2 py-1 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500"
                    >
                  </th>
                  <th class="py-3 px-4 text-left align-top min-w-[140px]">
                    <div class="flex items-center gap-2 mb-2 cursor-pointer group" (click)="onSort('palNumber')">
                      <div class="text-[var(--color-text-secondary)] font-medium text-sm group-hover:text-[var(--color-text-primary)] transition-colors">Pal #</div>
                       @if (sortColumn() === 'palNumber') {
                        <i [class]="sortDirection() === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'" class="text-xs text-teal-500"></i>
                      } @else {
                        <i class="fas fa-sort text-xs text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"></i>
                      }
                    </div>
                    <input 
                      type="text" 
                      [ngModel]="palNumberFilter()"
                      (ngModelChange)="palNumberFilter.set($event)"
                      placeholder="Search..." 
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
                    <td class="py-3 px-4">
                      @if (order.customerPalNumbers?.length) {
                         <div class="flex flex-wrap gap-1">
                           @for (pal of order.customerPalNumbers; track pal) {
                             <span class="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300">{{ pal }}</span>
                           }
                         </div>
                       } @else {
                         <span class="text-[var(--color-text-muted)]">-</span>
                       }
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
                          (click)="viewHistory(order)"
                          class="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors"
                          title="View History"
                        >
                          <i class="fas fa-history text-xs"></i>
                        </button>
                        <button 
                          (click)="navigateToEdit(order)"
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
                        @if (order.billId) {
                          <div class="relative">
                            <button 
                              (click)="viewBill(order)"
                              class="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                              title="View Bill"
                            >
                              <i class="fas fa-file-invoice-dollar text-xs"></i>
                            </button>
                            @if (order.billOutOfSync) {
                              <span 
                                class="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border border-[var(--color-bg-card)] animate-pulse cursor-help"
                                title="Order was modified after bill was generated. Please update the bill."
                              ></span>
                            }
                          </div>
                        } @else if (order.status !== 'CANCELLED') {
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
                    <td colspan="8" class="py-8 text-center text-[var(--color-text-muted)]">No rental orders found</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Dispatch Modal -->
      <app-modal #dispatchModal title="Dispatch Items" size="lg">
        @if (selectedOrder()) {
          <div class="space-y-4">
            <div class="text-[var(--color-text-secondary)]">
              Order: <span class="text-[var(--color-text-primary)] font-mono">{{ selectedOrder()!.orderNumber }}</span>
            </div>
            <div class="border border-[var(--color-border)] rounded-xl overflow-hidden">
              <div class="grid grid-cols-2 gap-4 p-4 bg-[var(--color-bg-hover)]/30 border-b border-[var(--color-border)]">
                <div>
                   <label class="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Dispatch Voucher No</label>
                   <input 
                     type="text" 
                     [ngModel]="dispatchVoucherNumber()"
                     (ngModelChange)="dispatchVoucherNumber.set($event)"
                     placeholder="Enter voucher no"
                     class="w-full px-3 py-2 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500"
                   >
                </div>
                <div>
                   <label class="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Vehicle Number</label>
                   <input 
                     type="text" 
                     [ngModel]="dispatchVehicleNumber()"
                     (ngModelChange)="dispatchVehicleNumber.set($event)"
                     placeholder="Enter vehicle no"
                     class="w-full px-3 py-2 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500"
                   >
                </div>
              </div>
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
              <div class="grid grid-cols-2 gap-4 p-4 bg-[var(--color-bg-hover)]/30 border-b border-[var(--color-border)]">
                <div>
                   <label class="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Return Voucher No</label>
                   <input 
                     type="text" 
                     [ngModel]="returnVoucherNumber()"
                     (ngModelChange)="returnVoucherNumber.set($event)"
                     placeholder="Enter voucher no"
                     class="w-full px-3 py-2 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500"
                   >
                </div>
                <div>
                   <label class="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Vehicle Number</label>
                   <input 
                     type="text" 
                     [ngModel]="returnVehicleNumber()"
                     (ngModelChange)="returnVehicleNumber.set($event)"
                     placeholder="Enter vehicle no"
                     class="w-full px-3 py-2 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500"
                   >
                </div>
              </div>
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
              @if (selectedOrder()?.customerPalNumbers?.length) {
                <div><span class="text-[var(--color-text-muted)]">Pal No(s):</span> <span class="text-[var(--color-text-primary)]">{{ selectedOrder()!.customerPalNumbers!.join(', ') }}</span></div>
              }
            </div>
            @if (selectedOrder()?.billOutOfSync) {
              <div class="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-sm">
                <i class="fas fa-exclamation-triangle text-amber-500"></i>
                <span class="text-amber-400">This order was modified after the bill was generated. Please <a (click)="viewBill(selectedOrder()!); viewModal.close()" class="underline font-semibold cursor-pointer hover:text-amber-300">update the bill</a> to reflect the latest changes.</span>
              </div>
            }
            <div class="flex border-b border-[var(--color-border)] mb-4">
               <button 
                 (click)="showHistory.set(false)"
                 [class.border-teal-500]="!showHistory()"
                 [class.text-teal-500]="!showHistory()"
                 class="px-4 py-2 border-b-2 border-transparent hover:text-teal-400 transition-colors font-medium text-sm"
               >
                 Items Summary
               </button>
               <button 
                 (click)="showHistory.set(true)"
                 [class.border-teal-500]="showHistory()"
                 [class.text-teal-500]="showHistory()"
                 class="px-4 py-2 border-b-2 border-transparent hover:text-teal-400 transition-colors font-medium text-sm"
               >
                 Transaction History
               </button>
            </div>

            @if (!showHistory()) {
                <div class="border border-[var(--color-border)] rounded-xl overflow-hidden">
                  <table class="w-full text-sm">
                    <thead class="bg-[var(--color-bg-hover)]/30">
                      <tr>
                        <th class="text-left py-2 px-4 text-[var(--color-text-secondary)]">Item</th>
                        <th class="text-center py-2 px-4 text-[var(--color-text-secondary)]">Booked</th>
                        <th class="text-center py-2 px-4 text-[var(--color-text-secondary)]">Dispatched</th>
                        <th class="text-center py-2 px-4 text-[var(--color-text-secondary)]">Pend. Dispatch</th>
                        <th class="text-center py-2 px-4 text-[var(--color-text-secondary)]">Returned</th>
                        <th class="text-center py-2 px-4 text-[var(--color-text-secondary)]">Pend. Return</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of selectedOrder()!.items; track item.inventoryItemId) {
                        <tr class="border-t border-[var(--color-border)]/50">
                          <td class="py-2 px-4 text-[var(--color-text-primary)]">{{ item.itemNameGujarati }}</td>
                          <td class="py-2 px-4 text-center text-[var(--color-text-secondary)]">{{ item.bookedQty }}</td>
                          <td class="py-2 px-4 text-center text-[var(--color-text-secondary)]">{{ item.dispatchedQty }}</td>
                          <td class="py-2 px-4 text-center text-[var(--color-text-secondary)]" [class.font-medium]="(item.bookedQty - (item.dispatchedQty || 0)) > 0">{{ item.bookedQty - (item.dispatchedQty || 0) }}</td>
                          <td class="py-2 px-4 text-center text-[var(--color-text-secondary)]">{{ item.returnedQty }}</td>
                          <td class="py-2 px-4 text-center font-semibold" [class]="(item.outstandingQty || 0) > 0 ? 'text-red-400' : 'text-green-400'">{{ item.outstandingQty }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
            } @else {
                <div class="space-y-4">
                  @if (selectedOrder()?.transactions?.length) {
                    @for (trans of selectedOrder()!.transactions; track trans.id) {
                      <div class="border border-[var(--color-border)] rounded-xl overflow-hidden">
                        <div class="bg-[var(--color-bg-hover)]/30 px-4 py-3 flex justify-between items-center">
                          <div class="flex items-center gap-3">
                             <span [class]="trans.type === 'DISPATCH' ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'" class="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">{{ trans.type }}</span>
                             <span class="text-sm font-medium text-[var(--color-text-primary)]">{{ trans.transactionDate }}</span>
                          </div>
                          <div class="flex gap-4 text-sm text-[var(--color-text-secondary)]">
                            <div><span class="text-[var(--color-text-muted)]">Voucher:</span> {{ trans.voucherNumber || '-' }}</div>
                            <div><span class="text-[var(--color-text-muted)]">Vehicle:</span> {{ trans.vehicleNumber || '-' }}</div>
                          </div>
                        </div>
                        <table class="w-full text-sm">
                           <thead class="bg-[var(--color-bg-input)]/30">
                             <tr>
                               <th class="text-left py-1.5 px-4 text-[var(--color-text-muted)] font-normal">Item</th>
                               <th class="text-center py-1.5 px-4 text-[var(--color-text-muted)] font-normal">Quantity</th>
                             </tr>
                           </thead>
                           <tbody class="divide-y divide-[var(--color-border)]/30">
                             @for (item of trans.items; track item.inventoryItemId) {
                               <tr>
                                 <td class="py-1.5 px-4 text-[var(--color-text-secondary)]">{{ item.itemNameGujarati }}</td>
                                 <td class="py-1.5 px-4 text-center text-[var(--color-text-primary)] font-medium">{{ item.bookedQty }}</td>
                               </tr>
                             }
                           </tbody>
                        </table>
                      </div>
                    }
                  } @else {
                    <div class="text-center py-8 text-[var(--color-text-muted)]">No transaction history found.</div>
                  }
                </div>
            }
          </div>
        }
      </app-modal>

    </div>
  `
})
export class RentalOrdersComponent implements OnInit {
  @ViewChild('dispatchModal') dispatchModal!: ModalComponent;
  @ViewChild('receiveModal') receiveModal!: ModalComponent;
  @ViewChild('viewModal') viewModal!: ModalComponent;

  private rentalOrderService = inject(RentalOrderService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  orders = signal<RentalOrder[]>([]);

  showHistory = signal(false);

  isLoading = signal(true);
  isSaving = signal(false);
  selectedOrder = signal<RentalOrder | null>(null);


  statusOptions = [
    { label: 'Booked', value: 'BOOKED' },
    { label: 'Dispatched', value: 'DISPATCHED' },
    { label: 'Partially Returned', value: 'PARTIALLY_RETURNED' },
    { label: 'Returned', value: 'RETURNED' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' }
  ];

  orderNumberFilter = signal('');
  customerFilter = signal('');
  statusFilter = signal<'ALL' | RentalOrderStatus>('ALL');
  palNumberFilter = signal('');
  sortColumn = signal<string | null>(null);
  sortDirection = signal<'asc' | 'desc'>('asc');

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

    // Pal Number Filter
    const pFilter = this.palNumberFilter().toLowerCase();
    if (pFilter) {
      result = result.filter(o =>
        o.customerPalNumbers?.some(p => p.toLowerCase().includes(pFilter))
      );
    }

    // Sorting
    const col = this.sortColumn();
    const dir = this.sortDirection();
    if (col) {
      result = [...result].sort((a, b) => {
        let valA: any = '';
        let valB: any = '';

        if (col === 'palNumber') {
          valA = a.customerPalNumbers?.[0] || '';
          valB = b.customerPalNumbers?.[0] || '';
        } else if (col === 'orderNumber') {
          valA = a.orderNumber || '';
          valB = b.orderNumber || '';
        } else if (col === 'customerName') {
          valA = a.customerName || '';
          valB = b.customerName || '';
        }

        // Helper for numeric/string compare
        if (valA < valB) return dir === 'asc' ? -1 : 1;
        if (valA > valB) return dir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  });

  printOrder(order: RentalOrder) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order - ${order.orderNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #008080; padding-bottom: 10px; margin-bottom: 20px; }
          .header h1 { color: #008080; margin: 0; }
          .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
          th { background: #008080; color: white; padding: 10px; text-align: left; }
          td { border-bottom: 1px solid #ddd; padding: 8px; }
          @media print { body { padding: 0; } }
          
          .signature-section { display: flex; justify-content: space-between; margin-top: 60px; border-top: 1px solid #ccc; padding-top: 20px; }
          .signature-box { text-align: center; width: 200px; }
          .signature-line { border-top: 1px solid #555; margin-top: 60px; padding-top: 5px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ફાગણ સુદ ૧૩</h1>
          <p>Mandap Contractor - Rental Challan</p>
        </div>
        <div class="info">
          <div>
            <p><strong>Order No:</strong> ${order.orderNumber}</p>
            <p><strong>Customer:</strong> ${order.customerName}</p>
            <p><strong>Mobile:</strong> ${order.customerMobile}</p>
            ${order.customerPalNumbers && order.customerPalNumbers.length > 0 ? `<p><strong>Pal No(s):</strong> ${order.customerPalNumbers.join(', ')}</p>` : ''}
            ${order.remarks ? `<p><strong>Remarks:</strong> ${order.remarks}</p>` : ''}
          </div>
          <div>
            <p><strong>Order Date:</strong> ${order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-IN') : '-'}</p>
            <p><strong>Expected Return:</strong> ${order.expectedReturnDate ? new Date(order.expectedReturnDate).toLocaleDateString('en-IN') : '-'}</p>
            <p><strong>Status:</strong> ${order.status}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 30px; text-align: left;">#</th>
              <th style="text-align: left;">Item</th>
              <th style="text-align: center; width: 60px;">Booked</th>
              <th style="text-align: center; width: 80px;">Dispatched</th>
              <th style="text-align: center; width: 80px;">Pending</th>
              <th style="text-align: center; width: 80px;">Returned</th>
              <th style="text-align: center; width: 90px;">Outstanding</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map((item, i) => `
              <tr>
                <td>${i + 1}</td>
                <td style="font-weight: bold;">${item.itemNameGujarati || item.itemNameEnglish}</td>
                <td style="text-align: center;">${item.bookedQty}</td>
                <td style="text-align: center; color: #555;">${item.dispatchedQty || 0}</td>
                <td style="text-align: center; ${((item.bookedQty - (item.dispatchedQty || 0)) > 0) ? 'font-weight: bold;' : ''}">${item.bookedQty - (item.dispatchedQty || 0)}</td>
                <td style="text-align: center; color: #555;">${item.returnedQty || 0}</td>
                <td style="text-align: center; border-right: none; ${((item.outstandingQty || 0) > 0) ? 'font-weight: bold; color: #dc2626;' : ''}">${item.outstandingQty || 0}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line">Customer Signature</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Authorized Signature</div>
          </div>
        </div>

        <script>window.print();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  onSort(column: string) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
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

  // Dispatch/Receive items
  dispatchUIItems: any[] = [];
  receiveItems: RentalOrderItem[] = [];

  dispatchVoucherNumber = signal('');
  dispatchVehicleNumber = signal('');
  returnVoucherNumber = signal('');
  returnVehicleNumber = signal('');

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['customerName']) {
        this.customerFilter.set(params['customerName']);
      }
    });
    this.loadOrders();
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

  navigateToNewBooking(): void {
    this.router.navigate(['/rental-orders/new']);
  }

  navigateToEdit(order: RentalOrder): void {
    this.router.navigate(['/rental-orders/edit', order.id]);
  }



  viewOrder(order: RentalOrder): void {
    this.selectedOrder.set(order);
    this.showHistory.set(false);
    this.viewModal.open();
  }

  viewHistory(order: RentalOrder): void {
    console.log('Viewing history for order:', order);
    console.log('Transactions:', order.transactions);
    this.selectedOrder.set(order);
    this.showHistory.set(true);
    this.viewModal.open();
  }

  generateBill(order: RentalOrder): void {
    // Navigate to new bill page with rental order ID
    // We use matrix params or query params. Using matrix params (semicolon) for simplicity with route params logic
    this.router.navigate(['/billing/new', { rentalOrderId: order.id }]);
  }

  viewBill(order: RentalOrder): void {
    if (order.billId) {
      this.router.navigate(['/billing/edit', order.billId]);
    }
  }

  openDispatchModal(order: RentalOrder): void {
    this.selectedOrder.set(order);
    this.dispatchVoucherNumber.set('');
    this.dispatchVehicleNumber.set('');
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
    const order = this.selectedOrder();
    if (!order) return;

    this.isSaving.set(true);

    const itemsToDispatch = this.dispatchUIItems
      .filter(i => i.toDispatchQty > 0)
      .map(i => ({
        inventoryItemId: i.inventoryItemId,
        dispatchedQty: i.toDispatchQty,
        bookedQty: 0, // Ignored by backend
        returnedQty: 0
      } as RentalOrderItem));

    const transaction = {
      rentalOrderId: order.id,
      type: 'DISPATCH' as const,
      voucherNumber: this.dispatchVoucherNumber(),
      vehicleNumber: this.dispatchVehicleNumber(),
      items: itemsToDispatch
    };

    this.rentalOrderService.dispatchItems(order.id!, transaction).subscribe({
      next: () => {
        this.toastService.success('Items dispatched successfully');
        this.dispatchModal.close();
        this.loadOrders();
        this.isSaving.set(false);
      },
      error: (err) => {
        console.error('Dispatch error', err);
        // Toast handled by interceptor ideally, or add here if needed
        this.isSaving.set(false);
      }
    });
  }

  openReceiveModal(order: RentalOrder): void {
    this.selectedOrder.set(order);
    this.returnVoucherNumber.set('');
    this.returnVehicleNumber.set('');

    // Prepare items for receive UI (only dispatched items)
    this.receiveItems = order.items
      .filter(item => (item.dispatchedQty || 0) > (item.returnedQty || 0))
      .map(item => ({
        ...item,
        returnedQty: 0 // Default to 0
      }));

    this.receiveModal.open();
  }

  receiveOrder(): void {
    const order = this.selectedOrder();
    if (!order) return;

    this.isSaving.set(true);

    const itemsToReturn = this.receiveItems
      .filter(i => (i.returnedQty || 0) > 0);

    const transaction = {
      rentalOrderId: order.id,
      type: 'RETURN' as const,
      voucherNumber: this.returnVoucherNumber(),
      vehicleNumber: this.returnVehicleNumber(),
      items: itemsToReturn
    };

    this.rentalOrderService.receiveItems(order.id!, transaction).subscribe({
      next: () => {
        this.toastService.success('Items received successfully');
        this.receiveModal.close();
        this.loadOrders();
        this.isSaving.set(false);
      },
      error: (err) => {
        console.error('Receive error', err);
        this.isSaving.set(false);
      }
    });
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
}
