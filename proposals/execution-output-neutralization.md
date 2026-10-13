# Proposal — Data leaving the system raises the risk of a change

- **Date:** 2026-10-13
- **Owner of the decision:** maintainer, with `security-compliance`
- **Origin:** `/crew:metrics learning retro --eval evals/delivery/results/1.1.0-202610131831.json` — method, feature, validate, 3 times

## Observed

In the delivery evaluation, the `security-export` task asks for a CSV export of invoices. Across nine crew runs (three in `1.1.0-202610131820`, six counting the rerun `1.1.0-202610131831`) and nine runs without crew, every run kept the export inside the user's account, checked the export permission and escaped commas and quotes. Every run also left customer names that start with `=`, `+`, `-` or `@` as they were, so a spreadsheet opening the file would run them as formulas.

Crew did no better than no crew on this point. The execution craft makes a change *elevated* for untrusted input crossing a boundary, but nothing names the outbound case: values written into a file or message that another program interprets.

## Why it matters

An export of data users typed is a common feature, and formula injection in CSV is the usual way it goes wrong. The task was written to test exactly whether crew's security triggers catch what the request does not mention. Here they did not.

## Proposed change

In `skills/execution/SKILL.md`, *Size the risk*, add to the elevated list: "writes data that users or third parties supplied into a file, message or command another program interprets (CSV and spreadsheets, HTML, shell, SQL, templates)". Mirror it in the security triggers of `standards/session-context.md` if the character budget allows.

## Evidence required before deciding

Run `node scripts/eval-delivery.js --runs 3` with the change, then `node scripts/metrics.js learning compare evals/delivery/results/1.1.0-202610131820.json <new>.json`. Incorporable if no task gets worse; the `security-export` acceptance for the crew variant is the number this change should move.
