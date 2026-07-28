Trabaja directamente sobre el repositorio de VolleyFlow.

La especificación general se encuentra en:

docs/prompt-codex.md

El plan de implementación se encuentra en:

docs/IMPLEMENTATION_PLAN.md

Lee ambos documentos antes de modificar código y utiliza como referencia visual los diseños disponibles dentro de:

design/stitch/

OBJETIVO

Implementa exclusivamente:

FASE 6: PERFIL DE JUGADOR, HISTORIAL GLOBAL Y AJUSTES

Vistas disponibles:

* Perfil de jugador - Móvil.
* Historial de jornadas - Móvil.
* Ajustes y reglas - Móvil.

El alcance incluye:

* Perfil detallado de cada jugador.
* Estadísticas históricas derivadas.
* Historial de participación del jugador.
* Historial financiero del jugador.
* Historial global de jornadas.
* Búsqueda, filtros, ordenamiento y paginación.
* Resumen general del historial.
* Configuración de valores predeterminados.
* Visualización de reglas de negocio.
* Permisos para editar ajustes.
* Aplicación de configuraciones únicamente a jornadas nuevas.

FUERA DE ALCANCE

No implementes:

* Rankings competitivos globales.
* Sistema de puntos acumulados entre jornadas.
* Torneos.
* Logros o insignias.
* Notificaciones.
* Exportación PDF o Excel.
* Integraciones externas.
* Pasarelas de pago.
* Edición de resultados históricos.
* Modificación de snapshots históricos.
* Cambio retroactivo de liquidaciones.
* Gráficas complejas o analítica avanzada.
* Registro público de usuarios.
* Gestión avanzada de múltiples organizaciones.

No modifiques reglas de equipos, partidos, pagos o liquidación salvo que sea estrictamente necesario para consultar correctamente la información histórica.

PRINCIPIOS GENERALES

* Utiliza exclusivamente NestJS, TypeORM y PostgreSQL.
* No instales ni utilices Prisma.
* No utilices `synchronize: true`.
* Las estadísticas deben derivarse de los registros existentes.
* No almacenes totales duplicados cuando puedan calcularse de manera confiable.
* Los snapshots históricos no deben alterarse.
* Los valores monetarios deben tratarse como enteros en pesos colombianos.
* Todos los filtros y paginación deben ejecutarse en backend.
* Evita consultas N+1.
* No cargues relaciones completas cuando solo necesites campos específicos.
* Utiliza QueryBuilder para consultas históricas y agregaciones complejas.
* Mantén la interfaz mobile-first y completamente en español.

PASO 1: INSPECCIÓN TÉCNICA

Antes de implementar:

1. Lee completamente `docs/prompt-codex.md`.
2. Lee `docs/IMPLEMENTATION_PLAN.md`.
3. Inspecciona:

   * entidades TypeORM;
   * migraciones;
   * módulos de jugadores;
   * módulos de jornadas;
   * equipos;
   * partidos;
   * liquidaciones;
   * pagos;
   * dashboard;
   * cliente HTTP;
   * autenticación y roles;
   * rutas y componentes actuales.
4. Identifica los diseños de Stitch correspondientes a esta tarea.
5. Ejecuta inicialmente:

   * lint;
   * typecheck;
   * pruebas;
   * build.
6. Documenta cualquier error previo antes de corregirlo.
7. Reutiliza componentes, formatos, hooks y convenciones existentes.
8. No rediseñes funcionalidades que no pertenecen a esta tarea.

PASO 2: PERFIL HISTÓRICO DEL JUGADOR

Amplía el módulo de jugadores para ofrecer un perfil histórico completo.

El perfil debe separar claramente:

DATOS ACTUALES

* id.
* nombre actual.
* nivel actual.
* notas.
* estado activo o inactivo.
* fecha de creación.
* fecha de actualización.

DATOS HISTÓRICOS

Los datos históricos deben utilizar:

