# Acceso a citas desde el perfil profesional

Primera etapa de la agenda, sobre `feature/professional-agenda`.

## Comportamiento actual

- El perfil ajeno que permite mostrar sesiones 1 a 1 ofrece «Reservar una cita».
- Sin sesión, abre el acceso existente y conserva el perfil y el ancla de servicios.
- Google y contraseña usan los mismos servicios de autenticación existentes.
- El destino se conserva al pasar por selección de cuenta, registro y bienvenida.
- Las cuentas con rol profesional mantienen la elección entre sitio público y panel.
- En el sitio público se muestran los servicios publicados del profesional; se puede elegir uno para solicitar una cita. No se modifican los pagos existentes.
- Se diferencian carga, error con reintento y ausencia de servicios.
- El destino se transmite como una ruta interna, sin guardar tokens ni datos personales adicionales. Se rechazan enlaces externos y bucles hacia acceso/bienvenida.

## Continuación implementada

La disponibilidad real, selección de modalidad/sede/fecha/horario y envío de solicitudes ya están conectados. Consultar `professional-appointments.md` para configurar y probar el flujo. No se añaden canales de comunicación ni correo.

## Validación

Pruebas enfocadas:

```powershell
npx ng test --watch=false --ts-config=tsconfig.appointment.spec.json '--include=src/app/**/*.appointment.spec.ts'
```

Compilación:

```powershell
npx ng build
```

Comprobación manual: abrir un perfil ajeno con sesiones habilitadas, pulsar «Reservar una cita», acceder y comprobar que vuelve al mismo perfil y muestra sus servicios. Repetir con una cuenta que deba completar la bienvenida.
