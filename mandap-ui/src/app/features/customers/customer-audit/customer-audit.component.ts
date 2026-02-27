import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService } from '@core/services';
import { DateFormatPipe } from '@shared';

@Component({
  selector: 'app-customer-audit',
  standalone: true,
  imports: [CommonModule, DateFormatPipe],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button (click)="goBack()" class="w-10 h-10 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center">
            <i class="fas fa-arrow-left"></i>
          </button>
          <div>
            <h1 class="text-3xl font-bold text-[var(--color-text-primary)]">Customer Audit Log</h1>
            <p class="text-[var(--color-text-secondary)] mt-1">
              History for: <span class="text-teal-400 font-semibold">{{ customerName() }}</span>
            </p>
          </div>
        </div>
      </div>

      @if (isLoading()) {
        <div class="flex flex-col items-center justify-center py-20">
          <div class="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
          <p class="mt-4 text-slate-400">Fetching audit history...</p>
        </div>
      } @else {
        <div class="max-w-4xl mx-auto">
          <!-- Timeline View -->
          <div class="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
            
            @for (audit of auditHistory(); track audit.revisionNumber) {
              <div class="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <!-- Icon -->
                <div class="flex items-center justify-center w-10 h-10 rounded-full border border-slate-700 bg-slate-900 text-slate-300 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-colors duration-300 group-hover:border-teal-500 group-hover:text-teal-400">
                  <i [class]="getActionIcon(audit.action)"></i>
                </div>
                
                <!-- Content Card -->
                <div class="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-xl transition-all duration-300 hover:border-teal-500/50 hover:shadow-teal-500/5">
                  <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                       <time class="font-bold text-teal-400">{{ audit.revisionDate | dateFormat:'long' }}</time>
                    </div>
                    <div class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                      Rev #{{ audit.revisionNumber }}
                    </div>
                  </div>

                  <div class="space-y-3">
                    <div class="flex items-center gap-2">
                       <span class="text-xs text-slate-500">Action:</span>
                       <span [class]="getActionClass(audit.action)" class="text-xs font-bold px-2 py-0.5 rounded uppercase">
                         {{ audit.action }}
                       </span>
                    </div>

                    <div class="flex items-center gap-2">
                       <span class="text-xs text-slate-500">Modified By:</span>
                       <span class="text-xs font-semibold text-slate-300 flex items-center gap-1">
                         <i class="fas fa-user-circle text-slate-500"></i> {{ audit.changedBy }}
                       </span>
                    </div>

                    <div class="mt-4 pt-4 border-t border-slate-800">
                      <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Changes Summary</p>
                      <div class="space-y-2">
                        @for (change of audit.changes | keyvalue; track change.key) {
                          <div class="flex flex-col bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/50">
                            <span class="text-teal-500 text-[10px] font-bold uppercase tracking-wider mb-1">{{ change.key }}</span>
                            <div class="flex items-center gap-2">
                              @if (change.value.oldValue !== null) {
                                <span class="text-slate-500 line-through text-xs">{{ formatValue(change.value.oldValue) }}</span>
                                <i class="fas fa-long-arrow-alt-right text-slate-600"></i>
                              }
                              <span class="text-slate-200 text-xs font-medium">{{ formatValue(change.value.newValue) }}</span>
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }

            @if (auditHistory().length === 0) {
              <div class="text-center py-20 bg-[var(--color-bg-card)] rounded-3xl border border-dashed border-slate-700">
                <i class="fas fa-history text-5xl text-slate-700 mb-4"></i>
                <p class="text-slate-400">No audit logs available for this customer.</p>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class CustomerAuditComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private customerService = inject(CustomerService);

  auditHistory = signal<any[]>([]);
  isLoading = signal(true);
  customerName = signal('Customer');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadAudit(parseInt(id));
    }
  }

  loadAudit(id: number): void {
    // Also fetch customer info for name display
    this.customerService.getById(id).subscribe(c => this.customerName.set(c.name));

    this.customerService.getAuditHistory(id).subscribe({
      next: (data) => {
        this.auditHistory.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/customers']);
  }

  getActionIcon(action: string): string {
    switch (action) {
      case 'CREATE': return 'fas fa-plus-circle';
      case 'UPDATE': return 'fas fa-pen';
      case 'DELETE': return 'fas fa-trash-alt';
      default: return 'fas fa-info-circle';
    }
  }

  getActionClass(action: string): string {
    switch (action) {
      case 'CREATE': return 'bg-green-500/20 text-green-400 border border-green-500/20';
      case 'UPDATE': return 'bg-blue-500/20 text-blue-400 border border-blue-500/20';
      case 'DELETE': return 'bg-red-500/20 text-red-400 border border-red-500/20';
      default: return 'bg-slate-500/20 text-slate-400 border border-slate-500/20';
    }
  }

  formatValue(value: any): string {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return JSON.stringify(value);
    return value.toString();
  }
}
