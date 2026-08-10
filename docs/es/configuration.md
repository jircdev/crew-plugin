# Configuración — `crew.json`

`crew.json` es el archivo de política del proyecto para los guards del crew: un JSON pequeño en la raíz que decide qué reglas se aplican y con qué dureza. Cada valor es explícito — el archivo *es* la política, visible y versionada junto al código. Cuando un guard te bloquea y querés saber por qué, esta página te dice a qué campo obedeció; los mensajes de denegación están catalogados en [enforcement.md](enforcement.md).

## Cómo lo encuentran los guards

Cada guard resuelve la configuración subiendo desde el directorio del archivo que se está editando (o desde el directorio de trabajo de la sesión, como fallback), buscando `crew.json`, hasta 30 niveles o la raíz del filesystem. Gana el primer `crew.json` encontrado. En un monorepo, cada proyecto puede llevar su propio `crew.json` y cada edición se rige por el más cercano hacia arriba. Lector: [`../../hooks/lib/config.js`](../../hooks/lib/config.js).

## La regla legacy — sin `crew.json`

**Sin `crew.json` (o con JSON inválido), el comportamiento es exactamente el de v0.19.1.** El lector no devuelve nada y cada guard cae a su comportamiento pre-configuración:

- Entradas de `docs/work/` e ítems de trabajo Closed: inmutables.
- Puerta de estimación al cierre: activa.
- Guard de timestamps: **apagado** (solo existe con `"metrics": true`).
- Calidad de código: **enforce** — las escrituras que superan el techo se deniegan.
- Stop hook del work-log: activo donde exista `docs/work/`.

Dos consecuencias que conviene internalizar. Primera, el plugin **no tiene defaults ocultos**: los valores más amables que reciben los proyectos nuevos (`advise`, métricas activadas) no vienen de fábrica — existen solo porque [`../../bin/init-project.sh`](../../bin/init-project.sh) los escribe explícitamente en el `crew.json` scaffoldeado. Segunda, un `crew.json` con un error de sintaxis JSON se comporta como si no existiera — lo que convierte silenciosamente `"quality": "advise"` en enforce. Si un guard se puso más estricto de golpe, verificá que el JSON parsea.

## Referencia de campos

