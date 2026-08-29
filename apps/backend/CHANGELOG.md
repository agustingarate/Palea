# Changelog

All notable changes to this application are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this application uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-23

### Added

- Protected, transactional application creation with sanitized job
  descriptions, optional dates, notes, exact compensation ranges, and
  owner-validated ready resumes.
- Ready-resume listing and explicit primary-selection semantics for upload
  confirmation.
- Persistence for compensation ranges and deferred job-description and skill
  analysis states.
- Protected tRPC procedures to list, reorder, and delete a candidate's
  applications.
- Owner-scoped application persistence, status ordering, cursor pagination,
  and a Supabase migration for application positions.
