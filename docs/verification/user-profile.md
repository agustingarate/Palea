# Perfil de usuario — evidencia de desarrollo

Especificación: [SPEC-PROFILE-001](../product-specs/user-profile.md).
Fecha: 2026-09-01. Rama: `feat/mobile/user-profile-CU-86ajvbvfq`.
Los cambios permanecen locales, sin nuevos commits, push, PR ni despliegue.

## Evidencia técnica ejecutada

- `pnpm validate`: aprobado. Incluye formato, lint, chequeo de arquitectura,
  typecheck, pruebas y builds de todo el monorepo.
- `pnpm --filter @palea/mobile exec expo-doctor`: **18/18** comprobaciones
  aprobadas. El primer intento aislado no pudo resolver `exp.host`; el reintento
  con acceso de red autorizado aprobó las 18 comprobaciones.
- Export web de Expo: `pnpm --filter @palea/mobile build` aprobado.
- Pruebas de la entrega: contratos (21), tRPC (6), backend (44, con CRUD
  owner-scoped de perfil), y mobile (80, con datasource, casos de uso y modelo
  de selección de habilidades) aprobadas dentro de la validación completa.
- `git diff --check` y Prettier focalizado aprobados antes de la validación
  integral.

## Cobertura de la entrega

- Contratos Zod y procedimientos tRPC protegidos para detalle localizado,
  rol/intereses, experiencias con cursor, catálogos y reemplazo atómico de
  habilidades.
- Backend limitado al sujeto autenticado, con error estable para una experiencia
  inexistente o ajena, cursores opacos y catálogos bilingües idempotentes de 45
  intereses y 150 habilidades.
- UI móvil/web responsive para resumen de perfil, identidad de solo lectura,
  rol profesional, historial de experiencias y selector de habilidades.
- Estados loading, empty, error inicial/incremental, disabled, pending y success
  en las colecciones y formularios; las mutaciones conservan borradores y
  actualizan las consultas afectadas.
- Navegación a Perfil desde Home, Biblioteca de CVs y superficies de
  postulaciones; navegación desde creación de postulación conserva la protección
  contra descartar un borrador sin confirmación.
- Accesibilidad adicional: nombre localizado para quitar una habilidad,
  controles deshabilitados durante mutaciones y sin cambios, objetivos táctiles
  del sistema de diseño y nacionalidad localizada con país y bandera.

## QA visual responsive autenticado

Completado el 2026-09-01 sobre una sesión autenticada de `localhost:8081`.

- **375 × 812:** se verificaron el resumen, rol, historial, alta de experiencia
  y habilidades. La cabecera de identidad queda fuera de la tarjeta, los datos
  personales son compactos en dos columnas y los editores preservan una acción
  de retorno visible y navegación inferior.
- **1024 × 900 y 1440 × 900:** se verificaron resumen, historial y habilidades
  con navegación lateral. No se detectó desplazamiento horizontal
  (`document.body.scrollWidth` coincide con el viewport) y las composiciones
  mantienen el ancho y densidad de las referencias Stitch.
- Se comprobó visualmente el loading real del resumen durante una recarga, el
  guardado deshabilitado sin cambios en rol/habilidades y los estados cargados
  con perfil, experiencias y habilidades existentes. Los estados empty, error
  e incremental están cubiertos por las pruebas de ViewModel/datasource y sus
  componentes `CollectionFeedback` en la UI.

## Revisión contra Stitch y correcciones aplicadas

Se revisaron las diez referencias aprobadas de Stitch disponibles localmente. La
revisión del árbol anterior a la comprobación visual detectó y corrigió estos
desvíos concretos respecto de las jerarquías móvil y web:

- En compacto, el shell mostraba marca y un botón de logout como cabecera global.
  Se sustituyó por una top app bar contextual en el resumen; los editores ahora
  comienzan con su propia jerarquía y flecha de retorno, como las referencias.
- El resumen móvil tenía la identidad dentro de una tarjeta alta y los datos
  personales en una sola columna. La identidad ahora es una cabecera compacta y
  la tarjeta conserva nacimiento y nacionalidad en dos columnas, como Stitch.
- La composición desktop podía expandirse hasta el ancho general de contenido.
  El resumen limita ahora su composición de dos columnas a 880 px para mantener
  la densidad de las referencias.
- Las rutas de rol, experiencias y habilidades usaban botones de retorno con
  texto; se reemplazaron por icon buttons accesibles de 48 dp para alinear la
  topología compacta y evitar acciones visualmente pesadas.
- El rol usaba un área de texto sobredimensionada y el encabezado móvil del
  historial partía “Experiencia laboral”. Se reemplazó por un campo de una línea
  y una acción compacta “Agregar”; en desktop el historial se limita a 880 px.

## Correcciones posteriores de jerarquía y responsive

- Información personal ahora separa, mediante un divisor, la identidad (avatar,
  nombre y rol cuando existe) de los datos de sólo lectura en una sola columna.
- Rol profesional y experiencia laboral usan iconos Lucide propios (`BadgeCheck`
  y `Building2`), y sus acciones de edición/gestión se presentan como CTAs con
  icono en lugar de texto plano.
- Rol, experiencia y habilidades incluyen subtítulos consistentes; las
  experiencias distinguen visualmente cargo, empresa y periodo.
- El formulario de rol se contiene en una superficie blanca de ancho editorial
  en web. Los intereses son opcionales, con máximo de tres, sin alerta de mínimo
  ni mensaje de error de selección.
- Gestión de habilidades separa capacidad, habilidades seleccionadas y búsqueda.
  El selector reutilizable presenta sus resultados dentro del dropdown, evitando
  una lista fija irrelevante. Los estados vacíos del resumen y de habilidades
  tienen icono, título, mensaje y CTA compacto. Las pantallas internas incorporan
  breadcrumbs en web.
- QA visual directo realizado a 375 × 812, 708 × 812 y 1440 × 900. El catálogo
  ampliado está definido en el seed idempotente; la instancia autenticada usada
  para QA contiene sólo cinco intereses históricos y requiere ejecutar dicho
  seed desde el flujo de base de datos para materializar la ampliación.
