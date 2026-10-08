# The crew for non-developers

Every other page in these docs assumes a developer. This one doesn't. If you are a CEO, a commercial lead, or an analyst working on a project that uses the crew, this page tells you which roles are yours, how to talk to them, which documents you own, and where the boundaries are.

## How to invoke a role

There are two equivalent ways; both start a conversation with a specialist.

**Slash command.** In a Claude Code session, type the command and your request: `/crew:com I need a manifesto for the new client`. The part after `/crew:` is the role's short name.

**Alias prefix.** Start any message with the role's alias in capitals and a colon: `COM: I need a manifesto for the new client`. Same effect, no command needed — useful mid-conversation.

Either way, you write in plain language. The role answers in plain language too; if it doesn't, say so.

## CEO / commercial profile

**Your roles.**

| Role | Invoke with | Use it for |
|---|---|---|
| commercial-strategist | `/crew:com` or `COM:` | Client discovery, judging whether something is worth doing in business terms, the project manifesto, the public web's message |
| analytics-architect | `/crew:ana` or `ANA:` | Product-metrics questions: what to measure, which KPIs, whether the funnel says what you think it says |

**Your artifacts.** The manifestos in `docs/briefs/` — narrative documents written for people to read. You can read them, comment on them, and approve them. A manifesto you approve is what the technical team aligns on.

**Reviewing without git on your machine.** You don't need any developer tooling. Your repository host (GitHub or GitLab) shows every file in a web browser: open the repository page, navigate into `docs/briefs/` or `docs/stories/`, and click a file. Briefs and stories are plain markdown — they render as formatted text, readable as any web page.

**What you must not touch.**

- The estimation tables inside stories — they are added and filled at planning by whoever implements the work.
- `docs/work/` — the historical record of what was done; it is append-only evidence.
- Code and `standards/` — the technical team's domain.

## Analysts

**Your roles.**

| Role | Invoke with | Use it for |
|---|---|---|
| functional-analyst | `/crew:fa` or `FA:` | Turning requirements into stories with acceptance criteria and test scenarios |
| delivery-coordinator | `/crew:coord` or `COORD:` | Sequencing the work, tracking progress, surfacing and clearing blockers |

**Your artifacts.** The items in `docs/stories/` and `docs/requirements/`. You author them and edit them freely through their whole life — until they reach **Closed**, at which point they become immutable history.

**The Ready gate.** A story cannot enter implementation until its acceptance criteria are complete and unambiguous **and** it has at least one test scenario. That gate is yours to satisfy; a story that fails it bounces back.

**The estimation table.** A story is written without one — hours are not the analyst's deliverable. At planning, when the story is taken for implementation, **whoever executes** adds the `## Estimation` table (milestones, estimated hours) before coding, and writes the timestamps **in real time** — at the moment work starts and finishes, never reconstructed later. Project-level rough sizing lives in the brief.

**Reviewing without git.** Same as above: your host's web UI (GitHub/GitLab file view) renders every story and requirement as readable formatted text.

**What you must not touch.**

- **Closed** items — once closed, they are immutable; corrections happen in a new item that references the old one.
- `docs/work/` entries — the execution record belongs to whoever executed.
- Code — describing behavior is your job; implementing it is not.

## If you need something outside your lane

Ask the role you have. Every role knows the full catalog and will pull in the right specialist — you never need to know who owns what on the technical side.
