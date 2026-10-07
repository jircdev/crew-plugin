# Plan correctivo — crew para Opus 5.5 y modo factory (v0.26.0)

**Estado:** propuesta, pendiente de aprobación de Julio. Nada de esto está aplicado.
**Rama:** `feat/factory-work-tracking` (worktree `C:/w/crew-plugin-work-tracking`, base 9382c80).
**Fecha:** 2026-10-07.

## Para qué sirve este documento

Crew nació para modelos que necesitaban guion, énfasis y recordatorios. Opus 5.5 planifica solo, delega solo y sigue las instrucciones al pie de la letra, así que parte de ese andamiaje ahora estorba. Encima, la rama de modo factory se escribió contra el contrato de factory de hace dos semanas. Este plan reúne lo que encontró la auditoría, decide qué se va, qué se simplifica y qué queda, y ordena los cambios para sacar una versión que factory pueda usar para capturar horas.

Lectura rápida: la sección 1 resume los hallazgos, la 2 lista los cambios de esta versión y la 3 deja para después lo que necesita una decisión tuya. Los anexos tienen el detalle: [informe del prompt-audit](prompt-audit-report.md) y [diff propuesto](prompt-audit.diff).

## 1. Hallazgos

### 1.1 Limpieza para Opus 5.5 (las herramientas que pediste)

| Herramienta | Resultado |
|---|---|
| `/claude-api prompt-audit` | Corrió completo. 22 hallazgos: 13 entran al diff (120 hunks, 22 archivos, `git apply --check` pasa), el resto queda como observación. |
| `claude plugin prune` | Existe. No hay nada que podar en ningún scope (user, project, local). |
| `claude plugin eval` | Existe, pero no tiene qué correr: `evals/design/` es una rúbrica para ejecutar a mano, sin `prompt.md` ni `case.yaml`. Hoy no hay forma automática de probar que la limpieza conserva el comportamiento. |
| `/skill-doctor` | Existe como skill. No pudo correr en modo headless porque la sesión OAuth del CLI venció. Hay que correrlo desde una sesión interactiva después de `claude` login. |
| Tests | 28/28 de node y el release test pasan en la rama, antes de cualquier cambio. |

Lo más importante del prompt-audit:

- **Los roles contradicen al guard que los vigila.** 15 roles describen la tabla de estimación sin la fila Total que `guard-estimation.js` exige desde 0.23, y ninguno conoce el modo factory. Un rol que sigue su propio prompt termina bloqueado por el plugin.
- **El template de proyecto contradice al baseline.** `templates/AGENTS.md` pide terminar con `Fuente: path`; el baseline de agosto dice que las rutas aparecen solo si el usuario las pide. Como el `AGENTS.md` del proyecto manda, gana la regla vieja.
- **Los prompts usan la estructura que prohíben.** El bloque de conversación repetido en los 17 roles prohíbe el contraste correctivo y lo usa varias veces. El modelo imita el registro del prompt.
- **Topes numéricos de longitud** ("3-6 oraciones por punto", "viñetas solo para 2-3 ítems") en todos los roles. Con Opus 5.5 recortan razonamiento en problemas difíciles.
- **Errores de hecho:** el researcher (solo lectura) recibe instrucciones de escribir tablas de estimación; "cinco reglas" que son siete; "nueve bloques" que son 11; el checklist de `crew.md` apunta a `docs/roles.md`, que no existe, y omite `sync-codex.js`.

### 1.2 Redundancia y relevancia

