Trabaja directamente sobre el repositorio de VolleyFlow.

La especificación general se encuentra en:

docs/prompt-codex.md

El plan de implementación se encuentra en:

docs/IMPLEMENTATION_PLAN.md

Lee ambos documentos antes de modificar código y utiliza como referencia los diseños disponibles dentro de:

design/stitch/

OBJETIVO

Implementa exclusivamente:

FASE 5: LIQUIDACIÓN, PAGOS Y CIERRE DE JORNADA

Vistas disponibles:

* Estado de Pagos - Móvil.
* Resumen de Liquidación - Móvil.
* Cierre de Jornada - Corregido.

El alcance incluye:

* Selección del equipo campeón.
* Sugerencia automática de campeón según posiciones.
* Edición final de los costos de cancha y Gatorades.
* División exacta del valor de cancha.
* División exacta del valor de Gatorades entre jugadores perdedores.
* Exclusiones individuales de cobros.
* Vista previa de la liquidación.
* Confirmación y persistencia de la liquidación.
* Registro de pagos completos y parciales.
* Métodos de pago en efectivo y transferencia.
* Resumen de recaudo y saldos pendientes.
* Lista de deudores.
* Cierre definitivo de la jornada.
* Consulta del resumen final.

FUERA DE ALCANCE

No implementes:

* Nuevos algoritmos de equipos.
* Cambios en la rotación de partidos.
* Edición de resultados históricos.
* Rankings históricos globales.
* Estadísticas avanzadas por jugador.
* Pasarelas de pago.
* Transferencias bancarias automáticas.
* Notificaciones.
* Exportación PDF.
* Integraciones con WhatsApp.

No modifiques reglas de competición salvo que sea estrictamente necesario para calcular correctamente la liquidación.

PRINCIPIOS GENERALES

* Utiliza exclusivamente NestJS, TypeORM y PostgreSQL.
* No instales ni utilices Prisma.
* No utilices `synchronize: true`.
* Todos los valores monetarios se almacenan como enteros en pesos colombianos.
* No utilices `float`, `double precision` ni cálculos monetarios con decimales.
* La suma de los valores individuales debe ser exactamente igual al total correspondiente.
* Las operaciones críticas deben ejecutarse dentro de transacciones.
* El backend es la autoridad para todos los cálculos financieros.
* El frontend puede mostrar vistas previas, pero nunca debe calcular definitivamente los valores.
* Los estados de pago deben derivarse de `amountDue` y `amountPaid`.
* Una liquidación confirmada debe ser reproducible y auditable.

PASO 1: INSPECCIÓN TÉCNICA

Antes de implementar:

1. Lee completamente `docs/prompt-codex.md`.
2. Lee `docs/IMPLEMENTATION_PLAN.md`.
3. Inspecciona:

   * `GameSessionEntity`;
   * `SessionPlayerEntity`;
   * `TeamEntity`;
   * `TeamPlayerEntity`;
   * `MatchEntity`;
   * enums existentes;
   * migraciones;
   * servicios de jornadas;
   * endpoints de posiciones;
   * componentes y rutas actuales.
4. Identifica los diseños de Stitch correspondientes a esta tarea.
5. Ejecuta inicialmente:

   * lint;
   * typecheck;
   * pruebas;
   * build.
6. Documenta errores previos antes de corregirlos.
7. Reutiliza la arquitectura, componentes y cliente HTTP existentes.
8. No rediseñes módulos que no pertenecen a esta tarea.

PASO 2: MODELO DE DATOS

Completa el modelo de datos necesario para liquidación y pagos.

GAME SESSION

Verifica o agrega:

* `championTeam` nullable.
* `settledAt` nullable.
* `finishedAt` nullable.
* `courtPrice` entero.
* `gatoradePrice` entero.
* `status`.

Estados relevantes:

* IN_PROGRESS
* SETTLEMENT
* FINISHED
* CANCELLED

SESSION PLAYER

Verifica o agrega:

