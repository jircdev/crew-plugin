# Propuesta — Línea base de alcance, control de cambios y horas del proyecto

- **Tipo:** cambio de estándar (catálogo de docs, plantillas, config, guards, script de métricas)
- **Estado:** borrador para decisión del maintainer
- **Fecha:** 2026-09-24
- **Autor:** rol `CREW` (gobierno del catálogo), a pedido de Julio Rodriguez
- **Origen:** piloto en el proyecto DUIT (`balearesg/duit`), solo lectura: `docs/alcance/requerimientos-del-proyecto.md`, `docs/estimacion/estimacion.md`, `docs/estimacion/metodo.md`, `docs/estimacion/requerimientos/*.md`
- **Versión objetivo:** 0.26.0 (minor, aditiva, opt-in)
- **Borradores de plantillas:** [`templates/docs/scope/`](templates/docs/scope/) — escritos en inglés, como toda la capa `templates/`

## 1. El problema

El crew gobierna bien el ciclo de **cada work item** (historia o requirement técnico): estados Draft → Ready → In progress → Delivered → Validated → Closed, validación de `FA` criterio por criterio, tabla `## Estimation` con timestamps reales y `/crew:metrics` para calibrar. Gobierna también la **intención** del proyecto: el brief, con su magnitud gruesa.

Entre esos dos niveles queda un hueco. Un proyecto contratado con un cliente necesita tres cosas que hoy ninguna plantilla, ningún rol y ningún guard sostienen:

1. **Un catálogo de lo comprometido.** La lista numerada de lo que tiene que quedar funcionando, con la prueba que confirma cada punto, su fase, su fuente contractual, las historias que lo cubren y un estado confiable. La pregunta que el crew no sabe contestar es la más simple del proyecto: *¿dónde se marca que un requerimiento está cumplido?*
2. **Control de cambios contra ese catálogo.** Qué entró después de la firma, quién lo pidió, a qué requerimientos toca, cuántas horas suma y si el cliente aceptó el alcance y, por separado, el precio.
3. **Horas del proyecto.** Presupuesto cotizado contra horas trabajadas, por requerimiento y en total, en un documento que se mantiene solo con lo que las tablas de los work items ya registran.

El piloto de DUIT resolvió los tres a mano, y su propio contenido muestra el costo de hacerlo sin estándar:

- El estado de cada requerimiento se escribe en prosa («Hecho, falta verificar», «En construcción») y se mantiene copiando lo que dicen las historias. Cada actualización es un recorrido manual de 68 entradas.
- La § 20 del catálogo («Diferencias entre lo comprometido en agosto y lo que se está construyendo») es un registro de cambios que nació sin serlo: trece cambios de alcance anotados como diferencias, sin número, sin horas propias y sin el sí o el no del cliente.
- La estimación tuvo que inventar su regla de doble conteo («un hito se cuenta una sola vez; lo paga el requerimiento de número menor») porque nada en el estándar dice a qué requerimiento se imputa una hora.
- El campo `Cubre:` de las historias apunta a un plan histórico (`R1`) y el catálogo lista las historias en sentido inverso: la trazabilidad existe dos veces y en dos direcciones, que es la forma exacta del drift.

## 2. Juicio de catálogo: ningún rol nuevo

Esta propuesta **no agrega un rol**. La prueba de justificación del catálogo pide una autoridad distinta y recurrente que ningún rol posea; acá cada decisión ya tiene dueño:

