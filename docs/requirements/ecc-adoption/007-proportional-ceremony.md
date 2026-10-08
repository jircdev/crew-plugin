# 007 — Ceremonia proporcional

- **Status:** Delivered
- **Plan:** ecc-adoption ([README](README.md))
- **Date:** 2026-10-07
- **Author role:** COORD
- **Branch:** main (the plugin ships from main; no feature branch)
- **Depends on:** propuesta de línea base de alcance (0.26)

## Context

El modo solo o team de `crew.json` aplica la misma ceremonia a todo el repo. Un cambio trivial y una funcionalidad grande pasan por las mismas fases. ECC dimensiona cada pedido (trivial, small, standard, large) y elige las fases según el tamaño, pero descarta el dato después.

Crew puede guardar el tamaño en el work item y medir el desvío de estimación por tamaño. También puede avisar cuando un cambio toca muchos más archivos de los que su work item anticipa.

## Goal

- Una rúbrica de tamaño en el circuito y en COORD decide qué fases corren. El tamaño puede quitar fases; nunca quita las compuertas de cierre.
- Los work items admiten un campo `Size:` opcional.
- `/crew:metrics` reporta el desvío de estimación por tamaño.
- Un aviso salta cuando los archivos modificados exceden el alcance del work item activo.

## Areas to investigate

- Criterios observables de cada tamaño (archivos, contratos nuevos, ambigüedad de diseño, disparadores de seguridad).
- Cómo se identifica el work item activo desde un hook.
- Umbral del aviso de alcance.

## Expected deliverable

- Rúbrica en el circuito de entrega y en el doc de COORD.
- Plantillas con `Size:`.
- `scripts/metrics.js` con corte por tamaño.
- Aviso de alcance, docs EN y ES y changelog.

## Estimation

| Milestone | Est. hours | Started | Finished | Actual hours | Notes |
|-----------|-----------|---------|----------|--------------|-------|
| Rúbrica en circuito y COORD | 3 | 2026-10-07 22:36 -03:00 | 2026-10-07 22:37 -03:00 | 0.02 | Guía del circuito EN/ES y rol COORD |
| Encabezado y plantillas | 2 | 2026-10-07 22:37 -03:00 | 2026-10-07 22:37 -03:00 | 0.01 | Campo Size opcional; el resolver no exige campos marcados (optional) |
| Métricas por tamaño | 3 | 2026-10-07 22:37 -03:00 | 2026-10-07 22:37 -03:00 | 0.02 | Corte por tamaño con desvío promedio y columna size en CSV. Corrige además un defecto previo: metrics.js sumaba la fila Total como un hito más y duplicaba est/actual desde la 0.23 |
| Aviso de alcance | 2 | 2026-10-07 22:37 -03:00 | 2026-10-07 22:39 -03:00 | 0.02 | PostToolUse, una vez por item y tamaño; cuenta archivos cambiados desde el Started del hito abierto |
| Tests | 2 | 2026-10-07 22:39 -03:00 | 2026-10-07 22:39 -03:00 | 0.01 | tests/scope.test.js; metrics por tamaño probado a mano |
| Docs EN y ES | 3 | 2026-10-07 22:39 -03:00 | 2026-10-07 22:39 -03:00 | 0.01 | metrics, enforcement, configuration, guía del circuito |
| Release | 1 | 2026-10-07 22:39 -03:00 | 2026-10-07 22:40 -03:00 | 0.01 | Release conjunta 0.28.0 local (006, 007); push pendiente de autorización |
| Revisión del maintainer | 2.5 | | | | |
| **Total** | **18.5** | — | — | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| `/crew:metrics` agrupa el desvío por tamaño y no cuenta la fila Total como hito | integration | node:test | tests/metrics.test.js | passing |
| Un item `small` conserva las compuertas de cierre | unit | node:test | tests/compatibility.test.js | passing |
| El aviso de alcance salta al superar el techo, una sola vez, y calla sin tamaño o con large | integration | node:test | tests/scope.test.js | passing |
| El campo Size opcional no lo exige el guard de forma | unit | node:test | tests/conformance.test.js | passing |

## Changes

- 2026-10-07: no depende de la línea base de alcance; el lector de work items de 001 alcanzó. Se agregó la corrección de `metrics.js`, que contaba la fila Total como un hito.
