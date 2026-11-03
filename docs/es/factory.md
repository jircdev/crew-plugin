# Trabajar con factory: actividades y tiempo

Algunos proyectos llevan su trabajo y su tiempo en factory, el sistema de gestión de Baleares. En esos proyectos crew reparte el trabajo en dos lugares. El repositorio guarda la **especificación**: la historia o el requerimiento, con sus criterios de aceptación. Factory guarda la **actividad**: su estimación, su estado y las horas que se le dedicaron. Una línea en la cabecera de la historia une las dos. Esta página explica el circuito para las personas que trabajan en un proyecto así.

## Qué cambia para vos

- Dejás de completar timestamps a mano. Mientras usás Claude Code o Codex, el plugin registra en segundo plano cuándo trabajaron vos y el agente.
- Las estimaciones se cargan y se revisan en factory. Una historia se cierra cuando enlaza su actividad de factory; en este modo la tabla `## Estimation` es opcional.
- Una vez por semana revisás el tiempo que capturó el plugin y lo confirmás en factory. Solo el tiempo confirmado cuenta como trabajado.

## Cómo se configura

Son dos pasos, los dos se escriben en el chat. El primero se hace una vez por máquina; el segundo, una vez por repositorio, y quien lo hace primero commitea el resultado para el equipo.

**1. Conectá tu máquina.**

```
/crew:factory login
```

Se abre factory en el navegador. Leés qué registra la captura, aprobás y volvés al chat. Crew recibe tu token personal y lo guarda en `~/.crew/factory-token`, que solo tu usuario puede leer, junto con la fecha en que vence y la fecha en que te conectaste. El token nunca aparece en el chat. Nunca lo pegues ahí: todo lo que se escribe en la conversación queda guardado con ella.

Conectarte es decisión tuya, y es lo que prende la captura para vos. Sin token, el plugin no registra nada sobre vos, ni siquiera localmente. Antes de prender la captura en un equipo hay que avisar formalmente a sus personas (ver la guía de seguimiento del trabajo de factory). Mientras factory no tenga registrado ese aviso, la página de aprobación muestra la captura como bloqueada y el login termina sin conectar; pedile a Gestión el aviso formal.

**2. Vinculá el repositorio con su proyecto de factory.**

```
/crew:factory link
```

Crew lee el remoto de git del repositorio y le pregunta a factory a qué proyecto pertenece. De tu máquina sale solo el proveedor y el nombre del repositorio (`owner/name` en GitHub); un usuario o token dentro del remoto se descarta antes. Lo que sigue depende de la respuesta:

- **El repositorio está en uno de tus proyectos.** Crew agrega el id del proyecto al bloque `factory` de `crew.json` y te dice qué proyecto eligió. No tenés que elegir nada.
- **Está en un proyecto del que no formás parte.** Crew lo dice sin nombrar el proyecto y te ofrece pedir acceso (`/crew:factory link --request-access`). La solicitud le llega al líder o coordinador del proyecto; cuando la aprueba, corré `link` de nuevo.
- **Ningún proyecto lo tiene todavía.** El agente muestra los proyectos en los que participás y le decís para cuál trabaja este repositorio. Factory registra entonces el repositorio en ese proyecto, si podés gestionar sus recursos técnicos, para que el `link` de la próxima persona lo encuentre solo. Si tenés permiso para crear proyectos, el agente también te ofrece crear uno nuevo (`--create`): te pide el cliente y confirma el nombre antes de crearlo.
- **El repositorio no tiene remoto.** Elegís a mano entre tus proyectos.

El agente pregunta antes de escribir, porque `crew.json` es compartido por todo el equipo. Commiteá `crew.json` para que el resto se saltee este paso. El repositorio necesita un `crew.json` antes; si no lo tiene, corré `/crew:setup`.

```json
{ "factory": { "projectId": "3f0c9a52-…" } }
```

**El entorno de producción de factory todavía no está listo.** Por ahora el equipo trabaja contra `dev`: poné `CREW_FACTORY_ENV=dev` en tu máquina antes del login, y la primera persona que vincula el repositorio agrega `--set-environment` para que `crew.json` reciba `"environment": "dev"` junto con el id del proyecto.