* `playerNameSnapshot`.
* `levelSnapshot`.
* equipo asignado en cada jornada.
* resultados de los partidos del equipo.
* liquidación individual.
* pagos realizados.

Cambiar el nombre o nivel actual del jugador no debe alterar jornadas anteriores.

PASO 3: ESTADÍSTICAS DEL JUGADOR

Implementa un servicio de estadísticas derivadas para cada jugador.

Debe retornar, como mínimo:

PARTICIPACIÓN

* `totalParticipations`: cantidad total de jornadas donde fue agregado.
* `completedSessions`: jornadas finalizadas donde participó.
* `activeSessions`: jornadas actualmente activas donde participa.
* `cancelledSessions`: jornadas canceladas donde participó.
* `firstParticipationDate`.
* `lastParticipationDate`.

COMPETICIÓN

* `matchesPlayed`.
* `matchesWon`.
* `matchesLost`.
* `winRate`.
* `pointsFor`.
* `pointsAgainst`.
* `pointDifference`.
* `championships`.

FINANZAS

* `totalDue`.
* `totalPaid`.
* `totalPending`.
* `totalCredit`.
* `sessionsPaid`.
* `sessionsPartiallyPaid`.
* `sessionsPending`.
* `cashPaid`.
* `transferPaid`.

NIVELES HISTÓRICOS

* nivel actual.
* nivel utilizado en la participación más reciente.
* promedio de `levelSnapshot`.
* nivel mínimo utilizado.
* nivel máximo utilizado.

REGLAS DE CÁLCULO

1. Los partidos cuentan únicamente cuando están finalizados.
2. Un partido cuenta para el jugador cuando su equipo participó en ese partido.
3. Una victoria cuenta cuando el equipo del jugador fue ganador.
4. Una derrota cuenta cuando su equipo fue perdedor.
5. `winRate` debe evitar divisiones por cero.
6. Los campeonatos se calculan cuando el jugador pertenece al equipo campeón de una jornada liquidada o finalizada.
7. Las jornadas canceladas no cuentan como campeonatos.
8. Los valores financieros se calculan desde `amountDue` y `amountPaid`.
9. `totalPending` nunca puede ser negativo.
10. `totalCredit` representa sobrepagos.
11. No incluyas jornadas eliminadas, pues ya no existen físicamente.
12. Las estadísticas deben ser consistentes con los datos históricos persistidos.

No almacenes estas estadísticas en nuevas columnas del jugador.

PASO 4: API DEL PERFIL DEL JUGADOR

Implementa o amplía los siguientes endpoints.

GET /api/players/:id/profile

Debe retornar:

* Datos actuales del jugador.
* Estadísticas generales.
* Resumen competitivo.
* Resumen financiero.
* Nivel histórico.
* Participaciones recientes.
* Estado de deuda.

GET /api/players/:id/sessions

Debe aceptar:

* `page`.
* `limit`.
* `status`.
* `dateFrom`.
* `dateTo`.
* `sortOrder`.
* `paymentStatus`.

Debe retornar por participación:

* id de jornada.
* fecha.
* cancha snapshot.
* estado.
* nombre snapshot del jugador.
* nivel snapshot.
* equipo.
* cantidad de partidos del equipo.
* victorias.
* derrotas.
* campeón o no.
* valor de cancha.
* valor de Gatorades.
* total debido.
* total pagado.
* pendiente.
* crédito.
* método de pago.
* estado de pago.

GET /api/players/:id/matches

Puede implementarse si mejora claramente el perfil.

Debe aceptar paginación y retornar:

* jornada.
* fecha.
* equipo del jugador.
* rival.
* resultado.
* objetivo del partido.
* victoria o derrota.

No retornes cantidades ilimitadas de registros.

PASO 5: ESTADO DE PAGO HISTÓRICO

Utiliza estados derivados:

* NOT_REQUIRED.
* PENDING.
* PARTIAL.
* PAID.
* CREDIT.

