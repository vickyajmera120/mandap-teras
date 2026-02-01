import { Component, OnInit, inject, signal, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-[var(--color-bg-hover)]/30">
                  <tr>
                    <th class="w-10"></th>
                    <th class="text-left py-3 px-4 text-[var(--color-text-secondary)] font-medium text-sm">Item (Gujarati)</th>
                    <th class="text-left py-3 px-4 text-slate-300 font-medium text-sm">Item (English)</th>
                    <th class="text-right py-3 px-4 text-slate-300 font-medium text-sm">Rate (₹)</th>
                    <th class="text-center py-3 px-4 text-slate-300 font-medium text-sm">Stock (Total)</th>
                    <th class="text-center py-3 px-4 text-slate-300 font-medium text-sm">Available</th>
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
                      <td class="py-3 px-4 text-center font-semibold" [class]="item.availableStock > 0 ? 'text-green-400' : 'text-red-400'">{{ item.availableStock }}</td>
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
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Total Stock</label>
                <input 
                  type="number"
                  [(ngModel)]="editTotalStock"
                  min="0"
                  class="w-full px-4 py-3 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Available Stock</label>
                <input 
                  type="number"
                  [(ngModel)]="editAvailableStock"
                  min="0"
                  class="w-full px-4 py-3 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500"
                >
              </div>
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
      <app-modal #usageModal [title]="'Usage: ' + usageItemName()" size="lg">
        @if (isLoadingUsage()) {
          <div class="flex justify-center py-8">
            <app-loading-spinner></app-loading-spinner>
          </div>
        } @else {
          <div class="overflow-hidden border border-[var(--color-border)] rounded-xl">
             <table class="w-full text-sm">
                 <thead class="bg-[var(--color-bg-hover)]/30">
                     <tr>
                         <th class="py-3 px-4 text-left text-[var(--color-text-secondary)]">Customer</th>
                         <th class="py-3 px-4 text-left text-[var(--color-text-secondary)]">Order #</th>
                         <th class="py-3 px-4 text-center text-[var(--color-text-secondary)]">Booked</th>
                         <th class="py-3 px-4 text-center text-[var(--color-text-secondary)]">Disp.</th>
                         <th class="py-3 px-4 text-center text-[var(--color-text-secondary)]">Ret.</th>
                         <th class="py-3 px-4 text-center text-[var(--color-text-secondary)]">Out.</th>
                     </tr>
                 </thead>
                 <tbody class="divide-y divide-[var(--color-border)]/50">
                     @for (usage of usageItems(); track usage.orderNumber) {
                         <tr class="hover:bg-[var(--color-bg-hover)]/20">
                             <td class="py-3 px-4 text-[var(--color-text-primary)] font-medium">{{ usage.customerName }}</td>
                             <td class="py-3 px-4 text-[var(--color-text-secondary)] font-mono text-xs">{{ usage.orderNumber }}</td>
                             <td class="py-2 px-4 text-center text-[var(--color-text-secondary)]">{{ usage.bookedQty }}</td>
                             <td class="py-2 px-4 text-center text-[var(--color-text-secondary)]">{{ usage.dispatchedQty }}</td>
                             <td class="py-2 px-4 text-center text-[var(--color-text-secondary)]">{{ usage.returnedQty }}</td>
                             <td class="py-2 px-4 text-center font-bold" [class]="usage.outstandingQty > 0 ? 'text-red-500' : 'text-green-500'">{{ usage.outstandingQty }}</td>
                         </tr>
                     } @empty {
                         <tr>
                             <td colspan="6" class="py-8 text-center text-[var(--color-text-muted)]">No active usage found</td>
                         </tr>
                     }
                 </tbody>
                 @if (usageItems().length > 0) {
                    <tfoot class="bg-[var(--color-bg-hover)]/30 font-bold border-t-2 border-[var(--color-border)]">
                        <tr>
                            <td colspan="2" class="py-3 px-4 text-right text-[var(--color-text-primary)]">Total:</td>
                            <td class="py-3 px-4 text-center text-[var(--color-text-primary)]">{{ usageTotals().booked }}</td>
                            <td class="py-3 px-4 text-center text-[var(--color-text-primary)]">{{ usageTotals().dispatched }}</td>
                            <td class="py-3 px-4 text-center text-[var(--color-text-primary)]">{{ usageTotals().returned }}</td>
                            <td class="py-3 px-4 text-center" [class]="usageTotals().outstanding > 0 ? 'text-red-500' : 'text-green-500'">{{ usageTotals().outstanding }}</td>
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

  usageTotals = computed(() => {
    return this.usageItems().reduce((acc, curr) => ({
      booked: acc.booked + (curr.bookedQty || 0),
      dispatched: acc.dispatched + (curr.dispatchedQty || 0),
      returned: acc.returned + (curr.returnedQty || 0),
      outstanding: acc.outstanding + (curr.outstandingQty || 0)
    }), { booked: 0, dispatched: 0, returned: 0, outstanding: 0 });
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
}
