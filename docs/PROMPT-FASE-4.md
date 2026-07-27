Trabaja directamente sobre el repositorio de VolleyFlow.

La especificación general del proyecto se encuentra en:

docs/prompt-codex.md

El plan de implementación se encuentra en:

docs/IMPLEMENTATION_PLAN.md

Lee ambos documentos antes de modificar código y utiliza los diseños disponibles dentro de:

design/stitch/

OBJETIVO DE ESTA TAREA

Implementa exclusivamente:

FASE 4: COMPETICIÓN Y PARTIDOS

El alcance incluye:

* Sorteo transaccional del orden inicial.
* Enfrentamiento inicial aleatorio.
* Posibilidad de repetir el sorteo antes de iniciar.
* Inicio y control del partido activo.
* Registro y validación de marcadores.
* Rotación “ganador se queda”.
* Cola de equipos.
* Cambio del puntaje objetivo para partidos futuros.
* Historial de partidos.
* Tabla de posiciones derivada.
* Deshacer únicamente el último resultado.
* Cancelación de jornadas.
* Eliminación permanente de jornadas.

Vistas de Stitch correspondientes:

* Sorteo de Partido Inicial - Móvil.
* Control de Partido Activo - Móvil.
* Historial y Posiciones - Móvil.
* Historial de Partidos - Corregido.

También actualiza las vistas existentes de detalle e historial de jornadas para agregar las acciones de cancelar y eliminar.

FUERA DE ALCANCE

No implementes:

* Selección de campeón.
* División del valor de la cancha.
* División de Gatorades.
* Registro de pagos.
* Liquidación.
* Cierre financiero.
* Estadísticas históricas por jugador.
* Rankings globales.

No modifiques participantes ni la composición de equipos después de iniciar la competición.

PRINCIPIOS GENERALES

* Usa exclusivamente NestJS, TypeORM y PostgreSQL en el backend.
* No instales ni utilices Prisma.
* No uses `synchronize: true`.
* La lógica de rotación debe residir en servicios de dominio del backend.
* La rotación no puede depender únicamente del estado temporal del frontend.
* Las operaciones críticas deben ejecutarse dentro de transacciones.
* Las posiciones, estadísticas y cola deben poder reconstruirse desde la base de datos.
* Los partidos históricos no deben alterarse al cambiar configuraciones posteriores.
* No guardes cada pulsación del marcador en el backend.
* El marcador puede mantenerse localmente mientras se juega y persistirse al confirmar el resultado.

PASO 1: INSPECCIÓN TÉCNICA

Antes de implementar:

1. Lee completamente `docs/prompt-codex.md`.
2. Lee `docs/IMPLEMENTATION_PLAN.md`.
3. Inspecciona las entidades, migraciones, servicios, endpoints y rutas actuales.
4. Identifica los diseños de Stitch de esta fase.
5. Ejecuta:

   * lint;
   * typecheck;
   * pruebas;
   * build.
6. Documenta cualquier error base antes de modificarlo.
7. Verifica el estado real de:

   * `GameSessionEntity`;
   * `TeamEntity`;
   * `TeamPlayerEntity`;
   * `SessionPlayerEntity`.
8. Reutiliza la arquitectura y los componentes existentes.
9. No rediseñes funcionalidades fuera del alcance.

PASO 2: MODELO DE PARTIDOS

Implementa o completa `MatchEntity`.

Debe contener, como mínimo:

* id UUID.
* session.
* sequence entero.
* teamA.
* teamB.
* teamAScore entero.
* teamBScore entero.
* targetScore entero.
* status.
* winnerTeam nullable mientras esté activo.
* loserTeam nullable mientras esté activo.
* startedAt.
* finishedAt nullable.
* createdAt.
* updatedAt.

Crea el enum:

MatchStatus

* IN_PROGRESS
* FINISHED

RESTRICCIONES

Implementa restricciones e índices para garantizar:

