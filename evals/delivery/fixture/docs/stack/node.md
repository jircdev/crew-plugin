# How ledger is built

- CommonJS modules, one concern per file under `src/`. No runtime dependencies.
- Errors: throw `Error` subclasses from `src/errors.js` (`PermissionError`, `ValidationError`); never return error codes.
- Money: integer cents inside every calculation; `src/money.js` converts at the edges.
- Tests: `node:test` and `node:assert/strict`, one file per module under `tests/`. A defect fix starts with a test that reproduces it.
- Diagnostics: `node --test` must stay green; run a single file with `node --test tests/<file>.test.js`.
