# Billing, suscripciones y conciliación

Esta guía describe el circuito operativo de suscripciones de Palea. Es fuente de
consulta técnica y de negocio, pero no reemplaza el asesoramiento contable o
legal aplicable antes de producción.

## Principio central

Dinero y acceso son hechos relacionados, pero distintos:

| Asunto                          | Autoridad                                | Copia de Palea                                           |
| ------------------------------- | ---------------------------------------- | -------------------------------------------------------- |
| Identidad de aplicación         | Supabase Auth                            | UUID interno estable                                     |
| Cobros web                      | Paddle                                   | Suscripción y operaciones normalizadas                   |
| Cobros iOS futuros              | Apple App Store                          | Misma proyección neutral                                 |
| Cobros Android futuros          | Google Play                              | Misma proyección neutral                                 |
| Acceso Pro                      | RevenueCat                               | Observaciones append-only y vista vigente                |
| Autorización                    | Nest                                     | Resultado derivado de la proyección local                |
| Contabilidad y evidencia fiscal | Documentos externos, banco y profesional | Referencias operativas; Supabase no es el libro contable |

Una operación aprobada por Paddle, Apple o Google no habilita Pro directamente.
Una observación RevenueCat no demuestra por sí sola que existió o se liquidó un
cobro. Los dos circuitos se concilian sin mezclarlos.

## Flujo web inicial

### Identidad y checkout

1. El usuario inicia sesión con Supabase.
2. Nest obtiene el UUID autenticado y prepara el checkout Paddle.
3. El UUID se envía en el campo personalizado configurado para RevenueCat App
   User ID. No se usa un ID anónimo, email ni documento.
4. Paddle recopila y conserva el medio de pago en su entorno PCI. Palea nunca
   recibe tarjeta, CVV, vencimiento ni token reutilizable.
5. Paddle administra precio, moneda, trial, impuestos, descuentos y renovación.

### Confirmación y acceso

1. Nest recibe el webhook firmado y persiste su envelope y payload antes de
   procesarlo.
2. El evento se deduplica por fuente, ambiente e ID externo.
3. Los hechos Paddle actualizan la suscripción y las operaciones financieras.
4. RevenueCat procesa o importa la compra.
5. Nest reconcilia el cliente con RevenueCat y guarda una observación del
   entitlement `pro`.
6. La vista de acceso toma la última observación vigente. El estado Paddle no
   participa en esa decisión.

### Renovación

Paddle cobra el medio de pago guardado en su entorno. Cada intento puede
registrarse por separado. Una renovación aprobada crea una nueva operación o
actualiza el objeto externo según el contrato del proveedor y produce un nuevo
estado histórico de suscripción.

RevenueCat debe continuar reportando Pro. Si Paddle cobra pero RevenueCat no lo
refleja, se trata como una inconsistencia operativa y se reconcilia; no se altera
manualmente el evento original.

### Cancelación y gracia

Cancelar deshabilita la renovación, pero no implica necesariamente expiración
inmediata. La suscripción financiera conserva su período y estado. Pro continúa
únicamente mientras RevenueCat informe el entitlement activo y no vencido.

`grace_period`, `billing_retry`, `paused` y `canceled` son estados financieros u
operativos; ninguno concede acceso por definición propia.

### Reembolso y contracargo

La compra original permanece inmutable. Cada reembolso, contracargo, reversión o
reversión de contracargo se registra como ajuste separado y vinculado a la
operación original.

Se admiten múltiples reembolsos parciales. La suma, moneda y estado deben venir
del proveedor; Palea no infiere importes. RevenueCat determina el efecto sobre
Pro después de reconciliar el cliente.

## Futuras compras mobile

Cuando se publiquen las aplicaciones:

- iOS usará StoreKit y productos de App Store.
- Android usará Google Play Billing y productos de Play Store.
- RevenueCat vinculará ambas compras al mismo App User ID de Supabase.
- Apple o Google serán la autoridad del dinero y sus comprobantes.
- RevenueCat seguirá siendo la autoridad de Pro.
- Los productos se mapearán a `app_store` o `play_store`; no se rediseñarán
  suscripciones, operaciones ni entitlements.

Las reglas de las tiendas, comisiones y obligaciones de publicación se revisarán
en la entrega mobile correspondiente.

## Modelo de datos operativo

### Catálogo y mappings

