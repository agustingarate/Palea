---
id: SPEC-BILLING-001
title: Suscripciones multiplataforma Free y Pro
status: approved
version: 2.0
clickup:
  implemented: https://app.clickup.com/t/86ak0kypk
  backend: https://app.clickup.com/t/86ak0kywe
  mobile: https://app.clickup.com/t/86ak0kywt
  operations: https://app.clickup.com/t/86ak0kyx2
  administration: https://app.clickup.com/t/86ak0kyx8
last_reviewed: 2026-08-13
---

# Suscripciones multiplataforma Free y Pro

## Propósito

Palea ofrecerá inicialmente una suscripción web mensual `pro`, con siete días
de prueba para clientes elegibles. El modelo debe admitir posteriormente compras
en iOS y Android sin cambiar sus entidades centrales ni las reglas de acceso.

La primera entrega cubre PostgreSQL, migraciones, seguridad, pruebas y
documentación. Checkout, webhooks Nest, reconciliación y aplicaciones móviles se
implementarán en entregas posteriores.

## Autoridades y canales

| Responsabilidad                 | Autoridad inicial                        | Extensión prevista                                    |
| ------------------------------- | ---------------------------------------- | ----------------------------------------------------- |
| Identidad Palea                 | Supabase Auth                            | Sin cambios                                           |
| Cobro web y catálogo web        | Paddle, como Merchant of Record          | Otro proveedor web mediante nuevo adaptador           |
| Cobro iOS                       | No implementado                          | Apple App Store / StoreKit                            |
| Cobro Android                   | No implementado                          | Google Play Billing                                   |
| Entitlement `pro`               | RevenueCat                               | Puede reemplazarse mediante ADR y backfill explícitos |
| Autorización de funcionalidades | Nest sobre la proyección local           | Sin consultas sincrónicas al proveedor                |
| Evidencia financiera            | Proveedor financiero, statements y banco | Un paquete por proveedor y período                    |

Paddle, App Store y Play Store son autoridades financieras independientes. Una
suscripción o transacción de cualquiera de ellos no concede acceso directamente.
RevenueCat consolida las compras compatibles y emite la evidencia de entitlement
que Nest proyecta en Supabase.

## Flujo web inicial

1. El usuario debe estar autenticado con Supabase antes del checkout.
2. Nest inicia o prepara el checkout Paddle e incluye el UUID de Supabase en el
   campo personalizado configurado como RevenueCat App User ID.
3. Paddle administra el medio de pago, trial, cobro, impuestos, reembolsos,
   disputas y liquidaciones web.
4. La integración Paddle–RevenueCat importa o rastrea la compra.
5. Nest persiste eventos firmados de Paddle y RevenueCat antes de procesarlos.
6. Los eventos Paddle actualizan la proyección financiera y de suscripción.
7. Una reconciliación con RevenueCat produce una observación append-only del
   entitlement.
8. El backend autoriza Pro usando solamente la última observación vigente de la
   autoridad o una concesión manual vigente y no revocada.

## Extensión mobile

Cuando se implementen las aplicaciones móviles:

- iOS usará productos y compras integradas de Apple.
- Android usará productos y compras integradas de Google Play.
- Esos productos se registrarán como `app_store` y `play_store`.
- RevenueCat usará el mismo UUID de Supabase como App User ID.
- Los hechos financieros permanecerán atribuidos a Apple o Google.
- La autorización seguirá consumiendo la misma proyección de entitlements.

No se reutilizará Paddle dentro de las compras nativas cuando las reglas de la
tienda exijan sus motores de pago. Los detalles de StoreKit y Play Billing quedan
fuera de esta entrega.

## Roles y autorización

Nest es la única frontera de lectura y escritura del dominio de billing. Las
tablas base no se conceden a `anon` ni `authenticated`.

Los siguientes perfiles pueden incorporarse sin cambiar el modelo:

- Cliente: consulta únicamente su plan y acceso efectivo mediante API.
- Soporte de billing: consulta estado, eventos sanitizados y diagnóstico, sin
  identidad fiscal ni payloads completos.
