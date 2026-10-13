# 005 — Evidencia atada al estado del código y a los criterios

- **Status:** Delivered
- **Plan:** factory-capability ([README](README.md))
- **Date:** 2026-10-13
- **Author role:** QA, con SYS en el formato del recibo
- **Branch:** main (the plugin ships from main; no feature branch)
- **Depends on:** [004](004-execution-procedures.md)

## Context

`/crew:check` corre los comandos declarados y deja un recibo con código de salida, horarios, HEAD de git y el final de la salida. Con `receipts: true`, una fila de verificación `passing` cierra solo si cita un recibo.

Quedan tres huecos para que "terminado" tenga respaldo comprobable. El recibo registra el HEAD y no el estado de los archivos sin commitear, así que dos corridas con el árbol modificado son indistinguibles. Un recibo viejo sigue siendo válido después de que el código cambió. Y la fila de verificación cita el recibo sin decir qué criterio de aceptación prueba.

## Goal

- El recibo registra una huella del árbol de trabajo, además del HEAD.
- La compuerta de cierre rechaza un recibo cuando los archivos que cubre la fila cambiaron después de la corrida.
- Cada fila de verificación nombra el criterio de aceptación que respalda, y la compuerta detecta un criterio de la historia que ninguna fila cubre.

## Areas to investigate

- Cómo calcular la huella del árbol con costo bajo en repos grandes.
- Cómo sabe la compuerta qué archivos cubre una fila: la columna `Artifact`, los archivos del commit, o una declaración nueva.
- Compatibilidad: los recibos actuales siguen válidos durante una versión menor, según el invariante 3 de la configuración.

## Expected deliverable

- Recibo con huella del árbol en `scripts/verify.js` y `hooks/lib/receipts.js`.
- Chequeo de vigencia y de cobertura de criterios en la compuerta de cierre.
- Plantillas de story y requirement con la columna de criterio.
- Paridad Codex, tests, docs EN y ES y changelog.

## Estimation

| Milestone | Est. hours | Started | Finished | Actual hours | Notes |
|-----------|-----------|---------|----------|--------------|-------|
| Diseño del recibo y de la cobertura | 2 | 2026-10-13 13:38 -03:00 | 2026-10-13 13:38 -03:00 | 0.01 | Huella por contenido del código, sin documentación; criterios citados como AC<n> |
| Huella del árbol en el recibo | 4 | 2026-10-13 13:38 -03:00 | 2026-10-13 13:39 -03:00 | 0.01 | hooks/lib/code-state.js, medio segundo en este repo |
| Vigencia del recibo en la compuerta | 5 | 2026-10-13 13:39 -03:00 | 2026-10-13 13:39 -03:00 | 0.01 | |
| Criterio por fila y cobertura de criterios | 4 | 2026-10-13 13:39 -03:00 | 2026-10-13 13:39 -03:00 | 0.01 | Opt-in con testing.criteria |
| Plantillas y migración de recibos actuales | 2 | 2026-10-13 13:40 -03:00 | 2026-10-13 13:40 -03:00 | 0.01 | Los recibos sin huella siguen válidos una versión menor |
| Paridad Codex | 1 | 2026-10-13 13:40 -03:00 | 2026-10-13 13:40 -03:00 | 0 | El adaptador de Codex ya corre guard-estimation; nada que agregar |
| Tests | 5 | 2026-10-13 13:39 -03:00 | 2026-10-13 13:40 -03:00 | 0.01 | tests/evidence.test.js, 5 casos |
| Docs EN y ES y changelog | 3 | 2026-10-13 13:40 -03:00 | 2026-10-13 13:40 -03:00 | 0.01 | configuration.md, plantilla de verificación y entrevista de setup |
| Revisión del maintainer | 2 | | | | |
| **Total** | **28** | — | — | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| Dos corridas con el árbol modificado de forma distinta dejan recibos distinguibles | unit | node:test | tests/evidence.test.js | passing |
| Un recibo anterior a un cambio en el código no permite cerrar | integration | node:test | tests/evidence.test.js | passing |
| AC2 sin fila de verificación no permite cerrar con testing.criteria | integration | node:test | tests/evidence.test.js | passing |
| Un recibo del formato anterior sigue válido durante una versión menor | integration | node:test | tests/evidence.test.js | passing |

## Changes

- 2026-10-13: la vigencia se mide sobre todo el código y no sobre los archivos de cada fila. Ninguna fila declara qué código prueba, y adivinarlo dejaría pasar recibos viejos.
- 2026-10-13: el criterio se cita como `AC<n>` en la celda del escenario en lugar de agregar una columna. Así la tabla mantiene su forma y los work items existentes siguen conformes; la cobertura se exige solo con `testing.criteria: true`.
