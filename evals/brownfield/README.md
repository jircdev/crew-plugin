# Brownfield adoption — evaluation set

Four fixtures and a rubric for one question: **when crew is adopted into existing code, does the extraction report what the system does — and only what it saw?**

## How to run it

Human-run. Use a real repository you know well enough to judge each extracted rule. Run `/crew:adopt` on one capability with the 0.29 plugin, then score the resulting `docs/as-is/` file against [`rubric.md`](rubric.md). There is no 0.28 baseline to compare against: before 0.29 the extraction did not exist.

## Files

- [`fixtures.md`](fixtures.md)
- [`rubric.md`](rubric.md)
