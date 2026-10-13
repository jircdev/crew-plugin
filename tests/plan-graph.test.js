const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const script = path.join(root, 'scripts', 'plan-graph.js');

function plan(t, items, other = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crew-plan-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const write = (folder, list) => {
    fs.mkdirSync(path.join(dir, folder), { recursive: true });
    for (const [id, { status, deps = [], touches = [], blocked }] of Object.entries(list)) {
      const depends = deps.length ? deps.map((d) => `[${d}](${d}.md)`).join(', ') : '—';
      fs.writeFileSync(path.join(dir, folder, `${id}.md`), `# ${id}\n\n- **Status:** ${status}\n- **Depends on:** ${depends}\n${blocked ? `- **Blocked:** ${blocked}\n` : ''}\n` +
        `## Expected deliverable\n\n${touches.map((p) => `- \`${p}\``).join('\n')}\n`);
    }
  };
  write('p', items);
  write('q', other);
  return path.join(dir, 'p');
}
const graph = (dir) => JSON.parse(spawnSync(process.execPath, [script, dir, '--json'], { encoding: 'utf8', windowsHide: true }).stdout);
const state = (g, id) => g.items.find((i) => i.id === id);

test('items are done, ready, blocked by an item or a person, or not ready', t => {
  const g = graph(plan(t, {
    '001-a': { status: 'Delivered' },
    '002-b': { status: 'Ready', deps: ['001-a'], touches: ['src/b.js'] },
    '003-c': { status: 'Ready', deps: ['004-d'] },
    '004-d': { status: 'Draft' },
    '005-e': { status: 'Ready', blocked: 'Julio — pick the tax rule' },
  }));
  assert.equal(state(g, '001-a').state, 'done');
  assert.equal(state(g, '002-b').state, 'ready');
  assert.equal(state(g, '003-c').state, 'blocked');
  assert.match(state(g, '003-c').reason, /depends on 004-d/);
  assert.equal(state(g, '004-d').state, 'not ready');
  assert.match(state(g, '005-e').reason, /waiting on a person: Julio/);
});

test('two ready items that touch the same files never share a batch', t => {
  const g = graph(plan(t, {
    '001-a': { status: 'Ready', touches: ['src/a.js'] },
    '002-b': { status: 'Ready', touches: ['src/a.js', 'docs/x.md'] },
    '003-c': { status: 'Ready', touches: ['src/c.js'] },
  }));
  assert.deepEqual(g.batches, [['001-a', '003-c'], ['002-b']]);
});

test('work in progress holds its paths, folders included', t => {
  const g = graph(plan(t, {
    '001-a': { status: 'In progress', touches: ['src/lib/'] },
    '002-b': { status: 'Ready', touches: ['src/lib/x.js'] },
    '003-c': { status: 'Ready', touches: ['src/other.js'] },
  }));
  assert.deepEqual(g.batches, [['003-c'], ['002-b']]);
});

test('a dependency in another plan is followed by its link', t => {
  const dir = plan(t, { '001-a': { status: 'Ready', deps: ['../q/001-z'] } }, { '001-z': { status: 'Closed' } });
  assert.equal(state(graph(dir), '001-a').state, 'ready');
});

test('the integration gate says INTEGRATE only when the declared suites pass', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crew-gate-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const gate = (code) => {
    fs.writeFileSync(path.join(dir, 'crew.json'), JSON.stringify({ testing: { commands: [{ kind: 'unit', cmd: `node -e "process.exit(${code})"` }] } }));
    return spawnSync(process.execPath, [script, 'gate', '--cwd', dir], { encoding: 'utf8', windowsHide: true });
  };
  const red = gate(1);
  assert.notEqual(red.status, 0);
  assert.match(red.stdout, /DO NOT INTEGRATE/);
  const green = gate(0);
  assert.equal(green.status, 0);
  assert.match(green.stdout, /^INTEGRATE/m);
});
