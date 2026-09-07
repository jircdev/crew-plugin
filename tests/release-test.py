"""Version, archive, checksums and bilingual structure checks; no host installation."""
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('release_builder', ROOT/'scripts/build-release.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)

with tempfile.TemporaryDirectory(prefix='crew-release-test-') as temp:
    assets = builder.build(Path(temp)/'release')
    version = json.loads((ROOT/'.claude-plugin/plugin.json').read_text(encoding='utf-8'))['version']
    assert (assets/f'crew-{version}.plugin').read_bytes() == (assets/f'crew-{version}.zip').read_bytes()
    for line in (assets/'SHA256SUMS').read_text().splitlines():
        digest, name = line.split('  ')
        assert hashlib.sha256((assets/name).read_bytes()).hexdigest() == digest
    with zipfile.ZipFile(assets/f'crew-{version}.plugin') as archive:
        assert json.loads(archive.read('.claude-plugin/plugin.json'))['version'] == version
        assert json.loads(archive.read('.codex-plugin/plugin.json'))['version'] == version
        assert json.loads(archive.read('.claude-plugin/marketplace.json'))['plugins'][0]['version'] == version
        assert 'scripts/init-project.sh' in archive.namelist()
        assert not any(name.startswith(('bin/', '.git/', 'work/', 'tests/')) for name in archive.namelist())
    with zipfile.ZipFile(assets/f'crew-codex-{version}.zip') as archive:
        catalog = json.loads(archive.read('.agents/plugins/marketplace.json'))
        assert catalog['plugins'][0]['source']['path'] == './plugins/crew'
        assert json.loads(archive.read('plugins/crew/.codex-plugin/plugin.json'))['version'] == version
    assert [p.name for p in sorted((ROOT/'docs/es').glob('*.md'))] == [p.name for p in sorted((ROOT/'docs/en').glob('*.md'))]
    for file in ['compatibility.md', 'contributing.md']:
        en = (ROOT/'docs/en'/file).read_text(encoding='utf-8')
        es = (ROOT/'docs/es'/file).read_text(encoding='utf-8')
        assert re.findall(r'^#+ ', en, re.M) == re.findall(r'^#+ ', es, re.M), file
    # Canonical release archives must be deterministic for identical input bytes.
    other = builder.build(Path(temp)/'repeat')
    assert (other/'SHA256SUMS').read_bytes() == (assets/'SHA256SUMS').read_bytes()
print('Release versions, archives, checksums and bilingual structure passed.')
