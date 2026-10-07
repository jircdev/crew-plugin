# 004 — Guard de shell y protección de archivos de política

- **Status:** Draft
- **Plan:** ecc-adoption ([README](README.md))
- **Date:** 2026-10-07
- **Author role:** OPS
- **Branch:** —
- **Depends on:** [001](001-standards-conformance.md)

## Context

La puerta de calidad de crew vive en el pre-commit, y `git commit --no-verify` o `core.hooksPath` la anulan sin dejar rastro; `compatibility.md` ya lo admite. Hoy los hooks de crew solo miran Edit, Write y `apply_patch`, así que ningún guard ve los comandos de shell.

Un agente también puede apagar sus propios controles editando `crew.json`, `docs/DEVIATIONS.md`, `hooks.json` o los settings. ECC bloquea la edición de configs de linter; en crew los archivos sensibles son estos. Por principio los guards de crew fallan abiertos, pero en un guard contra evasión el error y la evasión dan el mismo resultado.

## Goal

- Un comando con `--no-verify` o `core.hooksPath` queda bloqueado en Claude Code y en Codex.
- Un comando destructivo (borrado recursivo, reset forzado, drop, push forzado) sin objetivo declarado ni rollback produce un aviso.
- Editar un archivo de política exige una entrada en DEVIATIONS; con `quality: enforce` la edición se niega, con `advise` se avisa.
- Los guards contra evasión fallan cerrados ante un error interno y lo dicen en el mensaje.
- Cada exención en DEVIATIONS lleva dueño y fecha de vencimiento.

## Areas to investigate

- Matchers de Bash y PowerShell en Claude Code, y su equivalente en Codex.
- Falsos positivos con comandos compuestos, heredocs y sustitución de comandos.
- Si la falla cerrada aplica también en modo solo (decisión del maintainer).
- Formato del vencimiento dentro del bloque `crew:exempt` sin romper los proyectos existentes.

## Expected deliverable

- Guard PreToolUse de shell y su registro en `hooks.json`.
- Protección de archivos de política en el guard de escritura.
- Parser de exenciones con dueño y vencimiento.
- Tests de paridad Claude/Codex.
- `enforcement.md` y `configuration.md` EN y ES, nota de migración y changelog.

## Estimation

| Milestone | Est. hours | Started | Finished | Actual hours | Notes |
|-----------|-----------|---------|----------|--------------|-------|
| Guard de `--no-verify` y `hooksPath` | 4 | | | | |
| Aviso de comandos destructivos | 3 | | | | |
| Protección de archivos de política contra DEVIATIONS | 5 | | | | |
| Falla cerrada en guards de evasión | 2 | | | | |
| Vencimiento de exenciones | 3 | | | | |
| Paridad con el shell de Codex | 5 | | | | (BC) |
| Tests de paridad de guards | 4 | | | | |
| Docs EN y ES | 3 | | | | |
| Nota de migración | 1 | | | | |
| Release | 1 | | | | |
| Revisión del maintainer | 4 | | | | |
| **Total** | **35** | — | — | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| `git commit --no-verify` queda denegado | unit | node:test | tests/guard-shell.test.js | planned |
| Un error interno del guard de evasión niega la operación | unit | node:test | tests/guard-shell.test.js | planned |
| `rm -rf` sin objetivo declarado produce aviso y no bloquea | unit | node:test | tests/guard-shell.test.js | planned |
| Editar `crew.json` sin entrada en DEVIATIONS se niega con `enforce` | unit | node:test | tests/guard-policy.test.js | planned |
| Una exención vencida se reporta | unit | node:test | tests/ceilings.test.js | planned |
| El mismo comando se bloquea vía Codex | integration | node:test | tests/compatibility.test.js | planned |

## Changes

- (Solo si el objetivo cambia después de In progress.)
