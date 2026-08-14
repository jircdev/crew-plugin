# Fixtures

Ten scenarios. Each states the project state to prepare, the prompt to send, and what is actually under test. Prepare the state honestly — a fixture that declares no registry must genuinely have none in `crew.json`, not a registry the agent happens not to find.

---

### F1 — New screen, incomplete brief

**State**: design memory present with at least one reference and one rejected pattern. Registry declared. No capture.
**Prompt**: "Necesito una pantalla para que el equipo revise las solicitudes pendientes."
**Under test**: does it ask what only the project can answer (who uses it, what "done well" means, which trade-off matters) instead of inventing a dashboard? Does it confirm its understanding in one line before designing? Does it stay within two open questions?

---

### F2 — Redesign of a generic UI

**State**: memory present, including rejected patterns. Registry declared.
**Prompt**: "Esta pantalla funciona pero parece cualquier SaaS. Mejorala." *(attach or describe a conventional card-grid dashboard)*
**Under test**: is the anti-generic judgment anchored in the project's declared rejected patterns and references — or in a private list of patterns the agent considers generic? Naming a proscribed pattern the project never declared is a **failure**, however reasonable it sounds.

---

### F3 — Review with a render available

**State**: `design.capture` and `design.runtime.url` declared, both working. Memory present.
**Prompt**: "Revisá la pantalla de listado."
**Under test**: does it actually capture, at the declared form factors and in at least two states (nominal + one non-ideal)? Does it run the mandatory correction pass and declare how many passes ran? Does it use the URL before any launch profile?

---

### F4 — Review with no render channel

**State**: no `capture`, no `runtime`. Memory present.
**Prompt**: "Revisá la pantalla de listado y decime si está bien."
**Under test**: does it refuse the visual verdict and deliver code conformity **labeled as such**? The failure mode is a confident quality judgment inferred from reading code — fluent, plausible, and unsupported.

---

### F5 — Project with no registry

**State**: `design.registry` absent. Memory present.
**Prompt**: "Necesito un componente para mostrar el estado de cada solicitud."
**Under test**: does the deliverable carry "reuse not verified" and propose anything new as *unconfirmed new*? Silently proposing a new component is the failure.

---

### F6 — Registry that must be reused

**State**: registry declared and containing a component that plainly covers the need.
**Prompt**: "Necesito mostrar una lista de elementos seleccionables."
**Under test**: does it consult before proposing, and does it reuse rather than invent? Bonus check: if the registry and the code disagree, does it report the contradiction instead of quietly picking one?

---

### F7 — Meets the checklist, weak design

**State**: capture declared and working. Memory present, **with at least one approved pattern the fixture screen violates**.
**Prompt**: "Ya cumple con todos los estados y accesibilidad. ¿Está listo?"
**Under test**: does it detect and **name** the weakness instead of ratifying checklist compliance? Scored on detection and on citing the project's memory — never on whether it identified the same flaw the fixture author had in mind. Without declared memory this fixture is meaningless: "weak" needs something to be weak against.

---

### F8 — Handoff needing concrete identifiers

**State**: registry declared with named components and tokens.
**Prompt**: "Pasale la especificación al que lo va a implementar."
**Under test**: does it switch out of the invariant plane and name components, tokens, values and breakpoints? An abstract, unimplementable handoff is the failure — this is the fixture that guards against over-applying the abstraction rule.

---

### F9 — Routing (the over-design guard)

**State**: any.
**Prompt**: "¿Qué datos deberíamos mostrar en la pantalla de solicitudes y cómo los traemos del backend?"
**Under test**: the request belongs to `data-experience-architect` (what data appears) and `frontend-architect` (how it is fetched). Does the agent say so and stop, instead of absorbing the neighbouring authority? A skill that makes UX swallow adjacent decisions has made the catalog worse, not better — this fixture exists to catch that.

---

### F10 — No memory, baseline declared

**State**: `design.memory` absent. `design.baseline` declared and reachable. Registry declared.
**Prompt**: "Necesito la pantalla de configuración de la cuenta."
**Under test**: does it consult the declared baseline instead of emitting the no-memory admission as if nothing were declared? Two failures, opposite directions: ignoring a baseline the project took the trouble to declare, and presenting what the baseline says as if it were this product's approved standard. The seal must name the baseline as the baseline. Bonus check, run with memory *and* baseline both declared and disagreeing: the memory wins, and the agent does not argue the point.
