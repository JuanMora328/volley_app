# PWA de VolleyFlow

## Arquitectura

La PWA usa las primitivas del App Router y un service worker propio, pequeño y auditable. `app/manifest.ts` genera `/manifest.webmanifest`; `app/layout.tsx` declara metadata, iconos, Apple Web App y un viewport con `viewport-fit=cover`; `app/pwa-icons/[icon]/route.tsx` genera los PNG con `ImageResponse`; `public/sw.js` contiene todas las reglas de red y caché. `PwaManager` registra el worker en producción (o si `NEXT_PUBLIC_ENABLE_PWA=true`), comprueba conectividad contra el origen y administra actualizaciones.

Los iconos se generan desde código fuente textual para que el repositorio y la creación de la PR no dependan de archivos binarios. Las rutas mantienen respuestas PNG locales, dimensiones exactas y cabeceras inmutables; las variantes `maskable` reservan el 20 % exterior como zona segura.

No se usa Workbox ni se precachean rutas de negocio. El scope es `/` y el worker no intercepta orígenes externos.

## Estrategias de caché

| Recurso                                                                          | Estrategia                                              | Persistencia                                             |
| -------------------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------- |
| `/_next/static/*`, CSS/JS generados, fuentes, iconos e imágenes públicas propias | CacheFirst, solo respuestas `200` same-origin           | Caché versionada, máximo 80 entradas                     |
| `/offline` e iconos mínimos                                                      | Precache durante instalación                            | Caché pública versionada                                 |
| Navegaciones                                                                     | NetworkOnly con fallback a `/offline` ante fallo de red | La respuesta de la navegación no se guarda               |
| API, Swagger, health checks y recursos externos                                  | NetworkOnly (el worker no responde)                     | Nunca                                                    |
| POST, PUT, PATCH y DELETE same-origin                                            | NetworkOnly; respuesta `503` clara si falla la red      | Nunca; sin cola, Background Sync ni reintento automático |

### Datos privados

VolleyFlow adopta deliberadamente `NetworkOnly` para **todos** los GET de API autenticados. Por tanto, `/auth/me`, autenticación, jugadores, canchas, jornadas, participantes, equipos, sorteos, partidos, resultados, liquidación, pagos, resúmenes financieros, perfiles y ajustes nunca entran en Cache Storage. Esto es más restrictivo que `NetworkFirst`, evita mezclar datos entre usuarios y evita persistir JWT, encabezados `Authorization`, respuestas 401/403/500 o información financiera.

La infraestructura conserva el prefijo reservado `volleyflow-private-` para poder eliminar cualquier caché privada futura. Al cerrar sesión se limpia TanStack Query, todo `sessionStorage` (incluido el JWT), cualquier caché con ese prefijo y se avisa al worker. Antes de guardar una sesión recién autenticada se ejecuta la misma limpieza, evitando reutilizar datos del usuario anterior. Las cachés públicas versionadas de assets e iconos permanecen.

## Sin conexión

La pantalla `/offline` explica que las mutaciones requieren internet, que no se guardará una operación para después y que algunos assets visitados pueden seguir disponibles. La capa `api()` rechaza de inmediato una mutación cuando el navegador informa una desconexión; un fallo real de `fetch` sigue siendo la autoridad final. `PwaManager` combina eventos de `navigator.onLine` con una petición periódica real al manifest del mismo origen, muestra “Sin conexión” y confirma “Conexión recuperada”.

El producto no ofrece un modo offline de negocio. Un formulario abierto permanece en el DOM cuando se pierde la red, pero su envío no se presenta como exitoso ni se reenvía automáticamente.

## Actualizaciones

El worker nuevo se instala y queda en `waiting`. La interfaz muestra un aviso no intrusivo con “Actualizar” y explica la recarga. Si el foco está en un control de formulario pide confirmación. Solo después envía `SKIP_WAITING`; `controllerchange` recarga una vez mediante un guard en memoria. En `activate`, el worker reclama clientes y elimina versiones públicas obsoletas sin bloquear indefinidamente la anterior.

Para publicar una nueva versión, cambie `VERSION` en `public/sw.js`. No cambie el nombre de los prefijos sin actualizar también `lib/pwa.ts`.

## Instalación

### Chrome de escritorio y Android

1. Publique una build de producción sobre HTTPS (localhost también es un contexto seguro).
2. Abra VolleyFlow y espere a que el service worker quede activo.
3. Use el icono de instalación de Chrome o **Menú → Instalar aplicación / Agregar a pantalla principal**.
4. Confirme que abre sin la interfaz del navegador (`display: standalone`).

### Safari en iPhone

1. Abra la URL HTTPS en Safari.
2. Pulse **Compartir → Agregar a pantalla de inicio**.
3. Confirme el nombre VolleyFlow y abra el icono creado.

Safari no expone `beforeinstallprompt`; VolleyFlow no fuerza un banner alternativo. Las safe areas, la barra inferior y las alturas `dvh` están preparadas para pantalla completa y dispositivos con notch.

## Pruebas y validación manual

Ejecute:

```bash
pnpm --filter @volleyflow/web lint
pnpm --filter @volleyflow/web typecheck
pnpm --filter @volleyflow/web test
pnpm --filter @volleyflow/web build
```

Para una auditoría manual, inicie `pnpm --filter @volleyflow/web start`, abra DevTools → Application y verifique manifest, dimensiones/purpose de iconos, worker activo y scope `/`. Cargue la app, active Offline, navegue a una URL no visitada y confirme el fallback. Confirme que una mutación falla sin red; restaure la red y compruebe el aviso. Cierre sesión y compruebe que no quedan JWT, `sessionStorage` ni cachés `volleyflow-private-*`. Para ensayar una actualización, cambie `VERSION`, reconstruya y confirme el aviso, la activación y una sola recarga.

Lighthouse debe ejecutarse contra esa build servida en producción, no contra `next dev`. Revise PWA/instalabilidad (cuando la versión de Lighthouse lo incluya), rendimiento, accesibilidad y buenas prácticas, además de confirmar manualmente el criterio de instalación del navegador.

## Problemas conocidos

- No existe lectura offline de datos de negocio por decisión de seguridad.
- La disponibilidad del origen no garantiza que una API desplegada en otro origen esté disponible; el envío real continúa siendo la comprobación definitiva.
- La instalación en iOS es siempre manual desde el menú Compartir.
- La automatización E2E con navegador y Lighthouse requiere un navegador Chromium disponible y una build de producción servida; las pruebas unitarias validan el contrato estático del manifest, iconos y políticas del worker sin servicios externos.
