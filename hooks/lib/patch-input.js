// Translate a conservative subset of Codex apply_patch into the existing guard
// contract. Never mutate disk. Ambiguous/unsupported patches must be reported.
const { readFileSync, existsSync } = require('node:fs');
const { resolve } = require('node:path');

function patchInputs(input) {
  const command = input.tool_input?.command;
  if (typeof command !== 'string') throw new Error('missing tool_input.command');
  const lines = command.replace(/\r\n/g, '\n').trimEnd().split('\n');
  if (lines.shift() !== '*** Begin Patch' || lines.pop() !== '*** End Patch') {
    throw new Error('expected Begin Patch / End Patch markers');
  }
  const edits = [];
  const seen = new Set();
  const cwd = input.cwd || process.cwd();
  function pathFor(name) {
    const path = resolve(cwd, name);
    if (seen.has(path)) throw new Error('repeated path; split the patch into separate calls');
    seen.add(path);
    return path;
  }
  function write(path, content) {
    edits.push({ ...input, tool_name: 'Write', tool_input: { file_path: path, content } });
  }
  while (lines.length) {
    const header = lines.shift().match(/^\*\*\* (Add|Update|Delete) File: (.+)$/);
    if (!header) throw new Error('unsupported file header');
    const [, kind, name] = header;
    const path = pathFor(name);
    if (kind === 'Delete') { write(path, ''); continue; }
    if (kind === 'Add') {
      if (existsSync(path)) throw new Error('Add File target already exists; use Update File');
      const content = [];
      while (lines.length && !lines[0].startsWith('*** ')) {
        const line = lines.shift();
        if (!line.startsWith('+')) throw new Error('unsupported Add File line');
        content.push(line.slice(1));
      }
      write(path, content.length ? content.join('\n') + '\n' : '');
      continue;
    }
    let destination = path;
    if (lines[0]?.startsWith('*** Move to: ')) destination = pathFor(lines.shift().slice(13));
    if (destination !== path && existsSync(destination)) throw new Error('move target already exists');
    const original = readFileSync(path, 'utf8');
    const source = original.replace(/\r\n/g, '\n').split('\n');
    if (source.at(-1) === '') source.pop();
    let cursor = 0;
    const result = [];
    let hunks = 0;
    while (lines.length && !/^\*\*\* (Add|Update|Delete) File: /.test(lines[0])) {
      const marker = lines.shift();
      if (marker !== '@@' && !marker.startsWith('@@ ')) throw new Error('expected @@ hunk marker');
      let searchStart = cursor;
      if (marker.startsWith('@@ ')) {
        const context = marker.slice(3);
        // Codex searches forward, preferring exact context, then trailing-space
        // normalization, then surrounding-space normalization. The anchor is
        // consumed; unchanged lines before/through it remain in the result.
        let anchor = -1;
        for (const normalize of [s => s, s => s.trimEnd(), s => s.trim()]) {
          anchor = source.findIndex((line, i) => i >= cursor && normalize(line) === normalize(context));
          if (anchor !== -1) break;
        }
        if (anchor === -1) throw new Error('hunk function/class context was not found');
        searchStart = anchor + 1;
      }
      const before = [], after = [];
      let eof = false;
      while (lines.length && !lines[0].startsWith('@@') && !lines[0].startsWith('*** ')) {
        const line = lines.shift();
        if (![' ', '+', '-'].includes(line[0])) throw new Error('unsupported hunk line');
        if (line[0] !== '+') before.push(line.slice(1));
        if (line[0] !== '-') after.push(line.slice(1));
      }
      if (lines[0] === '*** End of File') { lines.shift(); eof = true; }
      if (!before.length && !after.length) throw new Error('each hunk needs content after its context marker');
      const matches = [];
      for (let i = searchStart; i <= source.length - before.length; i++) {
        if ((!eof || i + before.length === source.length) &&
            before.every((line, j) => source[i + j] === line)) matches.push(i);
      }
      // An insertion-only hunk is defined as append by apply_patch.
      if (!before.length) matches.splice(0, matches.length, source.length);
      if (matches.length !== 1) throw new Error('hunk context is missing or ambiguous; include unique exact context');
      const at = matches[0];
      result.push(...source.slice(cursor, at), ...after);
      cursor = at + before.length;
      hunks++;
    }
    if (!hunks) throw new Error('Update File needs a hunk');
    result.push(...source.slice(cursor));
    if (destination !== path) write(path, '');
    write(destination, result.join('\n') + '\n');
  }
  if (!edits.length) throw new Error('empty patch');
  return edits;
}
module.exports = { patchInputs };
