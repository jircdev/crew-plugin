# Working with factory: activities and time

Some projects keep their work and their work time in factory, Baleares' management system. In those projects crew splits the work in two places. The repository keeps the **spec**: the story or requirement, with its acceptance criteria. Factory keeps the **activity**: its estimate, its state and the hours spent on it. One line in the header of the story ties the two together. This page explains the circuit for the people who work in such a project.

## What changes for you

- You stop filling timestamps by hand. While you use Claude Code or Codex, the plugin records in the background when you and the agent were working.
- Estimates are set and revised in factory. A story closes when it links its factory activity; an `## Estimation` table is optional in this mode.
- Once a week you review the time the plugin captured and confirm it in factory. Only confirmed time counts as worked time.

## Setting it up

Two steps, both typed in the chat. The first is once per machine; the second is once per repository, and whoever does it first commits the result for the team.

**1. Connect your machine.**

```
/crew:factory login
```

Factory opens in the browser. Read what capture records, approve, and go back to the chat. Crew receives your personal token and keeps it in `~/.crew/factory-token`, readable only by your user, together with the date it expires and the date you connected. The token never appears in the chat. Never paste it there: anything written in the conversation is stored with it.

Connecting is your choice, and it is what turns capture on for you. Without a token, the plugin records nothing about you, not even locally. Before a team turns capture on, its people must be formally notified (see factory's work-tracking guide). Until factory has that notice on record, the approval page shows capture as blocked and the login ends without connecting; ask Gestión for the formal notice.

**2. Link the repository to its factory project.**

```
/crew:factory link
```

The agent shows the factory projects you take part in, by name and id. Tell it which one this repository works for. It asks before writing, because `crew.json` is shared by the whole team, and then adds the project id to the file's `factory` block. Commit `crew.json` so everyone else skips this step. The repository needs a `crew.json` first; if it has none, run `/crew:setup`.

```json
{ "factory": { "projectId": "3f0c9a52-…" } }
```

**Factory's production environment is not ready yet.** For now the team works against `dev`: set `CREW_FACTORY_ENV=dev` on your machine before the login, and the first person to link the repository adds `--set-environment` so `crew.json` gets `"environment": "dev"` along with the project id.

Project ids differ between factory's environments. When your machine points at another environment than the one in `crew.json` (see [Which factory you talk to](#which-factory-you-talk-to)), `link` stops and says so; it writes the environment into `crew.json` only when you ask for it. A repository already linked to another project changes only on request, too.

**Checking and disconnecting.**

- `/crew:factory status` tells you which factory you are connected to, as whom, when the token expires (after 90 days), how much captured time is waiting on your machine, and which project the current repository is linked to.
- `/crew:factory logout` revokes the token in factory and removes it from your machine, together with any time still waiting to be sent.

A repository that should never be captured says so in its `crew.json` with `"factory": { "capture": false }`. That also silences the reminder to link it.

**Manual fallback.** You can also create the token in factory (**Mis horas → Conectar con la IA**, shown once) and put it in the `FACTORY_TOKEN` environment variable or in `~/.crew/factory-token`, typing it in your own terminal.

**What you need in factory.** A person record linked to your user, the `my-hours.register` permission (every profile has it), and to take part in the project, as its lead or through an assigned squad. Hours are proposed only on activities that hang from an approved package.

**3. Optional: the factory tools for the agent.** Factory also offers MCP tools so the agent can read the backlog, create activities or log time on your behalf. The tools you see depend on your profile: `whoami`, `list_projects`, `agenda`, `get_activity`, `project_backlog`, `create_activity`, `update_activity`, `assign`, `add_task_reference`, `upsert_requirement`, `log_time`, `reclassify_time`, `my_week`, `unclassified_time`, `classify_time`, `find_people`, and the package tools (`list_cost_centers`, `upsert_cost_center`, `approve_cost_center`). Claude Code reads the token from the environment:

```
claude mcp add --transport http factory https://api.factory.balearesgroup.com/api/v1/mcp --header "Authorization: Bearer ${FACTORY_TOKEN}"
```

In Codex, add the server to `~/.codex/config.toml` with `url = "https://api.factory.balearesgroup.com/api/v1/mcp"` and `bearer_token_env_var = "FACTORY_TOKEN"`. For the development environment, use `api.dev.factory.balearesgroup.com`.

## Which factory you talk to

| Environment | API | Web |
|---|---|---|
| `prod` (default; not ready yet) | `https://api.factory.balearesgroup.com/api/v1` | `https://factory.balearesgroup.com` |
| `dev` | `https://api.dev.factory.balearesgroup.com/api/v1` | `https://dev.factory.balearesgroup.com` |

The project picks the environment in `crew.json` (`"environment": "dev"`, or a `url` for any other host). Your machine can override it without touching the shared file: `CREW_FACTORY_ENV=dev`, or `CREW_FACTORY_URL` with a full API base. Machine variables win over `crew.json`.

There is one token per machine (`~/.crew/factory-token`). If you switch environments, `/crew:factory login` against the new one replaces the previous token, and going back needs another login. `/crew:factory status` says which environment you are connected to.

## What is captured

Only **moments in time**. The plugin notes the time when a session starts, when it receives a prompt from you, when the agent finishes answering, and when the session ends. From those moments it builds two kinds of interval:

- **Your time**: while you have the turn, from the start of the session or the end of the agent's answer until your next prompt. A turn longer than 15 minutes counts as a break and adds nothing.
- **The agent's work**: from the moment you send a prompt until the agent finishes answering, however long that takes. The two never overlap.

Each interval carries the session id, the factory project and the activity you were working on. The activity comes from the stories and requirements the agent edits during the session. The file's path is its reference in factory (`<folder of crew.json>:<path>`, linked with `add_task_reference` or `upsert_requirement`), and its `**Factory activity:**` header line, when present, names the factory activity directly.

The plugin never reads or sends the content of your prompts, the agent's answers or the conversation transcript. Of the files you edit, it looks only at the path, and for stories and requirements at the `**Factory activity:**` header line.

In Codex the same hooks run on the events Codex emits. The work item comes from the file names in each `apply_patch` (`*** Add File:`, `*** Update File:`, `*** Move to:`).

## When factory has a problem

A factory problem never breaks or slows your session. The capture hooks only talk to factory when a session starts, when the agent finishes an answer and when the session ends, with a 2.5-second limit.

| Situation | What happens |
|---|---|
| Factory does not answer, or answers with a server error | Intervals stay in a local queue (`~/.crew/activity/queue.jsonl`) and go out on the next attempt. Anything older than 45 days is discarded, matching factory's own retention. |
| Factory has no person record for your user | Intervals stay queued until Gestión links one. |
| Your token expired | Capture keeps recording on your machine, because the expiry date is one you never chose. Nothing is sent until you run `/crew:factory login` again; that login sends the queue at once, as long as factory confirms it is the same person on the same factory. Time queued for another account or another factory is discarded. When factory cannot say who you are at that login, the time is kept aside until a login that can. |
| Your token was revoked (by you or by an administrator) | Capture pauses and the local queue is deleted, because revoking is how a person pauses capture. It resumes when you connect again. |
| Factory refuses an interval as invalid | That batch is discarded. |

Crew tells an expired token from a revoked one by the expiry date the login stored. A token created by hand in factory has no stored date, so when factory refuses it, crew treats it as revoked.

Each of these leaves one line in `~/.crew/activity/errors.log`, with the time, the HTTP code and the number of intervals. The log never holds interval contents or tokens. The whole `~/.crew/activity/` folder is readable by your user only, since it describes when you work.

**What you see.** When capture needs you, a one-line message from crew appears in your session: at the start of a session, and at the end of an answer when sending meets a new problem. It shows up in five situations, each with the command that solves it:

- **Token revoked**: factory refused the token before its expiry date. Run `/crew:factory login`.
- **Token expired**: the token passed its expiry date. Your time is still being recorded; run `/crew:factory login` to send it.
- **Token about to expire**: less than seven days remain. Logging in again before then keeps capture running without a gap.
- **No person record**: factory has no person linked to your user. Ask Gestión to link one; the time waits in the queue meanwhile.
- **Repository not linked**: you are connected and the repository has a `crew.json` without a factory project. Run `/crew:factory link`, or turn capture off for that repository.

A factory that does not answer, or answers with an error, fixes itself and keeps the time queued, so it gets no message of its own. The agent receives the same sentences at session start, so it can help you act on them.

## Recovering lost time

When capture lost time (a token expired before this version kept it, a repository worked on before it was linked), it can be rebuilt from the transcripts Claude Code keeps on your machine. Run it from the linked repository:

```
/crew:factory backfill
```

The agent first shows a summary: for each day, your time, the agent's time and the number of intervals. Nothing is sent until you look at it and say yes. It applies the same rules as live capture, so the result is what capture would have recorded, with one refinement: a silence of more than 15 minutes inside an agent's answer (a tool waiting for you, a machine asleep) is left out. Only turns you started count; a turn opened by a notification or another session adds no agent time.

What it reads and what it sends:

- It reads only your own transcripts (`~/.claude/projects/`, or `$CLAUDE_CONFIG_DIR/projects/`), and from them only the sessions whose working folder is this repository, with the time of each record and the paths of the files the agent edited.
- It sends the same fields live capture sends. The content of your prompts, the agent's answers and the tool results stays on your machine: the rebuild never copies it to another file or shows it in the chat.
- It covers the time since you connected to factory, within factory's 45 days. When this machine does not know your connection date, the agent asks for the first day you agreed to capture (`--since YYYY-MM-DD`).
- Running it twice adds nothing twice: each rebuilt interval gets the same id every time.

**Sending is closed in this version.** Factory adds up agent time without merging stretches that overlap, so time live capture already sent would count twice. The summary works today; sending opens when factory counts agent time once per session. Codex transcripts are not read yet.

## Linking a story to its activity

Add one line to the header of the story or requirement:

```
- **Factory activity:** 3f0c9a52-8d1e-4c7a-9b6f-2a1d0e5c7b44
```

`**Factory task:**` is accepted too, for work items written before factory called them activities. The agent can find the id with `project_backlog`, `agenda` or `get_activity`, or create the activity with `create_activity` (or `upsert_requirement` for a requirement) and add the line itself. From then on, time captured while that file is being edited is proposed for that activity, and the story can be closed.

## Pausing capture

Any one of these is enough:

- `CREW_CAPTURE=off` in your environment pauses it for you, on this machine.
- `"capture": false` in the project's `crew.json` pauses it for everyone in the repository.
- `/crew:factory logout`, or revoking the token in factory, pauses it for you everywhere.

While paused, the plugin writes nothing at all, not even locally.

## Your weekly review

Captured time is a proposal. Once a week, open **Mis horas** in factory. You will see the days the plugin assembled from your intervals, grouped by activity. Adjust what needs adjusting (an activity that got the wrong hours, a meeting that happened away from the keyboard) and confirm the week. Confirmed hours are the ones that count toward each activity's consumed hours, the project's forecast and `/crew:metrics`.

## Seeing the numbers

`/crew:metrics` in a factory project prints the backlog as a tree of activities, with each one's original and current estimate, its own consumed hours and its deviation, plus the project's quoted, consumed, pending and forecast hours. When factory cannot answer, it shows the local report after a one-line notice. Details in [metrics.md](metrics.md#factory-mode).
