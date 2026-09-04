---
id: SPEC-APPLICATIONS-005
title: Importación local de descripción del puesto
status: draft
version: 0.1
stories: [CU-86ak9vd1c]
clickup:
  - https://app.clickup.com/t/86ak9vd1c
  - https://app.clickup.com/t/86ak9ve17
  - https://app.clickup.com/t/86ak4y13y
  - https://app.clickup.com/t/86ak4y14j
owners: []
last_reviewed: 2026-09-01
supersedes: null
---

# Importación local de descripción del puesto

## Purpose

Permitir que un candidato precomplete `jobDescriptionHtml` de su formulario de
alta desde una URL móvil o una imagen con OCR, sin entregar la fuente a Palea.
Importar no crea ni actualiza una postulación: el guardado manual existente es
el único límite que envía el HTML final a Nest.

## Context and construction brief

La superficie es **Descripción del puesto** de `ApplicationCreateForm`. No hay
una referencia Stitch accesible para esta ampliación: se conserva el formulario
aprobado (label/ayuda, selector de fuente, acción, editor y feedback en línea).
En web se mantiene una columna responsive y se ofrece OCR de imagen; URL se
declara no disponible. En móvil URL e imagen son acciones locales. Los estados
son `idle`, `loading`, `success`, `empty`, `error` y `cancelled`; carga ofrece
cancelar y los resultados se anuncian. Diálogos, foco, teclado y reduced motion
cumplen la construcción accesible existente.

La fuente **Imagen** muestra una tarjeta accesible con el texto “Arrastrá o
subí una imagen”. En Expo Web acepta selección y arrastre de archivos de imagen.
Pegar una imagen en el editor nunca inserta markup o binarios: cambia
automáticamente la fuente a **Imagen** y la procesa con el mismo OCR local.
El texto resultante aplica formato local y conservador: viñetas y numeraciones
explícitas se convierten en listas, títulos en mayúsculas o con dos puntos en
encabezados y etiquetas `Clave:` en negrita. El usuario conserva la revisión y
edición antes de confirmar.
En Expo Web, Tesseract también aporta señales efímeras de líneas, párrafos,
tamaño relativo y negrita detectada para mejorar encabezados y énfasis. Esas
señales se convierten localmente al allowlist y se descartan: nunca se persisten
ni se envían como geometría o metadatos de la imagen.
El agrupamiento de layout recompone líneas visualmente partidas mediante su
separación vertical, normaliza todos los marcadores de lista a `ul/li` y sólo
promueve un bloque a encabezado cuando su tamaño relativo lo respalda.

## Actors and permissions

El candidato autenticado puede importar sólo al borrador local. No se requiere
autorización, request a Nest, almacenamiento remoto ni analítica; el guardado
continúa usando la autorización y contrato existentes.

## User-visible behavior

- La entrada manual permanece disponible ante cualquier estado de importación.
- iOS/Android: la URL HTTPS se abre en WebView aislado y puede confirmar texto
  visible normalizado; la imagen usa OCR local Apple Vision/Google ML Kit.
- Expo Web: URL explica honestamente que no está disponible; la imagen usa
  OCR local Tesseract.js en Web Worker/WASM autocontenido por Palea.
- Un resultado con texto muestra una vista previa segura; sólo la confirmación
  reemplaza `jobDescriptionHtml`. Una descripción no vacía exige segunda
  confirmación. Resultado vacío, error, cancelación o descartar no lo alteran.

## Business rules

- **BR-01:** Importar sólo prellena `jobDescriptionHtml` de TanStack Form. No
  ejecuta tRPC, HTTP, Nest, persistencia, analítica ni logging.
- **BR-02:** URL, imagen, URI, HTML/DOM de origen, cookies, scripts, metadatos
  y texto capturado no se guardan ni se incluyen en el payload final. Sólo HTML
  confirmado usa el contrato manual existente.
- **BR-03:** Zod valida cada límite de plataforma. La normalización entrega sólo
  texto visible; al convertirlo a HTML se escapan caracteres y se aplican los
  límites existentes: HTML 100.000 y texto plano 50.000 caracteres.
- **BR-04:** El estado es exactamente `idle`, `loading`, `success`, `empty`,
  `error` o `cancelled`. Cancelar detiene/libera recursos cuando es posible;
  error o cancelación nunca cambian el borrador.
- **BR-05:** Reemplazar una descripción no vacía exige confirmación explícita.
- **BR-06:** URL en iOS/Android acepta sólo HTTPS en WebView aislado: sin
  cookies compartidas, archivos, popups, downloads o permisos; mixed content
  bloqueado y puente Zod mínimo que devuelve sólo texto visible normalizado.
- **BR-07:** Expo Web no importa URLs arbitrarias. Su OCR usa Tesseract.js local
  en Worker/WASM con worker/core/modelos versionados y self-hosted por Palea,
  sin CDN de terceros runtime; workers y object URLs se terminan/revocan al
  completar, fallar, cancelar o desmontar.
- **BR-08:** Apple Vision, Google ML Kit y Tesseract quedan detrás de
  puertos/datasources; el dominio no importa frameworks ni proveedores.
