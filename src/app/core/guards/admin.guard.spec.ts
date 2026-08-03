import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { adminGuard } from './admin.guard';

describe('adminGuard', () => {
  const auth = {
    isLoggedIn: false,
    roles: [] as string[],
  };
  const router = {
    createUrlTree: vi.fn((commands: string[]) => ({ commands })),
  };

  beforeEach(() => {
    auth.isLoggedIn = false;
    auth.roles = [];
    router.createUrlTree.mockClear();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('redirects anonymous users to the ERP login', () => {
    const result = TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));

    expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/erp/login']);
    expect(result).toEqual({ commands: ['/auth/erp/login'] });
  });

  it('rejects authenticated users without the ADMIN role', () => {
    auth.isLoggedIn = true;
    auth.roles = ['USER'];

    const result = TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));

    expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
    expect(result).toEqual({ commands: ['/'] });
  });

  it('allows authenticated administrators', () => {
    auth.isLoggedIn = true;
    auth.roles = ['USER', 'ADMIN'];

    const result = TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));

    expect(result).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });
});