| Decisión | Dueño hoy | Por qué ya es suya |
|---|---|---|
| Qué entra en lo comprometido, en qué fase, con qué fuente | `COM` (proyecto nacido de un cliente) o `PROD` (iniciativa interna) | Es la misma regla de autoría del brief: quien firma la intención firma su desglose |
| La redacción verificable de «cumplido cuando» | `FA` | Escribir condiciones observables es su oficio |
| El veredicto de que un requerimiento se cumplió | `FA` (funcional) · `QA` (no funcional) | Es validación contra criterios escritos, el mismo acto que hoy hace por historia |
| Que ningún cambio de alcance se absorba en silencio | `COORD` | Su doc ya lista «rescoping quietly» como antipatrón y «status legibility» como alcance |
| Si un cambio de alcance se acepta | sponsor humano (mapa de propiedad), registrado por `COM`/`PROD` | Nunca fue una decisión de agente |
| Horas pendientes por requerimiento | quien ejecuta, integrado por `SYS` | Es estimación en planning, la disciplina que ya existe |
| Horas trabajadas y estado derivado | el script | Nadie las escribe; se calculan |

Un «project manager» como rol sería un título sin decisión propia: fallaría la prueba de costo de ruteo (habría que elegir entre él, `COORD` y `PROD` para cada pregunta de alcance). Lo que falta son **artefactos** con dueños por campo y un **cálculo** que los una.

## 3. Dónde viven: un árbol nuevo, `docs/scope/`

Carpeta = naturaleza. Ninguna de las carpetas existentes tiene esta naturaleza: `briefs/` es la intención en prosa (por qué), `stories/` y `requirements/` son trabajo a ejecutar (cómo y cuándo). Lo comprometido es **el contrato hecho verificable**: vive mientras vive el proyecto, cambia solo por cambios registrados y es lo que se le muestra al cliente al cerrar.

```
docs/scope/
├── README.md          reglas del árbol, estados y derivación
├── baseline.md        el catálogo: RQ-NN y NFR-NN, con su verificación
├── changes/
│   ├── README.md      índice de cambios (bloque generado)
│   └── CH-NNN-slug.md un cambio por archivo
└── budget.md          presupuesto, pendiente estimado y trabajado (bloque generado)
```

Filas nuevas en `INDEX.md` (tabla de ruteo y de árboles) y en `MAINTAINING.md` («Nuevo compromiso con el cliente» → cambio en `docs/scope/changes/`; «Requerimiento cumplido» → fila de verificación en `baseline.md`).

**Cómo encaja con los niveles de estimación existentes.** El estándar ya tiene dos niveles; esta propuesta agrega el del medio y no toca los otros:

| Nivel | Dónde | Quién | Qué es |
|---|---|---|---|
| 1 · Magnitud | `briefs/` | `COM`/`PROD` | Orden de magnitud para juzgar viabilidad, antes de que exista una historia |
| **2 · Presupuesto** | **`scope/budget.md`** | **`COM` cotiza; ejecutores estiman el pendiente; `SYS` integra** | **Horas cotizadas por requerimiento y lo que falta, contra lo trabajado** |
| 3 · Hito | tabla `## Estimation` de cada work item | quien ejecuta | Hitos, horas estimadas y reales en tiempo real |

**Cómo encaja con el brief.** El brief aprobado autoriza escribir la línea base. La línea base se congela en una fecha (`Baselined:`), la del compromiso firmado. Desde esa fecha, todo requerimiento nuevo, modificado o retirado entra por un cambio (`CH-NNN`). Un cambio que altera la *intención* del proyecto, y no solo su alcance, sigue la regla del brief: supersesión por un brief nuevo, que a su vez origina los cambios.

**Cómo encaja con el circuito de entrega.** Tres agregados a `delivery-circuit.md` y su gemelo `.es.md`:

- **Paso 0.5 · Línea base** (tras la compuerta del sponsor, solo si el proyecto declara `scope`): `COM`/`PROD` escriben `baseline.md`; `FA` redacta cada «cumplido cuando»; el sponsor la aprueba por PR y esa aprobación fija `Baselined:`.
- **Paso 2 · Análisis:** toda historia o requirement declara en su cabecera `**Covers:** RQ-NN[, RQ-MM]`. El primer ID es el que **paga** las horas del ítem.
- **Paso 4 · Validación:** cuando todos los work items de un requerimiento llegan a su estado terminal, `FA` (o `QA` para un no funcional) recorre el «cumplido cuando» del requerimiento completo y registra la fila de verificación. Ese es el único lugar donde se marca un requerimiento como cumplido.

