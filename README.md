# Oona — Frontend (Soft-Frontend)

Frontend de la plataforma **Oona**, el marketplace de experiencias de bienestar del núcleo de desarrollo de software. Permite a los clientes descubrir y reservar experiencias (eventos, retiros y sesiones individuales 1:1), a los profesionales gestionar su catálogo de servicios y al administrador operar la plataforma desde un panel ERP.

> Backend: [NucleoSoftwareCV/Soft-Backend](https://github.com/NucleoSoftwareCV/Soft-Backend)

---

## Funcionalidad

El frontend cubre los tres perfiles de la plataforma:

**Usuario cliente (explorador)**
- Catálogo público de experiencias de bienestar: explorar, retiros y sesiones 1:1, y perfiles públicos de profesionales.
- Búsqueda en vivo con sugerencias (eventos, sesiones, organizadores y categorías) desde la página de inicio.
- Filtros combinables: categoría, precio, fechas, ciudad, modalidad (online/presencial), horario y recurrencia.
- Registro e inicio de sesión (email/contraseña y Google), recuperación de contraseña, onboarding de intereses y preferencias.
- Favoritos, seguimiento de profesionales y personalización por ciudad e intereses.
- Reserva y pago (tarjeta o YAPE, pasarela simulada), comprobante digital, coordinación por WhatsApp e historial de "Mis reservas".
- Comunidad: Círculo Oona, Match Bienestar, Conocer Gente y grupo de WhatsApp.

**Profesional**
- Postulación desde Círculo Oona (sujeta a aprobación del administrador).
- Panel profesional: Mis eventos, Sesiones 1:1 y Perfil público.
- Creación/edición de eventos con imágenes, fechas (ocurrencias) con aforo y modalidad; sesiones 1:1 con precio y reserva online; ciclo borrador → publicado; listado de asistentes por fecha.

**Administrador**
- Panel ERP con acceso restringido por rol: resumen operativo, gestión de solicitudes profesionales (aprobar/rechazar), catálogo de ciudades y catálogos de eventos (categorías, tipos de experiencia, temas y técnicas de sesión).

## Stack

| Tecnología | Uso |
|------------|-----|
| Angular 21 (standalone + signals, zoneless) | Framework SPA/SSR |
| Angular SSR (`@angular/ssr`) + Express | Renderizado en servidor |
| RxJS | Programación reactiva (búsqueda en vivo, debounces) |
| CSS con design tokens propio | Sistema de estilos (Cormorant Garamond + Inter) |
| Swiper · @lucide/angular · ngx-image-cropper | Carruseles, iconos y recorte de imágenes |
| Vitest + jsdom | Tests unitarios |
| Docker + Nginx | Despliegue (SSR detrás de reverse proxy) |

## Requisitos

- **Node.js** `20.19+`, `22.12+` o `24+`
- **npm** `8+`
- Backend **Soft-Backend** corriendo en `http://localhost:8083` (ver su README)

## Puesta en marcha (desarrollo)

```bash
# 1. Clonar
git clone https://github.com/NucleoSoftwareCV/Soft-Frontend.git
cd Soft-Frontend

# 2. Instalar dependencias (node_modules no viene en el clone)
npm ci        # o: npm install

# 3. Levantar (incluye --proxy-config proxy.config.json)
npm start
```

La app queda disponible en **http://localhost:4200**. El dev server redirige `/api` → `http://localhost:8083` (definido en `proxy.config.json`), de modo que no hay CORS en desarrollo.

> Este proyecto corre **zoneless** (Angular 21): no instales ni declares `zone.js`. Tampoco es necesario configurar polyfills.

## Cuentas de prueba

El backend siembra usuarios de prueba (ver README del backend):

| Usuario | Email | Contraseña | Rol |
|---------|-------|-----------|-----|
| `user1` | `user1@oona.es` | `User1?` | Cliente |
| `admin_main1` | `admin1@oona.es` | `Admin1@` | Administrador |
| `professional_demo` | `professional_demo@oona.es` | *(ver seeder)* | Cliente + Profesional |

El acceso de administrador se realiza desde el portal ERP (`/auth/erp/login`).

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm start` | Servidor de desarrollo con proxy al backend (`localhost:4200`) |
| `npm run start:local` | `ng serve` sin proxy (usa `environment.development.ts` con URL absoluta) |
| `npm run build` | Build de producción (SSR: `dist/Fronted/browser` + `dist/Fronted/server`) |
| `npm run watch` | Build incremental en modo desarrollo |
| `npm test` | Tests unitarios (Vitest + jsdom) |
| `npm run serve:ssr:Fronted` | Sirve el build SSR compilado (`node dist/Fronted/server/server.mjs`) |
| `npm run docker:build` / `docker:up` / `docker:down` / `docker:logs` | Ciclo de vida de Docker Compose |

## Estructura del proyecto

```
src/app/
├── features/                # Módulos funcionales (lazy loaded)
│   ├── home/                #   Inicio: hero, buscador en vivo, secciones
│   ├── explorar/            #   Catálogo, filtros y detalle de evento
│   ├── sesiones/            #   Sesiones 1:1 (listado y detalle)
│   ├── retiros/             #   Retiros
│   ├── profesionales/       #   Perfiles públicos de profesionales
│   ├── auth/                #   Login, registro, ERP y recuperación
│   ├── onboarding/          #   Intereses y ciudad tras el registro
│   ├── preferencias · preferences/
│   ├── perfil/              #   Mi espacio (perfil, favoritos, reservas)
│   ├── favoritos/
│   ├── circulo-oona/        #   Comunidad y postulación profesional
│   ├── match-bienestar/     #   Solicitud de emparejamiento
│   ├── professional-portal/ #   Panel del profesional (eventos, 1:1, perfil)
│   ├── admin/               #   Panel ERP del administrador
│   ├── legales/             #   Aviso legal, privacidad, cookies, términos
│   └── whatsapp/            #   Grupo de WhatsApp
├── core/
│   ├── components/          #   Header y footer globales
│   ├── guards/              #   adminGuard, roleGuard, authGuard
│   └── services/            #   AuthService, interceptores (JWT + refresh)
├── services/                # Servicios de dominio (eventos, checkout, filtros…)
└── shared/                  # Modelos y utilidades compartidas
```

## Entornos y SSR

- `src/environments/environment.development.ts` → `apiUrl: 'http://localhost:8083/api/v1'`
- `src/environments/environment.ts` (producción) → `apiUrl: '/api/v1'` (relativo, servido detrás de Nginx)
- `angular.json` compila con `outputMode: "server"` (SSR).
- `app.routes.server.ts`: las rutas con guard (`/admin`, `/perfil`, `/preferencias`, `/onboarding`, `/profesional`) se declaran con **`RenderMode.Client`** para que la sesión (localStorage) se evalúe en el navegador. Toda ruta nueva protegida debe añadirse ahí.

## Despliegue con Docker

```bash
npm run docker:build   # construye la imagen (Node 20 alpine, multi-stage)
npm run docker:up      # levanta angular (SSR, interno :4000) + nginx (público :80)
```

`docker-compose.yml` orquesta dos servicios: el servidor Express con SSR (no expuesto) y Nginx como reverse proxy en el puerto 80, ambos en la red `oona-net` con healthchecks.

## Convenciones

- Componentes standalone con `signals` para el estado; RxJS (`debounceTime` + `switchMap`) para flujos reactivos.
- Los textos de la interfaz están en español.
- Cada funcionalidad vive en `features/<modulo>/`; los servicios HTTP en `services/`; los modelos compartidos en `shared/`.