- **Peso por sesión.** El baseline inyecta unos 1.500 tokens en cada sesión de cada repo, aunque el repo no tenga `crew.json`. Las descripciones de 17 agentes, 33 skills y 31 comandos suman unos 2.400 tokens más en cada request. Los 17 agentes pesan unos 61.000 tokens en total; el 44 % es el bloque "How you respond in chat", casi idéntico en 16 archivos.
- **Doble fuente de comandos.** Cada alias existe dos veces: `commands/<a>.md` con el procedimiento y `skills/<a>/SKILL.md` generado para Codex, que en Claude Code puede ganarle al comando y agrega un paso de lectura.
- **Los 12 stubs de alias retirados** (ca, comm, dx, infra, inst, lea, mod, perf, rel, sc, vis, web) se retiraron en 0.21.0 (2026-07-15) con la promesa explícita de "redirigir durante una versión". Van cuatro versiones. Cuestan 12 entradas en la lista de skills de cada sesión y cada uno enlaza `crew.md` (3.300 palabras). Su único uso real es tu `~/.claude/CLAUDE.md` desactualizado.
- **La instalación local está atrasada.** Tenés crew 0.23.0 instalado; el publicado es 0.25.0. Por eso ocho agentes aparecen como "Agent from crew plugin": tenían descripciones con YAML inválido, corregidas en 0.25.0. Se arregla con `claude plugin update`.
- **La regla "consult, don't defer" está dos veces**: en el baseline y en tu `~/.claude/CLAUDE.md`. Se carga duplicada en cada sesión.

**Desvío de la tabla de roles en `~/.claude/CLAUDE.md`** (para que `/crew:crew` la regenere):

| En tu CLAUDE.md | Estado en el catálogo de 17 | Debe quedar |
|---|---|---|
| `SC` spec-compliance | absorbido por qa-test-architect | `QA` |
| `REL` release-manager, `INFRA` atlas-deploy, `PERF` performance-reliability | fusionados en platform | `OPS` platform |
| `MOD` module-extension-architect | absorbido por system-architect | `SYS` |
| `VIS` visual-identity | absorbido por ux-architect | `UX` |
| `WEB` web-strategist | absorbido por commercial-strategist | `COM` |
| `CA` crew-architect, `INST` crew-installer | fusionados en crew | `CREW` crew |
| `LEA` researcher | alias renombrado | `RES` researcher |
| `DX` dx-architect | alias renombrado, perfil extendido opt-in | `API` dx-architect |
| (falta) | rol existente | `OPS`, `CREW`, `RES`, `API` |
| "25 roles", "Owns" de COM y UX | textos de antes de 0.21 | descripciones actuales de cada agente |

### 1.3 Circuito y roles

Lo que está bien y queda como está: la taxonomía (historias, requerimientos, ADRs, propuestas), la regla de 0.21.1 (la historia nace sin tabla y quien la ejecuta la agrega al planificar), `guard-estimation.js`, y los roles system-architect, data-architect, security-compliance, frontend-architect, functional-analyst, commercial-strategist y platform.

Lo que hay que corregir porque hoy hace daño:

- **`guard-code-quality.js` bloquea en repos ajenos.** Sin `crew.json` se comporta como `enforce`, y como el plugin está instalado a nivel usuario, aplica en todos tus repos. Además mide el tamaño final del archivo: tocar un carácter de un archivo que ya tenía 211 líneas queda bloqueado (reproducido). Verificado en `guard-code-quality.js:54`.
- **El modo `advise` aprueba sin preguntar.** Devuelve `permissionDecision: "allow"`, que en Claude Code saltea el permiso del usuario. Verificado en `guard-code-quality.js:73-74`.
- **`check-work-log.js` (Stop) bloquea una y otra vez.** Cualquier día con commits y sin entrada en `docs/work/` bloquea cada turno del día (`enforcement.md` dice que bloquea una sola vez), y "saltearlo" no queda registrado en ningún lado.
- **`guard-immutable.js`** impide corregir una entrada de `docs/work/` escrita hace minutos y todavía sin commitear.
- **El hook de pre-commit** guarda una ruta absoluta con la versión del plugin (`.../crew/0.23.0/...`). Cada actualización lo rompe en silencio, igual que pasó en 0.24.
- **Las horas reales de las tablas no suman.** En el piloto DUIT la suma de tablas dio 232 h y el cruce de intervalos de tiempo dio 42 h. Ningún guard puede corregir eso; la captura de actividad del modo factory sí. Es el mejor argumento para esta versión.

Lo que conviene simplificar o fusionar está en la sección 3, porque cambia lo que la gente escribe y merece tu decisión.

### 1.4 Modo factory contra el factory actual (ADR costing/003)

Leído contra factory `dev` @ 10ad15f. La captura sigue funcionando: endpoint, header Bearer, forma del intervalo, límites (16 h, 45 días, 5 min, 500), idempotencia por id y `project_backlog` coinciden. `taskId` sigue sirviendo porque una actividad conserva el mismo uuid de la tarea, y nada en crew usa `cost_center_lines`.

