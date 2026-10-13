# 007 — Ejecución coordinada de un plan completo

- **Status:** Ready
- **Plan:** factory-capability ([README](README.md))
- **Date:** 2026-10-13
- **Author role:** COORD, con SYS en el aislamiento y OPS en la integración
- **Branch:** main (the plugin ships from main; no feature branch)
- **Depends on:** [004](004-execution-procedures.md), [005](005-evidence-bound-to-code.md)

## Context

COORD decide el orden de los roles y sigue los bloqueos, y cada requirement declara de cuáles depende. Nada convierte esas dependencias en ejecución: el agente toma un requirement por vez y la persona decide cuál sigue.

Una factory tiene que poder ejecutar un plan completo. Eso exige saber qué está listo para empezar, qué está bloqueado y por qué, y correr en paralelo lo que no comparte archivos sin que dos agentes se pisen en el mismo checkout.

## Goal

- Un comando lee las dependencias de un plan y muestra qué requirements están listos, cuáles bloqueados y por cuál.
- COORD ejecuta un plan: toma los requirements listos, asigna cada uno a su rol dueño y avanza a medida que se cierran.
- Los requirements independientes corren en paralelo, cada uno en su propio worktree. Se integran de a uno, con la verificación de 005 en verde antes de cada integración.
- Un bloqueo que necesita decisión humana detiene solo la rama afectada y queda informado con su dueño.

## Areas to investigate

- Cómo detectar que dos requirements tocan los mismos archivos antes de paralelizarlos.
- Cuántos agentes en paralelo admite una sesión sin degradar la calidad, medido con 003.
- Qué pasa con la tabla de estimación cuando un hito se ejecuta en un worktree.

## Expected deliverable

- Lectura del grafo de dependencias de un plan.
- Procedimiento de ejecución de plan en el rol COORD.
- Ejecución en worktrees con integración secuencial.
- Paridad Codex, tests, docs EN y ES y changelog.

## Estimation

| Milestone | Est. hours | Started | Finished | Actual hours | Notes |
|-----------|-----------|---------|----------|--------------|-------|
| Grafo de dependencias de un plan | 5 | | | | |
| Procedimiento de ejecución en COORD | 3 | | | | |
| Ejecución paralela en worktrees | 8 | | | | |
| Integración secuencial con verificación | 3 | | | | |
| Bloqueos con dueño | 2 | | | | |
| Paridad Codex | 1 | | | | |
| Tests | 5 | | | | |
| Docs EN y ES y changelog | 3 | | | | |
| Revisión del maintainer | 2 | | | | |
| **Total** | **32** | — | — | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| El grafo marca listo, bloqueado y el motivo de cada bloqueo | unit | node:test | tests/plan-graph.test.js | planned |
| Dos requirements que tocan los mismos archivos no se paralelizan | unit | node:test | tests/plan-graph.test.js | planned |
| Una integración con verificación en rojo no entra | integration | node:test | tests/plan-graph.test.js | planned |
| Un plan de prueba se ejecuta completo con un bloqueo humano simulado | e2e | runner de 003 | evals/delivery/results/ | planned |

## Changes

- (Solo si el objetivo cambia después de In progress.)
