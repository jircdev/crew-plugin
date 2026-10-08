# 002 — Integridad del catálogo y del repo

- **Status:** Delivered
- **Plan:** ecc-adoption ([README](README.md))
- **Date:** 2026-10-07
- **Author role:** CREW
- **Branch:** main (the plugin ships from main; no feature branch)
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
| Test de completitud de registro | 4 | 2026-10-07 22:17 -03:00 | 2026-10-07 22:20 -03:00 | 0.05 | Los cuatro hitos siguientes se ejecutaron intercalados con este, sin cortes propios; su tiempo está contado acá |
| Validadores de frontmatter y manifiestos | 3 | 2026-10-07 22:17 -03:00 | 2026-10-07 22:20 -03:00 | 0 | Contado en el hito de registro |
| Escáner de unicode oculto, rutas personales e IOC | 3 | 2026-10-07 22:17 -03:00 | 2026-10-07 22:20 -03:00 | 0 | Contado en el hito de registro. Sin escaneo de IOC: el plugin no tiene dependencias npm ni pip. Corrigió 8 BOM literales en hooks |
| Regla de asignación de modelo por rol | 1.5 | 2026-10-07 22:17 -03:00 | 2026-10-07 22:20 -03:00 | 0 | Contado en el hito de registro; la regla vive en agents/crew.md |
| CI Windows y Linux | 1.5 | 2026-10-07 22:17 -03:00 | 2026-10-07 22:20 -03:00 | 0 | Contado en el hito de registro |
| Guía de contribución EN y ES | 1.5 | 2026-10-07 22:20 -03:00 | 2026-10-07 22:21 -03:00 | 0.02 | |
| Release | 1 | 2026-10-07 22:21 -03:00 | 2026-10-07 22:22 -03:00 | 0.02 | Release conjunta 0.26.0 local: versión, changelog, migración y paquete; push pendiente de autorización; compartida con el 001 |
| Revisión del maintainer | 2 | | | | |
| **Total** | **17.5** | — | — | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| Un rol sin fila en `roles.md` ES hace fallar el test | unit | node:test | tests/catalog.test.js | passing |
| Un alias retirado redirige a un comando o skill que existe | unit | node:test | tests/catalog.test.js | passing |
| Un agente o comando con frontmatter incompleto o con `: ` sin comillas hace fallar el validador | unit | node:test | tests/catalog.test.js | passing |
| Los manifiestos y el changelog llevan la misma versión | unit | node:test | tests/catalog.test.js | passing |
| La asignación de modelo coincide con la regla escrita en el rol CREW | unit | node:test | tests/catalog.test.js | passing |
| Un `.md` con carácter bidi o una ruta personal hace fallar el escáner; un placeholder documentado pasa | unit | node:test | tests/catalog.test.js | passing |
| La suite corre verde en Windows y Linux | integration | CI | .github/workflows/compatibility.yml | not verified — corre en el próximo push; localmente pasa en Windows |

## Changes

- (Solo si el objetivo cambia después de In progress.)