1. `sessionId + sequence` es único.
2. Solo puede existir un partido activo por jornada.
3. Un equipo no puede enfrentarse contra sí mismo.
4. Ambos equipos deben pertenecer a la jornada.
5. El ganador y el perdedor deben pertenecer al partido.
6. Los marcadores no pueden ser negativos.
7. Un partido finalizado debe tener ganador, perdedor y `finishedAt`.
8. Un partido activo no debe tener ganador ni perdedor.
9. `targetScore` debe ser un entero positivo.
10. Los partidos deben eliminarse al eliminar permanentemente su jornada.

Cuando sea necesario, crea un índice parcial mediante una migración SQL explícita para impedir más de un partido `IN_PROGRESS` por jornada.

Crea una migración TypeORM real, reversible y compatible con el esquema existente.

PASO 3: ORDEN INICIAL Y SORTEO

Los equipos ya confirmados deben tener un orden inicial persistido mediante `initialRotationPosition` o una estructura equivalente.

Implementa un servicio de dominio responsable del sorteo inicial.

REGLAS DEL SORTEO

1. Solo puede sortearse una jornada con estado `TEAMS_CREATED`.
2. Deben existir al menos dos equipos confirmados.
3. Todos los equipos deben pertenecer a la jornada.
4. Ningún equipo puede tener una posición repetida.
5. Las posiciones deben ser consecutivas desde cero o uno.
6. El sorteo debe usar aleatoriedad real en producción.
7. Debe aceptar una semilla opcional únicamente para pruebas reproducibles.
8. El sorteo debe ejecutarse dentro de una transacción.
9. El sorteo no debe modificar integrantes ni nombres de los equipos.
10. Antes de iniciar el primer partido debe permitirse volver a sortear.
11. Después de iniciar el primer partido no puede repetirse el sorteo.

El resultado debe indicar:

* Equipo A inicial.
* Equipo B inicial.
* Equipos en espera.
* Orden completo.
* Puntaje objetivo que se utilizará al iniciar el partido.

ENDPOINTS SUGERIDOS

POST /api/sessions/:id/rotation/draw

Debe:

* Generar el orden inicial.
* Reemplazar un sorteo anterior cuando todavía no existen partidos.
* Retornar enfrentamiento inicial y cola.

POST /api/sessions/:id/rotation/redraw

Puede utilizarse como ruta separada o integrarse de forma coherente con `draw`.

GET /api/sessions/:id/rotation

Debe retornar:

* Estado del sorteo.
* Partido activo cuando exista.
* Próximo enfrentamiento.
* Equipo que permanece.
* Cola actual.
* Siguiente equipo.
* Número del siguiente partido.
* Puntaje objetivo actual.
* Acciones permitidas.

Puedes ajustar las rutas si existe una razón técnica clara, pero documenta el contrato final.

PASO 4: RECONSTRUCCIÓN DE LA ROTACIÓN

Crea un servicio de dominio puro y bien probado que reconstruya la rotación usando:

* Orden inicial persistido.
* Partidos finalizados ordenados por `sequence`.
* Partido activo cuando exista.

REGLA “GANADOR SE QUEDA”

Para tres o más equipos:

1. Los primeros dos equipos del orden inicial juegan.
2. Los demás quedan en una cola.
3. El ganador permanece.
4. El perdedor pasa al final de la cola.
5. El primer equipo de la cola entra a jugar.
6. Se repite el proceso después de cada partido.

Ejemplo:

Orden inicial:

* A
* B
* C
* D

Partido 1:

* A vs B
* gana A

Siguiente estado:

* A permanece.
* C entra.
* Cola: D, B.

Partido 2:

* A vs C
* gana C

Siguiente estado:

* C permanece.
* D entra.
* Cola: B, A.

DOS EQUIPOS

Cuando existan exactamente dos equipos:

* Los mismos dos equipos vuelven a jugar.
* El ganador se considera el equipo que permanece.
* No debe romperse la reconstrucción por tener una cola vacía.

