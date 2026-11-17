# Adaptación regional de OONA a Perú

Se utilizaron como referencia los datos de `origin/nube`, sin fusionar esa rama.

## Datos operativos

- Catálogo del equipo: 36 entradas con país PE (incluye ciudades y departamentos).
- Moneda predeterminada PEN, precios de demostración en soles; se mantienen los importes del equipo. No es una conversión de euros a soles.
- Zona de negocio y visualización de sesiones: America/Lima. Formato es-PE.
- Ciudad predeterminada de Inicio: Arequipa. El filtro «Todas» continúa mostrando todas las ciudades.
- Prefijo de ejemplo para formularios: +51.

## Mapa y sedes iniciales

| Sede | Ciudad / referencia | Latitud | Longitud |
|---|---|---|---|
| Centro Holistico Miraflores | Lima / Miraflores | -12.121000 | -77.029000 |
| Casa Bienestar San Isidro | Lima / San Isidro | -12.099000 | -77.035000 |
| Cada de vista | Lima / Lima Cercado | -12.046000 | -77.043000 |

Son puntos orientativos de distrito, NO la geolocalización comprobada de los negocios ni de las direcciones Av. Larco 123 y Av. Javier Prado 456. La tercera sede conserva el nombre de la semilla del equipo para no duplicarla, pero no presenta «hola» como dirección. La interfaz señala las aproximaciones.

Referencias geográficas:
- Miraflores: https://es.wikipedia.org/wiki/Distrito_de_Miraflores_(Lima)
- San Isidro: https://www.munisanisidro.gob.pe/Transparencia/Tema02/PDLC%20FASE%201%20CON%20INF%20TEC%20CEPLAN.pdf
- Lima Cercado: punto orientativo redondeado de Lima central, sin atribución a una sede real.

## Aplicación sobre datos existentes

Al reiniciar el backend con un perfil que ejecuta las semillas (por ejemplo dev), se añade el catálogo peruano y se completan las tres sedes.
Se reconocen las direcciones iniciales sin coordenadas y los pares exactos de coordenadas aproximadas que generamos antes. Se conservan los IDs de las sedes, sus relaciones con sesiones y su estado inactivo.
Las direcciones, referencias, coordenadas o ciudades corregidas manualmente no se sobrescriben. Tampoco se combinan coordenadas parciales con valores aproximados.
Las ciudades históricas ES quedan inactivas, sin eliminarlas ni romper referencias. Los mapas públicos ya excluyen ciudades inactivas.
Las ubicaciones privadas de los usuarios no se trasladan de país ni se inventan: cada usuario debe editar su referencia en Preferencias si corresponde.
Los eventos y sesiones iniciales reciben PEN al ejecutarse sus semillas. Las compras históricas y los precios creados por usuarios no se convierten ni se reetiquetan automáticamente.
No se ejecutó ninguna migración directamente contra una base de datos externa durante esta actividad.

## Pendientes del equipo antes de completar la retirada de referencias españolas

La revisión de nube aún muestra contactos con dominio oona.es, cuentas de redes, WhatsApp +34 y domicilio/identidad legal españoles. No se inventaron contactos, RUC, domicilio, dominio o políticas legales peruanas.
El equipo debe confirmar esos datos oficiales y revisar sus páginas legales. No sustituir dominios de CDN por dominios inexistentes: rompería las imágenes.
Las sedes requieren direcciones reales confirmadas. El catálogo del equipo mezcla ciudades con departamentos y registra province igual a name; se respeta ese contrato por compatibilidad, pendiente de normalización geográfica del equipo.

## Rutas

Se reutilizan el mapa y el servicio existentes, conservando la indicación de aproximación y la ausencia de tiempos inventados. El servidor de demostración OSRM sigue limitado al desarrollo local autorizado. Sin ruta válida se muestra distancia en línea recta y no se fabrica una duración.
