Actúa como arquitecto de software senior y desarrollador full-stack. Construye de principio a fin una aplicación web llamada VolleyFlow para gestionar jornadas informales de voleibol.

Trabaja directamente sobre este repositorio. No te limites a generar ejemplos aislados: debes dejar una aplicación funcional, documentada, probada y preparada para despliegue.

Antes de modificar código:

1. Inspecciona todo el repositorio.
2. Revisa los diseños y archivos existentes en design/stitch.
3. Crea docs/IMPLEMENTATION_PLAN.md.
4. Divide el trabajo en etapas verificables.
5. Identifica cualquier contradicción entre el código exportado por Stitch y esta especificación.
6. Utiliza Stitch únicamente como referencia visual. No copies una arquitectura deficiente del código generado.
7. Continúa después con la implementación sin esperar confirmación.

ARQUITECTURA

Crea un monorepo con pnpm workspaces:

* apps/web: Next.js con App Router, TypeScript, Tailwind CSS y shadcn/ui.
* apps/api: NestJS con TypeScript.
* packages/shared: enums, tipos y contratos que puedan compartirse sin acoplar el frontend al ORM.
* PostgreSQL como base de datos.
* Typeorm como ORM.
* Docker Compose para PostgreSQL local.

Configura scripts raíz para:

* dev
* dev:web
* dev:api
* build
* lint
* typecheck
* test
* test:e2e
* format

FRONTEND

Utiliza:

* Next.js App Router.
* TypeScript estricto.
* Tailwind CSS.
* shadcn/ui.
* TanStack Query para datos del servidor.
* React Hook Form.
* Zod.
* Sonner o equivalente para notificaciones.
* Lucide para iconos.

No utilices Redux salvo que exista una necesidad demostrable.

El frontend debe ser mobile-first, responsive, accesible y estar completamente en español.

BACKEND

Utiliza:

* NestJS.
* Prisma.
* PostgreSQL.
* Swagger.
* class-validator y class-transformer.
* ConfigModule.
* Helmet.
* CORS configurable.
* Logs estructurados.
* Endpoint GET /api/health.

Todos los endpoints deben utilizar el prefijo /api.

AUTENTICACIÓN

Implementa autenticación sencilla para organizadores.

No debe existir registro público.

Crea:

* POST /api/auth/login
* GET /api/auth/me

El organizador inicial se crea de forma idempotente al iniciar la aplicación cuando no existe ningún usuario, utilizando:

* SEED_ADMIN_EMAIL
* SEED_ADMIN_PASSWORD

Hashea contraseñas con Argon2.

Emite un JWT.

Para esta primera versión, el frontend puede conservar el token en sessionStorage y enviarlo mediante Authorization: Bearer.

Protege todos los endpoints excepto:

* /api/health
* /api/auth/login
* Swagger únicamente en desarrollo o cuando esté habilitado por variable de entorno.

Incluye una abstracción que permita migrar posteriormente a access token y refresh token con cookies seguras.

MODELO DE DATOS

Crea, como mínimo, los siguientes modelos:

User

* id UUID
* name
* email único
* passwordHash
* role
* active
* createdAt
* updatedAt

Player

* id UUID
* name
* defaultLevel entero entre 1 y 5
* notes opcional
* active
* createdAt
* updatedAt

Venue

* id UUID
* name
* address opcional
* defaultCourtPrice entero
* defaultGatoradePrice entero
* active
* createdAt
* updatedAt

GameSession

* id UUID
* date
* startTime opcional
* venueId opcional
* venueNameSnapshot
* courtPrice entero
* gatoradePrice entero
* teamCount
* defaultTargetScore
* currentTargetScore
* status
* championTeamId opcional
* createdAt
* updatedAt
* finishedAt opcional

SessionPlayer

* id UUID
* sessionId
* playerId
* playerNameSnapshot
* levelSnapshot entre 1 y 5
* includedInCourtSplit boolean
* includedInGatoradeSplit boolean
* courtAmount entero
* gatoradeAmount entero
* amountDue entero
* amountPaid entero
* paymentMethod opcional
* paidAt opcional
* createdAt
* updatedAt

