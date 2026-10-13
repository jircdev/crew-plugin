# Code Quality Rules — universal core

Stack-agnostic baseline, owned by the `crew` plugin. **Precedence: these rules are suggestive defaults — if the project defines its own quality rules (in `AGENTS.md`, lint configs, or docs), the project's rules win.** The initial `DOC` audit is where the developer resolves plugin-vs-project conflicts; the resolution is written into the project's root `AGENTS.md` and differences are recorded in `docs/DEVIATIONS.md`. Where the project is silent, this baseline applies. Refuse to generate violating code — refactor instead.

## One symbol per file

- One class, one UI component, one hook (or composable), one store/slice, one service per file.
- Never more than one component in a file — extract even the small ones.
- Tiny pure helpers used only by that symbol may live in the same file. Used elsewhere → extract.
- Barrels (`index.ts`) only at folder boundaries; re-exports only, no logic.

## Reactive primitives and lambdas

- **Any function passed as an argument to a reactive primitive of the UI framework (a hook, a composable, an effect) — built-in, library, or custom, current or future — longer than 3 lines must be extracted as a named function in its own file.** The rule is about the pattern (inline logic inside a hook call), not about a list of hook names; do not treat an unlisted hook as exempt. The hook call stays a one-liner that names the behavior; the logic gets a testable, findable home.
- A custom hook (or the framework's equivalent) is the only place that talks to services, stores, or transport. Components never do.

## File size ceilings (lines, hard)

| Kind | Max |
|------|-----|
| Component | 150 |
| Page / route | 200 |
| Hook | 80 |
| Service / store | 150 |
| Generic module | 200 |
| Test file | 250 |

Crossing a limit means split, never disable the rule.

## Function limits

- Length: 30 lines max. Parameters: 4 max (more → typed object). Complexity: 10. Nesting: 3.
- Early returns; happy path unindented. No `else` after `return`. No flag arguments. Ternaries one level max.

## Naming

- **Avoid compound names.** One or two words per identifier. A name that needs three or more words (`UserProfileCardContainerWrapper`) is a smell: the symbol has too many responsibilities or the folder structure is not carrying its share of the meaning. Split the symbol or let the path qualify it (`user-profile/Card.tsx`, not `UserProfileCard.tsx`).
- No generic names (`data`, `info`, `manager`, `helper`, `util`). Name the thing.
- Booleans start with `is/has/can/should`. Hooks start with `use`. No abbreviations except domain-standard (`id`, `db`, `fs`).
- Files kebab-case; classes/components PascalCase; functions/variables camelCase; true constants SCREAMING_SNAKE.
- All identifiers in English — code, tables, columns, routes, folders.

## Constants, comments, errors

- No magic numbers or strings in logic; extract named constants adjacent to the symbol.
- Comments: default none. Only **why** (non-obvious constraint, workaround, invariant) — never **what**.
- Never swallow errors: every catch handles, rethrows, or surfaces. No `console.log` in committed code.
- Mutating function parameters is forbidden; side effects at module top level are forbidden.

## Tests

- Co-located (`foo.ts` ↔ `foo.test.ts`). One `describe` per symbol, one `it` per behavior, AAA layout.
- No shared mutable state between tests.

## Refactor triggers

Stop and refactor before adding more when: a file crosses its ceiling · a function crosses 30 lines · the same logic appears in 3 places · a component talks to transport/store directly · a class exceeds 7 public methods.
