# Reglas de negocio

- Jugadores y canchas se conservan: desactivar cambia `active`, nunca se expone `DELETE`.
- Nombres se limpian con `trim` y no pueden estar vacíos.
- El nivel predeterminado de un jugador es un entero entre 1 y 5.
- Notas y dirección son opcionales; texto vacío se persiste como `null`.
- Dinero se guarda como entero en pesos colombianos; no se aceptan negativos ni decimales.
- Listados activos son el valor predeterminado y pueden cambiar a inactivos o todos.
- `activePlayers` del dashboard cuenta únicamente registros activos.
