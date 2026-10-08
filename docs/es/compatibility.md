# Claude Code y Codex

Crew 0.25.0 mantiene una sola base: `agents/` contiene los 17 roles,
`commands/` sus procedimientos, `skills/design`, `skills/writing` y `skills/planning` los oficios,
y `standards/` y `templates/` las convenciones. `hooks/lib/config.js` interpreta
el mismo `crew.json` en ambos hosts. No se necesita una configuración paralela.

Las 31 skills de alias se generan como enlaces a esa base. Claude conserva
`/crew:<alias>` y los subagentes; si una skill prevalece sobre el comando
homónimo, su entrada remite al procedimiento original. Codex usa esas skills
y el adaptador `integrations/codex/README.md`; no registra tipos de subagentes
nativos ni promete consultas independientes cuando el host no permite delegar.

## Requisitos

Node.js 22+ para los helpers y hooks, Git para las comprobaciones de commits y
Bash para el scaffold opcional (Git Bash en Windows). La instalación desde un
ZIP publicado no necesita Python; generar los artefactos desde la fuente usa
Python 3.10+. Se probaron Claude Code 2.1.227 y Codex CLI 0.153.4 en Windows.
La autenticación del modelo se configura en cada aplicación, no en Crew.

## Instalar en Claude

Sigue la [guía de instalación](installation.md): agrega `jircdev/crew-plugin`
y luego instala `crew@factory-crew`. La release también incluye
`crew-0.25.0.plugin`, el paquete mencionado por la migración 0.24, y
`crew-0.25.0.zip`, con los mismos bytes ZIP para las interfaces que exigen esa
extensión. Ambos tienen `.claude-plugin/plugin.json` en la raíz; no son un
manifiesto JSON suelto ni un catálogo. No contienen `bin/`.

Para una sesión local: `claude --plugin-dir /ruta/absoluta/crew-plugin`.
Invoca `/crew:fe`, `/crew:setup` o `/crew:metrics`. Las superficies de chat que
no ejecutan hooks/subagentes solo pueden consumir las skills; no atribuyas a
ellas las garantías de Claude Code. La carga alojada de archivos no fue probada.

## Instalar en Codex

