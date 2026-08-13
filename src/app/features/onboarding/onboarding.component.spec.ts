import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { OnboardingComponent } from './onboarding.component';

describe('OnboardingComponent', () => {
  let fixture: ComponentFixture<OnboardingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnboardingComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingComponent);
  });

  it('creates the onboarding experience', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('requires at least one interest before continuing', () => {
    expect(fixture.componentInstance.selectedCategoryIds().size).toBe(0);
  });
});
