# VolleyJRN

La Fase 5 incorpora **Finalizar jornada**, distribución exacta en pesos colombianos, gestión de pagos y cierre financiero. `courtHourlyPrice` es la tarifa por hora, `courtDurationMinutes` el tiempo jugado y `courtPrice` el total recalculado por el servidor. `gatoradePrice` es siempre el precio de una unidad; la cantidad y el total de bebidas se derivan de los integrantes del equipo campeón. Ejecute `pnpm migration:run` en `apps/api` después de configurar PostgreSQL.

Los Gatorades se distribuyen únicamente entre perdedores incluidos y nunca entre campeones. Los pagos pueden corregirse incluso después del cierre, y una jornada con deuda puede finalizar solo mediante confirmación explícita.

VolleyJRN es una aplicación web para gestionar jornadas de vóley: jugadores, canchas, armado de equipos, partidos, pagos y resumen de cada sesión. El repositorio está organizado como un monorepo con `pnpm`, separando el backend, el frontend y los tipos/utilidades compartidas.

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
- **Neon u otro PostgreSQL remoto:** reemplaza `DATABASE_URL` y `MIGRATION_DATABASE_URL` por el connection string que te entregue el proveedor. En Neon normalmente también debes usar `DATABASE_SSL=true` y `sslmode=verify-full` en el connection string.

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
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=verify-full
MIGRATION_DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=verify-full
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=true
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
- `NEXT_PUBLIC_ENABLE_PWA`: permite registrar el service worker fuera de producción para pruebas explícitas; déjalo en `false` durante el desarrollo normal.

La arquitectura, políticas de caché, instalación y validación de la aplicación instalable se documentan en [`docs/PWA.md`](docs/PWA.md).

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

## Migraciones de base de datos

Las migraciones **no se corren automáticamente** al levantar la API, ni con Docker local ni con Neon. La API tiene `migrationsRun` desactivado para evitar cambios de esquema inesperados en ambientes compartidos o productivos.

Para correr migraciones manualmente contra la base configurada en tus variables de entorno:

```bash
pnpm --filter @volleyflow/api migration:run
```

El comando usa `MIGRATION_DATABASE_URL` si está definida; si no, usa `DATABASE_URL`. Por eso, para Neon debes pegar el connection string de Neon en esas variables antes de ejecutar la migración.

> Nota: actualmente el comando busca migraciones en `apps/api/src/database/migrations`. Si todavía no existen archivos de migración, no habrá cambios para aplicar.

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

### Seed de administrador

Para crear el usuario administrador definido en tus variables `SEED_ADMIN_*`:

```bash
pnpm --filter @volleyflow/api seed
```

El seed es idempotente y crea únicamente el administrador y la configuración inicial. Las tres
variables `SEED_ADMIN_*` son obligatorias y la contraseña debe tener al menos 12 caracteres.
Ejecútalo después de `migration:run`.

## Operación con Docker

PostgreSQL conserva sus datos en el volumen `postgres_data` y expone un healthcheck:

```bash
docker compose up -d postgres       # iniciar
docker compose ps                   # comprobar salud
docker compose stop                 # detener conservando datos
docker compose down                 # eliminar contenedor conservando datos
docker compose down --volumes       # eliminar también los datos (destructivo)
```

La imagen de producción de la API se construye desde la raíz. Su entrypoint ejecuta las
migraciones antes de iniciar y aborta si alguna falla:

```bash
docker build -f apps/api/Dockerfile -t volleyflow-api .
docker run --rm -p 3001:3001 --env-file apps/api/.env volleyflow-api
```

En producción configura `NODE_ENV=production`, un `JWT_SECRET` aleatorio de 32 caracteres o
más, `DATABASE_URL`, `CORS_ORIGIN` explícito y `NEXT_PUBLIC_API_URL` durante el build web.
Swagger nunca se publica en producción. Antes de desplegar, realiza un backup administrado de
PostgreSQL y verifica una restauración en un entorno aislado; las migraciones no reemplazan los
backups.

## Despliegue del frontend en Vercel

El repositorio incluye `vercel.json` para que Vercel detecte Next.js dentro del monorepo,
construya `@volleyflow/web` y publique su salida `.next`. De esta forma, las rutas del App Router
(incluidas las rutas dinámicas) siguen siendo atendidas por Next.js al abrirlas directamente o al
refrescar el navegador, en lugar de resolverse como archivos estáticos inexistentes.

Al importar el repositorio en Vercel:

1. Configura **Root Directory** como `apps/web`. La ruta de salida `.next` es relativa a ese
   directorio; no uses `apps/web/.next` porque Vercel intentaría resolver
   `apps/web/apps/web/.next`.
2. Configura `NEXT_PUBLIC_API_URL` como variable de entorno del proyecto antes de construir.
3. No agregues un rewrite global hacia `index.html`; este frontend usa Next.js, no una exportación
   SPA estática.
4. Vuelve a desplegar para que Vercel aplique `vercel.json`.

## Gestión de comunidad y sedes

Con una sesión iniciada, `/players` y `/venues` consumen la API real. Ambas vistas ofrecen búsqueda, estado, paginación, creación, edición y activación/desactivación; los importes de canchas se presentan en COP.

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
- `docs/DATA_MODEL.md`: tablas y restricciones.
- `docs/BUSINESS_RULES.md`: invariantes de dominio.

## Fase 3: jornadas y equipos

Rutas web: `/sessions`, `/sessions/new`, `/sessions/:id` y `/sessions/:id/teams`. El wizard guarda un borrador real, participantes con snapshots y equipos equilibrados. Consulta `docs/API.md`, `docs/DATA_MODEL.md` y `docs/BUSINESS_RULES.md`.

```bash
pnpm install --frozen-lockfile
pnpm --filter @volleyflow/api migration:run
pnpm --filter @volleyflow/api seed
pnpm dev
```

### Competición (Fase 4)

Después de confirmar equipos, abra `/sessions/:id/matches`: sortee el orden, inicie cada partido y confirme el marcador. El objetivo puede cambiarse entre partidos. Historial, posiciones, deshacer, cancelación conservadora y eliminación permanente están disponibles mediante la UI y API documentada en `docs/API.md`. Ejecute `pnpm test`, `pnpm typecheck`, `pnpm lint` y `pnpm build` para validación local; aplique migraciones con `pnpm --filter @volleyflow/api migration:run` sobre PostgreSQL.

## Fase 6: administración histórica

Las rutas `/players/[id]`, `/sessions` y `/settings` ofrecen perfil derivado, historial filtrable y configuración singleton. Ejecuta `pnpm --filter @volleyflow/api migration:run` y `pnpm --filter @volleyflow/api seed` antes de iniciar. Los valores configurados se precargan solamente al crear jornadas nuevas.
