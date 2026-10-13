# 002 — Propósito declarado y límite del stack protegido

- **Status:** Delivered
- **Plan:** factory-capability ([README](README.md))
- **Date:** 2026-10-13
- **Author role:** CREW
- **Branch:** main (the plugin ships from main; no feature branch)
- **Depends on:** [001](001-stack-specifications.md)

## Context

El README presenta a crew como un proceso para el agente: un dueño por decisión y convenciones en el repo. La evaluación externa concluyó que el objetivo es más amplio: producir software correcto con menos intervención, menos retrabajo y entregas verificables. Ese objetivo no aparece escrito en ningún documento de entrada.

001 dejó escrito que las especificaciones de stack pertenecen al proyecto. Hoy nada impide que una contribución futura agregue una skill de framework al plugin. El principio depende de que alguien lo recuerde en la revisión.

## Goal

- Los README EN y ES abren con el propósito: crew es una factory que produce software correcto, y la estructura de roles es el medio.
- `roles.md` y `using-crew.md` explican en prosa qué aporta crew y qué aporta cada proyecto.
- Un test del catálogo falla cuando el plugin incorpora conocimiento de stack: una skill que no sea un alias registrado ni un oficio declarado, o identificadores de framework en los oficios y en el baseline.
- CREW registra la lista cerrada de oficios y la regla para sumar uno nuevo: tiene que valer para cualquier stack.

## Areas to investigate

- Cómo detectar conocimiento de stack sin falsos positivos: lista cerrada de skills, lista de identificadores de framework, o ambas.
- Qué menciones de herramientas son legítimas (ejemplos de configuración en `configuration.md`) y cómo quedan exceptuadas.

## Expected deliverable

- Propósito reescrito en ambos README.
- Sección "qué aporta crew y qué aporta tu proyecto" en `using-crew.md` y referencia en `roles.md`, EN y ES.
- Regla en `tests/catalog.test.js` y lista de oficios en el rol CREW.
- Changelog.

## Estimation

| Milestone | Est. hours | Started | Finished | Actual hours | Notes |
|-----------|-----------|---------|----------|--------------|-------|
| Propósito en README EN y ES | 2 | 2026-10-13 13:22 -03:00 | 2026-10-13 13:22 -03:00 | 0.01 | |
| Sección en using-crew y roles, EN y ES | 2 | 2026-10-13 13:22 -03:00 | 2026-10-13 13:22 -03:00 | 0.01 | |
| Lista cerrada de oficios en CREW | 1 | 2026-10-13 13:23 -03:00 | 2026-10-13 13:23 -03:00 | 0.01 | |
| Test de conocimiento de stack en el catálogo | 3 | 2026-10-13 13:23 -03:00 | 2026-10-13 13:25 -03:00 | 0.03 | El test encontró React y Zod en las plantillas del scaffold; quedaron neutrales al stack |
| Changelog | 0.5 | 2026-10-13 13:25 -03:00 | 2026-10-13 13:25 -03:00 | 0.01 | |
| Revisión del maintainer | 1 | | | | |
| **Total** | **9.5** | — | — | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| Una skill nueva que no es alias ni oficio declarado hace fallar el catálogo | unit | node:test | tests/catalog.test.js | passing |
| Un identificador de framework en un oficio o en el baseline hace fallar el catálogo | unit | node:test | tests/catalog.test.js | passing |
| Los ejemplos de configuración exceptuados no disparan la regla | unit | node:test | tests/catalog.test.js | passing — la regla no alcanza a docs/ ni a configuration-interview.md |
| El README abre con el propósito en ambos idiomas | manual | none | revisión del maintainer | not verified — espera la revisión del maintainer |

## Changes

- (Solo si el objetivo cambia después de In progress.)
