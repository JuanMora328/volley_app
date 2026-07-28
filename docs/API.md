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

# Liquidación y cierre (Fase 5)

- `GET /api/sessions/:id/settlement`: datos, posiciones y sugerencia de campeón.
- `POST /api/sessions/:id/settlement/preview`: calcula sin persistir.
- `POST /api/sessions/:id/settlement`: confirma el snapshot financiero.
- `GET /api/sessions/:id/payments`: recaudo, saldos, créditos y participantes.
- `PATCH /api/sessions/:id/payments/:sessionPlayerId`: corrige un pago completo, parcial o superior al saldo.
- `POST /api/sessions/:id/finish`: cierra; requiere `confirmPendingPayments` si hay deuda.
- `GET /api/sessions/:id/summary`: resumen deportivo y financiero final.

Todos requieren JWT. Los montos son enteros en COP.

La vista previa y la confirmación reciben `courtHourlyPrice`, `courtDurationMinutes`,
`gatoradePrice` (unitario), `championTeamId` y las inclusiones. El servidor recalcula
`courtPrice = courtHourlyPrice × courtDurationMinutes / 60` y devuelve
`gatoradeWinnerCount` y `gatoradeTotal = gatoradePrice × gatoradeWinnerCount`; nunca confía
en totales del cliente. La vista previa no persiste. La confirmación es transaccional y conserva
los pagos existentes. `PATCH payments` continúa disponible después de `FINISHED`.

## Administración histórica (Fase 6)

- `GET /api/players/:id/profile` y `/sessions`: perfil y participaciones paginadas.
- `GET /api/sessions` y `/history/summary`: historial filtrable y agregados.
- `GET/PATCH /api/settings`: configuración singleton; PATCH es exclusivo de ADMIN.
