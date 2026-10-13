# crew

[![version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fjircdev%2Fcrew-plugin%2Fmain%2F.claude-plugin%2Fplugin.json&query=%24.version&label=version&prefix=v&color=blue)](../../.claude-plugin/plugin.json)

> Léelo en **español** (abajo) · Prefer English? → **[Read it in English](../../README.md)**

Los agentes de código son generalistas. Si apuntas uno a tu repo, empieza a escribir código enseguida: nadie es dueño de cada decisión, el porqué de la arquitectura se pierde entre sesiones y cada chat nuevo vuelve a discutir lo que ya estaba resuelto. "Terminado" significa que el agente lo dijo.

crew convierte a ese agente en una factory de software. Su propósito es entregar software correcto con menos intervención humana, menos retrabajo y entregas que cualquiera puede verificar. Es un plugin para Claude Code y Codex, y sus medios son:

- un catálogo de roles especializados, con un solo dueño por decisión;
- un flujo guiado por especificaciones (spec-driven), de la idea a producción;
- convenciones que viven en el repo y que Claude Code, Cursor, Copilot y Codex leen de forma nativa, así cada decisión se escribe una vez y se lee muchas.

Los roles, el flujo y los guards son los medios; la medida es el software que funciona. Funciona con cualquier stack. crew aporta el método; el conocimiento de tu stack (convenciones, herramientas, diagnósticos) queda en tu proyecto, que lo declara en `crew.json` para que los roles lo carguen. Ver [Especificaciones de stack](configuration.md#especificaciones-de-stack).

## Cómo fluye el trabajo

La crew sigue un circuito guiado por especificaciones y alineado con Scrum. Cada etapa deja un artefacto en el repo, y los agentes lo leen desde ahí. Estándar completo: [circuito de entrega](../../templates/docs/guides/delivery-circuit.es.md).

Qué roles trabajan en cada etapa, y el catálogo completo por área: [roles.md](roles.md).

## Documentación

| Si quieres… | Lee |
|-------------|-----|
| Instalar en Claude Code, actualizar o desinstalar | [installation.md](installation.md) |
| Instalar en Codex | [compatibility.md § Instalar en Codex](compatibility.md#instalar-en-codex) |
| Configurar un proyecto nuevo o adoptar uno existente | [using-crew.md](using-crew.md) |
| Elegir el modo del proyecto (team o solo) | [using-crew.md § Elegir el modo](using-crew.md#elegir-el-modo-del-proyecto) |
| Ver todos los comandos: roles, `/crew:setup`, `/crew:check`, `/crew:doctor`, `/crew:adopt`, `/crew:metrics`, `/crew:factory` | [using-crew.md § Comandos](using-crew.md#comandos-de-crew) |
| Conocer los roles y qué decide cada uno | [roles.md](roles.md) |
| Configurar `crew.json`: modo, métricas, calidad, techos, diseño, testing y recibos, stack, auditoría, telemetría, factory | [configuration.md](configuration.md) |
| Entender qué hace cada guard y resolver un bloqueo | [enforcement.md](enforcement.md) |
| Registrar una excepción en `docs/DEVIATIONS.md` (`crew:exempt`, `crew:standard`, `crew:policy`, `crew:security`, con `owner:` y `expires:`) | [enforcement.md § Bloques](enforcement.md#bloques-de-docsdeviationsmd) |
| Planificar y estimar trabajo (skill `planning`, estándar efectivo) | [using-crew.md § Planificar](using-crew.md#planificar-y-estimar-trabajo) |
| Escanear la configuración del agente en busca de riesgos de seguridad | [using-crew.md § Seguridad](using-crew.md#disparadores-de-seguridad-y-frontera-de-instrucciones) |
| Medir la entrega y el uso del catálogo | [metrics.md](metrics.md) |
| Saber cómo se hace un cambio de código: defecto, funcionalidad, refactor, migración | [using-crew.md § Cómo se hacen los cambios](using-crew.md#cómo-se-hacen-los-cambios-de-código) |
| Ejecutar un plan completo, en paralelo donde es seguro (`COORD: ejecutá`) | [using-crew.md § Ejecutar un plan](using-crew.md#ejecutar-un-plan) |
| Medir si crew mejora la entrega (con y sin crew, tests de aceptación ocultos) | [evals/delivery](../../evals/delivery/README.md) |
| Aprender de las fallas repetidas y decidir un cambio con un veredicto A/B | [metrics.md § Aprendizaje verificado](metrics.md#aprendizaje-verificado) |
| Mantener la puerta pre-commit con Lefthook, husky o `core.hooksPath` | [enforcement.md § Troubleshooting en runtime](enforcement.md#troubleshooting-en-runtime) |
| Trabajar en un proyecto cuyas tareas y tiempo viven en factory | [factory.md](factory.md) |
| Trabajar solo, con la ceremonia mínima | [solo-quickstart.md](solo-quickstart.md) |
| Usar crew sin ser desarrollador (CEO, analista) | [non-technical-roles.md](non-technical-roles.md) |
| Entender el proceso de entrega de punta a punta | [circuito de entrega](../../templates/docs/guides/delivery-circuit.es.md) |
| Configurar un proyecto después de pasar a la 1.0 | [upgrade-1.0.md](upgrade-1.0.md) — empezá acá si ya usabas crew |
| Comparar crew con ECC | [comparison-ecc.md](comparison-ecc.md) |
| Pasar un proyecto a una versión nueva | Guías de migración: [0.21](migration-0.21.md) · [0.22](migration-0.22.md) · [0.23](migration-0.23.md) · [0.24](migration-0.24.md) · [0.26](migration-0.26.md) · [0.27](migration-0.27.md) · [0.28](migration-0.28.md) · [0.29](migration-0.29.md) · [0.30](migration-0.30.md) · [0.31](migration-0.31.md) |
| Ver qué cubre cada host (Claude Code y Codex) y sus límites | [compatibility.md](compatibility.md) |
| Añadir un rol o modificar el plugin | [contributing.md](contributing.md) |

## Qué incluye

- **Roles** (`agents/`, `commands/`): 17 roles, cada uno con su comando `/crew:<alias>`. Los alias retirados todavía responden y derivan a su sucesor.
- **Skills** (`skills/`): 35 entradas de alias generadas a partir de los comandos, que comparten Claude y Codex, y cuatro oficios que cualquier rol carga: `planning` (planes y estimaciones como work items en el estándar del proyecto), `execution` (un procedimiento por tipo de cambio, escalado a su riesgo y cerrado con evidencia), `writing` (cómo comunica una pieza) y `design` (composición, entrega, revisión de implementación y juicio de renders). Los oficios llevan solo método; el gusto de cada producto y el conocimiento de su stack los declara su proyecto.
- **Hooks** (`hooks/`): `SessionStart` carga el baseline de sesión, el estado de configuración y el trabajo en curso. Los guards de `PreToolUse` protegen los artefactos inmutables, las tablas de estimación y verificación, los timestamps, los techos de tamaño, la forma de los work items, la evasión de hooks y la relajación de políticas. `Stop` revisa el registro de trabajo. En modo factory, `capture-activity` registra intervalos de tiempo de trabajo (solo marcas de tiempo) y los envía a factory. Detalle: [enforcement.md](enforcement.md).
- **Puerta pre-commit**: la instala el scaffold y exige los mismos techos de tamaño al commitear. Cuando un gestor de hooks (Lefthook, husky, `core.hooksPath`) es dueño del hook, el scaffold imprime el job a agregar en su configuración y no instala nada ([enforcement.md](enforcement.md#troubleshooting-en-runtime)). Las exenciones se pre-registran en el bloque `crew:exempt` de `docs/DEVIATIONS.md`.
- **Plantillas** (`templates/`): `AGENTS.md` (contexto canónico de agentes), un puntero `CLAUDE.md`, `standards/` y la taxonomía de `docs/` (stories, requirements, decisions, briefs, proposals, as-is, guides, work, DEVIATIONS). La memoria de diseño (`docs/design/`) y la estrategia de testing (`docs/guides/testing.md`) se instalan vacías: las completa el proyecto.
- **Configuración por repo** (`crew.json`): modo, métricas, calidad, techos y capacidades. Nada se concede por defecto, y un repo sin `crew.json` conserva el comportamiento anterior. Referencia: [configuration.md](configuration.md).
- **Baseline de sesión** (`standards/session-context.md`): reglas de conducta siempre activas. El conocimiento de proceso queda en los `standards/` y `docs/guides/` del proyecto, y las reglas propias del proyecto siempre ganan.
- **Scripts** (`scripts/`): scaffold (`init-project.js`, con el envoltorio `init-project.sh`), doctor, verificación con recibos (`verify.js`), estándar efectivo (`conformance.js`), métricas y aprendizaje verificado (`metrics.js`, `learning.js`), ejecución de planes (`plan-graph.js`), evaluación de entrega (`eval-delivery.js`), escaneo de seguridad, login de factory (`factory-login.js`) y generación de releases.
- **Evaluaciones** (`evals/`): sets de corrida humana que juzgan cómo razonan los roles, y `evals/delivery/`, que corre tareas reales con y sin crew y las puntúa con tests de aceptación ocultos ([README](../../evals/delivery/README.md)).
- **Modo factory** (bloque `factory` de `crew.json`): las tareas y el tiempo del proyecto viven en factory. crew le envía el tiempo humano y de agente capturado en esta máquina, y `/crew:metrics` lee el backlog de factory. Detalle: [factory.md](factory.md).
- **Dos hosts**: manifiestos `.claude-plugin/` y `.codex-plugin/`, un adaptador de `apply_patch` para Codex que usa los mismos guards, y archivos de release generados por `scripts/build-release.py`. Las escrituras por shell o MCP quedan fuera de los guards de archivo. Detalle: [compatibility.md](compatibility.md).

## Licencia

MIT.
