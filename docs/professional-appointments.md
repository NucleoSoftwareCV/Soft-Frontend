# Solicitudes de citas individuales — etapa funcional

## Alcance

La rama `feature/professional-agenda` permite elegir un servicio, modalidad, sede (si corresponde), fecha y horario; revisar el motivo y guardar una solicitud vinculada al cliente autenticado. La solicitud no equivale a una cita aceptada ni inicia cobros.

El panel profesional incorpora **Agenda de citas**, con franjas semanales, vistas de solicitudes pendientes, diarias, semanales y mensuales, y acciones de aceptar, rechazar/cancelar y marcar completadas después de finalizar. Los horarios se muestran en `America/Lima` y los precios proceden del servicio, sin convertir importes.

## Datos y validaciones

- Se reutilizan `professional_availability`, `schedule_blocks` y `session_bookings`. En `session_bookings` se guardan el actor, momento y motivo de cancelación, además del horario anterior y el motivo de una reprogramación.
- Días de la semana ISO: lunes 1 a domingo 7. La franja sin sede corresponde a videollamada; con sede activa, a presencial.
- La duración proviene del servicio publicado. Los descansos se configuran dejando intervalos entre franjas.
- Se respetan fechas de vigencia, bloqueos existentes y reservas pendientes vigentes o confirmadas.
- Los intervalos contiguos son válidos; los solapamientos no. No se admiten citas pasadas ni fuera de los próximos 90 días.
- Se bloquean las filas del cliente y el profesional durante el envío. Así, dos clientes no ocupan el mismo horario y un cliente no reserva simultáneamente con dos profesionales.
- Precio, moneda, duración, cliente y estado se calculan en el backend, no se aceptan del navegador.
- El profesional solo administra su agenda. No puede aceptar una solicitud vencida ni completar una cita futura.
- Las solicitudes pendientes vencidas liberan el horario al consultar disponibilidad. Su estado se presenta como `EXPIRADA`, conservando el registro histórico.
- La retención predeterminada es de 1440 minutos. `OONA_APPOINTMENTS_HOLD_MINUTES` permite configurarla entre 5 y 4320 minutos; reiniciar el backend tras cambiarla.
- Las citas ligadas a compras anteriores no se incluyen en esta agenda ni pueden modificarse con estas acciones, aunque sí bloquean horarios ocupados.

## Prueba manual

1. Reiniciar el backend desde IntelliJ y recargar Angular.
2. Acceder con una cuenta profesional: panel profesional → **Agenda de citas** → **Configurar disponibilidad semanal**.
3. Añadir un día y una franja suficientes para la duración de un servicio publicado. Para presencial, seleccionar su sede; para videollamada, elegir esa modalidad.
4. Acceder con otra cuenta con rol USER. Abrir el perfil público del mismo profesional → **Reservar una cita**.
5. Seleccionar servicio, modalidad, sede y fecha que coincidan con la franja guardada. Elegir un horario, escribir el motivo y revisar.
6. Enviar. Debe aparecer un código y «Pendiente de aceptación».
7. Desde la cuenta profesional, seleccionar esa fecha en Agenda y aceptar la solicitud. El horario sigue ocupado.
8. Rechazar/cancelar otra solicitud y comprobar que libera el horario. Cambiar modalidad o fecha debe borrar la selección anterior.
9. Desde **Mi espacio → Mis citas 1:1**, reprogramar una cita futura. El horario anterior debe liberarse, el nuevo debe quedar ocupado y la solicitud debe volver a `PENDIENTE` hasta que el profesional la acepte.

No se publican franjas de ejemplo automáticamente. Si todavía no hay configuración real, el cliente verá que no existen horarios disponibles.

## API

Cliente, rol USER:

- GET `/api/v1/appointments/services/{id}` — opciones del servicio.
- GET `/api/v1/appointments/services/{id}/availability?date=YYYY-MM-DD&modality=ONLINE` — horarios. Para PRESENCIAL, añadir `locationId`.
- POST `/api/v1/appointments/requests` — `serviceId`, `modality`, `locationId`, `startsAt` ISO UTC y `reason`.
- GET `/api/v1/appointments/requests/me` — historial de citas del cliente.
- PATCH `/api/v1/appointments/requests/{id}/cancel` — cancelación con motivo obligatorio.
- PATCH `/api/v1/appointments/requests/{id}/reschedule` — nueva modalidad, sede, fecha/hora y motivo. Conserva la referencia y devuelve la cita a `PENDIENTE`.

Profesional, rol PROFESSIONAL:

- GET/POST `/api/v1/professional-agenda/availability`.
- DELETE `/api/v1/professional-agenda/availability/{id}`.
- GET `/api/v1/professional-agenda/requests?date=YYYY-MM-DD` y consulta por rango de hasta 31 días.
- GET `/api/v1/professional-agenda/requests/pending`.
- PATCH `/api/v1/professional-agenda/requests/{id}` — `status`: CONFIRMADA, CANCELADA o COMPLETADA.

## Pendiente de otras etapas de la asignación

Editor de bloqueos por fecha, configuración del enlace de videollamada, contactos e historial ampliado. No se crea automáticamente ninguna sala de Meet, correo, chat o bandeja adicional; la comunicación sigue reservada al trabajo de Franz.
