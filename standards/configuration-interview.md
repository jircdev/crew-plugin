# Configuration interview — what must be asked before writing `crew.json`

Canonical question set for configuring a project. The `crew` role reads this file before touching a project's configuration; `/crew:setup` is its entry point.

**Why an interview and not inference.** Every field here grants a capability an agent will then act on — connecting to a URL, running a launch profile, capturing renders, claiming a component was reused. A wrong guess does not produce a wrong config; it produces work built on a false premise, discovered several steps later. Asking costs one line. Inferring costs the work.

## Rules of the interview

1. **Never infer what the human can answer in one line.** Reading the repo to *propose* an answer is good; writing it as fact without confirmation is not.
2. **Maximum two open questions per turn.** Ask the ones that unblock the next write; defer the rest. A configuration wizard that fires twelve questions gets abandoned at the fourth.
3. **Ask only what is not already answered.** Read `crew.json`, `AGENTS.md`, `.claude/launch.json`, `package.json` scripts and `docs/design/` first. What you find becomes a *proposal to confirm*, never a silent write.
4. **Confirm understanding before writing.** Restate in one line what you are about to declare and what it authorizes. Then write.
5. **Write only what was confirmed.** A capability nobody confirmed stays undeclared — and undeclared means the roles will say they could not verify it, which is the correct outcome, not a gap to paper over.
6. **Declining is a valid, complete answer.** "I want none of this" ends the interview successfully: update the marker and stop. The setup notice must be closeable by saying no.
7. **Ask before writing into a populated file.** Surgical edit, never a rewrite; everything not under discussion stays byte-identical.
8. **Update the marker at the end**, always — including when nothing else changed. That is what closes the pending-configuration notice.

## What to consult before asking

