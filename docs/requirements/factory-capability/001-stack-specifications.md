# 001 — Especificaciones de stack declaradas por el proyecto

- **Status:** Delivered
- **Plan:** factory-capability ([README](README.md))
- **Date:** 2026-10-13
- **Author role:** CREW
- **Branch:** main (the plugin ships from main; no feature branch)
- **Depends on:** —

## Context

Los roles técnicos de crew hablan en un vocabulario que sobrevive a un cambio de stack: categorías de estado, límites de capa, contratos. Lo específico de cada stack (convenciones, herramientas, diagnósticos) hoy no tiene lugar declarado. Un rol que implementa en React o en el framework de un cliente improvisa esas convenciones o las toma de lo que es popular.

La evaluación externa propuso que crew traiga packs por stack. El maintainer decidió lo contrario para el plugin: las especificaciones de stack son del proyecto y crew las consume. Es el mismo patrón que la memoria de diseño, donde el plugin trae el método y el proyecto declara qué considera bueno.

## Goal

- El principio queda escrito donde lo leen todos los roles: el baseline de sesión.
- `crew.json` acepta una sección `stack` donde el proyecto declara sus especificaciones por área, como skill a cargar o documento a leer.
- Antes de decidir o implementar en un área, el rol carga lo declarado para ella. Si no hay nada declarado, lo dice en el sello de evidencia.
- `/crew:setup` pregunta por esas especificaciones sin proponer ninguna; `/crew:doctor` detecta una declaración rota; el inicio de sesión nombra una declaración que no reconoce.

## Areas to investigate

- Si los comandos de verificación del stack van en `stack` o siguen en `testing.commands` y `design.checks`.
- Cómo se nombra el área: etiqueta libre o lista cerrada.

## Expected deliverable

- Lector `hooks/lib/stack.js` transportado por `config.js`.
- Principio en `standards/session-context.md` y en el rol CREW.
- Bloque nuevo en `standards/configuration-interview.md`.
- Aviso de inicio de sesión y chequeo de doctor.
- Docs EN y ES (`configuration.md`), tests y changelog.

## Estimation

| Milestone | Est. hours | Started | Finished | Actual hours | Notes |
|-----------|-----------|---------|----------|--------------|-------|
| Lector y transporte en config | 2 | 2026-10-13 12:20 -03:00 | 2026-10-13 12:20 -03:00 | 0.01 | Lector propio en hooks/lib/stack.js (config.js está al límite de tamaño); también sumé el aviso de sesión y el chequeo de doctor |
| Principio en baseline y CREW | 1 | 2026-10-13 12:20 -03:00 | 2026-10-13 12:22 -03:00 | 0.03 | Un solo bloque en el baseline cubre a todos los roles; CREW suma la regla operativa |
| Entrevista de setup | 1 | 2026-10-13 12:22 -03:00 | 2026-10-13 12:23 -03:00 | 0.02 | Bloque 10 nuevo; factory y auditoría pasan a 11 y 12 |
| Aviso de sesión y doctor | 1 | 2026-10-13 12:20 -03:00 | 2026-10-13 12:20 -03:00 | 0 | Hecho junto con el lector |
| Tests | 2 | 2026-10-13 12:24 -03:00 | 2026-10-13 12:25 -03:00 | 0.02 | tests/stack.test.js, 5 casos |
| Docs EN y ES y changelog | 2 | 2026-10-13 12:23 -03:00 | 2026-10-13 12:25 -03:00 | 0.03 | configuration.md y README en ambos idiomas; entrada Unreleased sin bump de versión |
| Revisión del maintainer | 1 | | | | |
| **Total** | **10** | — | — | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| Un `stack` válido se transporta con área, tipo y referencia | unit | node:test | tests/stack.test.js | passing |
| Un tipo desconocido o una referencia faltante se descarta y queda nombrado | unit | node:test | tests/stack.test.js | passing |
| El inicio de sesión nombra la declaración inutilizable | integration | node:test | tests/stack.test.js | passing |
| Doctor marca un documento declarado que no existe | integration | node:test | tests/stack.test.js | passing |

## Changes

- (Solo si el objetivo cambia después de In progress.)