| Campo | Valores | Default si falta | Qué controla |
|---|---|---|---|
| `mode` | `"team"` \| `"solo"` | `"team"` | Si aplica la ceremonia completa del circuito de entrega. Cualquier cosa distinta del string exacto `"solo"` cuenta como team. |
| `metrics` | `true` \| `false` | `false` | La disciplina de timestamps de estimación. Solo el literal `true` la activa. |
| `quality` | `"advise"` \| `"enforce"` \| `"off"` | `"enforce"` | Qué hace el guard de calidad en tiempo de escritura ante una violación de techo. Valores desconocidos caen a `"enforce"`. |
| `ceilings` | objeto `{ kind: líneas }` | `{}` | Overrides por tipo de los techos de líneas por archivo. Valores no-objeto caen a `{}`. |
| `configuredWith` | string de versión | `null` | **Estado, no política**: con qué versión del plugin se configuró este proyecto por última vez. Nadie lo interpreta para decidir comportamiento — ver [La marca](#la-marca-configuredwith). |
| `design` | objeto | `null` | Qué *puede hacer* este proyecto para el trabajo de interfaz. Nada se concede por defecto — ver [Capacidades de diseño](#capacidades-de-diseño). |

Los campos ausentes se normalizan al valor equivalente-legacy de la tercera columna — un `crew.json` que contiene solo `{"mode": "solo"}` es válido y significa solo, sin métricas, calidad enforce, techos por defecto.

### Invariantes de evolución

El lector es el único intérprete autorizado de este archivo, y está atado a cinco reglas. Son las que te permiten conservar un `crew.json` viejo indefinidamente sin leer ninguna guía de migración:

1. **Una clave existente nunca cambia de significado.** Un significado nuevo viaja como clave nueva.
2. **Los campos nuevos son opcionales y ningún default concede una capacidad.** Un default que dejara a un agente levantar un servidor o emitir un veredicto sería el plugin autoconcediéndose permiso.
3. **Durante una migración el lector acepta la forma vieja y la nueva por una versión menor**; retirar la vieja es entrada obligatoria de changelog.
4. **No hay versión por sección.** La evolución es aditiva por construcción: un campo ausente equivale al comportamiento anterior. Una ruptura verdaderamente global necesitaría una versión del archivo entero, jamás de una sección.
5. **Ningún campo es honrado por un rol si el lector no lo transporta.** Una interpretación del contrato, nunca dos — por eso un valor desconocido se trata como ausente y se **nombra**, nunca se acepta en silencio.

### `mode`

`team` asume el circuito completo del crew: las historias/requerimientos son contratos, los ítems Closed son historia, las sesiones dejan traza en el work-log. `solo` conserva las piezas baratas y siempre valiosas (entradas de `docs/work/` inmutables, la puerta de calidad) y suelta la ceremonia de equipo: los ítems Closed siguen editables, no hay recordatorio del Stop hook, y la puerta de estimación aplica solo si optaste por métricas.

### `metrics`

Con `true` se activan dos cosas: la puerta de estimación aplica incluso en modo solo, y el [guard de timestamps](enforcement.md#timestamps) empieza a validar que las celdas `Started`/`Finished` se escriban **en tiempo real** (formato correcto, dentro de 15 minutos del reloj de la máquina, coherentes entre sí). Esta es la disciplina que hace confiable a [/crew:metrics](metrics.md). Con `false` o ausente, el guard de timestamps queda completamente en silencio.

### `quality`

Controla **solo** el guard en tiempo de escritura ([`../../hooks/guard-code-quality.js`](../../hooks/guard-code-quality.js)):

| Modo | En la escritura (Edit/Write del agente) | En el commit (puerta pre-commit) |
|---|---|---|
| `advise` | La escritura procede; el agente ve un aviso visible | Bloquea el commit |
| `enforce` | La escritura se deniega | Bloquea el commit |
| `off` | Silencio | Sigue bloqueando — la puerta se gestiona aparte |

`advise` es lo que el scaffold escribe para proyectos nuevos: el agente no pierde impulso y el freno duro está en el commit. Ojo: la puerta pre-commit ([`../../bin/check-quality.sh`](../../bin/check-quality.sh)) **no** lee `quality` — poner calidad en `off` silencia el hook, no la puerta. Para quitar la puerta, borrá su línea de `.git/hooks/pre-commit`.

### `ceilings`

Los techos de líneas por tipo de archivo, y cómo se detecta el tipo (gana la primera coincidencia):

| Tipo | Techo por defecto | Se detecta cuando |
|---|---|---|
| `test` | 250 | `.test.`/`.spec.` en el nombre, o bajo `__tests__/`, `test/`, `tests/` |
| `rust` | 300 | extensión `.rs` |
| `hook` | 80 | `.ts`/`.tsx` llamado `use-*` o `useXxx` (hooks estilo React) |
| `page` | 200 | bajo `pages/` o `routes/`, o `.page.`/`.route.` en el nombre |
| `service` | 150 | bajo `services/` o `stores/`, o `.service.`/`.store.`/`.slice.` en el nombre |
| `component` | 150 | `.tsx`/`.jsx` cuyo nombre empieza con mayúscula |
| `module` | 200 | todo lo demás (el tipo por defecto) |

Solo se revisan archivos de código (`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, `.rs`, `.py`, `.go`, `.java`, `.rb`, `.php`, `.cs`, `.kt`, `.swift`, `.vue`, `.svelte`, …). `"ceilings"` sobreescribe el número por tipo — no cambia la detección del tipo. Tanto el guard de escritura como la puerta pre-commit respetan los mismos overrides, y ambos respetan las [exenciones pre-registradas](enforcement.md#exenciones) en `docs/DEVIATIONS.md`. Lógica: [`../../hooks/lib/ceilings.js`](../../hooks/lib/ceilings.js).

## Capacidades de diseño

El trabajo de interfaz es donde a un agente le resulta más fácil sonar seguro sobre algo que nunca verificó. La sección `design` cierra ese hueco declarando qué puede hacer realmente este proyecto — y la regla que la hace valiosa es la misma en todas las filas: **lo que no declarás no se asume, y el rol lo dice en voz alta.**

Leé primero la tercera columna. Es la que te dice qué te cuesta cada declaración faltante.

| Qué declarás | Qué habilita | Qué pasa si no lo declarás |
|---|---|---|
| `memory` — carpeta con las referencias, patrones aprobados y rechazados de este producto | Las propuestas se contrastan contra lo que *este* producto considera bueno | Cada entregable arrastra *"sin memoria de diseño declarada: la dirección no se contrastó contra las referencias del producto"* |
| `sources` — el archivo de diseño o los screenshots de referencia que son fuente de verdad | La dirección puede derivarse de la fuente de diseño | La dirección sale solo del brief y del registro |
| `registry` — dónde se mira para saber si un componente ya existe | El reuso se verifica antes de proponer algo nuevo | Cada propuesta arrastra *"reuso no verificado"*, y los componentes nuevos quedan marcados como *nuevo sin confirmar* |
| `runtime.url` — la URL donde corre la app en desarrollo | Un agente se conecta e inspecciona **sin pedirte permiso cada vez** | Te pide permiso en cada turno |
| `runtime.launch` — el perfil de arranque que levanta la app | Un agente levanta la app cuando la URL no responde | Te pide permiso, o la levantás vos |
| `capture` — cómo se capturan renders, y qué formatos están en alcance | Se vuelve posible un veredicto de **calidad visual** | Solo conformidad de código, etiquetada como tal — nunca un juicio de calidad |
| `checks` — comandos que miden accesibilidad o rendimiento | Esas afirmaciones se declaran **medidas** | Se declaran razonadas, etiquetadas como no medidas |

### Forma completa

```json
{
  "design": {
    "memory": "docs/design",
    "sources":  [ { "kind": "figma", "ref": "https://…" } ],
    "registry": { "kind": "storybook", "ref": "http://localhost:6006" },
    "runtime":  { "url": "http://localhost:3000", "launch": ".claude/launch.json#dev" },
    "capture":  { "kind": "browser", "viewports": ["desktop", "mobile"], "out": "docs/design/.evidence" },
    "checks":   [ { "kind": "a11y", "cmd": "npm run a11y" } ]
  }
}
```

Cada clave es opcional e independiente. `{"design": {"memory": "docs/design"}}` es una declaración completa y válida.

**Dos permisos, no uno.** `runtime.url` y `runtime.launch` están separados a propósito: conectarse a algo que ya corre es inspección; ejecutar un perfil de arranque corre un comando en tu máquina. Declarar `runtime` no concede ninguno de los dos por sí solo — cada clave concede únicamente lo suyo. La precedencia es url primero (el servidor suele estar ya corriendo fuera de la sesión, y duplicarlo es desperdicio); el perfil de arranque corre solo cuando la URL no responde. Lo que un agente levanta, lo baja.

**Declararlo ES el permiso.** Ese es el punto de la sección: lo concedés una vez, en un archivo que podés leer y revertir, en lugar de aprobar la misma acción cada sesión.

**Valores cerrados y libres.** `registry.kind` (`storybook` | `doc` | `none`) y `capture.kind` (`browser` | `playwright`) son cerrados, porque un rol necesita saber *cómo* consumirlos. Todo lo demás es etiqueta libre — `viewports`, `checks.kind`, `sources.kind` — porque los formatos y las herramientas son de tu producto, no de este plugin. No hay set de viewports por defecto: un kiosco o una herramienta solo-escritorio no son un olvido.

**Los valores desconocidos se nombran, no se tragan.** Un `kind` que esta versión del plugin no conoce se trata como si la capacidad estuviera ausente, y el arranque de sesión lo dice. Nunca bloquea nada.

### Recibos de evidencia

Cuando se capturan renders, pueden acompañarse de un recibo para que quien revise — humano o `qa-test-architect` — sepa qué se miró realmente:

```json
{ "workItem": "docs/stories/0042-listado-solicitudes.md",
  "tree": "dirty",
  "generatedAt": "2026-08-02T14:20:00-03:00",
  "shots": [ { "viewport": "desktop", "state": "empty", "path": "docs/design/.evidence/listado-desktop-empty.png" } ] }
```

Anclado al work item y al estado del árbol, no a un commit — las capturas ocurren antes de commitear. Lo que importa es **qué estados** se capturaron, no cuántas imágenes existen.

Deliberadamente **no** es una puerta. Un recibo que un agente escribe sobre su propio trabajo prueba que hay imágenes, no que alguien las miró — la misma razón por la que los timestamps reconstruidos están guardados en otra parte. Su valor es hacer la evidencia revisable, y no se vende como prueba.

## La marca: `configuredWith`

Una línea que registra con qué versión del plugin se configuró este proyecto por última vez. Es **estado, no política**: ningún comportamiento la lee. Borrala y lo único que perdés es el aviso.

Al arrancar la sesión:

| Situación | Qué ves |
|---|---|
| Sin `crew.json` | Nada. Comportamiento legacy, exactamente como antes |
| Marca ausente | Una línea: este proyecto es anterior a la marca; `/crew:setup` muestra qué se puede declarar |
| Aterrizó una migración **requerida** después de la versión marcada | Una línea que la nombra y dice dónde leerla |
| Una capacidad opcional que simplemente no usás | **Nada, nunca.** Un proyecto sin interfaz no está atrasado |
| Un `kind` que el plugin no reconoce | Una línea que lo nombra |

El aviso se cierra cuando la marca se actualiza — incluido cuando tu respuesta es "lo vi y no quiero nada", que igual actualiza la marca. No hay interruptor de silencio aparte, porque no queda nada que silenciar una vez reconocido el estado.

Qué versiones cuentan como requeridas se declara explícitamente en el `migrations.json` del plugin cuando se publica una versión — nunca se infiere del changelog. Si se respetan las invariantes de arriba, este aviso no va a saltar casi nunca. Eso es el mecanismo funcionando, no un defecto.

## Configurar: `/crew:setup`

`/crew:setup` corre la entrevista de configuración. Lee tu repo primero, pregunta como máximo dos cosas por turno, muestra exactamente qué va a escribir, escribe solo lo que confirmaste y actualiza la marca. Nunca adivina una capacidad que podés confirmar en una línea, y nunca escribe contenido en tu memoria de diseño — tus referencias y tus rechazos son tu gusto, no el de un agente.

Decir "nada, gracias" es un resultado completo y válido.

El set de preguntas que sigue está fijo y versionado en el plugin (`standards/configuration-interview.md`), así que una corrida de setup es siempre la misma conversación y no una improvisación.

## Matriz de comportamiento — guard × config

| Guard | Lee | `team` | `solo` | Sin `crew.json` (v0.19.1) |
|---|---|---|---|---|
| Entradas de `docs/work/` inmutables ([guard-immutable](../../hooks/guard-immutable.js)) | nada | inmutables | inmutables | inmutables |
| Historias/requerimientos Closed inmutables (guard-immutable) | `mode` | inmutables | **editables** | inmutables |
| Estimación completa al cierre ([guard-estimation](../../hooks/guard-estimation.js)) | `mode`, `metrics` | siempre activo | solo con `metrics: true` | activo |
| Timestamps en tiempo real ([guard-timestamps](../../hooks/guard-timestamps.js)) | `metrics` | con `metrics: true` | con `metrics: true` | apagado |
| Techos de tamaño al escribir ([guard-code-quality](../../hooks/guard-code-quality.js)) | `quality`, `ceilings` | según `quality` | según `quality` | enforce |
| Recordatorio de work-log al cerrar sesión ([check-work-log](../../hooks/check-work-log.js)) | `mode` | activo donde exista `docs/work/` | apagado | activo donde exista `docs/work/` |
| Puerta de calidad pre-commit ([check-staged.js](../../bin/check-staged.js)) | `ceilings` | siempre, una vez instalada | siempre, una vez instalada | siempre, una vez instalada |
| Reporte `/crew:metrics` ([metrics.js](../../bin/metrics.js)) | nada | corre | corre | corre |

La última fila es el patrón a recordar: **el reporte corre en cualquier lado; lo que `metrics: true` habilita es la disciplina**. Detalles en [metrics.md](metrics.md).

## Cómo lo escribe `init-project.sh`

`bash <plugin>/bin/init-project.sh` (desde la raíz de tu proyecto) scaffoldea la estructura del crew y escribe `crew.json` con **todos los valores explícitos**:

```json
{
  "mode": "team",
  "metrics": true,
  "quality": "advise",
  "ceilings": {},
  "configuredWith": "<versión actual del plugin>",
  "design": {
    "memory": "docs/design"
  }
}
```

`design.memory` es la única capacidad sembrada, porque el scaffold crea la carpeta a la que apunta. Todo lo demás — dónde corre la app, el registro de componentes, la captura de renders — queda sin declarar a propósito: el scaffold nunca adivina una capacidad. `/crew:setup` pregunta.

Con `--solo` escribe `"mode": "solo"` (mismos otros valores) y scaffoldea solo la estructura mínima: `AGENTS.md`, `CLAUDE.md`, `standards/`, `docs/decisions/`, `docs/work/`, `docs/design/` — sin la taxonomía de stories/requirements/briefs. La memoria de diseño viaja en ambos modos: quien trabaja solo también construye interfaz. En ambos modos instala además la puerta de calidad como `.git/hooks/pre-commit`: si ya existe un hook pre-commit, la línea de la puerta se **agrega al final**, nunca sobreescribe; si ya corre `check-quality.sh`, lo deja en paz; si no hay `.git`, avisa que hagas `git init` y vuelvas a correr el script. Los archivos existentes — incluido un `crew.json` existente — nunca se sobreescriben.

## Ejemplos trabajados

**Team por defecto** — lo que escribe el scaffold. Ceremonia completa, disciplina de métricas activa, calidad advisory al escribir con el freno duro en el commit:

```json
{ "mode": "team", "metrics": true, "quality": "advise", "ceilings": {} }
```

**Solo con métricas** — trabajás solo pero querés números honestos. Los ítems Closed siguen editables y no hay recordatorio de work-log, pero la tabla de estimación y los timestamps en tiempo real se hacen cumplir:

```json
{ "mode": "solo", "metrics": true, "quality": "advise", "ceilings": {} }
```

**Solo sin ceremonia** — el mínimo. Solo queda la inmutabilidad de `docs/work/` (y la puerta pre-commit, si está instalada):

```json
{ "mode": "solo", "metrics": false, "quality": "off", "ceilings": {} }
```

**Override de techos** — tus componentes legítimamente son más grandes y tus tests más largos:

```json
{ "mode": "team", "metrics": true, "quality": "advise",
  "ceilings": { "component": 250, "test": 400 } }
```

Para archivos grandes puntuales (código generado, datos planos), no subas el techo de todo el tipo — [pre-registrá una exención](enforcement.md#exenciones).
