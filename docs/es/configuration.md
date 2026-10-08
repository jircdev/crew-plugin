# Configuración — `crew.json`

`crew.json` es el archivo de política del proyecto para los guards del crew: un JSON pequeño en la raíz que decide qué reglas se aplican y con qué dureza. Cada valor es explícito — el archivo *es* la política, visible y versionada junto al código. Cuando un guard te bloquea y querés saber por qué, esta página te dice a qué campo obedeció; los mensajes de denegación están catalogados en [enforcement.md](enforcement.md).

## Cómo lo encuentran los guards

Cada guard resuelve la configuración subiendo desde el directorio del archivo que se está editando (o desde el directorio de trabajo de la sesión, como fallback), buscando `crew.json`, hasta 30 niveles o la raíz del filesystem. Gana el primer `crew.json` encontrado. En un monorepo, cada proyecto puede llevar su propio `crew.json` y cada edición se rige por el más cercano hacia arriba. Lector: [`../../hooks/lib/config.js`](../../hooks/lib/config.js).

## La regla legacy — sin `crew.json`

**Sin `crew.json` (o con JSON inválido), los guards que ya existían en v0.19.1 se comportan exactamente como entonces.** El lector no devuelve nada y cada guard cae a su comportamiento pre-configuración. Los guards agregados después (forma, shell, políticas) solo avisan; la [matriz](#matriz-de-comportamiento--guard--config) lo detalla:

- Entradas de `docs/work/` e ítems de trabajo Closed: inmutables.
- Puerta de estimación al cierre: activa.
- Guard de timestamps: **apagado** (solo existe con `"metrics": true`).
- Calidad de código: **enforce** — las escrituras que superan el techo se deniegan.
- Stop hook del work-log: activo donde exista `docs/work/`.

Dos consecuencias. Primera, el plugin **no tiene defaults ocultos**: los valores más amables que reciben los proyectos nuevos (`advise`, métricas activadas) existen solo porque el scaffold ([`../../scripts/init-project.js`](../../scripts/init-project.js)) los escribe explícitamente en el `crew.json` del proyecto. Segunda, un `crew.json` con un error de sintaxis JSON se comporta como si no existiera — lo que convierte silenciosamente `"quality": "advise"` en enforce. Si un guard se puso más estricto de golpe, verificá que el JSON parsea.

## Referencia de campos

| Campo | Valores | Default si falta | Qué controla |
|---|---|---|---|
| `mode` | `"team"` \| `"solo"` | `"team"` | Si aplica la ceremonia completa del circuito de entrega. Cualquier cosa distinta del string exacto `"solo"` cuenta como team. |
| `metrics` | `true` \| `false` | `false` | La disciplina de timestamps de estimación. Solo el literal `true` la activa. |
| `quality` | `"advise"` \| `"enforce"` \| `"off"` | `"enforce"` | Qué hace el guard de calidad en tiempo de escritura ante una violación de techo. Valores desconocidos caen a `"enforce"`. |
| `ceilings` | objeto `{ kind: líneas }` | `{}` | Overrides por tipo de los techos de líneas por archivo. Valores no-objeto caen a `{}`. |
| `configuredWith` | string de versión | `null` | Dato de estado: con qué versión del plugin se configuró este proyecto por última vez. Ningún comportamiento lo usa para decidir; ver [La marca](#la-marca-configuredwith). |
| `design` | objeto | `null` | Qué *puede hacer* este proyecto para el trabajo de interfaz. Nada se concede por defecto; ver [Capacidades de diseño](#capacidades-de-diseño). |
| `testing` | objeto (`guide`, `e2e`, `commands`, `receipts`) | `null` | Qué puede verificar este proyecto y con qué. Declararlo convierte la tabla de verificación en compuerta de cierre; ver [Capacidades de testing](#capacidades-de-testing). |
| `audit` | `true` \| `false` | `false` | Registro de las decisiones de los guards en `.crew/audit.log`, solo en modo team; ver [Registro de auditoría](#registro-de-auditoría-audit). |
| `telemetry` | `false` | sin efecto | Solo puede prohibir el registro de uso del catálogo para todo el equipo. Cada persona lo activa en su máquina; ver [Uso del catálogo](#uso-del-catálogo-telemetry). |

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

`advise` es lo que el scaffold escribe para proyectos nuevos: el agente no pierde impulso y el freno duro está en el commit. Ojo: la puerta pre-commit ([`../../scripts/check-quality.sh`](../../scripts/check-quality.sh)) **no** lee `quality` — poner calidad en `off` silencia el hook y deja la puerta activa. Para quitar la puerta, borrá su línea de `.git/hooks/pre-commit`.

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

Solo se revisan archivos de código (`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, `.rs`, `.py`, `.go`, `.java`, `.rb`, `.php`, `.cs`, `.kt`, `.swift`, `.vue`, `.svelte`, …). `"ceilings"` sobreescribe el número por tipo; la detección del tipo sigue igual. Tanto el guard de escritura como la puerta pre-commit respetan los mismos overrides, y ambos respetan las [exenciones pre-registradas](enforcement.md#exenciones) en `docs/DEVIATIONS.md`. Lógica: [`../../hooks/lib/ceilings.js`](../../hooks/lib/ceilings.js).

## Capacidades de diseño

El trabajo de interfaz es donde a un agente le resulta más fácil sonar seguro sobre algo que nunca verificó. La sección `design` cierra ese hueco declarando qué puede hacer realmente este proyecto — y la regla que la hace valiosa es la misma en todas las filas: **lo que no declarás no se asume, y el rol lo dice en voz alta.**

Leé primero la tercera columna. Es la que te dice qué te cuesta cada declaración faltante.

| Qué declarás | Qué habilita | Qué pasa si no lo declarás |
|---|---|---|
| `memory` — carpeta con las referencias, patrones aprobados y rechazados de este producto | Las propuestas se contrastan contra lo que *este* producto considera bueno | Cada entregable arrastra *"sin memoria de diseño declarada: la dirección no se contrastó contra las referencias del producto"* |
| `baseline` — el gusto de respaldo para lo que tu memoria no contesta: un skill que se carga, o un documento que se lee | Las preguntas sobre las que tu memoria calla caen a un estándar que elegiste **vos** | El entregable dice que la dirección se apoya solo en el brief; el plugin nunca pone gusto propio |
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
    "baseline": { "kind": "skill", "ref": "frontend-design" },
    "sources":  [ { "kind": "figma", "ref": "https://…" } ],
    "registry": { "kind": "storybook", "ref": "http://localhost:6006" },
    "runtime":  { "url": "http://localhost:3000", "launch": ".claude/launch.json#dev" },
    "capture":  { "kind": "browser", "viewports": ["desktop", "mobile"], "out": "docs/design/.evidence" },
    "checks":   [ { "kind": "a11y", "cmd": "npm run a11y" } ]
  }
}
```

Cada clave es opcional e independiente. `{"design": {"memory": "docs/design"}}` es una declaración completa y válida.

**Dos permisos separados.** `runtime.url` y `runtime.launch` están separados a propósito: conectarse a algo que ya corre es inspección; ejecutar un perfil de arranque corre un comando en tu máquina. Declarar `runtime` no concede ninguno de los dos por sí solo — cada clave concede únicamente lo suyo. La precedencia es url primero (el servidor suele estar ya corriendo fuera de la sesión, y duplicarlo es desperdicio); el perfil de arranque corre solo cuando la URL no responde. Lo que un agente levanta, lo baja.

**Declararlo ES el permiso.** Ese es el punto de la sección: lo concedés una vez, en un archivo que podés leer y revertir, en lugar de aprobar la misma acción cada sesión.

**La memoria manda sobre el baseline.** No son dos opiniones. `memory` es lo que es bueno en *este* producto; `baseline` se consulta únicamente donde la memoria calla, y pierde todo conflicto sin discusión. Declarar un baseline vale la pena cuando tu memoria de diseño es joven: evita la salida honesta-pero-genérica de un rol que no tiene contra qué contrastar. Apuntalo a lo que confíes — un skill instalado, tu propio documento de design system, la documentación de un design system público.

**Valores cerrados y libres.** `registry.kind` (`storybook` | `doc` | `none`), `capture.kind` (`browser` | `playwright`) y `baseline.kind` (`skill` | `doc`) son cerrados, porque un rol necesita saber *cómo* consumirlos — cargar un skill y leer un documento son acciones distintas. Un `baseline` sin `ref` se trata como no declarado y se nombra al arrancar la sesión. Todo lo demás es etiqueta libre — `viewports`, `checks.kind`, `sources.kind` — porque los formatos y las herramientas los elige tu producto. No hay set de viewports por defecto: un kiosco o una herramienta solo-escritorio no son un olvido.

**Los valores desconocidos se nombran.** Un `kind` que esta versión del plugin no conoce se trata como si la capacidad estuviera ausente, y el arranque de sesión lo dice. Nunca bloquea nada.

### Recibos de evidencia

Cuando se capturan renders, pueden acompañarse de un recibo para que quien revise — humano o `qa-test-architect` — sepa qué se miró realmente:

```json
{ "workItem": "docs/stories/0042-listado-solicitudes.md",
  "tree": "dirty",
  "generatedAt": "2026-08-02T14:20:00-03:00",
  "shots": [ { "viewport": "desktop", "state": "empty", "path": "docs/design/.evidence/listado-desktop-empty.png" } ] }
```

Se ancla al work item y al estado del árbol, porque las capturas ocurren antes de commitear. Lo que importa es **qué estados** se capturaron; la cantidad de imágenes no dice nada.

Es informativo: ninguna puerta lo exige. Un recibo que un agente escribe sobre su propio trabajo prueba que hay imágenes; que alguien las miró queda sin probar. Por la misma razón, los timestamps reconstruidos se controlan con otro guard. Su valor es hacer la evidencia revisable.

## Capacidades de testing

La misma regla que `design`, aplicada al otro lugar donde un agente suena seguro de algo que nunca verificó: **lo que no declaras no se asume.** La sección responde una pregunta que ningún plan puede esquivar — por cada comportamiento, en qué nivel se verifica, con qué, y cuánto cuesta.

| Qué declaras | Qué habilita | Qué pasa si no |
|---|---|---|
| `guide` — el documento que dice qué prueba este proyecto, en qué niveles, con qué barra | Los planes se contrastan contra una estrategia establecida | *"el proyecto no declara estrategia de testing: los niveles son propuestos, no establecidos"* |
| `e2e` — el arnés end-to-end y dónde viven sus specs | El plan **especifica la spec**: arnés, ruta, y las horas de escribirla | El escenario se queda en recorrido; el plan nombra el arnés faltante como costo a estimar |
| `commands` — los comandos que corren las suites | El estado de una suite se reporta como **corrido** | Pass/fail se reporta como afirmado, nunca como observado |

```json
{
  "testing": {
    "guide": "docs/guides/testing.md",
    "e2e": { "kind": "playwright", "specs": "tests/e2e" },
    "commands": [ { "kind": "e2e", "cmd": "npm run test:e2e" } ]
  }
}
```

**`e2e.kind` es una etiqueta libre.** A diferencia de `registry.kind` o `baseline.kind`, acá no hay enum cerrado: como se llame el arnés, la acción del rol es la misma — escribir el escenario como spec bajo `specs`. Catalogar herramientas de test sería el plugin eligiendo tu stack. `specs` es lo que hace usable la declaración; un `e2e` sin ella se trata como no declarado y se nombra al iniciar sesión.

**Declarar convierte la tabla de verificación en compuerta.** Con `testing` presente en cualquier forma, una story o requirement no llega a `Closed` sin su tabla `## Verification` — una fila por comportamiento: escenario, nivel, arnés, artefacto, estado. Vale en **ambos** modos, solo incluido, y es independiente de `metrics`: la compuerta de estimación es la disciplina de métricas, esta es tu propia declaración. `no verificado — sin arnés` es una fila perfectamente válida; una tabla ausente no, porque el silencio se lee igual que la cobertura.

**`receipts: true` vuelve comprobable un pass.** Es opcional, porque un campo ausente mantiene el comportamiento anterior. Con él, una fila de verificación `passing` cierra solo si cita un recibo escrito por `/crew:check` (`scripts/verify.js` corre los `commands` declarados y registra código de salida, horarios, HEAD de git y el final de la salida, con un hash para que no se pueda editar sin que se note). Sin `commands` no puede haber recibos, así que hay que declarar ambos.

**Lo que el estándar nunca impone.** Una herramienta concreta. Un plan que exige Playwright en un repo que nunca lo adoptó produce specs que no corren y una tabla que se lee cubierta mientras no se ejecuta nada. Declara el arnés una vez, acá, y todos los roles derivan de ahí.

## Registro de auditoría: `audit`

`"audit": true` (solo en modo team, opcional) hace que los guards de shell y de políticas agreguen una línea JSON por decisión a `.crew/audit.log`: cuándo, qué guard, si negó o avisó y qué regla saltó. Nunca registra el comando, el contenido del archivo ni ningún valor detectado. Conviene dejar `.crew/audit.log` fuera del control de versiones salvo que el equipo decida otra cosa.

## Uso del catálogo: `telemetry`

El uso del catálogo (qué roles, skills y comandos se usan) se registra **solo para la persona que lo activa**, en `.crew/local.json` (`{"telemetry": true}`, nunca versionado) o con `CREW_TELEMETRY=1`. El `crew.json` compartido no puede encenderlo para el resto del equipo; `"telemetry": false` ahí lo prohíbe para todos. Cada evento es una línea en `.crew/usage.jsonl`: la fecha (sin hora), el tipo y un nombre del catálogo; cualquier otra cosa se guarda como `other`, así que ningún texto de un prompt puede terminar ahí. Las líneas de más de 90 días se descartan, `.crew/.gitignore` deja el archivo fuera del repositorio y `/crew:doctor` bloquea si igual se commiteó. `/crew:metrics catalog` lo informa; `--purge` lo borra.

## La marca: `configuredWith`

Una línea que registra con qué versión del plugin se configuró este proyecto por última vez. Es un dato de estado: ningún comportamiento la lee. Borrala y lo único que perdés es el aviso.

Al arrancar la sesión:

| Situación | Qué ves |
|---|---|
| Sin `crew.json` | Nada. Comportamiento legacy, exactamente como antes |
| Marca ausente | Una línea: este proyecto es anterior a la marca; `/crew:setup` muestra qué se puede declarar |
| Aterrizó una migración **requerida** después de la versión marcada | Una línea que la nombra y dice dónde leerla |
| Una capacidad opcional que simplemente no usás | **Nada, nunca.** Un proyecto sin interfaz no está atrasado |
| Un `kind` que el plugin no reconoce | Una línea que lo nombra |

El aviso se cierra cuando la marca se actualiza — incluido cuando tu respuesta es "lo vi y no quiero nada", que igual actualiza la marca. No hay interruptor de silencio aparte, porque no queda nada que silenciar una vez reconocido el estado.

Qué versiones cuentan como requeridas se declara explícitamente en el `migrations.json` del plugin cuando se publica una versión — nunca se infiere del changelog. Si se respetan las invariantes de arriba, este aviso no va a saltar casi nunca, y ese silencio es el comportamiento esperado.

## Configurar: `/crew:setup`

`/crew:setup` corre la entrevista de configuración. Lee tu repo primero, pregunta como máximo dos cosas por turno, muestra exactamente qué va a escribir, escribe solo lo que confirmaste y actualiza la marca. Nunca adivina una capacidad que podés confirmar en una línea, y nunca escribe contenido en tu memoria de diseño: tus referencias y tus rechazos expresan tu gusto, y solo vos los escribís.

Decir "nada, gracias" es un resultado completo y válido.

El set de preguntas que sigue está fijo y versionado en el plugin (`standards/configuration-interview.md`), así que una corrida de setup es siempre la misma conversación y no una improvisación.

## Matriz de comportamiento — guard × config

| Guard | Lee | `team` | `solo` | Sin `crew.json` (v0.19.1) |
|---|---|---|---|---|
| Entradas de `docs/work/` inmutables ([guard-immutable](../../hooks/guard-immutable.js)) | nada | inmutables | inmutables | inmutables |
| Historias/requerimientos Closed inmutables (guard-immutable) | `mode` | inmutables | **editables** | inmutables |
| Estimación completa al cierre ([guard-estimation](../../hooks/guard-estimation.js)) | `mode`, `metrics` | siempre activo | solo con `metrics: true` | activo |
| Tabla de verificación al cierre (guard-estimation) | `testing` | con `testing` declarado | con `testing` declarado | apagado |
| Timestamps en tiempo real ([guard-timestamps](../../hooks/guard-timestamps.js)) | `metrics` | con `metrics: true` | con `metrics: true` | apagado |
| Techos de tamaño al escribir ([guard-code-quality](../../hooks/guard-code-quality.js)) | `quality`, `ceilings` | según `quality` | según `quality` | enforce |
| Forma del work item en cada escritura ([guard-shape](../../hooks/guard-shape.js)) | `quality`, `mode`, `docs/DEVIATIONS.md` | niega con `enforce`, avisa con `advise` | aviso | aviso |
| Evasión de hooks en comandos de shell ([guard-shell](../../hooks/guard-shell.js)) | presencia de `crew.json` | niega (falla cerrado) | niega (falla cerrado) | aviso |
| Relajar `crew.json` o los settings del host ([guard-policy](../../hooks/guard-policy.js)) | `quality`, `mode`, bloque `crew:policy` | niega con `enforce`, avisa con `advise` | aviso | aviso |
| Aviso de alcance tras escribir ([nudge-scope](../../hooks/nudge-scope.js)) | `mode`, el `Size:` del item activo | aviso | apagado | aviso |
| Recordatorio de work-log al cerrar sesión ([check-work-log](../../hooks/check-work-log.js)) | `mode` | activo donde exista `docs/work/` | apagado | activo donde exista `docs/work/` |
| Puerta de calidad pre-commit ([check-staged.js](../../scripts/check-staged.js)) | `ceilings` | siempre, una vez instalada | siempre, una vez instalada | siempre, una vez instalada |
| Reporte `/crew:metrics` ([metrics.js](../../scripts/metrics.js)) | nada | corre | corre | corre |

La última fila es el patrón a recordar: **el reporte corre en cualquier lado; lo que `metrics: true` habilita es la disciplina**. Detalles en [metrics.md](metrics.md).

## Cómo lo escribe `init-project.sh`

`bash <plugin>/scripts/init-project.sh` (desde la raíz de tu proyecto) scaffoldea la estructura del crew y escribe `crew.json` con **todos los valores explícitos**. El `.sh` envuelve a `scripts/init-project.js`, que también se puede correr con `node`; `--dry-run` muestra qué escribiría sin escribir nada, y cada archivo escrito queda registrado en `.crew/install-state.json` para `/crew:doctor`:

```json
{
  "mode": "team",
  "metrics": true,
  "quality": "advise",
  "ceilings": {},
  "configuredWith": "<versión actual del plugin>",
  "design": {
    "memory": "docs/design"
  },
  "testing": {
    "guide": "docs/guides/testing.md"
  }
}
```

Se siembran dos capacidades, y solo porque el scaffold crea el archivo al que cada una apunta: `design.memory` y `testing.guide`. Todo lo demás — dónde corre la app, el registro de componentes, la captura de renders, qué arnés e2e — queda sin declarar a propósito: el scaffold nunca adivina una capacidad, y menos una herramienta. `/crew:setup` pregunta.

Sembrar `testing` tiene una consecuencia que conviene saber de entrada: convierte la tabla de verificación del work item en compuerta de cierre desde el día uno. Esa es la intención para un proyecto que arranca hoy; borra la sección para optar por lo contrario.

Con `--solo` escribe `"mode": "solo"` (mismos otros valores) y scaffoldea solo la estructura mínima: `AGENTS.md`, `CLAUDE.md`, `standards/`, `docs/decisions/`, `docs/work/`, `docs/design/`, `docs/guides/testing.md` — sin la taxonomía de stories/requirements/briefs. La memoria de diseño y la guía de testing viajan en ambos modos: quien trabaja solo también construye interfaz y verifica su trabajo. En ambos modos instala además la puerta de calidad como `.git/hooks/pre-commit`: si ya existe un hook pre-commit, la línea de la puerta se **agrega al final**, nunca sobreescribe; si ya corre `check-quality.sh`, lo deja en paz; si no hay `.git`, avisa que hagas `git init` y vuelvas a correr el script. Los archivos existentes — incluido un `crew.json` existente — nunca se sobreescriben.

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

Para archivos grandes puntuales (código generado, datos planos), [pre-registrá una exención](enforcement.md#exenciones) para esa ruta y dejá el techo del tipo como está.
