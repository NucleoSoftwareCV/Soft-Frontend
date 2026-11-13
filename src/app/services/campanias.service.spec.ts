import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { CampaniasService } from './campanias.service';
import { environment } from '../../environments/environment';

describe('CampaniasService', () => {
  let service: CampaniasService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CampaniasService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consulta las campañas visibles', () => {
    service.getActive().subscribe((campaigns) => expect(campaigns).toEqual([]));
    http.expectOne(`${environment.apiUrl}/campaigns/active`).flush([]);
  });

  it('consulta el detalle y mis participaciones por slug', () => {
    service.getBySlug('sorteo-bienestar').subscribe();
    http.expectOne(`${environment.apiUrl}/campaigns/sorteo-bienestar`).flush({});

    service.getMyEntries('sorteo-bienestar').subscribe();
    http.expectOne(`${environment.apiUrl}/campaigns/sorteo-bienestar/entries/me`).flush({});
  });
});
