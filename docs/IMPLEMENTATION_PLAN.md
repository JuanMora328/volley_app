# VolleyFlow — Plan de implementación

La aplicación usa exclusivamente PostgreSQL y TypeORM (`synchronize: false`). Cada fase se limita a su dominio y conserva compatibilidad con las anteriores.

| Fase                               | Estado    | Objetivo y vistas                                                            | Backend / entidades                                                                      | Pruebas y aceptación                                                                |
| ---------------------------------- | --------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 0. Inicialización                  | ✅        | Monorepo pnpm, Next.js y NestJS                                              | DataSource TypeORM, PostgreSQL, health                                                   | Instalación, lint, tipos y build reproducibles                                      |
| 1. Acceso y visión general         | ✅        | Login, layout protegido y dashboard                                          | `User`, auth JWT, seed admin, dashboard                                                  | Login, token, protección y dashboard vacío                                          |
| 2. Jugadores y canchas             | ✅        | Listados mobile-first `/players` y `/venues`, formularios, filtros y estados | `Player`, `Venue`; CRUD sin DELETE; paginación; migración y seed demo                    | Validación, búsqueda, edición, baja lógica, conteo de activos, UI vacía/error/carga |
| 3. Preparación de jornada          | Pendiente | Crear jornada en tres pasos, participantes, detalle y equipos                | `GameSession`, `SessionPlayer`, `Team`, `TeamPlayer`; endpoints de borrador y generación | Persistencia del wizard, cupos, niveles y balance reproducible                      |
| 4. Partidos y competición          | Pendiente | Sorteo, partido activo, historial y posiciones                               | `Match`; rotación, resultados y standings                                                | Reglas de turno, integridad de marcadores y reconstrucción                          |
| 5. Pagos y cierre                  | Pendiente | Pagos, liquidación y cierre                                                  | Pagos y snapshots de liquidación                                                         | Dinero entero, distribución exacta e inmutabilidad al cerrar                        |
| 6. Perfil, historial y ajustes     | Pendiente | Perfil, historial y reglas generales                                         | Consultas históricas y configuración                                                     | Permisos, filtros y trazabilidad                                                    |
| 7. Auditoría, pruebas y despliegue | Pendiente | Accesibilidad, observabilidad y operación                                    | Auditoría, seguridad y pipeline                                                          | E2E PostgreSQL, rendimiento, respaldo y despliegue                                  |

## Endpoints terminados en Fase 2

- Jugadores: `GET/POST /api/players`, `GET/PATCH /api/players/:id`, `PATCH /api/players/:id/status`.
- Canchas: `GET/POST /api/venues`, `GET/PATCH /api/venues/:id`, `PATCH /api/venues/:id/status`.
- Dashboard: `GET /api/dashboard` cuenta únicamente jugadores activos; métricas de módulos futuros permanecen en cero.

## Criterio para iniciar Fase 3

Ejecutar migraciones y seed sobre PostgreSQL, validar los flujos autenticados de Fase 2 y diseñar el contrato transaccional del wizard antes de implementar jornadas. No mezclar partidos, pagos ni cierre en esa tarea.
