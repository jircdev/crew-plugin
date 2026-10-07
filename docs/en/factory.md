# Working with factory: activities and time

Some projects keep their work and their work time in factory, Baleares' management system. In those projects crew splits the work in two places. The repository keeps the **spec**: the story or requirement, with its acceptance criteria. Factory keeps the **activity**: its estimate, its state and the hours spent on it. One line in the header of the story ties the two together. This page explains the circuit for the people who work in such a project.

## What changes for you

- You stop filling timestamps by hand. While you use Claude Code or Codex, the plugin records in the background when you and the agent were working.
- Estimates are set and revised in factory. A story closes when it links its factory activity; an `## Estimation` table is optional in this mode.
- Once a week you review the time the plugin captured and confirm it in factory. Only confirmed time counts as worked time.

## Setting it up

**1. The project declares it (once, whoever configures the repository).** `crew.json` gets a `factory` block with the factory project id. That is enough to use factory's production environment. Reference: [configuration.md](configuration.md#factory-mode).

```json
{ "factory": { "projectId": "3f0c9a52-…" } }
```

**2. You connect your machine (once per person and machine).** In the chat, type:

```
/crew:factory login
```

Factory opens in the browser. Read what capture records, approve, and go back to the chat. Crew receives your personal token and keeps it in `~/.crew/factory-token`, readable only by your user. The token never appears in the chat. Never paste it there: anything written in the conversation is stored with it.

- `/crew:factory status` tells you which factory you are connected to, as whom, and when the token expires (after 90 days).
- `/crew:factory logout` revokes the token in factory and removes it from your machine.

Connecting is your choice, and it is what turns capture on for you. Without a token, the plugin records nothing about you, not even locally. Before a team turns capture on, its people must be formally notified (see factory's work-tracking guide).

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
| `prod` (default) | `https://api.factory.balearesgroup.com/api/v1` | `https://factory.balearesgroup.com` |
| `dev` | `https://api.dev.factory.balearesgroup.com/api/v1` | `https://dev.factory.balearesgroup.com` |

The project picks the environment in `crew.json` (`"environment": "dev"`, or a `url` for any other host). Your machine can override it without touching the shared file: `CREW_FACTORY_ENV=dev`, or `CREW_FACTORY_URL` with a full API base. Machine variables win over `crew.json`.

## What is captured

Only **moments in time**. The plugin notes the time when a session starts, when it receives a prompt from you, when the agent finishes answering, and when the session ends. From those moments it builds two kinds of interval:

- **Your time**: while you have the turn, from the start of the session or the end of the agent's answer until your next prompt. A turn longer than 15 minutes counts as a break and adds nothing.
- **The agent's work**: from the moment you send a prompt until the agent finishes answering, however long that takes. The two never overlap.

Each interval carries the session id, the factory project and the activity you were working on. The activity comes from the stories and requirements the agent edits during the session. The file's path is its reference in factory (`<folder of crew.json>:<path>`, linked with `add_task_reference` or `upsert_requirement`), and its `**Factory activity:**` header line, when present, names the factory activity directly.

The plugin never reads or sends the content of your prompts, the agent's answers or the conversation transcript. Of the files you edit, it looks only at the path, and for stories and requirements at the `**Factory activity:**` header line.

In Codex the same hooks run on the events Codex emits. The work item comes from the file names in each `apply_patch` (`*** Add File:`, `*** Update File:`, `*** Move to:`).

## When factory has a problem

A factory problem never breaks or slows your session. The capture hooks always finish silently, and they only talk to factory when a session starts, when the agent finishes an answer and when the session ends, with a 2.5-second limit.

| Situation | What happens |
|---|---|
| Factory does not answer, or answers with a server error | Intervals stay in a local queue (`~/.crew/activity/queue.jsonl`) and go out on the next attempt. Anything older than 45 days is discarded, matching factory's own retention. |
| Factory has no person record for your user | Intervals stay queued until an administrator links one. |
| Your token was revoked or expired | Capture pauses and the local queue is deleted, because revoking is how a person pauses capture. It resumes when you connect again. |
| Factory refuses an interval as invalid | That batch is discarded. |

Each of these leaves one line in `~/.crew/activity/errors.log`, with the time, the HTTP code and the number of intervals. The log never holds interval contents or tokens. When something needs your attention, the next session start shows one short line about it.

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
