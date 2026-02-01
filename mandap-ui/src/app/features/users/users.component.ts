import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService, RoleService, ToastService } from '@core/services';
import { User, Role } from '@core/models';
import { ModalComponent, LoadingSpinnerComponent, StatusBadgeComponent } from '@shared';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, LoadingSpinnerComponent, StatusBadgeComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-[var(--color-text-primary)]">User Management</h1>
          <p class="text-[var(--color-text-secondary)] mt-1">Manage system users and their roles</p>
        </div>
        <button 
          (click)="openModal()"
          class="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold hover:from-teal-600 hover:to-teal-700 shadow-lg shadow-teal-500/30 transition-all"
        >
          <i class="fas fa-plus mr-2"></i>Add User
        </button>
      </div>
      
      @if (isLoading()) {
        <app-loading-spinner></app-loading-spinner>
      } @else {
        <div class="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-2xl border border-[var(--color-border)] overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-[var(--color-bg-hover)]">
                <tr>
                  <th class="text-left py-4 px-6 text-[var(--color-text-secondary)] font-semibold">Username</th>
                  <th class="text-left py-4 px-6 text-[var(--color-text-secondary)] font-semibold">Full Name</th>
                  <th class="text-left py-4 px-6 text-[var(--color-text-secondary)] font-semibold">Email</th>
                  <th class="text-left py-4 px-6 text-[var(--color-text-secondary)] font-semibold">Roles</th>
                  <th class="text-center py-4 px-6 text-[var(--color-text-secondary)] font-semibold">Status</th>
                  <th class="text-center py-4 px-6 text-[var(--color-text-secondary)] font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (user of users(); track user.id) {
                  <tr class="border-t border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] transition-colors">
                    <td class="py-4 px-6 text-[var(--color-text-primary)] font-medium">{{ user.username }}</td>
                    <td class="py-4 px-6 text-[var(--color-text-secondary)]">{{ user.fullName }}</td>
                    <td class="py-4 px-6 text-[var(--color-text-muted)]">{{ user.email || '-' }}</td>
                    <td class="py-4 px-6">
                      <div class="flex flex-wrap gap-1">
                        @for (role of user.roles; track role.id) {
                          <span class="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">{{ role.name }}</span>
                        }
                      </div>
                    </td>
                    <td class="py-4 px-6 text-center">
                      <app-status-badge [value]="user.active ? 'ACTIVE' : 'INACTIVE'"></app-status-badge>
                    </td>
                    <td class="py-4 px-6">
                      <div class="flex items-center justify-center gap-2">
                        <button 
                          (click)="editUser(user)"
                          class="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                        >
                          <i class="fas fa-edit"></i>
                        </button>
                        <button 
                          (click)="deleteUser(user)"
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
                      <p>No users found</p>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
      
      <app-modal #modal [title]="isEditing() ? 'Edit User' : 'Add User'" size="md">
        <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Username *</label>
              <input 
                type="text"
                formControlName="username"
                class="input-dark w-full"
                placeholder="Username"
              >
            </div>
            @if (!isEditing()) {
              <div>
                <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Password *</label>
                <input 
                  type="password"
                  formControlName="password"
                  class="input-dark w-full"
                  placeholder="Password"
                >
              </div>
            }
            <div>
              <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Full Name *</label>
              <input 
                type="text"
                formControlName="fullName"
                class="input-dark w-full"
                placeholder="Full name"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Email</label>
              <input 
                type="email"
                formControlName="email"
                class="input-dark w-full"
                placeholder="Email"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Roles</label>
              <select 
                formControlName="roleIds"
                multiple
                class="input-dark w-full"
              >
                @for (role of roles(); track role.id) {
                  <option [value]="role.id">{{ role.name }}</option>
                }
              </select>
            </div>
            <div class="flex items-center gap-2">
              <input 
                type="checkbox"
                formControlName="isActive"
                id="isActive"
                class="w-5 h-5 rounded bg-[var(--color-bg-input)] border-[var(--color-border)] text-teal-500"
              >
              <label for="isActive" class="text-[var(--color-text-secondary)]">Active</label>
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
              [disabled]="userForm.invalid || isSaving()"
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
export class UsersComponent implements OnInit {
  @ViewChild('modal') modal!: ModalComponent;

  private userService = inject(UserService);
  private roleService = inject(RoleService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  users = signal<User[]>([]);
  roles = signal<Role[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);
  isEditing = signal(false);
  editingId = signal<number | null>(null);

  userForm: FormGroup;

  constructor() {
    this.userForm = this.fb.group({
      username: ['', Validators.required],
      password: [''],
      fullName: ['', Validators.required],
      email: [''],
      roleIds: [[]],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.roleService.getAll().subscribe(r => this.roles.set(r));
    this.userService.getAll().subscribe({
      next: (users) => {
        this.users.set(users);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  openModal(): void {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.userForm.reset({ isActive: true, roleIds: [] });
    this.userForm.get('password')?.setValidators(Validators.required);
    this.modal.open();
  }

  editUser(user: any): void {
    this.isEditing.set(true);
    this.editingId.set(user.id);
    this.userForm.patchValue({
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      isActive: user.active,
      roleIds: user.roles?.map((r: any) => r.id) || []
    });
    this.userForm.get('password')?.clearValidators();
    this.modal.open();
  }

  deleteUser(user: User): void {
    if (confirm(`Delete user "${user.username}"?`)) {
      this.userService.delete(user.id).subscribe({
        next: () => {
          this.toastService.success('User deleted');
          this.loadData();
        }
      });
    }
  }

  onSubmit(): void {
    if (this.userForm.invalid) return;

    this.isSaving.set(true);
    const formValue = this.userForm.value;
    const data = {
      ...formValue,
      active: formValue.isActive
    };

    const request = this.isEditing()
      ? this.userService.update(this.editingId()!, data)
      : this.userService.create(data);

    request.subscribe({
      next: () => {
        this.toastService.success(this.isEditing() ? 'User updated' : 'User created');
        this.modal.close();
        this.loadData();
        this.isSaving.set(false);
      },
      error: () => this.isSaving.set(false)
    });
  }
}