El servicio debe retornar:

* `courtTeam`.
* `challengerTeam`.
* `waitingQueue`.
* `nextTeam`.
* `nextSequence`.
* `hasActiveMatch`.
* `canStartMatch`.
* `canUndoLastResult`.

No persistas una cola duplicada si puede derivarse correctamente desde el historial.

PASO 5: INICIO DE PARTIDO

Implementa:

POST /api/sessions/:id/matches/start

Debe:

1. Validar que no exista otro partido activo.
2. Validar que el sorteo inicial exista.
3. Reconstruir el enfrentamiento correcto.
4. Crear un partido con estado `IN_PROGRESS`.
5. Guardar el `targetScore` actual como snapshot.
6. Guardar `sequence`.
7. Guardar `startedAt`.
8. Cambiar la jornada a `IN_PROGRESS` cuando sea el primer partido.
9. Ejecutarse dentro de una transacción.
10. Retornar el partido activo y la rotación.

El partido activo debe conservar su propio `targetScore`.

Cambiar posteriormente el puntaje objetivo de la jornada no debe alterar ese partido.

PASO 6: PUNTAJE OBJETIVO

Implementa:

PATCH /api/sessions/:id/target-score

Debe recibir:

* `targetScore`.

REGLAS

* Debe ser un entero positivo.
* Actualiza `currentTargetScore`.
* No modifica `defaultTargetScore`.
* No modifica partidos activos.
* No modifica partidos finalizados.
* Se utiliza al iniciar el próximo partido.

La respuesta y la interfaz deben indicar claramente:

“Este cambio se aplicará al siguiente partido”.

Ejemplo histórico válido:

* Partido 1: objetivo 10.
* Partido 2: objetivo 10.
* Partido 3: objetivo 8.
* Partido 4: objetivo 7.

Los valores anteriores deben conservarse.

PASO 7: REGISTRO DE RESULTADO

Implementa:

POST /api/sessions/:id/matches/:matchId/result

Puede utilizar otra ruta REST coherente, pero debe actualizar exclusivamente el partido activo indicado.

Debe recibir:

* `teamAScore`.
* `teamBScore`.

VALIDACIONES

1. El partido debe existir.
2. Debe pertenecer a la jornada.
3. Debe estar `IN_PROGRESS`.
4. Debe ser el único partido activo.
5. No se permiten marcadores negativos.
6. No se permiten empates.
7. Al menos uno de los equipos debe alcanzar el `targetScore`.
8. El ganador debe ser el equipo con mayor marcador.
9. El ganador y perdedor se calculan en backend.
10. El frontend no envía de forma confiable el ganador.
11. El partido debe actualizarse a `FINISHED`.
12. Debe guardar `finishedAt`.
13. Debe ejecutarse dentro de una transacción.

Después de registrar el resultado:

* No crees automáticamente el siguiente partido.
* Reconstruye y retorna el próximo enfrentamiento.
* Permite cambiar el puntaje objetivo.
* El usuario debe iniciar explícitamente el siguiente partido.

Esto garantiza que el nuevo `targetScore` se guarde al comenzar cada partido.

PASO 8: HISTORIAL DE PARTIDOS

Implementa:

GET /api/sessions/:id/matches

Debe permitir:

* Orden ascendente o descendente.
* Paginación cuando sea necesaria.
* Filtrar por estado.
* Retornar datos de equipos.
* Retornar marcador.
* Retornar objetivo utilizado.
* Retornar ganador.
* Retornar fecha y hora.
* Identificar el último resultado que puede deshacerse.

El historial debe distinguir claramente:

* Partido activo.
* Partidos finalizados.
* Último resultado reversible.

No permitas editar libremente partidos históricos.

PASO 9: TABLA DE POSICIONES

Implementa:

GET /api/sessions/:id/standings

La tabla debe calcularse exclusivamente a partir de partidos `FINISHED`.

