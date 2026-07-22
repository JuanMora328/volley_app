# VolleyFlow — Prompt maestro para Codex

Actúa como arquitecto de software senior y desarrollador full-stack. Construye de principio a fin una aplicación web llamada **VolleyFlow** para gestionar jornadas informales de voleibol.

Trabaja directamente sobre este repositorio. No te limites a generar ejemplos aislados: debes dejar una aplicación funcional, documentada, probada y preparada para despliegue.

## Forma de trabajo inicial

Antes de modificar código:

1. Inspecciona todo el repositorio.
2. Lee completamente este archivo.
3. Revisa todos los diseños y archivos existentes en `design/stitch`.
4. Identifica la tecnología y formato del código exportado por Stitch.
5. Utiliza Stitch como referencia visual y de experiencia de usuario, pero no copies una arquitectura deficiente.
6. Crea `docs/IMPLEMENTATION_PLAN.md` con etapas verificables, dependencias y criterios de finalización.
7. Inicializa el monorepo y los proyectos necesarios dentro de este repositorio.
8. Continúa con la implementación sin esperar confirmación.
9. Ejecuta validaciones después de cada etapa importante.
10. Realiza commits locales pequeños y descriptivos cuando sea posible.
11. No hagas `push`, no abras pull requests y no cambies el repositorio remoto.

No instales ni utilices otro ORM: toda la persistencia debe implementarse exclusivamente con **TypeORM**.

---

# 1. Arquitectura

Crea un monorepo administrado con **pnpm workspaces**:

```text
apps/
  web/                    # Next.js
  api/                    # NestJS
packages/
  shared/                 # Enums, tipos y contratos compartidos
design/
  stitch/                 # Diseños existentes
docs/
```

Tecnologías obligatorias:

- `apps/web`: Next.js con App Router, TypeScript, Tailwind CSS y shadcn/ui.
- `apps/api`: NestJS con TypeScript.
- `packages/shared`: enums, tipos y contratos compartidos sin acoplar el frontend a TypeORM.
- PostgreSQL como base de datos.
- TypeORM y `@nestjs/typeorm` como capa de persistencia.
- Docker Compose para PostgreSQL local.
- pnpm como único gestor de paquetes.

Configura scripts en el `package.json` raíz:

- `dev`
- `dev:web`
- `dev:api`
- `build`
- `lint`
- `typecheck`
- `test`
- `test:unit`
- `test:integration`
- `test:e2e`
- `format`

Los comandos raíz deben ejecutar correctamente los scripts correspondientes del monorepo.

---

# 2. Frontend

Utiliza:

- Next.js App Router.
- TypeScript estricto.
- Tailwind CSS.
- shadcn/ui.
- TanStack Query para datos del servidor.
- React Hook Form.
- Zod.
- Sonner o equivalente para notificaciones.
- Lucide para iconos.

No utilices Redux salvo que exista una necesidad demostrable.

El frontend debe ser:

- Mobile-first.
- Responsive.
- Accesible.
- Completamente en español.
- Optimizado para utilizarse rápidamente desde un teléfono durante los partidos.

## Referencia visual de Stitch

- Revisa todos los archivos en `design/stitch` antes de construir componentes.
- Conserva la intención visual, jerarquía, navegación, espaciado, estados y experiencia de usuario.
- Reutiliza componentes y tokens visuales.
- No copies código exportado que sea duplicado, frágil o poco mantenible.
- Si falta una variante responsive, constrúyela manteniendo el sistema visual existente.
- Documenta en `docs/DESIGN_IMPLEMENTATION.md` cualquier diferencia importante respecto al diseño.

---

# 3. Backend

Utiliza:

- NestJS.
- PostgreSQL.
- TypeORM.
- `@nestjs/typeorm`.
- Driver `pg`.
- Swagger.
- `class-validator` y `class-transformer`.
- `ConfigModule` y `ConfigService`.
- Helmet.
- CORS configurable.
- Logs estructurados.
- Argon2 para contraseñas.
- JWT para autenticación.

Todos los endpoints deben utilizar el prefijo `/api`.

Crea el endpoint público:

```text
GET /api/health
```

La respuesta debe permitir validar que la API está operativa y, cuando sea apropiado, comprobar conectividad con la base de datos sin exponer información sensible.

---

# 4. TypeORM y PostgreSQL

