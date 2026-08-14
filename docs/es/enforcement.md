# Enforcement — cuando un guard te bloquea

Los estándares del crew no son convenciones a voluntad: un conjunto pequeño de hooks los hace cumplir en el momento de la escritura, del commit o del cierre de sesión. Cuando uno te bloquea siempre dice por qué — esta página mapea cada mensaje de denegación a su causa y su solución. Qué guards están activos en tu proyecto lo decide `crew.json`; la matriz completa está en [configuration.md](configuration.md).

Un principio antes que nada: **todo guard falla abierto**. Cualquier error interno de un hook permite la operación — un bug de un guard nunca debe bloquear trabajo legítimo. Así que si te bloqueó, fue deliberado: una regla disparó, y el mensaje la nombra.

Los mensajes de los guards se emiten en inglés; acá se citan tal cual los vas a ver.

## Inmutabilidad

Guard: [`../../hooks/guard-immutable.js`](../../hooks/guard-immutable.js) (PreToolUse sobre Edit/Write).

### "docs/work/ entries are immutable once created"

**Causa.** Editaste un archivo existente bajo `docs/work/YYYY-MM/`. Las entradas del work-log son historia: una vez escritas, no se modifican nunca. Rige en **ambos** modos, team y solo — es la pieza de ceremonia que solo conserva.

**Solución.** Escribí una entrada **nueva** que referencie la que querías cambiar. Crear entradas nuevas siempre está permitido; solo los archivos existentes están protegidos.

### "This work item is Closed and therefore immutable"

**Causa.** Editaste una historia o requerimiento bajo `docs/stories/` o `docs/requirements/` cuya cabecera ya dice `**Status:** Closed` (o `**Estado:** Cerrada`). Los ítems Closed son el registro de lo que se acordó y se entregó.

**Solución.** Trabajo nuevo es una historia/requerimiento nuevo — crealo y enlazá el ítem cerrado. Esta regla aplica **solo en modo team** (y en repos legacy sin `crew.json`); en modo solo los ítems Closed siguen editables.

## Puerta de estimación al cierre

Guard: [`../../hooks/guard-estimation.js`](../../hooks/guard-estimation.js). Dispara solo en la **transición** a Closed — si el archivo en disco ya está Closed, el caso es de inmutabilidad. Activa siempre en modo team; en solo, únicamente con `"metrics": true` en `crew.json`.

### "Cannot close this work item: no Estimation section found"

**Causa.** El archivo que estás cerrando no tiene un heading `## Estimation` — el planning nunca agregó la tabla (la story se redacta sin ella; quien ejecuta la agrega al tomar el ítem). El heading debe ser exactamente ese — la palabra inglesa `Estimation` como heading de nivel 2, incluso en proyectos en español.

**Solución.** Agregá la sección con la tabla estándar (ver la plantilla de historias), llenala, y cerrá.

### "Cannot close this work item: the estimation table has no milestone rows"

**Causa.** La sección `## Estimation` existe pero la tabla tiene solo la cabecera, o filas totalmente vacías.

**Solución.** Al menos una fila real de hito, completa.

### "Cannot close this work item: milestone … is missing Est. hours, Started, Finished, or Actual hours"

**Causa.** Una fila de hito tiene una celda vacía entre las primeras cinco columnas (`Milestone | Est. hours | Started | Finished | Actual hours`). Solo `Notes` puede quedar vacía.

**Solución.** Completá toda fila iniciada antes de poner `Status:` en `Closed`. Si un hito planificado nunca se ejecutó, borrá la fila o fusionala con otra — una fila vacía no es un registro válido. El sentido de la puerta es que el cierre certifica los números que van a consumir las [métricas](metrics.md).

### "Cannot close this work item: the estimation table has no **Total** row"

**Causa.** Los hitos están completos pero nada los suma. Un documento cuyo lector tiene que sumar la columna guarda números, no los reporta.

**Solución.** Cerrá la tabla con una fila cuya primera celda sea `Total` (el énfasis markdown es opcional, no distingue mayúsculas), con horas estimadas y reales. Las columnas de timestamp quedan vacías o con un guion — el total suma hitos, no es uno:

```
| **Total** | 12 | — | — | 15 | |
```

## Puerta de verificación al cierre

Mismo guard, otro opt-in: corre cuando `crew.json` declara una sección `testing`, en **ambos** modos e independientemente de `metrics`. Un proyecto que declaró qué puede verificar dijo que "¿cómo se verificó esto?" es una pregunta respondible — dejarla en blanco al cerrar es un hueco según su propio estándar. Sin declarar, nada de esto dispara.

### "Cannot close this work item: no Verification section found"

**Causa.** El archivo no tiene heading `## Verification`. Se agrega en planning, junto a la estimación, por quien ejecuta.

**Solución.** Agregá la tabla — una fila por comportamiento — y llenala:

```
| Scenario | Level | Harness | Artifact | Status |
|---|---|---|---|---|
| El manager aprueba una solicitud pendiente | e2e | playwright | tests/e2e/approve.spec.ts | passing |
| Importación masiva de más de 10k filas | none | none | — | no verificado — sin fixture a ese volumen |
```