- `subscription_plans`: planes internos Free y Pro.
- `subscription_entitlements`: capacidades internas, inicialmente Pro.
- `plan_entitlements`: relación semántica entre plan y capacidades.
- `billing_products`: producto externo por proveedor y ambiente.
- `billing_product_price_refs`: IDs de precios cuando el proveedor los expone
  como objetos separados. Apple o Google pueden no necesitar filas aquí.
- `provider_entitlement_refs`: mapping entre el entitlement externo de una
  autoridad, inicialmente RevenueCat, y el entitlement interno.

Palea no copia precio vigente, moneda, periodicidad, impuestos, trial ni
descuento. Un cambio comercial no requiere migración. Los IDs externos son
únicos dentro de proveedor y ambiente.

### Clientes, suscripciones y acceso

- `billing_customers`: identidad estable de billing, separada del perfil que
  puede eliminarse.
- `billing_customer_external_accounts`: identidades Paddle, RevenueCat u otros
  proveedores por ambiente.
- `customer_subscriptions`: estado financiero actual y normalizado.
- `billing_private.subscription_state_history`: snapshot append-only de cada
  transición.
- `provider_entitlement_observations`: observaciones append-only de RevenueCat.
- `manual_entitlement_grants`: concesiones administrativas inmutables.
- `manual_entitlement_revocations`: revocaciones compensatorias inmutables.
- `active_customer_entitlements`: vista derivada; no almacena autoridad propia.
- `customer_trial_usages`: hecho global e inmutable de trial consumido.

### Eventos y procesamiento

- `billing_private.provider_events`: envelope, payload temporal y hash.
- `billing_private.provider_event_customer_links`: resolución append-only del
  propietario del evento.
- `billing_private.provider_event_processing_attempts`: cada intento, resultado
  y error sanitizado.

El envelope no puede editarse ni eliminarse. La función
`billing_private.purge_expired_provider_event_payloads()` elimina únicamente el
payload cuyo plazo venció y conserva hash, fuente, ID, tipo y timestamps. La
ejecución programada se configurará junto con los workers de billing.

### Operaciones financieras

- `billing_private.financial_operations`: compra inicial, renovación o cargo
  normalizado, con snapshot de totales disponibles.
- `billing_private.financial_adjustments`: reembolso, contracargo o reversión,
  siempre vinculado a su operación original.
- `billing_private.payment_attempts`: intentos independientes cuando el proveedor
  los expone.
- `billing_private.financial_reconciliation_links`: referencia a statement,
  payout, factura u otro documento externo.

Los campos de subtotal, descuento, impuesto, total, comisión, earnings y payout
son snapshots del proveedor y pueden ser nulos cuando el canal no los exponga.
No deben recalcularse para reemplazar el dato original.

## Invariantes de integridad

PostgreSQL debe rechazar cualquier relación que mezcle:

- clientes diferentes;
- sandbox y producción;
- Paddle, App Store, Play Store o RevenueCat incorrectos;
- producto de otro plan;
- cuenta externa de otro propietario;
- transacción de otra suscripción;
- ajuste de otra operación;
- evento de otra fuente o cliente.

Las identidades y mappings no se reasignan. Un proveedor anterior puede
coexistir con uno nuevo durante una migración; las suscripciones existentes no se
transfieren automáticamente.

## Seguridad y roles

Las tablas base de billing no tienen permisos para `anon` ni `authenticated`.
`billing_private` no está incluido en los schemas de la Data API.

Nest aplicará capacidades separadas:

| Capacidad                     | Datos previstos                                    |
| ----------------------------- | -------------------------------------------------- |
| `billing.self.read`           | Plan y acceso efectivo del usuario actual          |
| `billing.support.read`        | Estado, IDs operativos y errores sanitizados       |
| `billing.admin.write`         | Mappings, concesiones y revocaciones auditadas     |
| `billing.finance.read`        | Operaciones, ajustes y reconciliación              |
| `billing.legal_identity.read` | Identidad fiscal mínima, sólo cuando sea necesaria |
| `billing.webhook.process`     | Ingesta, procesamiento y reconciliación técnica    |

Estos nombres documentan el límite futuro; no crean todavía un sistema completo
de roles. Un administrador o contador recibirá DTOs y endpoints específicos, no
acceso indiscriminado a la base ni el secreto `service_role`.

## Retención y privacidad por diseño

Las decisiones legales completas se difieren hasta preparar producción, pero el
modelo incorpora desde ahora:

- minimización de datos;
- schema privado para payloads e identidad fiscal;
- hash conservado después de purgar payloads;
- `retention_class`, `retain_until` y `legal_hold` en evidencia financiera;
- desvinculación del perfil al eliminar la cuenta;
- separación entre identidad interactiva y evidencia retenida;
- operaciones compensatorias en lugar de reescritura histórica.

No se presume que todos los datos deban guardarse diez años. Antes de live, un
contador y un abogado deberán determinar la política por categoría y convertirla
en configuración, jobs y criterios verificables.

## Diagnóstico operativo

### Cobrado sin Pro

1. Confirmar proveedor, ambiente y operación financiera.
2. Verificar el UUID enviado como RevenueCat App User ID.
3. Buscar el evento Paddle y sus intentos de procesamiento.
4. Revisar la integración y el cliente en RevenueCat.
5. Buscar la última observación de entitlement.
6. Ejecutar reconciliación idempotente.
7. Si el incidente continúa, crear una concesión manual acotada con actor y
   motivo; nunca alterar una observación histórica.

### Pro sin cobro visible

1. Identificar si proviene de trial, gracia, App Store, Play Store o una concesión
   manual.
2. Consultar la observación RevenueCat y el producto fuente.
3. Buscar operaciones y ajustes en el proveedor financiero correspondiente.
4. Conciliar sin revocar mientras exista evidencia válida de otra fuente.

### Webhook duplicado

El segundo insert debe fallar por la clave externa. No se vuelve a ejecutar la
operación financiera. Se registra un nuevo intento sólo si corresponde a un
reintento real del procesamiento del mismo evento.

### Webhook fuera de orden

El evento permanece en la evidencia. No puede regresar el estado actual de una
suscripción si ocurrió antes del último aplicado. Se procesa como ignorado o se
usa para reconstrucción histórica, dejando un intento append-only.

### Diferencia entre Paddle y RevenueCat

Paddle resuelve dinero; RevenueCat resuelve acceso. La discrepancia se registra y
reconcilia. Supabase por sí solo no resuelve una disputa financiera ni se usa
para inventar el entitlement esperado.

## Reconciliación y evidencia contable

Por cada período se conservarán fuera de Supabase, con acceso controlado:

- statements y payouts del proveedor;
- exportación de transacciones, ajustes, impuestos y comisiones;
- comprobantes argentinos y respaldo de tipo de cambio cuando corresponda;
- evidencia bancaria de la liquidación;
- exportación RevenueCat necesaria para explicar diferencias de acceso;
- conciliación de bruto, descuentos, impuestos, comisiones, ajustes, neto y banco;
- excepciones y resolución documentada.

Supabase relaciona esos documentos mediante IDs, pero no los reemplaza.

## Configuración por ambiente

Cada ambiente usa proyectos, credenciales, webhooks e IDs separados. Para web
staging:

1. Crear producto, precio mensual y trial en Paddle Sandbox.
2. Integrar Paddle Sandbox con RevenueCat.
3. Crear el entitlement RevenueCat `pro`.
4. Configurar el App User ID personalizado con el UUID de Supabase.
5. Registrar en Supabase sólo producto, precio y referencia de entitlement.
6. Configurar webhooks firmados hacia Nest cuando exista el receptor.
7. Ejecutar compra, trial, renovación, cancelación, gracia, reembolso y restore
   sobre la misma cuenta.
8. Verificar que un restore cruzado se rechace.

Para mobile se repetirán mappings con `app_store` y `play_store`; no se
reutilizarán objetos Paddle.

## Gate antes de producción

No deben habilitarse credenciales live hasta contar con conclusiones escritas
sobre contraparte contractual y fiscal, facturación, monotributo, moneda,
Ingresos Brutos, privacidad, transferencias internacionales, renovación,
cancelación, arrepentimiento, reembolsos, incidentes y retención.

Ese trabajo no bloquea el esquema de staging actual, pero sí el lanzamiento con
cobros reales.

## Referencias de proveedor

- [RevenueCat: integración con Paddle](https://www.revenuecat.com/docs/web/integrations/paddle)
- [RevenueCat: identificación de clientes](https://www.revenuecat.com/docs/customers/identifying-customers)
- [RevenueCat: webhooks](https://www.revenuecat.com/docs/integrations/webhooks)
- [Paddle: transacciones](https://developer.paddle.com/api-reference/transactions/overview)
- [Paddle: ajustes](https://developer.paddle.com/api-reference/adjustments/overview)