Reglas:

* NOT_REQUIRED cuando `amountDue === 0`.
* PENDING cuando `amountDue > 0` y `amountPaid === 0`.
* PARTIAL cuando `amountPaid > 0` y `amountPaid < amountDue`.
* PAID cuando `amountPaid === amountDue`.
* CREDIT cuando `amountPaid > amountDue`.

Estos estados deben calcularse con una función compartida.

No almacenes estados duplicados en la base de datos.

PASO 6: FRONTEND — PERFIL DEL JUGADOR

Implementa o completa la ruta:

/players/[id]

Utiliza como referencia:

Perfil de jugador - Móvil

Debe mostrar:

ENCABEZADO

* Nombre actual.
* Nivel actual.
* Estado activo o inactivo.
* Acción editar.
* Acción activar o desactivar.
* Notas.

RESUMEN

* Jornadas jugadas.
* Partidos jugados.
* Victorias.
* Porcentaje de victorias.
* Campeonatos.
* Saldo pendiente.

SECCIÓN DE RENDIMIENTO

* Partidos ganados.
* Partidos perdidos.
* Puntos a favor.
* Puntos en contra.
* Diferencia.
* Promedio histórico de nivel.

No implementes rankings comparando al jugador con otros.

SECCIÓN FINANCIERA

* Total debido.
* Total pagado.
* Total pendiente.
* Créditos.
* Pagos en efectivo.
* Pagos por transferencia.

HISTORIAL DE JORNADAS

Por cada registro muestra:

* Fecha.
* Cancha.
* Estado.
* Equipo.
* Nivel snapshot.
* Victorias y derrotas.
* Campeón o no.
* Total a pagar.
* Total pagado.
* Estado de pago.
* Acción para abrir la jornada.

Incluye:

* Filtros.
* Paginación o carga progresiva.
* Skeletons.
* Estado vacío.
* Manejo de errores.
* Diseño responsive.
* Formato monetario.
* Fechas en español.
* Navegación de regreso.

No uses datos simulados permanentes.

PASO 7: HISTORIAL GLOBAL DE JORNADAS

Implementa o completa la ruta:

/sessions

Utiliza como referencia:

Historial de jornadas - Móvil

Debe consumir datos reales del backend.

Debe permitir:

* Buscar por cancha.
* Buscar por participante.
* Filtrar por estado.
* Filtrar por rango de fechas.
* Filtrar por estado financiero.
* Filtrar por existencia de campeón.
* Ordenar por fecha ascendente o descendente.
* Paginar.
* Limpiar filtros.

ESTADOS DE JORNADA

Debe soportar correctamente:

* DRAFT.
* TEAMS_CREATED.
* IN_PROGRESS.
* SETTLEMENT.
* FINISHED.
* CANCELLED.

FILTRO FINANCIERO

Debe permitir, como mínimo:

* Sin liquidar.
* Sin deuda.
* Con pagos pendientes.
* Con pagos parciales.
* Con crédito.

Cada jornada debe mostrar:

* Fecha.
* Cancha snapshot.
* Estado.
* Cantidad de participantes.
* Cantidad de equipos.
* Cantidad de partidos finalizados.
* Equipo campeón cuando exista.
* Total esperado.
* Total recaudado.
* Total pendiente.
* Indicador de pagos.
* Acción para abrir detalle.

REGLAS

* Una jornada cancelada debe identificarse claramente.
* Una jornada eliminada no debe aparecer.
* No declares campeón cuando no existe uno confirmado.
* Los valores financieros deben ser cero o null cuando aún no hay liquidación.
* Los filtros deben ejecutarse en backend.
* La búsqueda por participante debe considerar snapshots históricos.
* Evita duplicar jornadas al realizar joins.

PASO 8: API DEL HISTORIAL GLOBAL

Amplía:

GET /api/sessions

Debe aceptar, como mínimo:

