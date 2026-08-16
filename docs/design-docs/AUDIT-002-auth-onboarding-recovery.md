# AUDIT-002: Auth, registro y onboarding

Fecha: 2026-08-16  
Rama revisada: `refactor/auth/registro-login-onboarding-CU-86ajvbvcd`  
Base explícita: `development@91d0415`  
Especificaciones: `SPEC-AUTH-001 v1.1`, `SPEC-DATA-001 v1.2`, `SPEC-PLATFORM-001 v1.0`, `SPEC-DESIGN-MOBILE-001 v1.2`  
Decisión de PR: **Request changes**

## 1. Resumen ejecutivo

La rama construye una base razonable: contratos Zod compartidos, rutas tRPC protegidas, separación mobile por capas, sesión nativa en SecureStore, RLS defensivo, bucket privado y validación de firma/tamaño del PDF. Lint, dependency-cruiser, TypeScript, Jest, build web y Expo Doctor pasan por separado.

No obstante, el resultado actual no está listo para merge. Hay incumplimientos funcionales de BR-03/AC-03, una autorización de negocio insuficiente para datos personales, divergencias explícitas respecto de MVVM/TanStack Query, fallos de configuración que romperían CI, limpieza de Storage no durable y una brecha grande entre los criterios declarados y la evidencia automatizada. Además, los cambios locales sin commit revierten un fix previo de esta misma rama.

Se recomienda no aprobar hasta resolver al menos F-01 a F-10 y añadir evidencia E2E/SQL.

## 2. Alcance y método

Se comparó el estado completo del worktree contra `development@91d0415`, tal como declara el recovery plan. El alcance observado comprende:

- 24 commits propios;
- 79 archivos versionados modificados por los commits;
- 28 archivos modificados sin commit y 2 archivos nuevos sin seguimiento al cerrar la auditoría;
- contratos, SQL/Prisma, Nest/tRPC, configuración, mobile data/domain/presentation, localización y `ui-native`;
- aspectos relacionados de CI, specs y ADRs cuando afectan la posibilidad de entregar esta rama.

El análisis incluye inspección estática, contraste con requisitos, revisión de historial/diff y ejecución de gates. No se realizó validación visual contra Stitch ni smoke test real de OAuth/proveedores porque no hay una referencia ejecutable ni credenciales disponibles en el worktree. Las pruebas SQL no pudieron ejecutarse porque Supabase local no estaba iniciado.

## 3. Hallazgos de PR

### F-01 — Bloqueante — Se colapsaron datos personales obligatorios y datos profesionales opcionales en el mismo aviso

Requisitos afectados: BR-03, AC-03.

Evidencia:

- `useLoginViewModel.ts:17-21` termina el OAuth nativo sin navegar después de obtener sesión.
- `useAuthCallbackViewModel.ts:11-15` siempre redirige a `/` sin consultar `account.me`.
- `AuthenticatedHomeScreen.tsx:23-34` sustituyó la redirección por `missing.includes('personal')` por un aviso genérico basado en `account.missing.length > 0`.
- El diff local elimina explícitamente la lógica que sí existía en `HEAD` después del commit `3c9ef6d fix(mobile): route incomplete social accounts to personal data`.

La intención de producto aclarada es correcta y distingue dos categorías:

- `personal`: datos obligatorios faltantes de una identidad social nueva; deben llevar a `/auth/personal-data` antes del onboarding.
- `profile`, `work_experience` y `skills`: datos profesionales opcionales omitidos; después del onboarding sólo deben producir un aviso no bloqueante hasta que exista una futura vista de perfil.

El problema no es haber convertido los datos profesionales en un aviso. El problema es que la condición actual usa cualquier elemento de `missing` y, por tanto, también convierte `personal` en un aviso no bloqueante.

Impacto:

