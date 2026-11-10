# 004 — Recuperar tiempo desde las transcripciones

- **Status:** Delivered
- **Plan:** factory-onboarding ([README](README.md))
- **Date:** 2026-11-02
- **Author role:** SYS, con SEC en consentimiento y datos que salen de la máquina
- **Branch:** main (the plugin ships from main; no feature branch)
- **Depends on:** [001](001-expiry-keeps-time.md), [002](002-link-repo.md), y los cambios en factory del [README](README.md#cambios-en-factory-fuera-de-este-repo)

## Context

Cuando la captura falla, el tiempo trabajado queda igual registrado en las transcripciones locales de Claude Code: cada registro tiene su hora. Con eso se pueden reconstruir los mismos intervalos que habría armado la captura en vivo.

## Goal

- `/crew:factory backfill` reconstruye los intervalos de un repo vinculado desde `~/.claude/projects/*/*.jsonl` (o `$CLAUDE_CONFIG_DIR`). Toma los registros cuyo directorio de trabajo pertenece a este repo, sin depender del nombre de la carpeta, que pierde caracteres y separa los worktrees.
- Arma los mismos eventos que ve la captura en vivo (inicio, prompt de la persona, fin de la respuesta, fin de sesión) y los pasa por las mismas reglas de `hooks/lib/activity-rules.js`.
- Un prompt de la persona es un registro de usuario que no es de un subagente, ni meta, ni un resumen de compactación, ni un resultado de herramienta, ni un comando local. Las sesiones iniciadas por otra sesión o por un prompt encolado no cuentan como tiempo de la persona.
- La actividad sale de las rutas de los archivos editados, igual que en vivo.
- Los ids de los intervalos se derivan de la sesión, el tipo y el tramo, así que repetir la reconstrucción no duplica nada.
- Solo cubre tiempo posterior a la fecha de conexión de la persona y dentro de los 45 días de retención. Solo lee las transcripciones del usuario del sistema actual.
- Por defecto es una vista previa: horas y cantidad de intervalos por día. Envía solo con `--send`, y el agente lo agrega únicamente cuando la persona dice que sí en el chat.
- Fuera de la máquina sale lo mismo que en vivo. El contenido de los mensajes, los directorios y los resultados de herramientas nunca se envían, ni se escriben en disco o en el log, ni aparecen en el chat.

## Areas to investigate

- El envío depende de que factory deje de contar dos veces el tiempo del agente cuando un tramo llega en vivo y reconstruido. Hasta entonces, `--send` queda desactivado con un mensaje que lo explica.
- Cómo se comporta la reconstrucción con sesiones retomadas, que copian registros de la sesión anterior: se deduplica por el id de cada registro.

## Expected deliverable

- `scripts/factory-backfill.js` y la acción `backfill` en `commands/factory.md`.
- Ids derivados en `hooks/lib/activity-rules.js`, sin cambio para la captura en vivo.
- Tests con transcripciones de ejemplo y documentación.

## Estimation

| Milestone | Est. hours | Est. AI hours | Started | Finished | Actual hours | Actual AI hours | Notes |
|-----------|-----------|---------------|---------|----------|--------------|-----------------|-------|
| Lectura de transcripciones del repo | 2.5 | 0.5 | — | 2026-11-02 14:29 -03:00 | — | — | scripts/lib/transcripts.js; probado en seco sobre las transcripciones reales del repo de factory. Inicio no registrado en el momento |
| Clasificación de prompts y fin de respuesta | 2.5 | 0.5 | — | 2026-11-02 14:29 -03:00 | — | — | Corte en silencios de más de 15 minutos dentro de una respuesta, hallado en la prueba real. Inicio no registrado en el momento |
| Eventos por las reglas de intervalos, con ids derivados | 2 | 0.25 | — | 2026-11-02 14:29 -03:00 | — | — | ctx.newId(kind, from, to) en activity-rules. Inicio no registrado en el momento |
| Actividad desde las rutas editadas | 1 | 0.25 | — | 2026-11-02 14:29 -03:00 | — | — | taskHintFor sobre file_path de Edit, Write, MultiEdit y NotebookEdit. Inicio no registrado en el momento |
| Vista previa y envío con confirmación | 1.5 | 0.25 | — | 2026-11-02 14:29 -03:00 | — | — | Envío cerrado en esta versión (SEND_READY); la función de envío tiene test. Inicio no registrado en el momento |
| Tests con transcripciones de ejemplo | 2.5 | 0.5 | — | 2026-11-02 14:29 -03:00 | — | — | tests/factory-backfill.test.js, 8 casos. Inicio no registrado en el momento |
| Docs EN y ES | 1 | 0.25 | — | 2026-11-02 14:33 -03:00 | — | — | Sección "Recovering lost time" / "Recuperar tiempo perdido". Inicio no registrado en el momento |
| Revisión de Julio | 1 | 0 | | | | | |
| **Total** | **14** | **2.5** | — | — | | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| Una transcripción de ejemplo produce los intervalos que daría la captura en vivo | integration | node:test | tests/factory-backfill.test.js | passing |
| Resultados de herramientas, metas y subagentes no cuentan como prompts | unit | node:test | tests/factory-backfill.test.js | passing |
| Registros de otro repo y anteriores a la conexión quedan fuera | integration | node:test | tests/factory-backfill.test.js | passing |
| Dos corridas producen los mismos ids | unit | node:test | tests/factory-backfill.test.js | passing |
| La vista previa no envía nada ni muestra contenido de mensajes | integration | node:test | tests/factory-backfill.test.js | passing |
| La captura en vivo sigue usando ids aleatorios | unit | node:test | tests/capture-activity.test.js | passing |

## Changes

- 2026-11-10 — El envío se abre. Factory une los tramos de agente de una misma sesión que se superponen, así que el tiempo que llega en vivo y reconstruido cuenta una vez; `SEND_READY` desaparece y `--send` envía tras el sí de la persona. Por decisión de Julio, el backfill queda como herramienta a pedido para recuperar el tiempo anterior a vincular un repositorio; la corrección de días ya capturados la hace factory. La reconstrucción suma la actividad de los subagentes (`<sesión>/subagents/*.jsonl`) y la cantidad de palabras de la última respuesta de cada turno. La sección de la guía pasa a llamarse "Recovering the time before a repository was linked" / "Recuperar el tiempo anterior a vincular un repositorio". Tests: `tests/factory-backfill.test.js`, `tests/capture-turn-stretches.test.js`.
