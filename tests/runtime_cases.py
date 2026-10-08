"""Three host-runtime cases for the smoke, run against the real CLIs with the
loopback provider. Each records what the host actually did; assertions fail
only on crew's own promises, and every observation lands in the summary."""
import json
import subprocess
import sys
import uuid
from pathlib import Path
import runtime_codex
import runtime_provider as rp

TESTS = Path(__file__).resolve().parent
PLAN_TABLE = '## Plan\n\n| Hito | Est. horas |\n|---|---|\n| Revisión | 2 |\n'
OPEN_ITEM = ('# 001 — Smoke item\n\n- **Status:** In progress\n- **Plan:** p\n- **Date:** 2026-10-08\n- **Author role:** QA\n'
             '- **Branch:** main\n- **Depends on:** None\n\n## Estimation\n\n| Milestone | Est. hours | Started | Finished | Actual hours | Notes |\n'
             '|---|---|---|---|---|---|\n| Open smoke milestone | 1 | 2026-10-08 09:00 -03:00 | | | |\n| **Total** | 1 | — | — | | |\n')


def fixture(ctx, name, item=False):
    path = ctx['run']/name
    path.mkdir()
    (path/'crew.json').write_text(json.dumps({'mode': 'team', 'quality': 'enforce', 'configuredWith': ctx['version']}))
    if item:
        (path/'docs/requirements/p').mkdir(parents=True)
        (path/'docs/requirements/p/001-smoke.md').write_text(OPEN_ITEM, encoding='utf-8')
    subprocess.run(['git', 'init', '-q', str(path)], check=True)
    for key, value in [('user.name', 'Crew Smoke'), ('user.email', 'smoke@example.invalid')]:
        subprocess.run(['git', 'config', key, value], cwd=path, check=True)
    return path


def hook_log(path):
    return [json.loads(l) for l in path.read_text(encoding='utf-8').splitlines()] if path.exists() else []


def requests(ctx, prefix):
    return [json.loads(p.read_text(encoding='utf-8')) for p in sorted(ctx['run'].glob(f'{prefix}-request-*.json'),
            key=lambda p: int(p.stem.rsplit('-', 1)[1]))]


def run_codex(ctx, cwd, label, prompt, extra=(), env=None):
    env = {**ctx['codex_env'], **(env or {}), 'CREW_SMOKE_HOOK_LOG': str(ctx['run']/f'{label}-hooks.jsonl')}
    runtime_codex.trust(ctx['codex'], env, ctx['run'], cwd)
    result = subprocess.run(runtime_codex.exec_args(ctx['codex'], prompt, extra), env=env, cwd=cwd, input='',
                            capture_output=True, text=True, encoding='utf-8', timeout=120)
    (ctx['run']/f'{label}.stdout').write_text(result.stdout, encoding='utf-8')
    (ctx['run']/f'{label}.stderr').write_text(result.stderr, encoding='utf-8')
    return hook_log(ctx['run']/f'{label}-hooks.jsonl')


def shell_call(body, command):
    tool = next(t for t in body.get('tools', []) if t.get('name') in ('shell_command', 'exec_command', 'shell'))
    key = 'command' if 'command' in tool.get('parameters', {}).get('properties', {}) else 'cmd'
    return rp.function_call(tool['name'], {key: command}, 'call_shell')


def case_codex_no_verify(ctx):
    cwd = fixture(ctx, 'codex-shell-project')
    (cwd/'a.txt').write_text('staged\n')
    subprocess.run(['git', 'add', 'a.txt'], cwd=cwd, check=True)
    rp.use('codex', [lambda b: shell_call(b, 'git commit --no-verify -m smoke'), lambda b: rp.message('done')], 'codex-shell')
    events = run_codex(ctx, cwd, 'codex-shell', 'Controlled test: run the requested shell command once.')
    commits = subprocess.run(['git', 'rev-list', '--all', '--count'], cwd=cwd, capture_output=True, text=True).stdout.strip() or '0'
    follow = json.dumps(requests(ctx, 'codex-shell')[1:], ensure_ascii=False)
    tools = sorted({e['tool'] for e in events if e['event'] == 'PreToolUse' and e['tool']})
    return {'codexShellToolName': tools, 'codexShellInputKeys': sorted({k for e in events if e['tool'] in tools for k in (e['inputKeys'] or [])}),
            'codexNoVerifyDenied': commits == '0' and 'Hook bypass denied' in follow, 'codexCommitsAfter': int(commits)}