Desvíos:

| # | Desvío | Efecto |
|---|---|---|
| F1 | Factory acepta cuerpos JSON de hasta 100 kB (default de express). Crew manda lotes de hasta 500 intervalos (~370 bytes cada uno). | Una cola grande recibe 413 o 500, crew reintenta para siempre y la cola queda trabada. **Bug real.** |
| F2 | Crew descarta todo 400. Factory responde 400 también cuando el usuario no tiene ficha de persona. | Una persona sin ficha pierde todas sus horas sin aviso. |
| F3 | Crew espera 422; factory nunca lo manda. | Código muerto. |
| F4 | `project_backlog` devuelve una lista plana de todas las clases de actividad (requerimiento, hito, historia, tarea, cita) con `parentId`, y `consumedHours` sin sumar las hijas. `approvedHours` ahora significa horas cotizadas. | `/crew:metrics` mezcla padres con hijos, muestra −100 % en requerimientos y rotula "aprobado" lo que es "cotizado". |
| F5 | Un 403 en `/mcp` es falta de permiso (`tasks.list` o no participar del proyecto). Crew dice "el token fue rechazado, creá otro". | Mensaje que manda a arreglar lo que no está roto. |
| F6 | `docs/*/factory.md` y `enforcement.md` nombran herramientas MCP retiradas (`my_tasks`, `get_task`, `create_task`, `take_task`, `update_task`). | Las 19 herramientas actuales no aparecen, ni el filtrado por permisos. |
| F7 | La clave `taskRef` es `<nombre de la carpeta de crew.json>:<ruta>`; factory documenta `<repo>:<ruta>` sin definir "repo". | Si `crew.json` no está en la raíz del repo, las referencias no casan y nadie se entera. |
| F8 | Crew tiene una sola URL fija y no distingue entornos. Factory publica dos (`deploy/gcp/cr-targets.yaml`, `packages/frontend/.env.*-deploy`): prod `https://api.factory.balearesgroup.com` y dev `https://api.dev.factory.balearesgroup.com`. Ambas verificadas el 2026-10-07: `/health` responde 200, y `/api/v1/mcp` y `/api/v1/activity/intervals` responden 401 sin token. | No se puede apuntar una máquina a dev sin editar el `crew.json` compartido. |
| F9 | Un error de red no deja rastro. Un 401 deja la cola reteniendo actividad de alguien que revocó su token. Si factory no responde, `/crew:metrics` corta con error. | Una falla de factory no se ve en ningún lado, y revocar el token no pausa la captura del todo. |

## 2. Cambios de esta versión, en orden

Cada paso cierra con los tests en verde antes de pasar al siguiente.