* `includedInCourtSplit` boolean.
* `includedInGatoradeSplit` boolean.
* `courtAmount` entero.
* `gatoradeAmount` entero.
* `amountDue` entero.
* `amountPaid` entero.
* `paymentMethod` nullable.
* `paidAt` nullable.
* `updatedAt`.

PAYMENT METHOD

Utiliza:

* CASH
* TRANSFER

No almacenes un estado de pago si puede calcularse de forma segura.

Estado derivado:

* PENDING: `amountPaid === 0` y `amountDue > 0`.
* PARTIAL: `amountPaid > 0` y `amountPaid < amountDue`.
* PAID: `amountPaid >= amountDue`.
* NOT_REQUIRED: `amountDue === 0`.

MIGRACIÓN

Crea una migración TypeORM real y reversible si el esquema necesita cambios.

La migración debe:

* Poder ejecutarse sobre el esquema actual.
* Mantener los datos existentes.
* Crear índices útiles.
* No utilizar `synchronize`.
* No borrar datos históricos.
* No introducir columnas de punto flotante.

PASO 3: DISTRIBUCIÓN EXACTA DE DINERO

Crea o consolida una función de dominio reutilizable:

`distributeIntegerAmount(total, participantIds)`

Debe recibir:

* Un total entero mayor o igual a cero.
* Una lista de identificadores únicos.

Debe retornar:

* Un valor entero para cada participante.
* Una suma exactamente igual al total.

REGLAS

1. Si el total es cero, todos reciben cero.
2. Si no existen participantes y el total es mayor que cero, lanza un error de dominio.
3. Los participantes no pueden estar duplicados.
4. El reparto base utiliza división entera.
5. El residuo se distribuye de forma determinística.
6. Ordena los identificadores o utiliza un orden estable documentado.
7. Nunca se pierden ni se crean pesos.
8. La función debe ser pura y fácilmente testeable.

Ejemplo:

* Total: $100.000.
* Participantes: 12.
* La suma de todos los valores debe ser exactamente $100.000.
* Algunos participantes podrán tener un peso más que otros por el residuo.

No uses redondeos con números flotantes.

PASO 4: REGLAS DE LIQUIDACIÓN

Una jornada puede entrar a liquidación cuando:

* No está cancelada.
* No está eliminada.
* Tiene equipos confirmados.
* No existe un partido activo.
* Existe al menos un equipo.
* Existen participantes.

Debe permitirse iniciar la liquidación aunque no se hayan registrado partidos, pero en ese caso la selección del campeón debe ser manual.

CAMPEÓN SUGERIDO

Calcula una sugerencia a partir de la tabla de posiciones.

Reglas:

1. Sugiere el equipo con más puntos globales.
2. Usa diferencia de puntos como segundo criterio.
3. Usa puntos a favor como tercer criterio.
4. Si el primer lugar sigue empatado en criterios deportivos, no selecciones automáticamente un campeón definitivo.
5. Informa que se requiere selección manual.
6. El organizador siempre puede seleccionar manualmente otro equipo antes de confirmar.
7. El campeón debe pertenecer a la jornada.
8. El campeón debe tener participantes asignados.

No declares campeón únicamente por orden alfabético.

El orden alfabético puede usarse para mostrar la tabla, pero no para resolver automáticamente un empate deportivo.

PASO 5: DIVISIÓN DE CANCHA

El valor de la cancha se divide entre todos los participantes con:

`includedInCourtSplit === true`

REGLAS

* El equipo campeón también paga cancha.
* El valor se divide entre participantes, no entre equipos.
* Los participantes excluidos reciben `courtAmount = 0`.
* Debe existir al menos un participante incluido cuando `courtPrice > 0`.
* La suma de `courtAmount` debe ser exactamente igual a `courtPrice`.
* El cálculo debe utilizar `distributeIntegerAmount`.

PASO 6: DIVISIÓN DE GATORADES

El valor de Gatorades se divide entre los jugadores que:

* No pertenecen al equipo campeón.
* Tienen `includedInGatoradeSplit === true`.

REGLAS

