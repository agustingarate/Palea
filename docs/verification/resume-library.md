# Biblioteca de CVs — evidencia de desarrollo

Especificación: [SPEC-RESUMES-001](../product-specs/resume-library.md).
Fecha: 2026-08-31. Rama: `feat/mobile/resume-library-CU-86ajvbvec`.
Los cambios permanecen locales, sin nuevos commits ni despliegue.

## Evidencia ejecutada

- Expo Web se ejecuta con `expo start --web`, API Nest en puerto 3001 y Supabase
  local. Las dos migraciones de Biblioteca se aplicaron sin resetear datos.
- Expo Doctor: **18/18 comprobaciones** aprobadas.
- Backend: **36 pruebas** aprobadas, incluyendo cuatro pruebas con PDF.js real
  sobre PDFs de tres páginas, falsificados, truncados y cifrados.
- Mobile: **73 pruebas** aprobadas, incluidas activación, renovación y descarga
  explícita del visor.
- Contratos: **19 pruebas** aprobadas en cuatro suites.
- Validación final: formato, lint, arquitectura, typecheck, tests y build web
  aprobados con el árbol final. Registro local:
  `/tmp/palea-cv-evidence/pnpm-validate-final.log`.
- `node scripts/verify-resume-library.mjs` en `apps/backend`: prueba con Prisma y
  Supabase reales, usuarios sintéticos aislados y limpieza al terminar. Verifica
  concurrencia de reservas, principal único, confirmación idempotente, autorización,
  impacto de borrado, desvinculación, trabajo persistido, expiración, tamaño exacto,
  tamaño excedido, RLS de política/cola y sincronización del bucket. Storage se
  sustituye por un doble explícito en esta prueba; la carga real se verifica en web.
- `pnpm architecture:check`: sin violaciones. Typecheck de backend y mobile y lint
  de ambos pasaron durante los incrementos.

## Web real

Se usaron documentos sintéticos de tres páginas y una postulación temporal de QA.
Los CVs propios del usuario no se modificaron ni eliminaron.

- Carga desde Biblioteca, creación y detalle de postulación y onboarding
  confirmada con el backend y Storage locales. El formulario de creación deja
  claro que, al descartar la postulación, el CV recién subido permanece en la
  biblioteca. No se completó onboarding ni se alteró el perfil.
- Renombrado confirmado; foco restaurado al botón que abrió el diálogo.
- Principal preseleccionado al crear una postulación.
- Asociación conservada al abrir detalle; quitar CV conserva la postulación.
- Visor abierto desde Biblioteca y desde el detalle de postulación.
- Lectura de tres páginas, página siguiente, zoom, ajuste y cierre comprobados.
- El visor no aparece antes de seleccionar; el compacto abre ruta dedicada.
- Descarga disparada desde el visor sin abandonar la ruta. La prueba de servicio
  confirma que Storage recibe el nombre visible como adjunto; la prueba web del
  hook confirma que sólo se crea y activa el enlace temporal tras la acción
  explícita. El navegador de pruebas no expuso el archivo descargado para
  inspeccionarlo físicamente.
- Menú y advertencia de eliminación muestran principal y uso por postulaciones.
- Borrado real de un PDF sintético principal asociado: conserva la postulación
  sin CV y deja la biblioteca sin principal, sin elegir reemplazo.
- Cargar desde postulación no cambia el principal; onboarding lo establece.
- Composición inspeccionada en 390, 768 y 1280 px, además de oscuro e inglés
  en 390 y 1280 px; sidebar contraíble y visor lateral comprobados.
- Ajuste final de navegación verificado en web: chevrones de contraer/expandir,
  transición del ancho y contracción automática al seleccionar el PDF. Las
  cards usan elevación breve y gris de hover al 50 %; los botones conservan
  objetivo táctil de 48 px con un halo visual de 32 px.

Las capturas se conservan en `/tmp/palea-cv-evidence`, fuera del repositorio:
pueden contener nombres de archivos de la sesión privada del usuario.
Incluyen `library-1280-grid.png`, `library-768.png`, `viewer-lateral-1280.png`,
`library-collapsed-1280.png`, `library-dark-en-1280.png`,
`library-dark-en-390.png`, `delete-impact-dark-390.png` y
`onboarding-upload-390.png`.

Quedan cuatro CVs sintéticos y la postulación «Palea QA · temporal» en la sesión
local para revisión. El CV sintético cargado desde onboarding quedó como principal.

## Pendientes para aceptación

- Completar el recorrido íntegro por teclado y la cobertura visual de todos los
  estados de error, cupo y progreso; no se declara esa cobertura exhaustiva.
- Completar la matriz de capturas y comparación final con las cuatro referencias
  de Stitch. Las capturas actuales cubren una parte de las combinaciones exigidas.

No se declara aceptación completa mientras existan estos pendientes.
**Desarrollo móvil sin verificación móvil:** no se ejecutaron dispositivos ni
simuladores iOS/Android, conforme al alcance acordado. El visor nativo necesita
una build de desarrollo; Expo Go no alcanza para verificarlo.
