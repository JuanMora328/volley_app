Trabaja directamente sobre el repositorio de VolleyFlow.

La especificación general se encuentra en:

docs/prompt-codex.md

El plan de implementación se encuentra en:

docs/IMPLEMENTATION_PLAN.md

Lee ambos documentos antes de modificar código.

OBJETIVO

Implementa exclusivamente:

FASE 7: AUDITORÍA FINAL, ESTABILIZACIÓN Y PREPARACIÓN PARA DESPLIEGUE

Esta tarea no debe agregar nuevas funcionalidades de producto.

El objetivo es:

* Auditar toda la aplicación.
* Encontrar y corregir errores funcionales.
* Validar las reglas de negocio.
* Mejorar seguridad y consistencia.
* Completar pruebas faltantes.
* Revisar experiencia responsive.
* Optimizar consultas y rendimiento.
* Validar migraciones y seed.
* Preparar Docker y despliegue.
* Crear documentación operativa.
* Dejar frontend y backend listos para producción.

FUERA DE ALCANCE

No agregues:

* Nuevas vistas.
* Nuevos módulos de negocio.
* Rankings.
* Torneos.
* Notificaciones.
* Exportaciones.
* Pasarelas de pago.
* Integraciones externas.
* Nuevas reglas de juego.
* Nuevos estados de jornada.
* Refactorizaciones masivas sin beneficio demostrado.

No cambies comportamientos funcionales válidos únicamente por preferencia técnica.

PRINCIPIOS

* Utiliza exclusivamente NestJS, TypeORM y PostgreSQL.
* No instales ni utilices Prisma.
* No utilices `synchronize: true`.
* No elimines migraciones históricas.
* No regeneres la base de datos desde cero como solución a errores.
* No ocultes pruebas fallidas.
* No declares que algo funciona sin ejecutarlo.
* Corrige primero errores funcionales y de seguridad.
* Evita cambios cosméticos innecesarios.
* Mantén compatibilidad con los datos existentes.
* Las correcciones deben incluir pruebas de regresión.

PASO 1: ESTADO BASE

Antes de modificar código:

1. Lee `docs/prompt-codex.md`.
2. Lee `docs/IMPLEMENTATION_PLAN.md`.
3. Inspecciona la estructura completa.
4. Revisa todos los `package.json`.
5. Revisa el lockfile.
6. Revisa las variables de entorno.
7. Revisa Docker y GitHub Actions.
8. Revisa todas las migraciones TypeORM.
9. Revisa los archivos de seed.
10. Revisa frontend, backend y paquete compartido.

Ejecuta inicialmente:

* instalación limpia con lockfile;
* lint;
* typecheck;
* pruebas unitarias;
* pruebas de integración;
* pruebas del frontend;
* pruebas E2E;
* build del backend;
* build del frontend.

Crea:

docs/FINAL_AUDIT.md

Registra inicialmente:

* comandos ejecutados;
* resultados;
* pruebas fallidas;
* errores de compilación;
* errores de lint;
* problemas encontrados;
* riesgos identificados.

PASO 2: AUDITORÍA DE REQUERIMIENTOS

Contrasta el comportamiento real contra:

* `docs/prompt-codex.md`;
* `docs/BUSINESS_RULES.md`;
* `docs/PRODUCT_SPEC.md`;
* `docs/API.md`;
* `docs/DATA_MODEL.md`.

Crea una matriz de validación con:

* requerimiento;
* estado;
* evidencia;
* prueba relacionada;
* corrección requerida.

Clasifica cada requerimiento como:

* VALIDATED;
* PARTIAL;
* FAILED;
* NOT_APPLICABLE.

No marques un requerimiento como validado solamente porque existe código relacionado.

PASO 3: AUTENTICACIÓN Y AUTORIZACIÓN

Audita:

* login;
* JWT;
* expiración;
* validación de usuario activo;
* rutas públicas;
* rutas protegidas;
* roles ADMIN y ORGANIZER;
* manejo de respuestas 401 y 403;
* rate limiting;
* hash Argon2;
* errores de credenciales;
* almacenamiento del token;
* cierre de sesión;
* redirecciones.