* Ningún integrante del equipo campeón paga Gatorades.
* Todos los demás equipos se consideran perdedores.
* La división es por jugador, no por equipo.
* Los participantes excluidos reciben `gatoradeAmount = 0`.
* Si `gatoradePrice` es cero, todos reciben cero.
* Si el valor es mayor que cero, debe existir al menos un jugador perdedor incluido.
* La suma de `gatoradeAmount` debe ser exactamente igual a `gatoradePrice`.
* El cálculo debe utilizar `distributeIntegerAmount`.

PASO 7: TOTAL INDIVIDUAL

Para cada participante:

`amountDue = courtAmount + gatoradeAmount`

Reglas:

* Nunca debe ser negativo.
* Debe almacenarse como entero.
* Debe conservarse como snapshot de la liquidación confirmada.
* La suma de todos los `amountDue` debe ser igual a:

  * `courtPrice + gatoradePrice`.
* Esta igualdad debe cumplirse incluso cuando existan residuos.
* Los montos pagados previamente deben conservarse al recalcular una liquidación antes del cierre.

Si una nueva liquidación produce un valor menor que lo ya pagado:

* No pierdas el pago.
* Considera al participante como PAID.
* Retorna un campo derivado `creditAmount = max(amountPaid - amountDue, 0)`.
* No crees saldos negativos.

PASO 8: VISTA PREVIA DE LIQUIDACIÓN

Implementa un endpoint de vista previa que no persista cambios definitivos.

Ruta sugerida:

POST /api/sessions/:id/settlement/preview

Debe recibir:

* `championTeamId`.
* `courtPrice`.
* `gatoradePrice`.
* Lista opcional de participantes incluidos o excluidos de cancha.
* Lista opcional de participantes incluidos o excluidos de Gatorades.

Debe retornar:

* Equipo campeón.
* Motivo o información de la sugerencia.
* Total de cancha.
* Total de Gatorades.
* Cantidad de participantes que pagan cancha.
* Cantidad de participantes que pagan Gatorades.
* Distribución individual.
* Totales.
* Suma de validación.
* Advertencias.
* Jugadores con crédito potencial.
* Estado previo de pagos cuando exista.

La vista previa:

* No cambia el estado de la jornada.
* No modifica montos almacenados.
* No modifica pagos existentes.
* Debe utilizar exactamente el mismo servicio de dominio que la confirmación.

PASO 9: CONFIRMACIÓN DE LIQUIDACIÓN

Implementa:

POST /api/sessions/:id/settlement

Debe recibir el mismo contrato validado de la vista previa.

La operación debe ejecutarse dentro de una transacción.

Debe:

1. Bloquear la jornada o utilizar una estrategia que evite cálculos concurrentes inconsistentes.
2. Validar nuevamente todos los datos.
3. Validar que el campeón pertenezca a la jornada.
4. Actualizar `courtPrice`.
5. Actualizar `gatoradePrice`.
6. Guardar `championTeam`.
7. Actualizar inclusiones individuales.
8. Calcular `courtAmount`.
9. Calcular `gatoradeAmount`.
10. Calcular `amountDue`.
11. Conservar `amountPaid`.
12. Ajustar `paidAt` únicamente cuando corresponda.
13. Guardar `settledAt`.
14. Cambiar la jornada a `SETTLEMENT`.
15. Retornar el resumen completo.

RECALCULAR

Mientras la jornada esté en `SETTLEMENT` y no esté finalizada:

* Permite generar una nueva vista previa.
* Permite confirmar un nuevo cálculo.
* Solicita confirmación clara.
* Conserva pagos registrados.
* Informa créditos o diferencias.
* No permite una distribución cuya suma sea incorrecta.

Una jornada `FINISHED` no puede recalcular costos ni cambiar campeón.

PASO 10: CONSULTA DE PAGOS

Implementa:

GET /api/sessions/:id/payments

Debe retornar:

* Información de la jornada.
* Campeón.
* Totales.
* Total esperado.
* Total pagado.
* Total pendiente.
* Total de créditos.
* Conteo de pagos:

  * pendientes;
  * parciales;
  * completos;
  * no requeridos.
