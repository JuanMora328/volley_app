# Auditoría final de VolleyFlow

Fecha: 2026-07-28. Alcance: Fase 7, sin funcionalidades nuevas de producto.

## Estado base y comandos

| Comando                          | Resultado observado                                                                                |
| -------------------------------- | -------------------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile` | Correcto; lockfile vigente. pnpm emitió una advertencia deprecada interna sobre `url.parse`.       |
| `pnpm -r lint:check`             | Correcto en shared, API y web.                                                                     |
| `pnpm typecheck`                 | Correcto en la ejecución inicial.                                                                  |
| `pnpm test`                      | Correcto: 32 pruebas shared, 23 API y 12 web.                                                      |
| `pnpm build`                     | Correcto: Nest y las 16 rutas Next.js compilaron para producción.                                  |
| `pnpm test:integration`          | **PARTIAL**: los scripts existentes solo informan que requieren PostgreSQL; no ejecutan una suite. |
| `pnpm test:e2e`                  | **FAILED / deuda conocida**: los scripts son marcadores y no ejecutan el flujo E2E.                |

No se ocultaron los dos últimos resultados. La CI añadida sí valida PostgreSQL vacío, ejecución
doble del seed, `migration:show`, reversión y reaplicación de la última migración.

`pnpm audit --prod` no pudo consultar vulnerabilidades porque el registry respondió HTTP 403;
esto es una limitación del entorno y debe repetirse en CI. `docker compose config --quiet` tampoco
pudo ejecutarse porque Docker no está instalado; el entrypoint sí pasó `sh -n`.

## Hallazgos y correcciones

| Área             | Estado inicial                                           | Corrección / evidencia                                                                                  |
| ---------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Secreto JWT      | Fallaba silenciosamente a un valor débil                 | Configuración rechaza secretos menores de 32 caracteres y Auth usa `getOrThrow`.                        |
| Swagger          | Podía habilitarse en producción                          | Queda deshabilitado incondicionalmente en producción.                                                   |
| CORS             | Podía aceptar cualquier origen                           | Producción exige una lista explícita; desarrollo conserva una opción local segura.                      |
| DTO global       | Descartaba campos desconocidos                           | `forbidNonWhitelisted` rechaza mass assignment.                                                         |
| Payload          | Sin límite explícito                                     | Parsers JSON/form configurados a 100 KiB por defecto.                                                   |
| Cierre           | Sin hooks                                                | Nest habilita cierre ordenado por señales.                                                              |
| Seed             | Credenciales débiles por defecto y datos demo implícitos | Exige credenciales, contraseña de 12 caracteres y crea solo admin/configuración; conserva idempotencia. |
| HTTP web         | Fallaba al interpretar `204 No Content`                  | El cliente centralizado devuelve `undefined` para 204.                                                  |
| PostgreSQL local | Sin salud ni reinicio                                    | Healthcheck, volumen persistente y `unless-stopped`.                                                    |
| Despliegue API   | Sin imagen                                               | Dockerfile multi-stage, usuario no root y entrypoint que migra antes de iniciar.                        |
| Automatización   | Sin CI                                                   | Workflow con PostgreSQL, migraciones, seed repetido, lint, tipos, pruebas y builds.                     |

## Matriz de requerimientos

| Requerimiento                          | Estado                          | Evidencia / prueba                                                               | Corrección pendiente                               |
| -------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------- |
| Login genérico, Argon2, usuario activo | VALIDATED                       | `AuthService` y sus regresiones de éxito, error e inactivo.                      | Ninguna detectada.                                 |
| Token de usuario desactivado           | VALIDATED                       | Cada request consulta al usuario en `validateJwt`.                               | Ninguna detectada.                                 |
| No registro público / rutas protegidas | VALIDATED                       | No hay controlador de registro; controladores de dominio usan `JwtAuthGuard`.    | Migrar a guard global reduciría riesgo futuro.     |
| Roles en ajustes                       | VALIDATED                       | El servicio de ajustes limita escritura a ADMIN y existen pruebas de módulo.     | Añadir E2E HTTP real.                              |
| Validación global y prefijo `/api`     | VALIDATED                       | Bootstrap con whitelist, rechazo de extras, transformación y prefijo.            | Añadir prueba HTTP dedicada.                       |
| TypeORM sin sincronización             | VALIDATED                       | App y DataSource usan `synchronize: false`; entidades centralizadas.             | Validación CI continua.                            |
| Dinero entero y reparto exacto         | VALIDATED                       | Pruebas shared cubren residuos, cero, créditos y distribución.                   | Integración PostgreSQL real pendiente.             |
| Generación balanceada/reproducible     | VALIDATED                       | Pruebas shared cubren tamaños y semilla.                                         | Ampliar a secuencias de regeneración en E2E.       |
| Rotación, resultado y deshacer         | PARTIAL                         | Implementación backend y pruebas de utilidades; sin E2E reproducible.            | Suite de integración/E2E real.                     |
| Historial/perfil/ajustes               | PARTIAL                         | Consultas implementadas y build/tipos; evidencia HTTP insuficiente.              | Pruebas PostgreSQL de filtros y joins.             |
| Responsive 390/768/1024/1440           | PARTIAL                         | CSS mobile-first y build; no hubo navegador visual disponible en esta auditoría. | Auditoría manual asistida y capturas en CI visual. |
| Migraciones vacía/revert/re-run        | PARTIAL local / VALIDATED en CI | Workflow reproduce el ciclo con PostgreSQL 16.                                   | Ejecutar CI y conservar su evidencia.              |
| Seed idempotente                       | VALIDATED por diseño / CI       | Búsqueda por claves estables y dos ejecuciones en workflow.                      | Prueba de integración local dedicada.              |
| E2E principal y destructivos           | FAILED                          | Los scripts actuales son marcadores explícitos.                                  | Implementar runner E2E contra PostgreSQL real.     |

## Matriz resumida de estados de jornada

| Estado actual              | Acción                               | Estado siguiente          | Permitida                    | Motivo de rechazo principal                                              |
| -------------------------- | ------------------------------------ | ------------------------- | ---------------------------- | ------------------------------------------------------------------------ |
| `DRAFT`                    | editar/agregar participantes/generar | `DRAFT`                   | Sí                           | Datos inválidos o participantes duplicados.                              |
| `DRAFT`                    | confirmar equipos                    | `TEAMS_CREATED`           | Sí                           | Composición incompleta, duplicada o desbalanceada.                       |
| `TEAMS_CREATED`            | sortear/volver a sortear             | `TEAMS_CREATED`           | Sí, antes del primer partido | No hay equipos confirmados o ya comenzó el juego.                        |
| `TEAMS_CREATED`            | registrar partidos                   | `TEAMS_CREATED`           | Sí                           | Empate, negativos, objetivo incumplido o partido no activo.              |
| `TEAMS_CREATED`            | liquidar                             | `SETTLEMENT`              | Sí                           | Partido activo, campeón ambiguo no seleccionado o distribución inválida. |
| `SETTLEMENT`               | recalcular/pagar/finalizar           | `SETTLEMENT` / `FINISHED` | Sí                           | Deuda sin confirmación explícita.                                        |
| `FINISHED`                 | corregir pagos                       | `FINISHED`                | Sí                           | Redistribuir costos queda bloqueado.                                     |
| `DRAFT`/`TEAMS_CREATED`    | cancelar                             | `CANCELLED`               | Sí                           | Estados terminales no pueden cancelarse otra vez.                        |
| Cualquier estado permitido | eliminar con `ELIMINAR`              | eliminado                 | Sí                           | Confirmación incorrecta o id inexistente.                                |
| `CANCELLED`                | jugar o liquidar                     | —                         | No                           | La cancelación conserva datos en solo lectura.                           |

El backend es la autoridad de estas transiciones; ocultar botones en el frontend no sustituye
las validaciones del servicio.

## Riesgos abiertos antes de producción

1. **Bloqueante de confianza:** falta una suite E2E real y reproducible para el flujo principal y
   las operaciones destructivas.
2. **Alto:** los scripts de integración actuales no validan endpoints, concurrencia ni cascadas
   contra PostgreSQL.
3. **Medio:** falta evidencia automatizada de accesibilidad y responsive con navegador real.
4. **Medio:** `sessionStorage` reduce persistencia pero sigue expuesto ante XSS; una futura
   estrategia de cookie HttpOnly requiere diseño coordinado y queda fuera de esta estabilización.
5. **Operativo:** probar restauración de backups y ejecutar el workflow en el proveedor elegido
   antes del primer despliegue.

## Checklist de despliegue y rollback

1. Fijar variables desde el gestor de secretos; nunca desde la imagen.
2. Crear y verificar backup de PostgreSQL.
3. Ejecutar CI y construir imágenes desde el commit aprobado.
4. Desplegar API; su entrypoint aplica migraciones y no inicia si fallan.
5. Comprobar `/api/health`, login y una consulta autenticada.
6. Construir web con `NEXT_PUBLIC_API_URL` definitivo y comprobar CORS.
7. Ante fallo aplicativo, volver a la imagen anterior. Revertir una migración solo si su método
   `down` fue validado y después de otro backup; nunca borrar o regenerar la base.