1. **Factory mode al día (F1–F9).**
   - `hooks/lib/activity-queue.js`: lotes limitados por bytes (menos de 90 kB) además de por cantidad; ante 413, partir el lote y reintentar las mitades; registrar `HTTP <status> <cuerpo>` cuando la respuesta no es 2xx; descartar un 400 solo si el mensaje habla de los intervalos y conservar el lote cuando falta la ficha de persona (los ítems vencen solos con el filtro de 45 días); sacar el 422.
   - `scripts/metrics-factory.js`: árbol por `kind`/`parentId`/`code`, sin citas; horas consumidas rotuladas como propias de cada actividad; "Aprobado" pasa a "Cotizado"; mensajes distintos para 401 (token) y 403 (permiso o participación).
   - `hooks/lib/activity-rules.js` y `guard-estimation.js`: aceptar `**Factory activity:**` además de `**Factory task:**`.
   - Docs EN/ES (`factory.md`, `enforcement.md`): lista actual de herramientas y aviso de que dependen del perfil; definición de la clave `<carpeta de crew.json>:<ruta>` y cómo enlazarla (`add_task_reference` o `upsert_requirement.externalKey`); requisitos de la persona; snippet de MCP para Codex; vocabulario "actividad".
   - Docs EN/ES: las dos URLs, cuál es el default, cómo pisarlas y qué pasa cuando factory falla.
   - Tests nuevos:
     - resolución de entorno y URL en todas sus combinaciones;
     - captura sin token: no registra nada;
     - servidor caído y 5xx: la cola se conserva, el hook sale con 0 y el aviso aparece una vez;
     - 401: la cola y los estados de sesión se vacían, la captura queda en pausa hasta que cambie el token, y `errors.log` no contiene intervalos ni tokens;
     - retención de 45 días;
     - 413 en lotes grandes y 400 por falta de ficha;
     - fallback de métricas a markdown;
     - backlog con un requerimiento y sus hitos.
   - **Entornos.** El bloque `factory` acepta `environment: "prod" | "dev"`, con `prod` por defecto. Crew trae las dos bases como constantes (`<host>/api/v1`). Un `url` opcional pisa al entorno, para local u otro host. Cada máquina puede cambiarlo sin tocar `crew.json` con `CREW_FACTORY_URL` o `CREW_FACTORY_ENV`, y lo de la máquina gana sobre el archivo compartido. El orden de resolución es: `CREW_FACTORY_URL`, luego `CREW_FACTORY_ENV`, luego `url`, luego `environment`, luego prod. La URL web donde se aprueba el login sigue el mismo orden (prod `factory.balearesgroup.com`, dev `dev.factory.balearesgroup.com`, o `CREW_FACTORY_WEB_URL` / `web`). Un entorno desconocido cae en prod y lo informa el aviso de inicio. El token sigue siendo personal y por máquina.
   - **Una falla de factory nunca rompe la sesión.**
     - Los hooks de captura siempre salen con 0, nunca bloquean y nunca demoran un prompt: solo hacen red al iniciar, al parar y al cerrar sesión, con timeout de 2,5 s.
     - **El token es el consentimiento.** Según el ADR costing/002 de factory y la sección "Privacidad y retención" de `work-tracking.md`, cada persona activa la captura creando su token y la pausa revocándolo. Por eso, sin token la captura no registra nada (como hoy) y nunca se guarda actividad anterior al consentimiento.
     - La cola existe solo con token y sirve para fallas pasajeras: factory no responde, 5xx, 404 o entorno no listo. Se reintenta en cada flush y lo que supera los 45 días se descarta, igual que la retención de factory.
     - **Un 401 se lee como pausa.** Ante un 401 (token revocado o vencido), crew vacía la cola y los estados de sesión, y deja de capturar hasta que la persona configure otro token. Para saber que es otro, guarda una huella del token rechazado (un hash, nunca el token).
     - Toda falla de envío deja una línea en `~/.crew/activity/errors.log` con fecha, código HTTP y cantidad de intervalos. Nunca se escriben intervalos, cuerpos de respuesta con datos de intervalos ni tokens.
     - El aviso de inicio de sesión muestra una sola línea corta cuando hay un problema (token rechazado, factory inalcanzable, cola de más de un día). Nunca se repite en cada prompt. Que falte el token es una decisión de la persona y no genera aviso.
     - Si factory falla, `/crew:metrics` cae al informe markdown local con una línea de aviso.
2. **Guards que hoy hacen daño.**
   - `guard-code-quality.js`: sin `crew.json` no hace nada; bloquea solo cuando la escritura hace crecer un archivo por encima del límite (un archivo que ya estaba excedido se puede tocar si no crece); en `advise` devuelve un aviso como contexto, sin decisión de permiso.
   - `check-work-log.js`: deja de bloquear. Pasa a un recordatorio una vez por día como contexto.
   - `guard-immutable.js`: permite editar entradas de `docs/work/` que git todavía no sigue.
   - `guard-estimation.js`: acepta `## Estimación` además de `## Estimation`.
   - `scripts/init-project.sh`: el pre-commit llama a un wrapper que resuelve la raíz actual del plugin, sin versión en la ruta.
