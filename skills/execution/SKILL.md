---
name: execution
description: "The execution craft, loadable by ANY role (and by the main agent) that is about to change code — implementing a feature, fixing a defect, refactoring, migrating data or a schema. Owns HOW a change is made and proven: classify the work, scale the procedure to its risk, finish with evidence anyone can check; never the domain decisions inside it. Load BEFORE the first code edit; triggers on 'implement', 'fix', 'bug', 'refactor', 'migrate', 'add support for', 'make it work', 'implementá', 'corregí', 'arreglá', 'refactorizá', 'migrá', 'agregá'."
---

# Execution — the change craft

A change is done when the behavior it promised is proven, the behavior it did not touch still works, and someone else can check both. This craft is the procedure that gets there. It carries method only: how this project builds and tests comes from what it declares — the stack specifications under `stack` in `crew.json`, the commands under `testing`, the rules in `AGENTS.md`. Where nothing is declared, say so in the evidence seal and use the role's general craft.

## 1. Before the first edit

1. **Classify the work.** One question decides it: does any observable behavior change?
   - No → **refactor**.
   - Yes, back to what was intended → **defect**.
   - Yes, something new → **feature**.
   - The shape of persisted data changes → **migration**, on top of whichever of the above applies.

   A request that mixes kinds is split: a refactor that makes a feature simpler goes first, as its own step, never folded into the feature.
2. **Load the context.** The work item's acceptance criteria, the stack specification declared for the area, the testing commands, the project's own rules.
3. **Size the risk.** The procedure has two weights:
   - **Standard** — the default.
   - **Elevated** — the change touches a security trigger of the session baseline (authentication, authorization, untrusted input, personal data, external calls, secrets), money or any calculation people rely on, the shape of persisted data, a contract other code consumes, or deletes anything. Elevated adds four things: consult `security-compliance` when a security trigger is involved; write the tests for the rejections and abuse cases before the implementation; review the diff against every criterion before declaring done; state how the change is undone.
4. **Map the reach.** Read who calls the code you are about to change and what it calls in turn. List every screen, caller and rule that shares the component, function or endpoint. When the reach includes something the request did not name (another module, another site, a server rule, a contract), stop before editing and tell the user in one line: "you asked for X; it implies Y in Z; I recommend A". The extra work starts only after that answer. A reach found halfway through the change stops it the same way.
5. **Run the suite once before changing anything.** Whatever is red before you started is reported as such, and never blamed on the change or hidden by it.

## 2. Procedures

### Defect

1. **Read the defined flow.** Before the code, read the work item, requirement or flow document that defines the behavior. With no written flow, the intended behavior is the owner's decision: ask, and never infer it from the code.
2. **Reproduce.** Turn the report into a test that fails at the lowest level that shows it, and watch it fail for the reported reason. A defect that cannot be reproduced is reported back with what was tried; it is never "fixed" blind.
3. **Judge the trigger.** An error has two sides: the rule that refused and the caller that asked. Decide which side is wrong against the defined flow and the known practice for that interaction (a choice in a group of options stays chosen when tapped again). When the trigger is a user gesture, read it through `ux-architect`. The error message is evidence of a conflict; the rule behind it stays until the behavior that hit it was judged correct.
4. **Find the cause.** Follow the wrong value back to where it is produced and fix it there. Then look for the same pattern elsewhere: a defect is often a family.
5. **Consult the owner** of every rule, ruling or contract the fix touches, before the fix is final.
6. **Fix with the smallest change** that removes the cause.
7. **Verify.** The new test passes, the whole suite is green.
8. **Report** the flow read, the side judged wrong, the reach checked, the owners consulted, then the cause, the fix and the name of the regression test. In a trivial defect each of the first four fits in a few words.

This is test-driven development applied where it pays most: the failing test comes first and stays as the guard.

### Feature

1. **Criteria.** Write the observable behaviors the request implies, including the rejections it never mentions: invalid input, missing permission, data of another tenant, empty and limit values. When an ambiguity changes the implementation, ask one question; otherwise take the reading consistent with the project's rules and state it.
2. **Design what the change needs.** Follow the structure that already exists. Consult the owning role when the change crosses a boundary: `system-architect` across modules, `data-architect` for schema, `ux-architect` for anything a user sees.
3. **Implement in small steps**, each one leaving the suite green. Write the test first when the behavior is clear; when it is still being discovered, the test follows in the same step, never in a later one.
4. **One test per criterion**, plus one per rejection.
5. **Validate** each criterion against its test, then run the suite.

### Refactor

1. **Pin the behavior.** Confirm tests cover what will move. Where they do not, add characterization tests that capture the current output before touching the structure.
2. **Change the structure in small steps**, suite green after each. A defect found on the way is noted and fixed afterwards as a defect, in its own step.
3. **Verify** that the same tests pass and that no assertion changed in the diff.

### Migration

1. **Plan the way back first**: a reverse step, a backup, or a forward fix that is written down. The schema decision belongs to `data-architect`.
2. **Rehearse on a copy** with realistic rows, including the awkward ones: empty values, duplicates, legacy formats. A copy is a database the human identified as one; when it is unclear which database a connection reaches, ask before running anything.
3. **Verify the data**: counts and invariants before and after, and a second run that changes nothing.
4. **Destructive steps go last**, after verification.
5. **Real data waits for the human's yes.** Applying the migration to production, or to any data that is not the rehearsal copy, needs the human's explicit confirmation in the conversation, after you name the target and the effect.

## 3. Evidence of done

- Run the commands the project declares under `testing`. With receipts declared, run them through `/crew:check` so the result is recorded.
- Report in four parts: what changed; which criterion each test proves; what ran and with what result; what stayed unverified and why.
- No coverage percentage replaces this. The question is which behaviors are protected, and the report answers it by name.

## 4. Anti-patterns

- Fixing the symptom where it shows instead of the cause where it is produced.
- Changing a rule (validation, guard, assertion, test expectation, invariant) so a behavior passes, before that behavior was judged against its flow. The fix belongs to the caller that should not have asked.
- Growing the change past the request in silence: a reach the user did not name is announced before it is edited.
- A refactor and a behavior change in the same step.
- Declaring done from reading the code, or saying "tests pass" for a suite that did not run.
- Taking a convention from what is popular instead of from the project's stack specification.
