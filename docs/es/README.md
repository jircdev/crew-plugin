# crew

[![version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fjircdev%2Fcrew-plugin%2Fmain%2F.claude-plugin%2Fplugin.json&query=%24.version&label=version&prefix=v&color=blue)](../../.claude-plugin/plugin.json)

> 🌐 Léelo en **español** (abajo) · Prefer English? → **[Read it in English](../../README.md)**

Los agentes de código son generalistas. Apunta uno a tu repo y salta directo a escribir código: nadie es dueño de la decisión, el porqué de la arquitectura se evapora entre sesiones, y cada chat nuevo vuelve a litigar lo que ya habías cerrado. La parte difícil dejó de ser *escribir el código*; pasó a ser *mantener un proceso lo bastante sano como para sobrevivir de una sesión a la siguiente*.

crew es ese proceso, empaquetado como plugin. Convierte a un único agente generalista en una crew estructurada: un catálogo de roles especializados donde exactamente uno es dueño de cada decisión, un flujo spec-driven (guiado por especificaciones) de la idea a producción, y convenciones que viven en el repo —leídas de forma nativa por Claude Code, Cursor, Copilot y Codex— de modo que cada decisión se escribe una vez y se consume muchas, en lugar de re-explicarse. Es agnóstico del stack y crece más allá de los roles: futuras versiones pueden sumar consultas vía MCP, ayudantes de memoria de proyecto y otros especialistas a demanda.

## Cómo fluye el trabajo

La crew sigue un circuito spec-driven alineado con Scrum: un artefacto por etapa, leído del repo, nunca re-pegado en un prompt. Estándar completo: [circuito de entrega](../../templates/docs/guides/delivery-circuit.es.md).

| Etapa | Qué pasa | Artefacto | Roles |
|-------|----------|-----------|-------|
| [**1 · Visión**](roles.md) | El *porqué* y el objetivo; go/no-go del sponsor antes de cualquier trabajo de backlog | `docs/briefs/` | `COM` [commercial-strategist](../../agents/commercial-strategist.md)<br>`PROD` [product-strategist](../../agents/product-strategist.md) |
| [**2 · Backlog y diseño**](roles.md) | Descompone la intención en stories con criterios de aceptación; define qué necesita cada pantalla y cómo se ve | `docs/stories/` | `FA` [functional-analyst](../../agents/functional-analyst.md)<br>`COORD` [delivery-coordinator](../../agents/delivery-coordinator.md)<br>`DEA` [data-experience-architect](../../agents/data-experience-architect.md)<br>`UX` [ux-architect](../../agents/ux-architect.md)<br>`VIS` [visual-identity](../../agents/visual-identity.md)<br>`WEB` [web-strategist](../../agents/web-strategist.md)<br>`COMM` [communications-strategist](../../agents/communications-strategist.md) |
| [**3 · Diseño técnico**](roles.md) | Decisiones de arquitectura just-in-time (no un gran documento por adelantado); el trabajo puramente técnico como carril propio | `decisions/` (ADR) · `spec.md` · `requirements/` | `SYS` [system-architect](../../agents/system-architect.md)<br>`DA` [data-architect](../../agents/data-architect.md)<br>`MOD` [module-extension-architect](../../agents/module-extension-architect.md)<br>`DX` [dx-architect](../../agents/dx-architect.md)<br>`FE` [frontend-architect](../../agents/frontend-architect.md) |
| [**4 · Construir**](roles.md) | Implementa una story/requirement lista; el arquitecto de dominio implementa su propia área | código + PR | (roles de la etapa 3, en modo implementación) |
| [**5 · Entregar y verificar**](roles.md) | Probar, validar contra criterios, asegurar, desplegar, publicar, medir | Validación de la story · `work/` | `QA` [qa-test-architect](../../agents/qa-test-architect.md)<br>`SC` [spec-compliance](../../agents/spec-compliance.md)<br>`SEC` [security-compliance](../../agents/security-compliance.md)<br>`PERF` [performance-reliability](../../agents/performance-reliability.md)<br>`INFRA` [atlas-deploy](../../agents/atlas-deploy.md)<br>`REL` [release-manager](../../agents/release-manager.md)<br>`ANA` [analytics-architect](../../agents/analytics-architect.md) |

El diseño técnico (etapa 3) **no** es un gate obligatorio antes de cada story: las decisiones se toman just-in-time por work item; un spec completo por adelantado solo corresponde a iniciativas puramente técnicas (un `requirement`, en paralelo a las stories), nunca como waterfall. 25 roles dotan este circuito, más los transversales `DOC` [documentation-steward](../../agents/documentation-steward.md), `LEA` [researcher](../../agents/researcher.md), `CA` [crew-architect](../../agents/crew-architect.md) e `INST` [crew-installer](../../agents/crew-installer.md) — el catálogo completo, con lo que posee cada uno, está en [roles.md](roles.md).

## Documentación

| Si quieres… | Lee |
|-------------|-----|
| Conocer los 25 roles y qué posee cada uno | [roles.md](roles.md) |
| Instalar, actualizar o desinstalar el plugin | [installation.md](installation.md) |
| Invocar roles, hacer bootstrap de un proyecto, onboarding de uno existente | [using-crew.md](using-crew.md) |
| Entender el proceso de entrega de punta a punta | [circuito de entrega](../../templates/docs/guides/delivery-circuit.es.md) |
| Añadir un rol o modificar el plugin | [contributing.md](contributing.md) |

## Qué incluye

- **25 subagentes** + **25 slash commands** (`agents/`, `commands/`) — uno por rol; `/crew:<alias>` lanza el subagente correspondiente.
- **Plantillas** (`templates/`) — `AGENTS.md` (contexto canónico de agentes), un puntero `CLAUDE.md`, `standards/` (el núcleo de calidad de código), y la taxonomía completa de `docs/` (stories, requirements, decisions, proposals, el circuito de entrega, historial de work, DEVIATIONS).
- **Hooks** (`hooks/`) — `SessionStart` inyecta el baseline de sesión; `PreToolUse` protege los artefactos inmutables.
- **Baseline de sesión** (`standards/session-context.md`) — contexto siempre activo; defaults sugeridos, las reglas propias del proyecto siempre ganan.
- **Script de bootstrap** (`bin/init-project.sh`) — instala las plantillas en un proyecto nuevo.

## Licencia

MIT.
