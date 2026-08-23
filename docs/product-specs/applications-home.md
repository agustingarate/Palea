---
id: SPEC-APPLICATIONS-001
title: Home de postulaciones del candidato
status: approved
version: 1.3
stories: [CU-86ajvbvcg, CU-86ajvbvcp]
last_reviewed: 2026-08-22
---

# Home de postulaciones

## Reglas

- **BR-01:** Sólo el candidato propietario puede leer, mover o eliminar sus postulaciones.
- **BR-02:** Los estados fijos son `draft`, `applied`, `interview`, `offer` y `rejected`; no representan etapas.
- **BR-03:** Cualquier transición entre estados es válida y se persiste antes de considerarse confirmada.
- **BR-04:** En compacto/medio existe sólo listado; en expandido el tablero es inicial y el listado es alternable sin persistencia.
- **BR-05:** Cada candidato define el orden de sus postulaciones dentro de cada estado. Mover una tarjeta permite insertarla antes, entre o después de las tarjetas destino, y conserva ese orden al recargar.

## Criterios de aceptación

- **AC-01:** Cada categoría muestra tarjetas, total, carga, vacío, error recuperable y paginación independiente.
- **AC-02:** La búsqueda por rol o empresa se aplica con debounce y no cruza candidatos.
- **AC-03:** El movimiento entre categorías o posiciones es optimista, vuelve al origen ante error y puede realizarse en tablero web o listado. No muestra éxito si el estado y posición no cambian. Si la posición destino queda fuera del lote cargado, el tablero carga las páginas necesarias para conservar visible la tarjeta movida.
- **AC-04:** Eliminar requiere confirmación y borra sólo recursos de la postulación propietaria.
- **AC-05:** La navegación y el feedback son localizados, accesibles y respetan reduced motion.
- **AC-06:** Durante el arrastre la tarjeta se eleva sobre las columnas, sigue ambos ejes en tablero y el listado realiza auto-scroll al aproximarse a los bordes. La inserción y el cambio de columna se animan sin movimientos bruscos.
- **AC-07:** La tarjeta, selector de vista y menú de acciones respetan la composición compacta de Stitch: densidad legible, selector compacto con iconos y menú flotante de filas con icono.

## Contrato

`applications.list`, `applications.updateStatus` y `applications.delete` son procedimientos tRPC protegidos. `applications.list` devuelve 25 tarjetas por categoría de forma predeterminada y permite un máximo de 50. `updateStatus` recibe opcionalmente `targetIndex` para persistir una inserción dentro de la categoría. Las entradas y salidas usan los esquemas de `@palea/contracts`.

## Arquitectura cliente

- **NFR-01:** TanStack Query es el dueño exclusivo del estado remoto de
  listado, paginación, mutaciones y rollback optimista. El estado local se
  limita a interacción y composición de la vista.
- **NFR-02:** El cliente tRPC queda encapsulado en `TrpcApplicationsDataSource`.
  `ApplicationRepositoryImpl` depende sólo del puerto
  `ApplicationsDataSource` y el datasource parsea las respuestas con Zod.

## Pruebas

BR-01/03/05: servicios y tRPC; AC-01/02: datasource, repositorio y ViewModel;
AC-03/04/06: mutaciones optimistas/UI; AC-05/07: pruebas de componentes y
catálogo; NFR-01/02: fronteras de datasource y cache TanStack Query.
