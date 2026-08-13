import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmDialogComponent } from './confirm-dialog';

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ConfirmDialogComponent] }).compileComponents();
    fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.componentRef.setInput('title', '¿Dejar de seguir?');
    fixture.componentRef.setInput('description', 'Esta acción requiere confirmación.');
  });

  it('remains hidden until it is opened', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alertdialog"]')).toBeNull();
  });

  it('emits confirmation from the destructive action', () => {
    const confirmed = vi.fn();
    fixture.componentInstance.confirmed.subscribe(confirmed);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.confirm-dialog__button--danger').click();

    expect(confirmed).toHaveBeenCalledOnce();
  });
});
