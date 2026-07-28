# Especificación de producto implementada

## Fase 3 — Preparación de jornada

El organizador crea un borrador en tres pasos: información, participantes y confirmación. El detalle ofrece Resumen, Jugadores y Equipos; Partidos y Pagos se identifican como pendientes. Desde Equipos puede generar, regenerar, renombrar, mover jugadores con selectores móviles, guardar y confirmar. El dashboard y `/sessions` usan jornadas reales.

El alcance termina en `TEAMS_CREATED`: no se sortean equipos, no se inicia rotación y no se registran partidos, resultados o pagos.

## Control de competición

La jornada confirmada permite sortear, volver a sortear, iniciar explícitamente cada partido, llevar un marcador local y confirmarlo. La pantalla muestra cola, siguiente rival, historial y posiciones derivadas, permite preparar el objetivo futuro y deshacer el resultado más reciente. Cancelación y eliminación son acciones separadas con advertencias diferentes.

## Perfil, historial y administración

La Fase 6 incorpora perfil histórico, historial global con filtros y resumen, y ajustes mobile-first. ORGANIZER dispone de acceso de solo lectura.