## 4. El catálogo y la respuesta a «¿dónde se marca que está cumplido?»

**Se marca en una sola fila escrita a mano**: la tabla `#### Verification` de la entrada del requerimiento en `baseline.md`, con fecha, veredicto, evidencia y quién. Todo lo demás del estado se deriva.

La razón: el estado de un requerimiento depende de dos hechos de naturaleza distinta. Uno es mecánico (en qué estado están sus work items) y ya está escrito en los work items; copiarlo al catálogo crea una segunda fuente. El otro es un juicio (el requerimiento *completo* cumple su «cumplido cuando», que puede exigir más que la suma de sus historias: probarlo en web y app con la misma cuenta, por ejemplo) y ese juicio solo puede escribirlo una persona con la lente de `FA`. La propuesta separa los dos: el juicio se escribe, el resto se calcula.

### Campos de cada entrada

| Campo | Obligatorio | Quién | Qué es |
|---|---|---|---|
| `### RQ-NN — Título` | sí | `COM`/`PROD` | ID fijo, nunca se reutiliza; `NFR-NN` para no funcionales |
| Párrafo inicial | no | `COM`/`PROD` | Qué queda funcionando, en una frase |
| `Done when` | sí | `FA` | La prueba, en lenguaje llano, que cualquiera puede hacer |
| `Phase` | sí | `COM`/`PROD` | Fase o entrega; `—` si la fuente no la asigna |
| `Source` | sí | `COM`/`PROD` | Documento contractual y sección (link al repo comercial, nunca copia) |
| `Origin` | sí | `COM`/`PROD` | `baseline` o el `CH-NNN` que lo creó o modificó |
| `Blocked by` | no | cualquiera, confirma `COORD` | Dependencia externa con nombre (credenciales, trámite, decisión del cliente) |
| `Withdrawn by` | no | `COM`/`PROD` | `CH-NNN` que lo retiró; la entrada queda, tachada de hecho por el estado |
| `Notes` | no | cualquiera | Matices del avance en prosa; el estado derivado nunca se escribe acá |
| `#### Verification` | tabla, puede estar vacía | `FA` / `QA` | Filas append-only: fecha, veredicto (pass/fail), evidencia, por |

Lo que el catálogo **deja de llevar** respecto del piloto: el estado escrito a mano y la lista manual de historias. Los dos pasan al bloque generado del final del archivo, que el script reescribe.

### Estados y regla de derivación

Sea *W* el conjunto de work items (historias y requirements) cuya cabecera `Covers` nombra al requerimiento. Terminal para una historia es `Validated` o `Closed`; para un requirement técnico, `Closed` (no tiene `Validated`). Se evalúa en este orden y gana la primera regla que se cumple:

1. **Withdrawn** — la entrada tiene `Withdrawn by`.
2. **Fulfilled** (cumplido) — la última fila de `Verification` es `pass`, todo ítem de *W* está en su estado terminal, y la fecha de esa fila es igual o posterior al último commit de cada ítem de *W*. Si *W* está vacío, alcanza con la fila `pass` y el reporte lo marca «verified without work items» (caso de un no funcional como «sin publicidad de terceros»).
3. **Blocked** — tiene `Blocked by`. Se muestra junto con el avance que tendría sin el bloqueo («Blocked · In progress»).
4. **Delivered** (entregado, falta verificar el requerimiento) — *W* no vacío y todo ítem de *W* está en Delivered o más allá.
5. **In progress** — algún ítem de *W* está en In progress o más allá.
6. **Not started** — el resto. Con *W* vacío se agrega la marca **Uncovered**: nadie escribió todavía cómo se comporta (el «Sin historia» del piloto, ahora detectado solo).

