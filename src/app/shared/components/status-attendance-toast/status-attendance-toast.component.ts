import { Component, input, output} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideCircleCheck, LucideX } from '@lucide/angular';

@Component({
  selector: 'app-status-attendance-toast',
  imports: [CommonModule, LucideCircleCheck, LucideX],
  templateUrl: './status-attendance-toast.component.html',
  styleUrl: './status-attendance-toast.component.css'
})
export class StatusAttendanceToastComponent{
  title = input.required<string>();
  description = input.required<string>();
  type = input<'positivo' | 'negativo'>('positivo');
  closed = output<void>();

  onClose() {
    this.closed.emit();
  }
}
