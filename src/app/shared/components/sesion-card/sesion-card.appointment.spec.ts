import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { SesionCardComponent } from './sesion-card.component';

describe('La tarjeta fotográfica también permite elegir una cita', () => {
  beforeEach(async () => { await TestBed.configureTestingModule({ imports: [SesionCardComponent], providers: [provideRouter([])] }).compileComponents(); });
  function fixture(selectionMode = false) {
    const f = TestBed.createComponent(SesionCardComponent);
    f.componentRef.setInput('sesion', { id: 10, title: 'Café aromático', specialistName: 'Profesional de prueba', specialistPhotoUrl: '/assets/foto.webp', price: 15, currency: 'PEN', durationMinutes: 60, imageUrl: '/assets/cafe.webp' });
    f.componentRef.setInput('selectionMode', selectionMode); f.detectChanges(); return f;
  }
  it('conserva fotografía, profesional, precio y enlace en la vista habitual', () => {
    const f = fixture(); expect(f.nativeElement.querySelector('a').getAttribute('href')).toBe('/sesiones/10');
    expect(f.nativeElement.querySelector('.card-imagen').getAttribute('src')).toContain('/assets/cafe.webp');
    expect(f.nativeElement.textContent).toContain('Profesional de prueba'); expect(f.nativeElement.textContent).toContain('60 min'); expect(f.nativeElement.textContent).toContain('S/');
  });
  it('selecciona en el mismo perfil usando la misma fotografía, sin navegar al detalle', () => {
    const f = fixture(true); const selected = vi.fn(); f.componentInstance.serviceSelected.subscribe(selected);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    f.nativeElement.querySelector('button').click(); expect(selected).toHaveBeenCalledWith(10); expect(navigate).not.toHaveBeenCalled();
    expect(f.nativeElement.querySelector('.card-imagen').getAttribute('src')).toContain('/assets/cafe.webp');
    f.componentRef.setInput('selected', true); f.detectChanges(); expect(f.nativeElement.querySelector('button').getAttribute('aria-pressed')).toBe('true'); expect(f.nativeElement.textContent).toContain('Servicio seleccionado');
  });
  it('impide cambiar de servicio durante el envío', () => {
    const f = fixture(true); const selected = vi.fn(); f.componentInstance.serviceSelected.subscribe(selected);
    f.componentRef.setInput('selectionDisabled', true); f.detectChanges(); f.nativeElement.querySelector('button').click(); expect(selected).not.toHaveBeenCalled();
  });
});
