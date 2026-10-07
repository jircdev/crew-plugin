# 002 — Integridad del catálogo y del repo

- **Status:** Draft
- **Plan:** ecc-adoption ([README](README.md))
- **Date:** 2026-10-07
- **Author role:** CREW
- **Branch:** —
- **Depends on:** None

## Context

La completitud de registro de un rol (doc del agente, comando, fila de alias, `roles.md` en EN y ES, skill de Codex, versión en ambos manifiestos y changelog) es hoy una regla escrita que nadie verifica. Cada release la revisa a mano, y un olvido llega al marketplace.

ECC resuelve lo mismo con validadores en CI: frontmatter, conteos de catálogo contra la documentación y un escáner de unicode oculto, bidi y rutas personales. El texto bidi u oculto en un `.md` de rol funciona como inyección de prompt directa, y el catálogo de crew se distribuye a otros proyectos.

## Goal

- Un test falla cuando un rol, alias o skill no está registrado en todas las superficies que exige el rol CREW.
- Un test falla ante frontmatter inválido en agentes, comandos o skills, y ante manifiestos con versiones distintas.
- Un escáner falla ante unicode oculto o bidi, rutas personales o paquetes con IOC conocidos en archivos distribuidos.
- Cada rol tiene un modelo asignado con su justificación escrita en una regla.
- Todo lo anterior corre en CI en Windows y Linux.

## Areas to investigate

- Qué superficies cuentan como registro completo; los aliases retirados tienen que pasar sin falsos positivos.
- Si el escáner de IOC aporta en un repo sin dependencias npm o se limita a unicode y rutas.
- Dónde vive la regla de asignación de modelos: doc del rol CREW o `standards/`.

## Expected deliverable

- Tests nuevos en `tests/` para registro, frontmatter, manifiestos y escáner.
- Regla escrita de asignación de modelo por rol.
- Workflow de CI en Windows y Linux.
- Guía de contribución EN y ES actualizada.
- Entrada de changelog.

## Estimation

| Milestone | Est. hours | Started | Finished | Actual hours | Notes |
|-----------|-----------|---------|----------|--------------|-------|
| Test de completitud de registro | 4 | | | | |
| Validadores de frontmatter y manifiestos | 3 | | | | |
| Escáner de unicode oculto, rutas personales e IOC | 3 | | | | |
| Regla de asignación de modelo por rol | 1.5 | | | | |
| CI Windows y Linux | 1.5 | | | | |
| Guía de contribución EN y ES | 1.5 | | | | |
| Release | 1 | | | | |
| Revisión del maintainer | 2 | | | | |
| **Total** | **17.5** | — | — | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| Un rol sin fila en `roles.md` ES hace fallar el test | unit | node:test | tests/catalog-registry.test.js | planned |
| Un alias retirado pasa sin error | unit | node:test | tests/catalog-registry.test.js | planned |
| Un agente sin `description` hace fallar el validador | unit | node:test | tests/frontmatter.test.js | planned |
| Un `.md` con carácter bidi hace fallar el escáner | unit | node:test | tests/supply-chain.test.js | planned |
| La suite corre verde en Windows y Linux | integration | CI | .github/workflows/ci.yml | planned |

## Changes

- (Solo si el objetivo cambia después de In progress.)