- Finanzas/contador: consulta operaciones, ajustes, liquidaciones y evidencia
  mínima necesaria.
- Administrador de billing: administra mappings y crea concesiones/revocaciones
  con actor y motivo.
- Procesador técnico: ingiere webhooks y ejecuta reconciliaciones idempotentes.

La futura autorización por roles se implementará en Nest mediante capacidades y
DTOs separados. No se otorgará acceso amplio a tablas por tener un rol nominal.

## Reglas de negocio

- **BR-01:** todo usuario sin entitlement `pro` vigente tiene estado derivado
  `free`; Free no es una suscripción externa.
- **BR-02:** planes, proveedores y entitlements usan claves extensibles, no enums
  SQL cerrados a Paddle o RevenueCat.
- **BR-03:** el UUID de Supabase es la identidad interna y el RevenueCat App User
  ID. Nunca se usa email, documento ni un ID anónimo para una compra paga.
- **BR-04:** precio, moneda, periodicidad, trial, impuestos y descuentos vigentes
  pertenecen al catálogo del proveedor. Supabase conserva referencias externas y
  snapshots de operaciones ocurridas.
- **BR-05:** un cliente puede utilizar como máximo una prueba por plan entre
  proveedores; el proveedor conserva la decisión final de elegibilidad.
- **BR-06:** una suscripción financiera no concede ni revoca Pro. Sólo una
  observación vigente de la autoridad de entitlements o una concesión manual
  vigente puede concederlo.
- **BR-07:** la observación de RevenueCat debe representar su estado consolidado.
  `billing_retry`, pausa, cancelación o gracia sólo conservan Pro si RevenueCat
  todavía informa el entitlement como activo y no vencido.
- **BR-08:** varias suscripciones financieras pueden coexistir sin fusionar sus
  cobros. RevenueCat determina el acceso agregado.
- **BR-09:** cliente, proveedor, ambiente, producto, cuenta externa, suscripción,
  evento y operación vinculados deben ser coherentes en PostgreSQL.
- **BR-10:** identidades externas, propietarios y mappings no pueden reasignarse.
  Desconectar una cuenta es irreversible; reconectarla crea una nueva identidad.
- **BR-11:** eventos, observaciones, estados históricos, operaciones, ajustes,
  intentos y acciones administrativas son append-only.
- **BR-12:** una concesión manual es inmutable y acotada. Revocarla agrega una
  acción compensatoria única; nunca modifica ni elimina el hecho original.
- **BR-13:** un ajuste financiero referencia obligatoriamente la operación que
  corrige. Se admiten múltiples reembolsos parciales.
- **BR-14:** cada cambio del estado actual de una suscripción exige un evento
  nuevo y genera un snapshot histórico. Un evento anterior no puede regresarlo.
- **BR-15:** `paddle`, `app_store` y `play_store` pueden coexistir como proveedores
  financieros. RevenueCat es inicialmente una autoridad de acceso separada.
- **BR-16:** Palea no almacena PAN, CVV, vencimiento, token reutilizable de pago
  ni datos bancarios del comprador.
- **BR-17:** los payloads crudos se almacenan en un schema privado, conservan un
  hash y pueden purgarse al vencer su plazo sin borrar el envelope del evento.
- **BR-18:** los plazos de conservación se asignan por categoría. No existe un
  plazo genérico de diez años para todo dato personal.

## Estado actual e historial

`customer_subscriptions` es una proyección mutable del estado financiero actual.
Cada transición se copia automáticamente a `subscription_state_history`, que es
append-only. El estado de suscripción sirve para soporte y facturación, pero no
es una credencial de acceso.

`provider_entitlement_observations` conserva observaciones append-only. La vista
`active_customer_entitlements` toma la observación más reciente por cliente,
entitlement, autoridad y ambiente, y la combina con concesiones manuales no
revocadas. No deriva acceso de `customer_subscriptions`.

## Eventos, idempotencia y retención

- El envelope se deduplica por `(source, environment, external_event_id)`.
- El payload se persiste antes de procesar y su hash SHA-256 permanece después
  de la purga.
