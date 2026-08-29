---
id: SPEC-WEB-INSTITUTIONAL-001
status: implemented
---

# Web institucional de Palea

La página institucional de Palea replica la arquitectura e interacción de la
referencia V0 ubicada en `apps/web/palea_referencia/`, adaptada a los tokens
web de Palea y a sus catálogos ES/EN. Es una superficie pública estática y no
consume datos del producto autenticado.

## Architecture note

La implementación se organiza por responsabilidad dentro de `apps/web/src`:
`app` adapta rutas, `components` contiene presentación en Atomic Design,
`hooks` implementa ViewModels/client state, `core/*/domain` contiene contratos
puros y los futuros adaptadores se ubicarán en `infrastructure`. Esta separación
es una aplicación pragmática de Clean Architecture y MVVM, preparada para
sesión, CMS y API sin acoplar la UI a un proveedor.

Tailwind permanece disponible y configurado. Las utilidades se usan para
primitives nuevos y los estilos complejos se separan en CSS Modules por
componente; el CSS global queda reservado para tokens, resets y contratos
cross-cutting.

## Requirements

- **BR-01:** La landing comunica Palea como plataforma para organizar postulaciones, entrevistas y currículums.
- **BR-02:** Mantiene el orden de secciones de la referencia: header, hero, propuesta de valor, funcionalidades, cómo funciona, plataformas, FAQ y contacto.
- **BR-03:** Colores, estados, bordes y focus usan tokens semánticos de Palea; no se usan colores coral de V0.
- **BR-04:** La web institucional es independiente de la aplicación autenticada.
- **BR-05:** Los mockups son demostraciones locales sin datos reales, persistencia ni llamadas a API.
- **BR-06:** Todo texto visible y accesible se resuelve desde los recursos ES/EN.
- **BR-07:** La animación es progresiva, no bloquea la comprensión y respeta `prefers-reduced-motion`.
- **BR-08:** Esta entrega no implementa autenticación, formularios, checkout, pricing real ni integración de producto.

## Acceptance criteria

- **AC-01:** La página renderiza todas las secciones institucionales previstas.
- **AC-02:** Los CTA navegan mediante anclas o placeholders.
- **AC-03:** El hero incluye wordmark, grid, objeto visual, transformación tipográfica y estados ligados al scroll.
- **AC-04:** Funcionalidades ofrece paneles desplazables, chips activos, progreso y demos locales.
- **AC-05:** FAQ tiene apertura exclusiva, estado inicial abierto y atributos ARIA.
- **AC-06:** La composición responde en 390, 768 y 1280 CSS px.
- **AC-07:** La navegación es usable por teclado y conserva alternativas con reduced motion.
- **AC-08:** Los catálogos ES/EN mantienen paridad de claves.
- **AC-09:** Formato, lint, arquitectura, typecheck, tests y build pasan.

## Motion contract

El header usa fondo translúcido tras 24 px de scroll, parallax diferencial y
revelado progresivo del logo. El hero mantiene una sección sticky larga, letras
dispersas/convergentes, escala y acople del wordmark, fade del contenido y
perspectiva del objeto visual. Las secciones posteriores usan reveals, barras de
progreso, carrusel horizontal, timeline y accordion. Reduced motion elimina
animaciones infinitas, scroll smooth, transformaciones del hero y movimiento del
carrusel, dejando todo el contenido disponible en flujo normal.

## Deferred work

Sustituir mockups por vistas fieles de la aplicación terminada, conectar auth,
waitlist/contacto, precios, URLs legales/sociales, analytics de CTA y assets
definitivos.

## Test mapping

| Requirements             | Evidence                                                      |
| ------------------------ | ------------------------------------------------------------- |
| BR-01–BR-08, AC-01–AC-07 | `apps/web/src/app/page.test.tsx` y revisión visual responsive |
| AC-08                    | `packages/localization/src/index.test.ts`                     |
| AC-09                    | `pnpm validate`                                               |