Team

* id UUID
* sessionId
* name
* color opcional
* initialRotationPosition opcional
* generatedAutomatically
* createdAt
* updatedAt

TeamPlayer

* teamId
* sessionPlayerId
* createdAt

Match

* id UUID
* sessionId
* sequence
* teamAId
* teamBId
* teamAScore
* teamBScore
* targetScore
* winnerTeamId
* loserTeamId
* startedAt opcional
* finishedAt
* createdAt
* updatedAt

Incluye índices, relaciones, restricciones únicas y estrategias de eliminación adecuadas.

No elimines físicamente jugadores o canchas que tengan historial. Utiliza active=false.

ENUMS

Implementa como mínimo:

UserRole

* ADMIN
* ORGANIZER

GameSessionStatus

* DRAFT
* TEAMS_CREATED
* IN_PROGRESS
* SETTLEMENT
* FINISHED
* CANCELLED

PaymentMethod

* CASH
* TRANSFER

REGLAS DE DINERO

Todos los valores monetarios se guardan como enteros en COP.

Nunca utilices números de punto flotante para almacenar dinero.

La división debe garantizar que:

* La suma de los valores individuales sea exactamente igual al total.
* Los residuos se distribuyan determinísticamente.
* Nunca se pierdan ni se creen pesos durante el cálculo.

Crea una función reutilizable:

distributeIntegerAmount(total, participantIds)

Debe retornar el valor exacto correspondiente a cada participante.

JUGADORES

Implementa:

* Listar.
* Buscar.
* Crear.
* Editar.
* Activar.
* Desactivar.
* Consultar detalle.

El nivel permanente es de 1 a 5.

Cuando un jugador entra en una jornada se debe guardar playerNameSnapshot y levelSnapshot.

Cambiar posteriormente el nombre o nivel del jugador no debe alterar jornadas antiguas.

CANCHAS

Implementa:

* Listar.
* Crear.
* Editar.
* Activar.
* Desactivar.

Al seleccionar una cancha para una jornada, utiliza sus valores predeterminados, pero permite modificarlos únicamente para esa jornada.

JORNADAS

Implementa:

* Crear borrador.
* Editar información mientras sea posible.
* Seleccionar participantes.
* Cambiar el nivel del participante únicamente para esa jornada.
* Añadir jugador rápido.
* Retirar participante antes de iniciar partidos.
* Consultar detalle completo.
* Listar historial con filtros.
* Cancelar.
* Finalizar.

No permitas retirar jugadores ni modificar equipos después de registrar el primer partido, salvo que exista una acción explícita y segura que reinicie todos los partidos.

GENERACIÓN DE EQUIPOS

La generación debe ser aleatoria y equilibrada.

Condiciones:

1. La diferencia de cantidad de jugadores entre equipos no puede ser superior a uno.
2. El balance debe considerar principalmente el promedio de nivel.
3. También debe considerar suma de nivel y tamaño del equipo.
4. Los jugadores del mismo nivel deben mezclarse aleatoriamente.
5. Regenerar debe poder devolver una combinación diferente.
6. No debe devolver una combinación claramente peor cuando existe otra más equilibrada.
7. Los equipos pueden modificarse manualmente.
8. Un participante solo puede pertenecer a un equipo dentro de la jornada.

Implementa un algoritmo que:

1. Genere al menos 300 candidatos utilizando semillas aleatorias.
2. Respete los tamaños máximos permitidos.
3. Distribuya inicialmente jugadores utilizando una estrategia serpiente o asignación al equipo con menor fuerza normalizada.
4. Realice intercambios locales entre equipos.
5. Calcule una puntuación de balance usando:

   * Diferencia máxima de nivel promedio.
   * Varianza entre promedios.
   * Diferencia de tamaños.
   * Diferencia de fuerza normalizada.