Dos consecuencias buscadas. Una fila `fail` posterior a un `pass` devuelve el requerimiento a Delivered sin que nadie toque el estado. Y un work item reabierto después de la verificación la invalida, porque su commit queda posterior a la fila.

Equivalencias con el piloto: Hecho = Fulfilled; Hecho, falta verificar = Delivered; En construcción = In progress; Sin empezar = Not started; Bloqueado por… = Blocked.

## 5. Control de cambios

Un archivo por cambio, `docs/scope/changes/CH-NNN-slug.md`, numeración correlativa sin reutilizar. Ciclo:

```
Proposed → Estimated → Decided → Applied
                              ↘ Rejected        (desde cualquiera: Withdrawn)
```

- **Proposed** — lo abre quien detecta el cambio. `COORD` es el custodio del registro: cuando ve trabajo sin `Covers` o una decisión que mueve el alcance, abre la entrada.
- **Estimated** — los ejecutores estiman las horas del impacto, `SYS` integra. Sin horas no se decide.
- **Decided** — dos decisiones del cliente, registradas por separado porque en la práctica se separan (el piloto tiene alcance aceptado por escrito sin precio): **alcance aceptado** sí/no/pendiente y **precio aceptado** sí/no/pendiente, cada una con fecha y evidencia (link a la reunión o al mail en el repo comercial). Un cambio interno sin impacto para el cliente lo decide el sponsor y lo dice.
- **Applied** — `baseline.md` refleja el cambio: requerimientos nuevos con `Origin: CH-NNN`, modificados con la fila en su historial, retirados con `Withdrawn by`. Solo se aplica con alcance aceptado = sí.

Horas de un cambio con alcance aceptado y precio no aceptado cuentan como **sin financiar** en el presupuesto: se construyen, se ven y no se esconden dentro de la línea base. Es la cifra que el piloto calculó a mano como «ninguna de esas horas tiene aceptación del cliente».

## 6. Horas del proyecto

`budget.md` tiene dos partes. La **escrita a mano** es una tabla por requerimiento: fase, horas cotizadas (`COM`, desde el compromiso firmado o desde el cambio aceptado) y horas pendientes estimadas (quien ejecuta, `SYS` integra). La **generada** la reescribe el script: trabajado, pronóstico (trabajado + pendiente), desvío contra presupuesto, totales por fase y por origen.

Reglas de imputación, para que una hora se cuente una sola vez sin reglas inventadas por proyecto:

- **Trabajado de un requerimiento** = suma de `Actual hours` de todos los hitos de los work items cuyo **primer** ID en `Covers` es ese requerimiento, en cualquier estado (las horas de un ítem en curso ya se gastaron). Los demás IDs de `Covers` muestran el ítem como «cubierto por».
- **Horas sin requerimiento** — work items sin `Covers` aparecen en una fila propia, «Not in baseline». Esa fila es un detector de cambios: trabajo real sin compromiso detrás es un cambio no registrado o trabajo interno que alguien debe declarar.
- **Toda hora vive en un work item.** Trámites, pruebas de conjunto, beta: si cuestan horas, son un requirement técnico con su tabla. El presupuesto nunca lleva horas trabajadas escritas a mano.
- **Presupuesto financiado** = cotizado de la línea base + cotizado de cambios con precio aceptado. **Sin financiar** = cambios con alcance aceptado y precio no aceptado. Los cambios pendientes se muestran aparte.
- **Una sola unidad.** El reporte compara horas cotizadas con `Actual hours` tal como las registran las tablas. Un proyecto que cotiza en una unidad y trabaja en otra (el piloto: horas nominales con coeficientes por clase) documenta su conversión en su método y la registra en `DEVIATIONS.md`; el script reporta las dos columnas crudas y nunca aplica un factor que el proyecto no declaró.

## 7. Cálculo automático y enforcement

Nada de esto se activa sin que el proyecto lo declare. Todo guard falla abierto, como los existentes.

### Script: `scripts/metrics.js scope`