* `search`.
* `participantSearch`.
* `status`.
* `dateFrom`.
* `dateTo`.
* `financialStatus`.
* `hasChampion`.
* `page`.
* `limit`.
* `sortOrder`.

Respuesta:

* `items`.
* `page`.
* `limit`.
* `totalItems`.
* `totalPages`.
* filtros aplicados cuando sea útil.

Cada elemento debe incluir únicamente la información necesaria para el listado.

No cargues de forma indiscriminada:

* todos los participantes;
* todos los partidos;
* todos los pagos.

Utiliza subconsultas, agregaciones o consultas separadas eficientes.

PASO 9: RESUMEN DEL HISTORIAL

Implementa un endpoint:

GET /api/sessions/history/summary

Debe aceptar el mismo rango de fechas general cuando corresponda.

Debe retornar:

* total de jornadas.
* jornadas finalizadas.
* jornadas canceladas.
* jornadas activas.
* total de participantes acumulados.
* total de partidos finalizados.
* total esperado.
* total recaudado.
* total pendiente.

No implementes:

* ranking de jugadores;
* ranking de equipos;
* jugador con más victorias;
* métricas comparativas avanzadas.

El resumen debe respetar filtros de fechas cuando se envíen.

PASO 10: FRONTEND — RESUMEN DEL HISTORIAL

En la vista de historial muestra indicadores compactos:

* Total de jornadas.
* Finalizadas.
* Activas.
* Partidos registrados.
* Saldo pendiente.

En móvil:

* Usa tarjetas compactas.
* No satures la interfaz.
* Permite ocultar o desplazar indicadores cuando sea necesario.

Los indicadores deben actualizarse con los filtros de fecha aplicados.

PASO 11: AJUSTES DE LA APLICACIÓN

Implementa una configuración persistente y centralizada.

Crea una entidad TypeORM:

AppSettingsEntity

Debe funcionar como configuración única de la aplicación.

Campos sugeridos:

* id UUID.
* organizationName.
* defaultTeamCount.
* defaultTargetScore.
* defaultCourtPrice.
* defaultGatoradePrice.
* defaultVenue nullable.
* timezone.
* createdAt.
* updatedAt.
* updatedBy nullable.

VALORES Y VALIDACIONES

* `organizationName`: texto obligatorio.
* `defaultTeamCount`: entero mínimo 2.
* `defaultTargetScore`: entero positivo.
* `defaultCourtPrice`: entero mayor o igual a cero.
* `defaultGatoradePrice`: entero mayor o igual a cero.
* `defaultVenue`: debe existir y estar activa.
* `timezone`: utiliza `America/Bogota` por defecto.

No agregues configuraciones que permitan romper reglas fundamentales.

Mantén como reglas fijas no editables:

* Cada victoria suma un punto.
* El ganador permanece.
* El perdedor pasa al final de la cola.
* El campeón no paga Gatorades.
* La cancha se divide entre participantes incluidos.
* Los valores se distribuyen usando enteros.
* No se permiten empates en resultados.
* Solo se puede deshacer el último resultado.

PASO 12: MIGRACIÓN Y CONFIGURACIÓN INICIAL

Crea una migración TypeORM real y reversible para `app_settings`.

Crea una configuración inicial idempotente.

Valores predeterminados sugeridos:

* `organizationName`: VolleyFlow.
* `defaultTeamCount`: 2.
* `defaultTargetScore`: 10.
* `defaultCourtPrice`: 0.
* `defaultGatoradePrice`: 0.
* `defaultVenue`: null.
* `timezone`: America/Bogota.

La aplicación debe garantizar que exista una configuración.

No crees múltiples filas de configuración.

Usa:

* una restricción;
* una clave conocida;
* o un servicio singleton seguro.

Documenta la estrategia utilizada.

PASO 13: API DE AJUSTES

Implementa:

GET /api/settings

Debe requerir autenticación.

Debe retornar:

* Ajustes editables.
* Reglas fijas de negocio.
* Fecha de última actualización.
* Usuario que actualizó cuando exista.

