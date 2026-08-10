# Palea design system

## Source and precedence

The visual source is Stitch project `16272299109015713935` (Palea Job Search
Tracker), design system asset `a6d515c031f14cda84550716499c932f` version 5.
The mobile component audit covers the 32 mobile screens plus the Comprehensive
Atomic and Unified Component Library boards.

Approved repository specifications and ADRs take precedence over generated
artifacts. If two unreconciled Stitch variants represent the same design, prefer
the instance farther down and to the right. Once reconciled here, this document
is authoritative until deliberately revised.

## Principles

- Sober, modern, concise, and reassuring during a stressful job search.
- Fast entry and scanning before decoration.
- Warm neutral surfaces, restrained elevation, and one interaction accent.
- Hierarchy through type, spacing, and weight rather than color alone.
- Accessible by construction: scalable text, 48 dp targets, visible focus,
  explicit states, sufficient contrast, and reduced-motion support.

## Foundations

- **Primary action:** ink `#070F17`; white foreground in light mode.
- **Interaction:** indigo `#4E5FD6` for focus, selection, and a single important
  highlight; indigo subtle `#EEF0FF` for selected surfaces. Selection also uses
  a visible border, indicator, label, or icon; color is never its only signal.
- **Surfaces:** warm background `#FCF8F8`, white cards, gray boundaries.
- **Status:** muted green, amber, and red, always paired with text or an icon.
- **Dark theme:** `#121212` background, `#1E1E1E` surface, `#333333` border,
  `#F2F2F2` text, light primary action, and `#AAB5FF` interaction indigo.
- **Type:** Inter; 28/34 display, 24/30 mobile title, 20/28 section, 16/24
  body, 14/20 supporting body, 12/16 label.
- **Spacing:** 4, 8, 16, 24, 32, 48.
- **Radius:** 6 for compact controls, 12 for cards/buttons, 20 for elevated
  containers, full for pills and circular controls.
- **Elevation:** borders before shadows; subtle 1/3 and elevated 4/16 shadows.

Components consume semantic tokens. Raw values live only in
`@palea/design-tokens`; NativeWind and future CSS configuration are generated
from the validated token source.

## Cross-platform composition

`@palea/ui-native` is universal React Native UI, not a mobile canvas scaled to
desktop. It renders through Expo on iOS, Android, and Web from the same public
interfaces. Components use compact (<640), medium (640–1023), and expanded
(1024+) layouts: content gains a readable maximum width, forms remain focused,
and independent cards and controls become two or three columns only where that
improves scanning. The institutional Next.js site is a separate surface and is
not a consumer of these React Native components.

The development catalog must be checked at 390, 768, and 1280 CSS px. A wide
viewport is never an excuse to stretch a phone stack across the page.

## Atomic ownership

- **Atoms:** typography, icons, dividers, surfaces, buttons, badges, avatars,
  progress and loading primitives.
- **Molecules:** labelled fields, selection controls, tabs, resource rows,
  feedback, and compact metric blocks.
- **Organisms:** navigation shells, action bars, accordions, application and CV
  cards, detail modules, timelines, and metric groups.
- **Templates:** safe-area screens, scroll/keyboard layouts, focused forms, and
  form sections.

Shared components are controlled and presentational. Product features own data,
copy, navigation, permissions, and picker adapters. Date, select, and file
components are triggers rather than embedded platform workflows.

## Component states

- Interactive: idle, pressed, focused, selected where relevant, disabled, and
  loading where an asynchronous action exists.
- Fields: empty, focused, filled, read-only, disabled, and error with visible and
  announced feedback.
- Collections: content, loading skeleton, empty, and recoverable error.
- Destructive actions use the danger treatment; confirmation belongs to the
  feature flow rather than the button.

## Motion

Use React Native Reanimated for press feedback (scale and color), checkbox
confirmation (the box only, never its label), segmented and tab selection,
accordion content entry/exit, state entry/exit, metric loading, and skeleton
shimmer. Avoid layout animations on text containers: they can interpolate text
metrics on web and produce a visibly stretched label. Durations are
120 ms (fast), 180 ms (standard), and 240 ms (emphasized); shimmer repeats over
1200 ms. Press scale is 0.98 for controls and 0.94 for icon-only controls.
Always honor the system reduced-motion setting and never make motion necessary
to understand state.

## Iconography

Use Lucide line icons through the `Icon` adapter. Default stroke is 2 with
semantic sizes 16, 20, 24, and 32. Icons inherit semantic foreground colors;
indigo indicates active/selected state only. Import icons explicitly so unused
glyphs do not enter the bundle.

## Scope

This revision defines shared React Native components, whose web rendering is
responsive and uses the same semantic contracts. Navigation adapts from a
mobile bottom bar to a horizontal web navigation; screen-specific web layouts
and product flows remain outside this scope. A development-only catalog is
included to inspect components in compact and expanded viewports.

## Local development

Metro resolves `@palea/ui-native` to its `src` entry while Expo is running in
development. Changes to shared components use Fast Refresh directly; no package
rebuild is required. Production exports keep using each package's public `dist`
entry. Expo Web uses SPA output because the authenticated product does not need
route-level static HTML; the separate Next.js institutional site owns public SEO.
Tokens remain on their public entry because NativeWind consumes them to generate
Tailwind classes. The mobile `prestart` lifecycle rebuilds tokens before Metro
starts, so a restart cannot consume stale token output.
