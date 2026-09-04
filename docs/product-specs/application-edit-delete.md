---
id: SPEC-APPLICATIONS-005
title: Edición y eliminación de postulaciones del candidato
status: approved
version: 1.0
stories: [CU-86ajvbve7]
clickup:
  - https://app.clickup.com/t/86ajvbve7
stitch: projects/16272299109015713935
last_reviewed: 2026-09-04
---

# Edición y eliminación de postulaciones

## Propósito, actor y límites

El candidato autenticado puede actualizar integralmente una postulación propia
o eliminarla desde Home o Detalle. Todas las operaciones son owner-scoped: una
postulación inexistente o ajena responde `applications.not_found`, sin revelar
cuál de ambas condiciones ocurrió.

La nota privada y recursos se preservan al editar, pero su CRUD no pertenece a
esta historia. La captura por URL o imagen sigue informativa y deshabilitada:
no se agrega scraping, OCR, análisis de skills ni automatización.

## Comportamiento visible

- El menú de Home y el CTA de Detalle abren
  `/applications/[applicationId]/edit`.
- La edición precarga exactamente lo persistido. Cuando `resumeId` es `null`,
  no selecciona implícitamente el CV principal.
- Alta y edición comparten un formulario de campos editables. Alta móvil retiene
  el wizard de dos pasos y la nota privada; edición móvil muestra secciones en
  scroll continuo sin nota. Web usa formulario completo agrupado y acciones
  persistentes.
- Se editan empresa, rol, fecha, URL de oferta, ubicación, horario, descripción
  manual, modalidad, dedicación, contratación, duración, CV y compensaciones.
- Guardar refresca detalle, invalida Home, vuelve a Detalle y anuncia éxito.
  Errores conservan el borrador y permiten reintentar. Salir o cancelar sucio
  confirma el descarte; un CV cargado permanece en Biblioteca.
- Eliminar presenta un diálogo destructivo reutilizable que identifica la
  postulación, explica que se eliminan etapas, nota, recursos, compensaciones y
  skills requeridas, y confirma que el CV sobrevive. Bloquea doble envío,
  anuncia pending y permite reintento.
- Home conserva eliminación optimista con rollback. Detalle invalida consultas y
  navega explícitamente a Home tras éxito.

## Reglas de negocio

- **BR-01:** Empresa y rol tienen entre 1 y 120 caracteres. `url` es HTTP(S),
  nullable y de hasta 2048 caracteres. `location` y `schedule` son nullable,
  se recortan y admiten hasta 200 caracteres.
- **BR-02:** `appliedOn` es nullable sólo para `draft`, no puede ser futura con
  respecto al día local del backend en la zona IANA recibida. Una postulación no
  `draft` nunca puede quedar sin fecha.
- **BR-03:** El CV asociado es propio y `ready`; asociar, reemplazar o quitar no
  cambia `isPrimary`. Eliminar nunca borra el CV.
- **BR-04:** Backend sanitiza el HTML y deriva texto plano; mantiene límites de
  `SPEC-APPLICATIONS-002` y no confía en valores derivados por cliente.
- **BR-05:** Compensación esperada y ofrecida son independientes. La actualización
  elimina las previas y crea exactamente las enviadas, atómicamente, bajo las
  validaciones monetarias ya aprobadas.
- **BR-06:** Actualizar conserva estado, posición, etapas, nota, recursos y
  skills requeridas. Eliminar usa cascadas existentes para etapas, nota,
  recursos, compensaciones y skills requeridas. No requiere migración.

## Contratos y arquitectura

- `applications.update(input) -> ApplicationDetail` es tRPC protegido.
  `UpdateApplicationInput` contiene `applicationId`, campos editables,
  compensaciones y `timeZone`; excluye estado, posición, nota, recursos y skills.
- Zod valida entradas y salidas en `@palea/contracts` y datasource. tRPC queda
  en datasource; repositorio y caso de uso dependen de puertos de dominio.
- Actualizar es transaccional y owner-scoped: valida postulación y CV listo,
  sanitiza descripción, reemplaza compensaciones y actualiza sólo campos
  editables. No hay migración ni compatibilidad transitoria.

## Brief de construcción y estados

Stitch es input obligatorio, proyecto `16272299109015713935`:

| Superficie | Referencias | Construcción requerida |
| --- | --- | --- |
| Móvil | `Edit Application Form` (`307069fe46fc4d65ade7098b7d38ac04`), `Improved Form` (`f250ab54dd2f49738cf393fa13dca127`), `Comprehensive` (`38f91f4fcc22451288d6b840cdafe3b1`) | Cabecera con retorno, secciones claras, campos de ancho completo y flujo vertical; edición no muestra pasos ni nota. |
| Web | `Add/Edit Application - Web (Unified)` (`5098dd9742514380a29c14237f54f40c`) | Contenedor centrado amplio, secciones agrupadas, grid cuando hay espacio y acciones persistentes; no tarjetas simétricas genéricas. |
| Detalle/eliminación | `Application Detail - Web (Unified)` (`8ef72d8f0acb467b84f1e9b2597aa2b2`) | Cabecera de identidad con acciones separadas y diálogo destructivo claro. |

Se reutilizan tokens y organismos `@palea/ui-native`. En 390 px hay una
columna; en 768 px se preservan targets de 48 dp; en 1280 px hay agrupación y
acciones persistentes sin overflow. Cada slice cubre light/dark, foco visible,
teclado web, localización ES/EN y reduced motion.

Estados: idle, carga de detalle, error recuperable, biblioteca CV vacía,
validación, guard sucio, carga de CV, pending, error de mutación sin pérdida de
borrador, éxito y eliminación pending/error/reintento. La divergencia deliberada
es mantener URL/imagen de captura deshabilitadas y nota/recursos fuera de
edición, por ser no objetivos aprobados.

## Pruebas

| Requisito | Evidencia |
| --- | --- |
| BR-01/02 | Contratos y servicio: owner, fecha e invariantes de estado. |
| BR-03/04/05 | Servicio: CV, sanitización y compensaciones atómicas. |
| BR-06 | Cascadas de etapas, nota, recursos, compensaciones y skills; CV sobrevive. |
| Cliente | Mapping, caché, rutas, dirty guard, upload, errores, CTAs y regresión de alta. |
| Visual | QA en 390/768/1280 contra Stitch, temas, teclado/foco y overflow. |

## Referencias

- [SPEC-APPLICATIONS-001](applications-home.md)
- [SPEC-APPLICATIONS-002](application-create.md)
- [SPEC-APPLICATIONS-003](application-detail.md)
- [Modelo de datos funcional del MVP](mvp-data-model.md)
- [ADR-002](../design-docs/ADR-002-mobile-architecture.md)
- [ADR-003](../design-docs/ADR-003-client-state.md)
- [ADR-005](../design-docs/ADR-005-trpc-in-nest.md)
- [ADR-006](../design-docs/ADR-006-service-access.md)
