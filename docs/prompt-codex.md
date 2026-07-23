Actúa como arquitecto de software senior y desarrollador full-stack responsable del proyecto VolleyFlow.

El repositorio actualmente contiene principalmente:

* El archivo prompt-codex.md con la especificación funcional y técnica.
* Los diseños exportados desde Stitch dentro de design/stitch.
* Poca o ninguna implementación funcional en frontend y backend.

Lee completamente prompt-codex.md antes de modificar código y considéralo la fuente principal de requerimientos.

OBJETIVO DE ESTA TAREA

En esta ejecución debes:

1. Inicializar correctamente toda la arquitectura base del proyecto.
2. Crear la planificación por fases.
3. Implementar únicamente la Fase 1: Acceso y Visión General.
4. Validar que la Fase 1 funcione.
5. Detenerte al finalizar la Fase 1.

No implementes todavía jugadores, canchas, creación de jornadas, equipos, partidos, pagos ni cierre de jornadas.

DISEÑOS DISPONIBLES

Dentro de design/stitch existen diseños para las siguientes vistas:

FASE 1: ACCESO Y VISIÓN GENERAL

* Inicio de Sesión - Móvil
* Dashboard - Móvil

FASE 2: GESTIÓN DE COMUNIDAD Y SEDES

* Listado de Jugadores - Móvil
* Listado de Canchas - Móvil

FASE 3: FLUJO DE JORNADA

* Crear Jornada - Paso 1: Información
* Crear Jornada - Paso 2: Participantes
* Crear Jornada - Paso 3: Confirmación
* Detalle de Jornada - Móvil
* Generación de Equipos - Móvil

FASE 4: CONTROL DE COMPETICIÓN

* Sorteo de Partido Inicial - Móvil
* Control de Partido Activo - Móvil
* Historial y Posiciones - Móvil
* Historial de Partidos - Corregido

FASE 5: LIQUIDACIÓN Y CIERRE

* Estado de Pagos - Móvil
* Resumen de Liquidación - Móvil
* Cierre de Jornada - Corregido

FASE 6: ADMINISTRACIÓN Y PERFIL

* Perfil de jugador - Móvil
* Historial de jornadas - Móvil
* Ajustes y reglas - Móvil

Utiliza los archivos de Stitch como referencia visual.

No copies ciegamente código generado por Stitch. Reconstruye las vistas correctamente con Next.js, Tailwind CSS, shadcn/ui y componentes reutilizables.

PASO 1: INSPECCIÓN

Antes de implementar:

1. Inspecciona completamente el repositorio.
2. Lee prompt-codex.md.
3. Identifica todos los archivos dentro de design/stitch.
4. Determina qué diseños corresponden a Inicio de Sesión y Dashboard.
5. Revisa la configuración Git existente.
6. Detecta archivos incompletos, duplicados o referencias residuales a Prisma.
7. Confirma que el proyecto utilizará exclusivamente TypeORM.

PASO 2: PLANIFICACIÓN

Crea:

docs/IMPLEMENTATION_PLAN.md

El documento debe organizar el desarrollo en estas fases:

* Fase 0: Inicialización técnica.
* Fase 1: Acceso y visión general.
* Fase 2: Jugadores y canchas.
* Fase 3: Preparación de jornada.
* Fase 4: Partidos y competición.
* Fase 5: Pagos y cierre.
* Fase 6: Perfil, historial y ajustes.
* Fase 7: Auditoría, pruebas y despliegue.

Para cada fase documenta:

* Objetivo.
* Vistas involucradas.
* Módulos del frontend.
* Módulos del backend.
* Entidades involucradas.
* Endpoints.
* Pruebas esperadas.
* Criterios de aceptación.

No implementes fases posteriores todavía.

PASO 3: INICIALIZACIÓN DEL MONOREPO

Si todavía no existe, crea un monorepo con pnpm workspaces:

* apps/web: Next.js con App Router y TypeScript.
* apps/api: NestJS con TypeScript.
* packages/shared: tipos, enums y contratos compartidos.
* PostgreSQL.
* TypeORM.
* Docker Compose para PostgreSQL local.