* Lista de participantes.

Por participante:

* id.
* nombre snapshot.
* equipo.
* si pertenece al campeón.
* `includedInCourtSplit`.
* `includedInGatoradeSplit`.
* `courtAmount`.
* `gatoradeAmount`.
* `amountDue`.
* `amountPaid`.
* `pendingAmount`.
* `creditAmount`.
* estado derivado.
* método de pago.
* fecha de pago.

Cálculos derivados:

* `pendingAmount = max(amountDue - amountPaid, 0)`.
* `creditAmount = max(amountPaid - amountDue, 0)`.

PASO 11: REGISTRO DE PAGOS

Implementa:

PATCH /api/sessions/:id/payments/:sessionPlayerId

Debe permitir registrar:

* `amountPaid`.
* `paymentMethod`.

REGLAS

1. `amountPaid` debe ser un entero mayor o igual a cero.
2. No se permiten montos decimales.
3. Si `amountPaid > 0`, `paymentMethod` es obligatorio.
4. Si `amountPaid === 0`, el método puede limpiarse.
5. Si `amountPaid > 0`, guarda o actualiza `paidAt`.
6. Si el pago vuelve a cero, `paidAt` debe quedar en null.
7. Permite pagos parciales.
8. Permite corregir un pago.
9. Permite un pago superior a `amountDue`, mostrando crédito.
10. No modifica `amountDue`.
11. El participante debe pertenecer a la jornada.
12. La jornada debe estar en `SETTLEMENT` o `FINISHED`.
13. La operación debe ser transaccional cuando se actualicen varios campos.

No permitas registrar pagos antes de confirmar la liquidación.

AGREGA OPCIONALMENTE

POST /api/sessions/:id/payments/:sessionPlayerId/mark-paid

Debe asignar:

* `amountPaid = amountDue`.
* Método seleccionado.

Solo impleméntalo si mejora claramente la experiencia.

PASO 12: PAGOS DESPUÉS DEL CIERRE

Una jornada finalizada debe conservar todos los valores financieros.

Después del cierre:

* No se puede cambiar campeón.
* No se pueden cambiar costos.
* No se puede recalcular la liquidación.
* No se pueden modificar inclusiones de cobro.
* Sí se pueden registrar o corregir pagos.
* Los saldos pendientes deben continuar visibles.
* El resumen financiero debe actualizarse con cada pago.

Esto permite cerrar una jornada aunque todavía existan deudores.

PASO 13: CIERRE DE JORNADA

Implementa:

POST /api/sessions/:id/finish

REGLAS

1. La jornada debe estar en estado `SETTLEMENT`.
2. Debe tener campeón.
3. Debe tener liquidación confirmada.
4. No debe existir partido activo.
5. Los montos individuales deben sumar exactamente los costos.
6. Puede haber pagos pendientes.
7. Si existen pendientes, solicita una confirmación explícita.
8. Cambia el estado a `FINISHED`.
9. Guarda `finishedAt`.
10. Mantiene `settledAt`.
11. Bloquea cambios de campeón y costos.
12. No bloquea el registro posterior de pagos.
13. Se ejecuta dentro de una transacción.
14. Debe ser idempotente si ya está finalizada.

Contrato sugerido:

```json
{
  "confirmPendingPayments": true
}
```

Si existen saldos pendientes y no se envía confirmación, retorna un error de negocio claro.

PASO 14: RESUMEN FINAL

Implementa:

GET /api/sessions/:id/summary

Debe retornar:

* Estado.
* Fecha.
* Cancha.
* Equipo campeón.
* Integrantes del campeón.
* Tabla final de posiciones.
* Cantidad de partidos.
* Historial resumido de resultados.
* Valor de cancha.
* Valor de Gatorades.
* Total esperado.
* Total recaudado.
* Total pendiente.
* Total de créditos.
* Jugadores pagados.
* Jugadores con pago parcial.
* Jugadores pendientes.
* Métodos de pago utilizados.
* Distribución individual.
* `settledAt`.
* `finishedAt`.

