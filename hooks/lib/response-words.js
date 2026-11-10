// The word count of the agent's last answer in a turn, so factory can add the
// time the person spends reading it (factory requirement work-blocks,
// condition 7). Only the integer ever leaves this module.
//
// What is read: the local Claude Code transcript, scanned backwards from its
// end. User records are only classified (does a turn start here?) and never
// read further; tool results, thinking and tool calls are skipped by type.
// The text blocks of the last assistant message of the current turn are
// counted in memory and dropped. The text is never returned, stored, logged,
// cached, hashed or put in an error: any failure returns null and the caller
// sends no count at all.
//
// The person turns it off with CREW_READING_TIME=off.
const { scanTail, parse } = require("./transcript-tail");

const MAX_WORDS = 200000;
const MAX_TAIL = 16 * 1024 * 1024;

function readingTimeOn() {
  return (process.env.CREW_READING_TIME || "").toLowerCase() !== "off";
}

// Whitespace-separated tokens: the same rule factory documents for its
// 200 words/minute reading rate.
function countWords(text) {
  const words = String(text).trim().split(/\s+/);
  return words[0] === "" ? 0 : words.length;
}

const blocksOf = (rec) => (rec.message && Array.isArray(rec.message.content) ? rec.message.content : null);

// A user record that opens a turn: anything but a tool result.
function startsTurn(rec) {
  if (rec.type !== "user" || rec.isSidechain || rec.isMeta || rec.isCompactSummary) return false;
  const blocks = blocksOf(rec);
  return !(blocks && blocks.some((b) => b && b.type === "tool_result"));
}

const isAnswer = (rec) => rec.type === "assistant" && !rec.isSidechain && blocksOf(rec);

// Walks the records backwards. Returns the count, or undefined when the
// window ended before the answer was read whole and the file goes on.
function scan(lines, whole) {
  let target = null;
  let words = 0;
  for (let i = lines.length - 1; i >= 0; i--) {
    const rec = parse(lines[i]);
    if (!rec) continue;
    if (target !== null) {
      const sameMessage = isAnswer(rec) && rec.message.id === target;
      if (!sameMessage && (rec.type === "user" || rec.type === "assistant")) return words;
      if (sameMessage) words += textWords(rec);
      continue;
    }
    if (startsTurn(rec)) return 0;
    if (!isAnswer(rec)) continue;
    const found = textWords(rec);
    if (found === null) continue;
    if (!rec.message.id) return found;
    target = rec.message.id;
    words = found;
  }
  return target !== null && whole ? words : undefined;
}

// Words in the record's text blocks, or null when it carries none.
function textWords(rec) {
  const texts = blocksOf(rec).filter((b) => b && b.type === "text" && typeof b.text === "string");
  return texts.length ? texts.reduce((sum, b) => sum + countWords(b.text), 0) : null;
}

// The words of the turn's last answer as an integer in 0..MAX_WORDS, or null
// when it is turned off or cannot be read with certainty.
function lastAnswerWords(transcriptPath) {
  if (!readingTimeOn()) return null;
  const words = scanTail(transcriptPath, MAX_TAIL, scan);
  return Number.isInteger(words) && words >= 0 && words <= MAX_WORDS ? words : null;
}

// For a rebuild from transcripts: the words of an assistant record's text
// blocks, or null when it carries none (or is not a main-thread answer).
function answerRecordWords(rec) {
  return rec && isAnswer(rec) ? textWords(rec) : null;
}

module.exports = { lastAnswerWords, answerRecordWords, countWords, readingTimeOn, MAX_WORDS };
