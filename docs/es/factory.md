# Trabajar con factory — tareas y tiempo

Algunos proyectos llevan sus tareas y su tiempo de trabajo en factory, el sistema de gestión de Baleares. En esos proyectos crew reparte el trabajo en dos lugares: el repositorio guarda la **especificación** (la historia o el requerimiento, con sus criterios de aceptación) y factory guarda la **tarea** (su estimación, su estado y las horas dedicadas). Las dos quedan atadas por una línea en la cabecera de la historia. Esta página explica el circuito para quienes trabajan en un proyecto así.

## Qué cambia para vos

- Dejás de completar timestamps a mano. El plugin registra cuándo trabajaron vos y el agente, en segundo plano, mientras usás Claude Code.
- Las estimaciones se cargan y se revisan en factory. Una historia se cierra cuando enlaza su tarea de factory; en este modo la tabla `## Estimation` es opcional.
- Una vez por semana revisás el tiempo que capturó el plugin y lo confirmás en factory. Nada cuenta como tiempo trabajado hasta que lo confirmás.

## Puesta en marcha

**1. El proyecto lo declara (una vez, quien configura el repositorio).** `crew.json` recibe un bloque `factory` con el id del proyecto en factory. Referencia: [configuration.md](configuration.md#modo-factory).

**2. Creás tu token personal (una vez por persona).** En factory, abrí **Mis horas → Conectar con la IA** y creá un token. Empieza con `fct_` y se muestra una sola vez. Guardalo en uno de dos lugares:

- la variable de entorno `FACTORY_TOKEN`, o
- el archivo `~/.crew/factory-token` (una sola línea con el token).

El token te identifica. Nunca va al repositorio ni a `crew.json`.

**3. Conectás las herramientas de factory a Claude Code (una vez por persona).** Así el agente puede leer el backlog, tomar una tarea, crear una o cargar tiempo en tu nombre:

```
claude mcp add --transport http factory https://api.factory.balearesgroup.com/api/v1/mcp --header "Authorization: Bearer $FACTORY_TOKEN"
```

Para el entorno de desarrollo, usá `https://api.dev.factory.balearesgroup.com/api/v1/mcp`. Las herramientas disponibles son `list_projects`, `my_tasks`, `project_backlog`, `get_task`, `create_task`, `take_task`, `update_task`, `add_task_reference`, `log_time` y `my_week`.

## Qué se captura

Solo **momentos en el tiempo**. Cada vez que Claude Code inicia una sesión, recibe un prompt tuyo, termina de responder o cierra la sesión, el plugin anota la hora. Con esos momentos arma dos tipos de intervalo:

- **Tu presencia**: el tramo entre dos momentos consecutivos, siempre que estén a 15 minutos o menos. Un hueco más largo cuenta como pausa y no suma nada.
- **El trabajo del agente**: desde que mandás un prompt hasta que el agente termina de responder.

Cada intervalo lleva el id de sesión, el proyecto de factory y la tarea en la que estabas trabajando. La tarea sale de las historias y requerimientos que el agente edita durante la sesión: la ruta del archivo identifica el work item, y su línea de cabecera `**Factory task:**`, cuando existe, identifica la tarea de factory.

El contenido de tus prompts, las respuestas del agente y la transcripción de la conversación nunca se leen ni se envían. De los archivos que se editan, el plugin mira solo la ruta, y en historias y requerimientos la línea `**Factory task:**` de la cabecera.

Los intervalos esperan en una cola local (`~/.crew/activity/queue.jsonl`) y se envían a factory cuando empieza una sesión, cuando el agente termina una respuesta y cuando la sesión se cierra. Sin conexión quedan en la cola y salen en el siguiente intento; el envío nunca frena ni bloquea la sesión. Lo que factory rechaza queda anotado en `~/.crew/activity/errors.log`. El estado local de sesiones que terminaron de golpe se borra a las 48 horas; los intervalos en cola se conservan hasta enviarse.

En Codex los mismos hooks corren en los eventos que Codex emite. El work item se toma de los nombres de archivo en las líneas de cabecera de cada `apply_patch` (`*** Add File:`, `*** Update File:`, `*** Move to:`), que es como Codex describe una edición.

## Enlazar una historia con su tarea

Agregá una línea a la cabecera de la historia o requerimiento:

```
- **Factory task:** 3f0c9a52-8d1e-4c7a-9b6f-2a1d0e5c7b44
```

El agente puede encontrar el id con `project_backlog` o `my_tasks`, o crear la tarea con `create_task` y agregar la línea él mismo. Desde ese momento, el tiempo capturado mientras se edita ese archivo se propone para esa tarea, y la historia ya puede cerrarse.

## Pausar la captura

Alcanza con cualquiera de estas:

- `CREW_CAPTURE=off` en tu entorno la pausa para vos, en esta máquina.
- `"capture": false` en el `crew.json` del proyecto la pausa para todas las personas del repositorio.
- Quitar tu token también la pausa.

Con la captura en pausa el plugin no escribe nada, ni siquiera localmente.

## Tu revisión semanal

El tiempo capturado es una propuesta. Una vez por semana, abrí **Mis horas** en factory: vas a ver los días que el plugin armó a partir de tus intervalos, agrupados por tarea. Ajustá lo que haga falta (una tarea que se llevó horas equivocadas, una reunión lejos del teclado) y confirmá la semana. Las horas confirmadas son las que cuentan para las horas consumidas de cada tarea, el pronóstico del proyecto y `/crew:metrics`.

## Ver los números

`/crew:metrics` en un proyecto factory imprime el backlog con la estimación original y vigente de cada tarea, las horas consumidas y la desviación, más las horas aprobadas, consumidas, pendientes y el pronóstico del proyecto. Detalle en [metrics.md](metrics.md#modo-factory).