3. **Prompt-audit.** Aplicar el diff del anexo con dos excepciones: sacar el hunk F12 (lista de estilos por defecto en el skill `design`, choca con el principio de que el gusto lo declara el proyecto) y revisar F07 a favor del baseline (rutas solo a pedido) en `templates/AGENTS.md`.
4. **Retirar los 12 stubs.** Borrar `commands/` y `skills/` de ca, comm, dx, infra, inst, lea, mod, perf, rel, sc, vis y web; regenerar con `sync-codex.js`; ajustar el regex que hace que cada skill generado enlace `crew.md`; actualizar `docs/*/roles.md` y la política de retiro en `agents/crew.md` (la redirección dura una versión menor y se borra en la siguiente).
5. **Baseline más liviano.** `standards/session-context.md` se inyecta completo solo en repos con `crew.json` o `AGENTS.md` de crew; en el resto, una línea que dice que crew está disponible. Se reescriben en positivo las frases con contraste correctivo.
6. **Migración y versión.** `migrations.json` agrega 0.26.0 con `required: true` (alias retirados, pre-commit nuevo, el guard de calidad deja de actuar sin `crew.json`), con `docs/en|es/migration-0.26.md`. Versión 0.26.0 en `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json` y donde el release test la pida.
7. **Verificación final.** Tests de node, release test, `sync-codex.js --check`, `/skill-doctor` desde sesión interactiva, y una pasada a mano de `evals/design` con 3 de los 9 casos (los de enrutamiento) antes y después.

### 2.1 Conectar la máquina desde el navegador

Hoy el token se crea en la web de factory, se ve una sola vez y se pega a mano. Esta versión agrega un inicio de sesión de dos clics, como el del MCP de Trello, con **callback local** (decisión de Julio, 2026-10-07). SEC lo aprobó con condiciones: el token nunca pasa por el navegador ni por el puerto local. Por ahí viaja solo un código de un solo uso, que vence en 60 segundos y no sirve sin una clave que nunca sale de la máquina (PKCE S256). Como el callback siempre cae en la máquina de quien aprueba, un atacante que inicia el flujo nunca recibe el código.

**Cómo lo vive la persona.** En el chat de Claude Desktop (o en Codex) escribe `/crew:factory login`. Se abre factory en el navegador, la persona lee la pantalla de consentimiento y aprueba. La página avisa que ya puede volver al chat, y crew confirma "conectado a prod, vence el …". `/crew:factory status` muestra entorno, titular y vencimiento. `/crew:factory logout` revoca el token en factory y borra la copia local. Nadie pega un token en el chat: todo lo que el script imprime lo lee el modelo, así que imprime solo la URL y el resultado.

**Contrato con factory** (lo implementa la sesión de factory; crew depende de esto):

| Pieza | Contrato |
|---|---|
| Página | `<web>/my-hours/connect?port=<1024-65535>&state=<b64url>&challenge=<b64url S256>&device=<texto>`. Solo redirige a `http://127.0.0.1:<port>/callback`: nunca `localhost` y nunca una URL recibida por parámetro. Exige sesión y `my-hours.register`. Siempre pide un clic explícito, aunque haya una aprobación anterior. Envía `frame-ancestors 'none'`. Muestra el nombre del equipo como texto plano, con largo acotado y la etiqueta "nombre declarado por el equipo". |
| Aprobar | `POST /api/v1/access-tokens/loopback` con `{challenge, device}`, `authGuard` y `my-hours.register`. Guarda solo la autorización (hash del código, challenge, quién aprobó, equipo, vencimiento a los 60 s) y devuelve `{code}`. **No crea el token todavía.** |
| Entrega | El frontend hace un form POST de nivel superior a `http://127.0.0.1:<port>/callback` con `code` y `state` en el cuerpo. Si la persona rechaza, manda `state` y `error=denied`. Si algún navegador muestra aviso de red local o de formulario inseguro, se usa un 302 GET con `code` y `state` en la query. |
| Canje | `POST /api/v1/access-tokens/loopback/exchange` con `{code, verifier}`, sin autenticación, con límite por IP y sin CORS. Verifica que S256(verifier) coincide con el challenge, consume el código haya éxito o no, crea el token con `AccessTokensService.create` (aplican el tope de tokens vivos y el chequeo de credenciales) y devuelve `{token, expiresAt}` una sola vez. Nunca registra el cuerpo de la petición. |
| Estado | `GET /api/v1/access-tokens/self` con `personalTokenGuard`: devuelve `{expiresAt, personName}`. |
| Salir | `DELETE /api/v1/access-tokens/self` con `personalTokenGuard`. Revoca solo ese token y repetirlo no hace nada. |
| Consentimiento | La pantalla dice que se capturan solo horarios de inicio y fin, nunca prompts ni código. Explica para qué (imputar costos), quién ve los datos y cuánto se guardan, que conectar es voluntario, que el token vence a los 90 días y que revocarlo pausa la captura, y enlaza el aviso formal. Si la organización de la persona no completó el aviso (y en España la evaluación de impacto), la aprobación se bloquea. SEC recomienda que un abogado confirme la base legal en España. |