Los ids de proyecto cambian entre entornos de factory. Cuando tu máquina apunta a un entorno distinto del de `crew.json` (ver [Con qué factory hablás](#con-qué-factory-hablás)), `link` se detiene y lo dice; escribe el entorno en `crew.json` solo si se lo pedís. Un repositorio ya vinculado a otro proyecto también cambia solo a pedido.

**Revisar y desconectar.**

- `/crew:factory status` te dice a qué factory estás conectado, con qué persona, cuándo vence el token (a los 90 días), cuánto tiempo capturado espera en tu máquina y con qué proyecto está vinculado el repositorio actual.
- `/crew:factory logout` revoca el token en factory y lo borra de tu máquina, junto con el tiempo que todavía esperaba para enviarse.

Un repositorio que nunca debe capturarse lo dice en su `crew.json` con `"factory": { "capture": false }`. Eso también calla el recordatorio de vincularlo.

**Alternativa manual.** También podés crear el token en factory (**Mis horas → Conectar con la IA**, se muestra una sola vez) y ponerlo en la variable de entorno `FACTORY_TOKEN` o en `~/.crew/factory-token`, escribiéndolo en tu propia terminal.

**Lo que necesitás en factory.** Una ficha de persona vinculada a tu usuario, el permiso `my-hours.register` (lo tienen todos los perfiles) y participar del proyecto, como líder o desde una burbuja asignada. Las horas se proponen solo sobre actividades que cuelgan de un paquete aprobado.

**3. Opcional: las herramientas de factory para el agente.** Factory también ofrece herramientas MCP para que el agente lea el backlog, cree actividades o cargue tiempo en tu nombre. Las que ves dependen de tu perfil: `whoami`, `list_projects`, `agenda`, `get_activity`, `project_backlog`, `create_activity`, `update_activity`, `assign`, `add_task_reference`, `upsert_requirement`, `log_time`, `reclassify_time`, `my_week`, `unclassified_time`, `classify_time`, `find_people`, y las de paquetes (`list_cost_centers`, `upsert_cost_center`, `approve_cost_center`).

`/crew:factory login` guarda el token en `~/.crew/factory-token`. **No** crea la variable `FACTORY_TOKEN` ni registra el servidor MCP: eso es este paso. Al terminar, el login imprime el comando exacto para tu factory y tu terminal, que lee el token del archivo para que nunca aparezca en pantalla ni en el chat. Para prod, en PowerShell:

```powershell
claude mcp remove factory --scope user
$t = (Get-Content -Raw "$HOME\.crew\factory-token").Trim(); if ($t) { claude mcp add --scope user --transport http factory https://api.factory.balearesgroup.com/api/v1/mcp --header "Authorization: Bearer $t" }; Remove-Variable t
```

En bash, zsh o Git Bash:

```bash
claude mcp remove factory --scope user
[ -s ~/.crew/factory-token ] && claude mcp add --scope user --transport http factory https://api.factory.balearesgroup.com/api/v1/mcp --header "Authorization: Bearer $(tr -d '\r\n ' < ~/.crew/factory-token)"
```

Para el entorno de desarrollo, usá `api.dev.factory.balearesgroup.com`. Después `claude mcp list` tiene que mostrar `factory: … ✔ Connected`; las herramientas aparecen en las sesiones que abras desde ahí.

- **Volvé a registrarlo después de cada login.** El registro guarda una copia del token en la configuración de Claude Code, así que un login nuevo (o un token vencido) lo deja desactualizado.
- **No lo registres con `${FACTORY_TOKEN}`** salvo que esa variable tenga de verdad el token en la terminal donde corrés el comando; el login nunca la crea. En PowerShell, `${FACTORY_TOKEN}` es una variable de PowerShell y no la de entorno (`$env:FACTORY_TOKEN`). En cualquiera de los dos casos el servidor queda con un `Bearer` vacío y cada llamada responde 401 "No personal access token provided".
- Un servidor registrado antes sin `--scope user` queda en ese proyecto y gana sobre el de usuario: borralo ahí con `claude mcp remove factory`.
- **Al hacer logout, borrá también el registro** (`claude mcp remove factory --scope user`; `/crew:factory logout` te lo recuerda). Guarda su propia copia del token en `~/.claude.json`, así que nunca pegues ese archivo ni la salida de `claude mcp get factory` en ningún lado.
- Si la dirección de factory no es una URL `https` simple, el login no imprime comando y te manda acá: registralo a mano con la dirección de tu `crew.json`.

En Codex, agregá el servidor en `~/.codex/config.toml` con `url = "https://api.factory.balearesgroup.com/api/v1/mcp"` y `bearer_token_env_var = "FACTORY_TOKEN"`, y definí `FACTORY_TOKEN` en el entorno desde el que arranca Codex: Codex lee solo la variable, no el archivo.

## Con qué factory hablás

| Entorno | API | Web |
|---|---|---|
| `prod` (por defecto; todavía no está listo) | `https://api.factory.balearesgroup.com/api/v1` | `https://factory.balearesgroup.com` |
| `dev` | `https://api.dev.factory.balearesgroup.com/api/v1` | `https://dev.factory.balearesgroup.com` |

El proyecto elige el entorno en `crew.json` (`"environment": "dev"`, o un `url` para cualquier otro host). Tu máquina puede cambiarlo sin tocar el archivo compartido: `CREW_FACTORY_ENV=dev`, o `CREW_FACTORY_URL` con una base de API completa. Lo de la máquina gana sobre `crew.json`.

El token es uno solo por máquina (`~/.crew/factory-token`). Si cambiás de entorno, `/crew:factory login` contra el nuevo reemplaza el token anterior, y para volver hay que loguearse otra vez. `/crew:factory status` dice a qué entorno estás conectado.

## Qué se captura

Solo **momentos**. El plugin anota la hora cuando empieza una sesión, cuando recibe un prompt tuyo, cuando el agente termina de responder y cuando la sesión termina. Con esos momentos arma dos clases de intervalo:

- **Tu tiempo**: mientras tenés el turno, desde que empieza la sesión o el agente termina de responder hasta tu próximo prompt. Un turno de más de 15 minutos cuenta como pausa y no suma.
- **El trabajo del agente**: desde que mandás un prompt hasta que el agente termina de responder, dure lo que dure. Los dos nunca se superponen.

Cada intervalo lleva el id de sesión, el proyecto de factory, su [bloque de trabajo](#bloques-de-trabajo-y-la-tarea-que-declara-el-agente) y la actividad en la que estabas. La actividad sale de las historias y requerimientos que el agente edita durante la sesión. La ruta del archivo es su referencia en factory (`<carpeta de crew.json>:<ruta>`, enlazada con `add_task_reference` o `upsert_requirement`), y la línea de cabecera `**Factory activity:**`, cuando está, nombra la actividad directamente.

El plugin nunca lee ni envía el contenido de tus prompts, las respuestas del agente ni la transcripción de la conversación. De los archivos que editás mira solo la ruta, y en historias y requerimientos, la línea `**Factory activity:**` de la cabecera.

En Codex los mismos hooks corren sobre los eventos que emite Codex. El work item sale de los nombres de archivo de cada `apply_patch` (`*** Add File:`, `*** Update File:`, `*** Move to:`).

### Bloques de trabajo y la tarea que declara el agente

Los turnos seguidos de una sesión forman un **bloque de trabajo**, que en factory se revisa de una vez: se acepta la tarea propuesta o se cambia. Cada intervalo lleva el identificador de su bloque.

- **Cuándo se abre un bloque nuevo:** con el inicio de la sesión, después de una pausa de más de 15 minutos, cuando el agente declara otra tarea y cuando el agente completa una actividad en factory. La pausa conserva la tarea declarada, porque no es un cambio de tema. Si el corte cae en medio de una respuesta del agente, esa respuesta se parte en ese momento.
- **La declaración:** al empezar algo, el agente busca o crea la actividad en factory y llama a la herramienta `declare_work` del MCP de factory con su identificador. El plugin lee ese identificador del pedido a la herramienta y lo pone en el bloque abierto; los turnos del bloque anteriores a la declaración también reciben la tarea en factory. Las reglas para el agente están en las instrucciones del propio servidor MCP de factory, así valen igual para Claude Code y para Codex.
- **Qué lee el plugin de esas llamadas:** de `declare_work`, solo el identificador de la actividad; de `update_activity`, solo si la acción es completar. Nunca lee la respuesta de una herramienta ni los comandos de la terminal. Un commit no corta el bloque: el corte llega cuando el agente declara la tarea siguiente.
- **Es una propuesta.** La persona la acepta o la corrige en factory. Lo que asignó la persona gana siempre sobre una declaración posterior.
- **Al empezar la sesión**, si el repositorio está vinculado y la captura activa, el plugin agrega una línea que recuerda declarar la tarea.

El tiempo recuperado de las transcripciones no lleva bloque: factory lo suma al bloque de la misma sesión que ya llegó en vivo, o arma uno por sesión y pausa.

## Cuando factory tiene un problema

Un problema de factory nunca rompe ni demora tu sesión. Los hooks de captura solo hablan con factory cuando empieza una sesión, cuando el agente termina una respuesta y cuando la sesión termina, con un límite de 2,5 segundos.

| Situación | Qué pasa |
|---|---|
| Factory no responde, o responde con un error de servidor | Los intervalos quedan en una cola local (`~/.crew/activity/queue.jsonl`) y salen en el próximo intento. Lo que tiene más de 45 días se descarta, igual que la retención de factory. |
| Factory no tiene ficha de persona para tu usuario | Los intervalos quedan en la cola hasta que Gestión vincule una. |
| Tu token venció | La captura sigue registrando en tu máquina, porque la fecha de vencimiento la fijó factory sin que la eligieras. No se envía nada hasta que volvés a correr `/crew:factory login`; ese login envía la cola enseguida, siempre que factory confirme que sos la misma persona en el mismo factory. El tiempo encolado para otra cuenta u otro factory se descarta. Si en ese login factory no puede decir quién sos, el tiempo queda aparte hasta un login que sí pueda. |
| Tu token fue revocado (por vos o por un administrador) | La captura se pausa y la cola local se borra, porque revocar es la forma en que una persona pausa la captura. Se reanuda cuando te volvés a conectar. |
| Factory rechaza un intervalo por inválido | Ese lote se descarta. |

Crew distingue un token vencido de uno revocado por la fecha de vencimiento que guardó el login. Un token creado a mano en factory no tiene esa fecha guardada, así que cuando factory lo rechaza, crew lo trata como revocado.

Cada caso deja una línea en `~/.crew/activity/errors.log`, con la hora, el código HTTP y la cantidad de intervalos. El log nunca guarda contenido de intervalos ni tokens. Toda la carpeta `~/.crew/activity/` la puede leer solo tu usuario, porque describe cuándo trabajás.

**Lo que ves.** Cuando la captura te necesita, aparece en tu sesión un mensaje de una línea de crew: al empezar la sesión, y al terminar una respuesta si el envío encuentra un problema nuevo. Aparece en cinco situaciones, cada una con el comando que la resuelve:

- **Token revocado**: factory rechazó el token antes de su fecha de vencimiento. Corré `/crew:factory login`.
- **Token vencido**: el token pasó su fecha de vencimiento. Tu tiempo se sigue registrando; corré `/crew:factory login` para enviarlo.
- **Token por vencer**: le quedan menos de siete días. Volver a loguearte antes mantiene la captura sin cortes.
- **Sin ficha de persona**: factory no tiene una persona vinculada a tu usuario. Pedile a Gestión que la vincule; mientras tanto el tiempo espera en la cola.
- **Repositorio sin vincular**: estás conectado y el repositorio tiene un `crew.json` sin proyecto de factory. Corré `/crew:factory link`, o apagá la captura para ese repositorio.

Un factory que no responde, o que responde con error, se resuelve solo y mantiene el tiempo en la cola, así que no tiene mensaje propio. El agente recibe las mismas frases al empezar la sesión, para ayudarte a resolverlas.

## Recuperar tiempo perdido

Cuando la captura perdió tiempo (un token que venció antes de que esta versión lo conservara, un repositorio en el que se trabajó antes de vincularlo), se puede reconstruir desde las transcripciones que Claude Code guarda en tu máquina. Se corre desde el repositorio vinculado:

```
/crew:factory backfill
```

El agente primero muestra un resumen: para cada día, tu tiempo, el del agente y la cantidad de intervalos. No se envía nada hasta que lo mirás y decís que sí. Aplica las mismas reglas que la captura en vivo, así que el resultado es lo que la captura habría registrado, con un ajuste: un silencio de más de 15 minutos dentro de una respuesta del agente (una herramienta esperando tu respuesta, una máquina suspendida) queda afuera. Cuentan solo los turnos que empezaste vos; un turno que abre una notificación u otra sesión no suma tiempo del agente.

Qué lee y qué envía:

- Lee solo tus propias transcripciones (`~/.claude/projects/`, o `$CLAUDE_CONFIG_DIR/projects/`), y de ellas solo las sesiones cuya carpeta de trabajo es este repositorio, con la hora de cada registro y las rutas de los archivos que editó el agente.
- Envía los mismos campos que la captura en vivo. El contenido de tus prompts, las respuestas del agente y los resultados de las herramientas quedan en tu máquina: la reconstrucción nunca los copia a otro archivo ni los muestra en el chat.
- Cubre el tiempo desde que te conectaste a factory, dentro de los 45 días de factory. Si esta máquina no conoce tu fecha de conexión, el agente te pide el primer día en que aceptaste la captura (`--since AAAA-MM-DD`).
- Correrlo dos veces da el mismo resultado: cada intervalo reconstruido recibe siempre el mismo id.

**El envío está cerrado en esta versión.** Factory suma el tiempo del agente sin unir tramos que se superponen, así que el tiempo que la captura en vivo ya envió contaría doble. El resumen funciona hoy; el envío se abre cuando factory cuente el tiempo del agente una vez por sesión. Las transcripciones de Codex todavía no se leen.

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
