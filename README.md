# Palea

Palea es un monorepo TypeScript para acompañar la búsqueda laboral. Incluye una
app de producto con Expo para iOS, Android y Web, un sitio institucional con
Next.js y una API NestJS. Supabase proporciona PostgreSQL, Auth y Storage en
local y en los entornos remotos.

## Aplicaciones

| Aplicación          | Ubicación      | Tecnología                       | URL local                             |
| ------------------- | -------------- | -------------------------------- | ------------------------------------- |
| Producto            | `apps/mobile`  | Expo SDK 54 (iOS, Android y Web) | `http://localhost:8081` para Expo Web |
| Sitio institucional | `apps/web`     | Next.js                          | `http://localhost:3000`               |
| API                 | `apps/backend` | NestJS, REST y tRPC              | `http://localhost:3001`               |

## Requisitos

- [Node.js](https://nodejs.org/) 24 (el proyecto admite `>=24 <25`).
- [Corepack](https://nodejs.org/api/corepack.html), incluido con Node.js, para
  usar pnpm 11.20.0 definido por el proyecto.
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) o Docker
  Engine en ejecución. Supabase CLI lo usa para iniciar PostgreSQL, Auth,
  Storage y Studio localmente.
- Para desarrollo móvil nativo: Expo Go o, preferentemente, un development
  client; Android Studio para Android y Xcode en macOS para iOS.
- Solo para builds distribuidos: una cuenta de Expo/EAS y la CLI de EAS.

No hacen falta cuentas de Supabase, Cloudflare ni Google Cloud para ejecutar el
proyecto en local. No uses credenciales de staging ni de producción en archivos
locales.

## Instalación inicial

Desde la raíz del repositorio:

```bash
corepack enable
corepack prepare pnpm@11.20.0 --activate
pnpm install

# Genera Prisma Client para que la API tenga los tipos de la base de datos.
pnpm --dir apps/backend exec prisma generate

# Genera los artefactos de todas las aplicaciones y paquetes compartidos.
pnpm build
```

Luego crea los tres archivos de configuración local. Se ignoran por Git y no se
deben compartir:

```bash
cp apps/backend/.env.example apps/backend/.env.local
cp apps/mobile/.env.example apps/mobile/.env.local
cp apps/web/.env.example apps/web/.env.local
```

En Windows PowerShell, reemplaza `cp` por `Copy-Item`.

`prisma generate` crea Prisma Client a partir de
`apps/backend/prisma/schema.prisma`; no requiere que Supabase esté iniciado.
Repítelo después de cambiar ese schema. Luego, `pnpm build` genera los
artefactos de todas las aplicaciones y paquetes compartidos, incluidos
`@palea/contracts` y `@palea/trpc`, cuyos tipos y artefactos compilados requiere
NestJS. Repite el build cuando cambies paquetes compartidos, pero no antes de
cada arranque local si no cambiaron.

## Configuración local

### 1. Supabase y Docker

Verifica que Docker esté iniciado y crea el entorno local desde el directorio
del backend:

```bash
cd apps/backend
pnpm exec supabase start
pnpm exec supabase status
```

`supabase start` descarga las imágenes necesarias la primera vez. El comando
`status` muestra las claves reales para la instancia local. Copia la URL y las
claves que muestre en `apps/backend/.env.local` y `apps/mobile/.env.local`;
no dejes los valores de ejemplo si son distintos.

La configuración versionada usa estos puertos locales:

| Servicio        | Dirección                                                 |
| --------------- | --------------------------------------------------------- |
| API de Supabase | `http://127.0.0.1:54321`                                  |
| PostgreSQL      | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Supabase Studio | `http://127.0.0.1:54323`                                  |

Para volver a aplicar todas las migraciones y los datos de prueba locales:

```bash
pnpm exec supabase db reset
```

Las migraciones SQL de `apps/backend/supabase/migrations` son la autoridad del
esquema. No ejecutes `prisma migrate dev` ni `prisma migrate deploy`.

### 2. Backend

Edita `apps/backend/.env.local`. Para una instancia local de Supabase, conserva
las URLs locales y reemplaza las dos claves de ejemplo por las que reportó
`supabase status`:

```dotenv
PORT=3001
CORS_ORIGINS=http://localhost:3000,http://localhost:8081
NODE_ENV=development
PALEA_ENV=development
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_PUBLISHABLE_KEY=<clave-publica-local>
SUPABASE_SERVICE_ROLE_KEY=<clave-service-role-local>
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
DIRECT_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
RESUME_UPLOAD_TTL_SECONDS=600
RESUME_MAX_PENDING_UPLOADS=3
RESUME_MAX_RESERVATIONS_PER_WINDOW=10
RESUME_RESERVATION_WINDOW_SECONDS=3600
```

`SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` y `DIRECT_URL` son secretos del
servidor: nunca los copies a `apps/mobile` o `apps/web`.

### 3. App de producto (Expo)

Edita `apps/mobile/.env.local` según dónde se ejecute la app:

```dotenv
APP_VARIANT=development
EXPO_PUBLIC_PALEA_ENV=development
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_PROJECTS_SOURCE=trpc
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<clave-publica-local>
```

Usa una URL de API alcanzable por el runtime:

| Runtime                  | `EXPO_PUBLIC_API_URL`               |
| ------------------------ | ----------------------------------- |
| Expo Web o simulador iOS | `http://localhost:3001`             |
| Emulador Android         | `http://10.0.2.2:3001`              |
| Dispositivo físico       | `http://<IP-LAN-de-tu-equipo>:3001` |

### Una configuración para varios dispositivos

Si vas a usar la app en un teléfono, emulador, simulador o Expo Web a la vez,
usa la IP LAN de tu equipo en lugar de `localhost`. Así todos apuntan a la misma
API local:

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.1.10:3001
```

Obtén la dirección IPv4 de la interfaz conectada a tu red local con el comando
correspondiente:

| Sistema operativo    | Comando                                | Busca                                                                              |
| -------------------- | -------------------------------------- | ---------------------------------------------------------------------------------- |
| macOS                | `ipconfig getifaddr en0`               | Una dirección como `192.168.x.x` o `10.x.x.x`. Si no devuelve valor, prueba `en1`. |
| Windows (PowerShell) | `Get-NetIPAddress -AddressFamily IPv4` | La dirección de la interfaz Wi-Fi o Ethernet, no `127.0.0.1`.                      |
| Linux                | `hostname -I`                          | La dirección privada de la red, no `127.0.0.1`.                                    |

El teléfono debe estar en la misma red local y el firewall debe permitir
conexiones entrantes al puerto `3001`. No guardes esta IP en valores de EAS ni
en configuración de staging o producción: solo se usa para la API local.
Agrega esa URL de origen a `CORS_ORIGINS` en el backend si el navegador o la app
Web la necesitan. Las variables `EXPO_PUBLIC_*` se incluyen en el cliente y,
por lo tanto, nunca pueden contener secretos.

### 4. Sitio institucional (Next.js)

La configuración local predeterminada en `apps/web/.env.local` es:

```dotenv
NEXT_PUBLIC_PALEA_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3001
```

También son valores públicos, compilados durante el build de Next.js.

## Ejecutar el proyecto completo

En terminales separadas, desde la raíz:

```bash
# Terminal 1: infraestructura local (una sola vez por sesión)
pnpm --dir apps/backend exec supabase start

# Terminal 2: API
pnpm backend

# Terminal 3: sitio institucional
pnpm web

# Terminal 4: producto con Expo; elegí uno
pnpm mobile
pnpm --filter @palea/mobile android
pnpm --filter @palea/mobile ios
pnpm --filter @palea/mobile web
```

Comprueba la API en [http://localhost:3001/health](http://localhost:3001/health).
El comando `pnpm mobile` recompila las dependencias internas requeridas antes de
iniciar Expo. Para detener Supabase al terminar:

```bash
pnpm --dir apps/backend exec supabase stop
```

## Ejecutar cada aplicación

| Objetivo                         | Comando desde la raíz                 |
| -------------------------------- | ------------------------------------- |
| API NestJS en modo watch         | `pnpm backend`                        |
| Sitio Next.js en desarrollo      | `pnpm web`                            |
| Metro / Expo                     | `pnpm mobile`                         |
| Expo en Android                  | `pnpm --filter @palea/mobile android` |
| Expo en iOS                      | `pnpm --filter @palea/mobile ios`     |
| Producto como Expo Web           | `pnpm --filter @palea/mobile web`     |
| Export estático del producto Web | `pnpm --filter @palea/mobile build`   |
| Build de producción del sitio    | `pnpm --filter @palea/web build`      |
| Build de producción de la API    | `pnpm --filter @palea/backend build`  |

Para ejecutar todas las tareas `dev` de los paquetes que las exponen, usa
`pnpm dev`. Normalmente conviene iniciar cada superficie explícitamente para
controlar mejor los puertos y los logs.

## Expo y EAS

El flujo local no requiere EAS. Para usar builds en la nube o contra staging,
instala la CLI, inicia sesión y usa los perfiles ya definidos:

```bash
npm install --global eas-cli
eas login
pnpm --filter @palea/mobile start:staging
eas build --platform android --profile development
```

Los perfiles `development`, `preview` y `production` obtienen sus variables de
EAS. La guía completa de variantes, builds locales y variables por entorno está
en [Configuración de entornos](docs/ENVIRONMENTS.md).

## Validación

Antes de abrir una revisión, ejecuta desde la raíz:

```bash
pnpm validate
```

Incluye formato, lint, reglas de arquitectura, chequeo de tipos, tests y builds.
Para una verificación rápida de formato:

```bash
pnpm format:check
```

## Más documentación

- [Arquitectura](ARCHITECTURE.md): límites entre apps, paquetes y capas.
- [Configuración de entornos](docs/ENVIRONMENTS.md): variables, EAS, Cloudflare
  y Cloud Run.
- [Despliegue](docs/DEPLOYMENT.md): staging, producción y recursos de proveedor.
- [ADR-008](docs/design-docs/ADR-008-prisma-supabase-migrations.md): migraciones
  de Supabase y Prisma.