Implementa:

PATCH /api/settings

Debe permitir actualizar:

* `organizationName`.
* `defaultTeamCount`.
* `defaultTargetScore`.
* `defaultCourtPrice`.
* `defaultGatoradePrice`.
* `defaultVenueId`.
* `timezone`.

REGLAS

1. Solo usuarios con rol ADMIN pueden editar.
2. ORGANIZER puede consultar, pero no modificar.
3. Valida todos los valores.
4. La actualización debe ser transaccional.
5. Guarda `updatedBy`.
6. No crea una segunda configuración.
7. Rechaza una cancha inactiva.
8. Permite limpiar la cancha predeterminada.
9. Retorna la configuración actualizada.

No permitas modificar reglas fijas mediante este endpoint.

PASO 14: APLICACIÓN DE VALORES PREDETERMINADOS

Los ajustes deben aplicarse únicamente al iniciar una nueva jornada.

Cuando se abra el formulario de creación de jornada:

* Precarga `defaultTeamCount`.
* Precarga `defaultTargetScore`.
* Precarga `defaultCourtPrice`.
* Precarga `defaultGatoradePrice`.
* Precarga la cancha predeterminada cuando exista y esté activa.

REGLAS

* El usuario puede modificar estos valores para la nueva jornada.
* Cambiar ajustes no modifica jornadas existentes.
* Cambiar ajustes no modifica snapshots.
* Cambiar ajustes no recalcula liquidaciones.
* Si la cancha predeterminada deja de estar activa, no debe precargarse.
* El backend debe exponer los valores predeterminados de forma segura.
* No dependas únicamente del frontend para aplicar las reglas.

PASO 15: FRONTEND — AJUSTES Y REGLAS

Implementa la ruta:

/settings

Utiliza como referencia:

Ajustes y reglas - Móvil

Debe incluir:

SECCIÓN GENERAL

* Nombre de la organización.
* Zona horaria.

VALORES PREDETERMINADOS

* Cantidad de equipos.
* Puntaje objetivo.
* Cancha predeterminada.
* Valor predeterminado de cancha.
* Valor predeterminado de Gatorades.

REGLAS DE JUEGO

Muestra en modo informativo y no editable:

* El ganador permanece.
* El perdedor rota al final de la cola.
* Cada victoria suma un punto.
* El puntaje objetivo se guarda por partido.
* Solo puede deshacerse el último resultado.

REGLAS DE PAGOS

Muestra en modo informativo:

* El campeón no paga Gatorades.
* La cancha se divide entre participantes incluidos.
* Los valores se manejan en pesos enteros.
* Los residuos se distribuyen de manera exacta.
* Los pagos pueden ser parciales.
* Una jornada puede cerrarse con deudas confirmadas.

PERMISOS

* ADMIN puede editar.
* ORGANIZER ve los campos en modo lectura.
* Muestra una explicación cuando el usuario no tiene permisos.

Utiliza:

* React Hook Form.
* Zod.
* TanStack Query.
* Toasts.
* Confirmación antes de guardar.
* Skeletons.
* Manejo de errores.
* Diseño mobile-first.

PASO 16: NAVEGACIÓN

Actualiza la navegación para incluir:

* Historial de jornadas.
* Ajustes.

La vista de jugadores debe permitir abrir el perfil del jugador.

Asegura:

* Estado activo correcto.
* Navegación móvil.
* Sidebar de escritorio.
* Rutas protegidas.
* Control de permisos para ajustes.
* Botones de regresar coherentes.

No agregues nuevas secciones ajenas a este alcance.

PASO 17: RENDIMIENTO DE CONSULTAS

Revisa especialmente las consultas históricas.

REQUISITOS

