import { Component, OnInit, inject, signal, computed, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CustomerService, ToastService } from '@core/services';
import { Customer } from '@core/models';
import { ModalComponent, LoadingSpinnerComponent } from '@shared';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ModalComponent, LoadingSpinnerComponent, NgSelectModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-3xl font-bold text-[var(--color-text-primary)]">Customers</h1>
          <p class="text-[var(--color-text-secondary)] mt-1">Manage your customer database</p>
        </div>
        <button 
          (click)="openModal()"
          class="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold hover:from-teal-600 hover:to-teal-700 shadow-lg shadow-teal-500/30 transition-all"
        >
          <i class="fas fa-plus mr-2"></i>Add Customer
        </button>
      </div>

      <!-- Billing Status Filter -->
      <div class="flex gap-2 p-1 bg-[var(--color-bg-input)] rounded-xl w-fit border border-[var(--color-border)] mb-6">
        <button 
          (click)="billingFilter.set('ALL')"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          [ngClass]="billingFilter() === 'ALL' ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/20' : 'text-[var(--color-text-secondary)] hover:text-white'"
        >
          All Customers
        </button>
        <button 
          (click)="billingFilter.set('UNBILLED')"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          [ngClass]="billingFilter() === 'UNBILLED' ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20' : 'text-[var(--color-text-secondary)] hover:text-white'"
        >
          Unbilled
          @if (unbilledCount() > 0) {
            <span class="ml-1.5 px-1.5 py-0.5 bg-white/20 rounded text-[10px]">{{ unbilledCount() }}</span>
          }
        </button>
        <button 
          (click)="billingFilter.set('BILLED')"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          [ngClass]="billingFilter() === 'BILLED' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-[var(--color-text-secondary)] hover:text-white'"
        >
          Billed
          @if (billedCount() > 0) {
            <span class="ml-1.5 px-1.5 py-0.5 bg-white/20 rounded text-[10px]">{{ billedCount() }}</span>
          }
        </button>
      </div>
      
      @if (isLoading()) {
        <app-loading-spinner></app-loading-spinner>
      } @else {
        <!-- Table -->
        <div class="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-2xl border border-[var(--color-border)] overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-[var(--color-bg-hover)]">
                <tr>
                  <!-- Sortable Name -->
                  <th (click)="onSort('name')" class="text-left py-4 px-6 text-[var(--color-text-secondary)] font-semibold cursor-pointer group select-none">
                    Name 
                    <i class="fas ml-1" [class]="sortConfig().column === 'name' ? (sortConfig().direction === 'asc' ? 'fa-sort-up text-teal-500' : 'fa-sort-down text-teal-500') : 'fa-sort text-[var(--color-text-muted)] opacity-30 group-hover:opacity-100'"></i>
                  </th>
                  <th class="text-left py-4 px-6 text-[var(--color-text-secondary)] font-semibold">Mobile</th>
                  <!-- Sortable Pal No -->
                  <th (click)="onSort('palNumbers')" class="text-left py-4 px-6 text-[var(--color-text-secondary)] font-semibold cursor-pointer group select-none">
                    Pal No
                    <i class="fas ml-1" [class]="sortConfig().column === 'palNumbers' ? (sortConfig().direction === 'asc' ? 'fa-sort-up text-teal-500' : 'fa-sort-down text-teal-500') : 'fa-sort text-[var(--color-text-muted)] opacity-30 group-hover:opacity-100'"></i>
                  </th>
                  <th class="text-left py-4 px-6 text-[var(--color-text-secondary)] font-semibold">Address</th>
                  <th class="text-left py-4 px-6 text-[var(--color-text-secondary)] font-semibold">Alt. Contact</th>
                  <th class="text-center py-4 px-6 text-[var(--color-text-secondary)] font-semibold">Actions</th>
                </tr>
                <!-- Search Inputs Row -->
                <tr class="border-b border-[var(--color-border)]/50">
                    <th class="p-2">
                        <input type="text" placeholder="Filter Name..." class="w-full px-3 py-2 text-sm bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500" (input)="updateFilter('name', $any($event.target).value)">
                    </th>
                    <th class="p-2">
                        <input type="text" placeholder="Filter Mobile..." class="w-full px-3 py-2 text-sm bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500" (input)="updateFilter('mobile', $any($event.target).value)">
                    </th>
                    <th class="p-2">
                        <input type="text" placeholder="Filter Pal No..." class="w-full px-3 py-2 text-sm bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500" (input)="updateFilter('palNumbers', $any($event.target).value)">
                    </th>
                    <th class="p-2">
                        <input type="text" placeholder="Filter Address..." class="w-full px-3 py-2 text-sm bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500" (input)="updateFilter('address', $any($event.target).value)">
                    </th>
                    <th class="p-2">
                        <input type="text" placeholder="Filter Alt..." class="w-full px-3 py-2 text-sm bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-teal-500" (input)="updateFilter('alternateContact', $any($event.target).value)">
                    </th>
                    <th class="p-2"></th>
                </tr>
              </thead>
              <tbody>
                @for (customer of filteredCustomers(); track customer.id) {
                  <tr class="border-t border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] transition-colors">
                    <td class="py-4 px-6">
                      <div class="flex items-center gap-2">
                        <span class="text-[var(--color-text-primary)] font-medium">{{ customer.name }}</span>
                        @if (customer.hasUnbilledOrders) {
                          <span class="w-2 h-2 bg-amber-500 rounded-full" title="Has pending unbilled orders"></span>
                        }
                      </div>
                    </td>
                    <td class="py-4 px-6 text-[var(--color-text-secondary)]">{{ customer.mobile }}</td>
                    <td class="py-4 px-6 text-[var(--color-text-muted)]">
                      @if (customer.palNumbers?.length) {
                        <div class="flex flex-wrap gap-1">
                          @for (pal of customer.palNumbers; track pal) {
                            <span class="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300">{{ pal }}</span>
                          }
                        </div>
                      } @else {
                        -
                      }
                    </td>
                    <td class="py-4 px-6 text-[var(--color-text-muted)]">{{ customer.address || '-' }}</td>
                    <td class="py-4 px-6 text-[var(--color-text-muted)]">{{ customer.alternateContact || '-' }}</td>
                    <td class="py-4 px-6">
                      <div class="flex items-center justify-center gap-2">
                        <button 
                          (click)="navigateToRentalOrders(customer)" 
                          class="w-9 h-9 rounded-lg bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 transition-colors" 
                          title="Rental Orders"
                        >
                          <i class="fas fa-truck-loading"></i>
                        </button>
                        <button 
                          (click)="navigateToBillHistory(customer)" 
                          class="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors" 
                          title="Bill History"
                        >
                          <i class="fas fa-history"></i>
                        </button>
                        <button 
                          (click)="editCustomer(customer)"
                          class="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                          title="Edit"
                        >
                          <i class="fas fa-edit"></i>
                        </button>
                        <button 
                          (click)="deleteCustomer(customer)"
                          class="w-9 h-9 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                        >
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="py-16 text-center text-[var(--color-text-muted)]">
                      <i class="fas fa-users text-4xl mb-4 opacity-50"></i>
                      <p>No customers found</p>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
      
      <!-- Modal -->
      <app-modal #modal [title]="isEditing() ? 'Edit Customer' : 'Add Customer'" size="md">
        <form [formGroup]="customerForm" (ngSubmit)="onSubmit()">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Name *</label>
              <input 
                type="text"
                formControlName="name"
                class="input-dark w-full"
                placeholder="Customer name"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Mobile *</label>
              <input 
                type="text"
                formControlName="mobile"
                class="input-dark w-full"
                placeholder="Mobile number"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Pal Numbers</label>
              <ng-select
                [items]="[]"
                [addTag]="true"
                [multiple]="true"
                [selectOnTab]="true"
                [isOpen]="false"
                formControlName="palNumbers"
                placeholder="Type and press Enter"
                class="custom-select"
              >
              </ng-select>
              <p class="text-xs text-slate-500 mt-1">Multi-word text allowed. Press Enter to add.</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Address</label>
              <input 
                type="text"
                formControlName="address"
                class="input-dark w-full"
                placeholder="Address"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Alternate Contact</label>
              <input 
                type="text"
                formControlName="alternateContact"
                class="input-dark w-full"
                placeholder="Alternate contact"
              >
            </div>
          </div>
          
          <div class="flex gap-3 mt-6">
            <button 
              type="button"
              (click)="modal.close()"
              class="flex-1 py-3 rounded-xl bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              [disabled]="customerForm.invalid || isSaving()"
              class="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 transition-all"
            >
              @if (isSaving()) {
                <i class="fas fa-spinner fa-spin mr-2"></i>
              }
              {{ isEditing() ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </app-modal>
    </div>
  `,
  styles: [`
    .custom-select ::ng-deep .ng-select-container {
      background-color: var(--color-bg-input);
      border-color: var(--color-border);
      color: var(--color-text-primary);
      border-radius: 0.75rem;
      padding: 4px;
    }
  `]
})
export class CustomersComponent implements OnInit {
  @ViewChild('modal') modal!: ModalComponent;

  private customerService = inject(CustomerService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  customers = signal<Customer[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);
  isEditing = signal(false);
  editingId = signal<number | null>(null);
  billingFilter = signal<'ALL' | 'BILLED' | 'UNBILLED'>('ALL');

  unbilledCount = computed(() => this.customers().filter(c => c.hasUnbilledOrders).length);
  billedCount = computed(() => this.customers().filter(c => c.hasBilledOrders).length);

  // Search & Sort State
  searchFilters = signal({
    name: '',
    mobile: '',
    palNumbers: '',
    address: '',
    alternateContact: ''
  });

  sortConfig = signal<{ column: string, direction: 'asc' | 'desc' }>({
    column: 'name',
    direction: 'asc'
  });

  filteredCustomers = computed(() => {
    let result = this.customers();
    const filters = this.searchFilters();
    const sort = this.sortConfig();
    const bFilter = this.billingFilter();

    // 1. Text Filters
    if (filters.name) result = result.filter(c => c.name.toLowerCase().includes(filters.name.toLowerCase()));
    if (filters.mobile) result = result.filter(c => c.mobile.includes(filters.mobile));
    if (filters.address) result = result.filter(c => c.address?.toLowerCase().includes(filters.address.toLowerCase()));
    if (filters.alternateContact) result = result.filter(c => c.alternateContact?.includes(filters.alternateContact));
    if (filters.palNumbers) {
      const term = filters.palNumbers.toLowerCase();
      result = result.filter(c => c.palNumbers?.some(p => p.toLowerCase().includes(term)));
    }

    // 2. Billing Filter
    if (bFilter === 'UNBILLED') {
      result = result.filter(c => c.hasUnbilledOrders);
    } else if (bFilter === 'BILLED') {
      result = result.filter(c => c.hasBilledOrders);
    }

    // 3. Sort
    return result.sort((a, b) => {
      const direction = sort.direction === 'asc' ? 1 : -1;
      let valA: any = '';
      let valB: any = '';

      switch (sort.column) {
        case 'name':
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case 'palNumbers':
          valA = a.palNumbers?.[0] || '';
          valB = b.palNumbers?.[0] || '';
          break;
        default:
          return 0;
      }

      if (valA < valB) return -1 * direction;
      if (valA > valB) return 1 * direction;
      return 0;
    });
  });

  customerForm: FormGroup;

  constructor() {
    this.customerForm = this.fb.group({
      name: ['', Validators.required],
      mobile: ['', Validators.required],
      palNumbers: [[]],
      address: [''],
      alternateContact: ['']
    });
  }

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.customerService.getAll().subscribe({
      next: (customers) => {
        this.customers.set(customers);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onSort(column: string) {
    const current = this.sortConfig();
    if (current.column === column) {
      this.sortConfig.set({ column, direction: current.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      this.sortConfig.set({ column, direction: 'asc' });
    }
  }

  updateFilter(column: string, value: string) {
    this.searchFilters.update(filters => ({ ...filters, [column]: value }));
  }

  navigateToRentalOrders(customer: Customer) {
    this.router.navigate(['/rental-orders'], { queryParams: { customerName: customer.name } });
  }

  navigateToBillHistory(customer: Customer) {
    this.router.navigate(['/billing/history'], { queryParams: { customerName: customer.name } });
  }

  openModal(): void {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.customerForm.reset();
    this.modal.open();
  }

  editCustomer(customer: Customer): void {
    this.isEditing.set(true);
    this.editingId.set(customer.id);
    this.customerForm.patchValue(customer);
    this.modal.open();
  }

  deleteCustomer(customer: Customer): void {
    if (confirm(`Delete customer "${customer.name}"?`)) {
      this.customerService.delete(customer.id).subscribe({
        next: () => {
          this.toastService.success('Customer deleted successfully');
          this.loadCustomers();
        }
      });
    }
  }

  onSubmit(): void {
    if (this.customerForm.invalid) return;

    this.isSaving.set(true);
    const data = this.customerForm.value;

    const request = this.isEditing()
      ? this.customerService.update(this.editingId()!, data)
      : this.customerService.create(data);

    request.subscribe({
      next: () => {
        this.toastService.success(this.isEditing() ? 'Customer updated' : 'Customer created');
        this.modal.close();
        this.loadCustomers();
        this.isSaving.set(false);
      },
      error: () => {
        this.isSaving.set(false);
      }
    });
  }
}
