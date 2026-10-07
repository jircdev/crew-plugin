# 003 — Defensa de instrucciones y disparadores de seguridad

- **Status:** Draft
- **Plan:** ecc-adoption ([README](README.md))
- **Date:** 2026-10-07
- **Author role:** SEC
- **Branch:** —
- **Depends on:** [002](002-catalog-integrity.md)

## Context

Los roles de crew leen archivos, páginas y salidas de herramientas sin una regla común que diga que ese contenido es dato. ECC copia un bloque anti-inyección en cada uno de sus 68 agentes; en crew, 17 copias repetirían el drift que la 0.22 eliminó al centralizar el baseline.

SEC "puede interrumpir a cualquier rol", pero nada dice cuándo. ECC lista disparadores explícitos: autenticación, entrada de usuario, base de datos, rutas de archivo, APIs externas, criptografía y secretos. Con una lista fija, la consulta a SEC se vuelve verificable.

## Goal

- El baseline de sesión contiene un bloque único de defensa contra inyección, de 10 líneas como máximo, heredado por todos los roles.
- La lista de disparadores de seguridad vive en el baseline y en el doc de SEC.
- Cuando un cambio toca un disparador, el sello de evidencia dice si se consultó a SEC.
- Codex recibe el mismo bloque y la misma lista.

## Areas to investigate

- Qué texto anti-inyección ya existe en los 17 roles y cómo se reconcilia con el bloque único.
- Cómo detecta el agente que un diff toca un disparador sin agregar un hook.
- Costo de contexto del baseline después del cambio.

## Expected deliverable

- `standards/session-context.md` con el bloque y la lista.
- `agents/security-compliance.md` con la lista y la regla del sello.
- Skills de Codex regeneradas.
- Fixtures de eval de inyección y de disparadores.
- Docs EN y ES y entrada de changelog.

## Estimation

| Milestone | Est. hours | Started | Finished | Actual hours | Notes |
|-----------|-----------|---------|----------|--------------|-------|
| Bloque canónico y reconciliación de los 17 roles | 3 | | | | |
| Lista de disparadores en baseline y SEC | 2 | | | | |
| Regla del sello de evidencia | 1 | | | | |
| Regeneración Codex | 1 | | | | |
| Fixtures de eval | 3 | | | | |
| Tests | 1.5 | | | | |
| Docs EN y ES | 2 | | | | |
| Release | 1 | | | | |
| Revisión del maintainer | 2.5 | | | | |
| **Total** | **17** | — | — | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| El baseline inyectado contiene el bloque y no supera el tope de líneas | unit | node:test | tests/session-context.test.js | planned |
| Un archivo leído con una instrucción embebida se reporta y no se ejecuta | manual | evals | evals/security/fixtures.md | planned |
| Un diff que toca autenticación produce un sello que menciona a SEC | manual | evals | evals/security/fixtures.md | planned |
| La skill de Codex contiene el mismo bloque | unit | node:test | tests/compatibility.test.js | planned |

## Changes

- (Solo si el objetivo cambia después de In progress.)
