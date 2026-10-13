# Plan factory-capability — Que crew produzca software correcto, además de gobernarlo

- **Date:** 2026-10-13
- **Author role:** CREW
- **Status del plan:** In progress — 001 entregado; 002 a 007 estimados y listos para la decisión del maintainer.

## Contexto

Una evaluación externa del plugin concluyó que crew gobierna bien quién decide y con qué evidencia, y que le falta conectar esa estructura con la producción de software: procedimientos por tipo de trabajo, evidencia de que el código entregado funciona y un aprendizaje que se pruebe antes de incorporarse.

El maintainer fijó un principio antes de avanzar: las especificaciones de stack son independientes de crew. Crew aporta el método; cada proyecto aporta lo propio de su stack. Por eso el plan arranca declarando ese límite, y ninguno de los pasos siguientes construye conocimiento de stack dentro del plugin.

El criterio de éxito del plan es medible: con crew, el agente entrega software que pasa sus tests de aceptación con menos intervención, menos retrabajo y menor costo. La suite de 003 es la que lo mide, y cada requirement posterior se valida contra ella.

## Cobertura de la evaluación

| Área que señaló la evaluación | Requirement |
|---|---|
| Capacidad técnica por stack | 001, y 002 protege el límite |
| Propósito del proyecto escrito | 002 |
| Evaluación con modelos reales | 003 |
| Procedimientos por tipo de trabajo, TDD donde aporta | 004 |
| Evidencia atada al código y a los criterios | 005 |
| Aprendizaje con evidencia | 006 |
| Coordinación, dependencias y trabajo en paralelo | 007 |

La evaluación también mencionó hallazgos sobre hooks y recibos que vienen de un análisis previo, que no está en el repo. La parte que se identificó en el código (la compuerta pre-commit bajo gestores de hooks, los listados grandes y la cuenta de líneas) se resolvió fuera de este plan. Si el análisis previo señala algo más, entra como requirement nuevo.

## Orden

| # | Requirement | Estado | Horas est. | Depende de | Por qué en este lugar |
|---|---|---|---|---|---|
| 001 | [Especificaciones de stack declaradas por el proyecto](001-stack-specifications.md) | Delivered | 10 | — | Fija el límite antes de construir encima |
| 002 | [Propósito declarado y límite del stack protegido](002-purpose-and-stack-guard.md) | Delivered | 9.5 | 001 | Corto, y deja el propósito claro para todo lo que sigue |
| 003 | [Evaluación de punta a punta con modelos reales](003-end-to-end-evaluation.md) | Delivered | 41 | 001 | Sin medición, cada mejora se valida a ojo |
| 004 | [Procedimientos de ejecución por tipo de trabajo](004-execution-procedures.md) | Delivered | 22 | 001, 003 | Valen para cualquier stack y se miden con 003 |
| 005 | [Evidencia atada al estado del código y a los criterios](005-evidence-bound-to-code.md) | Delivered | 28 | 004 | Respalda el "terminado" que producen los procedimientos |
| 006 | [Aprendizaje que se prueba antes de incorporarse](006-verified-learning.md) | Ready | 25 | 003, 004 | Necesita la suite para probar cada propuesta |
| 007 | [Ejecución coordinada de un plan completo](007-coordinated-execution.md) | Ready | 32 | 004, 005 | Paralelizar exige procedimientos y evidencia previos |
| | **Total pendiente (002 a 007)** | | **157.5** | | |

002 y 003 no dependen entre sí y pueden avanzar juntos. Las corridas con modelo real de 003, 004 y 006 tienen costo de API, que no está incluido en las horas.