Por cada equipo retorna:

* Posición.
* Equipo.
* Partidos jugados.
* Partidos ganados.
* Partidos perdidos.
* Puntos globales.
* Puntos a favor.
* Puntos en contra.
* Diferencia de puntos.

REGLAS

* Cada partido ganado suma 1 punto global.
* Los partidos activos no cuentan.
* La tabla no debe almacenarse en una tabla duplicada.
* Debe derivarse del historial.

ORDENAMIENTO

Orden sugerido:

1. Puntos globales.
2. Diferencia de puntos.
3. Puntos a favor.
4. Nombre del equipo como criterio estable final.

No declares campeón en esta fase.

Si hay empate, conserva el empate estadístico y utiliza el criterio estable únicamente para visualización.

PASO 10: DESHACER ÚLTIMO RESULTADO

Implementa:

DELETE /api/sessions/:id/matches/latest

Debe permitir deshacer únicamente el último partido `FINISHED`.

REGLAS

1. No puede seleccionarse un partido intermedio.
2. Debe identificar el último resultado desde el backend.
3. Debe ejecutarse dentro de una transacción.
4. Si existe un partido `IN_PROGRESS` posterior:

   * elimínalo dentro de la misma transacción;
   * informa que el marcador local se perderá;
   * después elimina el último partido finalizado.
5. Reconstruye la rotación con el historial restante.
6. Reconstruye la tabla de posiciones.
7. Conserva el sorteo inicial.
8. Si ya no quedan partidos finalizados:

   * la jornada vuelve a `TEAMS_CREATED`;
   * queda disponible el enfrentamiento inicial.
9. No modifica participantes ni equipos.
10. Retorna:

* rotación reconstruida;
* historial;
* posiciones;
* próximo enfrentamiento.

No implementes eliminación individual de partidos intermedios.

PASO 11: CANCELACIÓN DE JORNADA

Implementa una acción de cancelación independiente de la eliminación.

ENDPOINT SUGERIDO

POST /api/sessions/:id/cancel

COMPORTAMIENTO

* Cambia el estado de la jornada a `CANCELLED`.
* Conserva la jornada en la base de datos.
* Conserva participantes, equipos y partidos.
* La jornada cancelada debe quedar en modo de solo lectura.
* No permite iniciar partidos ni registrar resultados.
* No aparece como jornada activa en el dashboard.
* Sí aparece en el historial con estado “Cancelada”.
* La cancelación debe ejecutarse dentro de una transacción.
* Debe ser idempotente cuando ya está cancelada.
* No debe convertir una jornada eliminada ni crear datos nuevos.

Agrega una confirmación clara en el frontend:

“Cancelar conservará la jornada y su historial, pero no permitirá continuar jugando”.

PASO 12: ELIMINACIÓN PERMANENTE DE JORNADA

Implementa eliminación física real.

ENDPOINT

DELETE /api/sessions/:id

IMPORTANTE

Esta operación NO debe ser soft delete.

No agregues:

* `deletedAt`;
* `isDeleted`;
* estado `DELETED`;
* filtros de soft delete.

La operación debe ejecutar un `DELETE` real en PostgreSQL.

COMPORTAMIENTO

1. La eliminación es irreversible.
2. Debe eliminar la jornada de `game_sessions`.
3. Debe eliminar todos los registros propiedad de la jornada:

   * partidos;
   * composición de equipos;
   * equipos;
   * participantes de la jornada;
   * cualquier dato dependiente exclusivo de esa jornada.
4. No debe eliminar:

   * jugadores permanentes;
   * canchas permanentes;
   * usuarios.
5. Debe ejecutarse dentro de una transacción.
6. Puede utilizar relaciones `ON DELETE CASCADE` bien definidas o eliminaciones explícitas en orden seguro.
7. Verifica después de eliminar que la jornada ya no exista.
8. Debe funcionar con jornadas:

   * en borrador;
   * con equipos creados;
   * en progreso;
   * canceladas.
