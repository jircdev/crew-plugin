const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

// JSON.parse keeps only the last of two equal keys, so a duplicated hook
// event silently drops every handler in the earlier block. This scanner walks
// the raw text and reports each key that repeats inside the same object.
function duplicateKeys(text) {
  const found = [];
  let i = 0;
  const ws = () => { while (/\s/.test(text[i])) i++; };
  const string = () => {
    const start = i++;
    while (text[i] !== '"') i += text[i] === '\\' ? 2 : 1;
    i++;
    return JSON.parse(text.slice(start, i));
  };
  const value = (where) => {
    ws();
    if (text[i] === '{') {
      i++;
      const seen = new Set();
      ws();
      if (text[i] === '}') { i++; return; }
      for (;;) {
        ws();
        const key = string();
        if (seen.has(key)) found.push(`${where}.${key}`);
        seen.add(key);
        ws(); i++; // colon
        value(`${where}.${key}`);
        ws();
        if (text[i++] === '}') return;
      }
    }
    if (text[i] === '[') {
      i++;
      ws();
      if (text[i] === ']') { i++; return; }
      for (let n = 0; ; n++) {
        value(`${where}[${n}]`);
        ws();
        if (text[i++] === ']') return;
      }
    }
    if (text[i] === '"') return void string();
    while (i < text.length && !/[\s,}\]]/.test(text[i])) i++;
  };
  JSON.parse(text); // reject invalid JSON before scanning
  value('$');
  return found;
}

test('duplicate-key scanner finds repeats at any depth and ignores equal keys in sibling objects', () => {
  assert.deepEqual(duplicateKeys('{"a":1,"a":2}'), ['$.a']);
  assert.deepEqual(duplicateKeys('{"h":{"E":[{"x":"\\"}"}],"E":[]}}'), ['$.h.E']);
  assert.deepEqual(duplicateKeys('{"l":[{"k":1,"m":{"k":2,"k":3}}]}'), ['$.l[0].m.k']);
  assert.deepEqual(duplicateKeys('{"a":[{"k":1},{"k":2}],"b":{"k":true}}'), []);
});

test('hooks.json declares every key once at every level', () => {
  const text = fs.readFileSync(path.join(root, 'hooks/hooks.json'), 'utf8');
  assert.deepEqual(duplicateKeys(text), []);
});
