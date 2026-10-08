# El crew para no-desarrolladores

Todas las demás páginas de esta documentación asumen un desarrollador. Esta no. Si sos CEO, perfil comercial o analista en un proyecto que usa el crew, esta página te dice qué roles son tuyos, cómo hablarles, qué documentos te pertenecen y dónde están los límites.

## Cómo invocar un rol

Hay dos formas equivalentes; ambas abren una conversación con un especialista.

**Slash command.** En una sesión de Claude Code, escribí el comando y tu pedido: `/crew:com necesito un manifiesto para el cliente nuevo`. Lo que va después de `/crew:` es el nombre corto del rol.

**Prefijo de alias.** Empezá cualquier mensaje con el alias del rol en mayúsculas y dos puntos: `COM: necesito un manifiesto para el cliente nuevo`. Mismo efecto, sin comando — útil en medio de una conversación.

En ambos casos escribís en lenguaje natural. El rol también responde en lenguaje natural; si no lo hace, decíselo.

## CEO / perfil comercial

**Tus roles.**

| Rol | Se invoca con | Sirve para |
|---|---|---|
| commercial-strategist | `/crew:com` o `COM:` | Discovery con el cliente, juzgar en términos de negocio si algo vale la pena, el manifiesto del proyecto, el mensaje de la web pública |
| analytics-architect | `/crew:ana` o `ANA:` | Preguntas de métricas de producto: qué medir, qué KPIs, si el funnel dice lo que creés que dice |

**Tus artefactos.** Los manifiestos en `docs/briefs/` — documentos narrativos escritos para que los lea una persona. Podés leerlos, comentarlos y aprobarlos. Un manifiesto que aprobás es aquello sobre lo que se alinea el equipo técnico.

**Revisar sin git en tu máquina.** No necesitás ninguna herramienta de desarrollador. El host de tu repositorio (GitHub o GitLab) muestra cada archivo en un navegador web: abrí la página del repositorio, navegá hasta `docs/briefs/` o `docs/stories/` y hacé clic en un archivo. Los briefs y las stories son markdown plano — se renderizan como texto formateado, legible como cualquier página web.

**Lo que no debés tocar.**

- Las tablas de estimación dentro de las stories — las agrega y completa en planning quien implementa el trabajo.
- `docs/work/` — el registro histórico de lo que se hizo; es evidencia de solo-agregar.
- El código y `standards/` — dominio del equipo técnico.

## Analistas

**Tus roles.**

| Rol | Se invoca con | Sirve para |
|---|---|---|
| functional-analyst | `/crew:fa` o `FA:` | Convertir requerimientos en stories con criterios de aceptación y escenarios de prueba |
| delivery-coordinator | `/crew:coord` o `COORD:` | Secuenciar el trabajo, seguir el avance, detectar y destrabar bloqueos |

**Tus artefactos.** Los ítems de `docs/stories/` y `docs/requirements/`. Los redactás y los editás libremente durante toda su vida — hasta que llegan a **Closed**, momento en el que se vuelven historia inmutable.

**El gate de Ready.** Una story no puede entrar en implementación hasta que sus criterios de aceptación estén completos y sin ambigüedad **y** tenga al menos un escenario de prueba. Satisfacer ese gate es tu responsabilidad; una story que no lo pasa, rebota.

**La tabla de estimación.** La story se redacta sin ella — las horas no son entregable del analista. En planning, cuando la story se toma para implementar, **quien ejecuta** agrega la tabla `## Estimation` (hitos, horas estimadas) antes de codificar, y escribe los timestamps **en tiempo real** — en el momento en que el trabajo empieza y termina, nunca reconstruidos después. La estimación gruesa de proyecto vive en el brief.

**Revisar sin git.** Igual que arriba: la interfaz web de tu host (vista de archivos de GitHub/GitLab) renderiza cada story y requirement como texto formateado legible.

**Lo que no debés tocar.**

- Los ítems **Closed** — una vez cerrados son inmutables; las correcciones van en un ítem nuevo que referencia al anterior.
- Las entradas de `docs/work/` — el registro de ejecución pertenece a quien ejecutó.
- El código — describir el comportamiento es tu trabajo; implementarlo, no.

## Si necesitás algo fuera de tu carril

Pedíselo al rol que tenés. Cada rol conoce el catálogo completo y va a convocar al especialista correcto — nunca necesitás saber quién es dueño de qué del lado técnico.
