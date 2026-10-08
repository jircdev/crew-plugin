#!/usr/bin/env python3
"""Optional real-CLI smoke using a loopback deterministic provider, not real models.

Requires installed Claude Code and Codex CLIs; Codex must be the pinned version
(runtime_codex.PINNED_CODEX) because its plugin install and hook trust changed
between releases. All config, plugin installs and fixtures live beneath
--output. Never imports or changes existing credentials. The transport names
gpt-5.5 only to select Codex's native tool schemas. Host cases (shell bypass,
MCP publish, compaction) live in runtime_cases.py.
"""
import argparse
from http.server import ThreadingHTTPServer
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import threading
import runtime_cases
import runtime_codex
import runtime_provider

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--claude', default=shutil.which('claude'))
    parser.add_argument('--codex', default=shutil.which('codex'))
    args = parser.parse_args()
    run_root = args.output.resolve()
    if run_root.exists():
        raise ValueError('Choose a new output directory')
    if not args.claude or not args.codex:
        raise ValueError('Both CLIs are required; specify --claude and --codex if not on PATH')
    base_env = {k: v for k, v in os.environ.items() if not re.search('CODEX', k, re.I)}
    found = runtime_codex.version(args.codex, base_env)
    if found != runtime_codex.PINNED_CODEX:
        raise ValueError(f'Codex {found or "unknown"} found; this smoke is pinned to {runtime_codex.PINNED_CODEX}')
    run_root.mkdir(parents=True)
    runtime_provider.RUN = run_root
    # Strip inherited provider credentials and host overrides rather than copying auth.
    base = {k: v for k, v in os.environ.items()
            if not re.search('API_KEY|AUTH_TOKEN|ACCESS_TOKEN|ANTHROPIC|OPENAI|CLAUDE|CODEX', k, re.I)}
    version = json.loads((ROOT/'.claude-plugin/plugin.json').read_text(encoding='utf-8'))['version']
    package = run_root/'marketplace/plugins/crew'
    subprocess.run(['node', str(ROOT/'scripts/package-plugin.js'), str(package)], check=True)
    # Test-only recorder of what each host sends to hooks; isolated package only.
    shutil.copy(ROOT/'tests/runtime_recorder.js', package/'hooks/runtime_recorder.js')
    hooks = json.loads((package/'hooks/hooks.json').read_text(encoding='utf-8'))
    recorder = {'type': 'command', 'command': 'node "${CLAUDE_PLUGIN_ROOT}/hooks/runtime_recorder.js"'}
    for event in ['PreToolUse', 'PostToolUse', 'PreCompact', 'PostCompact', 'SessionStart', 'UserPromptSubmit']:
        hooks['hooks'].setdefault(event, []).insert(0, {'matcher': '.*', 'hooks': [recorder]} if 'Tool' in event else {'hooks': [recorder]})
    (package/'hooks/hooks.json').write_text(json.dumps(hooks, indent=2), encoding='utf-8')
    catalog = run_root/'marketplace/.agents/plugins/marketplace.json'
    catalog.parent.mkdir(parents=True)
    catalog.write_text(json.dumps({'name': 'crew-smoke', 'plugins': [
        {'name': 'crew', 'source': {'source': 'local', 'path': './plugins/crew'},
         'policy': {'installation': 'AVAILABLE', 'authentication': 'ON_INSTALL'}, 'category': 'Productivity'}]}))
    for host in ['claude', 'codex']:
        fixture = run_root/(host+'-project')
        (fixture/'docs/work/2026-09').mkdir(parents=True)
        (fixture/'docs/work/2026-09/2026-09-07-immutable.md').write_text('original immutable history\n')
        (fixture/'crew.json').write_text(json.dumps({'mode': 'solo', 'quality': 'enforce', 'configuredWith': version}))
        (fixture/'module.py').write_text('class A:\n    def first():\n        old\n    def second():\n        old\n')
        subprocess.run(['git', 'init', '-q', str(fixture)], check=True)
        (run_root/(host+'-home')).mkdir()
    codex_env = {**base, 'CODEX_HOME': str(run_root/'codex-home')}
    claude_env = {**base, 'CLAUDE_CONFIG_DIR': str(run_root/'claude-home'),
                  'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC': '1', 'CLAUDE_CODE_DISABLE_AUTO_MEMORY': '1'}
    git_bash = Path('C:/Program Files/Git/bin/bash.exe')
    if os.name == 'nt' and git_bash.exists():
        claude_env['CLAUDE_CODE_GIT_BASH_PATH'] = str(git_bash)

    def invoke(host, command, env, label, check=True):
        result = subprocess.run(command, env=env, cwd=run_root/(host+'-project'), input='',
                                capture_output=True, text=True, encoding='utf-8', timeout=50)
        (run_root/(label+'.stdout')).write_text(result.stdout, encoding='utf-8')
        (run_root/(label+'.stderr')).write_text(result.stderr, encoding='utf-8')
        if check and result.returncode:
            raise RuntimeError(f'{label} failed; inspect {label}.stderr')
        return result

    # No authentication writes; record unauthenticated isolated-profile status.
    invoke('claude', [args.claude, 'auth', 'status'], claude_env, 'claude-auth', False)
    invoke('codex', [args.codex, 'login', 'status'], codex_env, 'codex-auth', False)
    runtime_codex.install(args.codex, codex_env, run_root, package, version)
    server = ThreadingHTTPServer(('127.0.0.1', 0), runtime_provider.Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        url = f'http://127.0.0.1:{server.server_port}'
        claude_env.update(ANTHROPIC_BASE_URL=url, ANTHROPIC_API_KEY='local-smoke-placeholder')
        invoke('claude', [args.claude, '-p', 'Controlled test: read the role and history; attempt one invalid Write. Do not bypass a hook denial.',
                         '--plugin-dir', str(package), '--no-session-persistence', '--setting-sources', 'project',
                         '--strict-mcp-config', '--tools', 'Read,Write', '--allowedTools', 'Read,Write',
                         '--permission-mode', 'dontAsk', '--output-format', 'stream-json', '--verbose', '--include-hook-events'],
               claude_env, 'claude-runtime')
        config = run_root/'codex-home/config.toml'
        with config.open('a', encoding='utf-8') as out:
            out.write(f'''\n[model_providers.smoke]\nname = "Local deterministic smoke"\nbase_url = "{url}/v1"\nwire_api = "responses"\nrequires_openai_auth = false\nrequest_max_retries = 0\nstream_max_retries = 0\n[projects.'{run_root/'codex-project'}']\ntrust_level = "trusted"\n''')
        trusted = runtime_codex.trust(args.codex, codex_env, run_root, run_root/'codex-project')
        invoke('codex', runtime_codex.exec_args(args.codex, 'Controlled test: inspect Crew skills and attempt one invalid apply_patch. Do not bypass a hook denial.',
                                                ('--disable', 'code_mode')), codex_env, 'codex-runtime')
        ctx = {'run': run_root, 'version': version, 'codex': args.codex, 'codex_env': codex_env, 'claude': args.claude,
               'claude_env': claude_env, 'package': package}
        cases = {}
        for case in [runtime_cases.case_codex_no_verify, runtime_cases.case_codex_mcp,
                     runtime_cases.case_codex_compact, runtime_cases.case_claude_compact]:
            cases.update(case(ctx))
    finally:
        server.shutdown()
        server.server_close()
    events = [json.loads(line) for line in (run_root/'claude-runtime.stdout').read_text(encoding='utf-8').splitlines() if line.startswith('{')]
    init = next(event for event in events if event.get('subtype') == 'init')
    skills = [name for name in init['skills'] if name.startswith('crew:')]
    agents = [name for name in init['agents'] if name.startswith('crew:')]
    assert len(skills) == len(list((package/'skills').iterdir())) and len(agents) == len(list((package/'agents').iterdir())), (len(skills), len(agents))
    assert any(event.get('hook_event') == 'PreToolUse' and 'immutable once created' in event.get('stdout', '') for event in events)
    codex_request = json.loads((run_root/'codex-request-2.json').read_text(encoding='utf-8'))
    outputs = [item.get('output', '') for item in codex_request['input'] if item['type'] == 'custom_tool_call_output']
    assert any('Command blocked by PreToolUse hook' in text and 'immutable once created' in text for text in outputs)
    prompt = json.dumps(codex_request, ensure_ascii=False)
    for name in skills:
        assert name in prompt, f'Codex did not discover {name}'
    assert 'Crew plugin root' in prompt and '# Crew in Codex' in prompt
    for host in ['claude', 'codex']:
        assert (run_root/(host+'-project')/'docs/work/2026-09/2026-09-07-immutable.md').read_text() == 'original immutable history\n'
    assert not (run_root/'codex-project/should-not-exist.txt').exists(), 'Partial patch write before denial'
    assert (run_root/'codex-project/module.py').read_text() == 'class A:\n    def first():\n        old\n    def second():\n        changed\n'
    summary = {'version': version, 'codexVersion': runtime_codex.PINNED_CODEX, 'codexHooksTrusted': trusted,
               'claudeVersion': subprocess.run([args.claude, '--version'], capture_output=True, text=True).stdout.strip(),
               **cases,
               'provider': 'loopback deterministic responses; no real model',
               'claudeSkills': len(skills), 'claudeAgents': len(agents), 'codexSkills': len(skills),
               'claudeWriteBlockedByCrew': True, 'codexPatchBlockedByCrew': True, 'fixturesUnchanged': True,
               'multiFilePatchRejectedAtomically': True,
               'functionContextPatchAppliedCorrectly': True,
               'hookTrust': 'Claude session-local plugin; Codex per-hook trusted_hash written for the reviewed package',
               'limits': 'No hosted upload, interactive trust UI, or real-model adherence test.'}
    (run_root/'summary.json').write_text(json.dumps(summary, indent=2)+'\n', encoding='utf-8')
    print(json.dumps(summary, indent=2))


if __name__ == '__main__':
    main()
