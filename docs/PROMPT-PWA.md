Actúa como desarrollador frontend senior especializado en Next.js, seguridad web y Progressive Web Apps.

Trabaja directamente sobre el repositorio de VolleyFlow.

OBJETIVO

Realiza exclusivamente la preparación de VolleyFlow como PWA instalable, segura y funcional en condiciones de conectividad limitada.

No agregues funcionalidades de negocio.

No modifiques reglas, endpoints, modelos, flujos de jornadas, partidos, pagos, autenticación ni liquidación, salvo los cambios mínimos necesarios para integrar correctamente la PWA.

REQUERIMIENTOS

1. METADATA Y MANIFEST

Configura correctamente la metadata de Next.js.

Crea o completa:

* `app/manifest.ts`.
* Metadata global.
* `themeColor`.
* Nombre y nombre corto.
* Descripción.
* `start_url`.
* `display: standalone`.
* Orientación apropiada.
* Colores de fondo y tema.
* Categorías.
* Iconos.
* Apple Web App metadata.

El manifest debe funcionar correctamente con el App Router.

2. ICONOS

Crea e integra los iconos necesarios:

* 192x192.
* 512x512.
* 192x192 maskable.
* 512x512 maskable.
* Apple Touch Icon.
* Favicon cuando sea necesario.

Mantén la identidad visual actual de VolleyFlow.

Verifica que los iconos tengan:

* Tamaño correcto.
* Formato compatible.
* Fondo y zona segura adecuados.
* Propósito `any`.
* Propósito `maskable`.

No utilices imágenes remotas como iconos del manifest.

3. SERVICE WORKER

Añade un service worker pequeño, explícito y fácil de auditar.

Evita una estrategia agresiva de caché.

El service worker debe:

* Instalarse correctamente.
* Activarse sin bloquear versiones anteriores indefinidamente.
* Eliminar cachés obsoletas.
* Gestionar cambios de versión.
* Permitir mostrar un aviso cuando haya una actualización disponible.
* Evitar almacenar información privada innecesaria.

No caches indiscriminadamente todas las peticiones.

No implementes un modo offline completo para operaciones de negocio.

4. POLÍTICAS DE CACHÉ

ASSETS ESTÁTICOS

Usa una estrategia apropiada para:

* JavaScript generado.
* CSS.
* Fuentes locales.
* Iconos.
* Imágenes estáticas propias.
* Recursos públicos versionados.

Puedes utilizar `CacheFirst` para assets versionados e inmutables.

PANTALLA OFFLINE

Crea una pantalla offline sencilla y coherente con VolleyFlow.

Debe indicar:

* Que no hay conexión.
* Que las acciones que modifican información requieren internet.
* Que el usuario puede intentar nuevamente.
* Que algunos recursos previamente cargados podrían seguir disponibles.

Cachea únicamente esta pantalla y los recursos mínimos necesarios para renderizarla.

AUTENTICACIÓN Y MUTACIONES

Aplica `NetworkOnly` a:

* Login.
* Logout.
* Creación y edición de jugadores.
* Creación y edición de canchas.
* Creación de jornadas.
* Selección de participantes.
* Generación o confirmación de equipos.
* Sorteos.
* Inicio de partidos.
* Registro de resultados.
* Deshacer resultados.
* Liquidación.
* Pagos.
* Cierre.
* Cancelación.
* Eliminación.
* Ajustes.
* Cualquier petición POST, PATCH, PUT o DELETE.

Nunca pongas mutaciones en una cola offline.

Nunca reenvíes automáticamente una mutación cuando vuelva la conexión.

CONSULTAS AUTENTICADAS

Para consultas GET autenticadas, usa como máximo `NetworkFirst`.

Requisitos:

* Timeout corto y razonable.
* Fallback a caché únicamente cuando exista una respuesta previa segura.
* Cachés separadas y versionadas.
* Expiración corta.
* Cantidad máxima limitada de entradas.
* No persistir respuestas privadas durante largos periodos.
* No compartir respuestas entre usuarios.
* No cachear respuestas con errores.
* No cachear tokens ni headers de autorización.
* No cachear datos altamente sensibles cuando no sea necesario.

