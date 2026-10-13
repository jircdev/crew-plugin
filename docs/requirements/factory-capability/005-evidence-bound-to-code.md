# 005 — Evidencia atada al estado del código y a los criterios

- **Status:** Ready
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
| Diseño del recibo y de la cobertura | 2 | | | | |
| Huella del árbol en el recibo | 4 | | | | |
| Vigencia del recibo en la compuerta | 5 | | | | |
| Criterio por fila y cobertura de criterios | 4 | | | | |
| Plantillas y migración de recibos actuales | 2 | | | | |
| Paridad Codex | 1 | | | | |
| Tests | 5 | | | | |
| Docs EN y ES y changelog | 3 | | | | |
| Revisión del maintainer | 2 | | | | |
| **Total** | **28** | — | — | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| Dos corridas con el árbol modificado de forma distinta dejan recibos distinguibles | unit | node:test | tests/receipts.test.js | planned |
| Un recibo anterior a un cambio en los archivos cubiertos no permite cerrar | integration | node:test | tests/guards.test.js | planned |
| Un criterio de aceptación sin fila de verificación no permite cerrar | integration | node:test | tests/guards.test.js | planned |
| Un recibo del formato anterior sigue válido durante una versión menor | integration | node:test | tests/receipts.test.js | planned |

## Changes

- (Solo si el objetivo cambia después de In progress.)
