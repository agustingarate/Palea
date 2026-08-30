---
id: SPEC-APPLICATIONS-003
title: Detalle de postulación del candidato
status: approved
version: 1.7
stories: [CU-86ajvbvd3]
last_reviewed: 2026-08-29
---

# Detalle de postulación

## Alcance

El candidato abre una postulación propia desde Home en
`/applications/[applicationId]`. El detalle permite consultar el resumen,
compensaciones, descripción, habilidades, etapas, nota, recursos y CV; cambiar
el estado y asociar, reemplazar, quitar, cargar o descargar un CV. Aplica a
Expo nativo y Expo Web; `apps/web` queda fuera de alcance.

La edición general pertenece a CU-86ajvbve7. El CRUD de etapas está definido en
[SPEC-APPLICATIONS-004](application-stages.md); notas y recursos pertenecen a
sus tareas respectivas. La
eliminación de una postulación se expone desde la cabecera Web de este detalle
mediante la mutación owner-scoped existente y confirmación destructiva.

## Referencia y calidad visual

Stitch es la referencia para jerarquía, composición y calidad percibida; no se
replica literalmente si eso duplica componentes del sistema o introduce estilos
aislados. La referencia móvil es `Application Detail (Updated Overview)` y la
referencia web es `Application Detail - Web (Unified)` del proyecto Stitch
`16272299109015713935`.

- En Web expandido hay navegación lateral, una cabecera de identidad y acciones,
  una columna principal dominante para el resumen y una columna secundaria para
  etapas y nota. No se aceptan dos columnas simétricas de tarjetas genéricas.
- Las etapas usan una línea temporal con hitos y conectores, no una lista de
  superficies equivalentes.
- Las secciones usan los tokens y organismos de `@palea/ui-native` antes de
  crear componentes específicos. Las diferencias menores respecto de Stitch son
  aceptables si preservan jerarquía, espaciado, densidad, accesibilidad y
  claridad de acciones.
- No se presentan controles de archivo, edición general, edición de notas ni
  CRUD de recursos: son no-objetivos de esta historia aunque aparezcan en la
  referencia visual. El CRUD de etapas se habilita mediante
  `SPEC-APPLICATIONS-004`. La acción de archivo de Stitch se representa como
  eliminación confirmada porque el producto todavía no define un estado
  `archived`.

## Reglas

- **BR-01:** Todas las lecturas y mutaciones son owner-scoped. Una postulación
  inexistente o ajena devuelve `applications.not_found`, sin revelar cuál de
  ambas condiciones ocurrió.
- **BR-02:** Las etapas se muestran completas, en el orden determinista de
  `SPEC-APPLICATIONS-004`, con CTA para agregar y navegación a detalle/edición.
  El estado del tablero no es una etapa del proceso.
- **BR-03:** Nota y recursos son privados y de sólo lectura. Sólo recursos
  HTTP(S) pueden abrirse, siempre mediante el navegador externo del sistema.
- **BR-04:** El CV asociado debe pertenecer al candidato y estar `ready`. Al
  cargar un PDF nuevo se reserva, carga y confirma con el flujo existente sin
  convertirlo en principal; luego se lo asocia a la postulación. Si falla esa
  asociación, el CV nuevo queda disponible en Biblioteca y el anterior sigue
  asociado.
- **BR-05:** La descarga se genera en backend con una URL firmada breve y
  `download: displayName`, para forzar el nombre original y la descarga del
  objeto privado.
- **BR-06:** Las habilidades reflejan exactamente `not_requested`, `pending`,
  `completed` o `failed`. Sin análisis no se inventan datos ni se ofrece CTA.
- **BR-07:** Al salir de `draft` sin fecha de postulación, se solicita la fecha
  antes de persistir el cambio de estado.
- **BR-08:** Eliminar desde el detalle requiere confirmación explícita. Al
  confirmarse se elimina mediante el contrato owner-scoped existente, se
  invalidan las consultas de postulaciones y se vuelve a Home.
- **BR-09:** Volver desde el detalle y cancelar la creación dirigen
  explícitamente a Home; no dependen del historial del navegador. Así una URL
  profunda abierta o recargada conserva una salida funcional.

## Criterios de aceptación

- **AC-01:** Pulsar una tarjeta de Home abre el detalle sin interferir con el
  arrastre ni el menú contextual.
