---
id: SPEC-RESUMES-001
title: Biblioteca de CVs
status: approved
version: 1.1
stories:
  - CU-86ajvbvec
clickup: https://app.clickup.com/t/86ajvbvec
stitch: projects/11598020962708609442
---

# Biblioteca de CVs

## Propósito

La persona usuaria administra PDFs privados para reutilizarlos al crear o
editar postulaciones. Las referencias visuales son `CV Library with Integrated
Viewer`, `CV Library with PDF Viewer`, `CV Library - Mobile` y `PDF Viewer -
Mobile` del proyecto Stitch indicado arriba.

## Reglas

- **BR-01:** Sólo se aceptan PDFs válidos, no protegidos, de hasta 10 MiB.
- **BR-02:** Una persona puede conservar hasta diez CVs listos o pendientes.
- **BR-03:** Sólo hay un principal. La primera carga de Biblioteca se vuelve
  principal si no existe uno; cargar desde postulaciones no lo cambia.
- **BR-04:** Borrar un CV desvincula, pero no borra, sus postulaciones.
- **BR-05:** Los objetos permanecen privados; URLs firmadas no se registran.
- **BR-06:** Renombrar sólo cambia el nombre mostrado y de descarga.
- **BR-07:** Tamaño y cantidad pertenecen a una política global persistida,
  consultable desde el cliente y alineada con el bucket privado y la base.
  Las reservas vigentes ocupan cupo; fallos, cancelaciones y vencimientos lo
  liberan sin depender de la disponibilidad de Storage.
- **BR-08:** Onboarding confirma su CV como principal. Eliminar un principal
  no selecciona reemplazo. Cambiar principal no modifica asociaciones existentes.
- **BR-09:** El borrado muestra principal y cantidad de postulaciones afectadas.
  El servidor compara el impacto confirmado dentro de una transacción; si cambió,
  devuelve conflicto y exige revisar la advertencia actualizada.
- **BR-10:** Se permiten nombres repetidos. Crear una postulación preselecciona
  el principal; editar conserva su asociación. Siempre se permite otro CV o ninguno.
- **BR-11:** La confirmación de carga es idempotente. Las reservas y los cambios
  de principal se serializan por usuario, también ante solicitudes concurrentes.
- **BR-12:** La eliminación y el trabajo de limpieza física se persisten en la
  misma transacción. El trabajo sobrevive a reinicios y fallos de Storage.

## Comportamiento y estados

Biblioteca permite cargar, grid/lista, selección, renombre, principal,
descarga, eliminación confirmada y lectura. En web expandido lista y visor se
presentan simultáneamente; en compacto el visor se abre como pantalla dedicada.
El visor **no se monta ni solicita acceso** antes de una selección explícita.
Al cerrarlo, la colección recupera todo el ancho disponible.
Las colecciones tienen estados de carga, vacío, error recuperable y contenido.
Las mutaciones comunican progreso, error y resultado.

La implementación reconcilia Stitch con los requisitos aprobados: excluye IA y
DOCX, y reemplaza el límite visual de 5 MB por 10 MiB.

## Brief de construcción Stitch

### Fuentes y reconciliación

| Referencia Stitch                   | Implementación que gobierna                                             | Reconciliación aprobada                                                            |
| ----------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `CV Library with Integrated Viewer` | Escritorio: navegación, colección y visor lateral persistente           | Se omiten las tarjetas de IA; la carga acepta sólo PDF y comunica 10 MiB.          |
| `CV Library with PDF Viewer`        | Escritorio: visor expandido, barra de controles y lectura               | El visor es interno y privado; descarga y lectura usan accesos firmados separados. |
| `CV Library - Mobile`               | Biblioteca compacta: cabecera, colección en lista y navegación inferior | Se omiten IA y DOCX; se reemplaza el límite mostrado por PDF de hasta 10 MiB.      |
| `PDF Viewer - Mobile`               | Ruta de lectura dedicada: regreso, título, acciones y documento         | No abre un visor externo ni pierde el contexto de Biblioteca.                      |

### Composición y respuesta

- Desde 1024 px, la aplicación mantiene una navegación lateral contraíble, una
  columna de Biblioteca y un visor lateral al seleccionar un CV. La navegación
  contraída conserva iconos, etiquetas accesibles y ayudas visibles al foco o
  hover. El control muestra un chevrón que expresa la dirección disponible; el
  ancho se anima respetando movimiento reducido y el visor lateral contrae la
  navegación automáticamente al abrirse.
- Debajo de 1024 px, la colección inicia en lista y abrir un CV navega a
  `/resumes/[resumeId]`; regresar restaura colección, selección y preferencia.
