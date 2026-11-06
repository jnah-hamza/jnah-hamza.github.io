"""Convertit les images WebP utilisées par le portfolio en JPEG/PNG légers (dossier pdf/.cache)."""
import json, os, sys
from PIL import Image
root, cache = sys.argv[1], sys.argv[2]
srcs = json.load(open(os.path.join(cache, 'list.json')))
out = {}
for rel in srcs:
    im = Image.open(os.path.join(root, rel))
    alpha = im.mode in ('RGBA', 'LA') and im.getchannel('A').getextrema()[0] < 250
    big = 'portrait' in rel or 'fond' in rel or 'couverture' in rel or 'page-' in rel
    im.thumbnail((1300, 1300) if big else (800, 800))
    name = rel.replace('/', '_').rsplit('.', 1)[0]
    if alpha:
        name += '.png'; im.save(os.path.join(cache, name), optimize=True)
    else:
        name += '.jpg'; im.convert('RGB').save(os.path.join(cache, name), quality=74, optimize=True, progressive=True)
    out[rel] = name
json.dump(out, open(os.path.join(cache, 'map.json'), 'w'))
print('images compressées :', len(out))
