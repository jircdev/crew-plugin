# 004 — Guard de shell y protección de archivos de política

- **Status:** Delivered
- **Plan:** ecc-adoption ([README](README.md))
- **Date:** 2026-10-07
- **Author role:** OPS
- **Branch:** main (the plugin ships from main; no feature branch)
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
| Guard de `--no-verify` y `hooksPath` | 4 | 2026-10-07 22:25 -03:00 | 2026-10-07 22:26 -03:00 | 0.02 | Incluye commit -n; push -n se respeta como dry-run |
| Aviso de comandos destructivos | 3 | 2026-10-07 22:26 -03:00 | 2026-10-07 22:26 -03:00 | 0 | Escrito junto con el hito anterior en hooks/lib/shell.js; tiempo contado allí |
| Protección de archivos de política contra DEVIATIONS | 5 | 2026-10-07 22:26 -03:00 | 2026-10-07 22:28 -03:00 | 0.03 | crew.json, .claude/settings*.json y config de Codex; bloque crew:policy |
| Falla cerrada en guards de evasión | 2 | 2026-10-07 22:28 -03:00 | 2026-10-07 22:28 -03:00 | 0 | Implementada dentro de guard-shell y guard-policy; tiempo contado en esos hitos. Aplica en solo también (recomendación SEC; decisión del maintainer pendiente) |
| Vencimiento de exenciones | 3 | 2026-10-07 22:26 -03:00 | 2026-10-07 22:26 -03:00 | 0.02 | Parser único hooks/lib/deviation-lines.js para crew:exempt, crew:standard y crew:policy |
| Paridad con el shell de Codex | 5 | 2026-10-07 22:28 -03:00 | 2026-10-07 22:28 -03:00 | 0.01 | (BC) Matcher cubre shell, local_shell, exec_command y argv; el nombre real de la herramienta de shell en los hooks de Codex no está verificado |
| Tests de paridad de guards | 4 | 2026-10-07 22:28 -03:00 | 2026-10-07 22:28 -03:00 | 0.01 | tests/guards.test.js, 7 tests |
| Docs EN y ES | 3 | 2026-10-07 22:28 -03:00 | 2026-10-07 22:28 -03:00 | 0.02 | enforcement, configuration, compatibility, contributing y plantilla DEVIATIONS |
| Nota de migración | 1 | 2026-10-07 22:30 -03:00 | 2026-10-07 22:31 -03:00 | 0.01 | docs/en|es/migration-0.27.md |
| Release | 1 | 2026-10-07 22:31 -03:00 | 2026-10-07 22:31 -03:00 | 0.01 | Release conjunta 0.27.0 local (003, 004, 005); push pendiente de autorización |
| Revisión del maintainer | 4 | | | | |
| **Total** | **35** | — | — | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| `git commit --no-verify`, `-n` y `core.hooksPath` quedan denegados en proyectos con crew.json, en ambos modos | unit | node:test | tests/guards.test.js | passing |
| Un flag mencionado dentro de comillas o un `git push -n` no se marca | unit | node:test | tests/guards.test.js | passing |
| Un comando destructivo produce aviso y nunca bloquea | unit | node:test | tests/guards.test.js | passing |
| Relajar `crew.json` o los settings se niega con team + enforce salvo registro vigente en crew:policy | unit | node:test | tests/guards.test.js | passing |
| Una exención o registro vencido deja de aplicar | unit | node:test | tests/guards.test.js | passing |
| El mismo comando de shell en forma argv de Codex se bloquea | integration | node:test | tests/guards.test.js | passing |
| La herramienta de shell real de Codex dispara el hook | integration | runtime-smoke | tests/runtime_cases.py (case_codex_no_verify) | passing — Codex 0.130.0-alpha.5, 2026-10-08: la shell nativa llega como `Bash` con `command`; `git commit --no-verify` negado, 0 commits. Sin `plugin_hooks` y confianza en los hooks, el mismo commit pasa |

## Changes

- (Solo si el objetivo cambia después de In progress.)