## Dependencias

Incluye como mínimo:

- `@nestjs/typeorm`
- `typeorm`
- `pg`
- `dotenv`
- `typeorm-ts-node-commonjs` o una alternativa compatible con la configuración del proyecto
- `argon2`

## Configuración

Configura `TypeOrmModule.forRootAsync` con `ConfigModule` y `ConfigService`.

La conexión normal de la aplicación debe utilizar:

```text
DATABASE_URL
```

La ejecución de migraciones debe utilizar:

```text
MIGRATION_DATABASE_URL
```

Cuando `MIGRATION_DATABASE_URL` no exista en desarrollo local, utiliza `DATABASE_URL` como respaldo.

Crea:

```text
apps/api/src/database/data-source.ts
```

Este archivo debe exportar una instancia de `DataSource` válida para el CLI de TypeORM.

Requisitos:

- Debe funcionar con TypeScript en desarrollo.
- Debe funcionar con JavaScript compilado en producción.
- Comparte la misma colección de entidades entre NestJS y el DataSource.
- Evita globs ambiguos que fallen después del build.
- Usa una estrategia consistente de nombres `snake_case` para tablas, columnas, claves foráneas e índices.

Configuración obligatoria:

```text
synchronize: false
migrationsRun: false
migrationsTableName: typeorm_migrations
```

También configura:

- Logging según entorno.
- SSL mediante variables de entorno.
- Pool de conexiones limitado para proveedores gratuitos.
- Reintentos de conexión en NestJS.
- Timeouts razonables.

Nunca uses `synchronize: true` como reemplazo de migraciones.

## Repositories

Usa `@InjectRepository(Entity)` en servicios para operaciones CRUD normales.

Usa `QueryBuilder` únicamente cuando sea necesario para:

- Filtros dinámicos.
- Agregaciones.
- Estadísticas.
- Consultas complejas.
- Carga controlada de relaciones.

Evita problemas N+1 y evita cargar relaciones completas cuando solo se necesitan identificadores o campos específicos.

## Transacciones

Usa:

```ts
dataSource.transaction(async (manager) => {
  // operaciones atómicas
});
```

Utiliza transacciones para:

- Reemplazar equipos generados.
- Confirmar equipos.
- Registrar resultados.
- Deshacer el último partido.
- Realizar liquidaciones.
- Recalcular pagos.
- Finalizar una jornada.

Dentro de una transacción usa exclusivamente el `EntityManager` recibido. No mezcles repositorios externos con el manager transaccional.

---

# 5. Autenticación

Implementa autenticación sencilla para organizadores.

No debe existir registro público.

Endpoints:

```text
POST /api/auth/login
GET  /api/auth/me
```

El organizador inicial debe crearse de forma idempotente mediante el seed utilizando:

