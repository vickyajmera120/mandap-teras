import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RoleService, ToastService } from '@core/services';
import { Role, Permission } from '@core/models';
import { ModalComponent, LoadingSpinnerComponent } from '@shared';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, LoadingSpinnerComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-[var(--color-text-primary)]">Role Management</h1>
          <p class="text-[var(--color-text-secondary)] mt-1">Manage roles and permissions</p>
        </div>
        <button 
          (click)="openModal()"
          class="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold hover:from-teal-600 hover:to-teal-700 shadow-lg shadow-teal-500/30 transition-all"
        >
          <i class="fas fa-plus mr-2"></i>Add Role
        </button>
      </div>
      
      @if (isLoading()) {
        <app-loading-spinner></app-loading-spinner>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (role of roles(); track role.id) {
            <div class="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-2xl border border-[var(--color-border)] p-6 hover:border-teal-500/50 transition-all">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <i class="fas fa-shield-alt text-white"></i>
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold text-[var(--color-text-primary)]">{{ role.name }}</h3>
                    <p class="text-sm text-[var(--color-text-muted)]">{{ role.description || 'No description' }}</p>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button 
                    (click)="editRole(role)"
                    class="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                  >
                    <i class="fas fa-edit text-xs"></i>
                  </button>
                  <button 
                    (click)="deleteRole(role)"
                    class="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    <i class="fas fa-trash text-xs"></i>
                  </button>
                </div>
              </div>
              <div class="flex flex-wrap gap-1">
                @for (perm of role.permissions; track perm) {
                  <span class="px-2 py-1 bg-teal-500/20 text-teal-400 rounded text-xs">{{ perm }}</span>
                }
                @empty {
                  <span class="text-[var(--color-text-muted)] text-sm">No permissions assigned</span>
                }
              </div>
            </div>
          } @empty {
            <div class="col-span-full text-center py-16 text-[var(--color-text-muted)]">
              <i class="fas fa-shield-alt text-4xl mb-4 opacity-50"></i>
              <p>No roles found</p>
            </div>
          }
        </div>
      }
      
      <app-modal #modal [title]="isEditing() ? 'Edit Role' : 'Add Role'" size="md">
        <form [formGroup]="roleForm" (ngSubmit)="onSubmit()">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Role Name *</label>
              <input 
                type="text"
                formControlName="name"
                class="input-dark w-full"
                placeholder="Role name"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Description</label>
              <textarea 
                formControlName="description"
                rows="2"
                class="input-dark w-full"
                placeholder="Description"
              ></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Permissions</label>
              <div class="bg-[var(--color-bg-hover)] rounded-xl p-4 max-h-48 overflow-y-auto space-y-2">
                @for (perm of permissions(); track perm.id) {
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      [value]="perm.id"
                      (change)="togglePermission($event, perm.id)"
                      [checked]="selectedPermissions().includes(perm.id)"
                      class="w-4 h-4 rounded bg-[var(--color-bg-input)] border-[var(--color-border)] text-teal-500"
                    >
                    <span class="text-[var(--color-text-secondary)] text-sm">{{ perm.name }}</span>
                  </label>
                }
              </div>
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
              [disabled]="roleForm.invalid || isSaving()"
              class="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold disabled:opacity-50 transition-all"
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
export class RolesComponent implements OnInit {
  @ViewChild('modal') modal!: ModalComponent;

  private roleService = inject(RoleService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  roles = signal<Role[]>([]);
  permissions = signal<Permission[]>([]);
  selectedPermissions = signal<number[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);
  isEditing = signal(false);
  editingId = signal<number | null>(null);

  roleForm: FormGroup;

  constructor() {
    this.roleForm = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.roleService.getPermissions().subscribe(p => this.permissions.set(p));
    this.roleService.getAll().subscribe({
      next: (roles) => {
        this.roles.set(roles);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  openModal(): void {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.roleForm.reset();
    this.selectedPermissions.set([]);
    this.modal.open();
  }

  editRole(role: Role): void {
    this.isEditing.set(true);
    this.editingId.set(role.id);
    this.roleForm.patchValue(role);
    // This assumes permissions are IDs - adjust based on your API
    this.selectedPermissions.set([]);
    this.modal.open();
  }

  deleteRole(role: Role): void {
    if (confirm(`Delete role "${role.name}"?`)) {
      this.roleService.delete(role.id).subscribe({
        next: () => {
          this.toastService.success('Role deleted');
          this.loadData();
        }
      });
    }
  }

  togglePermission(event: globalThis.Event, permId: number): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedPermissions.update(p => [...p, permId]);
    } else {
      this.selectedPermissions.update(p => p.filter(id => id !== permId));
    }
  }

  onSubmit(): void {
    if (this.roleForm.invalid) return;

    this.isSaving.set(true);
    const data = {
      ...this.roleForm.value,
      permissionIds: this.selectedPermissions()
    };

    const request = this.isEditing()
      ? this.roleService.update(this.editingId()!, data)
      : this.roleService.create(data);

    request.subscribe({
      next: () => {
        this.toastService.success(this.isEditing() ? 'Role updated' : 'Role created');
        this.modal.close();
        this.loadData();
        this.isSaving.set(false);
      },
      error: () => this.isSaving.set(false)
    });
  }
}

