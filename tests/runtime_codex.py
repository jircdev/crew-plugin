"""Isolated Codex install for the runtime smoke, for the pinned CLI version.

Codex 0.130 has no `codex plugin add`: the app installs a plugin by copying it
to CODEX_HOME/plugins/cache/<marketplace>/<plugin>/<version>, and plugin hooks
run only with the `plugin_hooks` feature and an explicit per-hook trust entry
(`[hooks.state."<key>"] trusted_hash`). The smoke reproduces exactly that on the
package it just built and reviewed — the trust is written for those hashes only.
"""
import json
import queue
import shutil
import subprocess
import threading

PINNED_CODEX = '0.130.0-alpha.5'
FEATURES = ['--enable', 'plugin_hooks']


def version(codex, env):
    out = subprocess.run([codex, '--version'], env=env, capture_output=True, text=True, timeout=30).stdout.strip()
    return out.split()[-1] if out else ''


def install(codex, env, run_root, package, plugin_version):
    subprocess.run([codex, 'plugin', 'marketplace', 'add', str(run_root/'marketplace')], env=env, capture_output=True, check=True, timeout=60)
    shutil.copytree(package, run_root/'codex-home/plugins/cache/crew-smoke/crew'/plugin_version)
    with (run_root/'codex-home/config.toml').open('a', encoding='utf-8') as out:
        out.write('\n[plugins."crew@crew-smoke"]\nenabled = true\n')


def _server(codex, env):
    proc = subprocess.Popen([codex, 'app-server', *FEATURES], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                            stderr=subprocess.DEVNULL, env=env, text=True, encoding='utf-8')
    lines = queue.Queue()
    threading.Thread(target=lambda: [lines.put(l) for l in proc.stdout], daemon=True).start()

    def call(i, method, params):
        proc.stdin.write(json.dumps({'jsonrpc': '2.0', 'id': i, 'method': method, 'params': params}) + '\n')
        proc.stdin.flush()
        while True:
            msg = json.loads(lines.get(timeout=60))
            if msg.get('id') == i:
                return msg
    call(1, 'initialize', {'clientInfo': {'name': 'crew-smoke', 'version': '0'}})
    return proc, call


def hooks(codex, env, cwd):
    proc, call = _server(codex, env)
    try:
        return [h for d in call(2, 'hooks/list', {'cwd': str(cwd)})['result']['data'] for h in d['hooks']]
    finally:
        proc.kill()


def trust(codex, env, run_root, cwd):
    listed = [h for h in hooks(codex, env, cwd) if h.get('pluginId') == 'crew@crew-smoke']
    with (run_root/'codex-home/config.toml').open('a', encoding='utf-8') as out:
        for h in listed:
            if h['trustStatus'] == 'trusted':
                continue
            out.write(f'\n[hooks.state."{h["key"]}"]\ntrusted_hash = "{h["currentHash"]}"\n')
    states = {h['trustStatus'] for h in hooks(codex, env, cwd) if h.get('pluginId') == 'crew@crew-smoke'}
    assert states == {'trusted'}, f'Codex did not accept the hook trust: {states}'
    return len(listed)


def exec_args(codex, prompt, extra=()):
    return [codex, 'exec', '--ephemeral', '--json', *FEATURES, '-c', 'model_provider="smoke"', '-c', 'model="gpt-5.5"',
            '-c', 'model_reasoning_effort="low"', '--dangerously-bypass-approvals-and-sandbox', *extra, prompt]
