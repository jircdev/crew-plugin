# Working with factory — tasks and time

Some projects keep their tasks and their work time in factory, Baleares' management system. In those projects crew splits the work in two places: the repository keeps the **spec** (the story or requirement, with its acceptance criteria), and factory keeps the **task** (its estimate, its state and the hours spent on it). The two are tied together by one line in the header of the story. This page explains the circuit for the people who work in such a project.

## What changes for you

- You stop filling timestamps by hand. The plugin records when you and the agent were working, in the background, while you use Claude Code.
- Estimates are set and revised in factory. A story closes when it links its factory task; an `## Estimation` table is optional in this mode.
- Once a week you review the time the plugin captured and confirm it in factory. Nothing counts as worked time until you confirm it.

## Setting it up

**1. The project declares it (once, whoever configures the repository).** `crew.json` gets a `factory` block with the factory project id. Reference: [configuration.md](configuration.md#factory-mode).

**2. You create your personal token (once per person).** In factory, open **Mis horas → Conectar con la IA** and create a token. It starts with `fct_` and is shown once. Keep it in one of two places:

- the environment variable `FACTORY_TOKEN`, or
- the file `~/.crew/factory-token` (a single line with the token).

The token identifies you. It never goes into the repository or into `crew.json`.

**3. You connect the factory tools to Claude Code (once per person).** This lets the agent read the backlog, take a task, create one or log time on your behalf:

```
claude mcp add --transport http factory https://api.factory.balearesgroup.com/api/v1/mcp --header "Authorization: Bearer $FACTORY_TOKEN"
```

For the development environment, use `https://api.dev.factory.balearesgroup.com/api/v1/mcp`. The tools available are `list_projects`, `my_tasks`, `project_backlog`, `get_task`, `create_task`, `take_task`, `update_task`, `add_task_reference`, `log_time` and `my_week`.

## What is captured

Only **moments in time**. Each time Claude Code starts a session, receives a prompt from you, finishes answering, or ends the session, the plugin notes the time. From those moments it builds two kinds of interval:

- **Your presence**: the stretch between two consecutive moments, provided they are at most 15 minutes apart. A longer gap counts as a break and adds nothing.
- **The agent's work**: from the moment you send a prompt until the agent finishes answering.

Each interval carries the session id, the factory project, and the task you were working on. The task comes from the stories and requirements the agent edits during the session: the file's path identifies the work item, and its `**Factory task:**` header line, when present, identifies the factory task.

The content of your prompts, the agent's answers and the conversation transcript is never read or sent. Of the files you edit, the plugin looks only at the path, and for stories and requirements at the `**Factory task:**` line of the header.

Intervals wait in a local queue (`~/.crew/activity/queue.jsonl`) and are sent to factory when a session starts, when the agent finishes an answer, and when the session ends. Without a connection they stay queued and go out on the next attempt; sending never slows the session down or blocks it. Anything factory refuses is noted in `~/.crew/activity/errors.log`. Local state of sessions that ended abruptly is removed after 48 hours; queued intervals are kept until they are sent.

In Codex the same hooks run on the events Codex emits. The work item is taken from the file names in the header lines of each `apply_patch` (`*** Add File:`, `*** Update File:`, `*** Move to:`), which is how Codex describes an edit.

## Linking a story to its task

Add one line to the header of the story or requirement:

```
- **Factory task:** 3f0c9a52-8d1e-4c7a-9b6f-2a1d0e5c7b44
```

The agent can find the id with `project_backlog` or `my_tasks`, or create the task with `create_task` and add the line itself. From then on, time captured while that file is being edited is proposed for that task, and the story can be closed.

## Pausing capture

Any one of these is enough:

- `CREW_CAPTURE=off` in your environment pauses it for you, on this machine.
- `"capture": false` in the project's `crew.json` pauses it for everyone in the repository.
- Removing your token pauses it too.

While paused, the plugin writes nothing at all, not even locally.

## Your weekly review

Captured time is a proposal. Once a week, open **Mis horas** in factory: you will see the days the plugin assembled from your intervals, grouped by task. Adjust what needs adjusting (a task that got the wrong hours, a meeting that happened away from the keyboard) and confirm the week. Confirmed hours are the ones that count toward each task's consumed hours, the project's forecast and `/crew:metrics`.

## Seeing the numbers

`/crew:metrics` in a factory project prints the backlog with each task's original and current estimate, consumed hours and deviation, plus the project's approved, consumed, pending and forecast hours. Details in [metrics.md](metrics.md#factory-mode).
