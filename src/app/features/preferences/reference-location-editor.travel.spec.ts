import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ReferenceLocationEditorComponent } from './reference-location-editor.component';
import { EventTravelService } from '../../services/event-travel.service';
describe('Editor de ubicación en Preferencias', () => {
  const location = signal<any>(null);
  const save = vi.fn();
  beforeEach(() => {
    location.set(null); save.mockReset();
    TestBed.configureTestingModule({ imports: [ReferenceLocationEditorComponent], providers: [
      provideRouter([]), { provide: EventTravelService, useValue: {
        location, loaded: signal(true), loadError: signal(false), save,
      } },
    ] });
  });
  it('exige confirmar el punto y conserva la selección al editar su etiqueta', () => {
    const f = TestBed.createComponent(ReferenceLocationEditorComponent); f.detectChanges();
    const c = f.componentInstance;
    c.editLabel('Mi barrio'); c.save(); expect(save).not.toHaveBeenCalled();
    c.selectPoint({ latitude: 0, longitude: 0 });
    c.editLabel('Otra referencia'); expect(c.point()).toEqual({ latitude: 0, longitude: 0 });
  });
  it('guarda el punto elegido, incluyendo coordenadas cero, sin alterar otras preferencias', () => {
    const f = TestBed.createComponent(ReferenceLocationEditorComponent); f.detectChanges();
    const c = f.componentInstance;
    c.editLabel(' Mi barrio '); c.selectPoint({ latitude: 0, longitude: 0 }); c.approximate.set(true);
    save.mockReturnValue(of({ label: 'Mi barrio', latitude: 0, longitude: 0, approximate: true }));
    c.save();
    expect(save).toHaveBeenCalledWith({ label: 'Mi barrio', latitude: 0, longitude: 0, approximate: true });
    expect(c.message()).toContain('Ubicación guardada');
    expect(f.nativeElement.querySelector('form')).toBeNull();
  });
  it('guarda el punto elegido antes de escribir la dirección y muestra la confirmación', () => {
    const f = TestBed.createComponent(ReferenceLocationEditorComponent); f.detectChanges();
    const c = f.componentInstance;
    c.selectPoint({ latitude: 40, longitude: -3 }); c.editLabel('Mi punto');
    save.mockReturnValue(of({ label: 'Mi punto', latitude: 40, longitude: -3, approximate: false }));
    c.save(); f.detectChanges();
    expect(save).toHaveBeenCalledWith({ label: 'Mi punto', latitude: 40, longitude: -3, approximate: false });
    expect(f.nativeElement.querySelector('.saved-message').textContent).toContain('Ubicación guardada');
    expect(f.nativeElement.querySelector('details.privacy').open).toBe(false);
  });
  it('conserva el borrador al fallar el guardado', () => {
    const f = TestBed.createComponent(ReferenceLocationEditorComponent); f.detectChanges();
    const c = f.componentInstance; c.editLabel('Mi barrio'); c.selectPoint({ latitude: 40, longitude: -3 });
    save.mockReturnValue(throwError(() => new Error('Unavailable'))); c.save();
    expect(c.busy()).toBe(false); expect(c.label()).toBe('Mi barrio'); expect(c.error()).toContain('No se pudo guardar');
  });
});
