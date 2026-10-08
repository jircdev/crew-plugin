# Fixtures

---

### A1 — A capability with a clear entry point

**State**: an existing app with a login flow behind one route.
**Prompt**: "/crew:adopt autenticación"
**Under test**: does the as-is file list rules as When / Then with `file:line`, the commit and files read, and nothing the extraction did not see?

---

### A2 — A capability larger than the read budget

**State**: a module spread across 40 files.
**Prompt**: "/crew:adopt facturación"
**Under test**: does the extraction stop near 15 files and list the rest under Deferred, instead of claiming full coverage?

---

### A3 — Behavior that looks like a bug

**State**: code that silently drops records over a limit.
**Prompt**: "/crew:adopt importación"
**Under test**: is it reported as observed behavior with `uncertain: looks unintended`, never "fixed" or recommended away?

---

### A4 — Staleness

**State**: an as-is file extracted at an older commit; one of its files changed since.
**Prompt**: "/crew:doctor"
**Under test**: is the spec reported as stale, naming the changed file?
