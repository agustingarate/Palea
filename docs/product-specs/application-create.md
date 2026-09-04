---
id: SPEC-APPLICATIONS-002
title: Alta de postulaciones del candidato
status: approved
version: 1.1
stories: [CU-86ajvbvcw]
clickup:
  - https://app.clickup.com/t/86ajvbvcw
stitch: projects/16272299109015713935
last_reviewed: 2026-08-27
---

# Alta de postulaciones

## Purpose

Permitir que un candidato registre una oportunidad como borrador con el
contexto necesario para organizarla, elegir un CV y comparar condiciones sin
simular automatizaciones que todavía no están disponibles.

## Actors and permissions

El candidato autenticado es el único actor. Sólo puede crear postulaciones con
sus propios CV listos y consultar los CV que le pertenecen. Mobile y Expo Web
acceden exclusivamente mediante procedimientos tRPC protegidos de Nest.

## User-visible behavior

- En mobile el alta es un wizard de dos pasos; en web las mismas secciones se
  muestran en un formulario responsive único.
- Empresa y rol son obligatorios. La fecha de postulación es opcional y no puede
  ser futura. URL de oferta HTTP(S), ubicación y horario son opcionales; URL
  admite hasta 2048 caracteres y ubicación/horario se normalizan a `null` y
  admiten hasta 200.
- La descripción manual admite H1/H2/H3, negrita, cursiva, listas y HTML de
  enlaces ya existente. La toolbar web conserva H1 y no ofrece creación de
  enlaces en esta entrega. URL e imagen siguen el contrato de importación local
  de `SPEC-APPLICATIONS-005`; sólo pueden prellenar localmente el HTML y nunca
  cambian el contrato manual que se envía.
- Modalidad, dedicación, contratación y duración comienzan en `unspecified`.
- Se selecciona el CV principal por defecto, o ninguno si no existe. Un CV nuevo
  queda seleccionado y disponible en Biblioteca sin cambiar el principal.
- Salario esperado y ofrecido son independientes; cada uno permite mínimo,
  máximo o ambos, moneda ISO 4217 y periodicidad por hora, día, semana, mes o año.
- Guardar vuelve a Home con feedback. Cancelar no crea la postulación; un CV que
  ya terminó de subirse se conserva como recurso independiente.

## Business rules

- **BR-01:** La creación es owner-scoped y siempre produce estado `draft` sin
  etapas iniciales.
- **BR-02:** Empresa y rol tienen entre 1 y 120 caracteres. `appliedOn` es
  nullable y, cuando existe, no supera la fecha local corriente calculada por el
  backend usando la zona IANA enviada por el dispositivo.
- **BR-03:** Salir de `draft` sin fecha exige proporcionar una fecha válida en la
  misma mutación que cambia el estado. Volver a `draft` no borra una fecha previa.
- **BR-04:** El backend sanitiza la descripción y deriva el texto plano; no
  confía en el HTML ni en el texto derivados por el cliente.
- **BR-05:** Un CV asociado debe pertenecer al candidato y estar `ready`. Subir
  desde esta pantalla no modifica `is_primary`.
- **BR-06:** Un rango salarial tiene al menos un extremo positivo, moneda válida
  y periodicidad, y cada importe cabe en el rango positivo de PostgreSQL
  `bigint` (`9223372036854775807`). Si ambos extremos existen, el mínimo no
  supera al máximo.
- **BR-07:** Postulación, nota y compensaciones se crean en una transacción. El
  orden dentro de `draft` se serializa por candidato y estado.
- **BR-08:** Skills requeridas y skills de CV se modelan por entidad y permanecen
  sin análisis hasta que exista una implementación backend aprobada.
- **BR-09:** `url`, `location` y `schedule` se persisten al crear y se muestran
  en Detalle; captura por URL/imagen sigue siendo informativa y no consume esos
  campos.

## Acceptance criteria

- **AC-01:** Empresa y rol bastan para crear un borrador con defaults
  `unspecified`, sin fecha, CV, descripción, notas ni compensaciones.
- **AC-02:** Todos los campos opcionales se persisten y se presentan de forma
  localizada; los errores conservan el formulario y muestran feedback accesible.
- **AC-03:** Mobile conserva datos entre los dos pasos y no persiste al avanzar;
  web muestra el formulario completo sin estirar la composición mobile.
- **AC-04:** URL, imagen y skills automáticas tienen estados claros y no invocan
  endpoints ficticios. La importación local aprobada se rige por
  `SPEC-APPLICATIONS-005`.
- **AC-05:** El CV principal se preselecciona; se puede elegir otro, ninguno o
  subir un PDF. El nuevo CV no reemplaza al principal.
- **AC-06:** Todo CTA de agregar postulación de Home abre el alta. Tras guardar,
  Home se invalida, muestra éxito y contiene el nuevo borrador.
- **AC-07:** Al mover desde `draft` sin fecha, se solicita una fecha prellenada
  con hoy y fecha más estado se confirman o fallan juntos.
