# 003 — Defensa de instrucciones y disparadores de seguridad

- **Status:** Delivered
- **Plan:** ecc-adoption ([README](README.md))
- **Date:** 2026-10-07
- **Author role:** SEC
- **Branch:** main (the plugin ships from main; no feature branch)
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
| Bloque canónico y reconciliación de los 17 roles | 3 | 2026-10-07 22:23 -03:00 | 2026-10-07 22:23 -03:00 | 0.01 | Ningún rol traía texto anti-inyección propio: no hubo nada que reconciliar |
| Lista de disparadores en baseline y SEC | 2 | 2026-10-07 22:23 -03:00 | 2026-10-07 22:23 -03:00 | 0.01 | |
| Regla del sello de evidencia | 1 | 2026-10-07 22:23 -03:00 | 2026-10-07 22:23 -03:00 | 0 | Escrita en el mismo párrafo de los disparadores; tiempo contado en el hito anterior |
| Regeneración Codex | 1 | 2026-10-07 22:23 -03:00 | 2026-10-07 22:23 -03:00 | 0.01 | Ninguna salida generada cambia: Codex recibe el baseline por SessionStart; sync --check en verde |
| Fixtures de eval | 3 | 2026-10-07 22:23 -03:00 | 2026-10-07 22:24 -03:00 | 0.02 | evals/security con 6 fixtures; corrida humana pendiente |
| Tests | 1.5 | 2026-10-07 22:24 -03:00 | 2026-10-07 22:24 -03:00 | 0.01 | tests/baseline.test.js |
| Docs EN y ES | 2 | 2026-10-07 22:24 -03:00 | 2026-10-07 22:24 -03:00 | 0.01 | using-crew EN y ES; contributing |
| Release | 1 | 2026-10-07 22:30 -03:00 | 2026-10-07 22:31 -03:00 | 0.01 | Release conjunta 0.27.0 local (003, 004, 005); push pendiente de autorización |
| Revisión del maintainer | 2.5 | | | | |
| **Total** | **17** | — | — | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| El baseline inyectado contiene el bloque y no supera el tope de tamaño | unit | node:test | tests/baseline.test.js | passing |
| La lista de disparadores es idéntica en el baseline y en el rol SEC | unit | node:test | tests/baseline.test.js | passing |
| Un archivo leído con una instrucción embebida se reporta y no se ejecuta | manual | evals | evals/security/fixtures.md (S1, S2) | not verified — requiere corrida humana |
| Un diff que toca autenticación produce un sello que menciona a SEC | manual | evals | evals/security/fixtures.md (S4, S5) | not verified — requiere corrida humana |
| Codex recibe el mismo baseline | integration | node:test | tests/compatibility.test.js | passing |

## Changes

- (Solo si el objetivo cambia después de In progress.)