El heading puede ser `## Verification` o `## Verificación`. Ninguna columna puede quedar vacía: `no verificado` **con su motivo** es un estado válido, el silencio no — una fila ausente es indistinguible de una cubierta.

### "Cannot close this work item: verification row … is missing level, harness, artifact or status"

**Causa.** Una fila tiene una celda vacía. Lo más común es el artefacto, cuando el test se planificó y nunca se escribió.

**Solución.** Escribí lo que es cierto. Si no existe el test, el artefacto es `—` y el estado dice por qué no existe. La puerta quiere el registro honesto, no el completo.

## Timestamps

Guard: [`../../hooks/guard-timestamps.js`](../../hooks/guard-timestamps.js). Activo **solo** con `"metrics": true` en `crew.json`. Valida una celda únicamente cuando la edición la escribe por primera vez (vacía → valor); las filas históricas nunca se re-validan, así que editar otras partes de un archivo con tabla completa jamás lo dispara.

### "… is not in the required format YYYY-MM-DD HH:mm ±TZ (timezone offset mandatory)"

**Causa.** Una celda `Started` o `Finished` recién escrita no parsea. El formato es `YYYY-MM-DD HH:mm` más un offset de zona horaria obligatorio: `-03:00`, `+02`, `+0530` o `Z` se aceptan; sin offset, no.

**Solución.** El mensaje de denegación incluye la hora actual correcta en el formato exacto esperado — copiala. En una shell, `date "+%Y-%m-%d %H:%M %z"` la produce.

### "… is not the real current time"

**Causa.** El timestamp está a más de **15 minutos** del reloj de la máquina. Los timestamps son un registro en tiempo real, escritos a medida que el trabajo sucede — nunca reconstruidos después. Este es el guard que hace honestas las métricas: el agente no puede inventar un pasado verosímil.

**Solución.** Escribí la hora actual — el mensaje te dice exactamente cuál es. No retro-datees, ni siquiera cuando sabés cuándo "realmente" empezó el trabajo; ver el caso de sesión interrumpida más abajo.

### "Finished (…) is earlier than Started (…)"

**Causa.** Violación de orden dentro de una fila. **Solución.** Finished debe ser ≥ Started; corregí la celda equivocada (con horas reales).

### "Actual hours (…) exceeds the wall-clock span Started → Finished"

**Causa.** Al escribir un `Finished` nuevo, las `Actual hours` de la fila superan el tiempo transcurrido Started → Finished (con un margen del 5%). Actual puede ser **menor** que el intervalo — las pausas existen — pero nunca mayor: no se puede haber trabajado 6 horas dentro de una ventana de 2.

**Solución.** Registrá las horas realmente trabajadas dentro del intervalo.

### Sesiones interrumpidas

Empezaste un hito, la sesión murió, y retomás al día siguiente. **No** retro-datees `Finished` a cuando el trabajo "habría" terminado — el guard lo va a rechazar, y retro-datear es exactamente la falsificación que existe para impedir. En cambio: escribí `Finished` con la **hora real de reanudación** cuando cierres el hito, y anotá el hueco en `Notes` (p. ej. "sesión interrumpida, hueco de ~16h"). Que el wall-clock incluya pausas es de diseño — la métrica mide el costo de punta a punta del requerimiento, no el tiempo de teclado. En [metrics.md](metrics.md) está cómo leer los números resultantes.

## Calidad de código

