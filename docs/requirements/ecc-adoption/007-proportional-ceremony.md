# 007 — Ceremonia proporcional

- **Status:** Draft
- **Plan:** ecc-adoption ([README](README.md))
- **Date:** 2026-10-07
- **Author role:** COORD
- **Branch:** —
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
| Rúbrica en circuito y COORD | 3 | | | | |
| Encabezado y plantillas | 2 | | | | |
| Métricas por tamaño | 3 | | | | |
| Aviso de alcance | 2 | | | | |
| Tests | 2 | | | | |
| Docs EN y ES | 3 | | | | |
| Release | 1 | | | | |
| Revisión del maintainer | 2.5 | | | | |
| **Total** | **18.5** | — | — | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| `/crew:metrics` agrupa el desvío por tamaño | unit | node:test | tests/metrics.test.js | planned |
| Un item `small` conserva las compuertas de cierre | unit | node:test | tests/guard-estimation.test.js | planned |
| El aviso de alcance salta al superar el umbral | unit | node:test | tests/scope-warning.test.js | planned |

## Changes

- (Solo si el objetivo cambia después de In progress.)
