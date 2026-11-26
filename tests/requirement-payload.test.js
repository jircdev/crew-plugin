const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { payloadOf, planStatus, isRequirement } = require('../scripts/lib/requirement-payload');
const { withLink } = require('../scripts/lib/requirement-sync');
const { ensureHook } = require('../scripts/lib/requirement-hook');
const { factorySkipped } = require('../hooks/lib/factory-skip');
const { normalizeFactory } = require('../hooks/lib/factory-env');
const { PROJECT, ACTIVITY, REL, requirement, repo } = require('./requirement-world');

test('the load carries the plan status, the milestones with both estimates and the subcenter', () => {
  const cfg = normalizeFactory({ projectId: PROJECT, subcenter: 'MVP' });
  const repository = { provider: 'github', repo: 'acme/plans' };
  const payload = payloadOf({ root: '/work/plans', rel: REL, text: requirement(), factory: cfg, repository });
  assert.deepEqual({ ...payload, body: undefined }, {
    projectId: PROJECT, code: 'R:billing/001', externalKey: `plans:${REL}`, title: '001 — Invoices', body: undefined,
    status: 'proposed', costCenterName: 'MVP', repository,
    milestones: [
      { code: 'M1', title: 'Data model', estimatedHours: 4, estimatedAiHours: 0.5, status: 'done' },
      { code: 'M2', title: 'Screens', estimatedHours: 6, estimatedAiHours: 1, status: 'in_progress' },
      { code: '#3', title: 'Human review', estimatedHours: 1, estimatedAiHours: 0, status: 'pending' },
    ],
  });
  assert.match(payload.body, /The client downloads each invoice/);

  // The file's own header wins over the repository default; an id travels as an id.
  const own = payloadOf({ root: '/w/plans', rel: REL, text: requirement('Ready', '- **Subcentro:** Fase 2\n'), factory: cfg, repository });
  assert.equal(own.costCenterName, 'Fase 2');
  assert.equal(own.status, 'approved');
  const byId = payloadOf({ root: '/w/p', rel: REL, text: requirement(), factory: normalizeFactory({ projectId: PROJECT, subcenter: ACTIVITY }) });
  assert.equal(byId.costCenterId, ACTIVITY);
});

test('status words: proposed until approved, and an unknown word is left to factory', () => {
  const of = (word) => planStatus(`# x\n\n- **Estado:** ${word}\n`);
  assert.deepEqual(['Draft', 'Propuesto', 'Ready', 'Aprobado', 'En curso', 'Entregado, falta la revisión', 'Closed', 'Someday'].map(of),
    ['proposed', 'proposed', 'approved', 'approved', 'in_progress', 'delivered', 'closed', undefined]);
  assert.ok(isRequirement(REL));
  assert.ok(!isRequirement('docs/requirements/billing/README.md'));
  assert.ok(!isRequirement('docs/stories/billing/001-invoice.md'));
});

test('a legacy table carries its AI estimate in Notes', () => {
  const text = '# 001 — X\n\n## Estimation\n\n| Milestone | Est. hours | Started | Finished | Actual hours | Notes |\n' +
    '|---|---|---|---|---|---|\n| H0 Schema | 3 | | | | IA est. 0,5 h |\n';
  const { milestones } = payloadOf({ root: '/w/p', rel: REL, text, factory: normalizeFactory({ projectId: PROJECT }) });
  assert.deepEqual(milestones, [{ code: 'H0', title: 'Schema', estimatedHours: 3, estimatedAiHours: 0.5, status: 'pending' }]);
});

test('the link goes after the header, and a link line written by hand is replaced', () => {
  const linked = withLink(requirement(), ACTIVITY);
  assert.match(linked, new RegExp(`- \\*\\*Date:\\*\\* 2026-11-26\\n- \\*\\*Factory activity:\\*\\* ${ACTIVITY}\\n`));
  assert.equal(withLink(linked, ACTIVITY), linked);
  const fixed = withLink(requirement('Draft', '- **Factory activity:** own requirement `billing-001`\n'), ACTIVITY);
  assert.equal(fixed.match(/Factory activity/g).length, 1);
  assert.match(fixed, new RegExp(ACTIVITY));
  assert.equal(withLink('# T\r\n\r\n- **Status:** Draft\r\n', ACTIVITY),
    `# T\r\n\r\n- **Status:** Draft\r\n- **Factory activity:** ${ACTIVITY}\r\n`);
});

test('Factory: skip is read from the header only', () => {
  assert.ok(factorySkipped(requirement('Draft', '- **Factory:** skip\n')));
  assert.ok(factorySkipped(requirement('Draft', '- **Factory:** skip — hiring\n')));
  assert.ok(!factorySkipped(requirement()));
  assert.ok(!factorySkipped(requirement() + '\n- **Factory:** skip\n'));
});

test('the hook line follows the plugin when it moves, and a hook manager keeps its own file', t => {
  const r = repo(t);
  const hook = path.join(r.dir, '.git', 'hooks', 'pre-commit');
  fs.mkdirSync(path.dirname(hook), { recursive: true });
  fs.writeFileSync(hook, '#!/usr/bin/env bash\necho mine\n');
  assert.equal(ensureHook(r.dir, '/old/crew/1.6.0').action, 'appended');
  assert.equal(ensureHook(r.dir, '/new/crew/1.7.0').action, 'updated');
  assert.equal(ensureHook(r.dir, '/new/crew/1.7.0').action, 'skip');
  const text = fs.readFileSync(hook, 'utf8');
  assert.match(text, /echo mine/);
  assert.match(text, /\/new\/crew\/1\.7\.0\/scripts\/sync-requirements\.js/);
  assert.doesNotMatch(text, /1\.6\.0/);

  fs.writeFileSync(path.join(r.dir, 'lefthook.yml'), 'pre-commit:\n  jobs:\n    - run: echo x\n');
  const managed = ensureHook(r.dir, '/new/crew/1.7.0');
  assert.equal(managed.action, 'manual');
  assert.match(managed.why, /Lefthook owns the pre-commit hook/);
});
