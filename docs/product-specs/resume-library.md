---
id: SPEC-RESUMES-001
title: Biblioteca de CVs
status: review
version: 1.0
stories:
  - CU-86ajvbvec
clickup: https://app.clickup.com/t/86ajvbvec
stitch: projects/11598020962708609442
---

# Biblioteca de CVs

## Propósito

La persona usuaria administra PDFs privados para reutilizarlos al crear o
editar postulaciones. Las referencias visuales son `CV Library with Integrated
Viewer`, `CV Library with PDF Viewer`, `CV Library - Mobile` y `PDF Viewer -
Mobile` del proyecto Stitch indicado arriba.

## Reglas

- **BR-01:** Sólo se aceptan PDFs válidos, no protegidos, de hasta 10 MiB.
- **BR-02:** Una persona puede conservar hasta diez CVs listos o pendientes.
- **BR-03:** Sólo hay un principal. La primera carga de Biblioteca se vuelve
  principal si no existe uno; cargar desde postulaciones no lo cambia.
- **BR-04:** Borrar un CV desvincula, pero no borra, sus postulaciones.
- **BR-05:** Los objetos permanecen privados; URLs firmadas no se registran.
- **BR-06:** Renombrar sólo cambia el nombre mostrado y de descarga.

## Comportamiento y estados

Biblioteca permite cargar, grid/lista, selección, renombre, principal,
descarga, eliminación confirmada y lectura. En web expandido lista y visor se
presentan simultáneamente; en compacto el visor se abre como pantalla dedicada.
Las colecciones tienen estados de carga, vacío, error recuperable y contenido.
Las mutaciones comunican progreso, error y resultado.

La implementación reconcilia Stitch con los requisitos aprobados: excluye IA y
DOCX, y reemplaza el límite visual de 5 MB por 10 MiB.

## Criterios de aceptación

- **AC-01:** La validación cliente/servidor rechaza MIME, firma, contraseña,
  tamaño y cupo inválidos.
- **AC-02:** Se puede cambiar principal, renombrar y borrar con el impacto de
  postulaciones visible antes de confirmar.
- **AC-03:** El principal se preselecciona en una nueva postulación, y una
  postulación puede conservar, cambiar o quitar su CV.
- **AC-04:** La interfaz conserva los estados y controles accesibles de Stitch
  en 390, 768 y 1280 CSS px.

## No incluido

No incluye creación o análisis por IA, edición de contenido, búsqueda en PDF,
backoffice de límites ni verificación manual en dispositivos móviles.
