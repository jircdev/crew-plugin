# 009 — Onboarding brownfield

- **Status:** Draft
- **Plan:** ecc-adoption ([README](README.md))
- **Date:** 2026-10-07
- **Author role:** FA
- **Branch:** —
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
| Protocolo RES y FA | 4 | | | | |
| Plantilla as-is | 2 | | | | |
| `/crew:adopt` | 4 | | | | |
| Siembra de la línea base | 4 | | | | (BC) depende de la forma final de la 0.26 |
| Frescura en el doctor | 3 | | | | |
| Evals | 3 | | | | |
| Paridad Codex | 1.5 | | | | |
| Docs EN y ES | 4 | | | | |
| Release | 1 | | | | |
| Revisión del maintainer | 4 | | | | |
| **Total** | **30.5** | — | — | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| Una regla sin evidencia suficiente queda marcada como incierta | manual | evals | evals/brownfield/fixtures.md | planned |
| `/crew:adopt` crea `baseline.md` con hash de commit | integration | node:test | tests/adopt.test.js | planned |
| El doctor reporta una regla con commit viejo | integration | node:test | tests/doctor.test.js | planned |

## Changes

- (Solo si el objetivo cambia después de In progress.)
