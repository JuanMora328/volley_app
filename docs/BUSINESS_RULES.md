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
