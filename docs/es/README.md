# crew

[![version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fjircdev%2Fcrew-plugin%2Fmain%2F.claude-plugin%2Fplugin.json&query=%24.version&label=version&prefix=v&color=blue)](../../.claude-plugin/plugin.json)

> 🌐 Léelo en **español** (abajo) · Prefer English? → **[Read it in English](../../README.md)**

Los agentes de código son generalistas. Apunta uno a tu repo y salta directo a escribir código: nadie es dueño de la decisión, el porqué de la arquitectura se evapora entre sesiones, y cada chat nuevo vuelve a litigar lo que ya habías cerrado. La parte difícil dejó de ser *escribir el código*; pasó a ser *mantener un proceso lo bastante sano como para sobrevivir de una sesión a la siguiente*.

crew es ese proceso, empaquetado como plugin. Convierte a un único agente generalista en una crew estructurada: un catálogo de roles especializados donde exactamente uno es dueño de cada decisión, un flujo spec-driven (guiado por especificaciones) de la idea a producción, y convenciones que viven en el repo —leídas de forma nativa por Claude Code, Cursor, Copilot y Codex— de modo que cada decisión se escribe una vez y se consume muchas, en lugar de re-explicarse. Es agnóstico del stack y crece más allá de los roles: futuras versiones pueden sumar consultas vía MCP, ayudantes de memoria de proyecto y otros especialistas a demanda.

## Cómo fluye el trabajo

La crew sigue un circuito spec-driven alineado con Scrum: un artefacto por etapa, leído del repo, nunca re-pegado en un prompt. Estándar completo: [circuito de entrega](../../templates/docs/guides/delivery-circuit.es.md).

Cada etapa la dotan roles específicos — la tabla etapa por etapa y el catálogo completo, organizado por área con lo que posee cada rol, están en [roles.md](roles.md).

## Documentación

| Si quieres… | Lee |
|-------------|-----|
| Conocer los roles y qué posee cada uno | [roles.md](roles.md) |
| Instalar, actualizar o desinstalar el plugin | [installation.md](installation.md) |
| Invocar roles, hacer bootstrap de un proyecto, onboarding de uno existente, personalizar los docs instalados | [using-crew.md](using-crew.md) |
| Configurar crew por repo — referencia de `crew.json` (modos, métricas, calidad, techos, capacidades de diseño) | [configuration.md](configuration.md) |
| Entender qué exige cada guard y resolver un deny | [enforcement.md](enforcement.md) |
| Medir la entrega — el flujo estimación → métricas | [metrics.md](metrics.md) |
| Adoptar capacidades de diseño y memoria de diseño | [migration-0.22.md](migration-0.22.md) |
| Migrar un proyecto existente desde los aliases retirados | [migration-0.21.md](migration-0.21.md) |
| Trabajar en solitario con la ceremonia mínima | [solo-quickstart.md](solo-quickstart.md) |
| Usar crew desde un asiento no técnico (CEO, analista) | [non-technical-roles.md](non-technical-roles.md) |
| Entender el proceso de entrega de punta a punta | [circuito de entrega](../../templates/docs/guides/delivery-circuit.es.md) |
| Añadir un rol o modificar el plugin | [contributing.md](contributing.md) |

## Qué incluye

- **Subagentes + slash commands** (`agents/`, `commands/`) — uno por rol; `/crew:<alias>` lanza el subagente correspondiente, y los aliases retirados responden con su sucesor durante una versión.
- **Plantillas** (`templates/`) — `AGENTS.md` (contexto canónico de agentes), un puntero `CLAUDE.md`, `standards/` (el núcleo de calidad de código), y la taxonomía completa de `docs/` (stories, requirements, decisions, proposals, el circuito de entrega, historial de work, DEVIATIONS).
- **Skills** (`skills/`) — oficios horizontales que cualquier rol carga: `writing` (cómo comunica una pieza) y `design` (cómo pasar de un problema a una composición, entregarla, revisarla y juzgar un render). Solo método — qué es bello en un producto lo declara ese proyecto.
- **Hooks** (`hooks/`) — `SessionStart` inyecta el baseline de sesión y, solo cuando tiene algo accionable que decir, el estado de configuración del proyecto; `PreToolUse` protege los artefactos inmutables, la puerta de estimación, los timestamps de estimación en tiempo real y los techos de calidad de código; `Stop` verifica la trazabilidad del cierre; una puerta de calidad pre-commit (instalada por `init-project.sh`) exige los mismos techos al commitear, con exenciones pre-registradas vía un bloque `crew:exempt` en `docs/DEVIATIONS.md`.
- **Configuración por repo** (`crew.json`) — `mode: solo|team`, `metrics`, `quality: advise|enforce|off`, `ceilings`, más las capacidades `design` (dónde corre la app, registro de componentes, captura de renders, checks, gusto de respaldo), las capacidades `testing` (guía de estrategia, arnés e2e y dónde viven sus specs, comandos de suite) y la marca `configuredWith`. Nada se concede por defecto: una capacidad sin declarar es una que los roles reportan que no pudieron usar. Un repo sin `crew.json` se comporta exactamente igual que antes. Referencia: [configuration.md](configuration.md).
- **Memoria de diseño** (`docs/design/` en tu proyecto) — referencias, patrones aprobados, patrones rechazados. Se instala vacía: el gusto es del proyecto, nunca del plugin. Se declara vía `design.memory`; la configura `/crew:setup`, que pregunta y nunca adivina.
- **Estrategia de testing** (`docs/guides/testing.md` en tu proyecto) — niveles, arnés, barra de adopción, protocolo manual, y qué no se verifica a propósito. Se instala vacía en ambos modos: la herramienta es del proyecto. Todo work item lleva una tabla `## Verification` escrita en planning junto a su estimación — nivel, arnés, artefacto y estado por comportamiento. Declarar `testing` en `crew.json` convierte esa tabla en compuerta de cierre.
- **Métricas** — `/crew:metrics` + el reporte `bin/metrics.js`: lead time, tiempo de ejecución, desviación de estimación, exportación `--csv`.
- **Baseline de sesión** (`standards/session-context.md`) — solo **comportamiento** siempre activo (estilo de conversación, regla de oficina, dos modos, oficio de documentos); el conocimiento de proceso no va inline: apunta a los `standards/` y `docs/guides/` instalados en el proyecto. Defaults sugeridos, las reglas propias del proyecto siempre ganan.
- **Script de bootstrap** (`bin/init-project.sh`) — instala las plantillas en un proyecto nuevo; `--solo` para el camino de desarrollador único.

## Licencia

MIT.
