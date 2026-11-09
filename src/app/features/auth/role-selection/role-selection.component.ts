import { AuthReturnService } from '../../../core/services/auth-return.service';
import { Component, inject, signal } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';

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
  private readonly route = inject(ActivatedRoute);
  private readonly authReturn = inject(AuthReturnService);
  readonly authQueryParams = this.authReturn.queryParams(this.route.snapshot);

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
      this.router.navigate(['/auth/register'], { queryParams: this.authQueryParams });
    }
  }
}
