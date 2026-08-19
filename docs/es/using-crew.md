# Usar crew

Cómo invocar los roles, hacer scaffolding de un proyecto nuevo, onboarding de uno existente y personalizar los docs instalados. Para el proceso de punta a punta que siguen los roles, ver el [circuito de entrega](../../templates/docs/guides/delivery-circuit.es.md).

## Configurar un proyecto nuevo

Con el plugin instalado, solo pídele a la crew que lo configure — sin script, sin terminal:

```
configura la estructura de la crew en este proyecto
```

El meta-rol `CREW` instala `AGENTS.md`, `CLAUDE.md`, el baseline de `standards/` y la taxonomía completa de `docs/` (stories, requirements, decisions, briefs, proposals, guides, work, DEVIATIONS). Los archivos existentes se conservan, nunca se sobrescriben.

Luego:

1. Rellena `AGENTS.md` — `{PROJECT_NAME}`, la tabla de stack, el layout de carpetas y los comandos.
2. Escribe `docs/spec.md` con la especificación técnica del proyecto.
3. Ajusta `standards/code-quality.md` si las reglas de tu proyecto difieren del baseline.
4. Corre `/crew:setup` para declarar qué puede hacer el proyecto.

## Decirle a la crew qué puede hacer este proyecto

```
/crew:setup
```

El scaffold le da a la crew una *estructura*; esto le da *capacidades*. Pregunta dónde corre la app en desarrollo, dónde se mira para saber si un componente ya existe, si se pueden capturar renders y en qué formatos, y qué comandos miden accesibilidad o rendimiento — y escribe en `crew.json` solo lo que confirmaste.

Tres razones para correrlo en vez de saltearlo:

- **Declararlo ES el permiso.** Con una URL de runtime declarada, un agente deja de preguntar "¿puedo abrir el navegador?" cada sesión — lo concediste una vez, en un archivo que podés leer y revertir. La URL y el perfil de arranque son permisos separados, porque conectarse a una app que ya corre y ejecutar un comando en tu máquina son riesgos distintos.
- **Lo que no declarás no se asume.** Sin registro de componentes, cada propuesta dice *"reuso no verificado"* en lugar de fingir que se buscó en el catálogo. Sin forma de capturar un render, obtenés conformidad de código **etiquetada como tal** en lugar de un veredicto que suena seguro sobre cómo se ve.
- **Pregunta en vez de adivinar.** Como máximo dos preguntas por turno, tu entendimiento confirmado en una línea antes de escribir nada, y "nada, gracias" como respuesta completa y válida.