El resumen debe funcionar para jornadas en:

* SETTLEMENT.
* FINISHED.

Para jornadas todavía no liquidadas, retorna un error de negocio o un estado explícito coherente.

PASO 15: FRONTEND — RESUMEN DE LIQUIDACIÓN

Implementa la vista correspondiente a:

Resumen de Liquidación - Móvil

Ruta sugerida:

/sessions/[id]/settlement

Debe incluir:

* Tabla de posiciones.
* Equipo sugerido como campeón.
* Advertencia de empate cuando corresponda.
* Selector manual de campeón.
* Valor de cancha editable.
* Valor de Gatorades editable.
* Integrantes del campeón.
* Jugadores que pagan cancha.
* Jugadores que pagan Gatorades.
* Inclusión o exclusión individual.
* Vista previa de valores.
* Total por jugador.
* Validación de sumas.
* Advertencias.
* Botón “Calcular vista previa”.
* Botón “Confirmar liquidación”.

COMPORTAMIENTO

* Consume la API real.
* No hace el cálculo definitivo únicamente en frontend.
* Usa React Hook Form.
* Usa Zod.
* Usa TanStack Query.
* Solicita confirmación antes de reemplazar una liquidación.
* Muestra claramente que el campeón no paga Gatorades.
* Muestra formatos monetarios en pesos colombianos.
* Permite identificar quién recibe el peso adicional de los residuos.
* Mantiene una experiencia mobile-first.

PASO 16: FRONTEND — ESTADO DE PAGOS

Implementa la vista:

Estado de Pagos - Móvil

Ruta:

/sessions/[id]/payments

Debe mostrar:

* Total por recaudar.
* Total recaudado.
* Total pendiente.
* Total de créditos.
* Cantidad de pagos completos.
* Cantidad de pagos parciales.
* Cantidad de pendientes.
* Filtros por estado.
* Buscador por jugador.
* Tarjetas móviles.
* Vista optimizada para escritorio.

Por jugador:

* Nombre.
* Equipo.
* Indicador de campeón.
* Valor de cancha.
* Valor de Gatorades.
* Total a pagar.
* Total pagado.
* Pendiente.
* Crédito.
* Estado.
* Método.
* Acción “Registrar pago” o “Editar pago”.

FORMULARIO DE PAGO

Debe permitir:

* Ingresar valor pagado.
* Seleccionar efectivo o transferencia.
* Marcar pago completo.
* Registrar pago parcial.
* Corregir pago.
* Dejar pago en cero.
* Mostrar el valor pendiente antes de guardar.
* Advertir cuando exista sobrepago.

Usa:

* React Hook Form.
* Zod.
* TanStack Query.
* Invalidación de queries.
* Toasts.
* Confirmaciones cuando sea necesario.

PASO 17: FRONTEND — CIERRE DE JORNADA

Implementa la vista:

Cierre de Jornada - Corregido

Ruta sugerida:

/sessions/[id]/summary

Debe mostrar:

* Equipo campeón.
* Integrantes.
* Tabla final.
* Resultados.
* Total de cancha.
* Total de Gatorades.
* Total recaudado.
* Saldo pendiente.
* Lista de deudores.
* Pagos parciales.
* Métodos de pago.
* Fecha de liquidación.
* Fecha de cierre.

Antes de finalizar:

* Muestra un botón “Finalizar jornada”.
* Si existen deudores, muestra una advertencia.
* Exige confirmación explícita.
* Explica que los pagos podrán seguir registrándose.
* Explica que no será posible recalcular costos ni cambiar campeón.

Después de finalizar:

* Muestra estado “Finalizada”.
* Oculta acciones de recalcular.
* Mantiene acceso a pagos.
* Mantiene la lista de deudores.
* Permite volver al historial o dashboard.

PASO 18: NAVEGACIÓN DE LA JORNADA

Actualiza únicamente la navegación relacionada con liquidación:

* “Pagos” dirige a `/sessions/[id]/payments`.
* “Liquidación” dirige a `/sessions/[id]/settlement`.
* “Resumen” dirige a `/sessions/[id]/summary`.