Crea y configura:

* pnpm-workspace.yaml
* package.json raíz
* tsconfig compartido cuando sea conveniente
* .editorconfig
* .prettierrc
* eslint
* .gitignore
* .env.example
* docker-compose.yml
* README.md
* AGENTS.md

Scripts raíz:

* pnpm dev
* pnpm dev:web
* pnpm dev:api
* pnpm build
* pnpm lint
* pnpm typecheck
* pnpm test
* pnpm test:e2e
* pnpm format

FRONTEND

Configura:

* Next.js App Router.
* TypeScript estricto.
* Tailwind CSS.
* shadcn/ui.
* TanStack Query.
* React Hook Form.
* Zod.
* Sonner.
* Lucide Icons.
* Diseño mobile-first.
* Interfaz completamente en español.

BACKEND

Configura:

* NestJS.
* TypeORM.
* @nestjs/typeorm.
* PostgreSQL con pg.
* ConfigModule.
* class-validator.
* class-transformer.
* Helmet.
* CORS configurable.
* Swagger configurable.
* Prefijo global /api.
* Endpoint GET /api/health.

TYPEORM

Crea:

* Configuración con TypeOrmModule.forRootAsync.
* apps/api/src/database/data-source.ts.
* Colección centralizada de entidades.
* Configuración compatible con desarrollo y producción.
* synchronize: false.
* migrationsRun: false.
* Migraciones versionadas.
* Scripts migration:create, migration:generate, migration:run, migration:revert y migration:show.

No instales Prisma.

No crees schema.prisma.

No utilices comandos Prisma.

PASO 4: MODELO MÍNIMO PARA LA FASE 1

En esta fase implementa únicamente las entidades mínimas necesarias:

UserEntity

Campos:

* id UUID.
* name.
* email único.
* passwordHash.
* role.
* active.
* createdAt.
* updatedAt.

Enums:

UserRole

* ADMIN
* ORGANIZER

Crea una migración inicial real para la tabla users.

También puedes incluir desde ahora las tablas principales definidas en prompt-codex.md cuando sea técnicamente conveniente, pero no implementes todavía sus módulos funcionales ni sus interfaces.

PASO 5: AUTENTICACIÓN

Implementa:

POST /api/auth/login

Debe:

* Recibir email y contraseña.
* Validar los datos.
* Buscar un usuario activo.
* Comparar contraseña con Argon2.
* Entregar JWT.
* No revelar si falló el correo o la contraseña.
* Aplicar rate limiting al login.
* Retornar usuario básico y token.

Implementa:

GET /api/auth/me

Debe:

* Requerir JWT.
* Retornar el usuario autenticado.
* Rechazar usuarios inactivos.

Crea:

* AuthModule.
* AuthController.
* AuthService.
* JwtStrategy o guard equivalente.
* DTOs.
* Decorador para usuario actual cuando sea útil.
* Guard global o estrategia consistente de protección.

Endpoints públicos:

* GET /api/health
* POST /api/auth/login

El resto debe quedar protegido.

SEED

Crea un seed idempotente con TypeORM.

Variables:

* SEED_ADMIN_NAME
* SEED_ADMIN_EMAIL
* SEED_ADMIN_PASSWORD

El seed debe:

* Crear el administrador cuando no exista.
* Actualizar únicamente lo necesario cuando ya exista.
* Hashear la contraseña con Argon2.
* No duplicar usuarios.
* Cerrar correctamente el DataSource.

PASO 6: FRONTEND DE INICIO DE SESIÓN

Implementa la ruta:

/login

Utiliza como referencia el diseño:

Inicio de Sesión - Móvil

Debe incluir:

* Logo o identidad de VolleyFlow.
* Título.
* Texto de apoyo.
* Campo de correo.
* Campo de contraseña.
* Botón para mostrar u ocultar contraseña.
* Botón “Iniciar sesión”.
* Validaciones con Zod.
* React Hook Form.
* Estado de carga.
* Mensajes de error claros.
* Accesibilidad.
* Diseño responsive.
* Fidelidad visual al diseño de Stitch.

Para esta primera versión:

* Guarda el JWT en sessionStorage.
* Centraliza el acceso al token.
* Crea un cliente HTTP reutilizable.
* Envía Authorization: Bearer.
* No disperses llamadas fetch directamente por todos los componentes.

Después de iniciar sesión:

* Redirige al dashboard.
* Evita que un usuario autenticado vuelva a /login.
* Redirige a /login cuando una ruta protegida reciba 401.

PASO 7: LAYOUT AUTENTICADO

Crea un layout protegido.

En móvil utiliza navegación inferior.

En escritorio utiliza sidebar.

La navegación puede mostrar desde ahora:

* Inicio.
* Jornadas.
* Jugadores.
* Canchas.
* Más.

Las secciones todavía no implementadas deben:

* Mostrar un estado “Próximamente”, o
* Permanecer deshabilitadas.

No inventes funcionalidades de las siguientes fases.

PASO 8: DASHBOARD

Implementa la ruta:

/

Utiliza como referencia:

Dashboard - Móvil

Debe incluir:

* Saludo con el nombre del usuario.
* Botón “Nueva jornada”.
* Tarjeta de jornada activa.
* Indicadores principales.
* Jornadas recientes.
* Pagos pendientes.
* Estado vacío cuando todavía no existen jornadas.
* Skeletons.
* Manejo de error.
* Diseño responsive.
* Navegación móvil inferior.
* Sidebar de escritorio.

Como los módulos de jornadas todavía no estarán implementados:

* No uses mocks permanentes incrustados en los componentes.
* Crea una estructura de respuesta explícita para el dashboard.
* Implementa un endpoint real GET /api/dashboard.
* El endpoint puede devolver estadísticas en cero y listas vacías cuando no existan datos.
* Diseña el frontend para soportar datos reales posteriormente.

Respuesta mínima sugerida:

{
"activeSession": null,
"stats": {
"activePlayers": 0,
"completedSessions": 0,
"pendingPayments": 0,
"registeredMatches": 0
},
"recentSessions": []
}

Implementa:

GET /api/dashboard

Debe requerir autenticación.

PASO 9: CALIDAD Y PRUEBAS

Backend:

* Prueba unitaria de AuthService.
* Login exitoso.
* Credenciales incorrectas.
* Usuario inactivo.
* Validación de JWT.
* GET /api/auth/me.
* GET /api/dashboard.
* GET /api/health.
* Seed idempotente.

Frontend:

* Validaciones del login.
* Estado de carga.
* Error de credenciales.
* Redirección después del login.
* Protección de rutas.
* Renderizado del dashboard vacío.
* Responsive básico.

No uses SQLite para pruebas de integración principales.

Utiliza PostgreSQL de prueba cuando corresponda.

PASO 10: VALIDACIÓN FINAL DE ESTA FASE

Ejecuta:

* pnpm install
* pnpm lint
* pnpm typecheck
* pnpm test
* pnpm build
* migración sobre una base PostgreSQL vacía
* seed
* inicio del backend
* comprobación de GET /api/health
* inicio del frontend
* prueba manual o E2E del login
* navegación al dashboard

Corrige todos los errores encontrados.

PASO 11: COMMITS

Realiza commits locales pequeños y descriptivos cuando el entorno lo permita.

Ejemplos:

* chore: initialize VolleyFlow monorepo
* feat(api): configure TypeORM and authentication
* feat(web): implement login experience
* feat: add authenticated dashboard
* test: cover phase one authentication flow
* docs: document phase one setup

No hagas push.

No abras pull request.

LÍMITE DE ESTA EJECUCIÓN

Cuando la Fase 1 esté completa:

1. Detén la implementación.
2. No comiences la Fase 2.
3. Entrega un resumen de archivos creados.
4. Enumera endpoints implementados.
5. Enumera pruebas ejecutadas.
6. Informa resultados de lint, typecheck, test y build.
7. Explica cómo ejecutar el proyecto localmente.
8. Indica cualquier problema pendiente real.
9. Sugiere el contenido de la siguiente tarea para la Fase 2.

No afirmes que algo funciona sin haber ejecutado la validación correspondiente.
