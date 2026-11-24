import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { GoogleIdentityService } from './google-identity.service';
import { environment } from '../../../environments/environment';

describe('Google usa la pantalla de acceso actual al retomar una cita', () => {
  const originalClientId = environment.googleClientId;
  let callback: (response: { credential?: string }) => void;
  let initialize: ReturnType<typeof vi.fn>;
  let renderButton: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    TestBed.configureTestingModule({});
    initialize = vi.fn(options => { callback = options.callback; });
    renderButton = vi.fn();
    vi.stubGlobal('google', { accounts: { id: { initialize, renderButton } } });
    environment.googleClientId = 'client-id-de-prueba';
  });
  afterEach(() => { environment.googleClientId = originalClientId; vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  it('no entrega el acceso al componente anterior tras cerrar sesión y volver a reservar', async () => {
    const service = TestBed.inject(GoogleIdentityService);
    const oldLogin = vi.fn(); const appointmentLogin = vi.fn();
    service.renderButton(document.createElement('div'), oldLogin, vi.fn());
    await Promise.resolve();
    callback({ credential: 'primera-prueba' });
    expect(oldLogin).toHaveBeenCalledOnce(); oldLogin.mockClear();
    service.renderButton(document.createElement('div'), appointmentLogin, vi.fn());
    await Promise.resolve();
    callback({ credential: 'segunda-prueba' });
    expect(initialize).toHaveBeenCalledOnce();
    expect(appointmentLogin).toHaveBeenCalledWith('segunda-prueba');
    expect(oldLogin).not.toHaveBeenCalled();
  });
  it('entrega los errores a la pantalla actual y no a la anterior', async () => {
    const service = TestBed.inject(GoogleIdentityService);
    const oldError = vi.fn(); const currentError = vi.fn();
    service.renderButton(document.createElement('div'), vi.fn(), oldError); await Promise.resolve();
    service.renderButton(document.createElement('div'), vi.fn(), currentError); await Promise.resolve();
    callback({});
    expect(currentError).toHaveBeenCalledWith('No se recibió el token de Google.');
    expect(oldError).not.toHaveBeenCalled();
  });
  it('descarta una carga anterior si se cambia de acceso a registro mientras carga Google', async () => {
    const service = TestBed.inject(GoogleIdentityService);
    const first = document.createElement('div'); const current = document.createElement('div');
    service.renderButton(first, vi.fn(), vi.fn());
    service.renderButton(current, vi.fn(), vi.fn());
    await Promise.resolve();
    expect(renderButton).toHaveBeenCalledOnce();
    expect(renderButton.mock.calls[0][0]).toBe(current);
  });
});