**Lo que hace crew:**
- **Comando y servidor local.** `/crew:factory` tiene `login`, `status` y `logout` y usa el entorno que resuelve el bloque `factory` (prod por defecto). En `login` crew levanta un servidor solo en `127.0.0.1`, en un puerto al azar. Acepta un único `POST /callback`, verifica que el header `Host` sea `127.0.0.1:<port>` y compara `state` en tiempo constante. Responde con una página fija, se cierra, y espera como máximo 5 minutos.
- **Guardado del token.** Va en `~/.crew/factory-token`, legible solo por la persona (0600, o ACL de solo dueño en Windows con `icacls`). `FACTORY_TOKEN` sigue ganando sobre todo, y crew nunca lo escribe en perfiles de shell. El llavero del sistema operativo queda para después, porque crew no tiene dependencias.
- **Dónde no aparece el token:** en una URL, un log, la salida del comando o el chat.
- **Alternativa manual:** pegar el token a mano sigue funcionando y queda documentado para casos borde.
- **Tests,** con un factory simulado:
  - el flujo completo: aprobado, rechazado, `state` inválido, `Host` inválido, código vencido y tiempo agotado;
  - los permisos del archivo;
  - `logout` revoca y borra aunque factory no responda; en ese caso borra la copia local y avisa que la revocación quedó pendiente.

**Orden.** Factory publica los endpoints y la página primero, en dev. Crew prueba el flujo contra dev y después contra prod. Si factory llega antes que crew 0.26, el login entra en esta versión. Si no, 0.26 sale con el token pegado a mano y el login llega en 0.26.1, sin migración.

### Qué se va y qué queda

| Se va | Queda |
|---|---|
| 12 stubs de alias retirados | Los 17 agentes (las fusiones esperan la sección 3) |
| Bloqueo del Stop hook | `guard-estimation.js`, `guard-timestamps.js`, `guard-immutable.js` (más permisivo) |
| Enforcement del guard de calidad en repos sin `crew.json` | Gate de pre-commit `check-quality.sh` |
| Topes numéricos, MANDATORY, conteos y rutas falsas en los roles | El contenido de autoridad y alcance de cada rol |
| Nombres de herramientas MCP retiradas | Todo el modo factory, corregido |

### Entrada de CHANGELOG (borrador)

```
## [0.26.0] — 2026-10-xx

### Added
- Factory mode: work time captured from Claude Code and Codex sessions and sent
  to factory's activity endpoint; `/crew:metrics` reads estimates and consumed
  hours from factory's `project_backlog`. Off unless crew.json declares a
  `factory` block. Targets factory prod by default; `environment: "dev"`,
  `url`, `CREW_FACTORY_ENV` or `CREW_FACTORY_URL` point it elsewhere. The
  personal token is the opt-in: without one nothing is recorded. A factory
  outage never disturbs the session: intervals stay queued locally for up to
  45 days and session start warns once. A revoked or expired token (401)
  pauses capture and clears the local queue.
- `/crew:factory login | status | logout`: connects the machine to factory with
  a browser approval and a local callback (PKCE); the token is stored owner-only and
  `logout` revokes it server-side.

### Changed
- Role prompts rewritten for Opus 5.5: no capitalized emphasis, no numeric
  length caps, estimation section matches the guard (Total row, factory link).
- The code-quality guard acts only in repos with crew.json, blocks only writes
  that grow a file past its ceiling, and advise mode no longer auto-approves.
- The work-log Stop hook reminds once a day instead of blocking.
- The session baseline is injected in full only where crew is configured.
- The pre-commit hook resolves the current plugin root, so updates no longer
  break it.

### Removed
- The 12 aliases retired in 0.21.0 (ca, comm, dx, infra, inst, lea, mod, perf,
  rel, sc, vis, web).

### Migration
- Required. See docs/en/migration-0.26.md.
```

