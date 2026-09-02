---
id: SPEC-PROFILE-001
title: Perfil de usuario
status: implemented
version: 1.0
story: CU-86ajvbvfq
clickup: https://app.clickup.com/t/86ajvbvfq
stitch: projects/11598020962708609442
base_branch: development
working_branch: feat/mobile/user-profile-CU-86ajvbvfq
pr_target: development
last_reviewed: 2026-09-01
---

# Perfil de usuario

## Propósito y alcance

Palea permite que una persona autenticada consulte su identidad y gestione su
perfil profesional desde Expo en mobile y web. La identidad personal se muestra
en modo de sólo lectura y sin foto: el avatar usa las iniciales del nombre. La
persona puede editar su rol, banda de experiencia e intereses; crear, editar y
eliminar múltiples experiencias laborales; y elegir hasta diez habilidades.

La Biblioteca de CVs y la sugerencia automática de habilidades quedan fuera de
alcance. Intereses y habilidades son catálogos distintos; “skills” y
“habilidades” nombran la misma entidad.

## Reglas de negocio

- **BR-01:** Nombre, email, nacimiento y nacionalidad se muestran en sólo lectura.
  Perfil no cambia identidad ni credenciales.
- **BR-02:** El rol profesional contiene una descripción de 2 a 500 caracteres,
  una banda de experiencia y hasta tres intereses activos, únicos y localizados.
  Los intereses son opcionales.
- **BR-03:** Una persona puede tener múltiples experiencias propias. Cada una
  contiene empresa, cargo, fecha de inicio, fecha de fin opcional y marca de
  empleo actual. Un empleo actual no tiene fecha de fin y una fecha final nunca
  precede a la inicial.
- **BR-04:** Las experiencias se ordenan por `started_on`, `created_at` e `id`,
  todos descendentes. El resumen muestra las tres primeras y el historial usa
  paginación cursor de diez elementos.
- **BR-05:** Una persona puede elegir de cero a diez habilidades activas y
  únicas. El catálogo se busca por etiqueta localizada o slug, sin distinguir
  mayúsculas, y se pagina por cursor en lotes de veinte.
- **BR-06:** Home y Perfil muestran una única alerta no bloqueante si falta al
  menos una sección profesional: rol/intereses, experiencia o habilidades. El
  CTA usa el primer faltante en ese orden y abre su editor; no relanza onboarding.
- **BR-07:** Los errores recuperables conservan el borrador y permiten reintentar.
  Eliminar una experiencia o habilidad requiere una acción explícita; las
  mutaciones completadas invalidan las consultas afectadas antes de presentar
  el estado actualizado.
- **BR-08:** Toda lectura y mutación está limitada al UUID autenticado. El cliente
  nunca accede directamente a tablas de producto.
- **BR-09:** Los catálogos mantienen slugs estables, estado activo y etiquetas
  españolas e inglesas. Los seeds definen una base amplia de áreas profesionales,
  disciplinas, tecnologías, herramientas y capacidades transversales; no se
  derivan datos del texto ilustrativo de Stitch.

## Requisitos funcionales

- **FR-01:** `/profile` muestra iniciales, datos personales, rol profesional,
  las tres experiencias más recientes, habilidades y la alerta de completitud.
- **FR-02:** `/profile/role` edita rol, banda e intereses mediante un formulario
  localizado con selección limitada y guardado accesible.
- **FR-03:** `/profile/experiences` muestra el historial paginado y permite
  reintentar o cargar más sin descartar resultados ya obtenidos.
- **FR-04:** `/profile/experiences/new` y
  `/profile/experiences/[experienceId]/edit` reutilizan el mismo formulario.
  Crear, editar y eliminar reflejan estados pending, success y error.
- **FR-05:** `/profile/skills` muestra contador `x/10`, selección actual con
  eliminación y buscador/selector paginado. Guardar reemplaza atómicamente la
  selección por IDs válidos.
- **FR-06:** Todos los accesos Perfil de navegación compacta y expandida abren
  `/profile`; los avisos de Home y Perfil abren el editor del primer faltante.
- **FR-07:** El perfil y cada colección distinguen idle, loading, empty, error,
  disabled, pending y success. Las cargas posteriores preservan contenido y
  señalan el error recuperable sin reemplazarlo por una pantalla vacía.
