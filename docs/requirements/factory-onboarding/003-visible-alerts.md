# 003 — Avisos que la persona ve

- **Status:** Delivered
- **Plan:** factory-onboarding ([README](README.md))
- **Date:** 2026-11-02
- **Author role:** SYS, con SEC en el contenido de los avisos
- **Branch:** main (the plugin ships from main; no feature branch)
- **Depends on:** [001](001-expiry-keeps-time.md), [002](002-link-repo.md)

## Context

Hoy el único aviso de un problema con factory es una línea que el hook de inicio de sesión inyecta como contexto del agente. La persona no la ve, y el agente no tiene por qué mencionarla. Así pasó un token rechazado sin que nadie se enterara.

## Goal

- El hook de captura muestra a la persona una línea por el canal `systemMessage` de Claude Code, al iniciar la sesión y cuando un envío al terminar una respuesta descubre un problema nuevo.
- Avisa en cuatro situaciones: token vencido o rechazado, token que vence en menos de siete días, factory sin registro de persona para el usuario, y repo con token pero sin vincular.
- Cada aviso aparece a lo sumo una vez por sesión: al iniciarla, y al terminar una respuesta solo cuando el envío encuentra un problema distinto del anterior. Así no hace falta registrar en disco qué avisos ya se mostraron.
- El texto es fijo: sin cuerpos de respuesta, tokens ni nombres. Cada aviso dice qué hacer (`/crew:factory login`, `/crew:factory link`, pedir a Gestión el registro de persona).
- La línea para el agente que ya existe en el inicio de sesión se mantiene, con el mismo texto.
- Mostrar un aviso nunca crea archivos cuando la captura está pausada.

## Areas to investigate

- **Decidido por Julio el 2026-11-02:** "sin vincular" avisa en todo repo con `crew.json` cuando la persona tiene token, y se calla por repo con `"factory": { "capture": false }`. SEC lo había limitado a repos con bloque `factory`, lo que no habría cubierto el repo de factory.
- Si Codex muestra `systemMessage`. Si no, en Codex queda solo la línea del agente.

## Expected deliverable

- Salida `systemMessage` en `hooks/capture-activity.js`, y su comentario de contrato actualizado.
- Tests y documentación.

## Estimation

| Milestone | Est. hours | Est. AI hours | Started | Finished | Actual hours | Actual AI hours | Notes |
|-----------|-----------|---------------|---------|----------|--------------|-----------------|-------|
| Cálculo del aviso según el estado | 1.5 | 0.25 | — | 2026-11-02 14:24 -03:00 | — | — | hooks/lib/factory-alerts.js, una sola fuente para la persona y el agente. Inicio no registrado en el momento |
| Salida systemMessage al iniciar y al terminar una respuesta | 1.5 | 0.25 | — | 2026-11-02 14:24 -03:00 | — | — | hooks/capture-activity.js. Inicio no registrado en el momento |
| Una vez por sesión, sin escribir con la captura pausada | 1 | 0.25 | — | 2026-11-02 14:24 -03:00 | — | — | Sin registro en disco: al iniciar se muestra una vez, y al terminar una respuesta solo cuando el problema cambia. notices.json no hizo falta. Inicio no registrado en el momento |
| Tests | 1.5 | 0.25 | — | 2026-11-02 14:24 -03:00 | — | — | tests/factory-alerts.test.js, 5 casos. Inicio no registrado en el momento |
| Docs EN y ES | 0.5 | 0 | — | 2026-11-02 14:33 -03:00 | — | — | Sección "What you see" / "Lo que ves". Inicio no registrado en el momento |
| Revisión de Julio | 0.5 | 0 | | | | | |
| **Total** | **6.5** | **1** | — | — | | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| Token vencido muestra el aviso de login al iniciar la sesión | integration | node:test | tests/factory-alerts.test.js | passing |
| Un 401 al terminar una respuesta muestra el aviso en ese momento | integration | node:test | tests/factory-alerts.test.js | passing |
| Token que vence en menos de siete días avisa | integration | node:test | tests/factory-alerts.test.js | passing |
| Repo con token y sin vincular avisa | integration | node:test | tests/factory-alerts.test.js | passing |
| El mismo aviso no se repite en la sesión | integration | node:test | tests/factory-alerts.test.js | passing |
| Con la captura pausada no se crea ningún archivo | integration | node:test | tests/factory-alerts.test.js | passing |
| El aviso se ve en Claude Code | e2e | manual | — | not verified — necesita una sesión real con el plugin instalado desde esta versión |

## Changes
