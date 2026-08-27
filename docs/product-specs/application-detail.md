---
id: SPEC-APPLICATIONS-003
title: Detalle de postulación del candidato
status: approved
version: 1.0
stories: [CU-86ajvbvd3]
last_reviewed: 2026-08-27
---

# Detalle de postulación

## Alcance

El candidato abre una postulación propia desde Home en
`/applications/[applicationId]`. El detalle permite consultar el resumen,
compensaciones, descripción, habilidades, etapas, nota, recursos y CV; cambiar
el estado y asociar, reemplazar, quitar, cargar o descargar un CV. Aplica a
Expo nativo y Expo Web; `apps/web` queda fuera de alcance.

La edición general y eliminación pertenecen a CU-86ajvbve7. El CRUD de etapas,
notas y recursos pertenece a sus tareas respectivas: esta entrega sólo los
consulta.

## Reglas

- **BR-01:** Todas las lecturas y mutaciones son owner-scoped. Una postulación
  inexistente o ajena devuelve `applications.not_found`, sin revelar cuál de
  ambas condiciones ocurrió.
- **BR-02:** Las etapas se muestran completas, de más reciente a más antigua.
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

## Mapeo de pruebas

- BR-01/04/05: servicios backend, tRPC y Supabase disponible.
- BR-02/03/06/07: contratos, servicios y ViewModel.
- AC-01/02/03/06/07: componentes y navegación móvil/web.
- AC-04/05: ViewModel, consultas independientes e invalidación TanStack Query.
- NFR-01/02/03: tests de datasource/repositorio y revisión de fronteras de
  imports.
