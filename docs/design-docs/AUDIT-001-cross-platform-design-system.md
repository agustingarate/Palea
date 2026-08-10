# AUDIT-001: Cross-platform design-system delivery audit

Date: 2026-08-06  
Related task: [CU-86ajwvh16](https://app.clickup.com/t/86ajwvh16)  
Related spec: `SPEC-DESIGN-MOBILE-001` revision 1.1

## Outcome

The first implementation did not meet the approved visual or quality contract.
It produced a functional native component catalogue, but treated Expo Web as an
incidental rendering target. The result was visibly under-composed on wide
viewports and did not provide sufficiently perceptible state motion.

## Evidence and root causes

| Finding                                            | Cause                                                                                                                        | Violated requirement | Corrective action                                                                                                              |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Mobile stacks stretched across browser widths.     | No shared viewport/breakpoint primitive; templates used only fixed mobile padding.                                           | FR-02, FR-06, BR-05  | Add universal responsive layout hook, centred content frames and responsive grids.                                             |
| Controls looked abrupt when selected.              | Selection changed a conditional text tree instead of animating the selection affordance.                                     | FR-05, NFR-03        | Animate segmented and tab indicators; animate checkbox confirmation and press feedback.                                        |
| Icon quality appeared inconsistent at large sizes. | The adapter did not explicitly preserve stroke behaviour at display sizes and the catalog did not exercise large SVG output. | FR-04, AC-08         | Keep Lucide SVG through `react-native-svg`, use absolute stroke width and test 16–48 dp in the catalog.                        |
| Molecules and layouts lacked hierarchy on desktop. | The catalog grouped every pattern in a single unbounded vertical stream and components did not own adaptive composition.     | FR-02, AC-07         | Recompose the catalog with responsive grids, maximum readable widths, focused forms, and adaptive cards/navigation.            |
| Stitch was reduced to colors and basic radii.      | The audit did not inspect the desktop component boards or web reference screens before implementation.                       | BR-01                | Use the Comprehensive Atomic board, Unified Component Library, and desktop application references as visual acceptance inputs. |
| Work was made directly on `development`.           | The specification-driven branch and ClickUp workflow was not executed before implementation.                                 | Delivery workflow    | Create the blocking bug task and isolated branch before corrective work; link evidence before review.                          |

## Process failure

The initial delivery incorrectly interpreted “mobile components only” as
“mobile-only layouts,” despite the repository being an Expo universal codebase.
It also claimed validation acceptance while `pnpm validate` still failed on
formatting. That was an inaccurate completion statement. Subsequent work must
report failing gates as failing, even when the cause predates the branch.

## Corrected delivery contract

- `@palea/ui-native` is rendered on iOS, Android, and Expo Web.
- Compact, medium, and expanded layout behaviour is a shared primitive, not
  ad-hoc screen styling.
- Every meaningful interactive state has an observable but restrained motion
  transition, with `ReduceMotion.System` honoured.
- Stitch asset v5 remains the token authority; the design boards and desktop
  screens govern responsive composition.
- The catalog is the visual regression surface and must be exercised at 390,
  768, and 1280 CSS px before acceptance.

## Follow-up evidence required

- Expo Web screenshots or manual QA at each viewport.
- iOS and Android compact-layout smoke checks.
- Motion, keyboard/focus, and reduced-motion QA.
- A green `pnpm validate` after pre-existing formatting debt is separately
  resolved or formally excluded by repository policy.
