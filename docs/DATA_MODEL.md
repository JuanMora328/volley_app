# Modelo de datos — Fase 2

## `players`

`id uuid` (PK), `name varchar`, `default_level integer` (CHECK 1–5), `notes text null`, `active boolean`, `created_at timestamptz` y `updated_at timestamptz`.

## `venues`

`id uuid` (PK), `name varchar`, `address text null`, `default_court_price integer` y `default_gatorade_price integer` (ambos CHECK ≥ 0), `active boolean`, `created_at timestamptz` y `updated_at timestamptz`.

La migración `1764200000000-CreatePlayersAndVenues.ts` crea tablas, restricciones e índices por estado/nombre. TypeORM opera con `synchronize: false`.
