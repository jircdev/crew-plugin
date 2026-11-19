// One desktop notification per capture problem, for the alerts that mean time
// is piling up on this machine (factory-alerts.js `loud`). It fires the first
// time the problem is seen and again only after it was fixed and came back.
// Best effort and detached: a missing notifier never delays or breaks the
// hook. CREW_NOTIFY=off turns it off.
//
// The text travels in an environment variable, never inside a command line,
// so nothing in it is ever parsed by a shell.
const fs = require("node:fs");
const { join } = require("node:path");
const { spawn } = require("node:child_process");

const FILE = "notice.json";
const TITLE = "crew · factory";
const WINDOWS = "[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null;" +
  "$t = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02);" +
  "$x = $t.GetElementsByTagName('text');" +
  "$x.Item(0).AppendChild($t.CreateTextNode($env:CREW_NOTICE_TITLE)) > $null;" +
  "$x.Item(1).AppendChild($t.CreateTextNode($env:CREW_NOTICE_TEXT)) > $null;" +
  "$id = '{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\\WindowsPowerShell\\v1.0\\powershell.exe';" +
  "[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($id).Show([Windows.UI.Notifications.ToastNotification]::new($t))";

// By absolute path: a bare name would let Windows pick a powershell.exe
// planted in the repository the session runs in.
const POWERSHELL = join(process.env.SystemRoot || "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe");

function command(text) {
  if (process.platform === "win32") return [POWERSHELL, ["-NoProfile", "-NonInteractive", "-Command", WINDOWS]];
  if (process.platform === "darwin") {
    return ["osascript", ["-e", 'display notification (system attribute "CREW_NOTICE_TEXT") with title (system attribute "CREW_NOTICE_TITLE")']];
  }
  return ["notify-send", [TITLE, text]];
}

// cwd is the owner-only activity folder, never the repository.
function show(text, dir) {
  const env = { ...process.env, CREW_NOTICE_TITLE: TITLE, CREW_NOTICE_TEXT: text };
  const [cmd, args] = command(text);
  const child = spawn(cmd, args, { env, cwd: dir, detached: true, stdio: "ignore", windowsHide: true });
  child.on("error", () => { /* no notifier on this machine */ });
  child.unref();
}

// alert: a loud factoryAlert result. dir: the owner-only activity folder.
// The record is cleared when factory takes the time again (activity-queue.js)
// or a new token is stored (factory.js), so a later problem notifies anew.
function noticeOnce(alert, dir) {
  const file = join(dir, FILE);
  let seen = null;
  try { seen = JSON.parse(fs.readFileSync(file, "utf8")).key; } catch { /* first time */ }
  if (seen === alert.key) return;
  fs.writeFileSync(file, JSON.stringify({ key: alert.key, at: new Date().toISOString() }), { mode: 0o600 });
  if ((process.env.CREW_NOTIFY || "").toLowerCase() === "off") return;
  try {
    show(alert.key === "expired" ? "The factory token expired: your captured time is waiting. Run /crew:factory login."
      : "Factory no longer accepts this machine's token: your captured time is waiting. Run /crew:factory login.", dir);
  } catch { /* best effort */ }
}

module.exports = { noticeOnce, NOTICE_FILE: FILE };
