# Claude Code y Codex

Crew tiene una sola base: `agents/` contiene los 17 roles,
`commands/` sus procedimientos, `skills/design`, `skills/writing` y `skills/planning` los oficios,
y `standards/` y `templates/` las convenciones. `hooks/lib/config.js` interpreta
el mismo `crew.json` en ambos hosts. No se necesita una configuración paralela.

Las 34 skills de alias se generan como enlaces a esa base, una por cada comando
de `commands/`. Claude conserva `/crew:<alias>` y los subagentes; si una skill
prevalece sobre el comando homónimo, su entrada remite al procedimiento original.
Codex usa esas skills y el adaptador `integrations/codex/README.md`. Codex no
registra tipos de subagentes nativos, y Crew no promete consultas independientes
cuando el host no permite delegar.

## Requisitos

Node.js 22+ para el scaffold, los helpers y los hooks; Git para las comprobaciones
de commits; Bash para la puerta pre-commit y los envoltorios `.sh` (Git Bash en
Windows). Instalar desde un ZIP publicado no necesita Python; generar los
artefactos desde la fuente usa Python 3.10+. Versiones verificadas el 2026-10-08
en Windows: Claude Code 2.1.227 y Codex CLI 0.130.0-alpha.5. La autenticación
del modelo se configura en cada aplicación. Crew no la toca.

## Instalar en Claude

Sigue la [guía de instalación](installation.md): agrega `jircdev/crew-plugin`
y luego instala `crew@factory-crew`. Cada release publicada también incluye
`crew-<versión>.plugin`, el paquete mencionado por la migración 0.24, y
`crew-<versión>.zip`, con los mismos bytes ZIP para las interfaces que exigen esa
extensión. Ambos tienen `.claude-plugin/plugin.json` en la raíz. Son el plugin
completo empaquetado, distinto de un manifiesto JSON suelto o de un catálogo.
No contienen `bin/`.

Para una sesión local: `claude --plugin-dir /ruta/absoluta/crew-plugin`.
Invoca `/crew:fe`, `/crew:setup` o `/crew:metrics`. Las superficies de chat que
no ejecutan hooks ni subagentes solo pueden consumir las skills; las garantías de
los guards valen solo donde corren los hooks. La carga alojada de archivos no fue probada.

## Instalar en Codex

Pasos verificados en Codex CLI 0.130.0-alpha.5 el 2026-10-08. Esa versión no
tiene `codex plugin add`: la instalación es registrar el catálogo, instalar el
plugin y activar los hooks.

