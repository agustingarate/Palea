---
id: SPEC-AUTH-001
title: Registro, autenticación y onboarding
status: approved
version: 1.0
story: CU-86ajvbvcd
related_tasks: [CU-86ajvbvdm, CU-86ajvbvdw, CU-86ajvbve4, CU-86ak0kyxg]
deferred_tasks: [CU-86ak0njdz, CU-86ak0njdv]
stitch: projects/16272299109015713935
last_reviewed: 2026-08-13
---

# Registro, autenticación y onboarding

## Propósito y alcance

Palea permite crear una cuenta, iniciar y cerrar sesión y completar un onboarding
profesional opcional desde Expo en web, iOS y Android. Esta entrega habilita
email/contraseña, Google y LinkedIn OIDC. Apple y la validación manual nativa se
difieren por depender de credenciales y dispositivos no disponibles.

Recuperación de contraseña, verificación de email, consentimiento legal y la
Biblioteca completa de CVs quedan fuera de alcance.

## Reglas de negocio

- **BR-01:** El registro exige nombre, email, contraseña y repetición, nacimiento y
  nacionalidad ISO 3166-1 alpha-2.
- **BR-02:** La persona debe tener 18 años. La contraseña exige ocho caracteres,
  una mayúscula, una minúscula y un número.
- **BR-03:** Una identidad social nueva completa una única vez los datos personales
  faltantes antes de comenzar el onboarding.
- **BR-04:** El onboarding es opcional y no se relanza en cada login. Cada paso
  conserva lo guardado aunque el flujo quede incompleto.
- **BR-05:** Se admiten hasta tres intereses, una experiencia inicial y diez
  habilidades únicas.
- **BR-06:** El paso final permite un PDF opcional de hasta 10 MiB. Al confirmarse
  queda como CV principal; un fallo no bloquea omitir el paso.
- **BR-07:** Terminar u omitir registra `onboarding_completed_at`. El aviso posterior
  se calcula por datos faltantes.
- **BR-08:** Logout revoca sólo la sesión del dispositivo actual.
- **BR-09:** Intereses y habilidades mantienen etiquetas en español e inglés.

## Fronteras y autorización

- Supabase Auth es la única frontera directa entre cliente y Supabase.
- Nest valida el access token y es la única frontera para perfiles, onboarding,
  catálogos y Storage.
- `service_role`, conexiones PostgreSQL y secretos OAuth nunca llegan al cliente.
- El ownership siempre deriva del `sub` autenticado, nunca de un ID enviado por el
  cliente.

## Estados y navegación

1. Sin sesión: login o registro.
2. Sesión social incompleta: completar datos personales.
3. Registro nuevo: onboarding opcional en orden perfil, experiencia, habilidades/CV.
4. Sesión existente: pantalla autenticada sin relanzar onboarding.
5. Datos profesionales faltantes: aviso no bloqueante al primer paso correspondiente.

Los formularios conservan valores ante email registrado, credenciales inválidas,
contraseñas distintas, cancelación OAuth, error de red y errores recuperables.

## Contratos

- `account.me` y `account.completeRegistration`.
- `catalogs.onboarding` localizado.
- `onboarding.saveProfile`, `saveWorkExperience`, `saveSkills` y `complete`.
- `resume.reserveUpload`, `confirmUpload` y `cancelUpload`.

Entradas y salidas usan Zod y fechas ISO. Los errores se traducen a códigos estables
sin exponer detalles sensibles.

## Carga de CV

1. Nest reserva un path bajo el UUID autenticado y una fila `pending` con expiración.
2. Devuelve una URL firmada limitada.
3. El cliente carga sin permisos generales sobre el bucket.
4. Nest confirma existencia, tamaño, MIME y firma `%PDF-`.
5. Una transacción marca `ready`, desmarca el principal anterior y marca el nuevo.
6. Cancelaciones, fallos y reservas vencidas eliminan objeto y metadata.

## Criterios de aceptación

- **AC-01:** Registro email crea Auth, perfil y sesión y abre onboarding.
- **AC-02:** Email, Google y LinkedIn restauran sesión en Expo Web.
- **AC-03:** Una identidad social nueva completa datos; una existente no los repite.
- **AC-04:** Cada paso puede guardarse u omitirse sin perder datos ni bloquear acceso.
- **AC-05:** Límites y fechas se validan en todas las fronteras aplicables.
- **AC-06:** PDF válido queda principal; tipo, firma o tamaño inválidos se limpian.
- **AC-07:** La pantalla final muestra “Estas logueado”, logout y aviso si aplica.
- **AC-08:** Una recarga posterior al logout no restaura la sesión cerrada.
- **AC-09:** ES/EN y viewports mobile/desktop funcionan sin overflow horizontal.
- **AC-10:** SQL, backend, frontend, E2E web, Expo Doctor, exports y `pnpm validate`
  pasan; Apple y smoke nativo quedan diferidos.

## Test mapping

| Requisitos               | Evidencia                       |
| ------------------------ | ------------------------------- |
| BR-01–BR-03, AC-01–AC-03 | Contratos, tests Auth y E2E web |
| BR-04–BR-07, AC-04–AC-07 | Tests tRPC, SQL y navegación    |
| BR-06, AC-06             | SQL y tests Storage             |
| BR-08–BR-09, AC-08–AC-09 | Sesión, i18n y responsive       |
| AC-10                    | CI y validación local           |
