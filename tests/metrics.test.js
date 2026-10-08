const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');

test('metrics: the Total row is not a milestone, and items group by size', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crew-metrics-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  spawnSync('git', ['init', '-q'], { cwd: dir, windowsHide: true });
  fs.mkdirSync(path.join(dir, 'docs/stories/f'), { recursive: true });
  for (const [name, size] of [['a', 'small'], ['b', null]]) {
    fs.writeFileSync(path.join(dir, `docs/stories/f/${name}.md`), `# x\n\n- **Status:** Closed\n${size ? `- **Size:** ${size}\n` : ''}\n## Estimation\n\n| Milestone | Est. hours | Started | Finished | Actual hours | Notes |\n|---|---|---|---|---|---|\n| A | 2 | 2026-10-01 10:00 -03:00 | 2026-10-01 13:00 -03:00 | 3 | |\n| **Total** | 2 | — | — | 3 | |\n`);
  }
  const out = spawnSync(process.execPath, [path.join(root, 'scripts/metrics.js')], { cwd: dir, encoding: 'utf8', windowsHide: true }).stdout;
  assert.match(out, /\| docs\/stories\/f\/a\.md \| [\d.]+ \| 3\.0 \| 2\.0 \| 3\.0 \| 50% \|/);
  assert.match(out, /By size:\n {2}small: 1 items .* est 2\.0h → actual 3\.0h · avg deviation 50%/);
  assert.match(out, /unsized: 1 items/);
});
