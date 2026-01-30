import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { EventService, ToastService } from '@core/services';
import { Event, EventType } from '@core/models';
import { ModalComponent, LoadingSpinnerComponent, StatusBadgeComponent } from '@shared';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, LoadingSpinnerComponent, StatusBadgeComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-[var(--color-text-primary)]">Events</h1>
          <p class="text-[var(--color-text-secondary)] mt-1">Manage billing events and occasions</p>
        </div>
        <button 
          (click)="openModal()"
          class="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold hover:from-teal-600 hover:to-teal-700 shadow-lg shadow-teal-500/30 transition-all"
        >
          <i class="fas fa-plus mr-2"></i>Create Event
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
                  <th class="text-left py-4 px-6 text-[var(--color-text-secondary)] font-semibold">Event Name</th>
                  <th class="text-left py-4 px-6 text-[var(--color-text-secondary)] font-semibold">Type</th>
                  <th class="text-left py-4 px-6 text-[var(--color-text-secondary)] font-semibold">Year</th>
                  <th class="text-left py-4 px-6 text-[var(--color-text-secondary)] font-semibold">Date</th>

                  <th class="text-left py-4 px-6 text-[var(--color-text-secondary)] font-semibold">Status</th>
                  <th class="text-center py-4 px-6 text-[var(--color-text-secondary)] font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (event of events(); track event.id) {
                  <tr class="border-t border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] transition-colors">
                    <td class="py-4 px-6">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                          <i class="fas fa-calendar-alt text-white"></i>
                        </div>
                        <span class="text-[var(--color-text-primary)] font-medium">{{ event.name }}</span>
                      </div>
                    </td>
                    <td class="py-4 px-6">
                      <span class="px-3 py-1 rounded-full text-xs font-semibold"
                        [ngClass]="{
                          'bg-yellow-500/20 text-yellow-400': event.type === 'FAGUN_SUD_13',
                          'bg-slate-500/20 text-slate-400': event.type === 'NORMAL'
                        }"
                      >
                        {{ event.type === 'FAGUN_SUD_13' ? 'ફાગણ સુદ ૧૩' : 'Normal' }}
                      </span>
                    </td>
                    <td class="py-4 px-6 text-[var(--color-text-secondary)]">{{ event.year }}</td>
                    <td class="py-4 px-6 text-[var(--color-text-muted)]">{{ event.eventDate || '-' }}</td>

                    <td class="py-4 px-6">
                      <app-status-badge [value]="event.active ? 'ACTIVE' : 'INACTIVE'"></app-status-badge>
                    </td>
                    <td class="py-4 px-6">
                      <div class="flex items-center justify-center gap-2">
                        <button 
                          (click)="editEvent(event)"
                          class="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                        >
                          <i class="fas fa-edit"></i>
                        </button>
                        <button 
                          (click)="deleteEvent(event)"
                          class="w-9 h-9 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                        >
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="py-16 text-center text-[var(--color-text-muted)]">
                      <i class="fas fa-calendar-alt text-4xl mb-4 opacity-50"></i>
                      <p>No events found. Create your first event!</p>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
      
      <!-- Modal -->
      <app-modal #modal [title]="isEditing() ? 'Edit Event' : 'Create Event'" size="md">
        <form [formGroup]="eventForm" (ngSubmit)="onSubmit()">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Event Name *</label>
              <input 
                type="text"
                formControlName="name"
                class="input-dark w-full"
                placeholder="Event name"
              >
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Type *</label>
                <select 
                  formControlName="type"
                  class="input-dark w-full"
                >
                  <option value="FAGUN_SUD_13">ફાગણ સુદ ૧૩</option>
                  <option value="NORMAL">Normal</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Year *</label>
                <input 
                  type="number"
                  formControlName="year"
                  class="input-dark w-full"
                  placeholder="2026"
                >
              </div>
            </div>
            <div class="flex items-center gap-2">
              <input 
                type="checkbox"
                formControlName="active"
                id="active"
                class="w-5 h-5 rounded bg-[var(--color-bg-input)] border-[var(--color-border)] text-teal-500 focus:ring-teal-500"
              >
              <label for="active" class="text-[var(--color-text-secondary)]">Active Event</label>
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
              [disabled]="eventForm.invalid || isSaving()"
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
export class EventsComponent implements OnInit {
  @ViewChild('modal') modal!: ModalComponent;

  private eventService = inject(EventService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  events = signal<Event[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);
  isEditing = signal(false);
  editingId = signal<number | null>(null);

  eventForm: FormGroup;

  constructor() {
    this.eventForm = this.fb.group({
      name: ['', Validators.required],
      type: ['FAGUN_SUD_13', Validators.required],
      year: [new Date().getFullYear(), Validators.required],
      eventDate: [''],

      active: [true]
    });
  }

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.eventService.getAll().subscribe({
      next: (events) => {
        console.log('EventsComponent: Fetched events', JSON.stringify(events));
        this.events.set(events);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  openModal(): void {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.eventForm.reset({
      type: 'FAGUN_SUD_13',
      year: new Date().getFullYear(),
      active: true
    });
    this.modal.open();
  }

  editEvent(event: Event): void {
    this.isEditing.set(true);
    this.editingId.set(event.id);
    this.eventForm.patchValue(event);
    this.modal.open();
  }

  deleteEvent(event: Event): void {
    if (confirm(`Delete event "${event.name}"?`)) {
      this.eventService.delete(event.id).subscribe({
        next: () => {
          this.toastService.success('Event deleted successfully');
          this.loadEvents();
        }
      });
    }
  }

  onSubmit(): void {
    if (this.eventForm.invalid) return;

    this.isSaving.set(true);
    const data = this.eventForm.value;

    const request = this.isEditing()
      ? this.eventService.update(this.editingId()!, data)
      : this.eventService.create(data);

    request.subscribe({
      next: () => {
        this.toastService.success(this.isEditing() ? 'Event updated' : 'Event created');
        this.modal.close();
        this.loadEvents();
        this.isSaving.set(false);
      },
      error: () => {
        this.isSaving.set(false);
      }
    });
  }
}