Considera usar `NetworkOnly` para endpoints financieros o sensibles aunque sean GET, especialmente:

* Pagos.
* Liquidación.
* Resumen financiero.
* Perfil financiero.
* Datos de autenticación.
* `/auth/me`.

Documenta claramente qué rutas se cachean y cuáles no.

5. DATOS PRIVADOS Y SESIÓN

Al cerrar sesión:

* Limpia las cachés privadas creadas por la aplicación.
* Limpia cualquier dato PWA relacionado con el usuario autenticado.
* Limpia TanStack Query.
* Limpia `sessionStorage`.
* Evita que el siguiente usuario vea información cacheada del anterior.

Cuando cambie el usuario autenticado:

* Invalida o elimina cachés privadas anteriores.
* No reutilices respuestas de otro usuario.
* Mantén los assets públicos e iconos cuando sea seguro.

No almacenes JWT dentro del Cache Storage.

6. ACTUALIZACIONES

Añade detección de una nueva versión del service worker.

Cuando exista una actualización disponible:

* Muestra un aviso no intrusivo.
* Incluye una acción “Actualizar”.
* Explica que la página se recargará.
* Activa la nueva versión de forma controlada.
* Evita ciclos infinitos de recarga.
* No interrumpas un formulario o marcador activo sin confirmación.

Implementa una estrategia segura con:

* `waiting`.
* `skipWaiting` controlado.
* `controllerchange`.
* Recarga única.

7. EXPERIENCIA DE INSTALACIÓN

Verifica que VolleyFlow pueda instalarse en:

* Chrome de escritorio.
* Chrome en Android.
* Safari en iPhone mediante “Agregar a pantalla de inicio”.

Añade soporte para:

* `display: standalone`.
* Safe areas de iOS.
* `viewport-fit=cover`.
* Barra inferior y elementos fijos en modo standalone.
* Alturas seguras usando unidades modernas como `dvh`.
* Indicador visual cuando la app está en modo instalado, únicamente si aporta valor.

No fuerces un banner de instalación personalizado si el navegador no permite instalar.

Si implementas un botón “Instalar aplicación”:

* Muéstralo solo cuando exista `beforeinstallprompt`.
* Ocúltalo cuando la aplicación ya esté instalada.
* No bloquees el uso normal de la web.

8. CONECTIVIDAD

Crea un indicador discreto para:

* Sin conexión.
* Conexión recuperada.

No dependas únicamente de `navigator.onLine`.

Cuando una acción requiera internet:

* Deshabilita la acción cuando sea evidente que no hay conexión.
* Muestra un mensaje en español.
* No simules que la operación fue guardada.
* No pierdas silenciosamente información introducida por el usuario.

No implementes sincronización en segundo plano para mutaciones.

9. SEGURIDAD

Verifica:

* Que el service worker solo se registre en producción o en un entorno explícitamente habilitado.
* Que su scope sea correcto.
* Que no intercepte recursos externos innecesarios.
* Que no cachee respuestas 401, 403 o 500.
* Que no cachee Swagger.
* Que no cachee health checks.
* Que no cachee tokens.
* Que no cachee headers sensibles.
* Que las cachés privadas se eliminen al cerrar sesión.
* Que el código no exponga secretos.

10. IMPLEMENTACIÓN

Prefiere una implementación pequeña y explícita.

Puedes utilizar una librería especializada únicamente si:

* Reduce errores.
* Permite políticas de caché claras.
* No genera automáticamente una caché agresiva.
* Su configuración queda documentada.
* No añade complejidad innecesaria.

Si utilizas Workbox o una integración de PWA:

* No actives caché automática de todas las rutas.
* Declara cada regla explícitamente.
* Mantén `NetworkOnly` para mutaciones.
* Evita el precache de contenido privado.
* Documenta el código generado.

11. PRUEBAS

Agrega pruebas para:

MANIFEST