6. Ordene los candidatos por calidad.
7. Elija aleatoriamente uno entre los mejores candidatos únicos.
8. Retorne métricas de balance para mostrarlas en pantalla.

Permite:

* Generar.
* Regenerar.
* Intercambiar dos jugadores.
* Mover jugador.
* Cambiar nombre de equipo.
* Confirmar equipos.

Utiliza transacciones en operaciones que reemplazan equipos.

ROTACIÓN DE PARTIDOS

Después de confirmar los equipos:

1. Mezcla aleatoriamente los equipos.
2. Guarda initialRotationPosition.
3. Los dos primeros equipos juegan el partido inicial.
4. Los demás quedan en cola.
5. El ganador permanece en cancha.
6. El perdedor pasa al final de la cola.
7. El primer equipo de la cola entra a jugar.
8. Si solo existen dos equipos, vuelven a enfrentarse.

La rotación no debe depender únicamente de un estado temporal del frontend.

Debe poder reconstruirse usando:

* Orden inicial de equipos.
* Historial ordenado de partidos.

Crea un servicio de dominio que calcule:

* Equipo en cancha A.
* Equipo en cancha B.
* Cola actual.
* Siguiente equipo.
* Número del siguiente partido.

RESULTADOS

Cada partido debe almacenar su propio targetScore.

Modificar currentTargetScore afecta solamente partidos nuevos.

No debe alterar partidos registrados.

Valida:

* No se permiten empates.
* No se permiten puntajes negativos.
* El ganador debe coincidir con el mayor puntaje.
* Al menos uno de los equipos debe haber alcanzado el targetScore.
* Ambos equipos deben pertenecer a la jornada.
* Los equipos deben ser los correspondientes según la rotación actual.

Cada victoria suma un punto global.

Calcula para cada equipo:

* Partidos jugados.
* Ganados.
* Perdidos.
* Puntos globales.
* Puntos a favor.
* Puntos en contra.
* Diferencia.

DESHACER RESULTADO

Permite deshacer únicamente el último partido de una jornada activa.

Al deshacerlo:

* Elimina o revierte el último partido dentro de una transacción.
* Reconstruye la rotación.
* Reconstruye las estadísticas.
* Devuelve el enfrentamiento correcto.

No permitas eliminar libremente partidos intermedios.

PAGOS Y LIQUIDACIÓN

El costo de cancha se divide entre todos los SessionPlayer con includedInCourtSplit=true.

El valor de Gatorades se divide entre todos los SessionPlayer que:

* No pertenecen al equipo campeón.
* Tienen includedInGatoradeSplit=true.

El equipo campeón no paga Gatorades.

Permite elegir manualmente el campeón, aunque el sistema debe sugerir el equipo con más victorias. En caso de empate, muestra que se requiere selección manual.

Después de elegir campeón:

1. Calcula courtAmount.
2. Calcula gatoradeAmount.
3. Calcula amountDue.
4. Conserva amountPaid.
5. Actualiza el estado de pago derivado.

Permite registrar:

* amountPaid
* paymentMethod
* paidAt

Estados visuales derivados:

* PENDING cuando amountPaid=0.
* PARTIAL cuando amountPaid es mayor que 0 y menor que amountDue.
* PAID cuando amountPaid es igual o superior a amountDue.

No almacenes el estado si puede calcularse de manera segura.

ENDPOINTS

Diseña una API REST clara, incluyendo como mínimo:

Auth

* POST /api/auth/login
* GET /api/auth/me

Players

* GET /api/players
* POST /api/players
* GET /api/players/:id
* PATCH /api/players/:id
* PATCH /api/players/:id/status

Venues

* GET /api/venues
* POST /api/venues
* GET /api/venues/:id
* PATCH /api/venues/:id
* PATCH /api/venues/:id/status

Sessions

