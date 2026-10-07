# 008 — Ciclo de vida de la instalación

- **Status:** Draft
- **Plan:** ecc-adoption ([README](README.md))
- **Date:** 2026-10-07
- **Author role:** CREW
- **Branch:** —
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
| Registro de instalados | 4 | | | | |
| `--dry-run` y `--json` | 3 | | | | |
| `/crew:doctor` | 8 | | | | |
| `repair` y `uninstall` | 5 | | | | |
| Oficio de diagnóstico en CREW | 2 | | | | |
| Paridad Codex | 3 | | | | |
| Tests | 6 | | | | (BC) portabilidad en Windows |
| Docs EN y ES | 4 | | | | |
| Release | 1 | | | | |
| Revisión del maintainer | 5 | | | | |
| **Total** | **41** | — | — | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| `--dry-run` no escribe nada y lista lo que haría | integration | node:test | tests/init-project.test.js | planned |
| `uninstall` deja intacto un archivo no registrado | integration | node:test | tests/init-project.test.js | planned |
| `/crew:doctor` detecta un pre-commit faltante | integration | node:test | tests/doctor.test.js | planned |
| `/crew:doctor` detecta una capacidad declarada que no resuelve | integration | node:test | tests/doctor.test.js | planned |

## Changes

- (Solo si el objetivo cambia después de In progress.)