* Manifest disponible.
* Nombre correcto.
* `display: standalone`.
* Iconos 192 y 512.
* Iconos maskable.
* Apple Touch Icon.

SERVICE WORKER

* Registro correcto.
* Instalación.
* Activación.
* Limpieza de cachés antiguas.
* Pantalla offline.
* Assets estáticos disponibles offline.
* Mutaciones sin caché.
* Consultas privadas con la política definida.
* Respuestas 401 y 500 no almacenadas.
* Limpieza de caché al cerrar sesión.
* Flujo de actualización.

E2E

Añade pruebas E2E para:

1. Abrir la aplicación en modo normal.
2. Verificar que el manifest esté disponible.
3. Verificar que exista un service worker activo.
4. Simular modo standalone.
5. Verificar navegación principal en standalone.
6. Cargar previamente la aplicación.
7. Desconectar la red.
8. Mostrar la pantalla offline en una navegación no cacheada.
9. Mantener disponibles los assets estáticos.
10. Bloquear una mutación sin conexión.
11. Recuperar la conexión.
12. Cerrar sesión.
13. Verificar que se limpien cachés privadas.
14. Simular una nueva versión.
15. Mostrar aviso de actualización.
16. Aplicar la actualización.
17. Verificar una única recarga.

No hagas que las pruebas dependan de servicios externos.

12. LIGHTHOUSE Y VALIDACIÓN MANUAL

Ejecuta Lighthouse en una compilación de producción.

Valida:

* Instalabilidad.
* Manifest.
* Service worker.
* HTTPS readiness.
* Iconos.
* Modo standalone.
* Offline fallback.
* Accesibilidad básica.
* Rendimiento.
* Buenas prácticas.

No afirmes que la aplicación es instalable únicamente porque el manifest existe.

Comprueba manualmente:

* Build de producción.
* Service worker activo.
* Instalación local.
* Apertura en standalone.
* Recarga offline.
* Cierre de sesión.
* Limpieza de caché.
* Actualización disponible.

13. DOCUMENTACIÓN

Crea o actualiza:

* `docs/PWA.md`.
* README cuando corresponda.
* `.env.example` si se agrega una variable para habilitar la PWA.

Documenta:

* Arquitectura de la PWA.
* Archivos creados.
* Registro del service worker.
* Estrategias de caché.
* Rutas `NetworkOnly`.
* Rutas `NetworkFirst`.
* Datos que nunca se cachean.
* Pantalla offline.
* Limpieza al cerrar sesión.
* Actualización de versión.
* Instalación en Android.
* Instalación en iPhone.
* Pruebas.
* Lighthouse.
* Problemas conocidos.

14. VALIDACIÓN FINAL

Ejecuta:

* lint.
* typecheck.
* pruebas unitarias relevantes.
* pruebas del frontend.
* pruebas E2E de la PWA.
* build de producción.
* inicio de producción local.
* Lighthouse.
* comprobación del manifest.
* comprobación de iconos.
* comprobación del service worker.
* comprobación offline.
* comprobación de limpieza al cerrar sesión.
* comprobación de actualización.

Corrige todos los errores encontrados.

No afirmes que una validación pasó si no fue ejecutada.

15. ENTREGA

Realiza commits locales pequeños cuando el entorno lo permita.

Ejemplos:

* feat(pwa): add manifest and installable metadata
* feat(pwa): add explicit service worker strategies
* feat(pwa): add offline and update experience
* test(pwa): cover installation offline and updates
* docs: document PWA behavior

No hagas push.

No abras un pull request automáticamente.

Al finalizar entrega:

* Archivos creados o modificados.
* Estrategias de caché implementadas.
* Rutas excluidas de caché.
* Comportamiento offline.
* Limpieza de datos privados.
* Flujo de actualización.
* Pruebas ejecutadas.
* Resultado de Lighthouse.
* Resultado de lint, typecheck y build.
* Pasos manuales para instalar en Android y iPhone.
* Problemas pendientes reales.

No agregues funcionalidades de negocio ni modifiques comportamientos funcionales ajenos a la preparación PWA.