* GET /api/sessions
* POST /api/sessions
* GET /api/sessions/:id
* PATCH /api/sessions/:id
* POST /api/sessions/:id/players
* PATCH /api/sessions/:id/players/:sessionPlayerId
* DELETE /api/sessions/:id/players/:sessionPlayerId
* POST /api/sessions/:id/teams/generate
* PUT /api/sessions/:id/teams
* POST /api/sessions/:id/teams/confirm
* POST /api/sessions/:id/rotation/start
* GET /api/sessions/:id/rotation
* PATCH /api/sessions/:id/target-score
* POST /api/sessions/:id/matches
* DELETE /api/sessions/:id/matches/latest
* GET /api/sessions/:id/standings
* POST /api/sessions/:id/settlement
* PATCH /api/sessions/:id/payments/:sessionPlayerId
* POST /api/sessions/:id/finish
* POST /api/sessions/:id/cancel
* GET /api/sessions/:id/summary

Puedes ajustar rutas cuando exista una razón clara, pero mantén consistencia y documenta las decisiones.

VISTAS DEL FRONTEND

Implementa:

* /login
* /
* /players
* /players/[id]
* /venues
* /sessions
* /sessions/new
* /sessions/[id]
* /sessions/[id]/players
* /sessions/[id]/teams
* /sessions/[id]/matches
* /sessions/[id]/payments
* /sessions/[id]/summary

Utiliza layouts responsive.

En móvil:

* Barra de navegación inferior.
* Acciones grandes.
* Marcadores fáciles de tocar.
* Formularios cómodos.
* Evita tablas horizontales extensas.

En escritorio:

* Sidebar.
* Tablas completas.
* Equipos en columnas.
* Mejor aprovechamiento del espacio.

CONTROL DE PARTIDO

La vista de partido activo debe mostrar:

* Número de partido.
* Dos equipos.
* Marcadores grandes.
* Botones sumar y restar.
* Puntaje objetivo.
* Equipo que sigue.
* Cola.
* Botón registrar resultado.
* Historial reciente.
* Botón deshacer último resultado.
* Tabla compacta.

Solicita confirmación antes de registrar el resultado.

No guardes cada cambio del marcador inmediatamente. Mantén el marcador como estado local y registra el partido al confirmar.

EXPERIENCIA DE USUARIO

Implementa:

* Skeletons.
* Estados vacíos.
* Manejo global de errores.
* Toasts.
* Confirmaciones destructivas.
* Botones con estado de carga.
* Formularios con mensajes claros.
* Accesibilidad por teclado.
* Etiquetas ARIA donde sean necesarias.
* Contraste adecuado.
* Formato monetario es-CO.
* Fechas con configuración es-CO.

PRISMA Y BASE DE DATOS

Crea:

* schema.prisma.
* Migración inicial.
* Seed de datos.
* Datos de demostración opcionales.
* Índices necesarios.
* DATABASE_URL.
* DIRECT_URL si el proveedor de producción lo requiere.
* Comandos de migrate dev y migrate deploy.

El seed debe crear:

* Usuario administrador.
* Al menos 12 jugadores de demostración.
* Dos canchas de demostración.

El seed no debe duplicar registros cuando se ejecuta nuevamente.

DOCKER

Crea docker-compose.yml para PostgreSQL local.

Incluye healthcheck.

No guardes archivos persistentes dentro del contenedor del backend.

Crea un Dockerfile multi-stage para apps/api, compatible con un monorepo pnpm.

El contenedor debe:

* Instalar dependencias de forma reproducible.
* Generar Prisma Client.
* Compilar NestJS.
* Ejecutar prisma migrate deploy antes de iniciar o mediante un entrypoint seguro.
* Escuchar en process.env.PORT.
* Exponer un healthcheck funcional.

VARIABLES DE ENTORNO

Crea archivos .env.example sin secretos reales.

Backend:

* NODE_ENV
* PORT
* DATABASE_URL
* DIRECT_URL
* JWT_SECRET
* JWT_EXPIRES_IN
* CORS_ORIGINS
* SEED_ADMIN_NAME
* SEED_ADMIN_EMAIL
* SEED_ADMIN_PASSWORD
* ENABLE_SWAGGER