- La resolución de propietario vive en una relación append-only separada.
- Cada intento de procesamiento es append-only.
- La purga de payloads es una operación explícita, acotada y repetible.
- Operaciones normalizadas y datos fiscales reciben `retention_class`,
  `retain_until` y `legal_hold` según política aprobada.

## Seguridad y privacidad

- `billing_private` no se expone mediante la Data API.
- `anon` y `authenticated` no tienen privilegios sobre tablas base de billing.
- El rol controlado por backend escribe y consulta con DTOs mínimos por caso de
  uso y por capacidad administrativa.
- Identidad fiscal, payloads y evidencia operativa sensible están separados del
  estado que eventualmente se muestra al cliente.
- La eliminación de cuenta desvincula el perfil interactivo, pero no borra
  automáticamente evidencia bajo retención o legal hold.

Antes de producción deben definirse privacidad, derechos del titular,
transferencias internacionales, cancelación, arrepentimiento, reembolsos y
retención. Esta entrega sólo incorpora minimización, separación y capacidad de
purga para no bloquear esas decisiones posteriores.

## Staging y producción

`seed.sql` no contiene IDs comerciales ficticios. La migración sólo crea Free,
Pro y el entitlement interno Pro. Staging y producción usan cuentas, secretos,
webhooks e IDs externos separados.

Staging se considera descartable hasta que se habiliten usuarios de prueba
persistentes. Un reset remoto requiere verificar previamente que Auth, Storage y
las tablas funcionales no contengan datos que deban conservarse.

## Criterios de aceptación

- **AC-01:** una base vacía migra y crea Free, Pro y el entitlement Pro.
- **AC-02:** `anon` y `authenticated` no acceden a tablas base ni al schema
  privado; las operaciones se realizan por backend.
- **AC-03:** mappings externos conservan identidad inmutable y sólo pueden
  retirarse mediante estado.
- **AC-04:** eventos duplicados se rechazan; envelopes e historial no se reescriben.
- **AC-05:** un cliente no puede registrar dos pruebas del mismo plan, aunque
  provengan de tiendas diferentes.
- **AC-06:** Paddle, Apple o Google no conceden Pro; una observación vigente de
  RevenueCat sí puede concederlo o revocarlo.
- **AC-07:** varias fuentes financieras pueden coexistir y RevenueCat consolida
  el acceso.
- **AC-08:** concesiones y revocaciones manuales son inmutables, atribuibles y
  no afectan otras fuentes.
- **AC-09:** una cuenta, compra o suscripción no puede transferirse a otro cliente.
- **AC-10:** eliminar la cuenta desvincula el perfil y conserva únicamente la
  evidencia sujeta a su política de retención.
- **AC-11:** mappings de producto, precio y entitlement son mínimos y no duplican
  términos comerciales.
- **AC-12:** un ID externo no puede reutilizarse dentro del mismo proveedor y
  ambiente.
- **AC-13:** FKs o triggers rechazan inconsistencias de cliente, proveedor,
  ambiente, producto, suscripción, evento y operación.
- **AC-14:** toda transición de suscripción genera historial y exige un evento no
  anterior al último aplicado.
- **AC-15:** cada intento de procesamiento permanece como hecho append-only.
- **AC-16:** la purga elimina sólo el payload vencido y conserva envelope y hash.
- **AC-17:** una compra iOS o Android puede producir el mismo entitlement Pro a
  través de RevenueCat sin rediseñar tablas.
- **AC-18:** operaciones, intentos y ajustes son inmutables; cada ajuste referencia
  la operación original y admite reembolsos parciales.

## No objetivos

- Implementar checkout, webhooks o reconciliación Nest en esta entrega.
- Implementar StoreKit o Google Play Billing antes del lanzamiento mobile.
- Usar Supabase como libro contable o reemplazo de statements del proveedor.
- Diseñar ahora la interfaz completa de administración, soporte o contabilidad.
- Activar cobros live antes de la revisión contable y legal correspondiente.
