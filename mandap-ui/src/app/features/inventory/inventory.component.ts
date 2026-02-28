import { Component, OnInit, inject, signal, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { InventoryService, ToastService } from '@core/services';
import { InventoryItem } from '@core/models';
import { CurrencyInrPipe, LoadingSpinnerComponent, ModalComponent } from '@shared';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, CurrencyInrPipe, LoadingSpinnerComponent, ModalComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-[var(--color-text-primary)]">Inventory</h1>
          <p class="text-[var(--color-text-secondary)] mt-1">Manage Mandap items and rates</p>
        </div>
        <div class="text-sm text-[var(--color-text-secondary)]">
            <i class="fas fa-info-circle mr-1"></i> Drag items to reorder
        </div>
        <div class="flex gap-2">
            <button 
                (click)="setFilter('ACTIVE')"
                [class]="filterStatus() === 'ACTIVE' ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/20' : 'bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'"
                class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
                Active
            </button>
            <button 
                (click)="setFilter('INACTIVE')"
                [class]="filterStatus() === 'INACTIVE' ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'"
                class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
                Inactive
            </button>
            <button 
                (click)="setFilter('ALL')"
                [class]="filterStatus() === 'ALL' ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'"
                class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
                All
            </button>
        </div>
        <button 
          (click)="addItem()"
          class="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
        >
          <i class="fas fa-plus"></i> Add Item
        </button>
      </div>

      <!-- Search Bar -->
      <div class="flex items-center gap-4">
        <div class="relative flex-1 max-w-md">
          <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"></i>
          <input 
            type="text" 
            [ngModel]="searchQuery()"
            (ngModelChange)="onSearchChange($event)"
            placeholder="Search items (English / ગુજરાતી)..."
            class="w-full pl-10 pr-4 py-2.5 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500 placeholder-[var(--color-text-muted)]"
          >
        </div>
      </div>
      
      @if (isLoading()) {
        <app-loading-spinner></app-loading-spinner>
      } @else {
        <div class="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-2xl border border-[var(--color-border)] overflow-hidden transition-colors">
            <div class="overflow-auto max-h-[calc(100vh-280px)]">
              <table class="w-full">
                <thead class="sticky top-0 z-20 bg-[var(--color-bg-hover)] border-b border-[var(--color-border)] shadow-md">
                  <tr>
                    <th class="w-10 py-3"></th>
                    <th class="text-left py-3 px-4 text-[var(--color-text-secondary)] font-medium text-sm min-w-[220px]">Item (Gujarati)</th>
                    <th class="text-left py-3 px-4 text-slate-300 font-medium text-sm min-w-[200px]">Item (English)</th>
                    <th class="text-right py-3 px-4 text-slate-300 font-medium text-sm min-w-[120px]">Rate (₹)</th>
                    <th class="text-center py-3 px-4 text-slate-300 font-medium text-sm">Stock (Total)</th>
                    <th class="text-center py-3 px-4 text-purple-400 font-medium text-sm">Booked (Total)</th>
                    <th class="text-center py-3 px-4 text-orange-400 font-medium text-sm">Dispatched (Total)</th>
                    <th class="text-center py-3 px-4 text-green-400 font-medium text-sm">Returned (Total)</th>
                    <th class="text-center py-3 px-4 text-orange-400 font-medium text-sm">
                      <div class="flex items-center justify-center gap-1 group relative">
                        Pending Dispatch (Total)
                        <i class="fas fa-info-circle text-[10px] opacity-60"></i>
                        <!-- Fancy Tooltip -->
                        <div class="invisible group-hover:visible absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-slate-800/95 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl z-50 pointer-events-none transition-all duration-200 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100">
                           <div class="text-[10px] text-slate-400 mb-1 font-semibold uppercase tracking-wider">Calculation</div>
                           <div class="text-xs text-white leading-relaxed">Booked (Total) - Dispatched (Total)</div>
                           <div class="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-slate-800/95"></div>
                        </div>
                      </div>
                    </th>
                    <th class="text-center py-3 px-4 text-red-400 font-medium text-sm">
                      <div class="flex items-center justify-center gap-1 group relative">
                        Pending Return (Total)
                        <i class="fas fa-info-circle text-[10px] opacity-60"></i>
                        <!-- Fancy Tooltip -->
                        <div class="invisible group-hover:visible absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-slate-800/95 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl z-50 pointer-events-none transition-all duration-200 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100">
                           <div class="text-[10px] text-slate-400 mb-1 font-semibold uppercase tracking-wider">Calculation</div>
                           <div class="text-xs text-white leading-relaxed">Dispatched (Total) - Returned (Total)</div>
                           <div class="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-slate-800/95"></div>
                        </div>
                      </div>
                    </th>
                    <th class="text-center py-3 px-4 text-slate-300 font-medium text-sm">
                      <div class="flex items-center justify-center gap-1 group relative">
                        Available in stock now
                        <i class="fas fa-info-circle text-[10px] opacity-60"></i>
                         <!-- Fancy Tooltip -->
                        <div class="invisible group-hover:visible absolute top-full mt-2 left-1/2 -translate-x-1/2 w-52 p-2 bg-slate-800/95 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl z-50 pointer-events-none transition-all duration-200 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100">
                           <div class="text-[10px] text-slate-400 mb-1 font-semibold uppercase tracking-wider">Calculation</div>
                           <div class="text-xs text-white leading-relaxed">Stock (Total) - Pending Return (Total)</div>
                           <div class="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-slate-800/95"></div>
                        </div>
                      </div>
                    </th>
                    <th class="text-center py-3 px-4 text-teal-400 font-medium text-sm">
                      <div class="flex items-center justify-center gap-1 group relative">
                        Booking Available
                        <i class="fas fa-info-circle text-[10px] opacity-60"></i>
                         <!-- Fancy Tooltip -->
                        <div class="invisible group-hover:visible absolute top-full mt-2 left-1/2 -translate-x-1/2 w-56 p-2 bg-slate-800/95 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl z-50 pointer-events-none transition-all duration-200 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100">
                           <div class="text-[10px] text-slate-400 mb-1 font-semibold uppercase tracking-wider">Calculation</div>
                           <div class="text-xs text-white leading-relaxed">Available in stock now - Pending Dispatch (Total)</div>
                           <div class="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-slate-800/95"></div>
                        </div>
                      </div>
                    </th>
                    <th class="text-center py-3 px-4 text-slate-300 font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody cdkDropList (cdkDropListDropped)="drop($event)">
                  @for (item of filteredItems(); track item.id) {
                    <tr cdkDrag class="border-t border-[var(--color-border)]/50 hover:bg-[var(--color-bg-hover)]/50 transition-colors bg-[var(--color-bg-input)]" [class.opacity-50]="!item.active">
                      <td class="py-3 px-2 text-center text-[var(--color-text-muted)] cursor-move" cdkDragHandle>
                        <i class="fas fa-grip-vertical"></i>
                      </td>
                      <td class="py-3 px-4 text-[var(--color-text-primary)] font-medium">
                        {{ item.nameGujarati }}
                        @if (!item.active) {
                            <span class="ml-2 text-xs text-red-400 border border-red-400/30 px-1.5 py-0.5 rounded">Inactive</span>
                        }
                      </td>
                      <td class="py-3 px-4 text-[var(--color-text-secondary)]">{{ item.nameEnglish }}</td>
                      <td class="py-3 px-4 text-right text-teal-400 font-semibold">{{ item.defaultRate | currencyInr }}</td>
                      <td class="py-3 px-4 text-center text-[var(--color-text-secondary)] font-medium">{{ item.totalStock }}</td>
                      <td class="py-3 px-4 text-center text-purple-400 font-bold">{{ item.bookedQty || 0 }}</td>
                      <td class="py-3 px-4 text-center text-orange-500 font-bold">{{ item.dispatchedQty || 0 }}</td>
                      <td class="py-3 px-4 text-center text-green-500 font-bold">{{ item.returnedQty || 0 }}</td>
                      <td class="py-3 px-4 text-center text-orange-500 font-bold">{{ item.pendingDispatchQty || 0 }}</td>
                      <td class="py-3 px-4 text-center text-red-500 font-bold">{{ item.pendingReturnQty || 0 }}</td>
                      <td class="py-3 px-4 text-center font-semibold" [class]="item.availableStock > 0 ? 'text-green-400' : 'text-red-400'">{{ item.availableStock }}</td>
                      <td class="py-3 px-4 text-center font-bold text-teal-400">
                        {{ item.totalStock - ((item.bookedQty || 0) - (item.returnedQty || 0)) }}
                      </td>
                      <td class="py-3 px-4 text-center">
                        <div class="flex items-center justify-center gap-2">
                            <button 
                              (click)="viewUsage(item)"
                              class="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors"
                              title="View Usage"
                            >
                              <i class="fas fa-history text-xs"></i>
                            </button>
                            <button 
                              (click)="viewAudit(item)"
                              class="w-8 h-8 rounded-lg bg-slate-500/20 text-slate-400 hover:bg-slate-500/30 transition-colors"
                              title="View Changes (Audit)"
                            >
                              <i class="fas fa-fingerprint text-xs"></i>
                            </button>
                            <button 
                              (click)="editItem(item)"
                              class="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                            >
                              <i class="fas fa-edit text-xs"></i>
                            </button>
                        </div>
                      </td>
                      <!-- Drag preview -->
                      <div *cdkDragPreview class="bg-slate-700 p-4 rounded-lg shadow-xl text-white flex items-center gap-4 w-full">
                         <i class="fas fa-grip-vertical text-slate-400"></i>
                         <span>{{ item.nameGujarati }}</span>
                         <span class="ml-auto">{{ item.defaultRate | currencyInr }}</span>
                      </div>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="7" class="py-8 text-center text-slate-400">No items</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
        </div>
      }
      
      <!-- Edit/Add Modal -->
      <app-modal #modal [title]="selectedItem() ? 'Edit Item' : 'Add New Item'" size="sm">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Name (Gujarati)</label>
              <input 
                type="text"
                [(ngModel)]="editNameGujarati"
                class="w-full px-4 py-3 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500"
                placeholder="Ex. મંડપ"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Name (English)</label>
              <input 
                type="text"
                [(ngModel)]="editNameEnglish"
                class="w-full px-4 py-3 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500"
                placeholder="Ex. Mandap"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Default Rate (₹)</label>
              <input 
                type="number"
                [(ngModel)]="editRate"
                min="0"
                class="w-full px-4 py-3 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500"
              >
            </div>
            <div class="flex items-center gap-2">
              <input 
                type="checkbox"
                [(ngModel)]="editIsActive"
                id="editIsActive"
                class="w-5 h-5 rounded bg-[var(--color-bg-input)] border-[var(--color-border)] text-teal-500"
              >
              <label for="editIsActive" class="text-[var(--color-text-secondary)]">Active</label>
            </div>
            <div>
              <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Total Stock</label>
              <input 
                type="number"
                [(ngModel)]="editTotalStock"
                min="0"
                class="w-full px-4 py-3 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500"
              >
            </div>
            
            <div class="flex gap-3 mt-6">
              <button 
                (click)="modal.close()"
                class="flex-1 py-3 rounded-xl bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)] transition-colors border border-[var(--color-border)]"
              >
                Cancel
              </button>
              <button 
                (click)="saveItem()"
                [disabled]="isSaving()"
                class="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 transition-all"
              >
                @if (isSaving()) {
                  <i class="fas fa-spinner fa-spin mr-2"></i>
                }
                Save
              </button>
            </div>
          </div>
      </app-modal>

      <!-- Usage Modal -->
      <app-modal #usageModal [title]="'Usage: ' + usageItemName()" size="xl">
        @if (isLoadingUsage()) {
          <div class="flex justify-center py-8">
            <app-loading-spinner></app-loading-spinner>
          </div>
        } @else {
          <div class="border border-[var(--color-border)] rounded-xl overflow-x-auto">
             <table class="w-full text-sm border-collapse">
                 <thead>
                     <tr>
                         <th (click)="onUsageSort('customerName')" class="py-3 px-4 text-left text-[var(--color-text-secondary)] font-medium cursor-pointer group select-none sticky top-0 z-20 bg-[var(--color-bg-hover)] border-b border-[var(--color-border)]">
                            Customer
                            <i class="fas ml-1" [class]="usageSortConfig().column === 'customerName' ? (usageSortConfig().direction === 'asc' ? 'fa-sort-up text-indigo-400' : 'fa-sort-down text-indigo-400') : 'fa-sort text-[var(--color-text-muted)] opacity-30 group-hover:opacity-100'"></i>
                          </th>
                          <th (click)="onUsageSort('palNumbers')" class="py-3 px-4 text-left text-[var(--color-text-secondary)] font-medium cursor-pointer group select-none sticky top-0 z-20 bg-[var(--color-bg-hover)] border-b border-[var(--color-border)]">
                            Pal #
                            <i class="fas ml-1" [class]="usageSortConfig().column === 'palNumbers' ? (usageSortConfig().direction === 'asc' ? 'fa-sort-up text-indigo-400' : 'fa-sort-down text-indigo-400') : 'fa-sort text-[var(--color-text-muted)] opacity-30 group-hover:opacity-100'"></i>
                          </th>
                          <th (click)="onUsageSort('orderNumber')" class="py-3 px-4 text-left text-[var(--color-text-secondary)] font-medium cursor-pointer group select-none sticky top-0 z-20 bg-[var(--color-bg-hover)] border-b border-[var(--color-border)]">
                            Order #
                            <i class="fas ml-1" [class]="usageSortConfig().column === 'orderNumber' ? (usageSortConfig().direction === 'asc' ? 'fa-sort-up text-indigo-400' : 'fa-sort-down text-indigo-400') : 'fa-sort text-[var(--color-text-muted)] opacity-30 group-hover:opacity-100'"></i>
                          </th>
                          <th (click)="onUsageSort('bookedQty')" class="py-3 px-4 text-center text-[var(--color-text-secondary)] font-medium cursor-pointer group select-none sticky top-0 z-20 bg-[var(--color-bg-hover)] border-b border-[var(--color-border)]">
                            Booked
                            <i class="fas ml-1" [class]="usageSortConfig().column === 'bookedQty' ? (usageSortConfig().direction === 'asc' ? 'fa-sort-up text-indigo-400' : 'fa-sort-down text-indigo-400') : 'fa-sort text-[var(--color-text-muted)] opacity-30 group-hover:opacity-100'"></i>
                          </th>
                          <th (click)="onUsageSort('dispatchedQty')" class="py-3 px-4 text-center text-[var(--color-text-secondary)] font-medium cursor-pointer group select-none sticky top-0 z-20 bg-[var(--color-bg-hover)] border-b border-[var(--color-border)]">
                            Disp.
                            <i class="fas ml-1" [class]="usageSortConfig().column === 'dispatchedQty' ? (usageSortConfig().direction === 'asc' ? 'fa-sort-up text-indigo-400' : 'fa-sort-down text-indigo-400') : 'fa-sort text-[var(--color-text-muted)] opacity-30 group-hover:opacity-100'"></i>
                          </th>
                          <th (click)="onUsageSort('returnedQty')" class="py-3 px-4 text-center text-[var(--color-text-secondary)] font-medium cursor-pointer group select-none sticky top-0 z-20 bg-[var(--color-bg-hover)] border-b border-[var(--color-border)]">
                            Ret.
                            <i class="fas ml-1" [class]="usageSortConfig().column === 'returnedQty' ? (usageSortConfig().direction === 'asc' ? 'fa-sort-up text-indigo-400' : 'fa-sort-down text-indigo-400') : 'fa-sort text-[var(--color-text-muted)] opacity-30 group-hover:opacity-100'"></i>
                          </th>
                          <th (click)="onUsageSort('pendingDispatchQty')" class="py-3 px-4 text-center text-orange-400 font-medium cursor-pointer group select-none sticky top-0 z-20 bg-[var(--color-bg-hover)] border-b border-[var(--color-border)]">
                            Pending Disp.
                            <i class="fas ml-1" [class]="usageSortConfig().column === 'pendingDispatchQty' ? (usageSortConfig().direction === 'asc' ? 'fa-sort-up text-orange-400' : 'fa-sort-down text-orange-400') : 'fa-sort text-[var(--color-text-muted)] opacity-30 group-hover:opacity-100'"></i>
                          </th>
                          <th (click)="onUsageSort('pendingReturnQty')" class="py-3 px-4 text-center text-red-400 font-medium cursor-pointer group select-none sticky top-0 z-20 bg-[var(--color-bg-hover)] border-b border-[var(--color-border)]">
                            Pending Ret.
                            <i class="fas ml-1" [class]="usageSortConfig().column === 'pendingReturnQty' ? (usageSortConfig().direction === 'asc' ? 'fa-sort-up text-red-400' : 'fa-sort-down text-red-400') : 'fa-sort text-[var(--color-text-muted)] opacity-30 group-hover:opacity-100'"></i>
                          </th>
                     </tr>
                 </thead>
                 <tbody class="divide-y divide-[var(--color-border)]/50">
                     @for (usage of sortedUsageItems(); track usage.orderNumber) {
                         <tr class="hover:bg-[var(--color-bg-hover)]/20">
                             <td class="py-3 px-4 text-[var(--color-text-primary)] font-medium">{{ usage.customerName }}</td>
                             <td class="py-3 px-4 text-[var(--color-text-secondary)] text-xs">{{ usage.palNumbers || '-' }}</td>
                             <td class="py-3 px-4 text-[var(--color-text-secondary)] font-mono text-xs">{{ usage.orderNumber }}</td>
                             <td class="py-2 px-4 text-center text-[var(--color-text-secondary)]">{{ usage.bookedQty }}</td>
                             <td class="py-2 px-4 text-center text-[var(--color-text-secondary)]">{{ usage.dispatchedQty }}</td>
                             <td class="py-2 px-4 text-center text-[var(--color-text-secondary)]">{{ usage.returnedQty }}</td>
                             <td class="py-2 px-4 text-center font-bold text-orange-500">{{ usage.pendingDispatchQty }}</td>
                             <td class="py-2 px-4 text-center font-bold text-red-500">{{ usage.pendingReturnQty }}</td>
                         </tr>
                     } @empty {
                         <tr>
                             <td colspan="8" class="py-8 text-center text-[var(--color-text-muted)]">No active usage found</td>
                         </tr>
                     }
                 </tbody>
                 @if (usageItems().length > 0) {
                    <tfoot class="bg-[var(--color-bg-hover)]/30 font-bold border-t-2 border-[var(--color-border)]">
                        <tr>
                            <td colspan="3" class="py-3 px-4 text-right text-[var(--color-text-primary)]">Total:</td>
                            <td class="py-3 px-4 text-center text-[var(--color-text-primary)]">{{ usageTotals().booked }}</td>
                            <td class="py-3 px-4 text-center text-[var(--color-text-primary)]">{{ usageTotals().dispatched }}</td>
                            <td class="py-3 px-4 text-center text-[var(--color-text-primary)]">{{ usageTotals().returned }}</td>
                            <td class="py-3 px-4 text-center text-orange-500">{{ usageTotals().pendingDispatch }}</td>
                            <td class="py-3 px-4 text-center text-red-500">{{ usageTotals().pendingReturn }}</td>
                        </tr>
                    </tfoot>
                 }
             </table>
          </div>
          <div class="mt-4 flex justify-end">
              <button (click)="usageModal.close()" class="px-6 py-2 rounded-lg bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">Close</button>
          </div>
        }
      </app-modal>
    </div>
  `
})
export class InventoryComponent implements OnInit {
  @ViewChild('modal') modal!: ModalComponent;

  private inventoryService = inject(InventoryService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  items = signal<InventoryItem[]>([]);
  filterStatus = signal<'ACTIVE' | 'INACTIVE' | 'ALL'>('ACTIVE');
  searchQuery = signal('');

  filteredItems = computed(() => {
    const status = this.filterStatus();
    const query = this.searchQuery().toLowerCase();
    let result = this.items();

    // Filter by status
    if (status !== 'ALL') {
      result = result.filter(i => status === 'ACTIVE' ? i.active : !i.active);
    }

    // Filter by search query
    if (query) {
      result = result.filter(i =>
        i.nameEnglish?.toLowerCase().includes(query) ||
        i.nameGujarati?.includes(this.searchQuery()) // Gujarati is case-sensitive match
      );
    }

    return result;
  });

  selectedItem = signal<InventoryItem | null>(null);

  isLoading = signal(true);
  isSaving = signal(false);

  // Edit form
  editNameGujarati = '';
  editNameEnglish = '';
  editRate = 0;
  editIsActive = true;
  editTotalStock = 0;
  editAvailableStock = 0;

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.inventoryService.getAll().subscribe({
      next: (items) => {
        // Backend now returns sorted by displayOrder
        this.items.set(items);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  setFilter(status: 'ACTIVE' | 'INACTIVE' | 'ALL'): void {
    this.filterStatus.set(status);
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
  }

  drop(event: CdkDragDrop<InventoryItem[]>) {
    // If filtering, we need to apply move to the main list based on relative positions
    const visibleItems = this.filteredItems();
    const allItems = [...this.items()];

    const movedItem = visibleItems[event.previousIndex];
    const targetItem = visibleItems[event.currentIndex];

    if (!movedItem || !targetItem) return;

    // Find real indices in main list
    const fromIndex = allItems.findIndex(i => i.id === movedItem.id);
    // For toIndex, we want to place it active-relative.
    // Actually simpler: remove from main list, find insertion point.

    // Remove item from main list
    allItems.splice(fromIndex, 1);

    // Find where to insert
    // If we dropped at index N in visible list, we want to insert it
    // AFTER the item that is at index N-1 in visible list (if any),
    // or BEFORE the item at index N in visible list (if any).

    // Let's look at the target item in the main list.
    // If moving down (prev < current): insert AFTER target?
    // If moving up (prev > current): insert BEFORE target?

    let toIndex = allItems.findIndex(i => i.id === targetItem.id);

    // Adjust logic: moveItemInArray moves from A to B.
    // Use the target item's index in the *modified* allItems (since we removed movedItem)
    if (event.currentIndex > event.previousIndex) {
      // Moved down. Target index in allItems is likely valid as insertion point?
      // Example: [A, B, C]. View: [A, C]. Move A -> C (index 0 -> 1).
      // Remove A: [B, C]. Target C is at 1. Insert A at 2? No right after C.
      // Wait, standard moveItemInArray logic is:
      toIndex = toIndex + 1; // Insert after
    }
    // If moving up, we usually insert at the target's index.

    // BUT, simple approach:
    // If we map detailed indices, it's safer.

    // Re-implementation of smart move:
    const reorderedVisible = [...visibleItems];
    moveItemInArray(reorderedVisible, event.previousIndex, event.currentIndex);

    // Now reconstruct allItems.
    // Iterate through allItems, if it's in visible list, take next from reorderedVisible.
    // If not, keep as is.
    // This preserves relative order of visible items and absolute order of invisible ones.

    let visibleIndex = 0;
    const newAllItems = allItems.map(item => {
      // Note: allItems here still has the moved item removed? No, let's use original this.items() source
      return item;
    });

    // Correction:
    const sourceItems = this.items();
    const newItems: InventoryItem[] = [];
    let visiblePtr = 0;

    for (const item of sourceItems) {
      const isVisible = this.filterStatus() === 'ALL' ||
        (this.filterStatus() === 'ACTIVE' ? item.active : !item.active);

      if (isVisible) {
        newItems.push(reorderedVisible[visiblePtr]);
        visiblePtr++;
      } else {
        newItems.push(item);
      }
    }

    this.items.set(newItems);

    // Save
    const ids = newItems.map(i => i.id);
    this.inventoryService.reorder(ids).subscribe({
      error: () => {
        this.toastService.error('Failed to save order');
        this.loadItems();
      }
    });
  }

  addItem(): void {
    this.selectedItem.set(null);
    this.editNameGujarati = '';
    this.editNameEnglish = '';
    this.editRate = 0;
    this.editIsActive = true;
    this.editTotalStock = 0;
    this.editAvailableStock = 0;
    this.modal.open();
  }

  editItem(item: InventoryItem): void {
    this.selectedItem.set(item);
    this.editNameGujarati = item.nameGujarati;
    this.editNameEnglish = item.nameEnglish;
    this.editRate = item.defaultRate;
    this.editIsActive = item.active;
    this.editTotalStock = item.totalStock;
    this.editAvailableStock = item.availableStock;
    this.modal.open();
  }

  saveItem(): void {
    this.isSaving.set(true);

    const inventoryData = {
      nameGujarati: this.editNameGujarati,
      nameEnglish: this.editNameEnglish,
      defaultRate: this.editRate,
      active: this.editIsActive,
      totalStock: this.editTotalStock,
      availableStock: this.editAvailableStock
    };

    if (this.selectedItem()) {
      // Update
      this.inventoryService.update(this.selectedItem()!.id, inventoryData).subscribe({
        next: () => {
          this.toastService.success('Item updated successfully');
          this.modal.close();
          this.loadItems();
          this.isSaving.set(false);
        },
        error: () => {
          this.isSaving.set(false);
        }
      });
    } else {
      // Create
      this.inventoryService.create(inventoryData).subscribe({
        next: () => {
          this.toastService.success('Item created successfully');
          this.modal.close();
          this.loadItems();
          this.isSaving.set(false);
        },
        error: () => {
          this.isSaving.set(false);
        }
      });
    }
  }

  // Usage Modal Logic
  @ViewChild('usageModal') usageModal!: ModalComponent;
  usageItems = signal<any[]>([]);
  isLoadingUsage = signal(false);
  usageItemName = signal('');
  usageSortConfig = signal<{ column: string, direction: 'asc' | 'desc' }>({
    column: 'customerName',
    direction: 'asc'
  });

  sortedUsageItems = computed(() => {
    const items = [...this.usageItems()];
    const sort = this.usageSortConfig();

    if (!sort.column) return items;

    return items.sort((a, b) => {
      const direction = sort.direction === 'asc' ? 1 : -1;
      let valA = a[sort.column];
      let valB = b[sort.column];

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return -1 * direction;
      if (valA > valB) return 1 * direction;
      return 0;
    });
  });

  usageTotals = computed(() => {
    return this.usageItems().reduce((acc, curr) => ({
      booked: acc.booked + (curr.bookedQty || 0),
      dispatched: acc.dispatched + (curr.dispatchedQty || 0),
      returned: acc.returned + (curr.returnedQty || 0),
      pendingDispatch: acc.pendingDispatch + (curr.pendingDispatchQty || 0),
      pendingReturn: acc.pendingReturn + (curr.pendingReturnQty || 0)
    }), { booked: 0, dispatched: 0, returned: 0, pendingDispatch: 0, pendingReturn: 0 });
  });

  viewUsage(item: InventoryItem): void {
    this.usageItemName.set(item.nameGujarati);
    this.isLoadingUsage.set(true);
    this.usageModal.open();

    this.inventoryService.getItemUsage(item.id).subscribe({
      next: (data) => {
        this.usageItems.set(data);
        this.isLoadingUsage.set(false);
      },
      error: () => {
        this.toastService.error('Failed to load usage data');
        this.isLoadingUsage.set(false);
      }
    });
  }

  viewAudit(item: InventoryItem): void {
    this.router.navigate(['/inventory/audit', item.id]);
  }

  onUsageSort(column: string) {
    const current = this.usageSortConfig();
    if (current.column === column) {
      this.usageSortConfig.set({ column, direction: current.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      this.usageSortConfig.set({ column, direction: 'asc' });
    }
  }
}