1. Evita N+1.
2. Añade índices cuando sea necesario.
3. Usa selección explícita de columnas.
4. Pagina antes de cargar relaciones extensas.
5. No cargues historiales completos en memoria.
6. Las agregaciones deben ejecutarse en PostgreSQL cuando sea apropiado.
7. Las respuestas deben tener contratos tipados.
8. Los filtros deben ser combinables.
9. Las consultas no deben devolver jornadas duplicadas.
10. Documenta cualquier QueryBuilder complejo.

Considera índices para:

* `session_players.player_id`.
* `session_players.session_id`.
* `game_sessions.date`.
* `game_sessions.status`.
* `matches.session_id`.
* `matches.status`.
* `teams.session_id`.
* `game_sessions.champion_team_id`.

Crea una migración si hacen falta índices.

PASO 18: PRUEBAS UNITARIAS

Agrega pruebas para:

PERFIL DE JUGADOR

* Jugador sin participaciones.
* Jugador con una participación.
* Varias jornadas.
* Jornadas canceladas.
* Partidos ganados.
* Partidos perdidos.
* Win rate.
* Puntos a favor y en contra.
* Campeonatos.
* Snapshots históricos.
* Nivel promedio.
* Total debido.
* Total pagado.
* Total pendiente.
* Crédito.
* Métodos de pago.
* Estados de pago derivados.

HISTORIAL GLOBAL

* Filtrar por estado.
* Filtrar por fechas.
* Buscar por cancha.
* Buscar por participante.
* Filtrar por estado financiero.
* Filtrar por campeón.
* Ordenar.
* Paginar.
* Evitar duplicados.
* Excluir jornadas eliminadas.
* Mostrar canceladas.
* Calcular resumen.

AJUSTES

* Crear configuración inicial.
* Evitar configuraciones duplicadas.
* Consultar ajustes.
* Actualizar como ADMIN.
* Rechazar actualización como ORGANIZER.
* Validar cantidad de equipos.
* Validar puntaje.
* Validar precios.
* Validar cancha activa.
* Limpiar cancha predeterminada.
* Conservar reglas fijas.
* Guardar usuario actualizador.

VALORES PREDETERMINADOS

* Aplicar valores a una jornada nueva.
* Permitir sobrescribirlos.
* No modificar jornadas existentes.
* Ignorar cancha predeterminada inactiva.

PASO 19: PRUEBAS DE INTEGRACIÓN CON POSTGRESQL

Agrega pruebas para:

1. Consultar perfil de jugador sin historial.
2. Consultar perfil con múltiples jornadas.
3. Calcular estadísticas desde partidos reales.
4. Calcular estadísticas financieras.
5. Consultar participaciones paginadas.
6. Filtrar participaciones.
7. Consultar historial global.
8. Combinar filtros.
9. Buscar por participante snapshot.
10. Consultar resumen del historial.
11. Crear configuración inicial.
12. Consultar ajustes como ORGANIZER.
13. Actualizar ajustes como ADMIN.
14. Rechazar actualización sin permisos.
15. Aplicar ajustes al crear una jornada nueva.
16. Confirmar que jornadas existentes no cambian.
17. Rechazar operaciones sin JWT.
18. Verificar índices y consultas cuando corresponda.

No utilices SQLite como sustituto principal.

PASO 20: PRUEBAS DEL FRONTEND

Agrega pruebas para:

PERFIL

* Renderizar jugador sin historial.
* Mostrar estadísticas.
* Mostrar historial.
* Filtrar participaciones.
* Mostrar estados de pago.
* Abrir una jornada.
* Manejar error de jugador inexistente.
* Skeletons y estados vacíos.

HISTORIAL

* Renderizar listado.
* Buscar por cancha.
* Buscar por participante.
* Filtrar estado.
* Filtrar fechas.
* Filtrar estado financiero.
* Limpiar filtros.
* Paginar.
* Mostrar jornada cancelada.
* Mostrar resumen.
* Abrir detalle.

AJUSTES