Acciones según estado:

IN_PROGRESS:

* Puede entrar a liquidación solo cuando no exista partido activo.

SETTLEMENT:

* Puede consultar y recalcular liquidación.
* Puede registrar pagos.
* Puede finalizar.

FINISHED:

* Puede consultar resumen.
* Puede registrar pagos.
* No puede recalcular.

CANCELLED:

* No puede liquidar.
* No puede registrar pagos.
* Permanece en solo lectura.

PASO 19: INDICADORES FINANCIEROS

Actualiza los indicadores existentes que dependan directamente de esta tarea:

* Pagos pendientes.
* Total por recaudar cuando corresponda.
* Jornadas con saldos pendientes.

No inventes nuevas estadísticas.

Las jornadas finalizadas con deudas deben seguir contando como pagos pendientes.

Las jornadas eliminadas o canceladas no deben contarse como deuda activa, salvo que la regla existente indique explícitamente lo contrario.

PASO 20: PRUEBAS UNITARIAS

Agrega pruebas para:

DISTRIBUCIÓN DE DINERO

* Total cero.
* Un participante.
* División exacta.
* División con residuo.
* $100.000 entre 12 participantes.
* $37.000 entre 8 participantes.
* Más pesos que participantes.
* Menos pesos que participantes.
* Lista vacía con total cero.
* Lista vacía con total mayor que cero.
* Identificadores duplicados.
* Resultado determinístico.
* Suma exacta.

CAMPEÓN

* Sugerir líder único.
* Resolver por diferencia de puntos.
* Resolver por puntos a favor.
* Detectar empate deportivo.
* Selección manual.
* Rechazar equipo externo.
* Rechazar equipo vacío.

CANCHA

* Incluir todos los participantes.
* Excluir un participante.
* Campeón paga cancha.
* Suma exacta.
* Rechazar total positivo sin participantes incluidos.

GATORADES

* Campeón no paga.
* Todos los equipos perdedores pagan.
* Excluir jugador perdedor.
* Valor cero.
* Suma exacta.
* Rechazar total positivo sin perdedores incluidos.

LIQUIDACIÓN

* Calcular `amountDue`.
* Conservar `amountPaid`.
* Detectar crédito.
* Confirmar liquidación.
* Recalcular antes del cierre.
* Bloquear recálculo después del cierre.
* Cambiar estado a `SETTLEMENT`.

PAGOS

* Registrar pago completo.
* Registrar pago parcial.
* Registrar sobrepago.
* Corregir pago.
* Limpiar pago.
* Exigir método cuando el pago es mayor que cero.
* Calcular estado derivado.
* Calcular pendiente.
* Calcular crédito.
* Permitir pago después del cierre.
* Rechazar pago antes de liquidación.

CIERRE

* Finalizar sin pendientes.
* Requerir confirmación con pendientes.
* Finalizar con pendientes confirmados.
* Bloquear cambios financieros después del cierre.
* Mantener pagos habilitados.
* Idempotencia.

PASO 21: PRUEBAS DE INTEGRACIÓN CON POSTGRESQL

Agrega pruebas para:

1. Consultar vista previa de liquidación.
2. Seleccionar campeón.
3. Dividir cancha exactamente.
4. Dividir Gatorades exactamente.
5. Excluir participantes.
6. Confirmar liquidación.
7. Verificar datos persistidos.
8. Registrar pago completo.
9. Registrar pago parcial.
10. Registrar sobrepago.
11. Corregir pago.
12. Consultar resumen de pagos.
13. Recalcular conservando pagos.
14. Finalizar sin pendientes.
15. Finalizar con pendientes y confirmación.
16. Rechazar cierre sin confirmación.
17. Registrar pago después del cierre.
18. Bloquear recálculo después del cierre.
19. Consultar resumen final.
20. Rechazar operaciones sin JWT.
21. Rechazar liquidación de jornada cancelada.
22. Verificar sumas directamente en PostgreSQL.

No utilices SQLite como sustituto principal.

