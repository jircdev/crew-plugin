# Métricas — de la tabla de estimación a números confiables

Todo ítem implementado cierra con una tabla `## Estimation` — la agrega en planning quien lo ejecuta (la story se redacta sin ella; las horas no son entregable del analista). Llenada con timestamps en tiempo real y cerrada bajo la [puerta de estimación](enforcement.md#puerta-de-estimación-al-cierre), esas tablas se convierten en un dataset: `/crew:metrics` las lee y reporta cuánto tarda realmente el trabajo frente a lo que se estimó. Esta página cubre la disciplina que hace confiables los números, qué dice el reporte y qué decisiones alimenta.

## La tabla

```markdown
## Estimation

| Milestone | Est. hours | Started | Finished | Actual hours | Notes |
|-----------|-----------|---------|----------|--------------|-------|
| Contrato de API | 2 | 2026-07-14 09:12 -03:00 | 2026-07-14 11:05 -03:00 | 1.8 | |
| Implementación | 4 | 2026-07-14 11:20 -03:00 | 2026-07-15 10:40 -03:00 | 4.5 | sesión interrumpida, hueco de ~18h |
```

`Milestone` y `Est. hours` los llena **quien ejecuta**, en planning, antes de codificar. `Started`, `Finished` y `Actual hours` se registran durante la ejecución. Los timestamps llevan offset de zona horaria obligatorio: `YYYY-MM-DD HH:mm ±TZ` (`Z` aceptado). El heading es literalmente `## Estimation` — incluso en proyectos en español.

## La disciplina de tiempo real

Los números solo valen la pena agregarse si nunca fueron reconstruidos. La regla:

- Escribí `Started` **cuando el hito empieza** — no cuando te acordás.
- Escribí `Finished` **inmediatamente al cerrarlo** — antes de empezar el hito siguiente.
- `Actual hours` es el tiempo realmente trabajado dentro de ese intervalo; puede estar por debajo del wall-clock (pausas), nunca por encima.

Con `"metrics": true` en `crew.json`, el [guard de timestamps](enforcement.md#timestamps) hace cumplir esto mecánicamente: una celda recién escrita debe parsear, debe estar a menos de 15 minutos del reloj de la máquina, `Finished` ≥ `Started`, y `Actual hours` ≤ wall-clock × 1.05. Retro-datear se rechaza — el mensaje de denegación te entrega la hora actual correcta. Y la [puerta de estimación](enforcement.md#puerta-de-estimación-al-cierre) se niega a cerrar un ítem con tabla incompleta, así que un ítem `Closed` es, por construcción, un ítem completamente medido.

### Sesiones interrumpidas

La sesión muere a mitad de un hito y retomás mañana: escribí `Finished` con la **hora real de reanudación** cuando el hito efectivamente cierre, y anotá el hueco en `Notes`. No retro-datees. El intervalo wall-clock va a incluir la pausa — eso es de diseño, no una distorsión (ver la limitación más abajo). `Actual hours` es donde vive la cifra honesta de teclado.

## Qué reporta `/crew:metrics`

```
/crew:metrics             # todo
/crew:metrics 2026-07     # solo ítems cerrados en ese mes
/crew:metrics --csv       # además escribe docs/work/metrics.csv
```

El comando corre [`../../scripts/metrics.js`](../../scripts/metrics.js), que escanea `docs/stories/**` y `docs/requirements/**` buscando ítems con `Status: Closed` y una tabla de estimación usable (al menos un `Started` y un `Finished` parseables). Por ítem:

| Columna | Significado |
|---|---|
| Lead (days) | Creación del archivo (según el historial git) → último `Finished`. La vida completa del ítem, de escrito a terminado. |
| Exec (h) | Primer `Started` → último `Finished`. La ventana de ejecución, una vez que el trabajo arrancó. |
| Est (h) | Suma de `Est. hours` de todos los hitos. |
| Actual (h) | Suma de `Actual hours` de todos los hitos. |
| Deviation | `(Actual − Est) / Est`, en porcentaje. Positivo = tardó más de lo estimado. |

Agregados: **mediana y p90 del tiempo de ejecución** entre ítems, **desviación promedio de la estimación**, más desgloses por carpeta y por mes (ítems, mediana de exec, total est → actual). `--csv` escribe las filas crudas en `docs/work/metrics.csv` para una planilla.

El reporte corre en **ambos modos, con o sin `crew.json`** — simplemente lee lo que las tablas contienen. Lo que `"metrics": true` habilita es la *disciplina*: sin los guards, nada certifica que los timestamps fueron reales, y el reporte es tan honesto como las tablas. Detalles de configuración en [configuration.md](configuration.md).

## Cómo leer los números

**Lead time vs tiempo de ejecución.** La brecha entre ambos es tiempo de cola: cuánto estuvo el ítem escrito-pero-no-empezado. Una historia con 20 días de lead y 6 horas de exec no es una historia lenta — es una señal de priorización. El tiempo de ejecución es el que se compara contra las estimaciones; el lead time es el que siente quien pidió el trabajo.

**Estimado vs real, y desviación.** La desviación de un ítem es ruido; la desviación *promedio* es calibración. Un equipo consistentemente en +40% no tiene un problema de ejecución, tiene un hábito de estimación — escalá las próximas estimaciones en consecuencia. Mirá también el desglose por carpeta: la desviación suele concentrarse en un tipo de trabajo (digamos, todo lo de `stories/integrations/`), lo que te dice dónde viven las incógnitas.

**Tamaño de los hitos.** Las medianas de ejecución te dicen cuánto debería pesar un hito. Si el p90 de exec está muy por encima de la mediana, algunos ítems se inflan: revisá si sus hitos fueron demasiado gruesos — los hitos que duran días esconden el momento en que las cosas se salieron del plan.

## La limitación asumida

La métrica es **wall-clock, de punta a punta**. El tiempo de ejecución incluye pausas, esperas, idas y vueltas de review y sesiones interrumpidas — deliberadamente. Mide *lo que cuesta un requerimiento de arrancado a terminado*, no tiempo de teclado. No leas horas de ejecución como horas de esfuerzo: `Actual hours` es la cifra de esfuerzo, el tiempo de ejecución es la cifra de calendario, y ambas sirven para preguntas distintas. Comparar personas por números de wall-clock es un mal uso; el dataset sirve para calibrar el sistema, no para calificar gente.

## Qué decisiones alimenta

- **Calibración de estimaciones** — la desviación promedio y por carpeta retroalimenta directamente las próximas `Est. hours` que se escriban en planning.
- **Tamaño de hitos** — la mediana/p90 del tiempo de ejecución define qué significa "un hito" en este proyecto.
- **Detectar sesgo sistemático** — la subestimación persistente en una carpeta o un mes es una señal sobre el trabajo (complejidad oculta, dependencias frágiles), no sobre quien estima.
- **Honestidad en la priorización** — las brechas lead-vs-exec muestran dónde esperan las cosas, un insumo para [el circuito de entrega](../../templates/docs/guides/delivery-circuit.md), no algo a optimizar arrancando todo a la vez.
