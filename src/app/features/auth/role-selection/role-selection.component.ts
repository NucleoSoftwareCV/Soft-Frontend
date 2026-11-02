import { Component, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';

type AccountType = 'usuario' | 'profesional';

@Component({
  selector: 'app-role-selection',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './role-selection.component.html',
  styleUrl: './role-selection.component.css',
})
export class RoleSelectionComponent {
  private readonly router = inject(Router);

  activeTab = signal<AccountType>('usuario');
  errorMessage = signal<string | null>(null);

  dismissError(): void {
    this.errorMessage.set(null);
  }

  selectTab(tab: AccountType): void {
    this.activeTab.set(tab);
    this.errorMessage.set(null);
  }

  handleRegisterNavigation(): void {
    if (this.activeTab() === 'profesional') {
      this.router.navigate(['/circulo-oona']);
    } else {
      this.router.navigate(['/auth/register']);
    }
  }
}
