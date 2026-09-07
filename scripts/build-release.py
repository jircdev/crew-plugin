#!/usr/bin/env python3
"""Build versioned ZIP/.plugin assets and a portable Codex marketplace.

The .plugin suffix is retained from Crew's Claude packaging convention (0.24).
It contains the same ZIP bytes as the .zip asset, with the manifest at root.
No profile, authentication, marketplace registration or remote is modified.
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def archive(source, target):
    with zipfile.ZipFile(target, 'w', compression=zipfile.ZIP_DEFLATED) as output:
        for file in sorted(source.rglob('*')):
            if not file.is_file():
                continue
            name = file.relative_to(source).as_posix()
            entry = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            entry.external_attr = (0o100755 if name.endswith('.sh') else 0o100644) << 16
            output.writestr(entry, file.read_bytes())
    with zipfile.ZipFile(target) as check:
        if check.testzip():
            raise ValueError('Corrupt release archive')


def build(destination):
    claude = json.loads((ROOT/'.claude-plugin/plugin.json').read_text(encoding='utf-8'))
    codex = json.loads((ROOT/'.codex-plugin/plugin.json').read_text(encoding='utf-8'))
    marketplace = json.loads((ROOT/'.claude-plugin/marketplace.json').read_text(encoding='utf-8'))
    version = claude['version']
    assert codex['version'] == marketplace['plugins'][0]['version'] == version
    assert f'## [{version}]' in (ROOT/'CHANGELOG.md').read_text(encoding='utf-8')
    if destination.exists():
        raise ValueError('Release destination must not exist; choose a new directory')
    subprocess.run(['node', str(ROOT/'scripts/package-plugin.js'), str(destination/'payload/crew')], check=True)
    package = destination/'payload/crew'
    assert not (package/'bin').exists(), 'Claude-hosted packages reject top-level bin/'
    assets = destination/'assets'
    assets.mkdir()
    zipped = assets/f'crew-{version}.zip'
    archive(package, zipped)
    shutil.copyfile(zipped, assets/f'crew-{version}.plugin')
    catalog_root = destination/'codex-marketplace'
    shutil.copytree(package, catalog_root/'plugins/crew')
    catalog = catalog_root/'.agents/plugins/marketplace.json'
    catalog.parent.mkdir(parents=True)
    catalog.write_text(json.dumps({
        'name': 'factory-crew', 'interface': {'displayName': 'Factory Crew'},
        'plugins': [{'name': 'crew', 'source': {'source': 'local', 'path': './plugins/crew'},
                     'policy': {'installation': 'AVAILABLE', 'authentication': 'ON_INSTALL'},
                     'category': 'Productivity'}],
    }, indent=2)+'\n', encoding='utf-8')
    archive(catalog_root, assets/f'crew-codex-{version}.zip')
    hashes = [f'{hashlib.sha256(file.read_bytes()).hexdigest()}  {file.name}' for file in sorted(assets.iterdir())]
    (assets/'SHA256SUMS').write_text('\n'.join(hashes)+'\n', encoding='utf-8')
    print(assets)
    return assets


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True, type=Path)
    build(parser.parse_args().output.resolve())
