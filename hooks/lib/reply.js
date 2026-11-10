// Reply shape: reads a Claude Code transcript (JSONL) and measures the reply
// that closed the turn against the baseline's "Reply shape" paragraph.
// Pure functions, so the Stop hook stays thin and the tests can feed text.
const LIMITS = { words: 250, tables: 1, headings: 2 };

// A request for a deliverable licenses length and structure.
const DELIVERABLE = /\b(reports?|informes?|plan(es|s)?|documents?|documentos?|docs?|detail(ed)?|detall\w*|specs?|guides?|gu[ií]as?|readme|changelog|write-?up|drafts?|borrador\w*|tutorial\w*)\b/i;

function textOf(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.filter((b) => b && b.type === "text").map((b) => b.text || "").join("\n");
}

const isToolResult = (content) => Array.isArray(content) && content.some((b) => b && b.type === "tool_result");
const hasToolUse = (content) => Array.isArray(content) && content.some((b) => b && b.type === "tool_use");

// The last prompt a person typed, and the assistant text written after the
// turn's last tool call (the closing message the person reads).
function lastTurn(jsonl) {
  let prompt = "";
  let reply = [];
  for (const line of jsonl.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let entry;
    try { entry = JSON.parse(line); } catch { continue; }
    const content = entry && entry.message && entry.message.content;
    if (entry.type === "user" && !entry.isMeta && !isToolResult(content)) {
      const text = textOf(content).trim();
      if (text && !text.startsWith("<")) { prompt = text; reply = []; }
    } else if (entry.type === "assistant") {
      if (hasToolUse(content)) { reply = []; continue; }
      const text = textOf(content).trim();
      if (text) reply.push(text);
    }
  }
  return { prompt, reply: reply.join("\n\n") };
}

function measure(reply) {
  const prose = reply.replace(/```[\s\S]*?```/g, "");
  const lines = prose.split(/\r?\n/);
  return {
    words: (prose.match(/[\p{L}\p{N}][\p{L}\p{N}'’.-]*/gu) || []).length,
    tables: lines.filter((l) => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(l)).length,
    headings: lines.filter((l) => /^\s{0,3}#{1,6}\s/.test(l)).length,
  };
}

// Returns the list of breaches, empty when the reply fits or a deliverable was asked.
function breaches(prompt, reply) {
  if (!reply || DELIVERABLE.test(prompt)) return [];
  const m = measure(reply);
  const out = [];
  if (m.words > LIMITS.words) out.push(`${m.words} words (limit ${LIMITS.words})`);
  if (m.tables > LIMITS.tables) out.push(`${m.tables} tables (limit ${LIMITS.tables})`);
  if (m.headings > LIMITS.headings) out.push(`${m.headings} headings (limit ${LIMITS.headings})`);
  return out;
}

module.exports = { LIMITS, DELIVERABLE, lastTurn, measure, breaches };