- **AC-02:** En móvil hay pestañas Resumen y Etapas. En Expo Web expandido el
  resumen y la línea de etapas se muestran simultáneamente en columnas.
- **AC-03:** Resumen presenta información general, condiciones,
  compensaciones, descripción HTML sanitizada de sólo lectura, habilidades, CV,
  nota y recursos. Todo campo opcional vacío dice “Sin especificar”; cada
  colección tiene además su estado vacío propio.
- **AC-04:** Resumen, etapas, nota y recursos se cargan con consultas
  independientes: un error recuperable de un módulo no bloquea los demás.
  La ausencia o el error del detalle muestra un estado not-found/reintento.
- **AC-05:** El estado actual es un selector accesible en la cabecera. Cambios
  de estado y CV refrescan el detalle e invalidan las consultas de Home.
- **AC-06:** El CV permite descarga directa, elección de cualquier CV listo,
  quitar la asociación y cargar un PDF nuevo. La nota conserva saltos de línea
  y muestra su última actualización.
- **AC-07:** La interfaz ofrece foco visible, objetivos de 48 dp, navegación
  por teclado en web, localización ES/EN y reduced motion.
- **AC-08:** El detalle conserva una jerarquía visual específica en 390, 768 y
  1280 CSS px: identidad y acción de estado en cabecera; metadatos escaneables;
  módulos diferenciados para skills, CV, recursos y nota; y timeline en vez de
  tarjetas de etapas. En Web expandido conserva la composición asimétrica
  principal/secundaria y la navegación de postulaciones.
- **AC-09:** En Web expandido, la cabecera presenta Cambiar estado y Eliminar
  postulación como acciones separadas; la eliminación sólo se ejecuta tras la
  confirmación destructiva.
- **AC-10:** El CV se presenta como recurso compacto: el nombre admite hasta
  dos líneas con padding vertical estable, la selección ocupa la fila y la
  descarga es un icon button accesible dentro de ella. Cada compensación se
  presenta de forma plana dentro de Detalles: importe destacado y periodicidad
  como chip discreto, sin una superficie anidada.
- **AC-11:** Cada recurso muestra su tipo de asset como chip localizado; el CV
  usa el tipo CV y los enlaces sin tipo explícito usan Enlace/Link.

## Contrato

Procedimientos tRPC protegidos, con entradas y salidas Zod en
`@palea/contracts`:

- `applications.get({ applicationId })`
- `applications.listStages({ applicationId })`
- `applications.getNote({ applicationId })`
- `applications.listResources({ applicationId })`
- `applications.updateResume({ applicationId, resumeId })`
- `resume.createDownload({ resumeId })`

## Arquitectura cliente

- **NFR-01:** TanStack Query es el único dueño del estado remoto; detalle,
  etapas, nota, recursos y CVs listos son consultas separadas.
- **NFR-02:** tRPC sólo se usa en datasources. Repositorios y casos de uso
  dependen de puertos de datos y los datasources validan respuestas con Zod.
- **NFR-03:** El HTML de descripción ya llega sanitizado desde backend y se
  representa mediante un componente específico de sólo lectura, sin toolbar ni
  edición.
- **NFR-04:** La vista de detalle sólo compone ruta, ViewModel y coordinación.
  Sus secciones reciben dependencias explícitas, nunca el ViewModel completo.
  El cierre de sesión es una operación de Core: cierra la sesión local, limpia
  cache remoto y ejecuta limpiezas locales registradas sin acoplar features.

## Mapeo de pruebas

- BR-01/04/05: servicios backend, tRPC y Supabase disponible.
- BR-02/03/06/07/08: contratos, servicios y ViewModel.
- BR-09: prueba unitaria de la navegación explícita a Home y flujos de detalle
  y creación recargados en Expo Web.
- AC-01/02/03/06/07: componentes y navegación móvil/web.
- AC-08: QA visual en 390, 768 y 1280 CSS px contra las referencias Stitch
  indicadas y pruebas de composición responsive.
- AC-09: interacción de confirmación, navegación a Home e invalidación tras
  eliminar.
- AC-10: componentes de recurso y compensación en los breakpoints de QA visual.
- AC-11: recursos y CV con tipo de asset en chip localizado.
- AC-04/05: ViewModel, consultas independientes e invalidación TanStack Query.
- NFR-01/02/03: tests de datasource/repositorio y revisión de fronteras de
  imports.
- NFR-04: pruebas de limpieza de sesión y revisión de dependencias de la vista.
