"""Verify the downloaded historical preview without loading a simulator."""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import struct


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def checked_path(root, relative):
    relative = PurePosixPath(relative)
    if relative.is_absolute() or '..' in relative.parts:
        raise ValueError('Unsafe manifest path')
    path = root.joinpath(*relative.parts).resolve()
    if not path.is_relative_to(root) or not path.is_file():
        raise ValueError('Missing or external file: ' + str(relative))
    return path


def verify(root):
    root = Path(root).resolve()
    manifest = json.loads((root / 'MANIFEST.json').read_text())
    if manifest.get('kind') != 'historical_task_preview' or manifest.get('formal_benchmark') is not False:
        raise ValueError('Expected the historical preview manifest')
    listed = set()
    for entry in manifest['files']:
        name = entry['path']
        if name in listed:
            raise ValueError('Duplicate manifest entry: ' + name)
        listed.add(name)
        path = checked_path(root, name)
        if path.stat().st_size != entry['bytes'] or digest(path) != entry['sha256']:
            raise ValueError('Checksum/size mismatch: ' + name)
    checked = set()
    for line in (root / 'SHA256SUMS').read_text().splitlines():
        checksum, name = line.split('  ', 1)
        if name in checked or digest(checked_path(root, name)) != checksum:
            raise ValueError('Invalid checksum entry: ' + name)
        checked.add(name)
    if checked != listed | {'MANIFEST.json'}:
        raise ValueError('Checksum list and manifest disagree')
    fields = {'file_name', 'task_id', 'level', 'prompt_en', 'answer_format', 'protocol_id',
              'source_batch', 'review_status', 'formal_benchmark', 'image_budget',
              'action_budget', 'image_sha256'}
    rows = [json.loads(line) for line in (root / 'legacy_preview/metadata.jsonl').read_text().splitlines() if line.strip()]
    if len(rows) != 35 or len({row['task_id'] for row in rows}) != 35:
        raise ValueError('Expected 35 unique historical task IDs')
    images = set()
    for row in rows:
        if set(row) != fields:
            raise ValueError('Unexpected public metadata fields')
        if row['formal_benchmark'] is not False or row['action_budget'] != 0 or row['image_budget'] != 1:
            raise ValueError('Historical protocol changed')
        if row['protocol_id'] != 'legacy-l1-static-20260928':
            raise ValueError('Unexpected protocol')
        image_name = 'legacy_preview/' + row['file_name']
        path = checked_path(root, image_name)
        if image_name not in listed or digest(path) != row['image_sha256']:
            raise ValueError('Image identity mismatch')
        with path.open('rb') as stream:
            header = stream.read(24)
        if header[:8] != b'\x89PNG\r\n\x1a\n' or struct.unpack('>II', header[16:24]) != (1920, 1080):
            raise ValueError('Expected an original 1920x1080 PNG')
        images.add(image_name)
    if len(images) != 35:
        raise ValueError('Expected 35 distinct image files')
    return {'verified': True, 'tasks': len(rows), 'images': len(images),
            'files_checked': len(listed), 'formal_benchmark': False}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('dataset_dir', type=Path)
    print(json.dumps(verify(parser.parse_args().dataset_dir), indent=2))
