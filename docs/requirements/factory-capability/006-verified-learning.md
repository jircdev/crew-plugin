# 006 — Aprendizaje que se prueba antes de incorporarse

- **Status:** Delivered
- **Plan:** factory-capability ([README](README.md))
- **Date:** 2026-10-13
- **Author role:** CREW, con QA en la medición
- **Branch:** main (the plugin ships from main; no feature branch)
- **Depends on:** [003](003-end-to-end-evaluation.md), [004](004-execution-procedures.md)

## Context

El requirement 011 de ecc-adoption convierte fricciones repetidas en propuestas con dueño que un humano aprueba o descarta. La aprobación se decide leyendo la propuesta: nada mide si el cambio mejora el resultado o si lo empeora en otra tarea.

La evaluación externa advirtió que guardar más memoria sin comprobar su utilidad puede perpetuar errores. Con la suite de 003 hay contra qué probar.

## Goal

- Cada falla de una corrida de 003, y cada corrección que un humano hace durante el trabajo real, queda registrada con su tipo de trabajo y la etapa del procedimiento donde ocurrió.
- La retro agrupa las fallas repetidas y propone un cambio concreto. El destino depende de dónde ocurrió la falla: un procedimiento de crew, un rol, o la especificación de stack del proyecto.
- Una propuesta sobre crew se corre contra la suite de 003, antes y después del cambio, y adjunta el resultado. Se incorpora solo si no empeora ninguna tarea; el humano decide con ese dato.
- Una propuesta sobre la especificación de stack queda en el proyecto, para que la decida su dueño.

## Areas to investigate

- Formato del registro de fallas y dónde vive: local y opt-in, con la misma política de privacidad que el uso del catálogo.
- Cómo se distingue una falla de método de una falla de stack.
- Umbral de "no empeora" dado el ruido entre corridas que mida 003.

## Expected deliverable

- Registro de fallas y su lectura en la retro de 011.
- Propuesta con resultado A/B adjunto en `proposals/`.
- Revisión SEC del registro, tests, docs EN y ES y changelog.

## Estimation

| Milestone | Est. hours | Started | Finished | Actual hours | Notes |
|-----------|-----------|---------|----------|--------------|-------|
| Registro de fallas por tipo de trabajo y etapa | 4 | 2026-10-13 13:41 -03:00 | 2026-10-13 13:42 -03:00 | 0.02 | Solo valores cerrados: fecha, tipo, etapa del oficio execution y origen |
| Retro que separa método, rol y stack | 3 | 2026-10-13 13:42 -03:00 | 2026-10-13 13:42 -03:00 | 0.01 | |
| Comparación A/B con la suite de 003 | 6 | 2026-10-13 13:42 -03:00 | 2026-10-13 13:42 -03:00 | 0.01 | Peor = baja aceptación, baja la suite propia o sube 0.5 la media de intervenciones |
| Propuesta con evidencia en proposals/ | 2 | 2026-10-13 13:44 -03:00 | 2026-10-13 13:44 -03:00 | 0.01 | proposals/README.md |
| Revisión SEC del registro | 1 | 2026-10-13 13:43 -03:00 | 2026-10-13 13:44 -03:00 | 0.02 | Aprobado con cambios, aplicados: Object.hasOwn, condición para exportar, validación de model y session en Windows, aviso de contenido confiable |
| Tests | 4 | 2026-10-13 13:42 -03:00 | 2026-10-13 13:44 -03:00 | 0.02 | tests/learning.test.js y un caso nuevo en delivery-eval |
| Docs EN y ES y changelog | 3 | 2026-10-13 13:44 -03:00 | 2026-10-13 13:45 -03:00 | 0.02 | metrics.md en ambos idiomas y retro del rol DOC |
| Revisión del maintainer | 2 | | | | |
| **Total** | **25** | — | — | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| Una falla de la suite queda registrada con tipo de trabajo y etapa | unit | node:test | tests/learning.test.js | passing |
| La retro manda al proyecto una falla de stack y a crew una de método | integration | node:test | tests/learning.test.js | passing |
| Una propuesta que empeora una tarea queda marcada como no incorporable | integration | node:test con resultados fijos | tests/learning.test.js | passing |
| El registro no guarda contenido del código ni de la conversación | integration | node:test | tests/learning.test.js | passing |

## Changes

- 2026-10-13: las correcciones humanas se registran con un comando explícito (`/crew:metrics learning record`) y no se detectan solas. Detectarlas exigiría leer las conversaciones, que la retro tiene vedadas por privacidad.