Frontend:

* NEXT_PUBLIC_API_URL

DOCUMENTACIÓN

Crea:

* README.md con instalación y ejecución.
* docs/PRODUCT_SPEC.md.
* docs/BUSINESS_RULES.md.
* docs/DATA_MODEL.md.
* docs/DEPLOYMENT.md.
* docs/API.md.
* AGENTS.md con convenciones para futuros agentes.

Explica:

* Flujo de una jornada.
* Algoritmo de equipos.
* Rotación.
* Distribución de dinero.
* Cómo deshacer el último partido.
* Variables de entorno.
* Despliegue.
* Migraciones.
* Seed.
* Pruebas.

PRUEBAS OBLIGATORIAS

Crea pruebas unitarias para:

1. División exacta de dinero.
2. Distribución de residuos.
3. Balance de equipos.
4. Diferencia máxima de tamaño.
5. Variedad entre regeneraciones.
6. Rotación con dos equipos.
7. Rotación con tres equipos.
8. Rotación con cuatro equipos.
9. Ganador que permanece.
10. Perdedor que pasa al final.
11. Cambio de targetScore sin alterar partidos anteriores.
12. Tabla de posiciones.
13. Deshacer último partido.
14. División de Gatorades.
15. Equipo campeón sin cobro de Gatorade.

Crea pruebas de integración para:

* Login.
* Crear jugador.
* Crear jornada.
* Añadir jugadores.
* Generar equipos.
* Confirmar equipos.
* Iniciar rotación.
* Registrar partidos.
* Deshacer último partido.
* Liquidar.
* Registrar pago.
* Finalizar jornada.

Crea pruebas E2E mínimas con Playwright para:

1. Iniciar sesión.
2. Crear una jornada.
3. Seleccionar jugadores.
4. Generar equipos.
5. Registrar un partido.
6. Consultar pagos.

CALIDAD

Utiliza:

* TypeScript estricto.
* ESLint.
* Prettier.
* Validaciones en frontend y backend.
* Servicios de dominio para reglas importantes.
* Transacciones.
* Manejo consistente de errores.
* DTOs claros.
* Componentes pequeños.
* Nombres expresivos.

Evita:

* any.
* Lógica de negocio compleja en controladores.
* Lógica crítica únicamente en el frontend.
* Código duplicado.
* Archivos gigantes.
* TODO sin resolver.
* Datos simulados permanentes en la interfaz.
* Valores monetarios decimales.
* Dependencia del orden visual para las reglas de negocio.

CI

Crea un workflow de GitHub Actions que ejecute:

* Instalación con lockfile.
* Lint.
* Typecheck.
* Pruebas.
* Build.

CRITERIOS DE ACEPTACIÓN

La implementación se considera terminada cuando:

1. El proyecto puede iniciarse siguiendo únicamente el README.
2. Existe una migración inicial funcional.
3. El usuario puede iniciar sesión.
4. Se pueden crear jugadores y canchas.
5. Se puede crear una jornada con diez o más jugadores.
6. Se pueden generar dos, tres o más equipos.
7. Regenerar produce combinaciones válidas y variadas.
8. Los equipos se pueden editar manualmente.
9. El partido inicial se selecciona aleatoriamente.
10. El ganador permanece y el perdedor rota correctamente.
11. Cada partido conserva su targetScore histórico.
12. Las estadísticas coinciden con los resultados.
13. Se puede deshacer el último resultado.
14. Los costos individuales suman exactamente los costos totales.
15. El campeón no paga Gatorades.
16. Se pueden registrar pagos en efectivo o transferencia.
17. Se puede finalizar y consultar una jornada histórica.
18. La aplicación funciona en móvil y escritorio.
19. Lint, typecheck, pruebas y build finalizan correctamente.
20. No quedan TODO, mocks involuntarios ni funcionalidades simuladas.

FORMA DE TRABAJO

