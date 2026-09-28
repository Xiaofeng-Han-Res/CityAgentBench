#!/usr/bin/env python3
"""Assemble Pages content, including checksum-verified release assets."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil


def sha256(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--assets', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    manifest = json.loads((root / 'release-assets.json').read_text())
    if args.output.exists():
        raise SystemExit(f'Refusing to overwrite existing output: {args.output}')
    for asset in manifest['assets']:
        path = args.assets / asset['name']
        if not path.is_file() or sha256(path) != asset['sha256']:
            raise SystemExit(f'Missing or incorrect release asset: {asset["name"]}')
    shutil.copytree(root / 'site', args.output)
    for asset in manifest['assets']:
        target = args.output / asset['site_path']
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(args.assets / asset['name'], target)
    files = list(args.output.rglob('*'))
    if any(p.is_symlink() or (p.is_file() and p.stat().st_nlink != 1) for p in files):
        raise SystemExit('The Pages artifact must not contain symlinks or hard links.')
    print(json.dumps({'files': sum(p.is_file() for p in files),
                      'bytes': sum(p.stat().st_size for p in files if p.is_file()),
                      'release_assets_verified': True}))


if __name__ == '__main__':
    main()
