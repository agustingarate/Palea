---
id: SPEC-AUTH-001
title: Registro, autenticación y onboarding
status: approved
version: 1.1
story: CU-86ajvbvcd
related_tasks: [CU-86ajvbvdm, CU-86ajvbvdw, CU-86ajvbve4, CU-86ak0kyxg]
deferred_tasks: [CU-86ak0njdz, CU-86ak0njdv]
stitch: projects/16272299109015713935
last_reviewed: 2026-08-14
---

# Registro, autenticación y onboarding

## Propósito y alcance

Palea permite crear una cuenta, iniciar y cerrar sesión y completar un onboarding profesional opcional desde Expo en web, iOS y Android. La entrega habilita email/contraseña, Google y LinkedIn OIDC. Apple y la validación manual nativa se difieren por depender de credenciales y dispositivos no disponibles.

Recuperación de contraseña, verificación de email, consentimiento legal y la Biblioteca completa de CVs quedan fuera de alcance.

## Reglas de negocio

- **BR-01:** El registro exige nombre, email, contraseña y repetición, nacimiento y nacionalidad ISO 3166-1 alpha-2.
- **BR-02:** La persona debe tener 18 años. La contraseña exige ocho caracteres, una mayúscula, una minúscula y un número.
- **BR-03:** Una identidad social nueva completa una única vez los datos personales faltantes antes de comenzar el onboarding.
- **BR-04:** El onboarding es opcional y no se relanza en cada login. Cada paso conserva lo guardado aunque el flujo quede incompleto.
- **BR-05:** Se admiten hasta tres intereses, una experiencia inicial y diez habilidades únicas.
- **BR-06:** El paso final permite un PDF opcional de hasta 10 MiB. Al confirmarse queda como CV principal; su ausencia no genera un dato profesional faltante ni bloquea terminar u omitir el onboarding.
- **BR-07:** Terminar u omitir registra `onboarding_completed_at`. El aviso posterior se calcula por el primer dato profesional requerido faltante, nunca por el CV opcional.
- **BR-08:** Logout revoca sólo la sesión del dispositivo actual.
- **BR-09:** Intereses y habilidades mantienen etiquetas en español e inglés.

## Fronteras y arquitectura móvil

- **NFR-01:** Supabase Auth es la única frontera directa entre el cliente y Supabase. Nest es la única frontera para perfiles, onboarding, catálogos y Storage.
- **NFR-02:** La feature mobile sigue `presentation -> domain` y `data -> domain`. El dominio no importa React, Expo, Supabase, tRPC, HTTP ni tipos de plataforma.
- **NFR-03:** Las vistas contienen sólo adaptación de interacción y renderizado. Los hooks ViewModel contienen estado, navegación y coordinación de casos de uso. La composición raíz inyecta implementaciones concretas.
- **NFR-04:** Un datasource encapsula Supabase Auth, tRPC o Storage. Un repositorio implementa un puerto de dominio a partir de esos datasources.
- **NFR-05:** Los formularios usan TanStack Form y los schemas Zod compartidos. Cada campo expone errores localizados, específicos y accesibles antes y durante el envío; el backend vuelve a validar todos los límites.
- **NFR-06:** Las vistas reutilizan `@palea/ui-native`, NativeWind y tokens semánticos. Sólo se crean componentes de composición propios de auth; los controles base no se duplican.

## Estados y navegación

1. Sin sesión: login o registro.
2. Sesión social incompleta: completar datos personales.
3. Registro nuevo: onboarding opcional en orden perfil, experiencia, habilidades/CV.
4. Sesión existente: pantalla autenticada sin relanzar onboarding.
5. Datos profesionales requeridos faltantes: aviso no bloqueante al primer paso correspondiente.

La consulta de perfil se invalida y refresca tras cualquier mutación que cambie sus datos antes de decidir una redirección. Los formularios conservan valores ante email registrado, credenciales inválidas, contraseñas distintas, cancelación OAuth, error de red y errores recuperables.

## Contratos y carga de CV

Los contratos son `account.me`, `account.completeRegistration`, `catalogs.onboarding`, `onboarding.saveProfile`, `saveWorkExperience`, `saveSkills`, `complete`, `resume.reserveUpload`, `confirmUpload` y `cancelUpload`. Entradas y salidas usan Zod y fechas ISO; los errores se traducen a códigos estables sin exponer detalles sensibles.

Una reserva de CV crea una fila `pending` con expiración y path bajo el UUID autenticado. Nest entrega una URL firmada limitada. Al confirmar verifica ownership, expiración, tamaño, MIME y firma `%PDF-`; en una transacción marca el CV `ready`, desmarca el principal previo y marca el nuevo como principal. Cancelaciones, fallos y vencimientos eliminan el objeto; una tarea de limpieza procesa reservas vencidas independientemente de solicitudes posteriores.

## Criterios de aceptación

- **AC-01:** Registro email crea Auth, perfil y sesión y abre onboarding sin pedir de nuevo los datos personales.
- **AC-02:** Email, Google y LinkedIn restauran sesión en Expo Web.
- **AC-03:** Una identidad social nueva completa datos; una existente no los repite.
- **AC-04:** Cada paso puede guardarse u omitirse sin perder datos ni bloquear acceso.
- **AC-05:** Límites y fechas se validan en cliente, contratos, backend y SQL donde corresponda.
- **AC-06:** PDF válido queda principal; tipo, firma, ownership, tamaño o expiración inválidos se rechazan y limpian.
- **AC-07:** La pantalla final muestra “Estas logueado”, logout y aviso si hay un dato profesional requerido faltante.
- **AC-08:** Una recarga posterior al logout no restaura la sesión cerrada.
- **AC-09:** ES/EN y viewports mobile/desktop replican las variantes relevantes de Stitch sin overflow horizontal.
- **AC-10:** SQL, backend, frontend, E2E web, Expo Doctor, exports y `pnpm validate` pasan; Apple y smoke nativo quedan diferidos.

## Test mapping

| Requisitos               | Evidencia                                      |
| ------------------------ | ---------------------------------------------- |
| BR-01–BR-03, AC-01–AC-03 | Forms, contratos, Auth y E2E web               |
| BR-04–BR-07, AC-04–AC-07 | ViewModels, tRPC, SQL y navegación             |
| BR-06, AC-06             | SQL, Storage y pruebas de expiración/ownership |
| BR-08–BR-09, AC-08–AC-09 | Sesión, i18n, visual y responsive              |
| NFR-01–NFR-06, AC-10     | Tests de capas, lint de arquitectura y CI      |

## Estado de aprobación

Esta versión sustituye la implementación previa como base de decisión. Fue aprobada para CU-86ajvbvcd el 2026-08-14 y requiere que `SPEC-DATA-001` mantenga las reglas de nacionalidad, catálogos y cargas de CV aquí referenciadas.
