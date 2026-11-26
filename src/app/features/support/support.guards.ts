import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

export const supportLoginGuard: CanActivateFn = () =>
  inject(AuthService).isLoggedIn || inject(Router).createUrlTree(['/soporte/ingresar']);