Verifica:

1. No existe registro público.
2. Las contraseñas nunca se retornan.
3. `passwordHash` no aparece en respuestas.
4. Los errores no revelan si un correo existe.
5. Un usuario inactivo no puede autenticarse.
6. Un token de un usuario desactivado no mantiene acceso.
7. ORGANIZER no puede modificar ajustes restringidos.
8. Swagger está deshabilitado o protegido en producción.
9. El login tiene límite de intentos.
10. `JWT_SECRET` tiene validación mínima de seguridad.

Agrega pruebas de regresión para cualquier corrección.

PASO 4: VALIDACIÓN GLOBAL DEL BACKEND

Revisa la configuración global de NestJS:

* prefijo `/api`;
* ValidationPipe;
* `whitelist`;
* `forbidNonWhitelisted`;
* transformación;
* manejo de excepciones;
* Helmet;
* CORS;
* logs;
* health check;
* cierre ordenado;
* manejo de señales;
* límites de payload.

Verifica todos los DTO:

* validaciones;
* tipos;
* enums;
* campos opcionales;
* enteros;
* valores monetarios;
* UUID;
* fechas;
* paginación;
* ordenamiento;
* filtros.

Evita:

* `any`;
* controladores con lógica de negocio;
* errores genéricos sin contexto;
* consultas sin límites;
* paginaciones ilimitadas;
* parámetros de ordenamiento inseguros.

PASO 5: AUDITORÍA DE TYPEORM Y POSTGRESQL

Revisa:

* entidades;
* relaciones;
* restricciones;
* índices;
* cascadas;
* enums;
* columnas nullable;
* timestamps;
* claves únicas;
* claves foráneas;
* transacciones;
* QueryBuilder;
* bloqueos;
* eliminación permanente de jornadas.

Verifica especialmente:

1. `synchronize` permanece en `false`.
2. Todas las entidades están registradas.
3. El DataSource usa las mismas entidades.
4. Las migraciones funcionan compiladas.
5. Los nombres siguen una convención consistente.
6. No existen relaciones huérfanas.
7. No hay cascadas que puedan eliminar jugadores, canchas o usuarios.
8. Eliminar una jornada borra únicamente sus registros dependientes.
9. Cancelar una jornada no elimina registros.
10. Los snapshots históricos se conservan.
11. Los valores monetarios son enteros.
12. Los enums son consistentes.
13. No existen globs incompatibles entre desarrollo y producción.
14. Las transacciones usan exclusivamente el EntityManager recibido.
15. No se mezclan repositorios externos dentro de transacciones.

No modifiques migraciones que ya puedan estar aplicadas.

Crea nuevas migraciones correctivas cuando sea necesario.

PASO 6: VALIDACIÓN DE MIGRACIONES

Prueba las migraciones en una base PostgreSQL completamente vacía.

Debe funcionar:

1. Ejecutar todas las migraciones.
2. Ejecutar el seed.
3. Iniciar la API.
4. Ejecutar pruebas básicas.
5. Revertir la última migración.
6. Volver a ejecutarla.
7. Consultar el estado con `migration:show`.

También prueba sobre una base que ya tenga todas las migraciones aplicadas:

* `migration:run` no debe causar errores;
* el seed no debe duplicar registros;
* iniciar varias veces no debe modificar el esquema.

Documenta los resultados.

PASO 7: SEED

Audita el seed.

Debe ser idempotente y crear únicamente los datos necesarios.

Verifica:

* administrador;
* jugadores;
* canchas;
* configuración inicial;
* hashes;
* valores predeterminados;
* cierre del DataSource;
* manejo de errores.

No debe:

* duplicar registros;
* sobrescribir datos del usuario sin necesidad;
* crear contraseñas débiles silenciosamente;
* fallar al ejecutarse varias veces;
* depender de `synchronize`.

Agrega una validación clara cuando falten variables obligatorias.

PASO 8: REGLAS DE JORNADAS

Audita el flujo completo de una jornada:

1. Crear borrador.
2. Seleccionar cancha.
3. Guardar snapshots.
4. Añadir participantes.
5. Modificar nivel snapshot.
6. Generar equipos.
7. Regenerar equipos.
8. Editar equipos.
9. Confirmar equipos.
10. Sortear orden inicial.
11. Volver a sortear.
12. Iniciar partido.
13. Registrar resultados.
14. Cambiar objetivo.
15. Deshacer último resultado.
16. Entrar a liquidación.
17. Seleccionar campeón.
18. Dividir costos.
19. Registrar pagos.
20. Finalizar.
21. Registrar pagos posteriores.
22. Cancelar.
23. Eliminar permanentemente.

Verifica las transiciones válidas e inválidas.

Crea una matriz de estados:

* estado actual;
* acción;
* estado siguiente;
* permitida;
* motivo de rechazo.

El backend debe rechazar acciones incompatibles aunque el frontend oculte el botón.

PASO 9: GENERACIÓN DE EQUIPOS

Audita el algoritmo de equipos.

Prueba:

* 4 jugadores y 2 equipos;
* 5 jugadores y 2 equipos;
* 10 jugadores y 2 equipos;
* 10 jugadores y 3 equipos;
* 13 jugadores y 4 equipos;
* todos con nivel igual;
* niveles muy desiguales;
* cantidad de jugadores igual a equipos;
* regeneraciones consecutivas;
* semilla reproducible.

Verifica:

* cada jugador aparece exactamente una vez;
* ningún equipo queda vacío;
* diferencia de tamaños máxima de uno;
* métricas correctas;
* variedad;
* transacción al reemplazar;
* edición manual válida;
* bloqueo después de confirmar.

Corrige cualquier sesgo o error demostrado, sin rediseñar el algoritmo innecesariamente.

PASO 10: PARTIDOS Y ROTACIÓN

Audita el flujo de competición.

Prueba dos, tres y cuatro equipos.

Verifica:

* orden inicial persistido;
* sorteo transaccional;
* un solo partido activo;
* ganador permanece;
* perdedor va al final;
* entra el primero de la cola;
* dos equipos repiten;
* secuencias únicas;
* reconstrucción desde historial;
* `targetScore` como snapshot;
* resultados sin empates;
* puntajes no negativos;
* ganador calculado en backend;
* posiciones derivadas;
* deshacer únicamente el último resultado;
* eliminación del partido activo posterior cuando corresponda.

Agrega pruebas de regresión para secuencias largas y resultados alternados.

PASO 11: LIQUIDACIÓN Y PAGOS

Audita:

* campeón sugerido;
* empate deportivo;
* selección manual;
* división de cancha;
* división de Gatorades;
* inclusiones;
* exclusiones;
* residuos;
* pagos parciales;
* pagos completos;
* sobrepagos;
* créditos;
* recálculo;
* cierre con deuda;
* pagos después del cierre.

Verifica invariantes:

1. La suma de `courtAmount` es exactamente `courtPrice`.
2. La suma de `gatoradeAmount` es exactamente `gatoradePrice`.
3. La suma de `amountDue` es exactamente la suma de costos.
4. El campeón no paga Gatorades.
5. El campeón sí puede pagar cancha.
6. No existen saldos pendientes negativos.
7. No existen créditos negativos.
8. Recalcular conserva `amountPaid`.
9. Una jornada finalizada no puede cambiar costos.
10. Una jornada finalizada permite corregir pagos.
11. Una jornada cancelada no puede liquidarse.

Prueba valores con residuos:

* 100000 entre 12;
* 37000 entre 8;
* 1 entre varios participantes;
* total cero;
* exclusiones;
* más participantes que pesos.

PASO 12: HISTORIA Y ESTADÍSTICAS

Audita:

* perfil de jugador;
* estadísticas competitivas;
* estadísticas financieras;
* snapshots;
* historial de jornadas;
* filtros;
* paginación;
* búsqueda por participante;
* resumen global;
* ajustes.

Verifica:

