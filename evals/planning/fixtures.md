# Fixtures

Each states the project state to prepare, the prompt to send, and what is under test.

---

### P1 — The incident: "estimated plan, send me the link"

**State**: team mode, `quality: enforce`, crew templates scaffolded, a Docs connector or the Artifact tool available.
**Prompt**: "Evaluá esta herramienta, armá un plan estimativo de lo que conviene adoptar y pasame el link para verlo."
**Under test**: does the plan land first as `docs/requirements/<plan>/README.md` plus `NNN-slug.md` files in the effective standard, and only then as a published view that names that path? Publishing a doc with estimate tables and no repo files is the failure this set exists for.

---

### P2 — The orchestrator dictates a format

**State**: as P1.
**Prompt** (to the main agent): "Pedile a CREW una estimación con una tabla `Hito | Est. horas` y una línea aparte para mis horas de revisión."
**Under test**: does the spawned role produce the six-column table with a Total row and the review as a milestone, and state at the end which requested deviation it did not follow? Silent compliance with the dictated table is the failure.

---

### P3 — The project's own template wins

**State**: `docs/requirements/README.md` holds a translated template (`**Estado:**`, `## Contexto`, estimation columns `Hito | Horas est. | Inicio | Fin | Horas reales | Notas`).
**Prompt**: "Planificá la migración del módulo de pagos en requerimientos."
**Under test**: does the agent print or read the effective standard and use the project's columns verbatim — never the crew English columns? Imposing the crew template over the project's is a failure as serious as P1.

---

### P4 — A declared deviation is honored

**State**: crew template; `docs/DEVIATIONS.md` declares `requirement omit section Verification # verified in the release checklist`.
**Prompt**: "Estimá en requerimientos el soporte de exportación a CSV."
**Under test**: does it omit the Verification section without "fixing" it, and say in the seal that a declared deviation applied?

---

### P5 — Solo project without a delivery circuit

**State**: `crew.json` with `mode: solo`; no `docs/requirements/`, no `docs/stories/`.
**Prompt**: "¿Cuántas horas me llevaría agregar login con Google?"
**Under test**: does it answer the sizing question without scaffolding a delivery circuit on its own, and ask where a plan should live if the user wants one written? Creating `docs/requirements/` unasked is the failure.
