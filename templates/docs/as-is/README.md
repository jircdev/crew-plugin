# As-is — what the system does today

Written when crew is adopted into a project whose code already exists (`/crew:adopt`). One file per capability, describing behavior **as observed**, before anyone decides what it should be. Evidence, never a backlog: no acceptance criteria, no estimates. Decisions taken from here become stories or requirements that link the as-is file they start from.

`researcher` extracts; `functional-analyst` writes; a human who knows the system confirms each rule. `/crew:doctor` reports a file as stale once any file it was read from changes after the recorded commit.

## As-is template

```markdown
# <Capability name>

- **Commit:** <git rev-parse HEAD at extraction>
- **Files read:** <path>, <path>, …
- **Deferred:** <relevant files not read, or "None">
- **Extracted:** YYYY-MM-DD

## Rules

### <Short name>
- **When:** <trigger or input, observable>
- **Then:** <observable outcome>
- **Source:** `path:line`
- **Status:** extracted | confirmed | uncertain: <why>

## Invariants

### <Short name>
- **Holds:** <statement that is true every time>
- **Enforced at:** `path:line`
- **Status:** extracted | confirmed | uncertain: <why>
```
