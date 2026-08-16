# SearchableSelect — reconciliación con Stitch

Fecha: 2026-08-16. Alcance: `@palea/ui-native/SearchableSelect` y la composición de nacionalidad en Auth.

| Fuente Stitch | Decisión aplicada |
| --- | --- |
| Palea — Unified Component Library & Design System, selector de CV | Trigger de una línea, chevron y borde neutral equivalente a los campos. |
| Palea — Comprehensive Design System (Atomic) | Tipografías Inter, label/body/body-small, tokens semánticos y estados de error/disabled/focus. |
| Add/Edit Application (Complete) - Web | Trigger con ayuda y foco; el panel conserva el ancho útil del control y limita su altura. |
| Edit Application (Comprehensive) | Filas táctiles de mínimo 48 dp y superficie de selección en modal inferior. |
| Sign Up / Onboarding: Personal Data, mobile y web | Nacionalidad como campo etiquetado, con valor legible y sin solicitar que la persona conozca ISO. |

Stitch no incluye un estado abierto con búsqueda. Se derivó de `TextField`, `SearchField`, `SelectTrigger`, `Surface`, `Icon` y los estados existentes: superficie cálida, borde fino, `accent-subtle` sólo en selección, radio de input en trigger y `radius-lg` en sheet. La duración de la transición se delega al `Modal` nativo para respetar reduced-motion de la plataforma; no se agregaron colores, radios ni tamaños hardcodeados.

El catálogo debe cubrir: cerrado, abierto, búsqueda, selección, leading, error, carga, vacío, disabled y una lista extensa. La lista se renderiza con `FlatList`; el consumidor aporta todos los textos y el leading para que el paquete no conozca idiomas ni dominio.
