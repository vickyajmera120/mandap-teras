import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
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
      <div class="flex items-center justify-between">
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
      
      <!-- Search -->
      <div class="relative">
        <input 
          type="text"
          (input)="onSearch($event)"
          placeholder="Search by name or mobile..."
          class="w-full md:w-96 px-4 py-3 pl-12 bg-[var(--color-bg-card)] backdrop-blur-xl border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-teal-500/50 transition-all"
        >
        <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"></i>
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
                  <th class="text-left py-4 px-6 text-[var(--color-text-secondary)] font-semibold">Name</th>
                  <th class="text-left py-4 px-6 text-[var(--color-text-secondary)] font-semibold">Mobile</th>
                  <th class="text-left py-4 px-6 text-[var(--color-text-secondary)] font-semibold">Pal No</th>
                  <th class="text-left py-4 px-6 text-[var(--color-text-secondary)] font-semibold">Address</th>
                  <th class="text-left py-4 px-6 text-[var(--color-text-secondary)] font-semibold">Alt. Contact</th>
                  <th class="text-center py-4 px-6 text-[var(--color-text-secondary)] font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (customer of filteredCustomers(); track customer.id) {
                  <tr class="border-t border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] transition-colors">
                    <td class="py-4 px-6 text-[var(--color-text-primary)] font-medium">{{ customer.name }}</td>
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
                          (click)="editCustomer(customer)"
                          class="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
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
                    <td colspan="5" class="py-16 text-center text-[var(--color-text-muted)]">
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
  `
})
export class CustomersComponent implements OnInit {
  @ViewChild('modal') modal!: ModalComponent;

  private customerService = inject(CustomerService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  customers = signal<Customer[]>([]);
  filteredCustomers = signal<Customer[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);
  isEditing = signal(false);
  editingId = signal<number | null>(null);

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
        this.filteredCustomers.set(customers);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onSearch(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    if (!query) {
      this.filteredCustomers.set(this.customers());
      return;
    }

    this.filteredCustomers.set(
      this.customers().filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.mobile.includes(query)
      )
    );
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

