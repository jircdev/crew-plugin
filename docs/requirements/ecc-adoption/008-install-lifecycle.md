# 008 — Ciclo de vida de la instalación

- **Status:** Delivered
- **Plan:** ecc-adoption ([README](README.md))
- **Date:** 2026-10-07
- **Author role:** CREW
- **Branch:** main (the plugin ships from main; no feature branch)
- **Depends on:** [004](004-shell-guard-and-policy-protection.md)

## Context

`init-project.sh` es idempotente pero no registra qué archivos instaló. No hay forma de saber si un proyecto quedó a medio migrar, si el pre-commit sigue instalado o si una capacidad declarada en `crew.json` apunta a algo que ya no existe. Desinstalar crew de un proyecto hoy es manual.

ECC tiene `doctor`, `repair`, `uninstall`, `--dry-run` y un registro de archivos propios que impide borrar archivos del usuario. Crew puede sumar un diagnóstico que conozca sus propias declaraciones.

## Goal

- `init-project.sh` registra cada archivo que instala y acepta `--dry-run` y `--json`.
- `/crew:doctor` verifica capacidades de `crew.json`, el marcador de migración contra `migrations.json`, el pre-commit, la paridad Claude/Codex, las exenciones vencidas y la conformidad con estándares de 001. Diagnostica y nunca reconfigura solo.
- `repair` y `uninstall` actúan solo sobre archivos registrados.

## Areas to investigate

- Formato y ubicación del registro de instalación.
- Portabilidad del script en Windows.
- Qué hace `repair` ante un archivo registrado que el usuario modificó.

## Expected deliverable

- Registro de instalación, `--dry-run` y `--json`.
- Comando `/crew:doctor`, `repair` y `uninstall`.
- Oficio de diagnóstico en el doc del rol CREW.
- Paridad Codex, tests, docs EN y ES y changelog.

## Estimation

| Milestone | Est. hours | Started | Finished | Actual hours | Notes |
|-----------|-----------|---------|----------|--------------|-------|
| Registro de instalados | 4 | 2026-10-07 22:41 -03:00 | 2026-10-07 22:41 -03:00 | 0.03 | El scaffold pasó a scripts/init-project.js (fuente única) y el .sh queda como wrapper; registro en .crew/install-state.json con hash por archivo |
| `--dry-run` y `--json` | 3 | 2026-10-07 22:41 -03:00 | 2026-10-07 22:41 -03:00 | 0 | Implementados en el mismo archivo; tiempo contado en el hito anterior |
| `/crew:doctor` | 8 | 2026-10-07 22:41 -03:00 | 2026-10-07 22:42 -03:00 | 0.03 | scripts/doctor.js de solo lectura con hallazgos en la forma de standards/findings.md; punto de extensión scripts/lib/doctor-checks.js para 009 y 010 |
| `repair` y `uninstall` | 5 | 2026-10-07 22:42 -03:00 | 2026-10-07 22:42 -03:00 | 0.01 | Solo tocan lo registrado; un archivo editado por el proyecto se conserva; --dry-run en ambos |
| Oficio de diagnóstico en CREW | 2 | 2026-10-07 22:42 -03:00 | 2026-10-07 22:43 -03:00 | 0.01 |  |
| Paridad Codex | 3 | 2026-10-07 22:43 -03:00 | 2026-10-07 22:43 -03:00 | 0.01 | Skill doctor generada; scripts en Node, idénticos en ambos hosts; argumentos documentados en el adaptador |
| Tests | 6 | 2026-10-07 22:43 -03:00 | 2026-10-07 22:43 -03:00 | 0.01 | (BC) tests/install.test.js, incluye el wrapper bash; pasa en Windows con git bash |
| Docs EN y ES | 4 | 2026-10-07 22:43 -03:00 | 2026-10-07 22:43 -03:00 | 0.01 | installation y contributing; comando doctor |
| Release | 1 | 2026-10-07 22:49 -03:00 | 2026-10-07 22:50 -03:00 | 0.01 | Release conjunta 0.29.0 local (008, 009, 010); push pendiente de autorización |
| Revisión del maintainer | 5 | | | | |
| **Total** | **41** | — | — | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| `--dry-run` no escribe nada y lista lo que haría | integration | node:test | tests/install.test.js | passing |
| Un archivo previo nunca se sobrescribe ni se registra como de crew | integration | node:test | tests/install.test.js | passing |
| El hook pre-commit anterior a la 0.24 se migra en el lugar | integration | node:test | tests/install.test.js | passing |
| `/crew:doctor` detecta archivo faltante, migración requerida pendiente y recibos sin comandos | integration | node:test | tests/install.test.js | passing |
| `repair` restaura; `uninstall` conserva lo editado y quita registro y línea del gate | integration | node:test | tests/install.test.js | passing |

## Changes

- (Solo si el objetivo cambia después de In progress.)