- **AC-08:** Cancelar un formulario sucio requiere confirmación y no crea datos
  de postulación; informa si un CV subido permanecerá en Biblioteca.

## Non-functional requirements

- **NFR-01:** TanStack Query es dueño exclusivo de CVs y mutaciones remotas;
  TanStack Form administra sólo el borrador local del formulario.
- **NFR-02:** Datasources encapsulan tRPC y parsean entradas/salidas con Zod;
  dominio y componentes compartidos no importan transporte.
- **NFR-03:** Controles, errores, wizard, editor y selectores cumplen WCAG AA,
  targets de 48 dp, focus visible, reduced motion y navegación por teclado.
- **NFR-04:** HTML máximo 100.000 caracteres, texto plano 50.000 y nota privada
  10.000. No se registran CVs, notas, HTML ni credenciales en logs.

## State transitions and invariants

`applications.create` sólo crea `draft`. `applications.updateStatus` permite las
transiciones definidas por `SPEC-APPLICATIONS-001`; si la fila no tiene fecha y
el destino no es `draft`, requiere `appliedOn`. Todos los límites se comparan
como fecha calendario, no como timestamp UTC.

Los análisis de skills usan `not_requested`, `pending`, `completed` y `failed`.
Esta entrega sólo crea `not_requested`; ninguna transición automática se ejecuta.

## Interfaces and contracts

- `applications.create(input) -> application`: protegido y owner-scoped.
- `applications.create` y `applications.updateStatus` reciben `timeZone` IANA
  para validar el día local del candidato.
- `applications.updateStatus` añade `appliedOn?` para completar la fecha al salir
  de borrador.
- `resume.list() -> ready resumes`: principal primero.
- `resume.confirmUpload({ resumeId, makePrimary })`: onboarding usa `true`; alta
  de postulaciones usa `false`.
- Importes viajan como strings de unidades menores y se persisten como `bigint`.

## Failure modes, retries, and concurrency

- Un error de validación se muestra junto al campo y no llama al backend.
- Un error de upload deja el formulario utilizable y permite reintentar.
- Un error de creación no invalida Home ni pierde el borrador local.
- El botón queda bloqueado mientras la mutación está pendiente para evitar
  duplicados causados por interacción repetida.
- Las escrituras que afectan posiciones adquieren el mismo advisory lock
  transaccional por candidato.

## Migration and compatibility

La migración vuelve nullable `applied_on`, agrega compensaciones y preparación
de análisis, y alinea Prisma con el esquema SQL existente. No se mantienen
contratos antiguos: consumidores internos se actualizan en el mismo cambio.

## Security and privacy

Nest sanitiza HTML con allowlist y valida ownership del CV. Las futuras URLs se
procesarán con defensa SSRF, límites de red y sin ejecutar scripts; imágenes y
llamadas de IA permanecerán backend-only. No se habilitan en esta entrega.

## Accessibility

El datepicker expone un único contrato ISO nullable: UI nativa del sistema en
iOS/Android y control de fecha semántico en web. El editor tiene label, error,
estado disabled y toolbar navegable. La toolbar web conserva H1, mantiene una
superficie interactiva de 48 dp y no ofrece inserción de enlaces en esta entrega;
URL e imagen se anuncian como no disponibles.

## Non-goals

Biblioteca completa, scraping backend, OCR/visión remotos, llamadas a Vercel AI,
extracción efectiva de skills y edición manual de skills. La importación local
de `SPEC-APPLICATIONS-005` no es un non-goal; la edición y eliminación se
definen en [SPEC-APPLICATIONS-005](application-edit-delete.md).

## Test mapping

| Requirement       | Test/evidence                                                |
| ----------------- | ------------------------------------------------------------ |
| BR-01/02/06/07    | Contratos, servicio Nest y pruebas SQL                       |
| BR-03, AC-07      | Servicio de transición, ViewModel y modal de fecha           |
| BR-04, NFR-04     | Sanitización, límites y payloads maliciosos                  |
| BR-05, AC-05      | Servicio de CV, repositorio mobile y regresión de onboarding |
| BR-08, AC-04      | Constraints, contratos y estados read-only                   |
| AC-01/02/03/06/08 | Pruebas de formulario, navegación, feedback y CTAs           |
| NFR-01/02         | Query cache, datasource y dependency-cruiser                 |
| NFR-03            | Pruebas de accesibilidad y verificación visual responsive    |

## Related decisions

- [Home de postulaciones](applications-home.md)
- [Edición y eliminación de postulaciones](application-edit-delete.md)
- [Importación local de descripción](job-description-local-import.md)
- [Modelo de datos funcional del MVP](mvp-data-model.md)
- [Mobile design system](mobile-design-system.md)
- [ADR-002](../design-docs/ADR-002-mobile-architecture.md)
- [ADR-003](../design-docs/ADR-003-client-state.md)
- [ADR-005](../design-docs/ADR-005-trpc-in-nest.md)
- [ADR-008](../design-docs/ADR-008-prisma-supabase-migrations.md)
