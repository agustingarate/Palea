# Changelog

All notable changes to this application are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this application uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Actualización transaccional y owner-scoped de postulaciones, con validación
  de CV listo, sanitización de descripción, invariantes de fecha y reemplazo
  exacto de compensaciones.
- Perfil profesional protegido: detalle localizado con completitud, historial de
  experiencias paginado por cursor, edición owner-scoped y selección atómica de
  habilidades. Los catálogos de intereses y habilidades ahora admiten búsqueda
  localizada y paginación estable.
- Catálogos iniciales bilingües e idempotentes con 45 intereses y 150
  habilidades que cubren sectores profesionales, oficios y capacidades
  transversales.
- Biblioteca de CVs con política centralizada de tamaño y cupo, accesos firmados
  separados para lectura y descarga, validación estructural de PDF y
  autorización por propietario.
- Reservas serializadas, principal único, impacto de borrado, desvinculación de
  postulaciones y limpieza persistida y reintentable de Storage.

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
