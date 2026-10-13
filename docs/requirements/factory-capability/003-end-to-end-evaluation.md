# 003 — Evaluación de punta a punta con modelos reales

- **Status:** Delivered
- **Plan:** factory-capability ([README](README.md))
- **Date:** 2026-10-13
- **Author role:** QA, con CREW en el formato del catálogo
- **Branch:** main (the plugin ships from main; no feature branch)
- **Depends on:** [001](001-stack-specifications.md)

## Context

Las suites de `evals/` miden el criterio de los roles: un humano envía cada pedido y puntúa con una rúbrica. El smoke de runtime usa un proveedor determinístico y verifica que los hosts carguen el plugin. Ninguna de las dos responde la pregunta que importa para una factory: con crew, ¿el agente entrega software correcto con menos intervención, en menos tiempo y a menor costo?

Sin esa medición, cada mejora de este plan se valida a ojo, y el aprendizaje de 006 no tiene contra qué probar una propuesta.

## Goal

- Un repositorio de prueba con su propio stack, su especificación de stack declarada en `crew.json` y su suite de tests.
- Cuatro tareas representativas, cada una con tests de aceptación ocultos al agente: una funcionalidad, un defecto, un refactor y un cambio con implicaciones de seguridad.
- Un runner que ejecuta cada tarea con un modelo real, en modo no interactivo, con crew instalado y sin crew, y registra por corrida: tests de aceptación que pasan, intervenciones necesarias, duración, tokens y costo.
- Un reporte comparativo que se archiva con la versión del plugin, para que cada release se compare con la anterior.

## Areas to investigate

- Cómo simular la intervención humana en modo no interactivo: respuestas pregrabadas a las preguntas esperadas, y cada pregunta fuera de guion cuenta como intervención.
- Cuántas corridas por tarea hacen falta para que la diferencia no sea ruido del modelo.
- Costo por corrida completa y presupuesto aceptable por release.
- Aislamiento: el runner trabaja en un directorio temporal y nunca toca las credenciales ni la configuración del usuario, igual que el smoke de runtime.

## Expected deliverable

- `evals/delivery/`: repositorio de prueba, tareas, tests de aceptación y rúbrica.
- Runner con salida JSON y reporte legible.
- Primera corrida de línea base archivada.
- Docs EN y ES (cómo correrla, cómo leer el reporte) y changelog.

## Estimation

| Milestone | Est. hours | Started | Finished | Actual hours | Notes |
|-----------|-----------|---------|----------|--------------|-------|
| Repositorio de prueba con stack, spec de stack y tests | 6 | 2026-10-13 13:27 -03:00 | 2026-10-13 13:28 -03:00 | 0.02 | Proyecto Node sin dependencias, con crew.json en modo solo y spec de stack declarada |
| Cuatro tareas con tests de aceptación ocultos | 8 | 2026-10-13 13:28 -03:00 | 2026-10-13 13:30 -03:00 | 0.05 | Cada tarea validada contra una solución de referencia (pasa) y contra el código original (falla) |
| Runner con modelo real, con y sin crew | 10 | 2026-10-13 13:30 -03:00 | 2026-10-13 13:32 -03:00 | 0.03 | Ambas variantes en safe mode; la de crew carga una copia del plugin sin evals/ ni tests/. Preflight que aborta si las variantes no están aisladas |
| Medición de intervenciones, tiempo, tokens y costo | 4 | 2026-10-13 13:31 -03:00 | 2026-10-13 13:32 -03:00 | 0.02 | Decisión: cada respuesta que el runner tiene que dar cuenta como una intervención; la primera es la aclaración de la tarea |
| Reporte comparativo y archivo por versión | 4 | 2026-10-13 13:31 -03:00 | 2026-10-13 13:32 -03:00 | 0.02 | |
| Corrida de línea base | 4 | | | | No corrida: el CLI no tiene sesión válida en esta máquina (OAuth vencido, sin ANTHROPIC_API_KEY). Queda para el maintainer |
| Docs EN y ES y changelog | 3 | 2026-10-13 13:32 -03:00 | 2026-10-13 13:34 -03:00 | 0.03 | evals/delivery/README.md y contributing EN y ES |
| Revisión del maintainer | 2 | | | | |
| **Total** | **41** | — | — | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| El runner corre una tarea completa y registra las cinco medidas | integration | node:test con agente determinístico | tests/delivery-eval.test.js | passing |
| Los tests de aceptación quedan fuera del alcance del agente durante la corrida | integration | node:test | tests/delivery-eval.test.js | passing |
| Una pregunta del agente se cuenta como intervención | integration | node:test | tests/delivery-eval.test.js | passing |
| La corrida no modifica la configuración ni las credenciales del usuario | integration | node:test | tests/delivery-eval.test.js | passing |
| La línea base con modelo real queda archivada | manual | none | evals/delivery/results/ | not verified — sin credenciales del CLI en esta máquina; correr `node scripts/eval-delivery.js --runs 3` |

## Changes

- 2026-10-13: el conteo de intervenciones se simplificó. Cada respuesta que da el runner cuenta como una intervención, sin distinguir preguntas esperadas de preguntas fuera de guion, porque en modo no interactivo no hay forma confiable de clasificarlas.
