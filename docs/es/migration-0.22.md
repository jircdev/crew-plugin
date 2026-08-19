# Migrar a v0.22

v0.22.0 le da al trabajo de interfaz lo que le faltaba: un **método** que viaja con el plugin, y **capacidades y gusto** que se quedan en tu repositorio. Además agrega una marca para que una versión futura pueda avisarte cuando algo realmente requiera tu atención.

La versión corta: **nada de lo que tenés se rompe, y nada se te exige.** Todo lo nuevo es opt-in, y una capacidad sin declarar es un estado válido — los roles simplemente dicen en voz alta qué no pudieron verificar, en lugar de asumirlo.

## Quién tiene que hacer qué

| Tu situación | Acción necesaria |
|---|---|
| Repo sin `crew.json` | **Ninguna.** El comportamiento es idéntico al anterior. |
| Repo con `crew.json`, sin trabajo de interfaz | **Ninguna.** No declares nada bajo `design`; nunca te van a molestar por eso. |
| Repo con `crew.json` y trabajo de UI | Opcional: correr `/crew:setup` para declarar qué puede hacer el proyecto, y completar `docs/design/`. |
| Ves la línea de arranque "este proyecto se configuró antes de que existiera la marca" | Corré `/crew:setup` una vez. Aceptar el estado actual tal cual la cierra para siempre. |

## Qué cambió

**Una skill `design`.** Todo rol cuyo trabajo cambie lo que el usuario ve, entiende, elige o hace carga ahora un método compartido: cómo pasar de un problema a una dirección, cómo entregarla de forma implementable, cómo revisar una implementación, cómo juzgar un render. Lleva procedimiento y preguntas — nunca valores, paletas, escalas, nombres de estilo ni librerías. Qué es bueno en *tu* producto lo declarás vos.

**Memoria de diseño en tu repo** (`docs/design/`). Tres archivos, scaffoldeados vacíos: referencias (a qué aspirás y qué rechazás), patrones aprobados, patrones rechazados. Es el ancla de todo juicio del tipo "¿esto parece genérico?". Sin ella los roles siguen funcionando — solo que declaran que la dirección no se contrastó contra nada.

**Capacidades declaradas** (`crew.json` → `design`). Dónde corre la app, dónde está el registro de componentes, cómo se capturan renders, qué comandos miden accesibilidad o rendimiento. **Declararlo ES el permiso**: en vez de aprobar "¿puedo abrir el navegador?" cada sesión, lo concedés una vez en un archivo que podés leer y revertir. Referencia completa y el costo de cada ausencia: [configuration.md](configuration.md#capacidades-de-diseño).

**Una regla de evidencia honesta.** Un veredicto sobre calidad visual ahora requiere un render, y donde no hay forma de obtenerlo el rol entrega conformidad de código **etiquetada como tal** en lugar de fusionar las dos afirmaciones. Cada respuesta cierra con un sello de evidencia de una línea: qué se cargó, qué capacidades se usaron, qué quedó sin verificar.

**Revisión de diseño independiente.** `qa-test-architect` recibe la especificación y la evidencia — nunca el racional del diseñador sobre por qué el diseño está bien. El ciclo de autocrítica del autor sigue existiendo, acotado a una pasada de corrección obligatoria, y se reporta como autocrítica, no como veredicto.

**Una marca de configuración** (`configuredWith`). Una línea que registra con qué versión del plugin se configuró el proyecto. Nada la lee para decidir comportamiento; existe para que una versión futura que sí requiera acción pueda avisarte, una vez, al arrancar la sesión. Las capacidades opcionales que no usás nunca van a generar un aviso.

## Cómo adoptarlo, si querés

Tres pasos, en este orden, ninguno urgente:

1. **`/crew:setup`.** Lee tu repo primero, pregunta como máximo dos cosas por turno, muestra qué va a escribir, escribe solo lo que confirmes y actualiza la marca. "Nada, gracias" es una respuesta completa.
2. **Tres entradas en `docs/design/`.** Una referencia, un patrón aprobado, un patrón rechazado. Con eso ya alcanza para cambiar lo que producen los roles. No escribas treinta de una sentada — una memoria inventada en una tarde describe una aspiración, no tu producto.
3. **Declará un canal de render** si lo tenés. Es el único cambio que mueve el trabajo de interfaz de "suena bien" a "fue mirado".

## Qué no cambió

Stories, requirements, tablas de estimación, ADRs, entradas de work, guards, la puerta de calidad, `/crew:metrics` — intactos. No se agregó, fusionó ni retiró ningún rol; ningún alias cambió. El circuito de entrega es exactamente el que era.

## Para un proyecto ya scaffoldeado

El plugin nunca sobreescribe tus archivos. Para obtener `docs/design/` en un repo existente, volvé a correr `bash <plugin>/scripts/init-project.sh` desde la raíz de tu proyecto: saltea todo lo que ya existe y agrega solo lo que falta. Tu `crew.json` queda intacto — para eso está `/crew:setup`, y pregunta antes de escribir.