- **FR-08:** La experiencia está localizada en español e inglés y responde sin
  overflow a 390, 768 y 1280 CSS px.

## Contratos y arquitectura

Los contratos de entrada y salida se definen con Zod en `@palea/contracts` y se
exponen mediante procedimientos protegidos de tRPC. El detalle de perfil devuelve
la identidad de sólo lectura, etiquetas localizadas, completitud, tres
experiencias resumidas y habilidades. Los catálogos y experiencias usan cursores
opacos. Los IDs de edición y borrado se validan por ownership; un ID inexistente o
ajeno produce el mismo error estable `profile.experience_not_found`.

Mobile implementa una feature `profile` con `presentation -> domain` y
`data -> domain`. Sólo el datasource importa el cliente tRPC. TanStack Query es
la única fuente para consultas, mutaciones, paginación, loading y error remotos;
los ViewModels coordinan casos de uso, navegación y estado local de formulario.

No se requiere migración de estructura: el modelo aprobado ya soporta múltiples
experiencias y catálogos bilingües. Los seeds sí se amplían de forma idempotente.

## Catálogos iniciales

La entrega define un catálogo amplio, no sesgado a empleos tecnológicos, con un
mínimo de 40 intereses y 150 habilidades activas. Debe cubrir de forma explícita:

- tecnología, producto, datos, diseño y medios creativos;
- administración, finanzas, seguros, legal y recursos humanos;
- ventas, marketing, atención al cliente, retail y comercio;
- salud, cuidados, educación, investigación y sector público;
- construcción, mantenimiento, oficios, manufactura y control de calidad;
- logística, transporte, depósito, compras y cadena de suministro;
- gastronomía, hotelería, turismo, eventos y servicios personales;
- agro, ambiente, energía, minería y sustentabilidad;
- gestión, liderazgo, comunicación, idiomas, seguridad y cumplimiento.

Las habilidades incluyen herramientas y tecnologías concretas, conocimientos
sectoriales, capacidades operativas, oficios, certificaciones/cumplimiento y
habilidades transversales. Los intereses representan áreas o tipos de trabajo,
no duplican habilidades. Cada entrada declara `label_es`, `label_en` y un slug
estable. La matriz de curación clasifica cada entrada por sector y tipo para
comprobar la cobertura, sin añadir esa clasificación al contrato público ni al
schema actual. Se revisan duplicados, sinónimos, lenguaje inclusivo y claridad
regional antes de cargar el seed. El nombre interno nunca sustituye una
traducción.

## Construction brief Stitch

### Fuentes

| Superficie                | Mobile                               | Web                                                                    |
| ------------------------- | ------------------------------------ | ---------------------------------------------------------------------- |
| Resumen                   | `81d22b9d7776419ea8b7f506ff31f1dd`   | `5da1dd32120c4fdf8a90e6e36f9acdb7`, `e5b025e3573f4cffa77ff0fa962eb028` |
| Rol                       | `5c6baaee4dfb494a8a9a641bfbd59341`   | `f3838dcc7a5b4331b30d69b5ba1289e6`                                     |
| Experiencias              | `a478d8a9527a4b188f94e2098aa2e997`   | `a7c7b79577864e41a41fb4ae69493105`                                     |
| Formulario de experiencia | adaptación mobile del formulario web | `75620128cdb24c66b4598e08c25e2d45`                                     |
| Habilidades               | `b58ea025de66491aaf3144ee26c39e8a`   | `3a4486118fda4b188f94e2098aa2e997`                                     |

### Composición y comportamiento

Mobile usa top app bar, contenido de una columna y bottom navigation persistente.
El resumen centra identidad e iniciales y apila cards de datos personales, rol,
experiencias y habilidades. Web conserva la navegación lateral compartida y un
contenido centrado: identidad personal en columna izquierda y cards profesionales
en columna derecha. En 768 px la composición cambia a una sola columna legible;
en 1280 px usa dos columnas sin estirar la densidad mobile.

Las acciones primarias usan superficies oscuras; selección y foco usan los tokens
semánticos del design system. Cards, chips, contador, buscador, formularios,
alertas, skeletons, feedback y navegación se extraen como componentes reutilizables.
Todos los icon buttons tienen nombre accesible y objetivo mínimo de 48 dp; el
orden de foco sigue la jerarquía visual y el estado no depende sólo del color.