- En native, el usuario puede permanecer en login aun después de autenticarse.
- En web, una identidad nueva llega al home con fecha de nacimiento o nacionalidad faltantes y recibe el mismo tratamiento que un dato profesional opcional.
- No existe otra ruta automática hacia `/auth/personal-data`; el flujo requerido queda roto.

Recomendación:

1. Centralizar la resolución post-auth en un único caso de uso/ViewModel: refrescar `account.me`; si falta `personal`, redirigir a datos personales; si sólo faltan datos profesionales, permitir acceso y mostrar el aviso no bloqueante.
2. No duplicar esta decisión entre login, callback y home.
3. Añadir tests de navegación para Google/LinkedIn, identidad nueva/existente y web/native.

### F-02 — Bloqueante — `completeRegistration` permite reescribir datos que debían completarse una única vez

Requisitos afectados: BR-03, estados de navegación y autorización de negocio.

Evidencia:

- `packages/trpc/src/index.ts:137-142` expone la mutación a toda identidad autenticada.
- `apps/backend/src/account/account.service.ts:66-78` ejecuta un `profile.update` incondicional.
- `/auth/personal-data` no tiene guard que compruebe que falten datos.

Impacto:

Cualquier usuario autenticado puede invocar repetidamente el procedimiento y cambiar nombre, nacimiento y nacionalidad. La protección de transporte existe, pero falta la autorización basada en estado del recurso. Una ruta manual también expone la operación desde UI.

Recomendación:

- Hacer la transición idempotente y condicional en backend. Permitirla sólo si el perfil está incompleto, con una escritura atómica que detecte conflictos concurrentes.
- Si el producto debe permitir editar esos datos, definir un contrato, permisos y trazabilidad separados; no reutilizar `completeRegistration`.
- Probar primera ejecución, repetición, concurrencia y acceso no autenticado.

### F-03 — Bloqueante — El contrato promete códigos estables, pero el backend expone mensajes ad hoc

Requisitos afectados: sección “Contratos y carga de CV”, NFR-05.

Evidencia:

- `packages/contracts/src/auth.ts:146-156` define `appErrorCodeSchema`, pero no se usa en respuestas ni errores tRPC.
- `account.service.ts` arroja mensajes como `Profile not found`, `Invalid interests` y `Minimum age is 18`.
- `resume.service.ts` arroja `Upload not found`, `Invalid PDF upload` y `Pending upload not found`.
- `packages/trpc/src/index.ts:90-99` sólo enmascara `INTERNAL_SERVER_ERROR`; el resto de mensajes cruza la frontera.
- Los ViewModels descartan la causa y muestran textos genéricos hardcodeados.

Impacto:

El cliente no puede distinguir credenciales inválidas, email existente, reserva vencida, red y archivo inválido de forma estable. Cambiar un texto del servidor se vuelve un cambio contractual accidental. Tampoco se cumple la traducción prevista por la spec.

Recomendación:

- Introducir una representación tipada de error con `code` validado por Zod y mensaje público genérico.
- Mapear errores de Supabase, Prisma, Storage y dominio en la frontera backend/data.
- No enviar detalles internos; registrar únicamente código, request ID y metadatos no sensibles.
- Añadir tests de cada código definido; eliminar códigos que no tengan productor/consumidor real.

### F-04 — Bloqueante — La rama no puede cumplir el gate de CI con su configuración actual

Requisitos afectados: AC-02, AC-10, `SPEC-PLATFORM-001` AC-07.

Evidencia:

- `apps/mobile/src/core/config/environment.ts:3-18` hace obligatorios `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- `.github/workflows/ci.yml:13-21` no define ninguna de esas variables.
- El build local pasó porque Expo cargó `apps/mobile/.env.local`, un archivo no versionado que CI no tendrá.
- El workflow ejecuta tanto `pnpm validate` como `export:all`, por lo que ambas etapas cargarán el schema mobile.

Impacto:

La rama puede pasar en la máquina del autor y fallar en GitHub Actions antes de ser revisable. El resultado local no es reproducible desde un checkout limpio.

Recomendación:

- Añadir valores sintéticos/locales no secretos para CI o inyectarlos desde el entorno de CI aprobado.
- Añadir tests explícitos de configuración ausente/válida para las nuevas variables.
- Ejecutar un build desde checkout limpio sin `.env.local` antes del merge.

### F-05 — Alta — La limpieza de CVs no es durable y puede perder la referencia a objetos huérfanos

Requisitos afectados: BR-06, AC-06, contrato de carga, `SPEC-DATA-001` líneas de Storage.

Evidencia:

- `resume.service.ts:24-29` implementa la tarea independiente como `setInterval` dentro del proceso de Cloud Run.
- Con scale-to-zero no hay proceso que ejecute el timer; con múltiples instancias se ejecuta varias veces.
- `resume.service.ts:110-114` borra la fila aunque `storage.remove` devuelva error.
- `resume.service.ts:145-159` también borra filas después de `remove` sin comprobar el resultado.
- El callback del timer usa `void this.cleanupExpired()` sin captura; un rechazo puede convertirse en `unhandledRejection`.

Impacto:

Un fallo transitorio de Storage puede dejar un objeto sin fila que nunca volverá a limpiarse. Las reservas vencidas pueden acumularse cuando el servicio no recibe tráfico. Esto aumenta costo, retención de PII y dificultad operativa.

Recomendación:

- Mover el barrido a Cloud Scheduler/Cloud Run Job o mecanismo durable equivalente, idempotente y observable.
- Mantener estado/reintento hasta confirmar el borrado del objeto; no eliminar la referencia de DB primero.
- Definir métricas y alertas: pendientes vencidos, fallos de delete, bytes huérfanos y antigüedad máxima.
- Probar fallos parciales, concurrencia entre workers y reintentos.

### F-06 — Alta — Hay fallbacks silenciosos a credenciales locales en producción

Requisitos afectados: `SPEC-PLATFORM-001` NFR-01 y AC-06.

Evidencia:

- `apps/backend/src/config/environment.ts:21-34` asigna defaults locales a URL/key de Supabase, service-role key y URLs de base de datos sin condicionarlos a development/test.

Impacto:

Un despliegue de staging/producción con una variable ausente puede iniciar con credenciales ficticias o apuntar accidentalmente a localhost en vez de fallar al arrancar. Esto contradice de forma directa el requisito aprobado “No hay fallbacks silenciosos a localhost”.

Recomendación:

- Exigir todas las credenciales y URLs en staging/production.
- Aplicar defaults sólo a un schema local explícito, seleccionado por `PALEA_ENV === development`.
- Añadir tests de matriz de ambientes, incluida la ausencia de cada secreto en producción.

### F-07 — Alta — Riesgo de doble intercambio del código PKCE en Expo Web

Requisitos afectados: AC-02.

Evidencia:

- `SupabaseAuthDataSource.ts:33-39` configura `flowType: 'pkce'` y `detectSessionInUrl: true` en web.
- La versión instalada de `@supabase/auth-js` intercambia automáticamente `params.code` durante la inicialización cuando esas opciones están activas.
- `useAuthCallbackViewModel.ts:13` vuelve a llamar manualmente a `exchangeCodeForSession(code)`.

Impacto:

Según el orden entre inicialización del cliente y montaje de la ruta, el mismo código de un solo uso puede intercambiarse dos veces. El callback puede mostrar error aun cuando la primera operación creó la sesión, generando un flujo intermitente difícil de reproducir.

Recomendación:

- Elegir un solo propietario del intercambio: detección automática en web o callback manual, no ambos.
- Mantener un flujo separado y explícito para native si lo requiere Expo WebBrowser.
- Probar URL con `code`, cancelación, código reutilizado, refresh del callback y sesión previa.

### F-08 — Alta — La implementación mobile incumple las fronteras MVVM y de estado remoto aprobadas

Requisitos afectados: NFR-03, ADR-002, ADR-003.

Evidencia:

- `useOnboardingViewModel.ts:34` expone el repositorio completo a la vista.
- `SkillsOnboardingScreen.tsx:22-39` selecciona archivos, reserva, carga, confirma, guarda skills y finaliza directamente desde la vista.
- `AuthenticatedHomeScreen.tsx:23-34` consulta el repositorio en un `useEffect` y duplica remote state en `useState`, fuera de TanStack Query.
- Registro, login y onboarding ejecutan mutaciones manuales en lugar de `useMutation`.
- `invalidateAccount()` no se espera y el home ni siquiera consume esa query, por lo que no garantiza “invalidar y refrescar antes de decidir una redirección”.

Impacto:

La navegación y los estados de carga/error quedan fragmentados entre vistas, hooks y repositorios. Se dificulta probar la lógica sin renderizar UI y aparecen carreras como F-01.

Recomendación:

- El ViewModel debe exponer comandos concretos y estados, nunca el repositorio.
- `account.me` y catálogos deben ser queries; escrituras, uploads y finalización, mutations con invalidación/refetch esperado.
- Resolver la navegación sólo después del resultado fresco que gobierna la transición.

### F-09 — Alta — La experiencia ES/EN y la validación accesible están incompletas

Requisitos afectados: NFR-05, BR-09, AC-09, `SPEC-DESIGN-MOBILE-001` AC-03.

Evidencia:

- Sólo un subconjunto de títulos/campos usa `t(...)`; Personal Data, casi todo onboarding, errores, ayudas, OAuth callback y avisos permanecen en español.
- `useOnboardingViewModel.ts:12` consulta siempre el catálogo con locale `es`.
- `formatFieldError.ts` contiene mensajes españoles fuera de `@palea/localization`.
- Los validators están configurados sólo en `onSubmit`, no por campo/onBlur/onChange como exige la spec.
- `PasswordField` conserva por defecto labels de lector de pantalla en inglés en la UI española.
- `TextField` anuncia el error como hint, pero no expone `accessibilityState.invalid`.

Impacto:

Cambiar la app a inglés produce pantallas híbridas y catálogos españoles. Los errores no aparecen “antes y durante el envío” y la semántica para tecnologías asistivas es inconsistente.

Recomendación:

- Mover todo copy y errores a namespaces ES/EN con tests de paridad.
- Derivar locale del provider para queries y claves de cache.
- Definir estrategia de validación por campo y estados `invalid`, `busy`, foco y asociación error-campo.
- Añadir tests de accesibilidad y capturas/responsive en ambos idiomas.

### F-10 — Alta — AC-04 no se cumple: el primer paso no puede omitirse individualmente

Requisitos afectados: BR-04, AC-04.

Evidencia:

- `ProfileOnboardingScreen.tsx:35-36` ofrece “Continuar” u “Omitir onboarding”; no existe “Omitir este paso” hacia experiencia.
- Work sí permite omitir su paso y Skills permite omitir el suyo, creando un comportamiento inconsistente.

Impacto:

Una persona que no quiera completar el perfil profesional debe abandonar todo el onboarding, aunque sí quisiera cargar experiencia, skills o CV.

Recomendación:

- Añadir transición individual profile -> work sin persistir valores inválidos.
- Cubrir cada combinación de guardado/omisión y restauración posterior.

### F-11 — Alta — “ISO 3166-1 alpha-2” se valida sólo por forma, no por pertenencia

Requisitos afectados: BR-01, AC-05, `SPEC-DATA-001`.

Evidencia:

- `isoNationalitySchema` usa únicamente `/^[A-Z]{2}$/`.
- La constraint SQL repite la misma expresión regular.

Impacto:

Valores como `ZZ`, `XX` o cualquier combinación de dos letras se aceptan aunque no representen el país/nacionalidad aprobado. La misma debilidad existe en cliente, contrato y DB, por lo que la defensa en profundidad no la corrige.

Recomendación:

- Usar una lista versionada de códigos válidos o una tabla catálogo referenciada.
- Aclarar si se aceptan códigos reservados/excepcionales; modelar país versus nacionalidad si el producto necesita esa distinción.

### F-12 — Alta — El flujo de upload depende de metadatos opcionales y de un transporte no probado

Requisitos afectados: BR-06, AC-06.

Evidencia:

- `SkillsOnboardingScreen.tsx:31-32` convierte `asset.size` ausente en `0`; el schema de reserva exige un entero positivo, así que el upload falla en plataformas donde el picker no informa tamaño.
- Se declara MIME `application/pdf` sin verificar `asset.mimeType`; el backend detecta firma, lo cual es bueno, pero el mensaje llega tarde.
- `OnboardingRepositoryImpl.ts:49-53` hace un `PUT` manual de `Blob` a la URL firmada en vez de usar el helper soportado `uploadToSignedUrl`; no hay test contra Supabase Storage real.
- No hay timeout ni cancelación para lectura/upload/confirmación.

Impacto:

El flujo puede funcionar en web y fallar en iOS/Android o con archivos sin `size`. Un upload colgado mantiene la UI indefinidamente y una confirmación fallida deja trabajo para una limpieza no durable.

Recomendación:

- Leer bytes primero cuando falte size y reservar con el tamaño real.
- Usar el cliente/helper documentado o probar exactamente el protocolo HTTP adoptado.
- Incorporar AbortSignal, timeout, reintento seguro y pruebas web/native con Storage local.

### F-13 — Media — La creación de cuenta tiene un estado parcial no modelado

Requisitos afectados: AC-01 y recuperación de errores.

Evidencia:

- `RegisterAccount.ts:11-17` crea primero la identidad Auth y después completa el perfil mediante otra solicitud.
- Si la segunda operación falla, queda una cuenta creada pero incompleta.
- El mensaje de UI reconoce esta posibilidad, pero el estado no tiene un caso de uso de recuperación robusto y F-01 impide actualmente la reparación automática al volver a iniciar sesión.

Recomendación:

- Tratar “Auth creada/perfil incompleto” como estado explícito e idempotente.
- Tras signup, consultar estado real y enrutar; tras retry/login, continuar desde personal data.
- Probar timeout entre ambas operaciones, email ya creado y retry después de reiniciar la app.

### F-14 — Media — `skipped` es un dato contractual sin semántica persistida

Evidencia:

- tRPC recibe `skipped` y la interfaz de servicios lo propaga.
- `create-app.ts:72` descarta el argumento.
- `AccountService.completeOnboarding` sólo guarda timestamp.
- Skills usa `finish(false)` incluso al pulsar “Omitir este paso”.

Impacto:

El contrato comunica una distinción que el sistema no conserva ni usa. Esto confunde tests, analytics y mantenimiento.

Recomendación:

Eliminar `skipped` si no es requisito durable o especificar/persistir su significado. El repositorio prohíbe compatibilidad especulativa; no mantener parámetros sin comportamiento.

### F-15 — Media — No hay control de abuso para reservas y confirmaciones de CV

Evidencia:

- Cualquier cuenta autenticada puede crear reservas sucesivas; no hay cuota por usuario, rate limit ni límite de pendientes.
- `SPEC-DATA-001` ya enumera rate limits como riesgo abierto.

Impacto:

Una cuenta comprometida puede consumir filas, URLs firmadas, ancho de banda y CPU de validación/descarga.

Recomendación:

- Limitar reservas pendientes y frecuencia por sujeto/IP, con códigos de error estables.
- Añadir límites de concurrencia y observabilidad de abuso.

### F-16 — Media — Se fuerza tema claro sin una decisión aprobada y se rompe el catálogo dark

Requisitos afectados: `SPEC-DESIGN-MOBILE-001` comportamiento visible, FR-06 y AC-01.

Evidencia:

- El cambio local de `AppProviders.tsx:28-29` ignora `themeStore` y el esquema del sistema para fijar siempre `light`.
- El comentario “Product decision” no está respaldado por una revisión de spec/ADR.
- El catálogo de componentes vive bajo el mismo provider y ya no puede demostrar ambos temas como exige FR-06.

Recomendación:

Restaurar la preferencia o aprobar primero una modificación explícita de la spec. Si la release es temporalmente light-only, preservar una vía de catálogo/testing dark fuera de la navegación de producto.

### F-17 — Media — Estados de error/carga y prevención de doble acción son incompletos

Evidencia:

- Catálogos fallidos se renderizan como listas vacías sin estado de error ni retry.
- Profile y Work no exponen loading ni bloquean explícitamente submit/skip durante la mutación.
- El skip de Profile dispara una promesa sin `catch`, pudiendo producir rechazo no manejado.
- `AuthProvider` no finaliza `isRestoring` si `getSession()` rechaza.

Recomendación:

Modelar estados idle/loading/success/error en ViewModels/mutations, bloquear acciones conflictivas y ofrecer retry. Añadir pruebas de doble tap, offline, timeout y desmontaje durante una operación.

## 4. Aspectos bien implementados

### Especificación y trazabilidad

- La rama parte de specs aprobadas con IDs estables y un recovery plan que fija base, branch y slices.
- La secuencia de commits separa contratos, DB, API, domain/data, UI y correcciones; es significativamente más revisable que un único commit masivo.
- `SPEC-AUTH-001` documenta alcance/no alcance, reglas, fronteras, estados, fallos, contratos y test mapping.

### Arquitectura

- Expo Router se mantiene mayormente como adaptador de una línea.
- El dominio mobile no importa React, Expo, Supabase ni tRPC.
- Datasources encapsulan Supabase Auth y tRPC; repositorios implementan puertos de dominio.
- La composición concreta vive en `compositionRoot`.
- `pnpm architecture:check` pasó con 423 módulos y 621 dependencias.

### Contratos y datos

- Inputs y outputs principales se expresan con schemas Zod compartidos.
- Hay límites explícitos para passwords, arrays, UUIDs, fechas y CVs.
- tRPC valida output, protege procedimientos y adjunta request ID al error.
- SQL mantiene RLS, revoca acceso a `anon/authenticated` y concede acceso privilegiado sólo al rol de backend.
- Existen constraints para MIME/tamaño, estado de upload, un CV principal y fechas laborales.
- Las sustituciones de intereses/skills y el cambio de CV principal usan transacciones.

### Seguridad

- La service-role key permanece en backend; mobile sólo recibe publishable key.
- Los paths de CV se derivan del UUID autenticado y un UUID generado por servidor.
- Confirmación verifica ownership, expiración, tamaño real y magic bytes `%PDF-`.
- Native persiste sesión en Expo SecureStore y logout usa scope local, alineado con BR-08.
- `helmet` y CORS explícito siguen habilitados en Nest.
- El fetch de Supabase Auth tiene timeout y preserva una señal de abort externa.

### UI y diseño

- Se reutilizan layouts, campos, botones, chips, feedback y tokens semánticos de `@palea/ui-native`.
- Hay atención a reduced motion, responsive layout, live regions y progressbar accesible.
- Expo Web se exporta correctamente en el entorno local y Expo Doctor pasa 18/18.

## 5. Matriz de cumplimiento

| Requisito | Estado               | Resumen                                                                         |
| --------- | -------------------- | ------------------------------------------------------------------------------- |
| BR-01     | Parcial              | Campos presentes; nacionalidad no valida pertenencia ISO real.                  |
| BR-02     | Parcial sólido       | Password y edad validados; falta integración backend/UI completa.               |
| BR-03     | Fallido              | Redirección social revertida y completeRegistration repetible.                  |
| BR-04     | Fallido              | Profile no puede omitirse individualmente; estado/resume incompleto.            |
| BR-05     | Parcial              | Límites en Zod/SQL; comportamiento vacío versus `missing` es ambiguo.           |
| BR-06     | Parcial              | Reserva/confirmación existe; transporte y limpieza no están probados/durables.  |
| BR-07     | Mayormente cumple    | Timestamp y `missing` excluyen CV; `skipped` no tiene semántica.                |
| BR-08     | Cumple por código    | Logout local implementado; falta prueba de reload.                              |
| BR-09     | Parcial              | Labels ES/EN en catálogo; cliente pide siempre ES.                              |
| NFR-01    | Cumple               | Supabase directo sólo para Auth; producto/Storage pasan por Nest.               |
| NFR-02    | Cumple               | Domain mobile permanece independiente.                                          |
| NFR-03    | Fallido              | Vistas coordinan repositorio y remote state fuera de Query.                     |
| NFR-04    | Mayormente cumple    | Datasources/repositories separados.                                             |
| NFR-05    | Fallido              | Errores no estables/localizados y validación sólo al submit.                    |
| NFR-06    | Parcial              | Reutilización alta; cambios compartidos sin cobertura y light-only no aprobado. |
| AC-01     | No demostrado        | Flujo no atómico y sin E2E.                                                     |
| AC-02     | No demostrado/riesgo | Sin E2E OAuth; posible doble exchange PKCE.                                     |
| AC-03     | Fallido              | Identidad social nueva no completa datos.                                       |
| AC-04     | Fallido              | Omisión individual incompleta.                                                  |
| AC-05     | Parcial              | Varias capas validan, pero ISO real y suite SQL faltan.                         |
| AC-06     | No demostrado        | Sin prueba Storage real; limpieza defectuosa.                                   |
| AC-07     | Parcial              | Home/logout/notice existen; notice no identifica el primer dato concreto.       |
| AC-08     | No demostrado        | Código usa signout local; no hay test reload.                                   |
| AC-09     | Fallido              | UI híbrida ES/EN y sin evidencia viewport/Stitch.                               |
| AC-10     | Fallido              | `pnpm validate` falla; no hay E2E ni SQL ejecutado; CI carece de env nuevas.    |

## 6. Cobertura de pruebas

### Evidencia existente

- Contratos: 4 tests nuevos cubren mismatch de password, edad, duplicados/fecha y tamaño de CV.
- Domain mobile: 1 test de `RegisterAccount`.
- Zustand: 1 test del draft.
- SQL: 7 assertions declaradas para trigger de perfil, nacionalidad, labels y estado de CV.
- tRPC: los tests existentes sólo ejercitan health/projects; los routers nuevos se incluyen mediante un cast `as unknown as PaleaApiServices`, sin probar autenticación ni procedimientos.

### Cobertura crítica ausente

- Servicios `AccountService`, `ResumeService` y `AuthService`.
- Protected procedures, ownership y mapeo de errores.
- Signup/login/logout/restore y PKCE en web/native.
- Cuenta parcial y recuperación.
- Guards y matriz completa de navegación.
- Forms, errores por campo, loading, retry y doble tap.
- Upload real, cancelación, expiración, magic bytes, tamaño, fallos parciales y concurrencia.
- Cleanup durable.
- ES/EN, accesibilidad y viewports 390/768/1280.
- E2E web y smoke native.

Observación sistémica: `pnpm test` no ejecuta `supabase test db`. Por tanto, los archivos pgTAP pueden existir y CI seguir verde sin haberlos corrido. El workflow debe iniciar Supabase y ejecutar explícitamente los tests SQL.

## 7. Resultados de validación

| Gate                      | Resultado     | Observaciones                                                                                                                                                                 |
| ------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm validate`           | Falló         | Se detuvo en `format:check`: Prettier reportó 241 archivos. El patrón global sugiere configuración/autocrlf del worktree Windows, pero el gate canónico igualmente está rojo. |
| `pnpm lint`               | Pasó          | 17 tareas.                                                                                                                                                                    |
| `pnpm architecture:check` | Pasó          | Sin violaciones.                                                                                                                                                              |
| `pnpm typecheck`          | Pasó          | 17 tareas.                                                                                                                                                                    |
| `pnpm test`               | Pasó          | Jest pasó; gran parte fue cache de Turbo. No incluye SQL ni E2E.                                                                                                              |
| `pnpm build`              | Pasó local    | Usó `.env.local`; Expo Web generó bundle de entrada de ~5.06 MB. Next advirtió múltiples workspaces/lockfiles por la disposición del worktree.                                |
| `expo-doctor`             | Pasó          | 18/18 checks.                                                                                                                                                                 |
| `supabase test db`        | No ejecutable | Conexión rechazada en `127.0.0.1:54322`; Supabase/Docker no estaba iniciado.                                                                                                  |
| `export:all`              | No ejecutado  | CI lo contempla, pero faltan variables Supabase en el workflow.                                                                                                               |
| E2E/Stitch/native smoke   | No disponible | No hay suite de esta story ni referencia/proveedores ejecutables en el worktree.                                                                                              |