Implementa por etapas y realiza commits locales lógicos cuando sea posible.

Después de cada etapa:

* Ejecuta las pruebas relevantes.
* Corrige los errores encontrados.
* Actualiza la documentación.

Al finalizar:

1. Ejecuta instalación limpia.
2. Ejecuta migraciones.
3. Ejecuta lint.
4. Ejecuta typecheck.
5. Ejecuta todas las pruebas.
6. Ejecuta build de web y API.
7. Revisa el diff completo.
8. Busca secretos o archivos .env incluidos accidentalmente.
9. Entrega un resumen de lo implementado.
10. Enumera cualquier limitación real que no hayas podido resolver.

No afirmes que algo funciona sin haber ejecutado su validación correspondiente.

IMPORTANTE: utiliza TypeORM. No instales ni utilices Prisma bajo ninguna circunstancia.

ARQUITECTURA DE PERSISTENCIA

Utiliza:

* NestJS.
* PostgreSQL.
* TypeORM.
* @nestjs/typeorm.
* Driver pg.
* Migraciones versionadas.
* Repositories de TypeORM.
* DataSource para migraciones y transacciones.
* Entidades separadas por módulo.

Dependencias principales del backend:

* @nestjs/typeorm
* typeorm
* pg
* dotenv
* typeorm-ts-node-commonjs
* argon2

CONFIGURACIÓN DE TYPEORM

Configura TypeOrmModule.forRootAsync utilizando ConfigModule y ConfigService.

La conexión de la aplicación debe utilizar:

* DATABASE_URL

La ejecución de migraciones debe utilizar:

* MIGRATION_DATABASE_URL cuando exista.
* DATABASE_URL como respaldo en desarrollo local.

Crea:

apps/api/src/database/data-source.ts

Este archivo debe exportar una instancia de DataSource válida para el CLI de TypeORM.

La configuración debe funcionar tanto con archivos TypeScript durante desarrollo como con archivos JavaScript compilados en producción.

Evita depender de globs ambiguos. Preferiblemente importa explícitamente las entidades en una colección centralizada que pueda reutilizarse entre TypeOrmModule y DataSource.

Utiliza una estrategia consistente de nombres en snake_case para tablas, columnas, claves foráneas e índices.

CONFIGURACIÓN OBLIGATORIA

* synchronize: false
* migrationsRun: false
* logging configurable por entorno
* ssl configurable mediante variables de entorno
* pool limitado apropiadamente para servicios gratuitos
* retryAttempts configurado en NestJS
* migrationsTableName: typeorm_migrations

Nunca utilices synchronize=true como reemplazo de migraciones.

ENTIDADES

Implementa como mínimo las siguientes entidades TypeORM:

UserEntity

* @Entity('users')
* id UUID con @PrimaryGeneratedColumn('uuid')
* name
* email único
* passwordHash
* role enum
* active
* createdAt con @CreateDateColumn
* updatedAt con @UpdateDateColumn

PlayerEntity

* @Entity('players')
* id UUID
* name
* defaultLevel entero entre 1 y 5
* notes nullable
* active
* createdAt
* updatedAt

VenueEntity

* @Entity('venues')
* id UUID
* name
* address nullable
* defaultCourtPrice entero
* defaultGatoradePrice entero
* active
* createdAt
* updatedAt

GameSessionEntity

* @Entity('game_sessions')
* id UUID
* date
* startTime nullable
* venue nullable
* venueNameSnapshot
* courtPrice entero
* gatoradePrice entero
* teamCount entero
* defaultTargetScore entero
* currentTargetScore entero
* status enum
* championTeam nullable
* createdAt
* updatedAt
* finishedAt nullable

SessionPlayerEntity

* @Entity('session_players')
* id UUID
* session
* player
* playerNameSnapshot
* levelSnapshot entero entre 1 y 5
* includedInCourtSplit boolean
* includedInGatoradeSplit boolean
* courtAmount entero
* gatoradeAmount entero
* amountDue entero
* amountPaid entero
* paymentMethod enum nullable
* paidAt nullable
* createdAt
* updatedAt

