# Migrating to v0.22

v0.22.0 gives interface work something it lacked: a **method** that ships with the plugin, and **capabilities and taste** that stay in your repository. It also adds a marker so a future release can tell you when something actually requires your attention.

The short version: **nothing you have breaks, and nothing is required of you.** Every addition is opt-in, and an undeclared capability is a valid state — the roles simply say out loud what they could not verify, instead of assuming it.

## Who needs to do what

| Your situation | Action needed |
|---|---|
| Repo without `crew.json` | **None.** Behavior is identical to before. |
| Repo with `crew.json`, no interface work | **None.** Declare nothing under `design`; you will never be nagged about it. |
| Repo with `crew.json` and UI work | Optional: run `/crew:setup` to declare what the project can do, and fill in `docs/design/`. |
| You see the startup line "configured before the crew setup marker existed" | Run `/crew:setup` once. Accepting the current state as-is closes it permanently. |

## What changed

**A `design` skill.** Any role whose work changes what a user sees, understands, chooses or does now loads a shared method: how to get from a problem to a direction, how to hand it off implementably, how to review an implementation, how to judge a render. It carries procedure and questions — never values, palettes, scales, style names or libraries. What is good in *your* product is yours to declare.

**Design memory in your repo** (`docs/design/`). Three files, scaffolded empty: references (what you aspire to and what you reject), approved patterns, rejected patterns. This is the anchor for every "does this look generic?" judgment. Without it the roles still work — they just state that the direction was contrasted against nothing.

**Declared capabilities** (`crew.json` → `design`). Where the app runs, where the component registry is, how renders are captured, which commands measure accessibility or performance. **Declaring is the permission**: instead of approving "may I open the browser?" every session, you grant it once in a file you can read and revert. Full reference and the cost of each absence: [configuration.md](configuration.md#design-capabilities).

**An honest evidence rule.** A verdict on visual quality now requires a render, and where there is no way to obtain one the role delivers code conformity **labeled as such** instead of merging the two claims. Every reply ends with a one-line evidence seal: what was loaded, which capabilities were used, what stayed unverified.

**Independent design review.** `qa-test-architect` receives the specification and the evidence — never the designer's rationale for why the design is right. The author's own critique loop still happens, bounded to one mandatory correction pass, and is reported as self-critique, not as a verdict.

**A configuration marker** (`configuredWith`). One line recording which plugin version last configured the project. Nothing reads it to decide behavior; it exists so a future version that genuinely requires action can tell you, once, at session start. Optional capabilities you don't use will never produce a notice.

## Adopting it, if you want to

Three steps, in this order, none of them urgent:

1. **`/crew:setup`.** It reads your repo first, asks at most two questions per turn, shows what it will write, writes only what you confirm, and updates the marker. "Nothing, thanks" is a complete answer.
2. **Three entries in `docs/design/`.** One reference, one approved pattern, one rejected pattern. That is already enough to change what the roles produce. Do not write thirty in one sitting — a memory invented in an afternoon describes an aspiration, not your product.
3. **Declare a render channel** if you have one. It is the single change that moves interface work from "sounds right" to "was looked at".

## What did not change

Stories, requirements, estimation tables, ADRs, work entries, guards, the quality gate, `/crew:metrics` — untouched. No role was added, merged or retired; no alias changed. The delivery circuit is exactly as it was.

## For an already-scaffolded project

The plugin never overwrites your files. To get `docs/design/` in an existing repo, re-run `bash <plugin>/bin/init-project.sh` from your project root: it skips everything that already exists and adds only what is missing. Your `crew.json` is left untouched — that is what `/crew:setup` is for, and it asks before writing.
