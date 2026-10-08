# 011 — Catálogo que aprende, con gobierno

- **Status:** Delivered
- **Plan:** ecc-adoption ([README](README.md))
- **Date:** 2026-10-07
- **Author role:** CREW
- **Branch:** main (the plugin ships from main; no feature branch)
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
| Clave en la configuración | 2 | 2026-10-07 22:50 -03:00 | 2026-10-07 22:51 -03:00 | 0.01 | telemetry transportada por normalize(); ausente = apagado |
| Log de uso | 4 | 2026-10-07 22:51 -03:00 | 2026-10-07 22:51 -03:00 | 0.02 | hooks/record-usage.js en PostToolUse Agent/Task/Skill y UserPromptSubmit (solo el alias inicial) |
| Redacción y retención del log | 1 | 2026-10-07 22:51 -03:00 | 2026-10-07 22:51 -03:00 | 0 | Nombres fuera del catálogo se guardan como other; poda a 90 días en cada escritura; escrito junto con el hito anterior |
| Métricas de catálogo | 3 | 2026-10-07 22:51 -03:00 | 2026-10-07 22:51 -03:00 | 0.01 | /crew:metrics catalog vía scripts/catalog-usage.js |
| Retro a propuesta | 4 | 2026-10-07 22:51 -03:00 | 2026-10-07 22:52 -03:00 | 0.02 | Procedimiento en DOC, solo a pedido; fuentes: archivos del repo, nunca transcripciones (condición 7 de SEC) |
| Evals de ruteo | 5 | 2026-10-07 22:52 -03:00 | 2026-10-07 22:53 -03:00 | 0.01 | evals/routing: 14 prompts sobre 7 pares de roles vecinos |
| Revisión SEC | 1 | 2026-10-07 22:52 -03:00 | 2026-10-07 22:52 -03:00 | 0.02 | APPROVED WITH CONDITIONS; aplicadas las 7: escritura nula ante fallo, lista de campos, fecha sin hora, consentimiento por persona, .crew/.gitignore y chequeo del doctor, retención al leer y --purge, retro sin transcripciones |
| Paridad Codex | 2 | 2026-10-07 22:53 -03:00 | 2026-10-07 22:53 -03:00 | 0.01 | (BC) Hooks compartidos; sin verificar si Codex emite PostToolUse para su delegación ni UserPromptSubmit |
| Tests | 3 | 2026-10-07 22:53 -03:00 | 2026-10-07 22:53 -03:00 | 0.01 | tests/usage.test.js, incluye la regresión de SEC con texto sensible tras el alias |
| Docs EN y ES | 3 | 2026-10-07 22:53 -03:00 | 2026-10-07 22:53 -03:00 | 0.01 | configuration, metrics, compatibility |
| Release | 1 | 2026-10-07 22:53 -03:00 | 2026-10-07 22:54 -03:00 | 0.01 | Release 0.30.0 local; push pendiente de autorización |
| Revisión del maintainer | 4 | | | | |
| **Total** | **33** | — | — | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| Sin opt-in personal no se escribe nada, aunque el crew.json compartido lo pida | integration | node:test | tests/usage.test.js | passing |
| El log no contiene texto de prompts ni de entradas; guarda solo fecha, tipo y nombre del catálogo | integration | node:test | tests/usage.test.js | passing |
| `/crew:metrics catalog` cuenta usos por rol y lista los no usados; --purge borra | integration | node:test | tests/usage.test.js | passing |
| crew.json puede prohibirlo para todos; las líneas viejas se podan | integration | node:test | tests/usage.test.js | passing |
| El doctor bloquea si un log personal está versionado | integration | node:test | tests/usage.test.js | passing |
| Un pedido de esquema llega a DA y no a SYS | manual | evals | evals/routing/fixtures.md (R1) | not verified — requiere corrida humana |

## Changes

- 2026-10-07: tras la revisión de SEC (APPROVED WITH CONDITIONS), la activación pasa a ser por persona (`.crew/local.json` o `CREW_TELEMETRY=1`) y `crew.json` solo puede prohibirla; se guarda la fecha sin hora; `.crew/.gitignore` y el doctor impiden versionar el log; la retro no lee transcripciones.
