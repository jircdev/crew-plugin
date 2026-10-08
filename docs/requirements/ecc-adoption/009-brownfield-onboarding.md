# 009 — Onboarding brownfield

- **Status:** Delivered
- **Plan:** ecc-adoption ([README](README.md))
- **Date:** 2026-10-07
- **Author role:** FA
- **Branch:** main (the plugin ships from main; no feature branch)
- **Depends on:** [008](008-install-lifecycle.md), propuesta de línea base de alcance (0.26)

## Context

Adoptar crew en un repo existente es la barrera más grande: el circuito asume que las reglas se escriben antes que el código, y en un brownfield el código ya existe sin specs. ECC tiene un extractor (spec-miner) que lee el código y escribe reglas WHEN/THEN e invariantes, marca la incertidumbre en lugar de inventar y registra el commit para saber cuándo quedan viejas.

Crew puede llevar esas reglas un paso más allá y sembrar con ellas la línea base de alcance de la 0.26.

## Goal

- RES tiene un protocolo de extracción de solo lectura con tope de archivos por capacidad y lista de lo no leído.
- FA tiene un modo "as-is" que redacta reglas con marcas de incertidumbre y hash de commit.
- `/crew:adopt` siembra `baseline.md` con esas reglas.
- `/crew:doctor` reporta reglas cuyo commit quedó atrás del código actual.

## Areas to investigate

- Forma final del `baseline.md` en la 0.26.
- Tope de archivos por capacidad que equilibre costo y cobertura.
- Cómo se marca una regla validada por un humano frente a una extraída.

## Expected deliverable

- Protocolo en los docs de RES y FA y plantilla as-is.
- Comando `/crew:adopt`.
- Control de frescura en el doctor.
- Evals, paridad Codex, docs EN y ES y changelog.

## Estimation

| Milestone | Est. hours | Started | Finished | Actual hours | Notes |
|-----------|-----------|---------|----------|--------------|-------|
| Protocolo RES y FA | 4 | 2026-10-07 22:44 -03:00 | 2026-10-07 22:44 -03:00 | 0.02 | Protocolo de extracción en RES y modo as-is en FA |
| Plantilla as-is | 2 | 2026-10-07 22:44 -03:00 | 2026-10-07 22:44 -03:00 | 0.01 | templates/docs/as-is/README.md, sembrada por init en modo team |
| `/crew:adopt` | 4 | 2026-10-07 22:44 -03:00 | 2026-10-07 22:44 -03:00 | 0.01 | commands/adopt.md y skill Codex generada |
| Siembra de la línea base | 4 | 2026-10-07 22:44 -03:00 | 2026-10-07 22:45 -03:00 | 0 | No ejecutado: la línea base de alcance sigue como propuesta sin implementar. docs/as-is/ queda como el insumo que esa propuesta podrá sembrar |
| Frescura en el doctor | 3 | 2026-10-07 22:45 -03:00 | 2026-10-07 22:45 -03:00 | 0.02 | scripts/lib/as-is-freshness.js registrado en el doctor; tests/adopt.test.js |
| Evals | 3 | 2026-10-07 22:45 -03:00 | 2026-10-07 22:45 -03:00 | 0.01 | evals/brownfield |
| Paridad Codex | 1.5 | 2026-10-07 22:45 -03:00 | 2026-10-07 22:45 -03:00 | 0.01 | Skill adopt generada; el comando delega en roles y scripts compartidos |
| Docs EN y ES | 4 | 2026-10-07 22:45 -03:00 | 2026-10-07 22:45 -03:00 | 0.01 | using-crew EN y ES |
| Release | 1 | 2026-10-07 22:49 -03:00 | 2026-10-07 22:50 -03:00 | 0.01 | Release conjunta 0.29.0 local (008, 009, 010); push pendiente de autorización |
| Revisión del maintainer | 4 | | | | |
| **Total** | **30.5** | — | — | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| Una regla sin evidencia suficiente queda marcada como incierta | manual | evals | evals/brownfield/fixtures.md (A3) | not verified — requiere corrida humana sobre un repo real |
| El scaffold team siembra `docs/as-is/README.md`; existen el comando y su skill de Codex | integration | node:test | tests/adopt.test.js | passing |
| El doctor reporta una spec as-is cuyo código cambió desde su commit | integration | node:test | tests/adopt.test.js | passing |
| Una spec sin commit o con commit ajeno pide re-extracción | integration | node:test | tests/adopt.test.js | passing |

## Changes

- 2026-10-07: la extracción escribe en `docs/as-is/` en lugar de sembrar `baseline.md`, porque la línea base de alcance sigue como propuesta sin implementar. `/crew:adopt` deja la evidencia lista para que esa propuesta la consuma cuando exista.
