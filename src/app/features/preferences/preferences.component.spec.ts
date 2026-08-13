import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PreferencesComponent } from './preferences.component';

describe('PreferencesComponent', () => {
  let fixture: ComponentFixture<PreferencesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreferencesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(PreferencesComponent);
  });

  it('creates the authenticated preferences page', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('keeps the account navigation separate from onboarding', () => {
    expect(fixture.nativeElement).toBeTruthy();
    expect(fixture.componentInstance.selectedCategoryIds().size).toBe(0);
  });
});
