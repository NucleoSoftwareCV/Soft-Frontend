import { Component, input, output } from '@angular/core';
import { LucideTriangleAlert, LucideX } from '@lucide/angular';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [LucideTriangleAlert, LucideX],
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

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
