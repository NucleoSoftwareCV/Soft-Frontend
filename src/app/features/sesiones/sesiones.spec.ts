import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { SesionesComponent } from './sesiones';

describe('Sesiones', () => {
  let component: SesionesComponent;
  let fixture: ComponentFixture<SesionesComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SesionesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(SesionesComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    httpMock.expectOne(req => req.url.endsWith('/work-topics/active')).flush([]);
    httpMock.expectOne(req => req.url.endsWith('/techniques/active')).flush([]);
    httpMock.expectOne(req => req.url.endsWith('/one-to-one-services')).flush({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 12,
      number: 0,
    });
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('defaults the technique filter label to "Tipos"', () => {
    expect(component.selectedTechniqueLabel()).toBe('Tipos');
  });

  it('closes an open dropdown when Escape is pressed', () => {
    component.toggleDropdown('topics');
    expect(component.openDropdown()).toBe('topics');

    component.onEscape();
    expect(component.openDropdown()).toBeNull();
  });

  it('closes an open dropdown when clicking outside of it', () => {
    component.toggleDropdown('topics');
    expect(component.openDropdown()).toBe('topics');

    const outsideElement = document.createElement('div');
    component.onDocumentClick({ target: outsideElement } as unknown as Event);
    expect(component.openDropdown()).toBeNull();
  });

  it('keeps the dropdown open when clicking inside it', () => {
    component.toggleDropdown('topics');
    const wrapper = document.createElement('div');
    wrapper.className = 'dropdown-wrapper';
    const inner = document.createElement('button');
    wrapper.appendChild(inner);

    component.onDocumentClick({ target: inner } as unknown as Event);
    expect(component.openDropdown()).toBe('topics');
  });

  it('resets to page 0 and sends the selected filters when a work topic is selected', () => {
    component.selectWorkTopic(5);

    const req = httpMock.expectOne(req => req.url.endsWith('/one-to-one-services'));
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('workTopicId')).toBe('5');
    req.flush({ content: [], totalElements: 0, totalPages: 0, size: 12, number: 0 });
  });

  it('clears the selected work topic if it was deactivated by an admin', () => {
    component.selectedWorkTopicId.set(5);
    component['loadFilterOptions']();

    httpMock.expectOne(req => req.url.endsWith('/work-topics/active')).flush([
      { id: 9, name: 'Otro tema' },
    ]);
    httpMock.expectOne(req => req.url.endsWith('/techniques/active')).flush([]);
    httpMock.expectOne(req => req.url.endsWith('/one-to-one-services')).flush({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 12,
      number: 0,
    });

    expect(component.selectedWorkTopicId()).toBeNull();
  });
});