### Estados

- **Idle/content:** datos actuales, edición disponible y CTA correspondiente.
- **Loading:** skeletons que preservan la geometría de header, cards y filas.
- **Empty:** mensaje y CTA contextual para experiencia o habilidades vacías.
- **Error inicial:** feedback visible con reintento; navegación permanece usable.
- **Error incremental:** conserva filas/chips y permite reintentar la página.
- **Disabled:** límites alcanzados, formulario inválido o acción no aplicable.
- **Pending:** controles afectados bloqueados y con estado busy; el borrador queda.
- **Success:** cache actualizada y confirmación localizada no modal.
- **Selection:** chip, borde, icono y anuncio reflejan selección/remoción.

### Reconciliaciones aprobadas

- La variante web “Limited Experience” gobierna el resumen: máximo tres filas.
- Perfil no muestra ni gestiona CVs aunque otros diseños de onboarding los combinen.
- Datos personales no ofrecen edición aunque el objetivo original de ClickUp fuera
  ambiguo; la decisión de producto del 2026-09-01 los fija en sólo lectura.
- Ubicación y descripción laboral visibles en una variante web se omiten: el
  contrato aprobado contiene sólo empresa, cargo, fechas y empleo actual.
- El formulario mobile se deriva responsivamente del formulario web y de los
  controles aprobados existentes porque Stitch no incluye esa superficie exacta.

## Criterios de aceptación

- **AC-01:** Perfil carga identidad de sólo lectura, rol, tres experiencias y
  habilidades con etiquetas localizadas y sin información de CV.
- **AC-02:** Editar rol persiste descripción, banda y hasta tres intereses activos
  opcionales.
- **AC-03:** “Ver más” abre experiencias ordenadas y paginadas de diez en diez.
- **AC-04:** Crear, editar y eliminar experiencias propias funciona con un único
  formulario y valida fechas y empleo actual.
- **AC-05:** Habilidades permite buscar, paginar, seleccionar, remover y guardar
  hasta diez IDs activos únicos, mostrando el contador exacto.
- **AC-06:** Home y Perfil muestran una sola alerta cuando falta cualquier sección
  profesional; su CTA abre el primer editor faltante y nunca abre onboarding.
- **AC-07:** Errores recuperables preservan borradores y contenido ya cargado.
- **AC-08:** A 390, 768 y 1280 px la implementación replica jerarquía, densidad y
  navegación de Stitch, funciona con teclado/touch y no tiene overflow horizontal.
- **AC-09:** ES/EN, light/dark, nombres accesibles, foco visible, anuncios y
  objetivos táctiles cumplen el design system aprobado.
- **AC-10:** Contratos, backend, mobile, E2E web, build de localización, Expo
  Doctor, smoke test y `pnpm validate` pasan.

## Test mapping

| Requisitos                            | Evidencia                                               |
| ------------------------------------- | ------------------------------------------------------- |
| BR-01, FR-01, AC-01                   | contrato de detalle, service y render del resumen       |
| BR-02, FR-02, AC-02                   | schemas, mutación transaccional y formulario            |
| BR-03–BR-04, FR-03–FR-04, AC-03–AC-04 | service CRUD, ownership, cursor y ViewModels            |
| BR-05, FR-05, AC-05                   | catálogo buscable, límite SQL/Zod y selección           |
| BR-06–BR-07, FR-06–FR-07, AC-06–AC-07 | completitud, navegación, invalidación y retry           |
| BR-08, contratos                      | pruebas owner-scoped y datasource exclusivo             |
| BR-09, FR-08, AC-08–AC-09             | seeds bilingües, i18n, visual y accesibilidad           |
| NFR y AC-10                           | architecture checks, E2E, Expo Doctor y validación raíz |

## Plan Graph Engineering

1. Spec aprobada y catálogos definidos.
2. Contratos Zod/tRPC.
3. Backend owner-scoped y pruebas.
4. Feature mobile domain/data/DI y queries.
5. Slices verticales de resumen/rol, experiencias y habilidades.
6. Rutas, navegación, alerta, localización e invalidación integradas.
7. QA funcional, visual, responsive y accesible.
8. Validación completa y evidencia de entrega.
