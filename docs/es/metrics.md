# Métricas — de la tabla de estimación a números confiables

Todo ítem implementado cierra con una tabla `## Estimation` — la agrega en planning quien lo ejecuta (la story se redacta sin ella; las horas no son entregable del analista). Llenada con timestamps en tiempo real y cerrada bajo la [puerta de estimación](enforcement.md#puerta-de-estimación-al-cierre), esas tablas se convierten en un dataset: `/crew:metrics` las lee y reporta cuánto tarda realmente el trabajo frente a lo que se estimó. Esta página cubre la disciplina que hace confiables los números, qué dice el reporte y qué decisiones alimenta.

## La tabla

```markdown
## Estimation

| Milestone | Est. hours | Est. AI hours | Started | Finished | Actual hours | Actual AI hours | Notes |
|-----------|-----------|---------------|---------|----------|--------------|-----------------|-------|
| Contrato de API | 2 | 0.3 | 2026-07-14 09:12 -03:00 | 2026-07-14 11:05 -03:00 | 1.8 | 0.2 | |
| Implementación | 4 | 0.8 | 2026-07-14 11:20 -03:00 | 2026-07-15 10:40 -03:00 | 4.5 | 1.1 | sesión interrumpida, hueco de ~18h |
| Human review | 1 | 0 | 2026-07-15 10:45 -03:00 | 2026-07-15 11:30 -03:00 | 0.7 | — | |
| **Total** | 7 | 1.1 | — | — | 7 | 1.3 | |
```

`Milestone` y las dos estimaciones los llena **quien ejecuta**, en planning, antes de codificar, siempre las dos:

- **`Est. hours`** es el ritmo de persona: lo que llevaría el hito a una persona sin agentes. Se fija antes de decidir quién lo ejecuta, así nadie la infla para mostrar más rendimiento.
- **`Est. AI hours`** es el tiempo que los agentes procesan ese hito. `0` dice que el hito no lleva trabajo de agentes; vacía dice que nadie lo estimó.
- **La revisión humana es un hito propio**: el tiempo de la persona leyendo, corrigiendo y aprobando lo que hicieron los agentes, con `Est. AI hours` en `0`.

`Started`, `Finished`, `Actual hours` y `Actual AI hours` se registran durante la ejecución. `Actual hours` es el tiempo de la persona; `Actual AI hours` sale de una captura (factory, el registro de sesiones del harness); una cifra tipeada de memoria pierde su valor como evidencia, y `—` dice que nada lo midió. Cada estimación se contrasta con su real: persona contra horas humanas, IA contra horas IA. Los timestamps llevan offset de zona horaria obligatorio: `YYYY-MM-DD HH:mm ±TZ` (`Z` aceptado). El heading es literalmente `## Estimation` — incluso en proyectos en español.

**Tablas anteriores.** Una tabla con las seis columnas previas (sin las de IA), o con la IA anotada como "AI est." en Notes, sigue cerrando y conformando hasta la próxima versión minor; `conformance.js --check` la marca como deprecada.

## La disciplina de tiempo real

Los números solo valen la pena agregarse si nunca fueron reconstruidos. La regla:

- Escribí `Started` **en el momento en que el hito empieza**.
- Escribí `Finished` **inmediatamente al cerrarlo** — antes de empezar el hito siguiente.
- `Actual hours` es el tiempo realmente trabajado dentro de ese intervalo; puede estar por debajo del wall-clock (pausas), nunca por encima.

Con `"metrics": true` en `crew.json`, el [guard de timestamps](enforcement.md#timestamps) hace cumplir esto mecánicamente: una celda recién escrita debe parsear, debe estar a menos de 15 minutos del reloj de la máquina, `Finished` ≥ `Started`, y `Actual hours` ≤ wall-clock × 1.05. Retro-datear se rechaza — el mensaje de denegación te entrega la hora actual correcta. Y la [puerta de estimación](enforcement.md#puerta-de-estimación-al-cierre) se niega a cerrar un ítem con tabla incompleta, así que un ítem `Closed` es, por construcción, un ítem completamente medido.

### Sesiones interrumpidas

La sesión muere a mitad de un hito y retomás mañana: escribí `Finished` con la **hora real de reanudación** cuando el hito efectivamente cierre, y anotá el hueco en `Notes`. No retro-datees. El intervalo wall-clock va a incluir la pausa, y eso es de diseño (ver la limitación más abajo). `Actual hours` es donde vive la cifra honesta de teclado.

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
| Est AI (h), Actual AI (h), AI deviation | Aparecen cuando algún ítem tiene columnas de IA. Suman `Est. AI hours` y `Actual AI hours` (un `—` no suma), y la desviación IA es `(Actual AI − Est AI) / Est AI`, calculada solo donde existen las dos cifras. |

Agregados: **mediana y p90 del tiempo de ejecución** entre ítems, **desviación promedio de la estimación**, la **desviación IA promedio** con cuántos ítems la sostienen, más desgloses por carpeta y por mes (ítems, mediana de exec, total est → actual). `--csv` escribe las filas crudas en `docs/work/metrics.csv` para una planilla.

El reporte corre en **ambos modos, con o sin `crew.json`** — simplemente lee lo que las tablas contienen. Lo que `"metrics": true` habilita es la *disciplina*: sin los guards, nada certifica que los timestamps fueron reales, y el reporte es tan honesto como las tablas. Detalles de configuración en [configuration.md](configuration.md).

## Uso del catálogo

`/crew:metrics catalog` informa cuántas veces se usó cada rol, skill y comando en los últimos 30 y 90 días, y qué roles no se usaron, a partir del registro opcional por persona que describe [configuration.md](configuration.md#uso-del-catálogo-telemetry). Es evidencia para la prueba de costo de ruteo del rol CREW: un uso bajo, por sí solo, nunca retira un rol.

## Aprendizaje verificado

Cuando un cambio tuvo que corregirse, registrá dónde empezó la falla:

```
/crew:metrics learning record --kind defect --stage cause --origin stack:backend
```

`kind` es el tipo de trabajo y `stage` el paso del oficio `execution` donde salió mal. `origin` dice qué falló: `method` (un procedimiento de crew), `role:<rol>` o `stack:<área>` (la especificación de stack del proyecto para esa área, como la declara `crew.json`). La línea guarda la fecha y esos tres valores; queda en `.crew/learning.jsonl` en tu máquina, fuera del repositorio, durante 90 días.

| `kind` | Valores válidos de `stage` (los pasos del oficio execution) |
|---|---|
| `defect` | `classify`, `context`, `reproduce`, `cause`, `fix`, `verify`, `evidence` |
| `feature` | `classify`, `context`, `criteria`, `design`, `implement`, `test`, `validate`, `evidence` |
| `refactor` | `classify`, `context`, `pin`, `restructure`, `verify`, `evidence` |
| `migration` | `classify`, `context`, `plan-back`, `rehearse`, `verify-data`, `destructive`, `evidence` |

Cualquier otro valor se rechaza y no se escribe nada.

`/crew:metrics learning retro` agrupa las fallas que se repiten y dice dónde va cada arreglo. Una falla de stack va al proyecto, como propuesta para cambiar su especificación de stack. Una falla de método o de rol va a crew, como propuesta en el plugin. Con `--eval <result.json>` también cuenta las corridas de crew que fallaron en una [evaluación de entrega](../../evals/delivery/README.md). Una falla vista una vez es una nota, nunca una propuesta.

Una propuesta para cambiar crew se acepta con evidencia: corré la evaluación de entrega antes y después del cambio, y después

```
/crew:metrics learning compare <antes.json> <después.json>
```

El veredicto es *incorporable* solo si ninguna tarea empeoró para la variante crew en aceptación, en la suite propia del proyecto o en intervenciones. El costo se muestra y nunca decide. Decide el maintainer, con esa salida adjunta.

## Por tamaño

Los items que llevan el campo opcional `Size:` (trivial, small, standard, large; la rúbrica está en el circuito de entrega) también se agrupan por tamaño, con el desvío promedio de estimación por tamaño, y `--csv` agrega una columna `size`. Es la evidencia de que el dimensionamiento se sostiene: si los items "small" se pasan un 80% una y otra vez, o la rúbrica es generosa o lo son las estimaciones del trabajo chico. Los items sin tamaño se agrupan como `unsized`.

## Modo factory

Cuando `crew.json` declara un bloque `factory` ([configuration.md](configuration.md#modo-factory)), los números salen de factory: las estimaciones se cargan allí, y las horas consumidas son el tiempo que registraron los hooks de captura y que cada persona confirmó. `/crew:metrics` le pide entonces a factory el backlog del proyecto (la herramienta MCP `project_backlog`, con tu token personal) y lo muestra como un árbol de actividades: cada requerimiento, con sus hitos, historias y tareas indentados debajo. Las citas quedan afuera.

| Columna | Significado |
|---|---|
| Code | El código de la actividad en factory, o su número. |
| Activity | Su título, indentado bajo su padre. |
| Kind | `requirement`, `milestone`, `story` o `task`. |
| Status | `backlog`, `todo`, `in_progress`, `in_review`, `done` o `cancelled`. |
| Original est (h) | La estimación con la que se planificó la actividad. |
| Current est (h) | La estimación vigente hoy, después de cualquier re-estimación. |
| Own consumed (h) | Tiempo de personas confirmado e imputado a esa actividad en sí. Factory no suma acá las horas de las hijas, así que un requerimiento cuyo trabajo vive en sus historias muestra poco o nada. |
| Deviation | Aparece en las actividades sin hijas. En las terminadas, lo consumido contra la estimación original. En las abiertas, la estimación vigente contra la original, que muestra cuánto se movió el plan hasta ahora. Positivo significa más horas que las planificadas. |

Debajo del árbol va el resumen del proyecto: horas **cotizadas** (lo que se cotizó en los paquetes aprobados), **consumidas**, **pendientes** (estimación vigente de las actividades abiertas) y **pronóstico** (consumidas + pendientes), con la desviación del pronóstico contra lo cotizado.

El argumento de período y `--csv` pertenecen al reporte en markdown; en modo factory el reporte muestra el backlog vivo. Cuando esta máquina no está conectada, o factory no puede responder (token rechazado, permiso faltante, factory caído), el reporte lo dice en una línea y muestra en su lugar el reporte local en markdown.

`/crew:metrics catalog` funciona igual en modo factory: lee el registro local de uso del catálogo y nunca consulta a factory.

## Cómo leer los números

**Lead time vs tiempo de ejecución.** La brecha entre ambos es tiempo de cola: cuánto estuvo el ítem escrito-pero-no-empezado. Una historia con 20 días de lead y 6 horas de exec es una señal de priorización: el trabajo fue rápido, la espera fue larga. El tiempo de ejecución es el que se compara contra las estimaciones; el lead time es el que siente quien pidió el trabajo.

**Estimado vs real, y desviación.** La desviación de un ítem es ruido; la desviación *promedio* es calibración. Un equipo consistentemente en +40% no tiene un problema de ejecución, tiene un hábito de estimación — escalá las próximas estimaciones en consecuencia. Mirá también el desglose por carpeta: la desviación suele concentrarse en un tipo de trabajo (digamos, todo lo de `stories/integrations/`), lo que te dice dónde viven las incógnitas.

**Tamaño de los hitos.** Las medianas de ejecución te dicen cuánto debería pesar un hito. Si el p90 de exec está muy por encima de la mediana, algunos ítems se inflan: revisá si sus hitos fueron demasiado gruesos — los hitos que duran días esconden el momento en que las cosas se salieron del plan.

## La limitación asumida

La métrica es **wall-clock, de punta a punta**. El tiempo de ejecución incluye pausas, esperas, idas y vueltas de review y sesiones interrumpidas — deliberadamente. Mide *lo que cuesta un requerimiento de arrancado a terminado*. No leas horas de ejecución como horas de esfuerzo: `Actual hours` es la cifra de esfuerzo, el tiempo de ejecución es la cifra de calendario, y ambas sirven para preguntas distintas. Comparar personas por números de wall-clock es un mal uso; el dataset sirve para calibrar el sistema.

## Qué decisiones alimenta

- **Calibración de estimaciones** — la desviación promedio y por carpeta retroalimenta directamente las próximas `Est. hours` que se escriban en planning.
- **Tamaño de hitos** — la mediana/p90 del tiempo de ejecución define qué significa "un hito" en este proyecto.
- **Detectar sesgo sistemático** — la subestimación persistente en una carpeta o un mes es una señal sobre el trabajo: complejidad oculta, dependencias frágiles.
- **Honestidad en la priorización** — las brechas lead-vs-exec muestran dónde esperan las cosas, un insumo para [el circuito de entrega](../../templates/docs/guides/delivery-circuit.es.md). Arrancar todo a la vez achica la brecha sin resolver la espera.