TeamEntity

* @Entity('teams')
* id UUID
* session
* name
* color nullable
* initialRotationPosition nullable
* generatedAutomatically boolean
* createdAt
* updatedAt

TeamPlayerEntity

* @Entity('team_players')
* id UUID o clave primaria compuesta correctamente definida
* team
* sessionPlayer
* createdAt

MatchEntity

* @Entity('matches')
* id UUID
* session
* sequence
* teamA
* teamB
* teamAScore
* teamBScore
* targetScore
* winnerTeam
* loserTeam
* startedAt nullable
* finishedAt
* createdAt
* updatedAt

RELACIONES

Configura correctamente:

* OneToMany.
* ManyToOne.
* OneToOne cuando aplique.
* JoinColumn.
* Índices.
* Restricciones únicas.
* onDelete.
* nullable.

No utilices cascade indiscriminadamente.

Las eliminaciones deben proteger el historial.

Jugadores y canchas con información histórica no se eliminan físicamente. Se desactivan utilizando active=false.

Crea una restricción única para impedir que un SessionPlayer pertenezca más de una vez al mismo equipo o aparezca duplicado en la composición de equipos.

Crea una restricción única para:

* sessionId + sequence en matches.
* teamId + sessionPlayerId en team_players.
* email en users.

COLUMNAS MONETARIAS

Todos los valores monetarios se almacenan como integer en PostgreSQL.

No utilices:

* float.
* double precision.
* numeric con decimales.
* transformaciones de punto flotante.

Los valores representan pesos colombianos completos.

ENUMS

Utiliza columnas enum de TypeORM para:

UserRole

* ADMIN
* ORGANIZER

GameSessionStatus

* DRAFT
* TEAMS_CREATED
* IN_PROGRESS
* SETTLEMENT
* FINISHED
* CANCELLED

PaymentMethod

* CASH
* TRANSFER

Los enums deben ubicarse en módulos compartidos y no duplicarse entre entidades, DTOs y servicios.

REPOSITORIES

Utiliza:

@InjectRepository(Entity)

en los servicios correspondientes.

No accedas directamente al DataSource para operaciones CRUD simples cuando un Repository sea suficiente.

Utiliza QueryBuilder únicamente cuando:

* Exista una consulta compleja.
* Se necesiten filtros dinámicos.
* Se calculen estadísticas.
* Se necesiten agregaciones.
* Se deban cargar relaciones de manera controlada.

Evita problemas N+1.

No cargues relaciones completas cuando solamente se requieren identificadores o campos específicos.

TRANSACCIONES

Utiliza:

dataSource.transaction(async manager => {
// operaciones
});

para operaciones críticas como:

* Reemplazar equipos generados.
* Confirmar equipos.
* Registrar resultados.
* Deshacer el último partido.
* Realizar liquidaciones.
* Recalcular pagos.
* Finalizar una jornada.

Dentro de una transacción utiliza exclusivamente el EntityManager recibido.

No mezcles repositories externos con el manager transaccional.

MIGRACIONES

Crea una migración inicial real dentro de:

apps/api/src/database/migrations

La migración debe:

* Crear enums.
* Crear tablas.
* Crear índices.
* Crear restricciones.
* Crear relaciones.
* Poder revertirse mediante down().
* Ejecutarse sobre una base PostgreSQL vacía.

Incluye scripts para:

* migration:create
* migration:generate
* migration:run
* migration:revert
* migration:show

Ejemplos de comandos que deben documentarse:

pnpm --filter @volleyflow/api migration:generate --name=InitialSchema
pnpm --filter @volleyflow/api migration:run
pnpm --filter @volleyflow/api migration:revert
pnpm --filter @volleyflow/api migration:show

Implementa scripts auxiliares para que el nombre de la migración pueda recibirse correctamente sin depender de comandos difíciles de usar en Windows, macOS o Linux.

