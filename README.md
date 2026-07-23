# VolleyFlow

VolleyFlow es una aplicación web para gestionar jornadas de vóley: jugadores, canchas, armado de equipos, partidos, pagos y resumen de cada sesión. El repositorio está organizado como un monorepo con `pnpm`, separando el backend, el frontend y los tipos/utilidades compartidas.

## Estructura del proyecto

```text
apps/
  api/      Backend NestJS + TypeORM + PostgreSQL
  web/      Frontend Next.js + React + Tailwind CSS
packages/
  shared/   Tipos, constantes y utilidades compartidas
docs/       Documentación funcional y técnica
design/     Referencias visuales y prototipos
```

## Stack principal

- **Monorepo:** pnpm workspaces.
- **Backend:** NestJS, TypeORM, PostgreSQL, JWT, Swagger, Helmet y validación con `class-validator`.
- **Frontend:** Next.js App Router, React, Tailwind CSS y TanStack Query.
- **Compartido:** paquete `@volleyflow/shared` para contratos y tipos comunes.

## Requisitos previos

- Node.js compatible con las dependencias del proyecto.
- pnpm `9.15.0` o superior.
- Docker y Docker Compose para levantar PostgreSQL localmente.

## Configuración de variables de entorno

Puedes trabajar con una base de datos local en Docker **o** con una base de datos remota como Neon. La diferencia está únicamente en el valor de `DATABASE_URL`:

- **Docker local:** usa la URL del `docker-compose.yml`: `postgres://volleyflow:volleyflow@localhost:5432/volleyflow`.
- **Neon u otro PostgreSQL remoto:** reemplaza `DATABASE_URL` y `MIGRATION_DATABASE_URL` por el connection string que te entregue el proveedor. En Neon normalmente también debes usar `DATABASE_SSL=true`.

El repositorio incluye archivos de ejemplo para que puedas copiarlos y completar tus valores locales:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

> Nota: si ejecutas los servicios desde la raíz con `pnpm dev`, asegúrate de que las variables estén disponibles para cada proceso. Para desarrollo local puedes usar `.env` en la raíz y también los archivos específicos de cada app cuando necesites sobreescribir valores.


### Docker local vs Neon

#### Opción A: PostgreSQL local con Docker

Usa esta opción si quieres desarrollar sin depender de servicios externos. Levanta el contenedor con:

```bash
docker compose up -d postgres
```

Y deja estas variables:

```env
DATABASE_URL=postgres://volleyflow:volleyflow@localhost:5432/volleyflow
MIGRATION_DATABASE_URL=postgres://volleyflow:volleyflow@localhost:5432/volleyflow
DATABASE_SSL=false
```

#### Opción B: PostgreSQL remoto con Neon

Usa esta opción si quieres conectar la API a una base de datos en Neon. No necesitas levantar el servicio `postgres` de Docker; solo reemplaza las variables por el connection string de Neon:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
MIGRATION_DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=false
```

> Importante: no subas credenciales reales al repositorio. Los archivos `.env.example` son solo plantillas.

### Variables principales del backend

- `DATABASE_URL`: URL de conexión a PostgreSQL usada por la API.
- `MIGRATION_DATABASE_URL`: URL opcional para comandos de migraciones; si no existe, se usa `DATABASE_URL`.
- `DATABASE_SSL`: activa SSL para la conexión a base de datos cuando vale `true`.
- `DATABASE_SSL_REJECT_UNAUTHORIZED`: controla la validación del certificado SSL.
- `DATABASE_POOL_MAX`: tamaño máximo del pool de conexiones.
- `JWT_SECRET`: secreto para firmar tokens JWT.
- `CORS_ORIGIN`: orígenes permitidos para CORS, separados por coma.
- `PORT`: puerto del backend.
- `SWAGGER_ENABLED`: habilita Swagger fuera de desarrollo cuando vale `true`.
- `SEED_ADMIN_EMAIL`, `SEED_ADMIN_NAME`, `SEED_ADMIN_PASSWORD`: credenciales usadas por el seed inicial.

### Variables principales del frontend

- `NEXT_PUBLIC_API_URL`: URL pública del backend con el prefijo `/api`.

## Instalación

Desde la raíz del repositorio:

```bash
pnpm install
```

## Levantar la base de datos

El proyecto trae un `docker-compose.yml` con PostgreSQL 16:

```bash
docker compose up -d postgres
```

La configuración local por defecto usa:

- Usuario: `volleyflow`
- Password: `volleyflow`
- Base de datos: `volleyflow`
- Puerto: `5432`

## Levantar el backend

Antes de iniciar la API, los scripts de desarrollo compilan automáticamente `@volleyflow/shared`. Esto evita errores como `Cannot find module '@volleyflow/shared'` cuando la API importa enums y tipos compartidos.

1. Copia y completa las variables de entorno:

   ```bash
   cp apps/api/.env.example apps/api/.env
   ```

2. Inicia PostgreSQL:

   ```bash
   docker compose up -d postgres
   ```

3. Levanta la API en modo desarrollo:

   ```bash
   pnpm dev:api
   ```

Por defecto, la API queda disponible en:

- API REST: `http://localhost:3001/api`
- Health check: `http://localhost:3001/api/health`
- Swagger: `http://localhost:3001/api/docs` cuando `NODE_ENV=development` o `SWAGGER_ENABLED=true`.

### Seed de usuario administrador

Para crear el usuario administrador definido en tus variables `SEED_ADMIN_*`:

```bash
pnpm --filter @volleyflow/api seed
```

## Levantar el frontend

1. Copia y completa las variables de entorno:

   ```bash
   cp apps/web/.env.example apps/web/.env.local
   ```

2. Levanta la app web:

   ```bash
   pnpm dev:web
   ```

Por defecto, el frontend queda disponible en `http://localhost:3000` y consume la API desde `NEXT_PUBLIC_API_URL`.

## Levantar todo en desarrollo

Con PostgreSQL ya iniciado, puedes levantar backend y frontend en paralelo desde la raíz:

```bash
pnpm dev
```

## Comandos útiles

```bash
pnpm build       # Compila todos los paquetes/apps
pnpm typecheck   # Ejecuta TypeScript sin emitir archivos
pnpm test        # Ejecuta tests configurados
pnpm lint        # Formatea con Prettier y ejecuta lint:check donde exista
```

También puedes ejecutar scripts por app:

```bash
pnpm --filter @volleyflow/api typecheck
pnpm --filter @volleyflow/web typecheck
pnpm --filter @volleyflow/api test
pnpm --filter @volleyflow/web test
```

## Documentación adicional

- `docs/API.md`: endpoints disponibles y contratos principales.
- `docs/DESIGN_IMPLEMENTATION.md`: guía de implementación visual.
- `docs/IMPLEMENTATION_PLAN.md`: plan técnico del proyecto.