Guard: [`../../hooks/guard-code-quality.js`](../../hooks/guard-code-quality.js) al escribir; puerta: [`../../bin/check-staged.js`](../../bin/check-staged.js) al commitear. Ambos comparten los mismos techos, overrides (`"ceilings"` en `crew.json`) y exenciones — la tabla de tipos y defaults está en [configuration.md](configuration.md#ceilings).

### "This file would be N lines; the crew ceiling for a KIND file is C"

**Causa.** La escritura dejaría el archivo por encima del techo de líneas de su tipo. Lo que pasa después depende de `"quality"` en `crew.json`:

- **`enforce`** (también el comportamiento sin `crew.json`): la escritura se **deniega**.
- **`advise`** (default del scaffold para proyectos nuevos): la escritura **procede** y ves el mismo texto como aviso, terminando en "The pre-commit gate will reject the commit if it still exceeds the ceiling." El aviso no es ruido — el freno duro se movió al commit, no desapareció.

**Solución.** Partí el archivo: extraé un símbolo (un componente, un grupo de funciones, un módulo de tipos) a su propio archivo. Esa es la reacción prevista — el techo es un proxy barato de "este archivo se volvió difícil de razonar". Si la ruta es *legítimamente* grande (código generado, tablas de datos planos), eximila — como corresponde, abajo.

### Exenciones

Las exenciones se **pre-registran**: se anotan con su justificación *antes* de chocar contra la pared, no como reacción a un mensaje rojo. Viven en un bloque legible por máquina en `docs/DEVIATIONS.md`:

```markdown
<!-- crew:exempt
src/generated/**        # cliente API generado — se regenera, nunca se edita a mano
data/fixtures/*.ts      # datos de fixture planos, sin lógica
-->
```

Reglas del bloque:

- Un glob por línea. `**` cruza directorios; `*` matchea solo dentro de un segmento de ruta.
- `#` inicia un comentario — poné la justificación ahí mismo.
- Las rutas son relativas a la raíz del proyecto (el ancestro más cercano con `crew.json`, `docs/DEVIATIONS.md` o `.git`), con barras `/`.

Las rutas que matchean se permiten **en silencio, en ambos lados**: el guard de escritura y la puerta pre-commit. El parseo vive en [`../../hooks/lib/ceilings.js`](../../hooks/lib/ceilings.js).

### "crew code-quality gate: ceiling exceeded" (pre-commit)

**Causa.** `git commit` ejecutó el hook pre-commit (instalado por `init-project.sh` como una llamada a [`../../bin/check-quality.sh`](../../bin/check-quality.sh)), que revisa cada archivo **staged** (`git diff --cached`, agregados/copiados/modificados/renombrados) contra los techos. Algo se pasó; el commit abortó con un reporte:

```
crew code-quality gate: ceiling exceeded

  src/pages/Dashboard.tsx — 247 lines (page ceiling: 200)

Split the file (extract a symbol into its own file), or pre-register the path
in the crew:exempt block of docs/DEVIATIONS.md with its rationale, then retry.
```

**Solución y reintento.** Partí el/los archivo(s) señalados o agregá un glob de exención, `git add` los cambios, y corré `git commit` de nuevo — la puerta re-revisa el nuevo set staged. No hay estado que resetear; cada intento de commit es una revisión fresca. Para CI, `bash <plugin>/bin/check-quality.sh --all` revisa todos los archivos trackeados en lugar del set staged.

## Cierre de sesión

Hook: [`../../hooks/check-work-log.js`](../../hooks/check-work-log.js) (Stop hook). Solo en modo team — y en repos legacy que tienen directorio `docs/work/`. En modo solo nunca dispara.

### "There are commits dated today … but no docs/work/… entry"

**Causa.** La sesión está terminando, hay commits con fecha de hoy, y no existe ninguna entrada `docs/work/YYYY-MM/YYYY-MM-DD-*.md` de hoy. Las convenciones sin enforcement se degradan; esto es el enforcement de la traza de cierre.

**Solución.** Escribí la entrada de trabajo ahora (formato en el `docs/work/README.md` de tu proyecto: qué cambió / por qué / cómo / conocimiento promovido / pendientes) — o saltala explícitamente si los cambios del día están por debajo del umbral de significancia (fixes auto-evidentes, renombres menores, cambios solo de docs). El hook bloquea **una sola vez**: nunca entra en bucle con una sesión que ya le respondió.

## Troubleshooting en runtime

**Un guard se puso más estricto de la nada.** La causa más común: `crew.json` dejó de parsear. JSON inválido se trata exactamente como si no hubiera archivo — comportamiento legacy v0.19.1 — lo que pasa la calidad de `advise` a `enforce` y vuelve inmutables los ítems Closed aunque tu intención fuera solo. Verificá con `node -e "JSON.parse(require('fs').readFileSync('crew.json','utf8'))"` desde la raíz del proyecto.

**Parece aplicar la config equivocada.** Los guards resuelven `crew.json` subiendo **desde el directorio del archivo editado** (fallback: el cwd de la sesión), máximo 30 niveles. En un monorepo gana el `crew.json` más cercano por encima del archivo — buscá alguno perdido en un subdirectorio.

**Un glob de exención no matchea.** Los globs se comparan contra la ruta **relativa a la raíz del proyecto**, con separadores `/`. `*` no cruza directorios — `src/*.ts` no matchea `src/api/client.ts`; usá `src/**` o `src/**/*.ts`. Verificá qué raíz detectó el guard: el ancestro más cercano con `crew.json`, `docs/DEVIATIONS.md` o `.git`.

**Un guard no disparó cuando lo esperabas.** Revisá primero las condiciones de activación ([matriz](configuration.md#matriz-de-comportamiento--guard--config)): timestamps necesita `"metrics": true`; la inmutabilidad de Closed y el Stop hook necesitan modo team. Más allá de eso, recordá que los guards fallan abiertos — un error interno (archivo ilegible, input malformado del hook) permite la operación en silencio.

**Los guards de estimación ignoran mi tabla.** El heading de la sección debe ser literalmente `## Estimation`, y la línea de estado (`**Status:** Closed` / `**Estado:** Cerrada`) debe aparecer dentro de los primeros ~600 caracteres del archivo — mantenela en el bloque de cabecera donde la ponen las plantillas.

**La puerta pre-commit nunca corre.** Solo existe una vez instalada — `init-project.sh` escribe (o agrega a) `.git/hooks/pre-commit`; si el proyecto se scaffoldeó antes de `git init`, volvé a correr el script. La puerta necesita `node` y `bash` en el PATH.
