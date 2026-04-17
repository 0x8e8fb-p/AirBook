import os
import hashlib

def get_hash(path):
    with open(path, 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()

hashes = {}
for root, _, files in os.walk('src'):
    for file in files:
        if file == '.DS_Store': continue
        path = os.path.join(root, file)
        h = get_hash(path)
        if h in hashes:
            hashes[h].append(path)
        else:
            hashes[h] = [path]

for h, paths in hashes.items():
    if len(paths) > 1:
        print(f"Duplicate found: {paths}")
