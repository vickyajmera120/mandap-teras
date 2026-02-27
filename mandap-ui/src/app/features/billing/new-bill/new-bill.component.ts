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
  orderQty?: number; // Quantity from linked rental order
}

interface CustomItemEntry {
  name: string;
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
                  <div class="flex items-center gap-3 rounded-lg p-3 border transition-colors duration-200"
                       [ngClass]="{
                         'bg-[var(--color-bg-input)] border-[var(--color-border)]': entry.quantity === 0 && !(entry.orderQty != null && entry.orderQty !== entry.quantity),
                         'bg-teal-900/20 border-teal-500/50': entry.quantity > 0 && !(entry.orderQty != null && entry.orderQty !== entry.quantity),
                         'bg-amber-900/20 border-amber-500/50': entry.orderQty != null && entry.orderQty !== entry.quantity
                       }">
                    <span class="flex-1 text-[var(--color-text-primary)] font-medium"
                          [class.text-teal-300]="entry.quantity > 0 && !(entry.orderQty != null && entry.orderQty !== entry.quantity)"
                          [class.text-amber-300]="entry.orderQty != null && entry.orderQty !== entry.quantity">{{ entry.item.nameGujarati }}</span>
                    <div class="relative">
                      <input 
                        type="number"
                        [value]="entry.quantity"
                        (input)="updateQuantity(entry, $event)"
                        min="0"
                        class="w-20 px-3 py-2 bg-[var(--color-bg-hover)]/50 border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] text-center focus:outline-none focus:border-teal-500 transition-colors"
                        [class.border-teal-500]="entry.quantity > 0 && !(entry.orderQty != null && entry.orderQty !== entry.quantity)"
                        [class.border-amber-500]="entry.orderQty != null && entry.orderQty !== entry.quantity"
                        placeholder="Qty"
                      >
                      @if (entry.orderQty != null && entry.orderQty !== entry.quantity) {
                        <span class="absolute -top-2 -right-2 px-1.5 py-0.5 bg-amber-500 text-black text-[10px] font-bold rounded-full leading-none" 
                              [title]="'Order qty: ' + entry.orderQty">{{ entry.orderQty }}</span>
                      }
                    </div>
                    <input 
                      type="number"
                      [value]="entry.rate"
                      readonly
                      class="w-24 px-3 py-2 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)] text-center cursor-not-allowed focus:outline-none"
                    >
                    <span class="w-24 text-right font-medium whitespace-nowrap"
                          [class.text-teal-400]="entry.quantity > 0"
                          [class.text-slate-500]="entry.quantity === 0">{{ entry.total | currencyInr }}</span>
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
                  <div class="flex items-center gap-3 rounded-lg p-3 border transition-colors duration-200"
                       [ngClass]="{
                         'bg-[var(--color-bg-input)] border-[var(--color-border)]': entry.quantity === 0 && !(entry.orderQty != null && entry.orderQty !== entry.quantity),
                         'bg-teal-900/20 border-teal-500/50': entry.quantity > 0 && !(entry.orderQty != null && entry.orderQty !== entry.quantity),
                         'bg-amber-900/20 border-amber-500/50': entry.orderQty != null && entry.orderQty !== entry.quantity
                       }">
                    <span class="flex-1 text-[var(--color-text-primary)] font-medium"
                          [class.text-teal-300]="entry.quantity > 0 && !(entry.orderQty != null && entry.orderQty !== entry.quantity)"
                          [class.text-amber-300]="entry.orderQty != null && entry.orderQty !== entry.quantity">{{ entry.item.nameGujarati }}</span>
                    <div class="relative">
                      <input 
                        type="number"
                        [value]="entry.quantity"
                        (input)="updateQuantity(entry, $event)"
                        min="0"
                        class="w-20 px-3 py-2 bg-[var(--color-bg-hover)]/50 border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] text-center focus:outline-none focus:border-teal-500 transition-colors"
                        [class.border-teal-500]="entry.quantity > 0 && !(entry.orderQty != null && entry.orderQty !== entry.quantity)"
                        [class.border-amber-500]="entry.orderQty != null && entry.orderQty !== entry.quantity"
                        placeholder="Qty"
                      >
                      @if (entry.orderQty != null && entry.orderQty !== entry.quantity) {
                        <span class="absolute -top-2 -right-2 px-1.5 py-0.5 bg-amber-500 text-black text-[10px] font-bold rounded-full leading-none" 
                              [title]="'Order qty: ' + entry.orderQty">{{ entry.orderQty }}</span>
                      }
                    </div>
                    <input 
                      type="number"
                      [value]="entry.rate"
                      readonly
                      class="w-24 px-3 py-2 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)] text-center cursor-not-allowed focus:outline-none"
                    >
                    <span class="w-24 text-right font-medium whitespace-nowrap"
                          [class.text-teal-400]="entry.quantity > 0"
                          [class.text-slate-500]="entry.quantity === 0">{{ entry.total | currencyInr }}</span>
                  </div>
                }
              </div>
            </div>
            
             <!-- Lost Items Section -->
            <div class="mt-8 mb-8 p-4 bg-red-900/10 rounded-xl border border-red-500/20">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                   <i class="fas fa-search-dollar text-red-400"></i>
                   <h3 class="text-red-400 font-semibold">Lost / Damaged Items</h3>
                </div>
                <button (click)="addLostItem()" class="text-xs flex items-center gap-1 bg-red-500/20 text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-500/30 transition-colors">
                  <i class="fas fa-plus"></i> Add Item
                </button>
              </div>
              
              <div class="space-y-3">
                 @for (entry of lostItems(); track $index) {
                   <div class="flex flex-col md:flex-row items-center gap-3 bg-[var(--color-bg-input)] p-3 rounded-lg border border-red-500/30">
                      <!-- Item Selector -->
                      <div class="flex-1 w-full">
                        <ng-select
                            [items]="inventoryItems()"
                            bindLabel="nameGujarati"
                            [(ngModel)]="entry.item"
                            (change)="onLostItemSelect(entry, $event)"
                            [clearable]="false"
                            [searchFn]="itemSearchFn"
                            class="custom-select w-full"
                             placeholder="Select Lost Item"
                        >
                            <ng-template ng-label-tmp let-item="item">
                                 <span class="text-white">{{ item.nameGujarati }}</span>
                            </ng-template>
                            <ng-template ng-option-tmp let-item="item">
                                <div class="flex justify-between">
                                    <span class="text-white">{{ item.nameGujarati }}</span>
                                    <span class="text-xs text-slate-400">{{ item.nameEnglish }}</span>
                                </div>
                            </ng-template>
                        </ng-select>
                      </div>

                      <!-- Qty -->
                      <div class="w-full md:w-24">
                          <input 
                            type="number" 
                            [(ngModel)]="entry.quantity" 
                            (ngModelChange)="updateLostItemTotal(entry)"
                            min="1"
                            class="w-full px-3 py-2 bg-[var(--color-bg-hover)] border border-[var(--color-border)] rounded-lg text-white text-center focus:border-red-500 focus:outline-none"
                            placeholder="Qty"
                          >
                      </div>

                      <!-- Rate (Editable) -->
                      <div class="w-full md:w-32">
                         <div class="relative">
                            <span class="absolute left-3 top-2 text-slate-500">₹</span>
                            <input 
                                type="number" 
                                [(ngModel)]="entry.rate" 
                                (ngModelChange)="updateLostItemTotal(entry)"
                                class="w-full pl-6 pr-3 py-2 bg-[var(--color-bg-hover)] border border-[var(--color-border)] rounded-lg text-white text-right focus:border-red-500 focus:outline-none"
                                placeholder="Rate"
                            >
                         </div>
                      </div>

                      <!-- Total -->
                      <div class="w-full md:w-32 text-right font-bold text-red-400">
                         {{ entry.total | currencyInr }}
                      </div>

                      <!-- Remove -->
                      <button (click)="removeLostItem($index)" class="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors">
                         <i class="fas fa-times"></i>
                      </button>
                   </div>
                 }
                 @if (lostItems().length === 0) {
                    <div class="text-center py-4 text-slate-500 italic text-sm">
                       No lost items added. Click "Add Item" to add charges for lost or damaged goods.
                    </div>
                 }
              </div>
            </div>

            <!-- Custom / Other Items Section -->
            <div class="mt-8 mb-8 p-4 bg-blue-900/10 rounded-xl border border-blue-500/20">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                   <i class="fas fa-plus-circle text-blue-400"></i>
                   <h3 class="text-blue-400 font-semibold">Custom / Other Items</h3>
                </div>
                <button (click)="addCustomItem()" class="text-xs flex items-center gap-1 bg-blue-500/20 text-blue-300 px-3 py-1.5 rounded-lg hover:bg-blue-500/30 transition-colors">
                  <i class="fas fa-plus"></i> Add Item
                </button>
              </div>
              
              <div class="space-y-3">
                 @for (entry of customItems(); track $index) {
                   <div class="flex flex-col md:flex-row items-center gap-3 bg-[var(--color-bg-input)] p-3 rounded-lg border border-blue-500/30">
                      <!-- Item Name -->
                      <div class="flex-1 w-full">
                        <input 
                          type="text" 
                          [(ngModel)]="entry.name" 
                          placeholder="Item name (e.g. Decoration, Labour, Transport)"
                          class="w-full px-3 py-2 bg-[var(--color-bg-hover)] border border-[var(--color-border)] rounded-lg text-white focus:border-blue-500 focus:outline-none"
                        >
                      </div>

                      <!-- Qty -->
                      <div class="w-full md:w-24">
                          <input 
                            type="number" 
                            [(ngModel)]="entry.quantity" 
                            (ngModelChange)="updateCustomItemTotal(entry)"
                            min="1"
                            class="w-full px-3 py-2 bg-[var(--color-bg-hover)] border border-[var(--color-border)] rounded-lg text-white text-center focus:border-blue-500 focus:outline-none"
                            placeholder="Qty"
                          >
                      </div>

                      <!-- Rate -->
                      <div class="w-full md:w-32">
                         <div class="relative">
                            <span class="absolute left-3 top-2 text-slate-500">₹</span>
                            <input 
                                type="number" 
                                [(ngModel)]="entry.rate" 
                                (ngModelChange)="updateCustomItemTotal(entry)"
                                class="w-full pl-6 pr-3 py-2 bg-[var(--color-bg-hover)] border border-[var(--color-border)] rounded-lg text-white text-right focus:border-blue-500 focus:outline-none"
                                placeholder="Rate"
                            >
                         </div>
                      </div>

                      <!-- Total -->
                      <div class="w-full md:w-32 text-right font-bold text-blue-400">
                         {{ entry.total | currencyInr }}
                      </div>

                      <!-- Remove -->
                      <button (click)="removeCustomItem($index)" class="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors">
                         <i class="fas fa-times"></i>
                      </button>
                   </div>
                 }
                 @if (customItems().length === 0) {
                    <div class="text-center py-4 text-slate-500 italic text-sm">
                       No custom items added. Click "Add Item" to add charges for items not in inventory.
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
                  <span class="text-slate-400">Settlement Discount:</span>
                  <input 
                    type="number"
                    [ngModel]="settlementDiscount()"
                    (ngModelChange)="settlementDiscount.set($event)"
                    min="0"
                    class="w-32 px-3 py-2 bg-slate-600/50 border border-slate-500 rounded-lg text-white text-right focus:outline-none focus:border-teal-500"
                  >
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
                
                @if (deposit() > 0) {
                  <div class="flex justify-between items-center gap-4">
                    <span class="text-slate-400">Method:</span>
                    <select 
                      [ngModel]="depositMethod()"
                      (ngModelChange)="depositMethod.set($event)"
                      class="w-32 px-3 py-2 bg-slate-600/50 border border-slate-500 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500"
                    >
                      <option value="CASH">Cash</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="ONLINE">Online</option>
                    </select>
                  </div>

                  @if (depositMethod() !== 'CASH') {
                    <div class="flex justify-between items-center gap-4">
                      <span class="text-slate-400 text-sm">Ref No:</span>
                      <input 
                        type="text"
                        [ngModel]="depositChequeNumber()"
                        (ngModelChange)="depositChequeNumber.set($event)"
                        placeholder="Cheque/Txn No"
                        class="w-32 px-3 py-2 bg-slate-600/50 border border-slate-500 rounded-lg text-white text-right text-sm focus:outline-none focus:border-teal-500"
                      >
                    </div>
                  }
                }
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
  orderItemQuantities: { [itemId: number]: number } = {};

  customers = signal<Customer[]>([]);
  inventoryItems = signal<InventoryItem[]>([]);

  leftItems = signal<ItemEntry[]>([]);
  rightItems = signal<ItemEntry[]>([]);
  lostItems = signal<ItemEntry[]>([]); // New signal for lost items
  customItems = signal<CustomItemEntry[]>([]); // Custom/other items not in inventory

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
  settlementDiscount = signal(0);
  depositMethod = signal<'CASH' | 'CHEQUE' | 'ONLINE'>('CASH');
  depositChequeNumber = signal('');
  remarks = '';
  rentalOrderId: number | null = null;

  // Available items for lost items dropdown (excluding already added ones if needed, or just all)
  lostItemOptions = computed(() => this.inventoryItems());

  // Custom search function for ng-select (matches both Gujarati and English names)
  itemSearchFn = (term: string, item: InventoryItem) => {
    term = term.toLowerCase();
    return (item.nameGujarati?.toLowerCase().includes(term) || item.nameEnglish?.toLowerCase().includes(term)) ?? false;
  };

  // Computed totals
  totalAmount = computed(() => {
    const leftTotal = this.leftItems().reduce((sum, e) => sum + e.total, 0);
    const rightTotal = this.rightItems().reduce((sum, e) => sum + e.total, 0);
    const lostTotal = this.lostItems().reduce((sum, e) => sum + e.total, 0);
    const customTotal = this.customItems().reduce((sum, e) => sum + e.total, 0);
    return leftTotal + rightTotal + lostTotal + customTotal;
  });

  netPayable = computed(() => {
    return Math.max(0, this.totalAmount() - this.deposit() - this.settlementDiscount());
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
        // Check for rentalOrderId
        const rentalOrderId = this.route.snapshot.paramMap.get('rentalOrderId');
        if (rentalOrderId) {
          this.rentalOrderId = parseInt(rentalOrderId);
          this.rentalOrderService.getById(this.rentalOrderId).subscribe({
            next: (order) => {
              this.selectedCustomerId = order.customerId;
              // Populate items from order
              // We need to convert RentalOrderItem to BillItem logic (qty = booked or dispatched?)
              // Usually for billing we charge for what was Booked (or Dispatched). 
              // Let's use bookedQty as default charge.
              const orderItems = order.items?.map(ri => ({
                id: 0, // new bill item
                itemId: ri.inventoryItemId,
                quantity: ri.bookedQty || 0,
                itemNameGujarati: ri.itemNameGujarati,
                itemNameEnglish: ri.itemNameEnglish,
                rate: 0, // Will be looked up from inventory defaults
                total: 0
              })) as any[]; // casting to avoid strict type checks here, logic below handles it

              // We need to map rates from inventory items
              const billItems: BillItem[] = orderItems.map(oi => {
                const invItem = items.find(i => i.id === oi.itemId);
                return {
                  ...oi,
                  rate: invItem ? invItem.defaultRate : 0,
                  total: (oi.quantity || 0) * (invItem ? invItem.defaultRate : 0),
                  item: invItem // needing full item object for mapping
                };
              });

              this.initializeItems(items, billItems);
              this.isLoading.set(false);
              this.toastService.info('Populated from Rental Order #' + order.orderNumber);
            },
            error: () => {
              this.toastService.error('Failed to load rental order');
              this.initializeItems(items);
              this.isLoading.set(false);
            }
          });
        } else {
          this.initializeItems(items);
          this.isLoading.set(false);
        }
      }
    });
  }

  private patchForm(bill: Bill): void {
    this.selectedCustomerId = bill.customerId;
    this.orderItemQuantities = bill.orderItemQuantities || {};
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
    this.remarks = bill.remarks || '';

    // Debug logging
    console.log('Patching Form. Bill:', bill);
    console.log('Payments:', bill.payments);

    // Fix: Find specific deposit payment instead of using total bill.deposit (which is sum of all payments)
    // Check both isDeposit and (p as any).deposit to handle potential serialization variations
    const depositPayment = bill.payments?.find(p => p.isDeposit || (p as any).deposit === true);

    console.log('Found Deposit Payment:', depositPayment);

    if (depositPayment) {
      this.deposit.set(depositPayment.amount);
      this.depositMethod.set(depositPayment.paymentMethod);
      this.depositChequeNumber.set(depositPayment.chequeNumber || '');
    } else {
      this.deposit.set(0);
      this.depositMethod.set('CASH');
      this.depositChequeNumber.set('');
    }

    // Set settlement discount
    this.settlementDiscount.set(bill.settlementDiscount || 0);
  }

  private initializeItems(items: InventoryItem[], billItems?: BillItem[]): void {
    const itemMap = new Map<number, BillItem>();
    const lostItemList: ItemEntry[] = [];
    const customItemList: CustomItemEntry[] = [];

    if (billItems) {
      billItems.forEach(bi => {
        if (bi.isCustomItem) {
          customItemList.push({
            name: bi.customItemName || bi.itemNameGujarati || '',
            quantity: bi.quantity,
            rate: bi.rate,
            total: bi.total || (bi.quantity * bi.rate)
          });
        } else if (bi.isLostItem) {
          const invItem = items.find(i => i.id === bi.itemId);
          if (invItem) {
            lostItemList.push({
              item: invItem,
              quantity: bi.quantity,
              rate: bi.rate,
              total: bi.total || (bi.quantity * bi.rate)
            });
          }
        } else {
          itemMap.set(bi.itemId, bi);
        }
      });
    }

    this.lostItems.set(lostItemList);
    this.customItems.set(customItemList);

    const orderQtyMap = this.orderItemQuantities;
    const hasLinkedOrder = Object.keys(orderQtyMap).length > 0;

    const mapToEntry = (item: InventoryItem) => {
      const existing = itemMap.get(item.id);
      const oQty = orderQtyMap[item.id];
      return {
        item,
        quantity: existing ? existing.quantity : 0,
        rate: existing ? existing.rate : item.defaultRate,
        total: existing ? (existing.quantity * existing.rate) : 0,
        // If linked order exists: show order qty (0 if item not in order). If no linked order: undefined (no discrepancy).
        orderQty: hasLinkedOrder ? (oQty !== undefined ? oQty : 0) : undefined
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

  createEmptyLostItem(): ItemEntry {
    // Return a placeholder item entry. Since we use ng-select, item will be null initially?
    // ItemEntry expects 'item' to be populated. We can use a dummy or make item optional/nullable in a separate interface,
    // but to keep it simple, let's just initialize with null and handle in template if possible, or use the first item as default?
    // Better strategy: The array tracks entries. We need a way to have an "empty" selection.
    // Let's modify ItemEntry or just use a default non-null assertion if we are careful.
    // Actually, `ng-select` binds to `entry.item`. 
    // Let's just create a dummy if the list is empty? Or just don't add one until user clicks 'Add'?
    // Let's add one empty row if needed, but it's tricky with strict typing.
    // Let's assume we start with 0 lost items and user adds one.
    return {
      item: this.inventoryItems()[0], // Default to first item to satisfy type, UI will reset
      quantity: 1,
      rate: 0,
      total: 0
    };
  }

  addLostItem() {
    this.lostItems.update(items => [
      ...items,
      {
        item: this.inventoryItems()[0],
        quantity: 1,
        rate: this.inventoryItems()[0]?.defaultRate || 0,
        total: this.inventoryItems()[0]?.defaultRate || 0
      }
    ]);
  }

  removeLostItem(index: number) {
    this.lostItems.update(items => items.filter((_, i) => i !== index));
  }

  onLostItemSelect(entry: ItemEntry, item: InventoryItem) {
    entry.item = item;
    entry.rate = item.defaultRate; // Reset rate to default when item changes
    this.updateLostItemTotal(entry);
  }

  updateLostItemTotal(entry: ItemEntry) {
    entry.total = entry.quantity * entry.rate;
    this.lostItems.update(items => [...items]); // Trigger signal update
  }

  addCustomItem() {
    this.customItems.update(items => [
      ...items,
      { name: '', quantity: 1, rate: 0, total: 0 }
    ]);
  }

  removeCustomItem(index: number) {
    this.customItems.update(items => items.filter((_, i) => i !== index));
  }

  updateCustomItemTotal(entry: CustomItemEntry) {
    entry.total = entry.quantity * entry.rate;
    this.customItems.update(items => [...items]); // Trigger signal update
  }

  onCustomerChange(customer: Customer): void {
    if (customer?.id) {
      // Check for existing bill
      this.billService.getByCustomer(customer.id).subscribe({
        next: (bills) => {
          if (bills.length > 0 && (!this.billId() || this.billId() !== bills[0].id)) {
            this.toastService.info('Customer already has a bill. Redirecting to edit...');
            this.router.navigate(['/billing/edit', bills[0].id]);
            return; // Stop further processing
          }

          // If no existing bill or already editing it, load unreturned items
          this.rentalOrderService.getUnreturnedItemsByCustomer(customer.id).subscribe({
            next: (items) => this.unreturnedItems.set(items),
            error: () => this.unreturnedItems.set([])
          });
        }
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
    this.settlementDiscount.set(0);
    this.depositMethod.set('CASH');
    this.depositChequeNumber.set('');
    this.remarks = '';
    this.customItems.set([]);
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
    const billItems: BillItem[] = [
      ...allItems
        .filter(e => e.quantity > 0)
        .map(e => ({
          itemId: e.item.id,
          quantity: e.quantity,
          rate: e.rate,
          isLostItem: false
        })),
      ...this.lostItems().filter(e => e.quantity > 0).map(e => ({
        itemId: e.item.id,
        quantity: e.quantity,
        rate: e.rate,
        isLostItem: true
      })),
      ...this.customItems().filter(e => e.quantity > 0 && e.name.trim()).map(e => ({
        itemId: 0,
        quantity: e.quantity,
        rate: e.rate,
        isLostItem: false,
        isCustomItem: true,
        customItemName: e.name.trim()
      }))
    ];

    const billRequest: BillRequest = {
      customerId: this.selectedCustomerId!,
      billDate: this.billDate,
      palNumbers: this.palNumbers.join(','),
      billType: this.billType,
      paymentStatus: this.paymentStatus,
      deposit: this.deposit(),
      settlementDiscount: this.settlementDiscount(),
      depositMethod: this.depositMethod(),
      depositChequeNumber: this.depositChequeNumber(),
      remarks: this.remarks,
      rentalOrderId: this.rentalOrderId || undefined,
      items: billItems
    };

    if (this.billId()) {
      const updateRequest: BillUpdateRequest = {
        palNumbers: this.palNumbers.join(','),
        billType: this.billType,
        paymentStatus: this.paymentStatus,
        deposit: this.deposit(),
        settlementDiscount: this.settlementDiscount(),
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