1. Descarga `crew-codex-0.25.0.zip` desde la
   [release 0.25.0](https://github.com/jircdev/crew-plugin/releases/tag/v0.25.0).
   Extrae el archivo completo en una carpeta estable, por ejemplo
   `C:/tools/crew-codex-0.25.0`. Conserva `.agents/plugins/marketplace.json`
   y `plugins/crew/`: el primero es el catálogo, el segundo el plugin.
2. Registra esa carpeta e instala el plugin:

   ```sh
   codex plugin marketplace add C:/tools/crew-codex-0.25.0
   codex plugin add crew@factory-crew
   codex plugin marketplace list
   codex plugin list
   ```

3. Abre una tarea nueva en el proyecto. En la app, busca Crew en el directorio
   de plugins y comprueba que esté habilitado. En el selector de skills deben
   aparecer los alias (`crew:fe`, `crew:setup`, etc.) y design/writing.
4. Revisa y confía en los hooks mediante `/hooks` en Codex CLI o la interfaz de
   confianza disponible en tu host. Instalar el plugin no concede esa confianza.
   Cada cambio en la definición de un hook requiere revisión de nuevo.

Desde la fuente puedes generar el mismo catálogo sin registrarlo ni instalarlo:

```sh
node scripts/sync-codex.js --check
python scripts/build-release.py --output work/release-0.25.0
codex plugin marketplace add /ruta/crew-plugin/work/release-0.25.0/codex-marketplace
codex plugin add crew@factory-crew
```

El generador exige un destino nuevo; no sobrescribe carpetas. Como alternativa,
`$plugin-creator` puede registrar el plugin fuente existente en un catálogo
personal, preservando sus archivos. El repositorio GitHub conserva el catálogo
Claude; para Codex usa el catálogo distribuido, no asumas que ambos esquemas son iguales.

## Configurar y activar un proyecto

Abre el repositorio consumidor y selecciona la skill `crew:crew` si necesitas
instalar las convenciones del proyecto. Pide explícitamente modo solo o team;
el scaffold `scripts/init-project.sh` conserva los archivos existentes.
Después selecciona `crew:setup` para revisar `crew.json`, diseño y testing.
La entrevista pregunta solo lo que falta, confirma lo entendido y escribe
únicamente lo confirmado. Aceptar el estado actual también es un resultado válido.

`AGENTS.md` es el contexto compartido del proyecto y `CLAUDE.md` su puntero para
Claude. No hay que copiar los criterios a otro archivo de configuración Codex.
Si deseas el prefijo conversacional `FE:`/`SYS:`, pide a Crew activar su sección
en `AGENTS.md`; instalar el plugin por sí solo no escribe ese archivo. Usa el
selector para invocar una skill de forma explícita; `/crew:<alias>` es sintaxis
Claude y no se presume como comando nativo Codex.

Conserva el mismo `crew.json`: modo, métricas, calidad, capacidades y
`configuredWith`. Una capacidad ausente no se inventa. Las preferencias globales
de modelo y autenticación siguen perteneciendo a cada aplicación.

## Verificar y actualizar

En una tarea nueva, confirma que Crew aparece habilitado y que `crew:fe` lee
frontend-architect. En un proyecto descartable, intenta editar una entrada ya
existente de `docs/work/YYYY-MM/`: Claude Write y Codex apply_patch deben devolver
el rechazo de inmutabilidad de Crew. Si falta el rechazo, inspecciona `/hooks`,
Node en PATH y la herramienta usada; una escritura shell no prueba este control.
Comprueba el resultado en disco. El texto de una skill no demuestra enforcement.

Para actualizar Claude: `/plugin update crew@factory-crew` y sesión nueva.
Para actualizar el catálogo Codex distribuido: descarga y extrae la nueva
versión en otra carpeta, conserva la anterior hasta verificar el cambio y
registra la nueva raíz. Si Codex ya tiene un origen local `factory-crew`, ejecuta
`codex plugin marketplace remove factory-crew` antes de `marketplace add` con
la nueva ruta; esto quita el origen registrado, no tu proyecto. Ejecuta de nuevo
`codex plugin add crew@factory-crew`, revisa la versión con `plugin list`, abre
una tarea nueva y vuelve a confiar en hooks cambiados. Para un catálogo fuente
actualizado en la misma raíz, usa `codex plugin marketplace upgrade factory-crew`
y reinstala Crew. No edites la caché instalada.

## Cobertura y límites

| Control | Claude Code | Codex |
|---|---|---|
| Baseline y aviso de configuración | SessionStart | SessionStart con cwd del evento y adaptador Codex |
| Roles y oficios | Comandos/subagentes y skills | Skills que leen los mismos originales; delegación según host |
| Inmutabilidad, estimación, verificación, fechas, calidad | Guards Edit/Write | apply_patch traducido por archivo y evaluado por los mismos guards |
| Forma de los work items | Guard Edit/Write | apply_patch por el mismo guard |
| Planes publicados fuera del repo | Aviso en llamadas MCP y Artifact | Registrado; sin verificar si Codex corre hooks en llamadas MCP |
| Evasión de hooks, comandos destructivos | Guard Bash/PowerShell | Registrado para nombres de herramienta de shell; el nombre exacto en los hooks de Codex no está verificado |
| Relajación de políticas | Guard Edit/Write | apply_patch por el mismo guard |
| Trabajo en curso al iniciar sesión | SessionStart, también tras compactar; aviso en PreCompact | SessionStart; sin verificar si Codex dispara PreCompact |
| Registro de trabajo | Stop | Mismo script: Git y cwd, sin interpretar transcripciones |
| Tamaños en commit | Hook Git opcional del scaffold | Mismo hook; `node /ruta/crew/scripts/check-staged.js --all` comprueba archivos versionados |

El adaptador admite altas, bajas, cambios, renombrados, varios archivos y hunks
con `@@` simple o `@@ función/clase` y contexto de líneas exacto único. El
ancla de función/clase se busca hacia adelante, admitiendo espacios exteriores.
Comprueba origen y destino de un
renombrado sin escribir en disco. Contexto ambiguo, anclas inexistentes,
coincidencias aproximadas de líneas y rutas repetidas se rechazan indicando cómo corregir el parche.
Divide el parche; no evadas un rechazo escribiendo por shell. Un renombrado con
métricas históricas puede necesitar un procedimiento revisado por separado.

`quality: advise` informa sin aprobar explícitamente la herramienta; `enforce`
rechaza y `off` calla. Los guards compartidos conservan su fail-open ante errores
internos; el adaptador rechaza fallos del parser o de procesos hijos. Escrituras
por shell, escrituras MCP más allá del aviso de planes fuera del repo, hooks deshabilitados/sin confianza y rutas especiales no están
cubiertos. Es una ayuda de proceso, no una barrera de seguridad. El hook Git
puede omitirse; CI protegido es necesario si el control debe sobrevivir a eso.
El checker Git solo mide tamaños. Stop es un recordatorio por commits/entradas
del día, no prueba de cierre. Sin hooks, la skill carga el baseline como
instrucción y debe declarar que no verificó el control mecánico.

## Pruebas y mantenimiento

Edita los roles/comandos canónicos y ejecuta `node scripts/sync-codex.js`.
`--check` detecta entradas faltantes, obsoletas o retiradas. El manifiesto Codex
deriva versión/autor del Claude; no se edita a mano. La prueba de contratos es
`node --test tests/compatibility.test.js`. CI la ejecuta en Windows y Linux.
`python scripts/build-release.py --output <carpeta-nueva>` genera archivos
`.plugin`, `.zip`, el ZIP de catálogo Codex y `SHA256SUMS` sin publicar nada.

El smoke opcional `python tests/runtime-smoke.py --output <carpeta-nueva>` usa
las CLIs instaladas y un servidor de respuestas controladas en loopback. Si
Claude no es un ejecutable directo, pasa `--claude /ruta/claude.exe`.
En Windows se verificó descubrimiento de 33 skills en ambos hosts y 17 agentes
en Claude; ambos rechazaron la modificación inválida por el hook real y dejaron
el archivo protegido intacto sin escribir tampoco el primer archivo válido del
mismo parche. También se comprueba una edición válida con `@@ función`.
Codex usa una excepción de confianza limitada a esa ejecución para las fuentes
revisadas y permite escribir en los fixtures sin sandbox de Windows; solo recibe
las operaciones fijas del servidor local, nunca decisiones de un modelo remoto.
No se copiaron credenciales ni se cambiaron perfiles
globales. Esto prueba integración/runtime; no prueba criterio, adherencia ni
colaboración de modelos reales, la interfaz interactiva de confianza o carga alojada.

## Fuentes

Contratos consultados el 2026-09-07:
[paquete OpenAI](https://developers.openai.com/plugins/build/plugins),
[migración Claude](https://developers.openai.com/plugins/guides/submit-claude-plugin),
[hooks Codex](https://developers.openai.com/codex/hooks),
[skills Claude](https://code.claude.com/docs/en/skills) y
[carga ZIP Claude](https://support.claude.com/en/articles/13837433-manage-plugins-for-your-organization).
El antecedente `.plugin` y la prohibición de `bin/` están en la
[migración 0.24](migration-0.24.md). El español es la fuente editorial; el inglés
mantiene la misma estructura e información.
