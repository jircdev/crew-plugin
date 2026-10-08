# Enforcement — cuando un guard te bloquea

Un conjunto pequeño de hooks hace cumplir los estándares del crew en el momento de la escritura, del commit o del cierre de sesión. Cuando uno te bloquea siempre dice por qué. Esta página lleva cada mensaje de denegación a su causa y su solución. Qué guards están activos en tu proyecto lo decide `crew.json`; la matriz completa está en [configuration.md](configuration.md).

Un principio antes que nada: **casi todo guard falla abierto**. Un error interno del hook deja pasar la operación, para que un bug de un guard no bloquee trabajo legítimo. Si te bloqueó, una regla disparó y el mensaje la nombra. Las dos excepciones son el [guard de shell](#evasión-de-hooks) y el de [políticas](#relajación-de-políticas): fallan cerrados, porque en un guard contra evasión un error y una evasión terminan igual.

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

**Causa.** Los hitos están completos pero nada los suma. La fila Total le ahorra al lector sumar la columna.

**Solución.** Cerrá la tabla con una fila cuya primera celda sea `Total` (el énfasis markdown es opcional, no distingue mayúsculas), con horas estimadas y reales. Las columnas de timestamp quedan vacías o con un guion, porque el total suma los hitos y no tiene fechas propias:

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

**Solución.** Escribí lo que es cierto. Si no existe el test, el artefacto es `—` y el estado dice por qué no existe. La puerta pide un registro honesto, aunque quede incompleto.

### "verification row … is passing but cites no receipt" (y sus variantes)

**Causa.** El proyecto declara `testing.receipts: true`, así que una fila `passing` tiene que apuntar a una corrida: su celda Status o Artifact cita `receipt: <id>`, y `docs/verification/receipts/` tiene ese recibo, sin editar, con código de salida 0. Las variantes dicen cuál falló: sin cita, recibo inexistente, recibo cuyo contenido ya no coincide con su id, o uno que registró una falla.

**Solución.** Correr `/crew:check` (ejecuta `scripts/verify.js`, que corre solo los comandos que declara `crew.json` y escribe un recibo por corrida) y citar el id: `passing (receipt: 3f9c1a0b2e7d)`. El recibo se commitea con el trabajo. Una fila honestamente sin cobertura no necesita recibo: `not verified — <motivo>` cierra sin problema.

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

Empezaste un hito, la sesión murió, y retomás al día siguiente. **No** retro-datees `Finished` a cuando el trabajo "habría" terminado — el guard lo va a rechazar, y retro-datear es exactamente la falsificación que existe para impedir. En cambio: escribí `Finished` con la **hora real de reanudación** cuando cierres el hito, y anotá el hueco en `Notes` (p. ej. "sesión interrumpida, hueco de ~16h"). Que el wall-clock incluya pausas es de diseño: la métrica mide el costo de punta a punta del requerimiento, y el tiempo de teclado va en `Actual hours`. En [metrics.md](metrics.md) está cómo leer los números resultantes.

## Forma de los work items

Guard: [`../../hooks/guard-shape.js`](../../hooks/guard-shape.js) (PreToolUse sobre Edit/Write), resolver [`../../hooks/lib/standards.js`](../../hooks/lib/standards.js). Corre en cada escritura sobre una story o un requirement, además del cierre, y exige al item su **estándar efectivo**:

1. la plantilla propia del proyecto (`docs/stories/README.md`, `docs/requirements/README.md`, el bloque cercado bajo el encabezado de plantilla): un proyecto que tradujo o reformó su plantilla declaró así su estándar;
2. donde el proyecto no tiene una, la plantilla de crew;
3. las desviaciones declaradas en el bloque `crew:standard` de `docs/DEVIATIONS.md`, aplicadas encima.

El estándar de cualquier ruta se imprime con `node scripts/conformance.js docs/requirements/<plan>/001-x.md`, y los archivos se chequean con `--check`.

### "This requirement departs from its standard, …"

**Causa.** La escritura dejaría faltando un campo de encabezado o una sección de la plantilla, una tabla (`Estimation`, `Verification`) con columnas distintas a las del estándar, o una tabla de estimación con hitos y sin fila **Total**. Solo cuenta la no conformidad *nueva*: una edición sobre un item que ya se desviaba se juzga por lo que agrega, así los items viejos siguen editables.

**Qué pasa.** Con `quality: enforce` en un proyecto `team` la escritura se **niega**. Con `advise`, en modo `solo` o sin `crew.json`, la escritura pasa y el mensaje llega como aviso. Con `quality: off` el guard calla.

**Cómo resolverlo.** Usar las secciones y columnas del estándar tal cual: el mensaje nombra cada hueco. Si el proyecto se aparta de la plantilla a propósito y no puede expresarlo editando su propia plantilla, lo declara con su justificación:

```markdown
<!-- crew:standard
requirement omit section Verification   # se verifica en el checklist de release
-->
```

Gramática: `<requirement|story> omit section <Nombre>`, `<…> omit header <Campo>`, `<…> columns <Tabla> <col> | <col> …`. Una línea sin `# justificación` se ignora y `conformance.js` la reporta.

## Aviso de planes fuera del repo

Hook: [`../../hooks/nudge-offrepo-plan.js`](../../hooks/nudge-offrepo-plan.js) (PreToolUse sobre herramientas MCP y `Artifact`). Un plan publicado por un conector de documentos, un artifact o una integración de chat nunca pasa por Edit/Write, así que los guards de archivos no lo ven. Este hook agrega un **aviso** (nunca una negación, porque cada conector arma su payload distinto) cuando el contenido publicado trae una tabla de horas o secciones de work item y no nombra una ruta `docs/requirements/` o `docs/stories/`.

**Cómo resolverlo.** Escribir primero los work items en el repo (la skill `planning` lleva el método) y después publicar la vista con una referencia a su ruta.

## Evasión de hooks

Guard: [`../../hooks/guard-shell.js`](../../hooks/guard-shell.js) (PreToolUse sobre herramientas de shell). Revisa el texto del comando con los strings entre comillas en blanco, así un mensaje de commit que menciona un flag no se lee como el flag.

### "Hook bypass denied: `--no-verify` switches off the git hooks …"

**Causa.** El comando lleva `--no-verify`, `git commit -n` o `core.hooksPath`. Cada uno apaga en silencio la puerta de calidad pre-commit que instala crew. Se niega en todo proyecto con `crew.json`, en ambos modos; sin `crew.json` es un aviso.

**Cómo resolverlo.** Correr el comando sin el flag. Si la puerta está mal para este cambio, se corrige el código o se preregistra la excepción en `docs/DEVIATIONS.md`.

**Este guard falla cerrado.** Todos los demás guards de crew dejan pasar la operación cuando el propio guard falla. Este, en un proyecto con crew y ante un comando que menciona git, niega: en un guard contra evasión, un error y una evasión terminan igual.

### Comandos destructivos

Borrados recursivos forzados, resets duros, pushes forzados, descartar todos los cambios, DROP y TRUNCATE reciben un **aviso** que pide nombrar los objetivos exactos y cómo deshacerlo antes de correrlo. Nunca una negación: un comando destructivo muchas veces es el correcto.

## Relajación de políticas

Guard: [`../../hooks/guard-policy.js`](../../hooks/guard-policy.js) (PreToolUse sobre Edit/Write de `crew.json`, `.claude/settings*.json` y la configuración de Codex).

### "Policy relaxation denied: This edit relaxes a control …"

**Causa.** La edición baja `quality`, apaga `metrics` o `testing`, pasa a `solo`, sube un techo, borra `crew.json`, activa `disableAllHooks` o concede `bypassPermissions`. Se niega en un proyecto `team` con `quality: enforce`; en el resto es un aviso. Endurecer nunca se marca. Igual que el guard de shell, falla cerrado ante un error interno.

**Cómo resolverlo.** Relajar un control es una decisión del dueño del proyecto. Se registra la clave que nombra el mensaje en el bloque `crew:policy` de `docs/DEVIATIONS.md`, con su justificación y de ser posible un dueño y un vencimiento, y se repite la edición:

```markdown
<!-- crew:policy
crew.json quality   # advise mientras se migra el módulo legacy · owner: ana · expires: 2027-01-31
-->
```

## Bloques de `docs/DEVIATIONS.md`

`docs/DEVIATIONS.md` registra las decisiones del proyecto que se apartan del estándar de crew. Además de las filas en prosa, tiene cuatro bloques que leen los hooks y los scripts:

| Bloque | Qué registra | Quién lo lee | Más detalle |
|---|---|---|---|
| `crew:exempt` | Rutas exentas de los techos de tamaño, un glob por línea | guard de calidad y puerta pre-commit | [Exenciones](#exenciones) |
| `crew:standard` | Desvíos de la plantilla de stories o requirements | guard de forma y `conformance.js` | [Forma de los work items](#forma-de-los-work-items) |
| `crew:policy` | Relajaciones aprobadas de `crew.json` o de los settings del host | guard de políticas | [Relajación de políticas](#relajación-de-políticas) |
| `crew:security` | Riesgos aceptados del escaneo de seguridad, como `<id-de-regla> [ruta]` | `scripts/sec-scan.js` y `/crew:doctor` | [using-crew.md](using-crew.md#disparadores-de-seguridad-y-frontera-de-instrucciones) |

Cada línea lleva su justificación después de `#`. En cualquier bloque, el comentario acepta además `owner:` y `expires: AAAA-MM-DD`:

```markdown
<!-- crew:security
SEC-HOOK-NET .claude/settings.json   # webhook a nuestra propia página de estado · owner: ana · expires: 2027-01-31
-->
```

Pasada su fecha, la entrada deja de aplicar: la ruta exenta se vuelve a medir, la desviación se informa como ignorada, la relajación se vuelve a marcar y el riesgo vuelve a contar como no aceptado. `/crew:doctor` lista las entradas vencidas.

## Aviso de alcance

Hook: [`../../hooks/nudge-scope.js`](../../hooks/nudge-scope.js) (PostToolUse sobre Edit/Write). Cuando exactamente un work item tiene un hito abierto y lleva `Size:`, los archivos cambiados desde que arrancó ese hito se cuentan contra el tamaño (trivial 3, small 10, standard 30, large sin límite). Pasado el techo, un aviso por item pide re-dimensionar el trabajo en voz alta o dividirlo. Nunca niega; calla en modo `solo` y cuando no hay tamaño.

## Calidad de código

Guard: [`../../hooks/guard-code-quality.js`](../../hooks/guard-code-quality.js) al escribir; puerta: [`../../scripts/check-staged.js`](../../scripts/check-staged.js) al commitear. Ambos comparten los mismos techos, overrides (`"ceilings"` en `crew.json`) y exenciones — la tabla de tipos y defaults está en [configuration.md](configuration.md#ceilings).

### "This file would be N lines; the crew ceiling for a KIND file is C"

**Causa.** La escritura dejaría el archivo por encima del techo de líneas de su tipo. Lo que pasa después depende de `"quality"` en `crew.json`:

- **`enforce`** (también el comportamiento sin `crew.json`): la escritura se **deniega**.
- **`advise`** (default del scaffold para proyectos nuevos): la escritura **procede** y ves el mismo texto como aviso, terminando en "The pre-commit gate will reject the commit if it still exceeds the ceiling." El freno duro sigue existiendo: se movió al commit.

**Solución.** Partí el archivo: extraé un símbolo (un componente, un grupo de funciones, un módulo de tipos) a su propio archivo. Esa es la reacción prevista — el techo es un proxy barato de "este archivo se volvió difícil de razonar". Si la ruta es *legítimamente* grande (código generado, tablas de datos planos), eximila — como corresponde, abajo.

### Exenciones

Las exenciones se **pre-registran**: se anotan con su justificación *antes* de que el guard bloquee la escritura. Viven en un bloque legible por máquina en `docs/DEVIATIONS.md`:

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

**Causa.** `git commit` ejecutó el hook pre-commit (instalado por `init-project.sh` como una llamada a [`../../scripts/check-quality.sh`](../../scripts/check-quality.sh)), que revisa cada archivo **staged** (`git diff --cached`, agregados/copiados/modificados/renombrados) contra los techos. Algo se pasó; el commit abortó con un reporte:

```
crew code-quality gate: ceiling exceeded

  src/pages/Dashboard.tsx — 247 lines (page ceiling: 200)

Split the file (extract a symbol into its own file), or pre-register the path
in the crew:exempt block of docs/DEVIATIONS.md with its rationale, then retry.
```

**Solución y reintento.** Partí el/los archivo(s) señalados o agregá un glob de exención, `git add` los cambios, y corré `git commit` de nuevo — la puerta re-revisa el nuevo set staged. No hay estado que resetear; cada intento de commit es una revisión fresca. Para CI, `bash <plugin>/scripts/check-quality.sh --all` revisa todos los archivos trackeados en lugar del set staged.

## Cierre de sesión

Hook: [`../../hooks/check-work-log.js`](../../hooks/check-work-log.js) (Stop hook). Solo en modo team — y en repos legacy que tienen directorio `docs/work/`. En modo solo nunca dispara.

### "There are commits dated today … but no docs/work/… entry"

**Causa.** La sesión está terminando, hay commits con fecha de hoy, y no existe ninguna entrada `docs/work/YYYY-MM/YYYY-MM-DD-*.md` de hoy. Este hook verifica que el trabajo del día deje traza.

**Solución.** Escribí la entrada de trabajo ahora (formato en el `docs/work/README.md` de tu proyecto: qué cambió / por qué / cómo / conocimiento promovido / pendientes) — o saltala explícitamente si los cambios del día están por debajo del umbral de significancia (fixes auto-evidentes, renombres menores, cambios solo de docs). El hook bloquea **una sola vez**: nunca entra en bucle con una sesión que ya le respondió.

## Troubleshooting en runtime

**Un guard se puso más estricto de la nada.** La causa más común: `crew.json` dejó de parsear. JSON inválido se trata exactamente como si no hubiera archivo — comportamiento legacy v0.19.1 — lo que pasa la calidad de `advise` a `enforce` y vuelve inmutables los ítems Closed aunque tu intención fuera solo. Verificá con `node -e "JSON.parse(require('fs').readFileSync('crew.json','utf8'))"` desde la raíz del proyecto.

**Parece aplicar la config equivocada.** Los guards resuelven `crew.json` subiendo **desde el directorio del archivo editado** (fallback: el cwd de la sesión), máximo 30 niveles. En un monorepo gana el `crew.json` más cercano por encima del archivo — buscá alguno perdido en un subdirectorio.

**Un glob de exención no matchea.** Los globs se comparan contra la ruta **relativa a la raíz del proyecto**, con separadores `/`. `*` no cruza directorios — `src/*.ts` no matchea `src/api/client.ts`; usá `src/**` o `src/**/*.ts`. Verificá qué raíz detectó el guard: el ancestro más cercano con `crew.json`, `docs/DEVIATIONS.md` o `.git`.

**Un guard no disparó cuando lo esperabas.** Revisá primero las condiciones de activación ([matriz](configuration.md#matriz-de-comportamiento--guard--config)): timestamps necesita `"metrics": true`; la inmutabilidad de Closed y el Stop hook necesitan modo team. Más allá de eso, recordá que casi todos los guards fallan abiertos: un error interno (archivo ilegible, input malformado del hook) permite la operación en silencio.

**Los guards de estimación ignoran mi tabla.** El heading de la sección debe ser literalmente `## Estimation`, y la línea de estado (`**Status:** Closed` / `**Estado:** Cerrada`) debe aparecer dentro de los primeros ~600 caracteres del archivo — mantenela en el bloque de cabecera donde la ponen las plantillas.

**La puerta pre-commit nunca corre.** Solo existe una vez instalada — `init-project.sh` escribe (o agrega a) `.git/hooks/pre-commit`; si el proyecto se scaffoldeó antes de `git init`, volvé a correr el script. La puerta necesita `node` y `bash` en el PATH.