Completá también `docs/design/` — una referencia, un patrón aprobado y un patrón rechazado ya alcanzan para cambiar lo que producen los roles. Esa carpeta es el gusto de tu producto; el plugin nunca escribe adentro. Referencia completa: [configuration.md](configuration.md#capacidades-de-diseño).

## Elegir el modo del proyecto

No todo repo quiere el proceso completo. El modo se declara por repo en un archivo `crew.json` en la raíz del proyecto, escrito por el scaffold con valores explícitos (`mode`, `metrics`, `quality`, `ceilings`):

- **`team`** — el circuito de entrega completo y todos los guards. `scripts/init-project.sh` instala la taxonomía completa de `docs/` y escribe `crew.json`.
- **`solo`** — el catálogo sin la ceremonia: inmutabilidad de items Closed apagada, chequeo de cierre al terminar la sesión apagado, y la puerta de estimación solo si las métricas están activas. `scripts/init-project.sh --solo` instala un árbol mínimo (`AGENTS.md`, `CLAUDE.md`, `standards/`, `docs/decisions/`, `docs/work/`, `crew.json`) — sin briefs, stories, requirements ni proposals.

`metrics` es ortogonal al modo: `solo` con `"metrics": true` te da solo la disciplina de estimación y timestamps — para cuando trabajas solo pero igual quieres medir lo que cuesta cada requerimiento.

Un repo **sin** `crew.json` se comporta exactamente como antes: los guards infieren por estructura y la calidad se exige al escribir. Cada campo está documentado en [configuration.md](configuration.md); para el arranque solo más rápido, ver [solo-quickstart.md](solo-quickstart.md).

## Onboarding de un proyecto existente

**No** hagas scaffolding sobre un proyecto que ya tiene docs y convenciones. El punto de entrada es la auditoría:

```
/crew:doc audita los docs de este proyecto contra el estándar crew
```

El documentation-steward inventaría el proyecto contra la taxonomía del plugin, reporta hallazgos alineado/desviado/faltante, y tú decides por hallazgo: converger (se vuelve una story/requirement) o conservar la desviación. Las desviaciones conservadas se registran en `docs/DEVIATIONS.md` y la resolución de precedencia se escribe en el `AGENTS.md` raíz del proyecto — vinculante para todos los agentes, nunca re-litigada por sesión. El baseline del plugin es sugerido; las reglas propias del proyecto siempre ganan.

## Personalizar los docs instalados

Todo lo que el instalador copia deja de pertenecer al plugin en el momento en que aterriza: el `AGENTS.md`, `standards/` y el árbol `docs/` instalados son **archivos de tu proyecto**. El instalador nunca sobrescribe un archivo existente, así que lo que cambies persiste — pero no todo en esos archivos pesa igual. Hay dos tipos de contenido, y el procedimiento difiere.

### Superficie del proyecto — edítala libremente

Defaults que el scaffold trae para que tengas de dónde partir. Cambiarlos es mantenimiento normal del proyecto: editas tu copia, sin auditoría, sin registro de desviación.

- **Placeholders y datos del proyecto** — `{PROJECT_NAME}`, la tabla de stack, el layout de carpetas y los comandos en `AGENTS.md`.
- **Las herramientas se declaran, nunca se plantillan.** Ninguna plantilla nombra una herramienta de test: el arnés end-to-end en el que `QA` formaliza los escenarios sale de `crew.json` `testing.e2e`, leído desde un solo lugar por todos los roles. Declaralo una vez ahí y mantené sincronizado `AGENTS.md § Stack`. Según `docs/MAINTAINING.md`, un cambio de herramienta con trade-offs reales lleva además un ADR.
- **Agregados propios del proyecto** — secciones extra en la plantilla de story (p. ej. un bloque "Rollout" o "Eventos de analítica"), filas extra en tablas de ruteo, guías extra. Agrégalas en tu copia; cada story nueva las hereda.
- **Redacción, ejemplos e idioma** de la prosa.

### El estándar estructural — cambiarlo es una desviación

Estos elementos son estructurales: los roles, los hooks y el circuito de entrega los asumen. Divergir está permitido, pero es una **decisión** registrada, nunca una edición silenciosa:

- Carpeta = naturaleza, estado = campo; los archivos nunca se mueven; el kind vive en el slug.
- El ciclo de vida de story/requirement (`Draft → … → Closed`) y el campo `Status:` en el encabezado.
- La puerta de Ready: criterios completos y sin ambigüedad, sin preguntas abiertas, y **al menos un Test scenario**.
- La tabla de estimación, agregada en planning por quien ejecuta y completa al cierre. Esta la hace cumplir un hook: exige el encabezado exacto `## Estimation` y las primeras cinco columnas (Milestone a Actual hours) llenas — renombrar la sección o dejar celdas vacías bloquea el cierre.
- La inmutabilidad de los work items Closed y de las entradas de `work/`.
- Fuente única de verdad: un tracker externo guarda solo estado + link; el archivo gana.

Para divergir de cualquiera de estos, corre la conversación de auditoría (`/crew:doc audita los docs de este proyecto contra el estándar crew`). El dueño decide, la desviación queda como fila en `docs/DEVIATIONS.md` con razón y fecha, y desde ahí es vinculante — los agentes la respetan y no la vuelven a señalar.

**Prueba rápida:** ¿el cambio reemplaza la herramienta o la redacción con la que corre el estándar, o cambia la forma del estándar? Herramienta/redacción → edita tu copia. Forma (ciclo de vida, puertas, taxonomía, secciones obligatorias) → fila en `DEVIATIONS.md` vía auditoría `DOC`.

### Qué pasa cuando el plugin se actualiza

Las actualizaciones nunca tocan tus archivos instalados — el bootstrap salta todo lo que ya existe — así que las personalizaciones sobreviven cada actualización. La contracara: las mejoras a las plantillas del plugin **no** llegan solas a tus copias. Para tomarlas, re-corre la auditoría `DOC` después de actualizar: compara tus docs contra el nuevo baseline, respeta cada fila ya registrada en `DEVIATIONS.md`, y tú converges o conservas por hallazgo. No hay merge automático; la conversación de auditoría (o fusionar a mano la plantilla que te interese) es la vía de reconciliación.

## Invocar un rol

Hay **dos formas** de poner un rol a trabajar. Ambas terminan igual —responde un especialista en vez de un generalista— pero difieren en la configuración y en cómo se leen.

### 1. Slash command — `/crew:<alias>` (funciona de una)

Escribe el slash command y el rol toma ese mensaje:

```
/crew:sys ¿cómo separo el módulo de pagos del resto?
/crew:ux organiza la pantalla de inicio para alguien que abre la app por primera vez
```

No hay que configurar nada: en cuanto el plugin está instalado, los comandos de rol existen en **todos** los proyectos. Es la forma más simple y la primera a la que recurrir.

### 2. Prefijo — `ROL:` (se lee como hablarle a una persona)

Empieza el mensaje con el alias del rol y dos puntos:

```
SYS: ¿cómo separo el módulo de pagos del resto?
UX: organiza la pantalla de inicio para alguien que entra por primera vez
```

Se lee más natural que un slash command, pero **no** funciona solo — necesita el *protocolo de activación* en contexto primero. Lo tienes en uno de dos alcances:

- **Por proyecto** — un proyecto montado con la crew lo lleva en su `AGENTS.md`, así que el prefijo funciona dentro de ese proyecto.
- **En todos lados (global)** — se inyecta una vez en tu `~/.claude/CLAUDE.md`, que Claude lee en cada sesión (ver abajo).

### ¿Cuál uso?

| | `/crew:sys …` | `SYS: …` |
|---|---|---|
| Configuración | ninguna — funciona ya instalado | necesita activación (proyecto o global) |
| Dónde funciona | cualquier proyecto | donde esté inyectado el protocolo |
| Se siente como | un comando | lenguaje natural |
| Mejor para | una consulta puntual a un experto | trabajar en modo rol seguido |

Si dudas, usa el slash command. El prefijo es una comodidad para quien vive en modo rol.

### Activar el prefijo en todos lados (global)

Corre el meta-rol `CREW` una vez, apuntándolo a tu config global:

```
/crew:crew activa la crew en mi ~/.claude/CLAUDE.md global para que el prefijo "ROL:" funcione en todas las sesiones
```

Escribe el protocolo de activación + la tabla de alias en `~/.claude/CLAUDE.md`. Desde ahí, `SYS:`, `DA:`, `UX:`, … funcionan en cualquier sesión y proyecto. El `AGENTS.md` propio de un proyecto sigue ganando donde haya conflicto.

### ¿Un mensaje, o toda la conversación?

Por defecto el prefijo activa el rol para **ese mensaje**; el siguiente vuelve al generalista. Si quieres que el rol **se quede** toda la conversación (dices `SYS:` una vez y sigues como system-architect hasta que cambies), el protocolo de activación tiene una opción formal de **prefijo pegajoso** — pídele a `/crew:crew` la variante pegajosa al activar. Su texto canónico está versionado en el doc del meta-rol crew, no se improvisa por instalación:

> Sticky prefix: a `ROLE:` prefix stays active for the whole conversation until a different `ROLE:` prefix is declared. `GEN:` resets to the generalist.

`GEN:` es la vuelta incorporada al generalista — nunca quedas atrapado en un rol.

## Medir tu trabajo (métricas)

Con `"metrics": true` en `crew.json`, la disciplina de estimación se vuelve medible de punta a punta:

1. **Estima en planning.** La story se redacta sin estimación; quien la toma para implementar agrega la tabla `## Estimation` (hitos, horas estimadas) antes de codificar. La estimación gruesa de proyecto vive en el brief.
2. **Timestamps en tiempo real.** Las celdas Started/Finished se escriben cuando el trabajo realmente empieza y termina — un guard verifica que cada timestamp recién escrito esté a menos de 15 minutos de ahora, lleve su offset de zona horaria (`YYYY-MM-DD HH:mm ±TZ`) y sea consistente (Finished ≥ Started, Actual hours ≤ tiempo de reloj). Si una sesión se interrumpe, Finished es la hora real de retomada y la pausa se anota en Notes — el tiempo de reloj incluye pausas por diseño; la métrica es el costo de punta a punta.
3. **Lee los números.** `/crew:metrics [YYYY-MM]` reporta, por item cerrado, lead time, tiempo de ejecución y horas estimadas vs. reales con % de desviación, agregado (mediana/p90) por carpeta y mes; `--csv` escribe `docs/work/metrics.csv`.

Las reglas completas y la anatomía del reporte están en [metrics.md](metrics.md).

## Reglas de composición

De `agents/` (cada doc de rol):

- Un dueño por decisión.
- Especificaciones antes que código. Los roles pueden buscar y editar código, pero implementan solo después de que la dirección converja o el usuario lo pida explícitamente — nunca como primera respuesta. `researcher` es la excepción: estrictamente de solo lectura.
- `security-compliance` puede interrumpir a cualquier rol.
- `researcher` devuelve hallazgos, nunca recomendaciones.
- Los roles conocen el catálogo completo. La sección "Role relationships" de cada doc de rol lista los handoffs y consultas **típicos**; cualquier rol puede invocar a otro cuando la situación lo amerite.
- **Consultar, no diferir.** Cuando una respuesta completa necesita el juicio de otro rol, el agente lo obtiene ahora (spawn o adopción de lente) y responde en el mismo turno — nunca cierra con "revisa esto con ROL".
- **Política de encadenamiento.** Tras un entregable, el siguiente rol encadena en la misma sesión solo si su dueño humano (según el `AGENTS.md` del proyecto § Mapa de propiedad de roles) es el usuario de la sesión; si no, el trabajo se detiene en el artefacto y espera la aprobación de ese humano.
- **Disciplina de estimación.** Cada story/requirement embebe una tabla de estimación por hito (horas estimadas vs. reales), rellenada antes de implementar — así los equipos miden el costo de cada iteración agéntica.
