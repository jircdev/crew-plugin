#!/usr/bin/env python3
"""Optional real-CLI smoke using a loopback deterministic provider, not real models.

Requires installed Claude Code and Codex CLIs. All config, plugin installs and
fixtures live beneath --output. Never imports or changes existing credentials.
The transport names gpt-5.5 only to select Codex's native apply_patch tool schema.
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
    run_root.mkdir(parents=True)
    runtime_provider.RUN = run_root
    # Strip inherited provider credentials and host overrides rather than copying auth.
    base = {k: v for k, v in os.environ.items()
            if not re.search('API_KEY|AUTH_TOKEN|ACCESS_TOKEN|ANTHROPIC|OPENAI|CLAUDE|CODEX', k, re.I)}
    version = json.loads((ROOT/'.claude-plugin/plugin.json').read_text(encoding='utf-8'))['version']
    package = run_root/'marketplace/plugins/crew'
    subprocess.run(['node', str(ROOT/'scripts/package-plugin.js'), str(package)], check=True)
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
    invoke('codex', [args.codex, 'plugin', 'marketplace', 'add', str(run_root/'marketplace')], codex_env, 'marketplace')
    installed = invoke('codex', [args.codex, 'plugin', 'add', 'crew@crew-smoke', '--json'], codex_env, 'install')
    assert json.loads(installed.stdout)['version'] == version
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
        invoke('codex', [args.codex, 'exec', '--ephemeral', '--json', '--dangerously-bypass-hook-trust',
                        '-c', 'model_provider="smoke"', '-c', 'model="gpt-5.5"', '-c', 'model_reasoning_effort="low"',
                        '--disable', 'code_mode', '--sandbox', 'danger-full-access',
                        'Controlled test: inspect Crew skills and attempt one invalid apply_patch. Do not bypass a hook denial.'],
               codex_env, 'codex-runtime')
    finally:
        server.shutdown()
        server.server_close()
    events = [json.loads(line) for line in (run_root/'claude-runtime.stdout').read_text(encoding='utf-8').splitlines() if line.startswith('{')]
    init = next(event for event in events if event.get('subtype') == 'init')
    skills = [name for name in init['skills'] if name.startswith('crew:')]
    agents = [name for name in init['agents'] if name.startswith('crew:')]
    assert len(skills) == 33 and len(agents) == 17
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
    summary = {'version': version, 'provider': 'loopback deterministic responses; no real model',
               'claudeSkills': len(skills), 'claudeAgents': len(agents), 'codexSkills': len(skills),
               'claudeWriteBlockedByCrew': True, 'codexPatchBlockedByCrew': True, 'fixturesUnchanged': True,
               'multiFilePatchRejectedAtomically': True,
               'functionContextPatchAppliedCorrectly': True,
               'hookTrust': 'Claude session-local plugin; Codex reviewed-source one-invocation trust bypass',
               'limits': 'No hosted upload, interactive trust UI, or real-model adherence test.'}
    (run_root/'summary.json').write_text(json.dumps(summary, indent=2)+'\n', encoding='utf-8')
    print(json.dumps(summary, indent=2))


if __name__ == '__main__':
    main()
