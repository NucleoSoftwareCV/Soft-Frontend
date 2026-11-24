import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';

/** Carries only an internal destination through the existing authentication pages. */
@Injectable({ providedIn: 'root' })
export class AuthReturnService {
  private readonly router = inject(Router);

  destination(value: string | null): string | null {
    if (!value || value.length > 2048) return null;
    try {
      const decoded = decodeURIComponent(value);
      if (!decoded.startsWith('/') || decoded.startsWith('//') || /[\\\u0000-\u0020]/.test(decoded)) return null;
      const tree = this.router.parseUrl(value);
      const primary = tree.root.children['primary'];
      const first = primary?.segments[0]?.path.toLowerCase();
      if (!first || ['auth', 'login', 'register', 'onboarding'].includes(first)) return null;
      if (Object.keys(tree.root.children).some(outlet => outlet !== 'primary')) return null;
      return this.router.serializeUrl(tree);
    } catch {
      return null;
    }
  }

  queryParams(route: ActivatedRouteSnapshot): { returnUrl?: string } {
    const returnUrl = this.destination(route.queryParamMap.get('returnUrl'));
    return returnUrl ? { returnUrl } : {};
  }

  resume(route: ActivatedRouteSnapshot, fallback = '/'): void {
    void this.router.navigateByUrl(this.destination(route.queryParamMap.get('returnUrl')) ?? fallback);
  }
}
