# Changelog

All notable changes to this application are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this application uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-23

### Added

- Applications home with responsive board and list views, owner-scoped search,
  pagination, drag-and-drop reordering, and localized feedback.
- Authenticated-route protection for login and registration screens.

### Changed

- Board pagination loads a larger initial batch and keeps a moved application
  visible when it falls beyond the currently loaded items.
