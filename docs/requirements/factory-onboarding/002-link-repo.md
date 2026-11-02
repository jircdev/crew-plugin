# 002 — Vincular un repo a su proyecto de factory

- **Status:** Delivered
- **Plan:** factory-onboarding ([README](README.md))
- **Date:** 2026-11-02
- **Author role:** SYS, con SEC en datos mostrados
- **Branch:** main (the plugin ships from main; no feature branch)
- **Depends on:** —

## Context

La captura solo corre en repos cuyo `crew.json` declara `factory.projectId`, y hoy la persona tiene que encontrar ese id a mano. El repo de factory nunca lo tuvo, así que nunca se capturó.

## Goal

- `/crew:factory link` sin argumentos consulta a factory, con el token de la máquina, los proyectos en los que participa la persona, y los muestra con nombre e id. Usa la herramienta `whoami` del MCP de factory en una sola llamada.
- `/crew:factory link <id>` escribe `factory.projectId` en el `crew.json` del repo, conservando las demás claves y el formato, sin BOM. El agente pide confirmación antes, porque `crew.json` es compartido por el equipo.
- Se elige por id. Un número de lista puede cambiar entre dos corridas; el agente traduce "el segundo" al id.
- Escribe `environment` solo cuando falta y el entorno vino de `crew.json` o del valor por defecto. Si vino de una variable de la máquina (`CREW_FACTORY_ENV`, `CREW_FACTORY_URL`), avisa y no toca el archivo.
- Sin `crew.json`, se niega y remite a `/crew:setup`. Si el repo ya está vinculado a otro proyecto, pide `--replace`.
- `/crew:factory status` informa el token y también el vínculo del repo actual: el nombre del proyecto, o que no está vinculado.
- La salida muestra solo el nombre de la persona y los nombres e ids de sus proyectos. Nunca el token, el email, otras personas, permisos ni montos. Un perfil sin acceso a la herramienta recibe un mensaje claro.

## Areas to investigate

- Si el MCP sin estado de factory responde a `tools/call` sin un `initialize` previo; se prueba contra dev.
- La escritura de `crew.json` va en un módulo aparte de `hooks/lib/config.js`, que sigue siendo el único intérprete del archivo.

## Expected deliverable

- `scripts/factory-link.js` y la acción `link` en `commands/factory.md`.
- Escritor del bloque `factory` en `hooks/lib/config-write.js`, junto a `config.js`, que sigue siendo el único intérprete.
- `status` con el vínculo del repo.
- Paridad Codex (`node scripts/sync-codex.js`), tests y documentación.

## Estimation

| Milestone | Est. hours | Est. AI hours | Started | Finished | Actual hours | Actual AI hours | Notes |
|-----------|-----------|---------------|---------|----------|--------------|-----------------|-------|
| Consulta de proyectos al MCP de factory | 2 | 0.25 | — | 2026-11-02 14:20 -03:00 | — | — | whoami por hooks/lib/factory-mcp.js, compartido con metrics. Inicio no registrado en el momento |
| Escritor del bloque factory en crew.json | 1.5 | 0.25 | — | 2026-11-02 14:20 -03:00 | — | — | hooks/lib/config-write.js. Inicio no registrado en el momento |
| Comando link y su texto | 1 | 0.25 | — | 2026-11-02 14:33 -03:00 | — | — | scripts/factory-link.js y commands/factory.md. Inicio no registrado en el momento |
| Vínculo del repo en status | 0.5 | 0.25 | — | 2026-11-02 14:20 -03:00 | — | — | scripts/lib/factory-account.js. Inicio no registrado en el momento |
| Tests | 1.5 | 0.25 | — | 2026-11-02 14:20 -03:00 | — | — | tests/factory-link.test.js, 6 casos. Inicio no registrado en el momento |
| Docs EN y ES y paridad Codex | 1 | 0.25 | — | 2026-11-02 14:33 -03:00 | — | — | sync-codex regeneró skills/factory. Inicio no registrado en el momento |
| Revisión de Julio | 0.5 | 0 | | | | | |
| **Total** | **8** | **1.5** | — | — | | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| link lista los proyectos de la persona sin datos de otros | integration | node:test, factory simulado | tests/factory-link.test.js | passing |
| link con id escribe projectId y conserva las demás claves | integration | node:test | tests/factory-link.test.js | passing |
| link sin crew.json se niega y remite a setup | integration | node:test | tests/factory-link.test.js | passing |
| link sobre un repo vinculado a otro proyecto exige --replace | integration | node:test | tests/factory-link.test.js | passing |
| Un entorno elegido por variable de máquina no se escribe en crew.json | integration | node:test | tests/factory-link.test.js | passing |
| status informa el proyecto vinculado o que falta | integration | node:test | tests/factory-link.test.js | passing |
| La consulta funciona contra el MCP real de dev | e2e | manual | — | not verified — necesita un token de dev en esta máquina |

## Changes