Se extiende el script existente con un modo `scope`, para que las tablas de los work items tengan un solo lector. Antes de extenderlo se consolida el parser: hoy `metrics.js` y `hooks/guard-estimation.js` parsean la tabla `## Estimation` cada uno por su lado. Se extrae a `hooks/lib/work-items.js` (estado, `Covers`, filas de estimación, fila Total) y lo consumen los dos, más el nuevo modo.

```
/crew:metrics scope            # imprime estado por requerimiento, presupuesto vs trabajado
/crew:metrics scope --write    # además reescribe los bloques generados de baseline.md, budget.md y changes/README.md
```

Los bloques generados van entre marcadores `<!-- crew:generated scope-status -->` … `<!-- /crew:generated -->`. Fuera de los marcadores el script no toca nada. El cálculo usa `git log -1 --format=%cI` por archivo para la regla de fecha de la verificación, igual que `metrics.js` ya usa git para el lead time.

### Guard nuevo: `hooks/guard-scope.js` (PreToolUse, Edit|Write)

Activo solo con `scope` declarado. En `team` deniega; en `solo` avisa y deja pasar.

| Regla | Qué rechaza |
|---|---|
| Referencia válida | Un `Covers` que nombra un ID inexistente o retirado |
| IDs estables | Borrar el heading de una entrada del catálogo (se retira con `Withdrawn by`) |
| Entrada por cambio | Una entrada nueva después de `Baselined:` sin `Origin: CH-NNN` |
| Verificación con base | Una fila `pass` cuando algún ítem de *W* no llegó a su estado terminal; el mensaje lista cuáles faltan |
| Cambio aplicado con decisión | Un cambio a `Applied` sin alcance aceptado = sí; un `Origin: CH-NNN` que apunta a un cambio no aplicado |
| Bloques generados | Editar a mano el contenido entre marcadores |

Registro en `hooks.json` y paridad con el adaptador de Codex (`hooks/codex-pre-tool.js` reutiliza hoy cuatro guards; pasa a cinco, con su test de paridad).

### Puerta de commit y cierre de sesión

- `scripts/check-staged.js`: si el commit toca work items o archivos de `scope/` y los bloques generados quedan desactualizados, avisa o bloquea según `quality` (`advise`/`enforce`), el mismo criterio que la puerta de calidad.
- `hooks/check-work-log.js` (Stop, solo `team`): recuerda correr `--write` si en la sesión cambió algún work item.

### `crew.json`

```json
"scope": {
  "baseline": "docs/scope/baseline.md",
  "changes": "docs/scope/changes",
  "budget": "docs/scope/budget.md"
}
```

`normalizeScope()` en `hooks/lib/config.js` transporta la sección. Sin `baseline` la sección se trata como ausente y se anota en `unknown`. `budget` y `changes` son opcionales: sin `budget` el reporte da solo trabajado; sin `changes` la regla «entrada por cambio» queda muda y se nombra al arrancar la sesión. Cumple los invariantes: clave nueva, opcional, y declararla no concede ninguna capacidad a un agente (activa compuertas, como `testing`). Las rutas son configurables porque un proyecto existente ya tiene sus archivos en otro lado (el piloto usa `docs/alcance/`).

**Etiquetas en español.** Los proyectos que escriben su documentación en español pueden usar un conjunto fijo de etiquetas equivalentes, que el parser acepta igual que hoy acepta `Estado: Cerrada`: `Cubre`/`Covers`, `Cumplido cuando`/`Done when`, `Bloqueado por`/`Blocked by`, `Origen`/`Origin`, `Retirado por`/`Withdrawn by`, `Fase`/`Phase`, `Fuente`/`Source`. Los headings de tabla (`#### Verification`) y los marcadores siguen en inglés, como `## Estimation`.

### `/crew:setup`

