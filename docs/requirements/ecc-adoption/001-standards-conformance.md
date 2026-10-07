# 001 — Conformidad garantizada con el estándar efectivo de cada proyecto

- **Status:** Draft
- **Plan:** ecc-adoption ([README](README.md))
- **Date:** 2026-10-07
- **Author role:** CREW
- **Branch:** —
- **Depends on:** None

## Context

El 2026-10-07 se pidió un plan estimado con link. El agente lo entregó como un Claude Doc creado por un conector MCP, fuera del repo, con estos desvíos del estándar de requirements (`templates/docs/requirements/README.md`):

- tablas de estimación de dos columnas (Hito | Est. horas);
- sin encabezado de requirement;
- sin tabla de Verification;
- una línea extra de revisión fuera de la tabla.

Hay cuatro causas:

1. El baseline dice que el circuito de entrega se lee a demanda, pero nada dispara esa lectura. Las skills `design` y `writing` tienen disparadores en su descripción; la planificación no.
2. El orquestador le dictó un formato a un subagente de rol, y el rol lo aceptó en lugar de aplicar su plantilla.
3. `guard-estimation` mira solo escrituras Edit/Write bajo `docs/stories` y `docs/requirements`, y valida la forma de la tabla únicamente al pasar a Closed. Las escrituras por MCP o conector y la salida al chat no pasan por ningún hook.
4. El flujo de artifacts del harness ("dame el link") se impuso sobre el flujo de entrega del proyecto.

La restricción de diseño no cambia: las reglas del proyecto ganan. Esas reglas son `AGENTS.md`, `standards/`, las plantillas propias bajo `docs/`, `crew.json` y `docs/DEVIATIONS.md`. El baseline de crew es el valor por defecto donde el proyecto no dice nada. Los guards fallan abiertos.

## Goal

1. Un **resolver de conformidad** devuelve el estándar efectivo de cada tipo de artefacto (requirement, story, README de plan, brief, ADR) junto con su procedencia. El orden de precedencia es:
    - la plantilla o regla del proyecto;
    - el baseline de crew;
    - las desviaciones declaradas, que se respetan siempre.

    Un proyecto declara una desviación con un bloque `crew:standard` en `docs/DEVIATIONS.md`, con la misma forma que `crew:exempt`. Cada línea indica tipo de artefacto, campo o sección, valor alternativo u `omit`, y una justificación.
2. Una **skill de planificación** se carga sola ante pedidos de plan, estimación u horas, en español ("plan estimado", "estimá", "cuántas horas", "planificá") y en inglés ("estimate", "plan", "hours", "roadmap with hours").
    - Resuelve el estándar efectivo antes de redactar.
    - Aplica la regla repo-first: el plan existe primero como archivos del repo. Cualquier Doc, artifact o resumen en el chat es una vista que enlaza a esos archivos.
    - Si el proyecto no tiene circuito de entrega, o está en modo solo sin `docs/requirements/`, la skill lo dice y pregunta dónde va el plan antes de crear estructura.
3. La **validación de forma ocurre al escribir**, en cada Edit/Write sobre un work item, además de al cerrar. Valida contra el estándar efectivo los campos del encabezado, las seis columnas de Estimation con su fila Total y la tabla de Verification. Con `quality: advise` la escritura pasa con aviso; con `enforce` se bloquea. El cierre conserva su gate actual.
4. **Regla del lado del rol:** si el prompt de un orquestador dicta un formato que contradice el estándar efectivo, el rol aplica el estándar y reporta la desviación pedida al final de su entrega. Un pedido explícito del usuario humano se registra como desviación propuesta y la decide el dueño del proyecto.
5. **Superficies sin archivo:** un aviso `PreToolUse` sobre escrituras MCP de docs y artifacts se dispara cuando el contenido parece un work item (tablas de horas, encabezados de plan). Solo avisa, nunca bloquea, y falla abierto ante payloads que no reconoce, porque cada conector manda el contenido en una forma distinta. El sello de evidencia agrega una línea con el estándar aplicado: del proyecto, baseline de crew o desviación declarada.
6. Los **evals** reproducen este incidente y verifican que el comportamiento corregido se mantiene.
7. **Codex** recibe el mismo resolver, la misma skill y la misma regla de rol; `apply_patch` queda cubierto por el adaptador. Las escrituras MCP en Codex quedan documentadas como no cubiertas mientras el host no exponga el hook.

