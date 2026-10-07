# 011 — Catálogo que aprende, con gobierno

- **Status:** Draft
- **Plan:** ecc-adoption ([README](README.md))
- **Date:** 2026-10-07
- **Author role:** CREW
- **Branch:** —
- **Depends on:** [002](002-catalog-integrity.md)

## Context

Las decisiones de fusionar, retirar o ajustar roles se toman hoy sin datos de uso. ECC registra el uso de skills y propone hooks a partir de las correcciones que encuentra en los transcripts. También escribe "instincts" automáticos que se inyectan sin aprobación, y eso se rechazó en este plan por ser un vector de inyección persistente.

Crew puede medir el uso de roles y skills de forma local y opt-in, y convertir las fricciones repetidas en propuestas con dueño que un humano aprueba.

## Goal

- `crew.json` acepta una clave `telemetry`, apagada por defecto.
- Con la clave activa, un log local registra qué rol o skill se usó y cuándo, sin contenido, con redacción y retención.
- `/crew:metrics catalog` reporta frecuencia de uso por rol y skill.
- Una retro convierte fricciones repetidas en una propuesta con dueño en `proposals/`, que un humano aprueba o descarta.
- Evals de ruteo detectan cuando un pedido llega al rol equivocado entre roles vecinos.

## Areas to investigate

- Qué eventos expone cada harness para registrar uso de Agent y Skill.
- Retención y ubicación del log fuera del repo.
- Pares de roles vecinos con mayor riesgo de mal ruteo.

## Expected deliverable

- Clave `telemetry` en la configuración.
- Log de uso, métricas de catálogo y retro a propuesta.
- Evals de ruteo, revisión SEC, paridad Codex, tests, docs EN y ES y changelog.

## Estimation

| Milestone | Est. hours | Started | Finished | Actual hours | Notes |
|-----------|-----------|---------|----------|--------------|-------|
| Clave en la configuración | 2 | | | | |
| Log de uso | 4 | | | | |
| Redacción y retención del log | 1 | | | | |
| Métricas de catálogo | 3 | | | | |
| Retro a propuesta | 4 | | | | |
| Evals de ruteo | 5 | | | | |
| Revisión SEC | 1 | | | | |
| Paridad Codex | 2 | | | | (BC) |
| Tests | 3 | | | | |
| Docs EN y ES | 3 | | | | |
| Release | 1 | | | | |
| Revisión del maintainer | 4 | | | | |
| **Total** | **33** | — | — | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| Sin la clave `telemetry` no se escribe ningún log | unit | node:test | tests/telemetry.test.js | planned |
| El log no contiene texto de prompts ni de salidas | unit | node:test | tests/telemetry.test.js | planned |
| `/crew:metrics catalog` cuenta usos por rol | unit | node:test | tests/metrics.test.js | planned |
| Un pedido de esquema llega a DA y no a SYS | manual | evals | evals/routing/fixtures.md | planned |

## Changes

- (Solo si el objetivo cambia después de In progress.)
