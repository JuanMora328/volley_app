# API VolleyFlow

Todos los endpoints usan `/api`, JSON y, salvo `health` y `auth/login`, requieren `Authorization: Bearer <JWT>`. Swagger se publica en `/api/docs` en desarrollo o con `SWAGGER_ENABLED=true`.

## Jugadores

| Método | Ruta                  | Descripción                                |
| ------ | --------------------- | ------------------------------------------ |
| GET    | `/players`            | Lista paginada                             |
| POST   | `/players`            | Crea `{ name, defaultLevel, notes? }`      |
| GET    | `/players/:id`        | Obtiene detalle                            |
| PATCH  | `/players/:id`        | Edita nombre, nivel o notas                |
| PATCH  | `/players/:id/status` | Cambia `{ active }` sin eliminación física |

## Canchas

| Método | Ruta                 | Descripción                                                        |
| ------ | -------------------- | ------------------------------------------------------------------ |
| GET    | `/venues`            | Lista paginada; busca nombre o dirección                           |
| POST   | `/venues`            | Crea `{ name, address?, defaultCourtPrice, defaultGatoradePrice }` |
| GET    | `/venues/:id`        | Obtiene detalle                                                    |
| PATCH  | `/venues/:id`        | Edita datos y precios                                              |
| PATCH  | `/venues/:id/status` | Cambia `{ active }` sin eliminación física                         |

Los listados aceptan `search`, `status=active|inactive|all`, `page` (desde 1), `limit` (1–100), `sortBy=name|createdAt` y `sortOrder=ASC|DESC`. Jugadores también acepta `sortBy=defaultLevel`; la interfaz lo utiliza de forma descendente. Responden `{ items, meta: { total, page, limit, totalPages } }`.

Los nombres se recortan y no pueden quedar vacíos. El nivel es entero de 1 a 5. Los precios son pesos COP enteros no negativos. Un UUID inexistente responde 404 y un token ausente o inválido responde 401.
