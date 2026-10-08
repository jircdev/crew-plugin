const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { resolve } = require('../hooks/lib/standards');
const root = path.resolve(__dirname, '..');

function fixture(t, config) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crew-conf-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  if (config) put(dir, 'crew.json', JSON.stringify(config));
  return dir;
}
function put(dir, file, text) {
  const target = path.join(dir, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, text);
  return target;
}
function run(script, input) {
  const out = spawnSync(process.execPath, [path.join(root, script)], {
    input: JSON.stringify(input), encoding: 'utf8', cwd: input.cwd, windowsHide: true,
    env: { ...process.env, PLUGIN_ROOT: '', CLAUDE_PLUGIN_ROOT: '' },
  });
  assert.equal(out.status, 0, out.stderr);
  return out.stdout.trim() ? JSON.parse(out.stdout).hookSpecificOutput : null;
}
const write = (dir, rel, content) => ({ cwd: dir, tool_name: 'Write', tool_input: { file_path: path.join(dir, rel), content } });
const twoColumn = '# 001 — x\n\n- **Status:** Draft\n\n## Estimation\n\n| Hito | Est. horas |\n|---|---|\n| A | 2 |\n';
const PROJECT_TEMPLATE = '# Requirements\n\n## Requirement template\n\n```markdown\n# NNN — t\n\n- **Estado:** Draft\n\n## Contexto\n\n## Estimation\n\n| Hito | Horas |\n|---|---|\n| **Total** | |\n```\n';

test('resolver: crew template by default, project template wins, deviations apply with rationale only', t => {
  const dir = fixture(t);
  const target = path.join(dir, 'docs/requirements/p/001-x.md');
  const crew = resolve(target, root);
  assert.equal(crew.source, 'crew');
  assert.deepEqual(crew.tables.Estimation, ['Milestone', 'Est. hours', 'Started', 'Finished', 'Actual hours', 'Notes']);
  put(dir, 'docs/requirements/README.md', PROJECT_TEMPLATE);
  put(dir, 'docs/DEVIATIONS.md', '<!-- crew:standard\nrequirement omit section Contexto   # this team writes context in the plan README\nrequirement omit header Estado\n-->\n');
  const own = resolve(target, root);
  assert.equal(own.source, 'project');
  assert.deepEqual(own.tables.Estimation, ['Hito', 'Horas']);
  assert.ok(!own.sections.includes('Contexto'));
  assert.ok(own.header.includes('Estado'), 'a deviation without rationale is ignored');
  assert.equal(own.invalid.length, 1);
});

test('shape guard: notice without crew.json and in advise/solo, deny in team enforce, silent when off', t => {
  for (const [config, expected] of [[null, 'notice'], [{ quality: 'advise' }, 'notice'],
    [{ mode: 'solo', quality: 'enforce' }, 'notice'], [{ mode: 'team', quality: 'enforce' }, 'deny'], [{ quality: 'off' }, 'none']]) {
    const dir = fixture(t, config);
    const out = run('hooks/guard-shape.js', write(dir, 'docs/requirements/p/001-x.md', twoColumn));
    if (expected === 'none') assert.equal(out, null);
    else if (expected === 'deny') assert.match(out.permissionDecisionReason, /Hito \| Est\. horas; the standard is Milestone/);
    else assert.match(out.additionalContext, /Total\*\* row/);
    if (expected === 'notice') assert.equal(out.permissionDecision, undefined);
  }
});

