---
id: SPEC-PLATFORM-001
title: Configuración segura por ambiente
status: approved
version: 1.0
stories: [CU-86ajz1x7h]
clickup: [https://app.clickup.com/t/86ajz1x7h]
owners: [agustin.garate]
last_reviewed: 2026-08-11
supersedes: null
---

# Configuración segura por ambiente

## Purpose

Palea selecciona y valida configuración de manera consistente en mobile, Expo
Web, sitio institucional y backend, sin mezclar el tipo de binario con el
destino de datos.

## Business rules

- **BR-01:** Una variante mobile (`development`, `preview`, `production`) es independiente del destino (`development`, `staging`, `production`).
- **BR-02:** Staging y producción permanecen como límites de confianza y datos separados; development local no es un ambiente remoto compartido.
- **BR-03:** Las variables de cliente son públicas; secretos sólo se consumen en backend, CI o proveedores.
- **BR-04:** Toda configuración de runtime se valida con Zod en su límite.

## Functional requirements

- **FR-01:** Mobile admite development client local, EAS cloud y EAS local.
- **FR-02:** Mobile usa dos identidades nativas: staging (`com.palea.app.stg` y esquema `palea-stg`) y producción (`com.palea.app` y esquema `palea`). Development client y preview-staging comparten la identidad de staging; producción y preview-production comparten la de producción.
- **FR-03:** Preview puede apuntar a staging o, mediante el perfil manual `preview-production`, a producción con señalización visual explícita. Al compartir identidad con la app publicada, preview-production no puede coexistir con ella en un mismo dispositivo.
- **FR-04:** Web institucional valida variables públicas antes de crear el cliente API.
- **FR-05:** Backend valida `NODE_ENV`, `PALEA_ENV`, puerto y orígenes CORS al iniciar.

## Non-functional requirements

- **NFR-01:** No hay fallbacks silenciosos a localhost, datos en memoria ni producción.
- **NFR-02:** Los perfiles EAS declaran explícitamente su conjunto de variables.
- **NFR-03:** Variables de entorno que afectan builds participan en la caché CI.
- **NFR-04:** El catálogo y runbook de ambientes se mantienen versionados.

## Acceptance criteria

- **AC-01:** Los binarios de staging y producción pueden instalarse juntos; development client y preview-staging comparten la identidad de staging.
- **AC-02:** Los perfiles EAS resuelven el destino aprobado en cloud y con `--local`.
- **AC-03:** `preview-staging` no apunta a producción; `preview-production` muestra una identidad de advertencia.
- **AC-04:** Simuladores y dispositivos físicos tienen instrucciones de conexión local y staging.
- **AC-05:** Web rechaza configuración pública ausente o inválida.
- **AC-06:** Backend rechaza configuración incompleta o CORS inválido.
- **AC-07:** Documentación y harness previenen secretos de cliente y cambios sin validación.

## Security and privacy

Los prefijos `EXPO_PUBLIC_` y `NEXT_PUBLIC_` no pueden contener secretos. No se copian datos productivos a staging. El perfil `preview-production` se usa sólo para verificación interna, no habilita un development client contra producción y reemplaza temporalmente la app publicada en el mismo dispositivo por compartir su identidad.

## Non-goals

No crea UAT, canales EAS Update, credenciales de store ni recursos Cloudflare o Google Cloud. UAT se agregará como un destino explícito en una revisión futura.

## Test mapping

| Requirement                | Test/evidence                   |
| -------------------------- | ------------------------------- |
| BR-01, FR-02, AC-01        | Config Expo y tests de variante |
| BR-03, BR-04, AC-05, AC-06 | Tests de esquemas Zod           |
| FR-01, FR-03, AC-02–AC-04  | Perfiles EAS y runbook          |
| NFR-03, NFR-04, AC-07      | CI, documentación y ai-harness  |

## Related decisions

- [ADR-007](../design-docs/ADR-007-managed-platform-stack.md)
- [Deployment and environments](../DEPLOYMENT.md)