Nunca generes migraciones automáticamente al iniciar la aplicación.

SEED

Crea un seed idempotente utilizando TypeORM dentro de:

apps/api/src/database/seeds/run-seed.ts

El seed debe:

* Inicializar el DataSource.
* Crear el administrador cuando no exista.
* Hashear la contraseña con Argon2.
* Crear al menos 12 jugadores de demostración.
* Crear dos canchas de demostración.
* No duplicar información si se ejecuta nuevamente.
* Cerrar correctamente el DataSource.

Utiliza Repository.upsert cuando sea seguro y apropiado.

Variables del administrador:

* SEED_ADMIN_NAME
* SEED_ADMIN_EMAIL
* SEED_ADMIN_PASSWORD

Incluye el comando:

pnpm --filter @volleyflow/api seed

PRUEBAS

Para pruebas unitarias de servicios simples, crea mocks tipados de Repository.

Para pruebas de integración utiliza una base PostgreSQL de pruebas real.

No utilices SQLite como sustituto principal porque puede comportarse de forma diferente a PostgreSQL en:

* Enums.
* Restricciones.
* Transacciones.
* Índices.
* Tipos de fecha.
* Consultas.
* Concurrencia.

Las pruebas de integración deben:

* Crear una base o esquema aislado.
* Ejecutar migraciones.
* Limpiar datos entre escenarios.
* Cerrar conexiones.
* Evitar compartir datos entre tests.

DOCKER

Crea un Dockerfile multi-stage para el backend NestJS dentro del monorepo.

El contenedor debe:

1. Instalar pnpm mediante Corepack.
2. Instalar dependencias usando el lockfile.
3. Compilar packages/shared cuando sea necesario.
4. Compilar apps/api.
5. Copiar los archivos necesarios para las migraciones.
6. Ejecutar migration:run antes de iniciar la aplicación mediante un entrypoint seguro.
7. Ejecutar el código compilado de NestJS.
8. Escuchar process.env.PORT.

No ejecutes comandos de TypeORM con ts-node dentro de la imagen final de producción si las migraciones ya están compiladas a JavaScript.

El entrypoint debe detener el inicio del servidor si una migración falla.

VARIABLES DE ENTORNO

Backend:

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
ENABLE_SWAGGER=

Frontend:

NEXT_PUBLIC_API_URL=

No utilices DIRECT_URL, ya que no se está usando Prisma.

NEON

Para Neon utiliza:

* DATABASE_URL con la conexión pooled para la aplicación.
* MIGRATION_DATABASE_URL con la conexión directa para ejecutar migraciones.

La configuración SSL debe funcionar correctamente en producción.

No desactives la validación SSL globalmente.

DESPLIEGUE

Antes de iniciar NestJS en producción ejecuta:

pnpm --filter @volleyflow/api migration:run

No ejecutes:

* prisma generate
* prisma migrate deploy
* prisma db seed

Elimina cualquier dependencia, archivo, script o documentación relacionada con Prisma.

AUDITORÍA FINAL

Antes de considerar el trabajo terminado verifica:

1. Que no exista schema.prisma.
2. Que no exista @prisma/client.
3. Que no exista la dependencia prisma.
4. Que no existan comandos prisma en package.json.
5. Que todas las entidades estén registradas en TypeOrmModule.
6. Que el DataSource del CLI utilice las mismas entidades.
7. Que synchronize permanezca en false.
8. Que la migración inicial pueda ejecutarse en una base vacía.
9. Que migration:revert funcione.
10. Que el seed sea idempotente.
11. Que las transacciones utilicen correctamente EntityManager.
12. Que el build incluya las migraciones compiladas.
13. Que la aplicación funcione con PostgreSQL local y Neon.
14. Que las pruebas no dejen conexiones abiertas.
15. Que no existan referencias residuales a Prisma.

Todas las demás reglas funcionales, vistas, endpoints, pruebas y criterios de aceptación del prompt original de VolleyFlow se mantienen sin cambios.
