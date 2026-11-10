// Reads the end of a local transcript (.jsonl) in growing windows, so a hook
// at the end of a turn touches only the last part of a long session. The
// caller's `scan(lines, whole)` decides from whole lines; it returns
// undefined to ask for a larger window. Nothing read here is kept: the
// window lives only for the call.
const fs = require("node:fs");

const FIRST_CHUNK = 256 * 1024;

// The last `bytes` of the file, as whole lines (the first, possibly cut,
// line is dropped unless the window reaches the start of the file).
function tailLines(fd, size, bytes) {
  const start = Math.max(0, size - bytes);
  const buf = Buffer.alloc(size - start);
  fs.readSync(fd, buf, 0, buf.length, start);
  const lines = buf.toString("utf8").split("\n");
  return { lines: start > 0 ? lines.slice(1) : lines, whole: start === 0 };
}

// scan's answer, or null when the file cannot be read or the largest window
// (maxBytes) still leaves the scan undecided.
function scanTail(path, maxBytes, scan) {
  if (typeof path !== "string" || !path.endsWith(".jsonl")) return null;
  let fd;
  try {
    fd = fs.openSync(path, "r");
    const size = fs.fstatSync(fd).size;
    for (let bytes = FIRST_CHUNK; ; bytes *= 2) {
      const { lines, whole } = tailLines(fd, size, Math.min(bytes, maxBytes));
      const found = scan(lines, whole);
      if (found !== undefined) return found;
      if (whole || bytes >= maxBytes) return null;
    }
  } catch {
    return null;
  } finally {
    if (fd !== undefined) try { fs.closeSync(fd); } catch { /* already closed */ }
  }
}

function parse(line) {
  try {
    const rec = JSON.parse(line);
    return rec && typeof rec === "object" ? rec : null;
  } catch {
    return null;
  }
}

module.exports = { scanTail, parse };
