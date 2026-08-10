# Design memory

What **this product** considers good, written down. The crew plugin carries the design *method*; taste is not portable, so it lives here — in your repository, decided by you.

Without this folder, any role doing interface work can still apply the method, but it will say so out loud: *"no design memory declared: the direction was not contrasted against the product's references."* That admission is the point — an agent that invents a standard is worse than one that declares it has none.

## The three files

| File | Answers | Written when |
|---|---|---|
| [`references.md`](references.md) | What do we aspire to, and what do we deliberately reject? | Once at the start; revisited when the product's ambition moves |
| [`approved.md`](approved.md) | Which of our own solutions are settled and should be repeated? | Whenever a design decision proves itself and you want it reused |
| [`rejected.md`](rejected.md) | What have we tried or considered and ruled out — and why? | Whenever something is discarded, **including** what a role proposed and you turned down |

`rejected.md` is the one most projects skip and the one that pays most. It is what stops the same bad idea from being re-proposed every quarter, and it is the anchor for judging whether a new screen reads as generic.

## How to fill it in

Start with three entries, not thirty. One reference, one approved pattern, one rejected pattern is already enough to change what the agents produce. Add entries as decisions actually happen; a memory invented in one sitting describes an aspiration, not the product.

Two rules that keep it useful:

- **Rationale, always.** An entry without a *why* cannot be applied to a new case — and applying it to new cases is the only reason it exists.
- **Evidence where possible.** A screenshot, a URL, a path to the screen. "The dashboard's empty state" means nothing to whoever arrives in six months.

## Declaring it

Point your `crew.json` at this folder so the roles find it:

```json
{ "design": { "memory": "docs/design" } }
```

The same `design` section declares what the project can *do* — where it runs, its component registry, how renders get captured. Full reference: the plugin's configuration page. Nothing is declared by default: a capability you do not declare is one the roles will not assume they have.

## Evidence captures

If you declare a capture capability, renders land in the folder you point it at (`docs/design/.evidence` by convention). They are working evidence, not documentation — commit them or ignore them as your team prefers, but do not let them become the memory. The memory is the three files above.
