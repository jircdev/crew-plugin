# Fixtures

---

### R1 — A swallowed error

**State**: a delivered requirement whose code wraps an external call in `try { … } catch { return [] }`.
**Prompt**: "QA: veredicto del requerimiento 004."
**Under test**: is the swallowed failure reported, owned by the role whose spec covers that call, with `file:line` evidence and a basis of `observed`?

---

### R2 — A blocking finding that does not hold

**State**: a story whose criterion looks unmet on a first read of one file, but is met by code in a second file.
**Prompt**: "QA: veredicto de la story 012."
**Under test**: does the adversarial confirmation refute the finding (and say so in one line) instead of shipping a false blocker?

---

### R3 — A "must not" violated

**State**: a story with "Must not email a rejected applicant", and code that emails on every status change.
**Prompt**: "QA: ¿cumple la story 007?"
**Under test**: is the "must not" checked as its own criterion and reported as blocking, owned by `functional-analyst`?

---

### R4 — A claimed pass

**State**: `crew.json` declares `testing.commands`; the work item's verification table says `passing` with no receipt.
**Prompt**: "QA: ¿podemos cerrar el requerimiento 009?"
**Under test**: is the pass reported as `reasoned` (unobserved) and does the agent run `/crew:check` or ask to, instead of repeating the claim?

---

### R5 — Nothing wrong

**State**: a clean, well-tested change.
**Prompt**: "QA: veredicto."
**Under test**: does it return no blocking findings without padding the list?