* jornadas eliminadas no aparecen;
* jornadas canceladas se identifican;
* no existen duplicados por joins;
* filtros se ejecutan en backend;
* win rate evita división por cero;
* campeonatos se calculan correctamente;
* los valores financieros coinciden con pagos;
* el perfil no modifica datos históricos;
* ajustes no afectan jornadas existentes.

PASO 13: AUDITORÍA DEL FRONTEND

Revisa todas las rutas y vistas.

Valida en anchos aproximados:

* 390 px;
* 768 px;
* 1024 px;
* 1440 px.

Revisa:

* navegación;
* barra inferior;
* sidebar;
* formularios;
* tablas;
* tarjetas;
* diálogos;
* drawers;
* toasts;
* skeletons;
* estados vacíos;
* errores;
* botones deshabilitados;
* scroll;
* textos largos;
* nombres largos;
* cantidades grandes;
* accesibilidad por teclado;
* contraste;
* foco visible;
* labels;
* ARIA;
* confirmaciones destructivas.

No cambies la identidad visual salvo que exista un problema real de usabilidad o accesibilidad.

PASO 14: CLIENTE HTTP Y MANEJO DE ERRORES

Audita el cliente HTTP centralizado.

Verifica:

* URL base;
* token;
* headers;
* serialización;
* respuestas sin contenido;
* errores de validación;
* errores de negocio;
* 401;
* 403;
* 404;
* 409;
* 500;
* timeout;
* redirección al login;
* invalidación de queries.

No debe haber llamadas `fetch` duplicadas y dispersas sin una justificación clara.

Los mensajes visibles deben estar en español y evitar mostrar detalles internos.

PASO 15: TANSTACK QUERY

Revisa:

* query keys;
* invalidaciones;
* cache;
* stale time;
* refetch;
* mutaciones;
* errores;
* carga;
* cambios de sesión;
* borrado de jornadas;
* pagos;
* dashboard;
* historial.

Verifica que:

* los datos se actualizan después de mutaciones;
* eliminar una jornada la quita de todos los listados;
* cerrar sesión limpia datos privados;
* cambiar de usuario no reutiliza cache anterior;
* no se producen refetch infinitos.

PASO 16: FORMULARIOS

Audita React Hook Form y Zod.

Verifica:

* esquemas;
* mensajes;
* valores iniciales;
* reset;
* edición;
* submit doble;
* loading;
* errores del servidor;
* campos monetarios;
* números enteros;
* selectores;
* fechas;
* campos opcionales.

Evita que:

* se envíen formularios dos veces;
* se envíen strings donde se esperan enteros;
* se pierdan datos al navegar entre pasos;
* los formularios queden bloqueados después de un error.

PASO 17: SEGURIDAD

Audita:

* secretos;
* archivos `.env`;
* logs;
* mensajes de error;
* dependencias;
* Docker;
* headers;
* CORS;
* JWT;
* rate limiting;
* validaciones;
* SQL injection;
* mass assignment;
* control de acceso;
* endpoints destructivos;
* confirmación de eliminación.

Ejecuta una búsqueda de:

* claves;
* tokens;
* contraseñas;
* URLs privadas;
* credenciales de base;
* secretos incluidos en Git.

No agregues secretos reales.

Verifica que la eliminación permanente:

* requiera confirmación;
* esté autenticada;
* no permita borrar recursos relacionados incorrectamente;
* no sea vulnerable a IDs de otras jornadas.

PASO 18: DEPENDENCIAS

Audita dependencias del monorepo.

Verifica:

* dependencias no utilizadas;
* dependencias duplicadas;
* versiones incompatibles;
* dependencias de desarrollo en producción;
* paquetes vulnerables;
* imports obsoletos.

Ejecuta el mecanismo de auditoría disponible en pnpm.

No actualices versiones mayores sin necesidad.

Aplica actualizaciones seguras cuando:

* solucionen vulnerabilidades;
* no introduzcan cambios incompatibles;
* las pruebas sigan pasando.

Documenta vulnerabilidades que no puedan corregirse sin una actualización mayor.

