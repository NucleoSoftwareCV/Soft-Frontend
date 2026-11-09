import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { AuthReturnService } from './auth-return.service';

describe('Retorno seguro tras autenticarse', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));
  const snapshot = (url: string | null) => ({ queryParamMap: convertToParamMap(url ? { returnUrl: url } : {}) }) as ActivatedRouteSnapshot;
  it('conserva profesional, intención y ancla sin almacenar datos de la cuenta', () => {
    const url = '/profesionales/ana-gomez?reservar=1#citas';
    const service = TestBed.inject(AuthReturnService);
    expect(service.queryParams(snapshot(url))).toEqual({ returnUrl: url });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    service.resume(snapshot(url));
    expect(navigate).toHaveBeenCalledWith(url);
  });
  it.each(['https://otro.test', '//otro.test', '/%2f%2fotro.test', '/\\otro.test', '/auth/login', '/onboarding', '/%61uth/login', '/perfil%0aprohibido', '/%ZZ'])('rechaza destinos externos, inválidos o bucles: %s', url => {
    expect(TestBed.inject(AuthReturnService).destination(url)).toBeNull();
  });
  it('usa la salida normal cuando no hay destino válido', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const service = TestBed.inject(AuthReturnService);
    service.resume(snapshot(null), '/explorar');
    expect(navigate).toHaveBeenCalledWith('/explorar');
    expect(service.queryParams(snapshot('//otro.test'))).toEqual({});
  });
});