- `SEED_ADMIN_NAME`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`

Requisitos:

- Hashea contraseñas con Argon2.
- Emite un JWT.
- Protege todos los endpoints excepto `/api/health` y `/api/auth/login`.
- Swagger solo debe estar habilitado en desarrollo o mediante variable de entorno.
- Implementa rate limiting para el login.
- No reveles si un correo específico existe.

Para esta primera versión, el frontend puede guardar el token en `sessionStorage` y enviarlo mediante:

```text
Authorization: Bearer <token>
```

Aísla la gestión de autenticación para permitir migrar posteriormente a access token y refresh token con cookies seguras.

---

# 6. Modelo de datos

Implementa como mínimo las siguientes entidades TypeORM.

## UserEntity

```text
@Entity('users')
id: UUID con @PrimaryGeneratedColumn('uuid')
name: string
email: string único
passwordHash: string
role: UserRole
active: boolean
createdAt: @CreateDateColumn
updatedAt: @UpdateDateColumn
```

## PlayerEntity

```text
@Entity('players')
id: UUID
name: string
defaultLevel: entero entre 1 y 5
notes: string nullable
active: boolean
createdAt
updatedAt
```

## VenueEntity

```text
@Entity('venues')
id: UUID
name: string
address: string nullable
defaultCourtPrice: integer
defaultGatoradePrice: integer
active: boolean
createdAt
updatedAt
```

## GameSessionEntity

```text
@Entity('game_sessions')
id: UUID
date: date
startTime: time o datetime nullable
venue: relación nullable
venueNameSnapshot: string
courtPrice: integer
gatoradePrice: integer
teamCount: integer
defaultTargetScore: integer
currentTargetScore: integer
status: GameSessionStatus
championTeam: relación nullable
createdAt
updatedAt
finishedAt: datetime nullable
```

## SessionPlayerEntity

```text
@Entity('session_players')
id: UUID
session: relación obligatoria
player: relación obligatoria
playerNameSnapshot: string
levelSnapshot: entero entre 1 y 5
includedInCourtSplit: boolean
includedInGatoradeSplit: boolean
courtAmount: integer
gatoradeAmount: integer
amountDue: integer
amountPaid: integer
paymentMethod: PaymentMethod nullable
paidAt: datetime nullable
createdAt
updatedAt
```

## TeamEntity

```text
@Entity('teams')
id: UUID
session: relación obligatoria
name: string
color: string nullable
initialRotationPosition: integer nullable
generatedAutomatically: boolean
confirmedAt: datetime nullable
createdAt
updatedAt
```

## TeamPlayerEntity

```text
@Entity('team_players')
id: UUID o clave primaria compuesta correctamente definida
team: relación obligatoria
sessionPlayer: relación obligatoria
createdAt
```

## MatchEntity

```text
@Entity('matches')
id: UUID
session: relación obligatoria
sequence: integer
teamA: relación obligatoria
teamB: relación obligatoria
teamAScore: integer
teamBScore: integer
targetScore: integer
winnerTeam: relación obligatoria
loserTeam: relación obligatoria
startedAt: datetime nullable
finishedAt: datetime
createdAt
updatedAt
```

## Relaciones y restricciones

Configura correctamente:

- `OneToMany`.
- `ManyToOne`.
- `JoinColumn`.
- Índices.
- Restricciones únicas.
- `onDelete`.
- Columnas `nullable`.

No utilices cascadas indiscriminadamente.

Protege el historial:

- Los jugadores no se eliminan físicamente si tienen historial.
- Las canchas no se eliminan físicamente si tienen historial.
- Se utiliza `active=false` para desactivarlos.

Restricciones mínimas:

- Email único en `users`.
- `session_id + player_id` único en `session_players`.
- `team_id + session_player_id` único en `team_players`.
- `session_id + sequence` único en `matches`.
- Un `SessionPlayer` no puede pertenecer a más de un equipo de la misma jornada.
- Los equipos y jugadores relacionados deben pertenecer a la misma jornada.

Si una regla no puede garantizarse únicamente con una restricción simple de PostgreSQL, valídala transaccionalmente en el servicio de dominio y crea las pruebas correspondientes.

---

# 7. Enums compartidos

Implementa como mínimo:

## UserRole

```text
ADMIN
ORGANIZER
```

## GameSessionStatus

```text
DRAFT
TEAMS_CREATED
IN_PROGRESS
SETTLEMENT
FINISHED
CANCELLED
```

## PaymentMethod

```text
CASH
TRANSFER
```

Los enums deben ubicarse en `packages/shared` o en una estructura compartida adecuada y no duplicarse entre entidades, DTOs y frontend.

---

# 8. Reglas de dinero

Todos los valores monetarios se guardan como enteros en pesos colombianos.

No utilices:

- `float`.
- `double precision`.
- Decimales para valores monetarios.
- Cálculos con punto flotante.

Crea una función reutilizable:

```ts
distributeIntegerAmount(total, participantIds);
```

Debe garantizar:

- La suma de valores individuales es exactamente igual al total.
- Los residuos se distribuyen determinísticamente.
- Nunca se pierden ni se crean pesos.
- El resultado no depende del orden accidental de una consulta de base de datos.
- Valida totales negativos, lista vacía y participantes duplicados.

---

# 9. Jugadores

Implementa:

- Listar.
- Buscar.
- Crear.
- Editar.
- Activar.
- Desactivar.
- Consultar detalle.
- Consultar historial básico cuando exista.

El nivel permanente es un entero de 1 a 5.

Cuando un jugador entra en una jornada guarda:

- `playerNameSnapshot`.
- `levelSnapshot`.

Cambiar posteriormente el nombre o nivel del jugador no debe alterar jornadas antiguas.

---

# 10. Canchas

Implementa:

- Listar.
- Crear.
- Editar.
- Activar.
- Desactivar.

Al seleccionar una cancha para una jornada:

- Copia sus valores predeterminados.
- Permite modificarlos únicamente para esa jornada.
- Guarda `venueNameSnapshot` para proteger el historial.

---

# 11. Jornadas

Implementa:

- Crear borrador.
- Editar información mientras el estado lo permita.
- Seleccionar participantes.
- Cambiar el nivel del participante únicamente para esa jornada.
- Añadir jugador rápido.
- Retirar participante antes de iniciar partidos.
- Consultar detalle completo.
- Listar historial con búsqueda y filtros.
- Cancelar.
- Finalizar.

No permitas retirar jugadores ni modificar la composición de equipos después de registrar el primer partido.

Si implementas una acción para reiniciar equipos o partidos, debe ser explícita, destructiva, confirmada y ejecutarse dentro de una transacción.

---

# 12. Generación de equipos

La generación debe ser aleatoria y equilibrada.

Condiciones:

1. La diferencia de cantidad de jugadores entre equipos no puede ser superior a uno.
2. El balance debe considerar principalmente el promedio de nivel.
3. También debe considerar suma de nivel, tamaño y fuerza normalizada.
4. Los jugadores del mismo nivel deben mezclarse aleatoriamente.
5. Regenerar debe poder producir una combinación diferente.
6. No debe devolver una combinación claramente peor cuando exista otra más equilibrada.
7. Los equipos pueden modificarse manualmente antes de iniciar partidos.
8. Un participante solo puede pertenecer a un equipo dentro de la jornada.

Implementa un algoritmo que:

1. Genere al menos 300 candidatos utilizando aleatoriedad.
2. Respete los tamaños máximos permitidos.
3. Distribuya inicialmente jugadores mediante estrategia serpiente o asignación al equipo con menor fuerza normalizada.
4. Realice intercambios locales entre equipos.
5. Calcule una puntuación de balance utilizando:
   - Diferencia máxima de promedio.
   - Varianza entre promedios.
   - Diferencia de tamaños.
   - Diferencia de fuerza normalizada.
6. Elimine candidatos duplicados.
7. Ordene candidatos por calidad.
8. Elija aleatoriamente uno entre los mejores candidatos únicos.
9. Retorne métricas de balance para mostrarlas en pantalla.

Permite:

- Generar.
- Regenerar.
- Intercambiar dos jugadores.
- Mover jugador.
- Cambiar nombre del equipo.
- Confirmar equipos.

Las operaciones que reemplazan o confirman equipos deben ser transaccionales.

---

# 13. Rotación de partidos

Después de confirmar los equipos:

1. Mezcla aleatoriamente los equipos.
2. Guarda `initialRotationPosition`.
3. Los primeros dos equipos juegan el partido inicial.
4. Los demás quedan en cola.
5. El ganador permanece en cancha.
6. El perdedor pasa al final de la cola.
7. El primer equipo de la cola entra a jugar.
8. Si solo existen dos equipos, vuelven a enfrentarse.

La rotación no debe depender únicamente de un estado temporal del frontend.

Debe reconstruirse usando:

- Orden inicial de equipos.
- Historial ordenado de partidos.

Crea un servicio de dominio que calcule:

- Equipo A en cancha.
- Equipo B en cancha.
- Cola actual.
- Siguiente equipo.
- Número del siguiente partido.

No almacenes estados derivados innecesarios si pueden reconstruirse de manera segura.

---

# 14. Resultados y tabla de posiciones

Cada partido debe guardar su propio `targetScore`.

Modificar `currentTargetScore` afecta únicamente partidos nuevos y nunca modifica partidos registrados.

Valida:

- No se permiten empates.
- No se permiten puntajes negativos.
- El ganador coincide con el mayor puntaje.
- Al menos uno de los equipos alcanzó el `targetScore`.
- Ambos equipos pertenecen a la jornada.
- Los equipos corresponden a la rotación actual.
- La jornada se encuentra en un estado válido.

Cada victoria suma un punto global.

Calcula para cada equipo:

- Partidos jugados.
- Ganados.
- Perdidos.
- Puntos globales.
- Puntos a favor.
- Puntos en contra.
- Diferencia.

Las estadísticas deben derivarse del historial registrado o actualizarse de forma consistente y transaccional.

---

# 15. Deshacer resultado

Permite deshacer únicamente el último partido de una jornada activa.

Al deshacerlo:

- Elimina o revierte el último partido dentro de una transacción.
- Reconstruye la rotación.
- Reconstruye las estadísticas.
- Devuelve el enfrentamiento correcto.

No permitas eliminar libremente partidos intermedios.

---

# 16. Pagos y liquidación

El costo de cancha se divide entre todos los `SessionPlayer` con:

```text
includedInCourtSplit = true
```

El valor de Gatorades se divide entre los `SessionPlayer` que:

- No pertenecen al equipo campeón.
- Tienen `includedInGatoradeSplit=true`.

El equipo campeón no paga Gatorades.

Permite elegir manualmente el campeón. El sistema debe sugerir el equipo con más victorias. En caso de empate, muestra que se requiere selección manual.

Después de elegir campeón:

1. Calcula `courtAmount`.
2. Calcula `gatoradeAmount`.
3. Calcula `amountDue`.
4. Conserva `amountPaid`.
5. Actualiza la información derivada de pago.

Permite registrar:

- `amountPaid`.
- `paymentMethod`.
- `paidAt`.

Estados visuales derivados:

```text
PENDING: amountPaid = 0
PARTIAL: amountPaid > 0 y amountPaid < amountDue
PAID: amountPaid >= amountDue
```

No almacenes el estado si puede calcularse de manera segura.

Define y documenta cómo tratar sobrepagos. Como mínimo, no deben romper los totales ni marcar valores negativos pendientes.

---

# 17. API REST

Diseña una API REST consistente, incluyendo como mínimo:

## Auth

```text
POST /api/auth/login
GET  /api/auth/me
```

## Players

```text
GET   /api/players
POST  /api/players
GET   /api/players/:id
PATCH /api/players/:id
PATCH /api/players/:id/status
```

## Venues

```text
GET   /api/venues
POST  /api/venues
GET   /api/venues/:id
PATCH /api/venues/:id
PATCH /api/venues/:id/status
```

## Sessions

```text
GET    /api/sessions
POST   /api/sessions
GET    /api/sessions/:id
PATCH  /api/sessions/:id
POST   /api/sessions/:id/players
PATCH  /api/sessions/:id/players/:sessionPlayerId
DELETE /api/sessions/:id/players/:sessionPlayerId
POST   /api/sessions/:id/teams/generate
PUT    /api/sessions/:id/teams
POST   /api/sessions/:id/teams/confirm
POST   /api/sessions/:id/rotation/start
GET    /api/sessions/:id/rotation
PATCH  /api/sessions/:id/target-score
POST   /api/sessions/:id/matches
DELETE /api/sessions/:id/matches/latest
GET    /api/sessions/:id/standings
POST   /api/sessions/:id/settlement
PATCH  /api/sessions/:id/payments/:sessionPlayerId
POST   /api/sessions/:id/finish
POST   /api/sessions/:id/cancel
GET    /api/sessions/:id/summary
```

Puedes ajustar rutas cuando exista una razón clara, pero mantén consistencia y documenta las decisiones en `docs/API.md`.

Todos los DTOs deben validarse en backend. No confíes únicamente en validaciones del frontend.

---

# 18. Vistas del frontend

Implementa como mínimo:

```text
/login
/
/players
/players/[id]
/venues
/sessions
/sessions/new
/sessions/[id]
/sessions/[id]/players
/sessions/[id]/teams
/sessions/[id]/matches
/sessions/[id]/payments
/sessions/[id]/summary
```

Puedes utilizar pestañas o rutas anidadas siempre que la navegación sea clara y consistente con Stitch.

## Móvil

- Barra de navegación inferior cuando corresponda.
- Acciones grandes.
- Marcadores fáciles de tocar.
- Formularios cómodos.
- Evita tablas horizontales extensas.
- Mantén visibles las acciones importantes durante un partido.

## Escritorio

- Sidebar.
- Tablas completas.
- Equipos en columnas.
- Mejor aprovechamiento del espacio.

---

# 19. Control del partido

La vista de partido activo debe mostrar:

- Número de partido.
- Dos equipos.
- Marcadores grandes.
- Botones para sumar y restar.
- Puntaje objetivo.
- Equipo que sigue.
- Cola.
- Botón para registrar resultado.
- Historial reciente.
- Botón para deshacer el último resultado.
- Tabla de posiciones compacta.

Solicita confirmación antes de registrar el resultado.

No guardes cada cambio del marcador inmediatamente. Mantén el marcador como estado local y registra el partido únicamente al confirmar.

Evita doble envío mediante estados de carga, bloqueo temporal e idempotencia razonable en backend.

---

# 20. Experiencia de usuario

Implementa:

- Skeletons.
- Estados vacíos.
- Estado sin conexión.
- Manejo global de errores.
- Toasts.
- Confirmaciones destructivas.
- Botones con estado de carga.
- Formularios con mensajes claros.
- Accesibilidad por teclado.
- Etiquetas ARIA cuando sean necesarias.
- Contraste adecuado.
- Formato monetario `es-CO`.
- Fechas con configuración `es-CO`.
- Diseño responsive en aproximadamente 390 px, tablet y 1440 px.

No dejes datos simulados permanentes en la interfaz final.

---

# 21. Migraciones

Crea una migración inicial real dentro de:

```text
apps/api/src/database/migrations
```

La migración debe:

- Crear enums.
- Crear tablas.
- Crear índices.
- Crear restricciones.
- Crear relaciones.
- Poder revertirse con `down()`.
- Ejecutarse sobre una base PostgreSQL vacía.

Incluye scripts para:

- `migration:create`
- `migration:generate`
- `migration:run`
- `migration:revert`
- `migration:show`

Documenta comandos equivalentes a:

```bash
pnpm --filter @volleyflow/api migration:generate --name=InitialSchema
pnpm --filter @volleyflow/api migration:run
pnpm --filter @volleyflow/api migration:revert
pnpm --filter @volleyflow/api migration:show
```

Implementa scripts auxiliares para que los comandos sean utilizables en macOS, Linux y Windows.

Nunca generes migraciones automáticamente al iniciar la aplicación.

---

# 22. Seed

Crea un seed idempotente en:

```text
apps/api/src/database/seeds/run-seed.ts
```

Debe:

- Inicializar el DataSource.
- Crear el administrador cuando no exista.
- Hashear la contraseña con Argon2.
- Crear al menos 12 jugadores de demostración.
- Crear dos canchas de demostración.
- No duplicar información al ejecutarse nuevamente.
- Cerrar correctamente el DataSource.

Utiliza `Repository.upsert` cuando sea seguro y apropiado.

Incluye:

```bash
pnpm --filter @volleyflow/api seed
```

Los datos de demostración deben poder deshabilitarse en producción mediante configuración.

---

# 23. Docker

Crea `docker-compose.yml` para PostgreSQL local con:

- Volumen persistente.
- Healthcheck.
- Variables configurables.
- Puerto local documentado.

Crea un Dockerfile multi-stage para `apps/api`, compatible con el monorepo pnpm.

El contenedor debe:

1. Habilitar pnpm mediante Corepack.
2. Instalar dependencias usando el lockfile.
3. Compilar `packages/shared` cuando corresponda.
4. Compilar `apps/api`.
5. Copiar las migraciones compiladas.
6. Ejecutar `migration:run` mediante un entrypoint seguro antes de iniciar.
7. Detener el arranque si una migración falla.
8. Ejecutar el NestJS compilado.
9. Escuchar en `process.env.PORT`.
10. Exponer un healthcheck funcional.

No ejecutes TypeScript con `ts-node` dentro de la imagen final si las migraciones ya están compiladas a JavaScript.

---

# 24. Variables de entorno

Crea archivos `.env.example` sin secretos reales.

## Backend

```env
NODE_ENV=
PORT=
DATABASE_URL=
MIGRATION_DATABASE_URL=
DATABASE_SSL=
DATABASE_POOL_SIZE=
JWT_SECRET=
JWT_EXPIRES_IN=
CORS_ORIGINS=
SEED_ADMIN_NAME=
SEED_ADMIN_EMAIL=
SEED_ADMIN_PASSWORD=
SEED_DEMO_DATA=
ENABLE_SWAGGER=
```

## Frontend

```env
NEXT_PUBLIC_API_URL=
```

Valida las variables obligatorias al iniciar y muestra errores claros sin revelar secretos.

## Neon

Para Neon utiliza:

- `DATABASE_URL` con conexión pooled para la aplicación.
- `MIGRATION_DATABASE_URL` con conexión directa para migraciones.

La configuración SSL debe funcionar en producción sin desactivar globalmente la validación de certificados.

---

# 25. Documentación

Crea:

- `README.md` con instalación, ejecución y comandos.
- `docs/PRODUCT_SPEC.md`.
- `docs/BUSINESS_RULES.md`.
- `docs/DATA_MODEL.md`.
- `docs/DESIGN_IMPLEMENTATION.md`.
- `docs/DEPLOYMENT.md`.
- `docs/API.md`.
- `docs/IMPLEMENTATION_PLAN.md`.
- `AGENTS.md` con convenciones para futuros agentes.

Documenta:

- Arquitectura del monorepo.
- Flujo de una jornada.
- Algoritmo de equipos.
- Rotación.
- Distribución de dinero.
- Deshacer último partido.
- Variables de entorno.
- Migraciones.
- Seed.
- Pruebas.
- Despliegue.
- Decisiones técnicas relevantes.

---

# 26. Pruebas

## Pruebas unitarias obligatorias

Crea pruebas para:

1. División exacta de dinero.
2. Distribución de residuos.
3. Lista vacía o participantes duplicados en la distribución.
4. Balance de equipos.
5. Diferencia máxima de tamaño.
6. Variedad entre regeneraciones.
7. Rotación con dos equipos.
8. Rotación con tres equipos.
9. Rotación con cuatro equipos.
10. Ganador que permanece.
11. Perdedor que pasa al final.
12. Cambio de `targetScore` sin alterar partidos anteriores.
13. Tabla de posiciones.
14. Deshacer último partido.
15. División de Gatorades.
16. Equipo campeón sin cobro de Gatorade.
17. Validaciones de resultados inválidos.

Para servicios simples usa mocks tipados de `Repository`.

## Pruebas de integración

Usa una base PostgreSQL real de pruebas.

No utilices SQLite como sustituto principal porque puede comportarse distinto en enums, restricciones, transacciones, índices, fechas y consultas.

Las pruebas deben:

- Utilizar una base o esquema aislado.
- Ejecutar migraciones.
- Limpiar datos entre escenarios.
- Cerrar conexiones.
- Evitar datos compartidos entre pruebas.

Cubre:

- Login.
- Crear jugador.
- Crear cancha.
- Crear jornada.
- Añadir jugadores.
- Generar equipos.
- Confirmar equipos.
- Iniciar rotación.
- Registrar partidos.
- Deshacer último partido.
- Liquidar.
- Registrar pago.
- Finalizar jornada.
- Acceso sin JWT.

## Pruebas E2E

Utiliza Playwright para cubrir como mínimo:

1. Iniciar sesión.
2. Crear una jornada.
3. Seleccionar jugadores.
4. Generar equipos.
5. Registrar un partido.
6. Consultar pagos.

---

# 27. Calidad

Utiliza:

- TypeScript estricto.
- ESLint.
- Prettier.
- Validaciones en frontend y backend.
- Servicios de dominio para reglas importantes.
- Transacciones.
- Manejo consistente de errores.
- DTOs claros.
- Componentes pequeños.
- Nombres expresivos.

Evita:

- `any` sin una justificación excepcional.
- Lógica compleja en controladores.
- Lógica crítica únicamente en frontend.
- Código duplicado.
- Archivos gigantes.
- `TODO` sin resolver.
- Mocks permanentes.
- Valores monetarios decimales.
- Dependencia del orden visual para reglas de negocio.
- Consultas N+1.
- Datos sensibles en logs.

---

# 28. CI

Crea un workflow de GitHub Actions que ejecute:

1. Instalación con lockfile.
2. Lint.
3. Typecheck.
4. Pruebas unitarias.
5. Pruebas de integración con PostgreSQL de servicio.
6. Build.

Las pruebas E2E pueden ejecutarse en un workflow separado si requieren levantar los servicios completos.

---

# 29. Despliegue

Prepara:

- Frontend para Vercel.
- Backend para Koyeb o Render mediante Docker.
- PostgreSQL para Neon.

Antes de iniciar NestJS en producción ejecuta:

```bash
pnpm --filter @volleyflow/api migration:run
```

Documenta:

- Root directory y comandos del frontend.
- Build context y Dockerfile del backend.
- Healthcheck.
- Variables de entorno.
- Configuración CORS.
- Ejecución de migraciones.
- Seed inicial.
- Conexiones pooled y directas de Neon.

---

# 30. Criterios de aceptación

La implementación se considera terminada cuando:

1. El proyecto puede iniciarse siguiendo únicamente el README.
2. El monorepo se inicializa correctamente con pnpm.
3. Existe una migración inicial funcional.
4. La migración puede ejecutarse en una base vacía.
5. La migración puede revertirse.
6. El seed es idempotente.
7. El usuario puede iniciar sesión.
8. Se pueden crear jugadores y canchas.
9. Se puede crear una jornada con diez o más jugadores.
10. Se pueden generar dos, tres o más equipos.
11. Regenerar produce combinaciones válidas y variadas.
12. Los equipos se pueden editar manualmente.
13. El partido inicial se selecciona aleatoriamente.
14. El ganador permanece y el perdedor rota correctamente.
15. Cada partido conserva su `targetScore` histórico.
16. Las estadísticas coinciden con los resultados.
17. Se puede deshacer el último resultado.
18. Los costos individuales suman exactamente los costos totales.
19. El campeón no paga Gatorades.
20. Se pueden registrar pagos en efectivo o transferencia.
21. Se puede finalizar y consultar una jornada histórica.
22. La aplicación funciona en móvil, tablet y escritorio.
23. Los diseños implementados son coherentes con Stitch.
24. Lint, typecheck, pruebas y build finalizan correctamente.
25. No quedan funcionalidades simuladas, errores conocidos ocultos ni tareas críticas pendientes.

---

# 31. Ejecución por etapas

Implementa en este orden recomendado:

1. Inspección del repositorio y plan.
2. Inicialización del monorepo.
3. Configuración de calidad y scripts raíz.
4. PostgreSQL local y TypeORM.
5. Entidades y migración inicial.
6. Autenticación y seed.
7. Jugadores y canchas.
8. Jornadas y participantes.
9. Generación y edición de equipos.
10. Rotación y resultados.
11. Tabla de posiciones y deshacer.
12. Liquidación y pagos.
13. Implementación completa de vistas desde Stitch.
14. Pruebas de integración y E2E.
15. Docker, CI y documentación.
16. Auditoría final.

Después de cada etapa:

- Ejecuta las pruebas relevantes.
- Corrige los errores encontrados.
- Actualiza la documentación.
- Realiza un commit local descriptivo cuando sea posible.

---

# 32. Auditoría final obligatoria

Antes de considerar el trabajo terminado:

1. Ejecuta una instalación limpia con el lockfile.
2. Levanta PostgreSQL local.
3. Ejecuta la migración inicial sobre una base limpia.
4. Ejecuta el seed dos veces y comprueba que no duplica datos.
5. Ejecuta `migration:show`.
6. Comprueba que `migration:revert` funciona en un entorno controlado y vuelve a aplicar la migración.
7. Ejecuta lint.
8. Ejecuta typecheck.
9. Ejecuta pruebas unitarias.
10. Ejecuta pruebas de integración.
11. Ejecuta pruebas E2E.
12. Ejecuta build del frontend.
13. Ejecuta build del backend.
14. Inicia ambos servicios localmente.
15. Comprueba `/api/health`.
16. Revisa el diff completo.
17. Busca secretos y archivos `.env` incluidos accidentalmente.
18. Verifica que todas las entidades estén registradas en NestJS y en el DataSource.
19. Verifica que `synchronize` permanezca en `false`.
20. Verifica que el build incluya las migraciones compiladas.
21. Verifica que las transacciones utilicen correctamente `EntityManager`.
22. Verifica que las pruebas no dejen conexiones abiertas.
23. Comprueba que no se instaló ni utilizó otro ORM.
24. Busca errores ortográficos en la interfaz en español.
25. Prueba manualmente el flujo completo con al menos 10 jugadores y 3 equipos.

Al finalizar entrega un resumen con:

- Etapas completadas.
- Arquitectura creada.
- Funcionalidades implementadas.
- Decisiones relevantes.
- Migraciones y seeds creados.
- Pruebas ejecutadas.
- Resultado de lint, typecheck y build.
- Commits locales realizados.
- Limitaciones reales pendientes.
- Pasos exactos para ejecutar localmente.
- Pasos exactos para desplegar.

No afirmes que algo funciona sin haber ejecutado su validación correspondiente. No ocultes pruebas fallidas ni limitaciones reales.