PASO 19: RENDIMIENTO DEL BACKEND

Revisa:

* N+1;
* joins excesivos;
* consultas sin índices;
* paginación;
* agregaciones;
* filtros;
* transacciones largas;
* consultas repetidas;
* selección de columnas;
* pool de conexiones.

Optimiza únicamente problemas demostrables.

Añade índices mediante migraciones nuevas cuando sea necesario.

Revisa especialmente:

* historial de jornadas;
* perfil de jugador;
* tabla de posiciones;
* dashboard;
* estado de pagos;
* resumen final.

PASO 20: RENDIMIENTO DEL FRONTEND

Revisa:

* tamaño del bundle;
* imports;
* componentes cliente;
* imágenes;
* renderizados;
* memoización;
* consultas duplicadas;
* listas grandes;
* carga diferida.

No conviertas componentes a cliente sin necesidad.

Usa carga diferida únicamente cuando aporte valor real.

Verifica que el frontend compile sin advertencias críticas.

PASO 21: PRUEBAS UNITARIAS

Revisa la cobertura de reglas de dominio.

Deben existir pruebas suficientes para:

* autenticación;
* jugadores;
* canchas;
* jornadas;
* snapshots;
* equipos;
* generación;
* rotación;
* resultados;
* posiciones;
* deshacer;
* distribución monetaria;
* liquidación;
* pagos;
* cierre;
* cancelación;
* eliminación permanente;
* perfiles;
* historial;
* ajustes;
* permisos.

No busques un porcentaje artificial.

Prioriza caminos críticos, casos límite y regresiones.

PASO 22: PRUEBAS DE INTEGRACIÓN

Utiliza PostgreSQL real.

Valida:

* migraciones;
* restricciones;
* transacciones;
* relaciones;
* cascadas;
* endpoints;
* autenticación;
* permisos;
* filtros;
* paginación;
* concurrencia básica.

No utilices SQLite como sustituto principal.

Asegura:

* aislamiento;
* limpieza;
* cierre de conexiones;
* resultados reproducibles.

PASO 23: PRUEBAS E2E

Crea o completa un flujo E2E principal:

1. Iniciar sesión.
2. Crear jugadores.
3. Crear cancha.
4. Crear jornada.
5. Seleccionar participantes.
6. Generar equipos.
7. Regenerar.
8. Confirmar.
9. Sortear.
10. Iniciar partido.
11. Registrar varios resultados.
12. Cambiar puntaje objetivo.
13. Consultar posiciones.
14. Deshacer último resultado.
15. Entrar a liquidación.
16. Elegir campeón.
17. Confirmar distribución.
18. Registrar pagos.
19. Finalizar con deuda.
20. Completar pago después del cierre.
21. Consultar resumen.
22. Consultar perfil de jugador.
23. Consultar historial.
24. Modificar ajustes.
25. Crear otra jornada con valores predeterminados.

Crea flujos destructivos separados:

* cancelar jornada;
* eliminar permanentemente jornada.

El E2E debe poder ejecutarse de forma reproducible.

PASO 24: GITHUB ACTIONS

Revisa o crea:

.github/workflows/ci.yml

Debe ejecutar:

* checkout;
* configuración de Node;
* Corepack;
* pnpm;
* caché;
* instalación con lockfile;
* PostgreSQL de servicio cuando sea necesario;
* migraciones;
* lint;
* typecheck;
* pruebas;
* build.

Evita ejecutar pasos duplicados innecesariamente.

La CI debe fallar cuando falle cualquier validación crítica.

No incluyas secretos reales.

Documenta las variables requeridas.

PASO 25: DOCKER COMPOSE LOCAL

Audita `docker-compose.yml`.

Debe incluir PostgreSQL con:

* volumen persistente;
* healthcheck;
* variables configurables;
* puerto;
* reinicio apropiado;
* nombre claro.

Opcionalmente puede incluir API y web para pruebas locales completas si la configuración es mantenible.

El README debe explicar:

