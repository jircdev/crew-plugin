# 006 — Revisión con evidencia

- **Status:** Delivered
- **Plan:** ecc-adoption ([README](README.md))
- **Date:** 2026-10-07
- **Author role:** QA
- **Branch:** main (the plugin ships from main; no feature branch)
- **Depends on:** [001](001-standards-conformance.md), [002](002-catalog-integrity.md), propuesta de línea base de alcance (0.26)

## Context

El veredicto de QA y la tabla `## Verification` aceptan `passing` sin prueba de que el test se ejecutó. La severidad de hallazgos existe solo en `design`. ECC aporta tres mecanismos útiles: revisores con salida en JSON y evidencia obligatoria, un verificador adversarial que da por refutado un hallazgo bloqueante si no puede confirmarlo, y la prohibición de inventar un PASS.

Crew puede ir más lejos: cada hallazgo nombra al rol cuya decisión viola, y un `passing` cita un recibo de ejecución.

## Goal

- Los hallazgos de QA siguen un esquema con severidad unificada con `design`, evidencia y rol dueño.
- Cada hallazgo bloqueante pasa por una verificación adversarial con la lente de su rol dueño.
- El veredicto incluye las lentes de fallas silenciosas y de criterios "must not"; la plantilla de stories suma la sección "Must not".
- Un script corre los comandos declarados en `crew.json` `testing` y deja un recibo con comando, código de salida, hora y estado del árbol.
- En team, con `testing` declarado, un `passing` sin recibo se rechaza al cerrar.
- `/crew:check` reporta READY o NOT READY con los comandos declarados.

## Areas to investigate

- Dónde se guardan los recibos y cómo se vinculan a la fila de verificación.
- Fricción con suites lentas o que dependen del entorno.
- Si el guard de recibos entra como migración requerida o como clave opt-in (decisión del maintainer).

## Expected deliverable

- Esquema de hallazgos en el doc de QA y en `design`.
- `scripts/verify.js` con recibos y guard de recibo.
- Comando `/crew:check`.
- Plantilla de stories con "Must not".
- Evals de revisión, paridad Codex, docs EN y ES, migración y changelog.

## Estimation

| Milestone | Est. hours | Started | Finished | Actual hours | Notes |
|-----------|-----------|---------|----------|--------------|-------|
| Esquema de hallazgos y severidad unificada | 4 | 2026-10-07 22:32 -03:00 | 2026-10-07 22:33 -03:00 | 0.02 | standards/findings.md; QA pasa de critical/major/minor/note a la escala blocking/important/refinement de design |
| Rol dueño y verificación adversarial en QA | 4 | 2026-10-07 22:33 -03:00 | 2026-10-07 22:33 -03:00 | 0 | Escrito junto con el esquema; tiempo contado allí |
| Lentes de fallas silenciosas y "must not", con plantilla | 3 | 2026-10-07 22:33 -03:00 | 2026-10-07 22:33 -03:00 | 0.01 | Lentes en standards/findings.md; sección Must not en la plantilla de stories y en FA |
| Script de verificación con recibos | 8 | 2026-10-07 22:33 -03:00 | 2026-10-07 22:34 -03:00 | 0.02 | (BC) scripts/verify.js; recibo con hash verificable en docs/verification/receipts/ |
| Guard de recibo | 5 | 2026-10-07 22:34 -03:00 | 2026-10-07 22:34 -03:00 | 0.01 | Opt-in con testing.receipts: true (invariante 4 de config.js: un campo ausente equivale al comportamiento anterior); resuelve la decisión pendiente sin migración requerida |
| Comando `/crew:check` | 4 | 2026-10-07 22:34 -03:00 | 2026-10-07 22:35 -03:00 | 0.01 | commands/check.md y skill Codex generada |
| Evals de revisión | 4 | 2026-10-07 22:35 -03:00 | 2026-10-07 22:35 -03:00 | 0 | evals/review; tiempo contado en el hito Tests |
| Paridad Codex | 2 | 2026-10-07 22:35 -03:00 | 2026-10-07 22:36 -03:00 | 0.01 | Skill check generada; verify.js corre igual en ambos hosts; argumento --kind documentado en el adaptador |
| Tests | 5 | 2026-10-07 22:35 -03:00 | 2026-10-07 22:35 -03:00 | 0.01 | tests/review.test.js; los evals se escribieron dentro de esta misma ventana |
| Docs EN y ES | 5 | 2026-10-07 22:36 -03:00 | 2026-10-07 22:36 -03:00 | 0.01 | enforcement, configuration, using-crew y contributing |
| Migración | 1.5 | 2026-10-07 22:36 -03:00 | 2026-10-07 22:36 -03:00 | 0.01 | Sin migración requerida: receipts es opt-in; nota en migration-0.28 |
| Release | 1 | 2026-10-07 22:39 -03:00 | 2026-10-07 22:40 -03:00 | 0.01 | Release conjunta 0.28.0 local (006, 007); push pendiente de autorización |
| Revisión del maintainer | 7 | | | | |
| **Total** | **53.5** | — | — | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| `verify.js` corre solo los comandos declarados, deja un recibo con hash y reporta READY / NOT READY | unit | node:test | tests/review.test.js | passing |
| Con `testing.receipts`, cerrar con `passing` sin recibo, con recibo inexistente o editado se niega | integration | node:test | tests/review.test.js | passing |
| Sin `testing.receipts`, el mismo cierre pasa como antes | integration | node:test | tests/review.test.js | passing |
| Un hallazgo bloqueante sin evidencia queda refutado; una línea Must not violada es bloqueante | manual | evals | evals/review/fixtures.md (R2, R3) | not verified — requiere corrida humana |
| `/crew:check` devuelve NOT READY si falla un comando declarado | integration | node:test | tests/review.test.js | passing |

## Changes

- 2026-10-07: el guard de recibos queda opt-in (`testing.receipts: true`) en lugar de migración requerida. Lo decide la invariante 4 de `hooks/lib/config.js`: un campo nuevo es opcional y su ausencia equivale al comportamiento anterior. La línea base de alcance no fue necesaria: el parser de 001 alcanzó.