### Publicar y activar en factory

Cada uno de estos pasos espera tu sí explícito.

1. Mergear la rama en `main` y hacer push. Tag `v0.26.0`.
2. En tu máquina: `claude plugin update crew@factory-crew` (llevás 0.23.0) y comprobar que los agentes muestran su descripción real.
3. Regenerar la tabla de roles de `~/.claude/CLAUDE.md` con `/crew:crew` en scope global, según el cuadro de la sección 1.2, y sacar el duplicado de "consult, don't defer".
4. En factory: obtener el `projectId` del proyecto factory (herramienta MCP `list_projects`) y agregar al `crew.json`:
   ```json
   "factory": { "projectId": "<uuid>" }
   ```
   Con eso usa prod. Quien quiera probar contra dev pone `CREW_FACTORY_ENV=dev` en su máquina. El token nunca va en `crew.json`.
5. Cada persona conecta su máquina con `/crew:factory login` cuando factory tenga el flujo de la sección 2.1. Mientras tanto, crea el token en **Mis horas → Conectar con la IA** (vence a los 90 días) y lo guarda en `FACTORY_TOKEN` o `~/.crew/factory-token`. Necesita ficha de persona, permiso `my-hours.register` (así se llama desde factory dev @ 5d5b48b, 2026-10-07; antes era `costing.register`), participar del proyecto factory, y que la actividad cuelgue de un paquete aprobado para que se le propongan horas.
6. Avisar formalmente al equipo antes de prender la captura, como piden el ADR 002 y `work-tracking.md`.

## 3. Decisiones tuyas, para la versión siguiente (0.27)

Estas cambian qué escribe y a quién llama la gente. Recomiendo hacerlas recién con evals automáticos, para medir antes y después.

| Propuesta | Recomendación | Por qué |
|---|---|---|
| Bloque de conversación compartido | Sí | 44 % del peso de los agentes es el mismo texto en 16 archivos. Una sola versión corta, generada en cada agente por script para que no se desvíe. |
| `delivery-coordinator` | Retirar | Opus 5.5 secuencia y delega solo; la "política de encadenamiento" del circuito ya cubre el orden. Al rol solo le queda marcar tiempos. |
| `researcher` | Redirigir a Explore | Mismo trabajo que el agente Explore nativo. `/crew:res` puede lanzar Explore con la instrucción de separar lo observado de lo inferido. |
| `dx-architect` | Fusionar en `system-architect` | Contratos de API públicos y contratos de API son la misma autoridad; MOD ya se fusionó igual. |
| `data-experience-architect` | Fusionar en `ux-architect` | Tres roles para una pantalla es ceremonia. |
| `analytics-architect` | Pasar a perfil extendido opt-in | Se usa poco; métricas de producto son de PROD y su modelo es de DA. |
| `commands/` y `skills/` | Una sola fuente | Skills canónicos con el procedimiento adentro y `disable-model-invocation`, sin generador. Falta verificar cómo lo trata Codex. |
| `docs/work/` | Opcional | Se superpone con commits, PRs y CHANGELOG; con captura de factory, las horas salen de ahí. |
| Evals ejecutables | Sí, primero | Convertir 3–4 fixtures de `evals/design` y agregar casos de enrutamiento de roles al formato de `claude plugin eval`, así la próxima limpieza se puede probar. |
| Propuesta `scope-baseline` | Simplificar antes de adoptar | Sin `guard-scope.js` en v1 y con horas tomadas de la captura. |

## Sello de evidencia

Verificado: tests de node (28/28) y release test en la rama; `claude plugin prune --dry-run` en los tres scopes; existencia de `claude plugin eval` y ausencia de casos ejecutables; tamaño del baseline ejecutando el hook; comportamiento del guard de calidad leyendo el código; contrato de factory leído en su código y docs de `dev` @ 10ad15f. Sin verificar: `/skill-doctor` (OAuth vencido), calidad de enrutamiento real de los roles (no hay datos de uso ni evals automáticos). Las URLs de prod y dev las verificó con curl otra sesión de trabajo el 2026-10-07; desde esta sesión no se repitió la prueba.
