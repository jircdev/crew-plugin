# Review with evidence — evaluation set

Five fixtures and a rubric for one question: **does a review deliver findings someone else can check, owned by the role whose decision they concern, with blocking claims confirmed before they ship?**

The shape is defined once, in [`standards/findings.md`](../../standards/findings.md): severity, owner, evidence, basis, action, plus the adversarial confirmation of blocking findings and three lenses (silent failures, "must not", claimed passes).

## How to run it

Human-run. Prepare the fixture, run the prompt with the 0.28 plugin and with a 0.27 install, score both against [`rubric.md`](rubric.md), record the difference.

## Files

- [`fixtures.md`](fixtures.md)
- [`rubric.md`](rubric.md)