## Areas to investigate

- Cómo se detecta la plantilla propia del proyecto (un README con plantilla en `docs/requirements/`, un archivo en `standards/`, una referencia en `AGENTS.md`); orden de lectura determinista y qué pasa si dos fuentes se contradicen.
- Gramática del bloque `crew:standard` y si comparte parser con `hooks/lib/ceilings.js` sin acoplar responsabilidades.
- Si la descripción de la skill alcanza para dispararla frente a la instrucción del harness de crear un Doc primero, o si hace falta una línea en `standards/session-context.md`.
- Qué campos de `tool_input` traen el contenido en el conector de Docs, en `Artifact` y en conectores de terceros; ese inventario fija el alcance real del aviso.
- Si en modo solo sin `metrics` la validación de forma calla o solo avisa.
- Qué eventos de hook ofrece Codex para herramientas MCP.

## Expected deliverable

- Módulo resolver en `hooks/lib/`, compartido por guards y skill.
- Bloque `crew:standard` documentado en `templates/docs/DEVIATIONS.md`.
- Skill `planning` con disparadores es/en, regla repo-first y resolución previa del estándar.
- Validación de forma al escribir en `guard-estimation` o en un guard hermano.
- Hook de aviso sobre MCP y Artifact registrado en `hooks.json`.
- Regla canónica de "estándar sobre dictado del orquestador" en `agents/*.md` y línea de estándar aplicado en el sello de `standards/session-context.md`.
- `evals/planning/` con fixtures y rúbrica del incidente.
- `integrations/codex/README.md`, `compatibility.md`, `enforcement.md`, `configuration.md` y `solo-quickstart.md` en EN y ES.
- Versión, changelog y entrada `required: false` en `migrations.json`.

## Estimation

| Milestone | Est. hours | Started | Finished | Actual hours | Notes |
|-----------|-----------|---------|----------|--------------|-------|
| Resolver de conformidad y bloque `crew:standard` | 4 | | | | Incluye precedencia y conflictos |
| Skill `planning` con disparadores es/en y repo-first | 3 | | | | (BC) que se dispare frente al flujo de Docs del harness |
| Validación de forma al escribir | 5 | | | | Sin romper el gate de cierre |
| Regla de rol en `agents/*.md` y línea en el sello | 2 | | | | |
| Aviso PreToolUse sobre MCP y Artifact | 3 | | | | (BC) payloads distintos por conector |
| Evals del incidente | 3 | | | | Corrida con y sin skill |
| Paridad Codex | 2 | | | | (BC) Codex podría no exponer hooks MCP |
| Tests | 4 | | | | |
| Docs EN y ES | 3 | | | | |
| Release | 1 | | | | |
| Revisión del maintainer | 3 | | | | |
| **Total** | **33** | — | — | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| El resolver prefiere la plantilla del proyecto, cae al baseline y respeta `crew:standard` | unit | node:test | tests/conformance-resolver.test.js | planned |
| Un requirement con estimación de 2 columnas y sin Verification avisa en `advise` y se bloquea en `enforce` | integration | node:test | tests/guard-shape.test.js | planned |
| Una desviación declarada (Verification `omit`) no genera aviso | integration | node:test | tests/guard-shape.test.js | planned |
| Un payload MCP con tabla de horas produce el aviso; uno no reconocido pasa en silencio | integration | node:test | tests/mcp-nudge.test.js | planned |
| "Plan estimado con link": la skill se carga, crea archivos en el repo y el Doc enlaza a ellos | manual | evals | evals/planning/fixtures.md | planned |
| El orquestador dicta "Hito \| Est. horas": el rol aplica las 6 columnas y reporta la desviación | manual | evals | evals/planning/fixtures.md | planned |
| En modo solo la skill no impone ceremonia de entrega | manual | evals | evals/planning/fixtures.md | planned |
| En Codex, `apply_patch` sobre un work item recibe la misma validación | contract | node:test | tests/compatibility.test.js | planned |

## Changes

- (Solo si el objetivo cambia después de In progress.)