def case_codex_mcp(ctx):
    cwd = fixture(ctx, 'codex-mcp-project')
    calls = ctx['run']/'mcp-calls.jsonl'
    with (ctx['run']/'codex-home/config.toml').open('a', encoding='utf-8') as out:
        out.write(f"\n[mcp_servers.smokedocs]\ncommand = '{sys.executable}'\nargs = ['{TESTS/'runtime_mcp.py'}']\n"
                  f"[mcp_servers.smokedocs.env]\nCREW_SMOKE_MCP_LOG = '{calls}'\n")
    seen = {}

    # Codex 0.130 exposes MCP tools inside a namespace tool (`mcp__<server>__`);
    # the call names the inner tool and carries the namespace.
    def publish(body):
        found = [(t['name'], inner['name']) for t in body.get('tools', []) if t.get('type') == 'namespace'
                 for inner in t.get('tools', []) if inner.get('name') == 'publish']
        seen['tools'] = [ns + name for ns, name in found]
        if not found:
            return rp.message('no publish tool exposed')
        return {**rp.function_call(found[0][1], {'title': 'Plan', 'content': PLAN_TABLE}, 'call_publish'), 'namespace': found[0][0]}
    rp.use('codex', [publish, lambda b: rp.message('done')], 'codex-mcp')
    events = run_codex(ctx, cwd, 'codex-mcp', 'Controlled test: publish the plan page once.')
    follow = json.dumps(requests(ctx, 'codex-mcp')[1:], ensure_ascii=False)
    pre = sorted({e['tool'] for e in events if e['event'] == 'PreToolUse' and e['tool']})
    return {'codexMcpModelToolName': seen.get('tools'), 'codexMcpHookToolNames': pre,
            'codexMcpCalled': calls.exists(), 'codexMcpNoticeReachedModel': 'outside the repo' in follow}


def case_codex_compact(ctx):
    cwd = fixture(ctx, 'codex-compact-project', item=True)
    big = {'input_tokens': 190000, 'output_tokens': 20, 'total_tokens': 190020}
    rp.use('codex', [lambda b: (shell_call(b, 'echo compact-me'), big), lambda b: rp.message('Summary: one open milestone.'),
                     lambda b: rp.message('done')], 'codex-compact')
    events = run_codex(ctx, cwd, 'codex-compact', 'Controlled test: run one command, then finish.',
                       ('-c', 'model_auto_compact_token_limit=1000'))
    sent = [json.dumps(r, ensure_ascii=False) for r in requests(ctx, 'codex-compact')]
    stdout = (ctx['run']/'codex-compact.stdout').read_text(encoding='utf-8')
    return {'codexHookEvents': sorted({e['event'] for e in events}),
            'codexPreCompactFired': any(e['event'] == 'PreCompact' for e in events),
            'codexPreCompactSystemMessageShown': 'still open before compaction' in stdout,
            'codexSessionStartSources': sorted({str(e['source']) for e in events if e['event'] == 'SessionStart'}),
            'codexWorkInProgressAtStart': bool(sent) and 'crew — work in progress' in sent[0],
            'codexWorkInProgressAfterCompact': len(sent) > 2 and 'crew — work in progress' in sent[-1]}


def case_claude_compact(ctx):
    cwd = fixture(ctx, 'claude-compact-project', item=True)
    session = str(uuid.uuid4())
    env = {**ctx['claude_env'], 'CREW_SMOKE_HOOK_LOG': str(ctx['run']/'claude-compact-hooks.jsonl')}
    common = ['--plugin-dir', str(ctx['package']), '--setting-sources', 'project', '--strict-mcp-config',
              '--tools', 'Read', '--allowedTools', 'Read', '--permission-mode', 'dontAsk',
              '--output-format', 'stream-json', '--verbose', '--include-hook-events']
    read = {'type': 'tool_use', 'id': 'tool_read', 'name': 'Read', 'input': {'file_path': str(cwd/'docs/requirements/p/001-smoke.md')}}
    # Claude refuses to compact a short conversation: build three turns first.
    runs = []
    for turn in range(3):
        rp.use('claude', [lambda b: {**read, 'id': f'tool_read_{len(runs)}'}, lambda b: rp.text('Read it.')], f'claude-compact-t{turn}')
        resume = ['--session-id', session] if turn == 0 else ['--resume', session]
        runs.append(subprocess.run([ctx['claude'], '-p', f'Controlled test turn {turn}: read the work item.', *resume, *common],
                                   env=env, cwd=cwd, input='', capture_output=True, text=True, encoding='utf-8', timeout=120))
    rp.use('claude', [lambda b: rp.text('Summary: one open milestone in docs/requirements/p/001-smoke.md.')], 'claude-compact-c')
    second = subprocess.run([ctx['claude'], '-p', '/compact', '--resume', session, *common],
                            env=env, cwd=cwd, input='', capture_output=True, text=True, encoding='utf-8', timeout=120)
    for label, res in [*[(f'claude-compact-t{i}', r) for i, r in enumerate(runs)], ('claude-compact-c', second)]:
        (ctx['run']/f'{label}.stdout').write_text(res.stdout, encoding='utf-8')
        (ctx['run']/f'{label}.stderr').write_text(res.stderr, encoding='utf-8')
    stream = [json.loads(l) for l in second.stdout.splitlines() if l.startswith('{')]
    compacted = next((e.get('compact_result') for e in stream if 'compact_result' in e), 'no status')
    hook_out = ' '.join(json.dumps(e, ensure_ascii=False) for e in stream if 'hook' in json.dumps(e).lower())
    events = hook_log(ctx['run']/'claude-compact-hooks.jsonl')
    return {'claudeCompactResult': compacted,
            'claudeHookEvents': sorted({e['event'] for e in events}),
            'claudePreCompactFired': any(e['event'] == 'PreCompact' for e in events),
            'claudePreCompactSystemMessage': 'still open before compaction' in hook_out,
            'claudeSessionStartSources': sorted({str(e['source']) for e in events if e['event'] == 'SessionStart'}),
            'claudeWorkInProgressAfterCompact': 'crew — work in progress' in hook_out}