test('shape guard: a declared deviation is not reported; README indexes are not work items', t => {
  const dir = fixture(t, { mode: 'team', quality: 'enforce' });
  put(dir, 'docs/DEVIATIONS.md', '<!-- crew:standard\nrequirement omit section Verification   # verified in the release checklist\n-->\n');
  const ok = fs.readFileSync(path.join(root, 'docs/requirements/ecc-adoption/002-catalog-integrity.md'), 'utf8')
    .replace(/## Verification[\s\S]*?## Changes/, '## Changes');
  assert.equal(run('hooks/guard-shape.js', write(dir, 'docs/requirements/p/002-x.md', ok)), null);
  assert.equal(run('hooks/guard-shape.js', write(dir, 'docs/requirements/p/README.md', twoColumn)), null);
});

test('shape guard: editing an item that already deviated is judged only on what the edit adds', t => {
  const dir = fixture(t, { mode: 'team', quality: 'enforce' });
  const target = put(dir, 'docs/stories/f/001-old.md', '# 001\n\n- **Status:** Draft\n\nlegacy body\n');
  const edit = { cwd: dir, tool_name: 'Edit', tool_input: { file_path: target, old_string: 'legacy body', new_string: 'legacy body, reworded' } };
  assert.equal(run('hooks/guard-shape.js', edit), null);
  const worse = { ...edit, tool_input: { ...edit.tool_input, new_string: 'x\n\n## Estimation\n\n| Hito | Est. horas |\n|---|---|\n| A | 1 |\n' } };
  assert.equal(run('hooks/guard-shape.js', worse).permissionDecision, 'deny');
});

test('Codex apply_patch reaches the same shape decision; conformance.js reports and exits non-zero', t => {
  const dir = fixture(t, { mode: 'team', quality: 'enforce' });
  const body = twoColumn.trimEnd().split('\n').map(l => '+' + l).join('\n');
  const out = run('hooks/codex-pre-tool.js', { cwd: dir, tool_name: 'apply_patch',
    tool_input: { command: `*** Begin Patch\n*** Add File: docs/requirements/p/001-x.md\n${body}\n*** End Patch` } });
  assert.equal(out.permissionDecision, 'deny');
  const file = put(dir, 'docs/requirements/p/001-x.md', twoColumn);
  const cli = spawnSync(process.execPath, [path.join(root, 'scripts/conformance.js'), '--check', file], { encoding: 'utf8' });
  assert.equal(cli.status, 1);
  assert.match(cli.stdout, /does not conform/);
});

test('off-repo plan nudge: notice for an hours table, silent when it links its work items or only reads', t => {
  const dir = fixture(t);
  const call = (tool_name, tool_input) => run('hooks/nudge-offrepo-plan.js', { cwd: dir, tool_name, tool_input });
  const plan = { batch: [{ payload: { content: '## Plan\n\n| Hito | Est. horas |\n|---|---|\n| A | 2 |' } }] };
  assert.match(call('mcp__docs__batch', plan).additionalContext, /outside the repo/);
  const linked = { batch: [{ payload: { content: 'Fuente: docs/requirements/ecc-adoption/\n\n| Req | Est. hours |\n|---|---|' } }] };
  assert.equal(call('mcp__docs__batch', linked), null);
  assert.equal(call('mcp__docs__read', plan), null);
  assert.equal(call('mcp__docs__batch', { note: 'hello' }), null);
  assert.equal(call('Artifact', { action: 'list' }), null);
  const page = put(dir, 'plan.html', '<table><tr><td>| Milestone | Est. hours |</td></tr></table>');
  assert.match(call('Artifact', { file_path: page }).additionalContext, /planning/);
});

test('every role carries the same standards rule; the baseline routes plans to the planning craft', () => {
  const rule = /## Standards over dictated formats\n\n([^\n]+)/;
  const bodies = fs.readdirSync(path.join(root, 'agents')).map(f => fs.readFileSync(path.join(root, 'agents', f), 'utf8').replace(/\r\n/g, '\n'));
  const found = bodies.map(b => (b.match(rule) || [])[1]);
  assert.ok(found.every(Boolean), 'a role lacks the rule');
  assert.equal(new Set(found).size, 1, 'the rule diverges between roles');
  const baseline = fs.readFileSync(path.join(root, 'standards/session-context.md'), 'utf8');
  assert.match(baseline, /load the `planning` skill first and live in the repo/);
  assert.ok(fs.existsSync(path.join(root, 'skills/planning/SKILL.md')));
});