## 8. Problemas relacionados fuera del núcleo del diff

1. **SQL fuera del gate:** ni el script raíz ni CI ejecutan pgTAP/Supabase. Es crítico para una arquitectura que declara PostgreSQL como última defensa de invariantes.
2. **Formato no reproducible en Windows:** `format:check` marca prácticamente todo el repositorio mientras `git diff --check` no detecta whitespace inválido. Conviene normalizar `.gitattributes`, `core.autocrlf` documentado y EOL de Prettier, y probar desde checkout limpio Windows/Linux.
3. **CI depende de env incompletas:** cada nuevo schema de runtime debe actualizar CI, ejemplos, catálogo y tests en el mismo cambio.
4. **Bundle web mobile grande:** el entry reportado es ~5.06 MB. No bloquea esta story sin presupuesto aprobado, pero merece medición gzip/brotli y lazy loading antes de crecer.
5. **Observabilidad:** existe request ID, pero no hay evidencia de listener estructurado, métricas de auth/upload ni alertas de cleanup. No deben registrarse tokens ni PII.

## 9. Plan de remediación recomendado

### Antes del próximo review

1. Revertir la regresión local de navegación y centralizar post-auth routing.
2. Restringir `completeRegistration` por estado en backend.
3. Implementar códigos de error estables end-to-end.
4. Corregir env de CI y eliminar defaults productivos silenciosos.
5. Reemplazar el timer de cleanup por un job durable con reintentos.
6. Encapsular comandos en ViewModels/TanStack Query y eliminar el escape `repository`.
7. Completar skip por paso, locale dinámico y todos los textos ES/EN.
8. Resolver PKCE a un único intercambio y robustecer upload cross-platform.

### Evidencia mínima para re-review

- Tests unitarios de Account/Auth/Resume services y routers protegidos.
- Tests de navegación para email y social, nuevo/existente, web/native.
- Integración Supabase local para DB + Storage, incluidos fallos parciales/concurrencia.
- E2E web de AC-01 a AC-09 y smoke native documentado.
- Capturas o regresión visual en ES/EN a 390/768/1280 contra Stitch aprobado.
- `pnpm validate`, Expo Doctor, `export:all` y SQL tests desde checkout limpio sin `.env.local`.

## 10. Veredicto final de PR

**Request changes.**

La dirección general es buena y varias fronteras de seguridad están bien elegidas, pero el estado actual no entrega la historia aprobada de extremo a extremo. Los bloqueos no son cosméticos: afectan el flujo social obligatorio, la integridad de datos personales, la reproducibilidad de CI, la retención de CVs y el contrato de errores. La aprobación debería depender de comportamiento probado, no sólo de que lint/types/build pasen.
