# Web institucional

La landing es una superficie pública estática. Su composición sigue una
separación ligera inspirada en Clean Architecture/MVVM, adaptada a Next.js:

```text
app (adaptadores de rutas)
  -> components (presentación y Atomic Design)
  -> features (casos de uso por funcionalidad)
  -> core/*/domain (entidades y puertos puros)
  -> infrastructure (adaptadores concretos)
  -> hooks (ViewModels/client state)
  -> content (copy estático)
```

Las secciones no acceden a APIs ni a datos autenticados. Los hooks encapsulan
scroll, viewport y estados de interacción; los organismos se ensamblan desde
las rutas. Los contratos futuros de sesión y CMS viven en `core` y no conocen
Next, React ni el proveedor que los implemente.
El contenido visible continúa resolviéndose mediante `@palea/localization`.

## Tailwind y CSS

Tailwind está instalado y correctamente conectado a PostCSS mediante las
directivas `@tailwind` y `apps/web/tailwind.config.ts`. Sin embargo, la landing
usa principalmente CSS semántico propio (`globals.css`) para controlar la
composición, responsive y animaciones complejas. No conviene migrar todo
automáticamente: Tailwind puede incorporarse gradualmente en primitives nuevos,
mientras los estilos de animación permanecen en CSS Modules por componente.

La configuración de Next no fuerza `output: 'export'`: las rutas que no usan
datos dinámicos siguen pudiendo prerenderizarse, pero la aplicación queda
habilitada para agregar Server Components, sesión y endpoints sin una
migración de infraestructura posterior.

## Criterios de calidad

- Mantener el HTML semántico y los estados ARIA en componentes interactivos.
- Respetar `prefers-reduced-motion` y mantener el contenido comprensible sin
  animación.
- Priorizar transformaciones compositor-friendly y listeners de scroll pasivos
  coordinados con `requestAnimationFrame`.
- Mantener los mockups como datos estáticos locales, sin dependencias de
  producto, API o autenticación.
