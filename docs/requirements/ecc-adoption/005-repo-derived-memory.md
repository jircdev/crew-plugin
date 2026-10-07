# 005 — Memoria derivada del repo

- **Status:** Draft
- **Plan:** ecc-adoption ([README](README.md))
- **Date:** 2026-10-07
- **Author role:** COORD
- **Branch:** —
- **Depends on:** propuesta de línea base de alcance (0.26, parser único de work items)

## Context

Una sesión nueva arranca sin saber qué quedó a medias: hitos con `Started` y sin `Finished`, items Delivered que esperan validación, verificaciones `planned` sin artefacto. ECC resuelve la continuidad guardando resúmenes de transcripts e inyectándolos al iniciar; eso cuesta contexto, puede guardar secretos y no se puede verificar.

En crew el estado ya está en el repo. Basta con leerlo y mostrarlo en pocas líneas.

## Goal

- Al iniciar sesión se muestra un bloque de 6 líneas como máximo con hitos abiertos, items esperando validación, verificaciones pendientes y, desde la 0.26, cambios de alcance pendientes.
- Antes de compactar el contexto, un recordatorio pide cerrar el hito abierto.
- Ningún transcript se lee ni se guarda.

## Areas to investigate

- Si Codex expone un evento equivalente a PreCompact.
- Costo del escaneo de work items al iniciar en repos grandes.
- Comportamiento en modo solo, donde el circuito no aplica.

## Expected deliverable

- Lector de estado sobre el parser de work items.
- Bloque en `hooks/session-start.js` y recordatorio en PreCompact.
- Docs EN y ES y changelog.

## Estimation

| Milestone | Est. hours | Started | Finished | Actual hours | Notes |
|-----------|-----------|---------|----------|--------------|-------|
| Lector de estado | 4 | | | | |
| Bloque de SessionStart | 4 | | | | |
| Recordatorio en PreCompact | 2 | | | | |
| Paridad Codex | 2 | | | | (BC) falta confirmar PreCompact en Codex |
| Tests | 3 | | | | |
| Docs EN y ES | 2 | | | | |
| Release | 1 | | | | |
| Revisión del maintainer | 2.5 | | | | |
| **Total** | **20.5** | — | — | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| Un hito con Started y sin Finished aparece al iniciar | unit | node:test | tests/session-state.test.js | planned |
| El bloque nunca supera 6 líneas | unit | node:test | tests/session-state.test.js | planned |
| En modo solo el bloque omite el circuito | unit | node:test | tests/session-state.test.js | planned |
| PreCompact emite el recordatorio | integration | node:test | tests/session-state.test.js | planned |

## Changes

- (Solo si el objetivo cambia después de In progress.)
