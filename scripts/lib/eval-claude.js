#!/usr/bin/env node
// Default agent for the delivery evaluation: one non-interactive Claude Code
// turn. Contract shared with any replacement agent (--agent): a JSON request
// on stdin { prompt, cwd, variant, plugin, model, resume } and Claude Code's
// `--output-format json` result on stdout.
//
// Both variants start in safe mode, so neither reads the person's own
// CLAUDE.md, plugins or hooks; the crew variant adds the plugin copy with
// --plugin-dir. The workspace is a throwaway temp copy, which is why
// permissions are skipped: the agent edits files without a human to approve.
const { readFileSync } = require('node:fs');
const { spawnSync } = require('node:child_process');

const req = JSON.parse(readFileSync(0, 'utf8'));
// On Windows the arguments pass through cmd.exe, so the two values that are
// not fixed flags are checked against a strict shape (security-compliance,
// 2026-10-13) instead of being trusted for where they came from.
const SAFE_MODEL = /^[A-Za-z0-9._[\]-]+$/;
const SAFE_SESSION = /^[A-Za-z0-9-]+$/;
if ((req.model && !SAFE_MODEL.test(req.model)) || (req.resume && !SAFE_SESSION.test(req.resume))) {
  process.stdout.write(JSON.stringify({ is_error: true, result: 'refused: model or session id has characters outside the allowed set' }));
  process.exit(0);
}
// The prompt goes on stdin: on Windows `claude` is a .cmd shim that needs a
// shell, and a free-text argument through cmd.exe cannot be quoted safely.
const args = ['-p', '--output-format', 'json', '--safe-mode', '--dangerously-skip-permissions'];
if (req.variant === 'crew') args.push('--plugin-dir', req.plugin);
if (req.model) args.push('--model', req.model);
if (req.resume) args.push('--resume', req.resume);

const shell = process.platform === 'win32';
const quoted = shell ? args.map((a) => (/[\s"]/.test(a) ? `"${a.replace(/"/g, '')}"` : a)) : args;
const run = spawnSync(process.env.CREW_EVAL_CLAUDE || 'claude', quoted, {
  cwd: req.cwd, input: req.prompt, encoding: 'utf8', windowsHide: true, timeout: 30 * 60 * 1000, maxBuffer: 64 * 1024 * 1024,
  shell,
});
const out = (run.stdout || '').trim();
try {
  JSON.parse(out);
  process.stdout.write(out);
} catch {
  process.stdout.write(JSON.stringify({ is_error: true, result: (run.stderr || out || String(run.error || '')).slice(0, 2000) }));
}
