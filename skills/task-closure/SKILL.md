---
name: task-closure
description: "The closing circuit of a task in a repository connected to factory: the agent closes the task, proposes the person hours, loads what the person confirms, and on later adjustments reopens the task and updates the record of that day and topic. Load WHEN a task or requirement you worked on is finished, BEFORE reporting it as done, and WHEN the person asks for changes on work already closed; triggers on 'done', 'finished', 'delivered', 'close this', 'one more change', 'adjust this', 'terminé', 'listo', 'cerrá la tarea', 'cargá las horas', 'falta un ajuste', 'cambiá esto'. Needs the factory MCP; without it, say so and skip."
---

# Task closure — closing a task and its hours

The agent closes and loads. If adjustments come later, it reopens and updates. Nobody has to remember to come back for a review step, and nothing stays open or overdue only because a person has not looked at it yet.

Factory's own MCP instructions carry the same rule; this skill is the procedure. It applies when the session has the factory tools (`whoami`, `update_activity`, `my_week`). Before the first close of a session, call `whoami` for the person's timezone and today.

## Closing

1. **Close the task.** When you consider it finished: `update_activity` with `action: complete`, on the activity you declared with `declare_work`. Do not wait for a review. Human review stops being a step to finish a task: a human review milestone of that task closes with it, and its time is part of the person hours below. Then update the work item's status in the repository as the project's standard asks.
2. **Read the time.** `my_week` with `activityId`, and find the record of today's `workDate`. Without `activityId` a full week can exceed what you can read. For a week other than the current one, send `weekStart`. The capture built it from the work blocks of the session. Its `hours` are the person's time and its `agentHours` are the agent's.
3. **Propose the person hours,** rounded to the nearest quarter of an hour, at least 0.25, in the person's language:

   > I calculated 1.5 h of your time on this task (agent: 0.4 h). Do you confirm them or adjust them?

   Agent hours are shown as data. They come from the capture, so never ask about them and never try to change them.
4. **Load what the person answered.**
   - A record exists for that task and day: `update_time` with its `recordId` and the hours.
   - No record: `log_time` with `activityId`, `workDate`, the hours and a one-sentence plain description of what was done.
   - Load only a number the person gave or confirmed.
5. **No answer never blocks.** Carry on with the session. The task stays closed and the capture's record stays a proposal for the person to resolve in Mis horas. A session without capture leaves no proposal: say so in one line, so the person can give a number or load it later.

## Adjustments after closing

When the person asks for a change on work you closed:

1. **Identify the task.** Look for its activity (the work item's `Factory activity` header, `find_activity_by_reference`, `project_backlog`) and check with `my_week` and its `activityId` whether it already has time loaded.
2. **Reopen it:** `update_activity` with `status: in_progress`, `eventKind: reopened` and a `note` saying what was asked. Call `declare_work` again, because closing ended the block and the capture needs the task back.
3. **Do the work and close it again,** then ask only about the new time: "How much of your time did this adjustment take? I calculated 0.5 h."
4. **Update the hours:**
   - Same day: `update_time` on that day's record, with the hours it had plus the new time.
   - Another day: that day's record if the capture made one, otherwise `log_time` against the same task.

## Rules factory enforces

- **Quarters of an hour.** `log_time` and `update_time` refuse anything else.
- **One record per person, task and day.** `log_time` refuses a second one, names the existing record and asks for `update_time`.
- **Only your own records.** `update_time` refuses someone else's. Hours of another person go through `log_time` with `personId` and wait for that person's confirmation.
- **A number the person gave stays.** After `update_time` the capture stops changing it, even if it equals the proposal. Every change is traced to the person and token.
- **A confirmed week reopens.** When `update_time`, `log_time`, `reclassify_time` or `classify_time` answers `weekReopened: true`, tell the person the week needs confirming again in Mis horas; factory also sends them a notice, because the captured hours of that week stop counting until then. That weekly confirmation stays the final close, and it is theirs: agents never confirm a week.
- **A locked month refuses the change.** The correction goes to the open month: tell the person.

## What to tell the person

One or two lines, in their language: the task closed, the hours loaded or left as a proposal, and the week reopened when that happened. Never present a proposal as loaded hours.
