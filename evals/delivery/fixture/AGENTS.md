# AGENTS.md — ledger

Invoicing core for small accounting firms. Each firm is an **account**; users belong to one account and act through a role.

## Rules

- Every operation that reads or changes invoices checks permission with `can(user, action)` from `src/permissions.js`. The action names live in that file.
- A user only ever sees data of their own account (`user.accountId`).
- Money is computed in integer cents and rounded once, half up, at the end of the calculation.
- No runtime dependencies. Tests use the Node test runner.

## Commands

- `npm test` runs the suite (`node --test`).

## Stack

How this project is built is in `docs/stack/node.md`.
