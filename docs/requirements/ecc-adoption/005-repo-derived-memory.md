# 005 — Memoria derivada del repo

- **Status:** Delivered
- **Plan:** ecc-adoption ([README](README.md))
- **Date:** 2026-10-07
- **Author role:** COORD
- **Branch:** main (the plugin ships from main; no feature branch)
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
| Lector de estado | 4 | 2026-10-07 22:28 -03:00 | 2026-10-07 22:29 -03:00 | 0.02 | hooks/lib/work-state.js sobre el parser de 001; no lee transcripts |
| Bloque de SessionStart | 4 | 2026-10-07 22:29 -03:00 | 2026-10-07 22:29 -03:00 | 0.01 | Máximo 6 líneas; también corre tras compactar; omitido en solo |
| Recordatorio en PreCompact | 2 | 2026-10-07 22:29 -03:00 | 2026-10-07 22:29 -03:00 | 0.01 | systemMessage al usuario; la lista vuelve al agente por SessionStart |
| Paridad Codex | 2 | 2026-10-07 22:29 -03:00 | 2026-10-07 22:30 -03:00 | 0.01 | (BC) SessionStart compartido; PreCompact en Codex sin verificar, documentado |
| Tests | 3 | 2026-10-07 22:30 -03:00 | 2026-10-07 22:30 -03:00 | 0.01 | tests/memory.test.js |
| Docs EN y ES | 2 | 2026-10-07 22:30 -03:00 | 2026-10-07 22:30 -03:00 | 0.01 | using-crew, compatibility, adaptador Codex |
| Release | 1 | 2026-10-07 22:30 -03:00 | 2026-10-07 22:31 -03:00 | 0.01 | Release conjunta 0.27.0 local (003, 004, 005); push pendiente de autorización |
| Revisión del maintainer | 2.5 | | | | |
| **Total** | **20.5** | — | — | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| Un hito con Started y sin Finished aparece al iniciar | unit | node:test | tests/memory.test.js | passing |
| El bloque nunca supera 6 líneas y omite items cerrados | unit | node:test | tests/memory.test.js | passing |
| En modo solo el bloque se omite; sin trabajo en curso calla | integration | node:test | tests/memory.test.js | passing |
| PreCompact emite el recordatorio solo si hay hitos abiertos | integration | node:test | tests/memory.test.js | passing |
| El host muestra el systemMessage de PreCompact al usuario | manual | none | — | not verified — requiere una compactación real en Claude Code; en Codex el evento no está confirmado |

## Changes

- 2026-10-07: el lector se apoya en el parser de work items de 001 (`hooks/lib/standards.js`) en lugar del parser de la línea base de alcance, que todavía no existe. La línea de cambios de alcance pendientes queda fuera hasta que esa propuesta se implemente.
