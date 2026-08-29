# Changelog

All notable changes to this application are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this application uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-23

### Added

- Responsive application creation: a two-step native wizard and a complete
  Expo Web form with optional date, restricted rich text, resume upload,
  compensation ranges, notes, and unsaved-change confirmation.
- Reusable native/web date picker and restricted TenTap rich-text editor in the
  shared UI package.
- Applications home with responsive board and list views, owner-scoped search,
  pagination, drag-and-drop reordering, and localized feedback.
- Authenticated-route protection for login and registration screens.

### Changed

- Every Home add-application CTA opens the creation flow, and moving an
  undated draft now requests its application date atomically with the status.
- Onboarding and application creation share the same resume-upload feature;
  onboarding still makes its upload primary while application uploads do not.
- Board pagination loads a larger initial batch and keeps a moved application
  visible when it falls beyond the currently loaded items.
