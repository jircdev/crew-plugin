// The one writer of crew.json's `factory` block. config.js stays the single
// interpreter: this only merges keys into the raw file, keeping every other
// key, the file's indentation and its trailing newline, and never writing a
// BOM.
const { readFileSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");

function indentOf(text) {
  const match = text.match(/\n([ \t]+)"/);
  return match ? match[1] : 2;
}

// Merges `patch` into the factory block of <dir>/crew.json and returns the
// block as written. Throws when the file is missing or is not a JSON object.
function writeFactoryBlock(dir, patch) {
  const file = join(dir, "crew.json");
  const text = readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("crew.json is not a JSON object");
  const current = parsed.factory && typeof parsed.factory === "object" && !Array.isArray(parsed.factory) ? parsed.factory : {};
  parsed.factory = { ...current, ...patch };
  writeFileSync(file, JSON.stringify(parsed, null, indentOf(text)) + (text.endsWith("\n") ? "\n" : ""));
  return parsed.factory;
}

module.exports = { writeFactoryBlock };
