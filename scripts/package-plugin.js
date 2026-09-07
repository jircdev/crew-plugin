#!/usr/bin/env node
// Build a portable dual-host package, excluding git state, tests and local files.
const fs = require('node:fs');
const path = require('node:path');
const { sync } = require('./sync-codex');
const root = path.resolve(__dirname, '..');
const entries = ['.claude-plugin', '.codex-plugin', 'agents', 'commands', 'skills',
  'standards', 'templates', 'hooks', 'scripts', 'integrations', 'docs', 'evals',
  'migrations.json', 'README.md', 'CHANGELOG.md', 'LICENSE'];
function build(destination) {
  sync(true);
  const target = path.resolve(destination);
  if (fs.existsSync(target)) throw new Error('Package destination must not exist; choose a new directory');
  fs.mkdirSync(target, { recursive: true });
  for (const entry of entries) fs.cpSync(path.join(root, entry), path.join(target, entry), {
    recursive: true, filter: source => path.basename(source) !== '__pycache__' && !source.endsWith('.pyc'),
  });
  return target;
}
if (require.main === module) {
  if (!process.argv[2]) throw new Error('Usage: node scripts/package-plugin.js <new-output-directory>');
  console.log(build(process.argv[2]));
}
module.exports = { build };
