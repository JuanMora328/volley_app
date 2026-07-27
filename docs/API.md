# API VolleyFlow

Todas las rutas salvo `/api/health` y `/api/auth/login` requieren `Authorization: Bearer <JWT>`.

## Jornadas (Fase 3)

- `GET /api/sessions?status=DRAFT&date=2026-07-27&page=1&limit=20`: lista paginada, ordenada por fecha descendente.
- `POST /api/sessions`: crea un borrador con fecha, cancha existente (`venueId`) o manual (`venueName`), precios enteros, número de equipos y puntaje.
- `GET /api/sessions/:id`: detalle, snapshots, participantes, equipos, métricas y acciones permitidas.
- `PATCH /api/sessions/:id`: edita información mientras el estado sea `DRAFT`.
- `POST /api/sessions/:id/players`: agrega una lista `{ players: [{ playerId, levelSnapshot? }] }`.
- `PATCH /api/sessions/:id/players/:sessionPlayerId`: edita nivel y banderas futuras de reparto.
- `DELETE /api/sessions/:id/players/:sessionPlayerId`: retira un participante.
- `POST /api/sessions/:id/teams/generate`: genera/regenera; acepta `seed` opcional para pruebas.
- `PUT /api/sessions/:id/teams`: guarda composición manual completa.
- `POST /api/sessions/:id/teams/confirm`: confirma y pasa a `TEAMS_CREATED`.
- `POST /api/sessions/:id/cancel`: cancela un borrador.

Los errores de estado o composición retornan `400`, los duplicados `409` y recursos inexistentes `404`.

## Fase 4 — competición

Todas las rutas requieren JWT. `POST /sessions/:id/rotation/draw` (y `redraw`) persiste un orden aleatorio; `GET /rotation` reconstruye enfrentamiento y cola. `POST /matches/start` crea el único partido activo y toma un snapshot del objetivo. `POST /matches/:matchId/result` confirma el marcador. `GET /matches` admite `status`, `order`, `page` y `limit`; `GET /standings` deriva la tabla. `DELETE /matches/latest` revierte exclusivamente el último resultado. `PATCH /target-score` cambia solo el próximo objetivo. `POST /cancel` conserva el agregado en solo lectura. `DELETE /sessions/:id`, con JSON `{ "confirmation": "ELIMINAR" }`, lo elimina físicamente.