Una pregunta nueva en `standards/configuration-interview.md`: «¿Este proyecto tiene un alcance comprometido con un cliente o un sponsor, con horas cotizadas?». Con un sí: copia las plantillas de `docs/scope/` (o apunta a los archivos que el proyecto ya tiene) y declara `scope`. `init-project.sh` no siembra el árbol: un producto interno sin contrato no está atrasado por no tenerlo, y el scaffold nunca adivina una capacidad.

## 8. Modo solo y modo team

| | team | solo |
|---|---|---|
| Artefactos | los tres | los tres; `changes/` puede quedar vacío |
| Aprobación de la línea base y de los cambios | PR aprobado por el sponsor del mapa de propiedad | la persona misma, con la evidencia del cliente enlazada |
| `guard-scope` | deniega | avisa |
| Bloques desactualizados al commit | según `quality` | según `quality` |
| Recordatorio Stop | sí | no |
| Estado derivado | completo | el modo solo no siembra historias: si no hay work items, el estado se reduce a **Fulfilled** (fila `pass`) o **Not verified**, y el trabajado sale de los work items que existan. El reporte dice qué fuente le faltó |

Quien trabaja solo como freelance tiene cliente igual que un equipo, así que el árbol vale en los dos modos. Lo que se afloja es la ceremonia de aprobación entre personas.

## 9. Migración para proyectos existentes

Fila en `migrations.json` con `required: false`: es aditiva y opt-in, y un proyecto que no declara `scope` se comporta exactamente como antes. Guía `docs/es/migration-0.26.md` y su espejo `docs/en/migration-0.26.md`.

Pasos para un proyecto con catálogo propio (el caso de DUIT):

1. **Declarar** `scope` en `crew.json` apuntando a los archivos que ya existen, o correr `/crew:setup`.
2. **Repuntar la trazabilidad a los work items.** Cada historia o requirement lleva `Covers`/`Cubre` con IDs del catálogo, con el que paga primero. En DUIT, `Cubre:` apunta hoy al plan histórico y se reemplaza. Las listas de historias escritas en el catálogo se borran después del primer `--write`, que las regenera.
3. **Convertir el estado escrito en verificación.** Los requerimientos que alguien ya confirmó reciben su fila `pass` con fecha y evidencia; el resto del texto de estado pasa a `Notes`. El estado queda derivado.
4. **Convertir las diferencias en cambios.** Cada fila de la tabla de diferencias del piloto (§ 20) se vuelve un `CH-NNN` con su decisión de alcance y de precio en el estado real de hoy, casi todas «pendiente». La tabla de dependencias del cliente (§ 18) se vuelve `Blocked by` en cada requerimiento que bloquea.
5. **Armar `budget.md`** con las horas cotizadas por requerimiento y el pendiente de la última estimación. Si el proyecto usa una unidad doble, su método queda como está y se registra en `DEVIATIONS.md`.
6. **Correr** `/crew:metrics scope --write` y revisar la fila «Not in baseline».

Para un proyecto sin catálogo previo: `/crew:setup`, escribir la línea base desde el brief aprobado y el contrato, fijar `Baselined:`.

## 10. Registro completo (lo que el cambio toca al implementarse)

- `templates/docs/scope/` (README, `baseline.md`, `changes/README.md`, `budget.md`) — borradores en esta carpeta
- `templates/docs/stories/README.md` y `templates/docs/requirements/README.md`: campo `**Covers:**` en la plantilla y la regla del primer ID
- `templates/docs/INDEX.md`, `templates/docs/MAINTAINING.md`, `templates/docs/AGENTS.md` (sección `docs/scope/`)
- `templates/docs/guides/delivery-circuit.md` y `delivery-circuit.es.md` (pasos 0.5, 2 y 4; fila en la matriz rol → artefacto)
- `agents/`: una línea de alcance en `commercial-strategist`, `product-strategist`, `functional-analyst`, `delivery-coordinator` y `system-architect` con el campo que posee cada uno; sin cambios de alias ni roles nuevos
- `hooks/lib/work-items.js` (parser consolidado), `hooks/lib/config.js` (`normalizeScope`), `hooks/guard-scope.js`, `hooks/hooks.json`, `hooks/codex-pre-tool.js`, `hooks/check-work-log.js`, `scripts/check-staged.js`, `scripts/metrics.js`, `commands/metrics.md`
- `standards/configuration-interview.md`
- `docs/es/` y `docs/en/`: `configuration.md`, `enforcement.md`, `metrics.md`, `migration-0.26.md`
- `migrations.json` (fila `required: false`), `CHANGELOG.md`, versión 0.26.0 en `plugin.json` y `marketplace.json`, `node scripts/sync-codex.js`, tests del parser, de la derivación y del guard

