# Reglas de negocio

## Fase 3

1. Una jornada nace `DRAFT`; fecha, snapshot de cancha, precios enteros no negativos, al menos dos equipos y puntaje positivo son obligatorios.
2. Seleccionar cancha copia su nombre y valores; los precios se pueden ajustar sin modificar la cancha. Los snapshots nunca siguen ediciones posteriores.
3. Solo jugadores activos se agregan y cada jugador aparece una vez. El nivel 1–5 puede variar en la jornada sin modificar `defaultLevel`.
4. Cambiar participantes o nivel invalida equipos no confirmados. Tras confirmar, información, participantes y composición quedan bloqueados.
5. Todos los participantes deben asignarse exactamente una vez, ningún equipo queda vacío y la diferencia de tamaños es como máximo uno.
6. Generación y reemplazo manual, así como confirmación, son transaccionales. Confirmar cambia el estado a `TEAMS_CREATED`; no crea rotación ni partidos.

## Balance

Se generan al menos 300 candidatos. Se mezclan empates de nivel, se asignan jugadores por fuerza promedio respetando capacidades válidas y se aplican intercambios locales. Se deduplican composiciones, se ordenan por una puntuación ponderada y se elige con variedad dentro del grupo óptimo. Una semilla hace reproducible el resultado.

Las métricas incluyen tamaño, suma y promedio por equipo; globalmente diferencia máxima de promedios, diferencia de tamaños, varianza, diferencia de fuerza normalizada, puntuación y categoría (`EXCELENTE`, `BUENO`, `MEJORABLE`).

## Competición

El sorteo es reemplazable hasta iniciar el primer partido. El ganador permanece, el perdedor va al final de la cola y entra el primero; con dos equipos ambos vuelven a jugar. Un resultado no admite empate y uno de los marcadores debe alcanzar el objetivo capturado al iniciar. Solo se revierte el último resultado y cualquier partido activo posterior. Cancelar conserva toda la información y bloquea el juego; eliminar exige `ELIMINAR` y ejecuta un DELETE físico irreversible del agregado, sin borrar jugadores, canchas ni usuarios permanentes.

# Liquidación

- El líder se sugiere por puntos, diferencia y puntos a favor; un empate deportivo exige selección manual.
- Cancha se reparte entre participantes incluidos. Gatorades se reparte solo entre perdedores incluidos.
- El residuo se asigna determinísticamente por identificador ordenado, por lo que la suma conserva cada peso.
- La confirmación conserva pagos previos; un pago superior al nuevo valor produce crédito, nunca deuda negativa.
- Una jornada puede cerrarse con deuda mediante confirmación explícita. Después del cierre no se recalcula, pero los pagos siguen editables.
- `courtHourlyPrice` es una tarifa por una hora, `courtDurationMinutes` usa intervalos de 30 minutos y `courtPrice` es el total entero recalculado (`tarifa × minutos / 60`).
- `gatoradePrice` es el precio unitario. `gatoradeWinnerCount` es la cantidad de jugadores campeones y `gatoradeTotal` es su producto entero. Los campeones reciben una unidad, pero nunca pagan Gatorade.
- La validación financiera compara la suma distribuida con `courtPrice + gatoradeTotal`, no con el precio unitario.
- Los estados de pago, pendientes y créditos se derivan. Pagos parciales, sobrepagos, correcciones y reinicios a cero se admiten aun después de finalizar.

## Historial y ajustes

Los estados `NOT_REQUIRED`, `PENDING`, `PARTIAL`, `PAID` y `CREDIT` se derivan de montos persistidos. Estadísticas y campeonatos conservan snapshots. Los ajustes solo afectan jornadas nuevas y solo ADMIN los modifica.

El rendimiento histórico de un jugador cuenta únicamente partidos con estado `FINISHED` pertenecientes a jornadas en `SETTLEMENT` o `FINISHED`. Los partidos residuales de borradores y jornadas canceladas no afectan partidos jugados, victorias, derrotas ni puntos.
