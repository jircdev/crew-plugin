# 006 — Revisión con evidencia

- **Status:** Draft
- **Plan:** ecc-adoption ([README](README.md))
- **Date:** 2026-10-07
- **Author role:** QA
- **Branch:** —
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
| Esquema de hallazgos y severidad unificada | 4 | | | | |
| Rol dueño y verificación adversarial en QA | 4 | | | | |
| Lentes de fallas silenciosas y "must not", con plantilla | 3 | | | | |
| Script de verificación con recibos | 8 | | | | (BC) |
| Guard de recibo | 5 | | | | |
| Comando `/crew:check` | 4 | | | | |
| Evals de revisión | 4 | | | | |
| Paridad Codex | 2 | | | | |
| Tests | 5 | | | | |
| Docs EN y ES | 5 | | | | |
| Migración | 1.5 | | | | |
| Release | 1 | | | | |
| Revisión del maintainer | 7 | | | | |
| **Total** | **53.5** | — | — | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| `verify.js` deja un recibo con código de salida y hash del árbol | unit | node:test | tests/verify.test.js | planned |
| Cerrar con `passing` sin recibo se niega en team | unit | node:test | tests/guard-estimation.test.js | planned |
| En solo, el mismo cierre pasa con aviso | unit | node:test | tests/guard-estimation.test.js | planned |
| Un hallazgo bloqueante sin evidencia queda refutado | manual | evals | evals/review/fixtures.md | planned |
| `/crew:check` devuelve NOT READY si falla un comando declarado | integration | node:test | tests/verify.test.js | planned |

## Changes

- (Solo si el objetivo cambia después de In progress.)
