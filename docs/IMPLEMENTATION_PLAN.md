# VolleyFlow — Plan de implementación

La aplicación usa exclusivamente PostgreSQL y TypeORM (`synchronize: false`). Cada fase se limita a su dominio y conserva compatibilidad con las anteriores.

| Fase                               | Estado    | Objetivo y vistas                                                            | Backend / entidades                                                                      | Pruebas y aceptación                                                                |
| ---------------------------------- | --------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 0. Inicialización                  | ✅        | Monorepo pnpm, Next.js y NestJS                                              | DataSource TypeORM, PostgreSQL, health                                                   | Instalación, lint, tipos y build reproducibles                                      |
| 1. Acceso y visión general         | ✅        | Login, layout protegido y dashboard                                          | `User`, auth JWT, seed admin, dashboard                                                  | Login, token, protección y dashboard vacío                                          |
| 2. Jugadores y canchas             | ✅        | Listados mobile-first `/players` y `/venues`, formularios, filtros y estados | `Player`, `Venue`; CRUD sin DELETE; paginación; migración y seed demo                    | Validación, búsqueda, edición, baja lógica, conteo de activos, UI vacía/error/carga |
| 3. Preparación de jornada          | ✅        | Crear jornada en tres pasos, participantes, detalle y equipos                | `GameSession`, `SessionPlayer`, `Team`, `TeamPlayer`; endpoints de borrador y generación | Persistencia del wizard, cupos, niveles y balance reproducible                      |
| 4. Partidos y competición          | ✅        | Sorteo, partido activo, historial y posiciones                               | `Match`; rotación, resultados y standings                                                | Reglas de turno, integridad de marcadores y reconstrucción                          |
| 5. Pagos y cierre                  | ✅        | Pagos, liquidación y cierre                                                  | Pagos y snapshots de liquidación                                                         | Dinero entero, distribución exacta e inmutabilidad al cerrar                        |
| 6. Perfil, historial y ajustes     | ✅        | Perfil, historial y reglas generales                                         | Consultas históricas y configuración                                                     | Permisos, filtros y trazabilidad                                                    |
| 7. Auditoría, pruebas y despliegue | Pendiente | Accesibilidad, observabilidad y operación                                    | Auditoría, seguridad y pipeline                                                          | E2E PostgreSQL, rendimiento, respaldo y despliegue                                  |

## Endpoints terminados en Fase 2

- Jugadores: `GET/POST /api/players`, `GET/PATCH /api/players/:id`, `PATCH /api/players/:id/status`.
- Canchas: `GET/POST /api/venues`, `GET/PATCH /api/venues/:id`, `PATCH /api/venues/:id/status`.
- Dashboard: `GET /api/dashboard` cuenta únicamente jugadores activos; métricas de módulos futuros permanecen en cero.

## Criterio para iniciar Fase 3

Ejecutar migraciones y seed sobre PostgreSQL, validar los flujos autenticados de Fase 2 y diseñar el contrato transaccional del wizard antes de implementar jornadas. No mezclar partidos, pagos ni cierre en esa tarea.

## Fase 3 terminada

Se implementaron el wizard de tres pasos, detalle, lista, generación/edición/confirmación de equipos, dashboard real, entidades y migración transaccional. La confirmación termina en `TEAMS_CREATED`; partidos, rotación y pagos permanecen fuera de alcance. Las pruebas de dominio cubren tamaños 5/2, 10/2, 10/3 y 13/4, reproducibilidad, extremos de nivel y métricas.

## Fase 4 terminada

Se implementaron sorteo transaccional, reconstrucción ganador-se-queda, partido activo, snapshots de objetivo, resultados, historial, posiciones, deshacer, cancelación y eliminación física. La migración agrega restricciones e índice parcial. La finalización financiera se completa en la Fase 5.

## Fase 5 terminada

Se implementaron la sugerencia deportiva de campeón sin desempate alfabético, vista previa y confirmación transaccional, reparto entero exacto, exclusiones, pagos parciales y sobrepagos, cierre con deudores y pagos posteriores. La cancha deriva su total entero de tarifa por hora y duración; Gatorade deriva su total del precio unitario por cada campeón y se distribuye solo entre perdedores. Las rutas web `/settlement`, `/payments` y `/summary` consumen la API real, conservan pagos al recalcular y mantienen confirmaciones explícitas.

## Fase 6 terminada

El perfil deriva participación, competición, niveles y finanzas desde snapshots. El historial global pagina y combina búsqueda y filtros en PostgreSQL. La configuración singleton aplica sus valores únicamente a jornadas nuevas; las reglas fijas son informativas y solo ADMIN puede guardar ajustes.