- **BR-09:** Nest conserva Zod, sanitización allowlist y límites del HTML final.

## Acceptance criteria

- **AC-01:** Importar exitosamente sólo modifica el campo local tras confirmar;
  no hay llamada backend antes del guardado normal.
- **AC-02:** Error, cancelación, vacío y cancelar reemplazo preservan el texto y
  permiten entrada manual.
- **AC-03:** OCR nativo usa proveedor local detrás de puerto; Expo Web usa
  Tesseract local y libera recursos.
- **AC-04:** URL móvil aplica BR-06; Expo Web declara URL no disponible.
- **AC-05:** Contenido hostil, fuente/HTML/script, límites excedidos e inputs
  inválidos se rechazan o normalizan sin persistir ni loguear.
- **AC-06:** En web, seleccionar, arrastrar o pegar una imagen inicia el mismo
  flujo local de OCR; pegarla no la inserta en el editor y selecciona la fuente
  Imagen aun si el usuario estaba en Manual o URL.
- **AC-07:** ES/EN, WCAG AA, foco, teclado, live announcements y reduced motion
  cubren acciones, confirmaciones y feedback.

## Non-functional requirements

- **NFR-01:** Respeta `presentation -> domain` y `data -> domain`; composición
  inyecta adaptadores y los views no resuelven proveedores.
- **NFR-02:** El estado de importación es local; TanStack Query no se usa para
  una operación sin estado remoto.
- **NFR-03:** Nunca se loguean/tracean/analizan URL, imagen, URI, OCR, texto,
  HTML/DOM de origen, cookies ni scripts.
- **NFR-04:** WCAG AA, targets 48 dp, foco visible, teclado y reduced motion.

## State transitions and invariants

`idle -> loading -> success|empty|error|cancelled`; cada terminal puede iniciar
otra importación. Tras confirmar o descartar una vista previa, `success -> idle`.
Sólo la confirmación exitosa muta el borrador. Ninguna transición invoca el
repositorio de aplicaciones ni una mutación remota.

## Interfaces and contracts

- `JobDescriptionImportPort.importFromUrl(input, signal) -> ImportResult`
- `JobDescriptionImportPort.importFromImage(input, signal) -> ImportResult`
- `ImportResult` lleva sólo texto visible normalizado o estado vacío/cancelado;
  el adaptador descarta la fuente antes de retornarlo.
- La única salida existente sigue siendo `CreateApplicationInput.jobDescriptionHtml`.

## Failure modes, retries, and concurrency

No inicia una segunda importación durante `loading`. Se cancelan recursos y se
ofrecen errores localizados reintentables para proveedor, permisos, imagen,
URL no HTTPS, puente inválido o límites. No hay reintento automático ni
almacenamiento de fuente.

## Migration and compatibility

No hay migración, esquema ni contrato tRPC/Nest nuevo; sólo se mantiene el
campo `jobDescriptionHtml` ya existente.

## Observability

No se emite telemetría ni logs de insumos o resultados. Señales agregadas sin
contenido/identificadores requieren una aprobación futura.

## Security and privacy

Todo contenido externo es hostil. Zod y normalización ocurren antes del dominio;
el HTML resultante se escapa. WebView no comparte cookies/permisos ni entrega
DOM/HTML. No hay OCR remoto, LLM, servicio pago, CDN runtime o entrenamiento.

## Accessibility

Acciones y estados tienen copy localizado y live announcements. El diálogo de
reemplazo conserva/restaura foco y ofrece confirmar/cancelar por teclado. El
progreso no depende sólo de color o movimiento.

## Non-goals

Persistir fuentes, scraping backend, URL en Expo Web, OCR remoto, LLM, skills
automáticas, analítica de contenido, entrenamiento, autocompletar empresa/rol
o cambiar la API de aplicaciones.

## Test mapping

| Requirement      | Test/evidence                                                    |
| ---------------- | ---------------------------------------------------------------- |
| BR-01/02, AC-01  | Use case/ViewModel: cero llamadas al datasource antes de guardar |
| BR-03/09, AC-05  | Zod, normalización, escape, límites y payloads hostiles          |
| BR-04/05, AC-02  | Máquina de estados, cancelación y reemplazo                      |
| BR-06, AC-04     | URL nativa y estado web no disponible                            |
| BR-07, AC-03     | Tesseract, cleanup de Worker/object URL y cancelación            |
| BR-08, NFR-01/02 | Puertos, composición y límites de capa                           |
| NFR-03/04, AC-06 | Copy, accesibilidad y revisión de no logging                     |

## Related decisions

- [Alta de postulaciones](application-create.md)
- [ADR-002](../design-docs/ADR-002-mobile-architecture.md)
- [ADR-003](../design-docs/ADR-003-client-state.md)
- [ADR-005](../design-docs/ADR-005-trpc-in-nest.md)
- [ADR-006](../design-docs/ADR-006-service-access.md)

## Open questions

No hay decisión de producto pendiente. Vision/ML Kit y WebView aislado requieren
evidencia en dispositivo/simulador configurado; si falta, se reporta como
limitación y no se simula.
