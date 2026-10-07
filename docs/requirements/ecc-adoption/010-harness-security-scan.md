# 010 — Escaneo de seguridad de la configuración del agente

- **Status:** Draft
- **Plan:** ecc-adoption ([README](README.md))
- **Date:** 2026-10-07
- **Author role:** SEC
- **Branch:** —
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
| Motor: reglas, severidad, enmascarado, informe | 10 | | | | |
| Integración: comando, aviso por hash, CI | 4 | | | | |
| Log de auditoría opt-in | 3 | | | | |
| Tests | 2 | | | | |
| Docs EN y ES | 2 | | | | |
| Revisión del maintainer | 3 | | | | |
| **Total** | **24** | — | — | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| Un MCP con secreto escrito a mano produce un crítico enmascarado | unit | node:test | tests/sec-scan.test.js | planned |
| Un allow con comodín produce un alto | unit | node:test | tests/sec-scan.test.js | planned |
| En team, un crítico sin exención hace fallar el CI | integration | node:test | tests/sec-scan.test.js | planned |
| El escaneo no abre conexiones de red | unit | node:test | tests/sec-scan.test.js | planned |
| El log de auditoría no contiene valores coincidentes | unit | node:test | tests/sec-audit-log.test.js | planned |

## Changes

- (Solo si el objetivo cambia después de In progress.)