## 11. Decisiones abiertas para el maintainer

1. **El nombre del ID.** En inglés, «requirement» ya nombra los work items técnicos de `docs/requirements/`. La propuesta mantiene `RQ-NN` («committed requirement») por continuidad con el piloto y con el vocabulario del cliente, y lo glosa en la plantilla. La alternativa es «commitment» con ID `C-NN`, sin colisión y con una migración más en DUIT.
2. **Imputación por hito.** La v1 imputa el ítem entero al primer `Covers`. El piloto reparte a veces los hitos de una misma historia entre requerimientos. Una columna opcional por hito en `## Estimation` lo resolvería a costa de tocar la tabla más usada del estándar; la propuesta lo deja para después de ver datos.
3. **Dónde viven las propuestas del plugin.** El repo no tenía convención para sus propias propuestas. Esta quedó en `proposals/<tema>/` en la raíz, fuera de la lista que empaqueta `scripts/package-plugin.js`, así que no viaja a los consumidores. Si se adopta, conviene una línea en `docs/*/contributing.md`.

## 12. Piloto DUIT (25-sep)

DUIT llevó la propuesta a la práctica el 2026-09-25. Cinco aprendizajes que conviene incorporar antes de implementarla:

1. **El plan de horas vive por requerimiento, separado de la ejecución.** Un archivo de plan con una fila por RQ (construcción, pruebas, trámites, definición) y sin hitos, que cambia solo por un cambio registrado o una replanificación fechada. Los hitos nacen en la tabla `## Estimation` de cada historia cuando alguien la toma. Mantener hitos en los dos lugares produjo cifras que no cerraban entre sí.
2. **El vínculo lo declara el work item.** Cada historia o requirement lleva `Cubre:` (con `base` para el trabajo de plataforma y `demo` para lo congelado), y el catálogo deja de listar historias. Así una historia nueva no toca la línea base. Las horas de un work item que cubre varios RQ se reparten en partes iguales, lo que resuelve en parte la decisión abierta 2 sin agregar columnas.
3. **Las horas trabajadas se miden con un reloj por ejecutor.** Sumar las tablas daba 232 h; unir los intervalos de cada ejecutor (el agente, cada persona) dio 42 h reales, porque varios agentes anotaban el mismo rato en historias distintas. La tabla necesita la columna `Quién` y el check tiene que rechazar solapes del mismo ejecutor desde una fecha de corte.
4. **Los pendientes no bloquean el estado de algo que ya empezó.** Un registro propio de pendientes (id fijo, quién resuelve, qué RQ frena, cierre sin borrar la fila) se muestra junto a cada RQ. Solo marca «Bloqueado» un RQ cuyos work items no empezaron; si no, casi todo el catálogo aparecía bloqueado aunque se estuviera construyendo.
5. **El check tiene que correr en CI también sobre las ramas de integración.** Con dos personas trabajando en `dev`, el pre-commit local no alcanza: un workflow de documentación corre el check en push y PR a `main` y `dev`, sin instalar el monorepo, y dice qué comando correr cuando el avance generado quedó viejo.

El resumen generado (`docs/avance.md` en DUIT) reemplazó al estado escrito en prosa, que caducaba con cada cambio de `Status`.