9. No debe dejar registros huérfanos.
10. El dashboard y el historial deben actualizarse después del borrado.

Para evitar eliminaciones accidentales:

* La interfaz debe mostrar una advertencia destructiva.
* El usuario debe escribir el nombre de la cancha, la fecha o la palabra `ELIMINAR`.
* El botón permanece deshabilitado hasta que la confirmación sea válida.
* La API debe requerir confirmación explícita mediante un campo, query parameter o contrato equivalente.
* Si la confirmación no está presente, responde con error de validación.

Mensaje:

“Esta acción eliminará permanentemente la jornada, sus equipos, participantes y partidos. No se puede deshacer”.

Documenta claramente la diferencia:

* Cancelar: conserva la jornada.
* Eliminar: borra físicamente el agregado completo.

PASO 13: FRONTEND — SORTEO INICIAL

Implementa la vista correspondiente a:

Sorteo de Partido Inicial - Móvil

Ruta sugerida:

/sessions/[id]/draw

Debe mostrar:

* Equipos confirmados.
* Acción “Sortear partido inicial”.
* Equipo A contra Equipo B.
* Jugadores de ambos equipos.
* Equipos en espera.
* Orden inicial completo.
* Puntaje objetivo.
* Botón “Volver a sortear”.
* Botón “Iniciar partido”.
* Estados de carga.
* Confirmaciones.
* Manejo de errores.

REGLAS DE INTERFAZ

* “Volver a sortear” solo aparece antes del primer partido.
* “Iniciar partido” crea el partido activo.
* Si ya existe un sorteo, debe recuperarse del backend.
* No simules el sorteo únicamente en el navegador.
* El diseño debe ser mobile-first.
* Usa los componentes y la identidad visual existentes.

PASO 14: FRONTEND — CONTROL DE PARTIDO

Implementa la vista correspondiente a:

Control de Partido Activo - Móvil

Ruta sugerida:

/sessions/[id]/matches

Debe mostrar:

* Número del partido.
* Nombre de los dos equipos.
* Integrantes de cada equipo.
* Marcadores grandes.
* Botones grandes para sumar y restar.
* Puntaje objetivo del partido.
* Indicador “El ganador se queda”.
* Equipo que espera.
* Cola completa.
* Botón “Registrar resultado”.
* Acción para cambiar el puntaje del próximo partido.
* Historial reciente.
* Tabla compacta.
* Acción para deshacer el último resultado.

COMPORTAMIENTO DEL MARCADOR

* Mantén el marcador como estado local.
* No realices una petición por cada punto.
* Impide visualmente valores negativos.
* Solicita confirmación antes de registrar.
* El backend sigue siendo la autoridad.
* Después de registrar:

  * muestra el ganador;
  * muestra el siguiente enfrentamiento;
  * permite modificar el próximo objetivo;
  * muestra un botón “Iniciar siguiente partido”.

RECUPERACIÓN

* Si se recarga la página con un partido activo, recupera el partido desde la API.
* El marcador no confirmado puede reiniciarse a cero, salvo que se implemente almacenamiento local por `matchId`.
* No persistas marcadores provisionales como resultados oficiales.

PASO 15: FRONTEND — HISTORIAL Y POSICIONES

Implementa las vistas:

* Historial y Posiciones - Móvil.
* Historial de Partidos - Corregido.

Puede utilizarse una ruta con pestañas o secciones:

/sessions/[id]/matches/history

Debe mostrar:

HISTORIAL

* Número.
* Equipos.
* Marcador.
* Objetivo utilizado.
* Ganador.
* Hora.
* Estado activo o finalizado.
* Botón “Deshacer último resultado” solo donde corresponda.

POSICIONES

* Posición.
* Equipo.
* Partidos jugados.
* Ganados.
* Perdidos.
* Puntos globales.
* Puntos a favor.
* Puntos en contra.
* Diferencia.

En móvil:

