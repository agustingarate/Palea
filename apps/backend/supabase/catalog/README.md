# Catálogo externo por ambiente

Este directorio contiene plantillas operativas, no migraciones ni seeds. Los
productos, precios, trials y ofertas se crean primero en el proveedor y luego se
registran únicamente los IDs que Palea necesita para validar operaciones.

## Configuración web de staging

1. Crear `Palea Pro` en Paddle Sandbox.
2. Crear el precio mensual y configurar el trial de siete días en Paddle.
3. Integrar Paddle Sandbox con RevenueCat.
4. Crear el entitlement RevenueCat `pro` y asociar el producto importado.
5. Configurar el RevenueCat App User ID personalizado con el UUID de Supabase.
6. Copiar `staging.sql.example` como `staging.sql`.
7. Reemplazar los tres placeholders con IDs sandbox reales.
8. Revisar y ejecutar el script después de aplicar las migraciones.

`staging.sql` debe permanecer ignorado por Git. Nunca agregar productos o
precios ficticios a `seed.sql`.

## Registros creados

- `billing_products`: producto financiero Paddle asociado al plan interno Pro.
- `billing_product_price_refs`: precio Paddle dentro de su proveedor y ambiente.
- `provider_entitlement_refs`: entitlement RevenueCat asociado al entitlement
  interno Pro. No se duplica la relación producto–entitlement de RevenueCat.

Supabase no almacena importe, moneda, periodicidad, trial, impuestos ni
descuentos vigentes.

## Verificación

```sql
select
  product.provider,
  product.environment,
  product.external_product_id,
  price.external_price_id
from public.billing_products product
left join public.billing_product_price_refs price
  on price.billing_product_id = product.id
where product.provider = 'paddle'
  and product.environment = 'sandbox';

select
  ref.authority_provider,
  ref.environment,
  ref.external_entitlement_id,
  entitlement.code as internal_entitlement
from public.provider_entitlement_refs ref
join public.subscription_entitlements entitlement
  on entitlement.id = ref.entitlement_id
where ref.authority_provider = 'revenuecat'
  and ref.environment = 'sandbox';
```

## Extensión mobile

Cuando se implemente iOS o Android se agregarán productos `app_store` o
`play_store`. Esos canales pueden no utilizar un objeto de precio separado. El
entitlement RevenueCat Pro y las tablas centrales permanecen iguales.