- El escritorio inicia en cuadrícula; la preferencia cuadrícula/lista vive sólo
  durante la sesión. Las tarjetas usan una jerarquía de documento, nombre,
  metadatos, distintivo de principal y menú de acciones. Las filas compactas
  usan el mismo contenido, sin perder acciones.
- La cabecera comunica propósito, ocupación y límite efectivo; la acción de
  carga es principal. El cupo agotado explica cómo liberarlo y deshabilita la
  acción sin ocultarla.

### Componentes obligatorios

La feature se compone de navegación de producto, cabecera de Biblioteca,
selector de vista, colección, tarjeta/fila de CV, menú contextual, selector de
archivo, diálogo de renombre, diálogo de eliminación con impacto y visor. La
vista sólo coordina rutas y los componentes; las consultas y mutaciones viven
en un ViewModel/hook de la feature.

### Estados visuales y accesibles

Cada superficie debe resolver: inicio sin selección, carga de colección,
colección vacía, error recuperable, contenido, selección, carga con progreso,
cupo agotado, mutación pendiente y error de mutación. El visor resuelve sin
selección, carga, documento disponible, fallo recuperable y acceso vencido.
Los controles tienen nombre accesible, orden de teclado y foco visible; los
diálogos restauran foco. La interfaz está localizada en ES/EN, responde a tema
claro/oscuro y reduce animaciones cuando la plataforma lo solicita.

## Criterios de aceptación

- **AC-01:** La validación cliente/servidor rechaza MIME, firma, contraseña,
  tamaño y cupo inválidos.
- **AC-02:** Se puede cambiar principal, renombrar y borrar con el impacto de
  postulaciones visible antes de confirmar.
- **AC-03:** El principal se preselecciona en una nueva postulación, y una
  postulación puede conservar, cambiar o quitar su CV.
- **AC-04:** La interfaz conserva los estados y controles accesibles de Stitch
  en 390, 768 y 1280 CSS px.
- **AC-05:** El visor recorre todas las páginas, desplaza, indica página, cambia
  zoom, ajusta al ancho y descarga. Expandir navega a `/resumes/[resumeId]`;
  volver conserva el contexto. El acceso firmado vencido se renueva ante un
  fallo de lectura sin reiniciar periódicamente una lectura activa.
- **AC-06:** Pruebas de concurrencia demuestran diez CVs como máximo contando
  reservas, un único principal, rechazo entre usuarios y liberación de cupo.
- **AC-07:** Borrar conserva las postulaciones con asociación nula; un fallo
  del proveedor deja un trabajo reintentable con la referencia del objeto.
- **AC-08:** PDF.js valida estructura y páginas en backend y renderiza en web.
  Se rechazan PDFs falsificados, truncados y protegidos, incluido cifrado con
  contraseña vacía. El adaptador nativo utiliza `react-native-pdf` en development
  builds, sin visores externos.

## Contratos y ejecución

- `resume.policy`: límites efectivos y ocupación del usuario autenticado.
- `resume.confirmUpload`: `primaryMode` explícito (`replace` en onboarding,
  `if_missing` en Biblioteca, `preserve` en postulaciones).
- `resume.createPreview`: acceso de lectura sin descarga forzada.
- `resume.createDownload`: acceso independiente con nombre de descarga.
- `resume.deleteImpact` y `resume.delete`: impacto y confirmación de ese impacto.
- Selección local y transferencia HTTP se encapsulan en datasources de CVs.
  TanStack Query es dueño de consultas y mutaciones; Zustand sólo conserva
  preferencias de presentación durante la sesión.
- Las fuentes, worker y recursos de PDF.js se sirven desde el mismo origen,
  versionados y preparados por Metro. No se transmiten documentos a terceros.
- La limpieza realiza un primer intento inmediato y mantiene una pasada final
  después de vencer los permisos de carga. [Supabase emite tokens válidos por dos
  horas](https://supabase.com/docs/reference/javascript/file-buckets-createsigneduploadurl);
  las reservas de la app duran como máximo una hora. Se conserva el trabajo
  hasta tres horas desde la reserva para evitar objetos recreados por cargas tardías.
- Las pruebas locales usan Expo Web (`expo start --web`) y Supabase local, sin
  resetear datos existentes. No se despliega a producción ni se hacen commits
  antes de la validación explícita de la persona solicitante.

La evidencia y los pendientes de aceptación se registran en
[Verificación de Biblioteca](../verification/resume-library.md).

## No incluido

No incluye creación o análisis por IA, edición de contenido, búsqueda en PDF,
backoffice de límites ni verificación manual en dispositivos móviles.