* Prioriza equipo, victorias y puntos.
* Permite expandir para ver datos adicionales.
* Evita tablas horizontales inutilizables.

PASO 16: ACCIONES DE CANCELAR Y ELIMINAR

Actualiza el menú de acciones de la jornada.

Debe incluir:

* Cancelar jornada.
* Eliminar jornada permanentemente.

CANCELAR

* Usa un diálogo de confirmación.
* Explica que los datos se conservarán.
* Después de cancelar, redirige al detalle de solo lectura.

ELIMINAR

* Usa un diálogo destructivo separado.
* Exige confirmación escrita.
* Después de eliminar:

  * invalida queries;
  * elimina la jornada de listados;
  * redirige al historial o dashboard;
  * muestra un toast de éxito.

No utilices el mismo botón ni el mismo mensaje para cancelar y eliminar.

PASO 17: DASHBOARD E HISTORIAL

Actualiza los datos reales para que:

* Jornadas `TEAMS_CREATED` e `IN_PROGRESS` puedan aparecer como activas.
* Jornadas `CANCELLED` no aparezcan como activas.
* Jornadas eliminadas no aparezcan en ninguna respuesta.
* El botón “Continuar jornada” dirija al flujo correcto:

  * sorteo cuando aún no existe;
  * partido activo cuando existe;
  * próximo enfrentamiento cuando corresponde.
* El historial muestre jornadas canceladas con estado explícito.

No agregues estadísticas financieras.

PASO 18: PRUEBAS UNITARIAS

Agrega pruebas para:

SORTEO

* Dos equipos.
* Tres equipos.
* Cuatro equipos.
* Posiciones únicas.
* Repetición del sorteo antes del primer partido.
* Bloqueo del sorteo después del primer partido.
* Resultado reproducible con semilla.

ROTACIÓN

* Dos equipos juegan repetidamente.
* Tres equipos.
* Cuatro equipos.
* Ganador permanece.
* Perdedor pasa al final.
* Entra el primer equipo de la cola.
* Secuencia correcta después de varios resultados.
* Reconstrucción desde historial.
* Cola correcta con resultados alternados.

PARTIDOS

* Crear partido activo.
* Impedir dos partidos activos.
* Snapshot del `targetScore`.
* Rechazar empate.
* Rechazar puntajes negativos.
* Rechazar marcador sin alcanzar objetivo.
* Calcular ganador.
* Calcular perdedor.
* Finalizar partido.
* Bloquear modificación de partido finalizado.

PUNTAJE OBJETIVO

* Cambiar objetivo para el próximo partido.
* Conservar objetivo de partidos anteriores.
* No modificar partido activo.

POSICIONES

* Victoria suma un punto.
* Partidos activos no cuentan.
* Puntos a favor.
* Puntos en contra.
* Diferencia.
* Ordenamiento y empates.

DESHACER

* Deshacer último resultado.
* Rechazar intento de borrar partido intermedio.
* Eliminar partido activo posterior cuando corresponda.
* Reconstruir rotación.
* Reconstruir posiciones.
* Volver a `TEAMS_CREATED` cuando no quedan resultados.

CANCELAR

* Cambiar estado a `CANCELLED`.
* Conservar relaciones.
* Bloquear nuevas acciones.
* Excluir del dashboard activo.

ELIMINAR

* Eliminar físicamente jornada.
* Eliminar partidos.
* Eliminar equipos y composiciones.
* Eliminar participantes de jornada.
* Conservar jugadores permanentes.
* Conservar cancha permanente.
* No dejar registros huérfanos.
* Rechazar eliminación sin confirmación.

PASO 19: PRUEBAS DE INTEGRACIÓN CON POSTGRESQL

Agrega pruebas para:

