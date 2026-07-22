# VolleyFlow — Plan de implementación

## Verificación inicial

- La especificación exige TypeORM de forma exclusiva y prohíbe Prisma.
- No se encontraron referencias operativas a Prisma en el repositorio base.
- Los diseños de `design/stitch` son exportaciones HTML estáticas de Tailwind CDN, Material Symbols e Inter; se usan como referencia visual, no como arquitectura.

## Etapas

1. **Monorepo y contratos**: pnpm workspaces, scripts raíz, paquete `@volleyflow/shared` con enums, contratos, dinero y algoritmos de dominio.
2. **API NestJS**: configuración, TypeORM, entidades, migración inicial, auth JWT, CRUD de jugadores/canchas y endpoints de jornadas.
3. **Dominio**: generación balanceada de equipos, rotación reconstruible, resultados, standings, pagos y liquidación.
4. **Web Next.js**: App Router, layout mobile-first, autenticación, vistas requeridas y cliente API con TanStack Query.
5. **Documentación y validación**: API, diseño, Docker Compose, variables de entorno, lint, typecheck, tests y build.

## Criterios de finalización

- Scripts raíz disponibles y ejecutables.
- Persistencia configurada únicamente con TypeORM.
- Endpoints mínimos documentados bajo `/api`.
- Vistas mínimas navegables en español.
- Pruebas unitarias para dinero, equipos y rotación.