* Cargar configuración.
* Editar como ADMIN.
* Mostrar solo lectura como ORGANIZER.
* Validar campos.
* Seleccionar cancha predeterminada.
* Limpiar cancha.
* Guardar.
* Manejar error de permisos.
* Mostrar reglas fijas.

PASO 21: PRUEBA E2E

Implementa un flujo E2E que cubra:

1. Abrir listado de jugadores.
2. Abrir perfil de un jugador con historial.
3. Verificar estadísticas.
4. Consultar sus participaciones.
5. Abrir una jornada desde el perfil.
6. Abrir historial global.
7. Aplicar filtros.
8. Buscar por participante.
9. Limpiar filtros.
10. Abrir ajustes.
11. Modificar valores predeterminados como ADMIN.
12. Crear una nueva jornada.
13. Verificar que el formulario precarga los nuevos valores.
14. Verificar que una jornada existente conserva sus valores anteriores.

Agrega un escenario de permisos:

1. Autenticarse como ORGANIZER.
2. Abrir ajustes.
3. Ver configuración en modo lectura.
4. Verificar que no puede guardar cambios.

PASO 22: DOCUMENTACIÓN

Actualiza:

* README.md.
* docs/IMPLEMENTATION_PLAN.md.
* docs/API.md.
* docs/DATA_MODEL.md.
* docs/BUSINESS_RULES.md.
* docs/PRODUCT_SPEC.md cuando corresponda.

Documenta:

* Perfil del jugador.
* Fórmulas de estadísticas.
* Jornadas incluidas y excluidas.
* Historial financiero.
* Estados de pago derivados.
* Filtros del historial.
* Paginación.
* Ajustes editables.
* Reglas fijas.
* Permisos.
* Aplicación de valores predeterminados.
* Migraciones e índices.
* Pruebas.

PASO 23: VALIDACIÓN FINAL

Ejecuta:

* Instalación con lockfile.
* Migraciones sobre PostgreSQL.
* Seed.
* Lint.
* Typecheck.
* Pruebas unitarias.
* Pruebas de integración.
* Pruebas del frontend.
* Pruebas E2E disponibles.
* Build del backend.
* Build del frontend.
* Inicio del backend.
* GET /api/health.
* Inicio del frontend.
* Perfil de jugador.
* Estadísticas históricas.
* Filtros del historial.
* Paginación.
* Ajustes como ADMIN.
* Ajustes como ORGANIZER.
* Precarga de valores en jornada nueva.
* Confirmación de que jornadas existentes no se modifican.

Corrige todos los errores encontrados.

No afirmes que una validación pasó si no fue ejecutada.

PASO 24: COMMITS Y ENTREGA

Realiza commits locales pequeños y descriptivos cuando el entorno lo permita.

Ejemplos:

* feat(api): add player historical profile
* feat(api): extend session history filters
* feat(api): add application settings
* feat(web): implement player profile
* feat(web): improve global session history
* feat(web): add settings and rules interface
* test: cover profiles history and settings
* docs: document administration features

No hagas push.

No abras un pull request automáticamente.

LÍMITE DE LA TAREA

Al completar esta tarea:

1. Detén la implementación.
2. No agregues rankings globales.
3. No agregues torneos.
4. No agregues logros.
5. No agregues notificaciones.
6. No agregues exportaciones.
7. No agregues integraciones externas.
8. No modifiques historiales persistidos.

Entrega un resumen con:

* Funcionalidades implementadas.
* Entidades, índices y migraciones añadidas.
* Endpoints disponibles.
* Estadísticas derivadas.
* Filtros disponibles.
* Ajustes configurables.
* Reglas fijas mostradas.
* Permisos aplicados.
* Pruebas ejecutadas.
* Resultados de lint, typecheck, tests y build.
* Comandos para ejecutar localmente.
* Problemas pendientes reales.

No modifiques funcionalidades ajenas a este alcance salvo que sea estrictamente necesario para implementar correctamente el perfil, el historial o los ajustes, y documenta cualquier cambio excepcional.