1. Sortear una jornada con equipos confirmados.
2. Repetir el sorteo.
3. Iniciar el primer partido.
4. Registrar resultado.
5. Consultar siguiente enfrentamiento.
6. Cambiar puntaje objetivo.
7. Iniciar segundo partido con el nuevo objetivo.
8. Registrar varios partidos con tres equipos.
9. Registrar varios partidos con cuatro equipos.
10. Consultar historial.
11. Consultar posiciones.
12. Deshacer el último resultado.
13. Cancelar una jornada.
14. Verificar que la cancelación conserva los datos.
15. Eliminar permanentemente una jornada.
16. Verificar directamente en PostgreSQL que no queda el registro.
17. Verificar que no quedan dependencias de la jornada.
18. Verificar que jugadores y cancha siguen existiendo.
19. Rechazar operaciones sin JWT.
20. Rechazar acciones sobre jornadas canceladas.

No utilices SQLite como reemplazo principal.

PASO 20: PRUEBAS E2E

Implementa un flujo E2E desde una jornada con equipos confirmados:

1. Abrir la jornada.
2. Sortear equipos iniciales.
3. Volver a sortear.
4. Iniciar el primer partido.
5. Registrar un resultado.
6. Verificar que el ganador permanece.
7. Cambiar el puntaje objetivo.
8. Iniciar el siguiente partido.
9. Registrar varios resultados.
10. Consultar historial.
11. Consultar posiciones.
12. Deshacer el último resultado.
13. Verificar la rotación reconstruida.

Agrega escenarios separados para:

* Cancelar jornada.
* Eliminar permanentemente jornada con confirmación.
* Confirmar que la jornada eliminada desaparece del historial.

PASO 21: DOCUMENTACIÓN

Actualiza:

* README.md.
* docs/IMPLEMENTATION_PLAN.md.
* docs/API.md.
* docs/DATA_MODEL.md.
* docs/BUSINESS_RULES.md.
* docs/PRODUCT_SPEC.md cuando corresponda.

Documenta:

* Sorteo inicial.
* Rotación.
* Partido activo.
* Puntaje objetivo por partido.
* Registro de resultados.
* Tabla derivada.
* Deshacer último resultado.
* Cancelación.
* Eliminación permanente.
* Cascadas y transacciones.
* Endpoints.
* Migración.
* Pruebas.

Aclara expresamente:

* Cancelar conserva la información.
* Eliminar hace un `DELETE` físico e irreversible.

PASO 22: VALIDACIÓN FINAL

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
* Flujo manual con dos equipos.
* Flujo manual con tres equipos.
* Flujo manual con cuatro equipos.
* Cambio de objetivo.
* Deshacer resultado.
* Cancelación.
* Eliminación permanente.

Corrige todos los errores encontrados.

No afirmes que una validación pasó si no fue ejecutada.

PASO 23: COMMITS Y ENTREGA

Realiza commits locales pequeños y descriptivos cuando el entorno lo permita.

Ejemplos:

* feat(api): implement match rotation
* feat(api): add match result workflow
* feat(api): support session cancellation and hard deletion
* feat(web): add initial match draw
* feat(web): implement active match control
* feat(web): add match history and standings
* test: cover competition workflows
* docs: document competition rules

No hagas push.

No abras un pull request automáticamente.

LÍMITE DE LA TAREA

Al completar esta tarea:

1. Detén la implementación.
2. No implementes pagos.
3. No implementes liquidación.
4. No selecciones campeón.
5. No cierres financieramente la jornada.

Entrega un resumen con:

* Funcionalidades implementadas.
* Entidades y migraciones añadidas.
* Endpoints disponibles.
* Algoritmo de rotación utilizado.
* Reglas de cancelación.
* Comportamiento de eliminación permanente.
* Pruebas ejecutadas.
* Resultados de lint, typecheck, tests y build.
* Comandos para ejecutar localmente.
* Problemas pendientes reales.
* Propuesta concreta para continuar con pagos y liquidación.

No modifiques funcionalidades ajenas a este alcance salvo que encuentres un error estrictamente necesario para completar la competición y lo documentes.
