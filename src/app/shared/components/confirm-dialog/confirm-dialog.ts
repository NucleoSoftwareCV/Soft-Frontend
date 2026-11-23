import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideTriangleAlert, LucideX } from '@lucide/angular';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [FormsModule, LucideTriangleAlert, LucideX],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css',
})
export class ConfirmDialogComponent {
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly confirmLabel = input('Confirmar');
  readonly cancelLabel = input('Volver');
  readonly loading = input(false);
  readonly reasonLabel = input<string | null>(null);
  readonly reasonPlaceholder = input('Explica brevemente el motivo');
  readonly reasonRequired = input(false);
  readonly reasonMaxLength = input(500);
  readonly reason = signal('');
  readonly reasonTouched = signal(false);

  readonly confirmed = output<string>();
  readonly cancelled = output<void>();

  confirm(): void {
    const reason = this.reason().trim();
    this.reasonTouched.set(true);
    if (this.reasonRequired() && !reason) return;
    this.confirmed.emit(reason);
    this.resetReason();
  }

  cancel(): void {
    if (this.loading()) return;
    this.resetReason();
    this.cancelled.emit();
  }

  private resetReason(): void {
    this.reason.set('');
    this.reasonTouched.set(false);
  }
}
