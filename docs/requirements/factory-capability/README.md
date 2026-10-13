# Plan factory-capability — Que crew produzca software correcto, además de gobernarlo

- **Date:** 2026-10-13
- **Author role:** CREW
- **Status del plan:** Delivered — los siete requirements implementados el 2026-10-13, sin push. Cada uno espera la revisión del maintainer, y las corridas con modelo real quedan pendientes (ver abajo).

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
| 006 | [Aprendizaje que se prueba antes de incorporarse](006-verified-learning.md) | Delivered | 25 | 003, 004 | Necesita la suite para probar cada propuesta |
| 007 | [Ejecución coordinada de un plan completo](007-coordinated-execution.md) | Delivered | 32 | 004, 005 | Paralelizar exige procedimientos y evidencia previos |
| | **Total estimado (001 a 007)** | | **167.5** | | |

Las tablas de estimación de estos requirements tienen la forma de seis columnas: se escribieron antes de que la versión 1.2.0 sumara las horas de IA. No se migran porque completar `Est. AI hours` ahora sería estimar en retrospectiva. La forma anterior se acepta hasta la próxima versión menor, y el cierre de cada item lo decide el maintainer en su revisión.

## Primera medición (2026-10-13)

Línea base: `evals/delivery/results/1.1.0-202610131820.md`, 24 sesiones con modelo real; más una repetición de la tarea de seguridad (`1.1.0-202610131831`).

- **Aceptación igual con y sin crew** en las cuatro tareas: 100% en funcionalidad, defecto y refactor; 80% en seguridad.
- **Crew cuesta más**: entre 0,03 y 0,35 USD más por tarea y hasta 0,9 minutos más, sin intervenciones en ninguna variante.
- **La falla de seguridad es la misma en los 18 casos**: nadie neutraliza las celdas que una planilla ejecutaría como fórmula. La retro la clasificó como falla de método y quedó como propuesta en `proposals/execution-output-neutralization.md`, pendiente de su A/B.
- **Las tareas son fáciles para el modelo actual**: tres de cuatro quedan en 100% en las dos variantes, así que la suite todavía no distingue a crew. Hace falta sumar tareas más largas y ambiguas, donde el método tenga margen para pesar.

Pendiente de modelo real: el antes y después de 004, que ya no se puede medir porque la línea base incluye el oficio, y la tarea de plan de 007, que la suite todavía no tiene.