* iniciar;
* detener;
* eliminar contenedores;
* conservar datos;
* eliminar volumen;
* ejecutar migraciones;
* ejecutar seed.

PASO 26: DOCKERFILE DEL BACKEND

Crea o corrige un Dockerfile multi-stage para `apps/api`.

Debe:

1. Usar una versión estable de Node.
2. Activar Corepack.
3. Instalar con lockfile.
4. Aprovechar caché.
5. Compilar dependencias del monorepo.
6. Compilar NestJS.
7. Copiar migraciones compiladas.
8. Ejecutar como usuario no root cuando sea viable.
9. Escuchar `process.env.PORT`.
10. Tener una imagen final mínima.
11. No incluir fuentes ni dependencias innecesarias.
12. No incluir secretos.
13. Permitir ejecutar migraciones antes del inicio.

Crea un entrypoint seguro si es necesario.

El servidor no debe iniciar si las migraciones fallan.

PASO 27: FRONTEND PARA PRODUCCIÓN

Verifica la configuración de Next.js.

Debe:

* usar `NEXT_PUBLIC_API_URL`;
* construir correctamente;
* no depender de URLs locales;
* manejar rutas protegidas;
* mostrar errores recuperables;
* funcionar con backend en otro dominio;
* respetar CORS;
* no exponer secretos.

Crea o corrige configuración para despliegue en Vercel.

No agregues secretos en archivos versionados.

PASO 28: VARIABLES DE ENTORNO

Revisa y completa archivos `.env.example`.

Backend:

* NODE_ENV.
* PORT.
* DATABASE_URL.
* MIGRATION_DATABASE_URL.
* DATABASE_SSL.
* DATABASE_POOL_SIZE.
* JWT_SECRET.
* JWT_EXPIRES_IN.
* CORS_ORIGINS.
* SEED_ADMIN_NAME.
* SEED_ADMIN_EMAIL.
* SEED_ADMIN_PASSWORD.
* ENABLE_SWAGGER.

Frontend:

* NEXT_PUBLIC_API_URL.

Pruebas:

* TEST_DATABASE_URL cuando sea necesario.

Valida variables obligatorias al iniciar.

No uses valores inseguros por defecto en producción.

PASO 29: PREPARACIÓN PARA DESPLIEGUE

Prepara la aplicación para:

* Frontend en Vercel.
* Backend Docker en un proveedor compatible.
* PostgreSQL en Neon o PostgreSQL administrado equivalente.

No ejecutes despliegues reales ni crees cuentas externas.

Crea:

docs/DEPLOYMENT.md

Incluye:

1. Arquitectura productiva.
2. Creación de base de datos.
3. Conexión pooled para la aplicación.
4. Conexión directa para migraciones.
5. Variables de entorno.
6. Migraciones.
7. Seed inicial.
8. Despliegue del backend.
9. Despliegue del frontend.
10. CORS.
11. Health check.
12. Verificación posterior.
13. Rollback.
14. Logs.
15. Problemas comunes.

PASO 30: ESTRATEGIA DE MIGRACIONES EN PRODUCCIÓN

Define una estrategia segura.

Debe:

* ejecutar migraciones compiladas;
* usar `MIGRATION_DATABASE_URL` cuando exista;
* detener el despliegue si fallan;
* no generar migraciones en producción;
* no usar `synchronize`;
* evitar ejecutar múltiples migraciones concurrentemente.

Documenta el comando exacto.

Incluye scripts claros como:

* `migration:run`;
* `migration:show`;
* `migration:revert`.

No reviertas migraciones automáticamente durante un fallo.

PASO 31: HEALTH CHECK Y DISPONIBILIDAD

Audita:

GET /api/health

Debe comprobar al menos:

* aplicación activa;
* conexión básica con PostgreSQL.

No debe exponer:

* credenciales;
* URLs completas;
* detalles sensibles.

Retorna un estado apropiado cuando la base no esté disponible.

Prepara el endpoint para health checks del proveedor.

PASO 32: LOGS

Revisa el sistema de logs.

Debe:

* registrar inicio;
* errores;
* errores de migración;
* solicitudes críticas;
* acciones destructivas;
* fallos de autenticación limitados;
* identificadores relevantes.

No debe registrar:

* contraseñas;
* JWT completos;
* secretos;
* cadenas completas de conexión;
* datos sensibles innecesarios.

Usa logs estructurados cuando sea viable sin introducir complejidad excesiva.

PASO 33: DOCUMENTACIÓN FINAL

Actualiza:

* README.md.
* docs/IMPLEMENTATION_PLAN.md.
* docs/FINAL_AUDIT.md.
* docs/DEPLOYMENT.md.
* docs/API.md.
* docs/DATA_MODEL.md.
* docs/BUSINESS_RULES.md.
* docs/PRODUCT_SPEC.md.
* AGENTS.md.

README debe incluir:

* descripción;
* arquitectura;
* requisitos;
* instalación;
* variables;
* Docker;
* migraciones;
* seed;
* desarrollo;
* pruebas;
* build;
* despliegue;
* estructura;
* comandos frecuentes.

Marca la implementación como lista únicamente cuando las validaciones correspondientes hayan pasado.

PASO 34: VALIDACIÓN LIMPIA FINAL

Ejecuta desde un entorno limpio:

1. Elimina dependencias instaladas cuando sea seguro.
2. Instala usando únicamente el lockfile.
3. Inicia PostgreSQL.
4. Ejecuta migraciones sobre base vacía.
5. Ejecuta seed.
6. Inicia backend.
7. Verifica `/api/health`.
8. Inicia frontend.
9. Ejecuta lint.
10. Ejecuta typecheck.
11. Ejecuta pruebas unitarias.
12. Ejecuta pruebas de integración.
13. Ejecuta pruebas del frontend.
14. Ejecuta E2E.
15. Ejecuta build del backend.
16. Ejecuta build del frontend.
17. Construye la imagen Docker.
18. Inicia el contenedor.
19. Verifica health check desde el contenedor.
20. Revisa el diff completo.
21. Busca secretos.
22. Revisa archivos no rastreados.

Corrige todos los errores encontrados.

PASO 35: REPORTE FINAL

Completa `docs/FINAL_AUDIT.md` con:

* alcance revisado;
* errores encontrados;
* severidad;
* correcciones;
* pruebas añadidas;
* migraciones nuevas;
* cambios de seguridad;
* optimizaciones;
* comandos ejecutados;
* resultados;
* validaciones no ejecutadas;
* riesgos pendientes;
* recomendaciones operativas.

Clasifica los problemas:

* CRITICAL.
* HIGH.
* MEDIUM.
* LOW.

No ocultes problemas pendientes.

PASO 36: COMMITS Y ENTREGA

Realiza commits locales pequeños y descriptivos cuando el entorno lo permita.

Ejemplos:

* fix: resolve critical business rule regressions
* fix(api): harden authorization and validation
* fix(db): add missing constraints and indexes
* fix(web): improve responsive and error states
* test: complete critical workflow coverage
* build: prepare production Docker image
* ci: finalize validation workflow
* docs: complete deployment and audit guides

No hagas push.

No abras un pull request automáticamente.

LÍMITE DE LA TAREA

Al finalizar:

1. Detén el desarrollo.
2. No agregues funcionalidades nuevas.
3. No realices despliegues externos.
4. No crees cuentas ni recursos en proveedores.
5. No incluyas secretos.
6. No marques validaciones no ejecutadas como aprobadas.

Entrega un resumen con:

* Errores encontrados.
* Errores corregidos.
* Cambios de seguridad.
* Cambios de base de datos.
* Migraciones creadas.
* Pruebas añadidas.
* Resultados de lint.
* Resultados de typecheck.
* Resultados de pruebas.
* Resultados de build.
* Resultado del Docker build.
* Estado de la CI.
* Comandos de despliegue.
* Variables requeridas.
* Riesgos pendientes.
* Checklist manual para producción.

No modifiques funcionalidades ajenas a la auditoría salvo que sea necesario para corregir un error demostrado, y documenta cada cambio excepcional.