1. **Consigue el catálogo Codex.** Hay dos fuentes:
   - Desde la fuente, para la versión actual del repo: en un clon del plugin,
     `python scripts/build-release.py --output work/release-<versión>`. El catálogo
     queda en `work/release-<versión>/codex-marketplace/` y también empaquetado
     como `assets/crew-codex-<versión>.zip`. El generador exige una carpeta nueva
     y nunca sobrescribe.
   - Desde una release publicada: descarga `crew-codex-<versión>.zip` de las
     [releases](https://github.com/jircdev/crew-plugin/releases) y extráelo
     completo en una carpeta estable, por ejemplo `C:/tools/crew-codex-<versión>`.
     La última release publicada es la 0.25.0, anterior a la versión actual del repo.

   La carpeta tiene que conservar `.agents/plugins/marketplace.json` (el catálogo,
   llamado `factory-crew`) y `plugins/crew/` (el plugin).
2. **Registra el catálogo:**

   ```sh
   codex plugin marketplace add <carpeta-del-catálogo>
   codex plugin marketplace list
   ```

3. **Instala el plugin.** Codex carga un plugin instalado en
   `CODEX_HOME/plugins/cache/<marketplace>/<plugin>/<versión>` y habilitado en
   `config.toml`. `CODEX_HOME` es la carpeta de configuración de Codex. Pasos manuales verificados:
   - copia `plugins/crew/` del catálogo a `CODEX_HOME/plugins/cache/factory-crew/crew/<versión>/`;
   - agrega a `CODEX_HOME/config.toml`:

     ```toml
     [plugins."crew@factory-crew"]
     enabled = true
     ```

   Es probable que el directorio de plugins de la app de Codex haga este paso
   al instalar Crew. Eso no está verificado.
4. **Activa los hooks.** Los guards de Crew son hooks, y Codex los corre solo si
   se cumplen las dos condiciones:
   - la feature `plugin_hooks` está activa (Codex todavía la marca como en desarrollo),
     en `config.toml` o por corrida con `codex --enable plugin_hooks`:

     ```toml
     [features]
     plugin_hooks = true
     ```

   - cada hook está en confianza. Revísalos y confía en ellos con `/hooks`; Codex
     guarda cada confianza en `config.toml` como `[hooks.state."<clave>"]` con un
     `trusted_hash`. Instalar el plugin no da esa confianza, y cada cambio en la
     definición de un hook pide revisarlo de nuevo.

   Si falta cualquiera de las dos, Codex carga las skills de Crew pero no corre
   **ninguno** de sus guards. En ese estado el smoke vio pasar un `git commit --no-verify`.
5. **Comprueba.** Abre una tarea nueva en el proyecto. En el selector de skills
   deben aparecer los alias (`crew:fe`, `crew:setup`, etc.) y los oficios design,
   writing y planning. Para confirmar que los guards corren, sigue
   [Verificar y actualizar](#verificar-y-actualizar).

El repositorio GitHub contiene el catálogo de Claude. Codex usa el catálogo
generado, que tiene otro esquema. Como alternativa no verificada en 0.130,
`$plugin-creator` puede registrar el plugin fuente en un catálogo personal,
preservando sus archivos.

## Configurar y activar un proyecto

Abre el repositorio consumidor y selecciona la skill `crew:crew` si necesitas
instalar las convenciones del proyecto. Pide explícitamente modo solo o team;
el scaffold (`scripts/init-project.js`, o su envoltorio `init-project.sh`) conserva los archivos existentes.
Después selecciona `crew:setup` para revisar `crew.json`, diseño y testing.
La entrevista pregunta solo lo que falta, confirma lo entendido y escribe
únicamente lo confirmado. Aceptar el estado actual también es un resultado válido.

`AGENTS.md` es el contexto compartido del proyecto y `CLAUDE.md` su puntero para
Claude. No hay que copiar los criterios a otro archivo de configuración Codex.
Si deseas el prefijo conversacional `FE:`/`SYS:`, pide a Crew activar su sección
en `AGENTS.md`; instalar el plugin por sí solo no escribe ese archivo. Usa el
selector para invocar una skill de forma explícita. `/crew:<alias>` es sintaxis
de Claude; en Codex no se presume como comando nativo.

Conserva el mismo `crew.json`: modo, métricas, calidad, capacidades y
`configuredWith`. Una capacidad ausente no se inventa. Las preferencias globales
de modelo y autenticación siguen perteneciendo a cada aplicación.

## Verificar y actualizar

En una tarea nueva, confirma que Crew aparece habilitado y que `crew:fe` lee
frontend-architect. En un proyecto descartable, intenta editar una entrada ya
existente de `docs/work/YYYY-MM/`: Claude Write y Codex apply_patch deben devolver
el rechazo de inmutabilidad de Crew. Si falta el rechazo, revisa `plugin_hooks`,
la confianza en `/hooks`, Node en PATH y la herramienta usada. Una escritura por
shell no prueba este control. Comprueba el resultado en disco: el texto de una
skill no demuestra que el guard corrió.

Para actualizar Claude: `/plugin update crew@factory-crew` y sesión nueva.

Para actualizar Codex, prepara la versión nueva en otra carpeta y conserva la
anterior hasta verificar el cambio. Registra la nueva carpeta con
`codex plugin marketplace add`; si ya hay un origen `factory-crew` registrado,
quítalo antes con `codex plugin marketplace remove factory-crew` (esto quita el
origen registrado y deja tu proyecto intacto). Copia el plugin nuevo a su propia
carpeta de versión en la caché, abre una tarea nueva y vuelve a confiar en los
hooks que cambiaron. No edites archivos dentro de una versión ya instalada.

## Cobertura y límites

| Control | Claude Code | Codex |
|---|---|---|
| Baseline y aviso de configuración | SessionStart | SessionStart con cwd del evento y adaptador Codex |
| Roles y oficios | Comandos/subagentes y skills | Skills que leen los mismos originales; delegación según host |
| Inmutabilidad, estimación, verificación, fechas, calidad | Guards Edit/Write | apply_patch traducido por archivo y evaluado por los mismos guards |
| Forma de los work items | Guard Edit/Write | apply_patch por el mismo guard |
| Planes publicados fuera del repo | Aviso en llamadas MCP y Artifact | Verificado: una llamada MCP llega a PreToolUse como `mcp__<servidor>__<herramienta>`, el aviso corre y llega al modelo |
| Evasión de hooks, comandos destructivos | Guard Bash/PowerShell | Verificado: la shell nativa llega a los hooks como `Bash` con `command`; `--no-verify` se niega |
| Relajación de políticas | Guard Edit/Write | apply_patch por el mismo guard |
| Trabajo en curso al iniciar sesión | Verificado: SessionStart al iniciar, al reanudar y tras compactar (`compact`); se muestra el aviso de PreCompact | Solo al iniciar. PreCompact y PostCompact se disparan, pero el aviso no se ve en `exec` y ningún SessionStart sigue a la compactación, así que el bloque no vuelve al modelo |
| Escaneo de seguridad de la configuración del agente | `scripts/sec-scan.js`, doctor, aviso en SessionStart | Mismo script; los archivos de configuración de Codex todavía no están entre los objetivos escaneados |
| Uso del catálogo (opcional, por persona) | PostToolUse sobre Agent/Skill, UserPromptSubmit | UserPromptSubmit y PostToolUse se disparan; sin verificar si la delegación propia de Codex llega a PostToolUse |
| Registro de trabajo | Stop | Mismo script: Git y cwd, sin interpretar transcripciones |
| Captura de actividad (modo factory) | SessionStart, UserPromptSubmit, Stop, SessionEnd, PostToolUse Edit/Write/MultiEdit | Mismos eventos que emita el host; la tarea sale de las cabeceras de archivo de apply_patch en PostToolUse |
| Tamaños en commit | Hook Git opcional del scaffold | Mismo hook; `node /ruta/crew/scripts/check-staged.js --all` comprueba archivos versionados |

El adaptador admite altas, bajas, cambios, renombrados, varios archivos y hunks
con `@@` simple o `@@ función/clase` y contexto de líneas exacto único. El
ancla de función/clase se busca hacia adelante, admitiendo espacios exteriores.
Comprueba origen y destino de un renombrado sin escribir en disco. Contexto
ambiguo, anclas inexistentes, coincidencias aproximadas de líneas y rutas
repetidas se rechazan indicando cómo corregir el parche.
Ante un rechazo, divide el parche; escribir por shell para evadirlo rompe el control.
Un renombrado con métricas históricas puede necesitar un procedimiento revisado por separado.

`quality: advise` informa sin aprobar explícitamente la herramienta; `enforce`
rechaza y `off` calla. Los guards compartidos dejan pasar la operación ante un
error interno, salvo los de shell y políticas; el adaptador rechaza fallos del
parser o de procesos hijos. Quedan sin cubrir las escrituras por shell, las
escrituras MCP más allá del aviso de planes fuera del repo, los hooks
deshabilitados o sin confianza y las rutas especiales. Crew es una ayuda de
proceso. Si un control tiene que resistir a alguien que lo evade, hace falta CI
protegido: el hook Git puede omitirse. El checker Git solo mide tamaños. Stop
es un recordatorio basado en los commits y entradas del día, y no certifica el
cierre. Sin hooks, la skill carga el baseline como instrucción y debe declarar
que no verificó el control mecánico.

## Pruebas y mantenimiento

Edita los roles/comandos canónicos y ejecuta `node scripts/sync-codex.js`.
`--check` detecta entradas faltantes, obsoletas o retiradas. El manifiesto Codex
deriva versión/autor del Claude, así que no se edita a mano. La prueba de contratos es
`node --test "tests/*.test.js"`. CI la ejecuta en Windows y Linux.
`python scripts/build-release.py --output <carpeta-nueva>` genera archivos
`.plugin`, `.zip`, el ZIP de catálogo Codex y `SHA256SUMS` sin publicar nada.

El smoke opcional `python tests/runtime-smoke.py --output <carpeta-nueva>` usa
las CLIs instaladas y un servidor de respuestas controladas en loopback. Si
Claude no es un ejecutable directo, pasa `--claude /ruta/claude.exe`. Está
**fijado a Codex 0.130.0-alpha.5** y rechaza otra versión, porque la instalación
de plugins y la confianza en hooks cambiaron entre releases. Instala Crew con los
pasos manuales de [Instalar en Codex](#instalar-en-codex) y escribe un
`trusted_hash` por hook solo para el paquete que acaba de construir. Sobre los
chequeos originales corren tres casos de host: la shell
nativa de Codex ejecutando `git commit --no-verify` (negado; se registra el nombre
de la herramienta), un servidor MCP stdio mínimo con una herramienta `publish`
(aviso observado), y la compactación con un hito abierto en ambos hosts. El
2026-10-08, con Claude Code 2.1.227, se verificó descubrimiento de 37 skills en
ambos hosts y 17 agentes en Claude; ambos rechazaron la modificación inválida por el hook real y dejaron
el archivo protegido intacto sin escribir tampoco el primer archivo válido del
mismo parche. También se comprueba una edición válida con `@@ función`.
Codex corre con aprobaciones y sandbox desactivados dentro del perfil aislado
para que las escrituras en los fixtures funcionen; solo recibe
las operaciones fijas del servidor local, nunca decisiones de un modelo remoto.
No se copiaron credenciales ni se cambiaron perfiles globales. Esto prueba la
integración en runtime. Quedan sin probar el criterio, la adherencia y la
colaboración de modelos reales, la interfaz interactiva de confianza y la carga alojada.

## Fuentes

Contratos consultados el 2026-09-07:
[paquete OpenAI](https://developers.openai.com/plugins/build/plugins),
[migración Claude](https://developers.openai.com/plugins/guides/submit-claude-plugin),
[hooks Codex](https://developers.openai.com/codex/hooks),
[skills Claude](https://code.claude.com/docs/en/skills) y
[carga ZIP Claude](https://support.claude.com/en/articles/13837433-manage-plugins-for-your-organization).
La instalación en Codex 0.130 se verificó contra la CLI el 2026-10-08.
El antecedente `.plugin` y la prohibición de `bin/` están en la
[migración 0.24](migration-0.24.md). El español es la fuente editorial; el inglés
mantiene la misma estructura e información.
