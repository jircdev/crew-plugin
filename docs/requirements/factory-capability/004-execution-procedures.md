# 004 — Procedimientos de ejecución por tipo de trabajo

- **Status:** Ready
- **Plan:** factory-capability ([README](README.md))
- **Date:** 2026-10-13
- **Author role:** QA en la verificación, SYS en el diseño, CREW en el formato del oficio
- **Branch:** main (the plugin ships from main; no feature branch)
- **Depends on:** [001](001-stack-specifications.md), [003](003-end-to-end-evaluation.md)

## Context

El circuito de entrega define con precisión el camino de la idea a la historia lista. De la historia hacia el código, el agente elige el método por su cuenta: implementa una funcionalidad, corrige un defecto o refactoriza con el mismo enfoque, y la verificación llega cuando llega.

La evaluación externa propuso procedimientos distintos por tipo de trabajo, adaptados al riesgo, con TDD como técnica disponible donde el comportamiento está claro.

## Goal

- Un oficio nuevo, cargable por cualquier rol que implemente, con un procedimiento por tipo de trabajo:
  - **Defecto:** reproducir, escribir la prueba que falla, corregir, revisar y verificar.
  - **Funcionalidad:** criterios, diseño necesario, implementación en partes pequeñas, pruebas y validación.
  - **Refactor:** fijar el comportamiento con pruebas antes de tocar la estructura y verificar que no cambió.
  - **Migración:** plan de reversa, ensayo y verificación de datos.
- Cada procedimiento escala con el riesgo: un cambio chico recorre los pasos mínimos y un cambio con seguridad o datos personales suma la consulta a SEC y la verificación completa.
- Los pasos llaman a lo que declara el proyecto: la especificación de stack de 001 y los comandos de `testing`. El oficio no nombra herramientas.
- TDD figura como técnica dentro del procedimiento de defecto y como opción en funcionalidad. El oficio no fija una cifra universal de cobertura.

## Areas to investigate

- Cómo clasifica el agente el tipo de trabajo cuando el pedido no lo dice, y qué hace ante un pedido mixto.
- Qué umbral de riesgo dispara la versión completa del procedimiento.
- Cuánto espacio queda en el baseline para el disparador (límite de 9000 caracteres).

## Expected deliverable

- `skills/execution/SKILL.md` con los cuatro procedimientos.
- Disparador en el baseline de sesión y mención en QA, SYS y FE.
- Paridad Codex, corrida de 003 antes y después, docs EN y ES y changelog.

## Estimation

| Milestone | Est. hours | Started | Finished | Actual hours | Notes |
|-----------|-----------|---------|----------|--------------|-------|
| Oficio con los cuatro procedimientos | 8 | | | | |
| Escala por riesgo y consulta a SEC | 2 | | | | |
| Disparador en el baseline y roles | 2 | | | | |
| Paridad Codex | 1 | | | | |
| Corrida de 003 antes y después | 4 | | | | Costo de API a cargo del maintainer |
| Docs EN y ES y changelog | 3 | | | | |
| Revisión del maintainer | 2 | | | | |
| **Total** | **22** | — | — | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| El oficio queda registrado y su entrada Codex sincronizada | unit | node:test | tests/catalog.test.js | planned |
| El oficio no contiene identificadores de framework | unit | node:test | tests/catalog.test.js (regla de 002) | planned |
| La tarea de defecto de 003 deja una prueba de regresión escrita antes de la corrección | e2e | runner de 003 | evals/delivery/results/ | planned |
| La suite de 003 no empeora en ninguna de las cuatro tareas | e2e | runner de 003 | evals/delivery/results/ | planned |

## Changes

- (Solo si el objetivo cambia después de In progress.)
