# ADR-009: Autoridades financieras multiplataforma y RevenueCat

Status: accepted

## Contexto

Palea comienza con una suscripción web operada desde Argentina y debe poder
incorporar compras nativas iOS y Android posteriormente. El sistema necesita
separar movimiento de dinero, acceso al producto, identidad interna y evidencia
operativa sin almacenar datos de tarjeta ni acoplar el dominio a un único motor
de cobro.

## Decisión

Paddle Billing será Merchant of Record y autoridad financiera para web. Apple
App Store y Google Play serán las autoridades financieras de sus respectivos
canales cuando se implementen las aplicaciones móviles.

RevenueCat será la autoridad inicial del entitlement `pro` para web, iOS y
Android. Supabase conservará observaciones append-only de RevenueCat y una vista
local de acceso; una suscripción financiera nunca concederá acceso por sí sola.

Nest será la única frontera del dominio de billing:

- inicia checkout autenticado;
- valida firmas y payloads con Zod;
- persiste eventos antes de procesarlos;
- reconcilia el estado consolidado de RevenueCat;
- proyecta hechos financieros del proveedor correspondiente;
- autoriza capacidades usando la proyección local;
- aplica roles administrativos y minimiza cada respuesta.

`anon` y `authenticated` no acceden directamente a tablas base de billing. Los
futuros roles de soporte, administración y finanzas serán capacidades de backend,
no permisos generales sobre toda la base.

## Flujo web seleccionado

Nest prepara el checkout Paddle con el UUID de Supabase en el campo personalizado
configurado como RevenueCat App User ID. Paddle gestiona el cobro y RevenueCat
rastrea o importa la compra mediante su integración. Los webhooks Paddle
actualizan la proyección financiera; una reconciliación RevenueCat actualiza la
proyección de acceso.

No se mezclan ambas autoridades: un estado Paddle no crea un entitlement y un
estado RevenueCat no demuestra un movimiento de dinero.

## Modelo de portabilidad

El modelo interno distingue:

- planes y entitlements propios de Palea;
- productos y precios referenciados por proveedor y ambiente;
- cuentas externas por proveedor y ambiente;
- suscripciones financieras normalizadas;
- operaciones, intentos y ajustes financieros;
- referencias externas de entitlement;
- observaciones de la autoridad de entitlement;
- concesiones y revocaciones manuales.

Los nombres de proveedor son extensibles. `paddle`, `app_store` y `play_store`
pueden coexistir. Agregar Apple o Google requiere mappings y adaptadores, no una
nueva estructura de tablas.

RevenueCat también es reemplazable: `authority_provider` no está codificado como
enum. Cambiar la autoridad exige un ADR, un período de convivencia y un backfill
verificado; Nest no puede asumir silenciosamente esa responsabilidad.

## Evidencia, privacidad y contabilidad

Los eventos, estados históricos, observaciones, operaciones, ajustes, intentos y
acciones administrativas son append-only. Los payloads y la identidad fiscal se
guardan en `billing_private`, fuera de la Data API. Los payloads pueden purgarse
después de su plazo conservando envelope y hash.

Supabase es una proyección operativa auditable, no un libro contable. Paddle,
Apple, Google, los statements, los comprobantes, el banco y la contabilidad
externa conservan la autoridad financiera correspondiente.

No se aplica un plazo genérico a todo dato personal. Cada categoría utiliza una
política de retención explícita y puede quedar alcanzada por legal hold.

## Consecuencias

- El acceso no depende de una llamada sincrónica a RevenueCat.
- Un retraso de RevenueCat puede demorar la proyección de Pro; la reconciliación
  y las concesiones manuales acotadas cubren incidentes operativos.
- Los estados financieros y de acceso pueden diferir temporalmente y deben
  diagnosticarse por separado.
- Las compras mobile podrán incorporarse sin usar Paddle ni rediseñar el dominio.
- Las vistas y endpoints administrativos deberán separar soporte, finanzas y
  administración para mantener mínimo privilegio.

## Alternativas rechazadas

- Derivar Pro directamente del estado Paddle: mezcla autoridad financiera con
  autorización y no funciona de forma uniforme con Apple y Google.
- Usar RevenueCat como evidencia contable: no reemplaza al proveedor financiero.
- Exponer todas las tablas con RLS a cualquier usuario autenticado: amplía la
  superficie de datos y dificulta capacidades administrativas diferenciadas.
- Modelar Paddle en nombres de columnas centrales: dificulta coexistencia y
  migración de proveedor.

## Referencias

- [Suscripciones multiplataforma Free y Pro](../product-specs/web-subscriptions.md)
- [Guía operativa de billing](../BILLING.md)
- [ADR-008: Prisma Client y Supabase CLI](ADR-008-prisma-supabase-migrations.md)