PASO 22: PRUEBAS DEL FRONTEND

Agrega pruebas para:

* Mostrar campeón sugerido.
* Mostrar empate.
* Seleccionar campeón manual.
* Editar costos.
* Excluir participante.
* Generar vista previa.
* Mostrar distribución exacta.
* Confirmar liquidación.
* Mostrar lista de pagos.
* Filtrar por estado.
* Registrar pago completo.
* Registrar pago parcial.
* Mostrar sobrepago.
* Mostrar deudores.
* Mostrar advertencia de cierre.
* Finalizar con pendientes.
* Bloquear recálculo después de finalizar.
* Mantener edición de pagos.
* Manejar errores de API.
* Estados de carga.
* Estados vacíos.

PASO 23: PRUEBA E2E

Implementa un flujo E2E desde una jornada lista para liquidar:

1. Abrir la jornada.
2. Entrar al resumen de liquidación.
3. Revisar el campeón sugerido.
4. Seleccionar campeón.
5. Editar costos.
6. Excluir un participante de un cobro.
7. Generar vista previa.
8. Verificar que las sumas coincidan.
9. Confirmar liquidación.
10. Abrir estado de pagos.
11. Registrar un pago completo.
12. Registrar un pago parcial.
13. Consultar saldo pendiente.
14. Abrir cierre de jornada.
15. Finalizar con pagos pendientes.
16. Verificar estado finalizado.
17. Registrar posteriormente el pago restante.
18. Verificar que el saldo pendiente se actualice a cero.

PASO 24: DOCUMENTACIÓN

Actualiza:

* README.md.
* docs/IMPLEMENTATION_PLAN.md.
* docs/API.md.
* docs/DATA_MODEL.md.
* docs/BUSINESS_RULES.md.
* docs/PRODUCT_SPEC.md cuando corresponda.

Documenta:

* Selección de campeón.
* Manejo de empates.
* División exacta de dinero.
* Distribución de residuos.
* Exclusiones individuales.
* Vista previa.
* Confirmación.
* Recalculo.
* Pagos parciales.
* Sobrepagos.
* Créditos.
* Cierre con deudores.
* Pagos después del cierre.
* Endpoints.
* Migración.
* Pruebas.

PASO 25: VALIDACIÓN FINAL

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
* Vista previa de liquidación.
* Confirmación de liquidación.
* Pago completo.
* Pago parcial.
* Sobrepago.
* Cierre con pendientes.
* Pago posterior al cierre.
* Comprobación de sumas exactas.

Corrige todos los errores encontrados.

No afirmes que una validación pasó si no fue ejecutada.

PASO 26: COMMITS Y ENTREGA

Realiza commits locales pequeños y descriptivos cuando el entorno lo permita.

Ejemplos:

* feat(api): implement settlement calculations
* feat(api): add player payment management
* feat(api): support session financial closure
* feat(web): add settlement workflow
* feat(web): implement payment status interface
* feat(web): add final session summary
* test: cover settlement and payment workflows
* docs: document financial settlement

No hagas push.

No abras un pull request automáticamente.

LÍMITE DE LA TAREA

Al completar esta tarea:

1. Detén la implementación.
2. No agregues estadísticas históricas avanzadas.
3. No agregues rankings globales.
4. No agregues notificaciones.
5. No agregues pasarelas de pago.
6. No agregues exportaciones ni integraciones externas.

Entrega un resumen con:

* Funcionalidades implementadas.
* Entidades y migraciones añadidas.
* Endpoints disponibles.
* Reglas de división utilizadas.
* Manejo de residuos.
* Reglas de pagos.
* Reglas de cierre.
* Pruebas ejecutadas.
* Resultados de lint, typecheck, tests y build.
* Comandos para ejecutar localmente.
* Problemas pendientes reales.

No modifiques funcionalidades ajenas a este alcance salvo que sea estrictamente necesario para completar correctamente la liquidación, los pagos y el cierre, y documenta cualquier cambio excepcional.

Donde haya confirmación o uso de modal, implementalo y que sea con los estilos que ya venimos manejando.