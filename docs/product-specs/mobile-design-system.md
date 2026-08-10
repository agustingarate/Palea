---
id: SPEC-DESIGN-MOBILE-001
title: Palea cross-platform React Native design system
status: approved
version: 1.2
stories: []
clickup:
  - https://app.clickup.com/t/86ajwvh16
owners: []
last_reviewed: 2026-08-07
supersedes: null
---

# Purpose

Provide a reusable, accessible React Native design system for Palea, rendered
through Expo on native platforms and on the web from the same component
contracts. The visual input is Stitch project `16272299109015713935`, design
system asset `a6d515c031f14cda84550716499c932f` version 5, reconciled by the
rules in [DESIGN.md](../DESIGN.md).

## User-visible behavior

- Mobile UI uses sober warm-neutral surfaces, dark primary actions, and indigo
  only for focus, selection, and intentional highlights.
- Every interactive component exposes its relevant idle, pressed, focused,
  selected, disabled, loading, read-only, and error states.
- Light and dark themes have equivalent semantic contracts.
- Motion gives concise feedback and follows the operating system reduced-motion
  preference.
- Shared components reflow from compact mobile to medium tablet and expanded
  Expo Web layouts without a separate visual implementation.

## Business rules

- **BR-01:** An approved repository specification takes precedence over Stitch.
  Between unreconciled Stitch variants of the same design, the instance located
  farther down and to the right is preferred.
- **BR-02:** Components consume semantic tokens rather than primitive colors.
- **BR-03:** Shared components remain presentational. They do not own routing,
  permissions, persistence, translations, or feature business logic.
- **BR-04:** Date, select, and file controls are accessible controlled triggers;
  feature adapters provide platform pickers and permission flows.
- **BR-05:** Universal components adapt density, width, layout, and navigation
  composition to the available viewport. A mobile layout must not be stretched
  unmodified across a desktop browser.

## Functional requirements

- **FR-01:** `@palea/design-tokens` exports validated primitives, semantic light
  and dark themes, and CSS and NativeWind adapters.
- **FR-02:** `@palea/ui-native` exports the approved atoms, molecules, organisms,
  templates, and responsive layout primitives through typed public interfaces.
- **FR-03:** Buttons, fields, selection controls, navigation, cards, feedback,
  and loading components implement their documented variants and states.
- **FR-07:** Navigation unread counts overlay the icon in compact bottom
  navigation and appear after the item label in horizontal navigation. A primary
  CV is identified by its badge and does not use the selected-surface treatment.
- **FR-04:** Lucide icons are exposed through a finite typed adapter and explicit
  imports.
- **FR-05:** Interaction, checkbox, chips, buttons, accordion, selection,
  tabs, metrics, and skeleton motion use React Native Reanimated and respect
  reduced motion.
- **FR-06:** A development-only Expo catalog screen demonstrates every
  component, theme, state, animation, and compact/medium/expanded composition
  without entering product navigation.

## Acceptance criteria

- **AC-01:** Light and dark themes expose the same semantic keys and satisfy the
  documented contrast requirements.
- **AC-02:** Disabled and loading controls never invoke consumer callbacks.
- **AC-03:** Form errors and selection state are announced accessibly; icon-only
  controls require an accessible label; targets are at least 48 dp.
- **AC-04:** Select, date, and file triggers can be connected to arbitrary
  feature adapters without UI package changes.
- **AC-05:** The mobile demo and full component catalog build after obsolete
  bootstrap UI is removed.
- **AC-06:** Expo Doctor, the mobile smoke build, and `pnpm validate` pass.
- **AC-07:** At 390, 768, and 1280 CSS px, the Expo Web catalog keeps readable
  content widths, structured multi-column composition where appropriate, and
  no horizontal clipping.
- **AC-08:** Selection controls visibly animate their indicator or confirmation
  at 120–180 ms; icons remain SVG vectors at 16–48 dp.

## Non-functional requirements

- **NFR-01:** Text supports platform font scaling and uses Inter at 400, 500,
  600, and 700 weights.
- **NFR-02:** Normal text reaches WCAG AA 4.5:1 contrast; large text and UI
  boundaries reach 3:1.
- **NFR-03:** Motion is short, has a perceivable state transition, does not
  block interaction, and resolves instantly when reduced motion is enabled.
- **NFR-04:** Public props use strict TypeScript types and do not expose domain
  entities or transport types.

## Interfaces and contracts

- Components accept content, plain presentation data, and callbacks from their
  consumer. Controlled values are the source of truth.
- Native `style`, accessibility props, and test identifiers are forwarded where
  appropriate; visual variants remain semantic.
- Product organisms expose small presentation models declared by the UI package.

## Failure modes

- Loading controls preserve their label and expose `accessibilityState.busy`.
- Invalid fields expose visible error text and `accessibilityState.invalid`.
- Missing optional content is omitted without leaving empty interactive targets.
- Empty, loading, and error collections remain distinguishable without relying
  on color alone.

## Accessibility

- Minimum interactive target: 48 by 48 dp.
- Focus and selection combine color with border, shape, label, or icon changes.
- Decorative icons are hidden from accessibility; meaningful icons are labelled
  by their parent or by an explicit label.
- Reanimated uses the system reduced-motion setting.

## Non-goals

The Next.js institutional application (`apps/web`) and its own components,
product navigation flows, custom calendars or bottom sheets, permission
handling, backend work, and unobserved components such as toasts and modals
are excluded. This does not exclude Expo Web rendering of `@palea/ui-native`.

## Test mapping

| Requirement         | Test/evidence                                              |
| ------------------- | ---------------------------------------------------------- |
| FR-01, AC-01        | Token schema, parity, adapter, and contrast tests          |
| FR-02, FR-03        | Native component render and interaction tests              |
| FR-04               | Typed icon adapter build and catalog coverage              |
| FR-05, NFR-03       | Motion configuration, reduced-motion and interaction tests |
| FR-06, AC-07, AC-08 | Development catalog viewport and SVG smoke tests           |
| AC-02, AC-03        | Accessibility and blocked-callback tests                   |
| AC-05, AC-06        | Expo smoke build, Expo Doctor, and root validation         |

## Related decisions

- [ADR-004: Framework-neutral design tokens](../design-docs/ADR-004-design-tokens.md)
- [ADR-002: Mobile architecture](../design-docs/ADR-002-mobile-architecture.md)
