# Modelo de datos

VolleyFlow usa exclusivamente PostgreSQL + TypeORM con `synchronize: false`.

## Preparación de jornadas

- `GameSessionEntity`: fecha/hora, cancha opcional, `venueNameSnapshot`, precios COP enteros, cantidad de equipos, puntajes, estado y timestamps. Checks impiden precios negativos, menos de dos equipos y puntajes no positivos.
- `SessionPlayerEntity`: referencia histórica protegida al jugador, snapshots de nombre/nivel, banderas de reparto y campos monetarios preparados para Fase 5. La pareja jornada/jugador es única; nivel 1–5.
- `TeamEntity`: pertenece a una jornada, nombre único dentro de ella, color, origen automático y `confirmedAt`.
- `TeamPlayerEntity`: asignación única de un participante. Un trigger PostgreSQL comprueba que equipo y participante pertenecen a la misma jornada.

Las referencias a jugadores usan `RESTRICT`; eliminar una cancha deja la referencia nula pero conserva el snapshot. Los equipos de un borrador se eliminan transaccionalmente al cambiar participantes.

Migración reversible: `1770000000000-CreateSessionsAndTeams.ts`.

## Match (Fase 4)

`matches` conserva secuencia, equipos, marcador, snapshot del objetivo, estado (`IN_PROGRESS`/`FINISHED`), ganador, perdedor y tiempos. Una restricción parcial permite un solo partido activo por jornada; checks protegen equipos distintos, resultados completos, marcadores no negativos y objetivo positivo. Las FK de la jornada y equipos usan cascada para la eliminación física. La cola y las posiciones no se duplican: se reconstruyen del orden inicial de `teams` y partidos finalizados.

# Snapshot financiero de Fase 5

`game_sessions.settled_at` registra la confirmación de la liquidación y `finished_at` el cierre definitivo. `session_players` conserva inclusiones, componentes de cancha/Gatorades, valor debido, valor pagado, método y fecha. El estado, pendiente y crédito son derivados y no se duplican en la base de datos.

`game_sessions.court_hourly_price` conserva la tarifa por hora y `court_duration_minutes` el tiempo jugado en intervalos de 30 minutos. `court_price` conserva el costo total confirmado (`tarifa × minutos / 60`).