| Source | What it may already answer |
|---|---|
| `crew.json` | What is already declared — never re-ask it |
| `AGENTS.md` | Stack, folder layout, common commands, the project's own rules |
| `.claude/launch.json` | How the app starts, and on which port |
| `package.json` scripts (or the stack's equivalent) | Dev server, storybook, accessibility and performance checks |
| `docs/design/` | Whether design memory exists and whether it has content or is still the empty scaffold |
| The repo's shape | Whether the project even has an interface — if it does not, skip the whole design block |

## The question set

Ask in this order. Stop at the first block the project has no use for.

### 0. Does this project have a user interface?

If no: declare nothing under `design`, say so, update the marker, end. Everything below is irrelevant and asking it anyway is what makes setup wizards hated.

### 1. Mode and policy (only if `crew.json` is absent or the user asks to revisit)

- Do you work alone on this, or with a team? *(solo drops the delivery ceremony; team keeps it)*
- Do you want honest estimation numbers — real timestamps, deviation tracking? *(metrics)*
- At write time, should a file over its size ceiling be blocked or just flagged, with the hard stop at commit? *(quality)*

### 2. Where the app runs — the two permissions

Ask them separately. They are different risks: connecting to something already running is inspection; running a launch profile executes a command on the machine.

- **Is there a URL where this app runs during development?** If declared, agents may connect to it and inspect it without asking each time. → `design.runtime.url`
- **May an agent start the app itself when that URL is not responding?** If yes, which launch profile? If the project has no launch profile, offer to point at one rather than inventing a command. → `design.runtime.launch`
- State plainly what the answer authorizes, because this is a standing permission, not a one-turn approval: *declaring this replaces asking you every time.* Precedence is url first, launch only when the URL does not answer; whatever an agent starts, it stops.

### 3. Component registry

- **Where does someone look to find out whether a component already exists?** A running catalogue, a documentation page, a folder — or nowhere yet.
- If nowhere: declare nothing, and make explicit what that costs — every proposal will carry *"reuse not verified"*. That is honest, and it is a reason to build one later, not a reason to fake it now.

### 4. Capturing renders

- **Can renders be captured in this project, and how?** Browser, an existing screenshot tool, or not at all.
- **Which form factors are actually in scope?** Ask; do not assume desktop/tablet/mobile — some products are desktop-only, some are kiosks, some are TVs.
- Say what the absence costs: with no capture, no verdict on visual quality is possible, only code conformity, labeled as such.

### 5. Automated checks

- **Is there a command that measures accessibility or performance?** If yes, declaring it lets a role assert those as *measured*; without it they are reasoned and labeled as not measured.

### 6. Design source

- **Is there a design file or a set of reference screenshots that is the source of truth?** Only worth declaring if it is actually maintained; a stale design file declared as the source is worse than none.

### 7. Design memory

- **Is `docs/design/` filled in, or still the empty scaffold?** If empty, the useful next step is not a wizard — it is three entries: one reference, one approved pattern, one rejected one. Offer to walk through those three; do not generate them.
- Never write content into the design memory on the project's behalf. References and rejected patterns are the project's taste; an agent that invents them has replaced the memory with its own preference, which is exactly what this whole mechanism exists to prevent.

### 8. Fallback taste

Ask this only after block 7, and only when the design memory is empty or thin — a project with a filled memory rarely needs it.

- **When your memory says nothing about a question, what should a role fall back to?** An installed skill, a design-system document, a public design system's docs — or nothing. → `design.baseline`
- Say what each answer means: declared, the role contrasts against that baseline and names it; undeclared, the direction rests on the brief alone and the deliverable says so. The plugin never fills the gap with taste of its own, which is why the honest-but-generic output happens and why this key exists.
- Never propose a baseline the project did not name. Offering a menu of design systems is the plugin choosing taste through the back door.

### 9. Verification

Ask this whenever the project has code, in either mode. It is the block that decides whether a plan can be honest about what testing costs.

- **Is there a document saying what this project tests, at what levels, and with what?** If `docs/guides/testing.md` is the empty scaffold, say so plainly — the honest answer is "nothing declared yet", and that is what gets written. → `testing.guide`
- **Is there an end-to-end harness, and where do its specs live?** Look before asking: a config file, a `tests/` folder, a script in `package.json`. Confirm what you found; never declare a harness from a dependency alone — an installed package is not an adopted practice. → `testing.e2e` (`kind` is a free label: whatever the project calls its tool)
- **Which commands run the suites?** Only ones the project confirms. → `testing.commands`
- **Should a `passing` verification row require a receipt of the run?** Ask only once commands are declared; explain that `/crew:check` writes the receipt and that closure then needs it. Default is no. → `testing.receipts: true`
- Say what declaring costs and what it buys: with `e2e` declared, plans specify scenarios as specs in that harness at that path and the estimate carries writing them; undeclared, a scenario stays a walkthrough and the plan names the missing harness as a cost. Declaring `testing` at all makes the work item's verification table a closure gate.
- Never propose a tool the project did not name. Suggesting a harness because it is popular is the plugin choosing the stack through the back door — the same failure the design blocks exist to prevent.

### 10. Factory (optional)

Ask once, in either mode: **does this project track its tasks and work time in factory? If so, what is the factory project id?** → `factory.projectId` (plus `factory.environment: "dev"` only when the whole team works against factory's development environment). "No" leaves the block out, and nothing changes.

- Say what declaring does: closing a work item then requires a `**Factory activity:** <uuid>` header in place of the estimation table, the timestamps guard stands down, `/crew:metrics` reads factory's backlog, and the plugin's hooks capture work-time intervals (timestamps only) for each person who connects their machine with `/crew:factory login`. The block uses factory's production environment unless it declares `"environment": "dev"`.
- Never ask for, write or store the token, and keep it out of the chat. It is personal: each person connects their own machine with `/crew:factory login`. Point them to the plugin's `docs/en/factory.md` for that and for connecting the MCP server.

## Closing the interview

1. Show what will be written, in full, before writing it.
2. Write surgically — only the confirmed keys.
3. Update `configuredWith` to the current plugin version.
4. Close with what was declared, what was deliberately left undeclared, and what that costs. No enthusiasm, no summary of what the user just said.

## Anti-patterns

- Guessing a dev-server command from `package.json` and declaring it without confirmation.
- Asking all nine blocks at once.
- Re-asking something `crew.json` already declares.
- Writing design-memory content — references, approved or rejected patterns — instead of eliciting it.
- Leaving the marker un-updated, so the notice repeats after a successful interview.
- Declaring a capability "so the agent can do more". Undeclared is a valid state and its cost is already visible in every deliverable.
