# 007 — Ejecución coordinada de un plan completo

- **Status:** Delivered
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
| Grafo de dependencias de un plan | 5 | 2026-10-13 13:46 -03:00 | 2026-10-13 13:47 -03:00 | 0.02 | scripts/plan-graph.js; sigue dependencias entre planes por su link |
| Procedimiento de ejecución en COORD | 3 | 2026-10-13 13:47 -03:00 | 2026-10-13 13:47 -03:00 | 0.01 | Sección "Executing a plan" del rol |
| Ejecución paralela en worktrees | 8 | 2026-10-13 13:47 -03:00 | 2026-10-13 13:47 -03:00 | 0.01 | Lotes sin rutas compartidas; cada item en su worktree con el aislamiento del host. Tope de dos o tres por lote hasta medirlo |
| Integración secuencial con verificación | 3 | 2026-10-13 13:47 -03:00 | 2026-10-13 13:47 -03:00 | 0.01 | plan-graph.js gate sobre verify.js |
| Bloqueos con dueño | 2 | 2026-10-13 13:46 -03:00 | 2026-10-13 13:47 -03:00 | 0.01 | Línea opcional de cabecera Blocked; la forma estándar la tolera |
| Paridad Codex | 1 | 2026-10-13 13:48 -03:00 | 2026-10-13 13:48 -03:00 | 0 | En Codex el lote corre en secuencia |
| Tests | 5 | 2026-10-13 13:47 -03:00 | 2026-10-13 13:48 -03:00 | 0.01 | tests/plan-graph.test.js, 5 casos |
| Docs EN y ES y changelog | 3 | 2026-10-13 13:48 -03:00 | 2026-10-13 13:48 -03:00 | 0.01 | using-crew en ambos idiomas |
| Revisión del maintainer | 2 | | | | |
| **Total** | **32** | — | — | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| El grafo marca listo, bloqueado y el motivo de cada bloqueo | integration | node:test | tests/plan-graph.test.js | passing |
| Dos requirements que tocan los mismos archivos no se paralelizan | integration | node:test | tests/plan-graph.test.js | passing |
| Una integración con verificación en rojo no entra | integration | node:test | tests/plan-graph.test.js | passing |
| Un plan de prueba se ejecuta completo con un bloqueo humano simulado | e2e | runner de 003 | evals/delivery/results/ | not verified — necesita una corrida con modelo real; la suite de 003 todavía no tiene una tarea de plan |

## Changes

- (Solo si el objetivo cambia después de In progress.)
