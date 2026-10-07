# Trabajar con factory: actividades y tiempo

Algunos proyectos llevan su trabajo y su tiempo en factory, el sistema de gestión de Baleares. En esos proyectos crew reparte el trabajo en dos lugares. El repositorio guarda la **especificación**: la historia o el requerimiento, con sus criterios de aceptación. Factory guarda la **actividad**: su estimación, su estado y las horas que se le dedicaron. Una línea en la cabecera de la historia une las dos. Esta página explica el circuito para las personas que trabajan en un proyecto así.

## Qué cambia para vos

- Dejás de completar timestamps a mano. Mientras usás Claude Code o Codex, el plugin registra en segundo plano cuándo trabajaron vos y el agente.
- Las estimaciones se cargan y se revisan en factory. Una historia se cierra cuando enlaza su actividad de factory; en este modo la tabla `## Estimation` es opcional.
- Una vez por semana revisás el tiempo que capturó el plugin y lo confirmás en factory. Solo el tiempo confirmado cuenta como trabajado.

## Cómo se configura

**1. El proyecto lo declara (una vez, quien configura el repositorio).** `crew.json` lleva un bloque `factory` con el id del proyecto en factory. Con eso alcanza para usar el entorno de producción. Referencia: [configuration.md](configuration.md#modo-factory).

```json
{ "factory": { "projectId": "3f0c9a52-…" } }
```

**2. Conectás tu máquina (una vez por persona y máquina).** En el chat escribí:

```
/crew:factory login
```

Se abre factory en el navegador. Leés qué registra la captura, aprobás y volvés al chat. Crew recibe tu token personal y lo guarda en `~/.crew/factory-token`, que solo tu usuario puede leer. El token nunca aparece en el chat. Nunca lo pegues ahí: todo lo que se escribe en la conversación queda guardado con ella.

- `/crew:factory status` te dice a qué factory estás conectado, con qué persona y cuándo vence el token (a los 90 días).
- `/crew:factory logout` revoca el token en factory y lo borra de tu máquina.

Conectarte es decisión tuya, y es lo que prende la captura para vos. Sin token, el plugin no registra nada sobre vos, ni siquiera localmente. Antes de prender la captura en un equipo hay que avisar formalmente a sus personas (ver la guía de seguimiento del trabajo de factory).

**Alternativa manual.** También podés crear el token en factory (**Mis horas → Conectar con la IA**, se muestra una sola vez) y ponerlo en la variable de entorno `FACTORY_TOKEN` o en `~/.crew/factory-token`, escribiéndolo en tu propia terminal.

**Lo que necesitás en factory.** Una ficha de persona vinculada a tu usuario, el permiso `my-hours.register` (lo tienen todos los perfiles) y participar del proyecto, como líder o desde una burbuja asignada. Las horas se proponen solo sobre actividades que cuelgan de un paquete aprobado.

**3. Opcional: las herramientas de factory para el agente.** Factory también ofrece herramientas MCP para que el agente lea el backlog, cree actividades o cargue tiempo en tu nombre. Las que ves dependen de tu perfil: `whoami`, `list_projects`, `agenda`, `get_activity`, `project_backlog`, `create_activity`, `update_activity`, `assign`, `add_task_reference`, `upsert_requirement`, `log_time`, `reclassify_time`, `my_week`, `unclassified_time`, `classify_time`, `find_people`, y las de paquetes (`list_cost_centers`, `upsert_cost_center`, `approve_cost_center`). Claude Code lee el token del entorno:

```
claude mcp add --transport http factory https://api.factory.balearesgroup.com/api/v1/mcp --header "Authorization: Bearer ${FACTORY_TOKEN}"
```

En Codex, agregá el servidor en `~/.codex/config.toml` con `url = "https://api.factory.balearesgroup.com/api/v1/mcp"` y `bearer_token_env_var = "FACTORY_TOKEN"`. Para el entorno de desarrollo, usá `api.dev.factory.balearesgroup.com`.

## Con qué factory hablás

| Entorno | API | Web |
|---|---|---|
| `prod` (por defecto) | `https://api.factory.balearesgroup.com/api/v1` | `https://factory.balearesgroup.com` |
| `dev` | `https://api.dev.factory.balearesgroup.com/api/v1` | `https://dev.factory.balearesgroup.com` |

El proyecto elige el entorno en `crew.json` (`"environment": "dev"`, o un `url` para cualquier otro host). Tu máquina puede cambiarlo sin tocar el archivo compartido: `CREW_FACTORY_ENV=dev`, o `CREW_FACTORY_URL` con una base de API completa. Lo de la máquina gana sobre `crew.json`.

## Qué se captura

Solo **momentos**. El plugin anota la hora cuando empieza una sesión, cuando recibe un prompt tuyo, cuando el agente termina de responder y cuando la sesión termina. Con esos momentos arma dos clases de intervalo:

- **Tu tiempo**: mientras tenés el turno, desde que empieza la sesión o el agente termina de responder hasta tu próximo prompt. Un turno de más de 15 minutos cuenta como pausa y no suma.
- **El trabajo del agente**: desde que mandás un prompt hasta que el agente termina de responder, dure lo que dure. Los dos nunca se superponen.

Cada intervalo lleva el id de sesión, el proyecto de factory y la actividad en la que estabas. La actividad sale de las historias y requerimientos que el agente edita durante la sesión. La ruta del archivo es su referencia en factory (`<carpeta de crew.json>:<ruta>`, enlazada con `add_task_reference` o `upsert_requirement`), y la línea de cabecera `**Factory activity:**`, cuando está, nombra la actividad directamente.

El plugin nunca lee ni envía el contenido de tus prompts, las respuestas del agente ni la transcripción de la conversación. De los archivos que editás mira solo la ruta, y en historias y requerimientos, la línea `**Factory activity:**` de la cabecera.

En Codex los mismos hooks corren sobre los eventos que emite Codex. El work item sale de los nombres de archivo de cada `apply_patch` (`*** Add File:`, `*** Update File:`, `*** Move to:`).

## Cuando factory tiene un problema

Un problema de factory nunca rompe ni demora tu sesión. Los hooks de captura siempre terminan en silencio, y solo hablan con factory cuando empieza una sesión, cuando el agente termina una respuesta y cuando la sesión termina, con un límite de 2,5 segundos.

| Situación | Qué pasa |
|---|---|
| Factory no responde, o responde con un error de servidor | Los intervalos quedan en una cola local (`~/.crew/activity/queue.jsonl`) y salen en el próximo intento. Lo que tiene más de 45 días se descarta, igual que la retención de factory. |
| Factory no tiene ficha de persona para tu usuario | Los intervalos quedan en la cola hasta que un administrador vincule una. |
| Tu token fue revocado o venció | La captura se pausa y la cola local se borra, porque revocar es la forma en que una persona pausa la captura. Se reanuda cuando te volvés a conectar. |
| Factory rechaza un intervalo por inválido | Ese lote se descarta. |

Cada caso deja una línea en `~/.crew/activity/errors.log`, con la hora, el código HTTP y la cantidad de intervalos. El log nunca guarda contenido de intervalos ni tokens. Cuando algo necesita tu atención, el próximo inicio de sesión lo muestra en una línea corta.

## Enlazar una historia con su actividad

Agregá una línea en la cabecera de la historia o el requerimiento:

```
- **Factory activity:** 3f0c9a52-8d1e-4c7a-9b6f-2a1d0e5c7b44
```

También se acepta `**Factory task:**`, para work items escritos antes de que factory las llamara actividades. El agente puede buscar el id con `project_backlog`, `agenda` o `get_activity`, o crear la actividad con `create_activity` (o `upsert_requirement` si es un requerimiento) y agregar la línea él mismo. Desde ese momento, el tiempo capturado mientras se edita ese archivo se propone para esa actividad, y la historia se puede cerrar.

## Pausar la captura

Cualquiera de estas alcanza:

- `CREW_CAPTURE=off` en tu entorno la pausa para vos, en esta máquina.
- `"capture": false` en el `crew.json` del proyecto la pausa para todas las personas del repositorio.
- `/crew:factory logout`, o revocar el token en factory, la pausa para vos en todos lados.

Mientras está pausada, el plugin no escribe nada, ni siquiera localmente.

## Tu revisión semanal

El tiempo capturado es una propuesta. Una vez por semana abrí **Mis horas** en factory. Vas a ver los días que el plugin armó con tus intervalos, agrupados por actividad. Ajustá lo que haga falta (una actividad con horas equivocadas, una reunión lejos del teclado) y confirmá la semana. Las horas confirmadas son las que cuentan en las horas consumidas de cada actividad, en el pronóstico del proyecto y en `/crew:metrics`.

## Ver los números

`/crew:metrics` en un proyecto factory muestra el backlog como un árbol de actividades, con la estimación original y la vigente de cada una, sus horas consumidas propias y su desviación, más las horas cotizadas, consumidas, pendientes y el pronóstico del proyecto. Si factory no puede responder, muestra el reporte local después de una línea de aviso. Detalle en [metrics.md](metrics.md#modo-factory).
