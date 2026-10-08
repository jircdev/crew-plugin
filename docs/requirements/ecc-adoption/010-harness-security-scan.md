# 010 — Escaneo de seguridad de la configuración del agente

- **Status:** Delivered
- **Plan:** ecc-adoption ([README](README.md))
- **Date:** 2026-10-07
- **Author role:** SEC
- **Branch:** main (the plugin ships from main; no feature branch)
- **Depends on:** [004](004-shell-guard-and-policy-protection.md), [008](008-install-lifecycle.md)

## Context

La configuración del agente (instrucciones, settings, servidores MCP, hooks, agentes) es una superficie de ataque: un plugin o un MCP malicioso corre con los permisos del usuario. ECC delega este escaneo en AgentShield, un paquete npm externo; meter una dependencia ejecutable de terceros en un control de seguridad reproduce el riesgo que se busca detectar.

Crew necesita un escaneo propio, de solo lectura, que reporte en el estilo del sello de evidencia.

## Goal

- El escaneo revisa instrucciones (CLAUDE.md, AGENTS.md, agentes, skills), settings, MCP, hooks y archivos de política de crew.
- Clasifica cada hallazgo como crítico, alto, medio o informativo, sin nota agregada.
- El informe se fecha, enmascara los secretos y queda inmutable en `docs/security/`.
- En solo avisa; en team, un crítico o alto sin exención bloquea el cierre de un item que toque archivos del harness y falla el CI.
- Corre por comando, con un aviso de una línea al iniciar sesión cuando cambió el hash de la configuración, y en CI.
- No usa red ni ejecuta nada de lo que escanea.
- Un log de auditoría opt-in (solo team) registra tipo de evento y patrón, nunca valores.

## Areas to investigate

- Conjunto inicial de reglas y su tasa de falsos positivos en proyectos reales.
- Rutas de configuración de usuario y de proyecto en Claude Code y Codex.
- Cómo se registra una aceptación de riesgo en DEVIATIONS.

## Expected deliverable

- Motor de reglas, severidad, enmascarado e informe.
- Comando de SEC, aviso por hash en SessionStart y script de CI.
- Log de auditoría opt-in.
- Tests, docs EN y ES y changelog.

## Estimation

| Milestone | Est. hours | Started | Finished | Actual hours | Notes |
|-----------|-----------|---------|----------|--------------|-------|
| Motor: reglas, severidad, enmascarado, informe | 10 | 2026-10-07 22:46 -03:00 | 2026-10-07 22:47 -03:00 | 0.03 | scripts/sec-scan.js y scripts/lib/sec-rules.js; secretos enmascarados; informe fechado en docs/security/; riesgos aceptados en el bloque crew:security |
| Integración: comando, aviso por hash, CI | 4 | 2026-10-07 22:47 -03:00 | 2026-10-07 22:47 -03:00 | 0.02 | Comando vía rol SEC (sin comando nuevo), check del doctor, aviso por hash en SessionStart solo en proyectos crew, --ci para el pipeline |
| Log de auditoría opt-in | 3 | 2026-10-07 22:47 -03:00 | 2026-10-07 22:48 -03:00 | 0.01 | audit: true en crew.json, solo team; registra guard, decisión y regla, nunca valores |
| Tests | 2 | 2026-10-07 22:48 -03:00 | 2026-10-07 22:49 -03:00 | 0.01 | tests/sec-scan.test.js, 5 tests |
| Docs EN y ES | 2 | 2026-10-07 22:49 -03:00 | 2026-10-07 22:49 -03:00 | 0.01 | using-crew, configuration, compatibility, plantilla DEVIATIONS, rol SEC |
| Revisión del maintainer | 3 | | | | |
| **Total** | **24** | — | — | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| Un MCP con secreto escrito a mano produce un crítico enmascarado y el secreto no sale del escáner | unit | node:test | tests/sec-scan.test.js | passing |
| Un allow con comodín, hooks apagados y npx -y sin versión producen altos | unit | node:test | tests/sec-scan.test.js | passing |
| Instrucciones plantadas, caracteres ocultos y agentes de solo lectura con escritura se reportan | unit | node:test | tests/sec-scan.test.js | passing |
| En team, un alto sin aceptar hace fallar `--ci`; aceptado o en solo, no | integration | node:test | tests/sec-scan.test.js | passing |
| SessionStart avisa sin escaneo previo o con configuración cambiada, y calla tras `--report` | integration | node:test | tests/sec-scan.test.js | passing |
| El log de auditoría no contiene valores | unit | node:test | tests/sec-scan.test.js | passing |
| El escaneo no abre conexiones de red | manual | none | scripts/sec-scan.js (revisión de código: sin módulos de red) | not verified — sin test que intercepte la red; el código no importa http, https ni net |

## Changes

- 2026-10-07: el escaneo se invoca desde el rol SEC y desde `/crew:doctor` en lugar de un comando propio, para no sumar una entrada al catálogo. Los archivos de configuración de Codex quedan fuera de los objetivos en esta versión; está documentado como hueco en `compatibility.md`.
