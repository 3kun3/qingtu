# -*- coding: utf-8 -*-
# Survey Wikimedia images for all POIs in js/cities/*.js shards.
import re, os, csv, glob, time
import requests

S = requests.Session()
S.headers['User-Agent'] = 'QingtuPOIImageSurvey/1.0 (student competition project)'
ZH = 'https://zh.wikipedia.org/w/api.php'
CM = 'https://commons.wikimedia.org/w/api.php'

def api(url, params):
    for t in range(4):
        try:
            r = S.get(url, params=params, timeout=30)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            print('retry', url, e, flush=True)
            time.sleep(2 * (t + 1))
    return None

def chunks(lst, n):
    for i in range(0, len(lst), n):
        yield lst[i:i + n]

pois = []
for fp in sorted(glob.glob('js/cities/*.js')):
    raw = open(fp, encoding='utf-8').read()
    m = re.search(r'"name":"([^"]+)"', raw)
    city = m.group(1) if m else os.path.basename(fp)[:-3]
    for mm in re.finditer(r'"id":"([a-z]+\d+)","name":"([^"]+)"', raw):
        pois.append((city, mm.group(1), mm.group(2)))
names = sorted({p[2] for p in pois})
print('POIs', len(pois), 'unique names', len(names), flush=True)

found = {}
for ch in chunks(names, 50):
    j = api(ZH, {'action': 'query', 'format': 'json', 'redirects': 1,
                 'prop': 'pageimages', 'piprop': 'original', 'titles': '|'.join(ch)})
    if not j:
        continue
    q = j.get('query', {})
    mp = {}
    for p in q.get('normalized', []):
        mp[p['from']] = p['to']
    for p in q.get('redirects', []):
        mp[p['from']] = p['to']
    pages = {p['title']: p for p in q.get('pages', [])}
    for n in ch:
        cur, g = n, 0
        while cur in mp and g < 10:
            cur = mp[cur]; g += 1
        pg = pages.get(cur)
        src = ''
        if pg and pg.get('original'):
            src = pg['original'].get('source', '')
        if 'upload.wikimedia.org/wikipedia/commons/' in src:
            found[n] = {'article': cur, 'url': src, 'file': None, 'src_type': 'zhwiki'}
    time.sleep(0.15)
print('pass1 found', len(found), flush=True)

miss = [n for n in names if n not in found]
for i, n in enumerate(miss):
    j = api(CM, {'action': 'query', 'format': 'json', 'list': 'search',
                 'srnamespace': 6, 'srlimit': 1, 'srsearch': n})
    hits = (j or {}).get('query', {}).get('search', [])
    if hits and hits[0].get('title', '').startswith('File:'):
        found[n] = {'article': '', 'url': '', 'file': hits[0]['title'], 'src_type': 'commons'}
    if i % 100 == 0:
        print('pass2', i, '/', len(miss), 'total found', len(found), flush=True)
    time.sleep(0.1)
print('pass2 found', len(found), flush=True)

for n, e in found.items():
    if not e['file']:
        seg = e['url'].split('/')[-1]
        e['file'] = 'File:' + requests.utils.unquote(seg)

files = sorted({e['file'] for e in found.values()})
info = {}
for ch in chunks(files, 50):
    j = api(CM, {'action': 'query', 'format': 'json', 'prop': 'imageinfo',
                 'iiprop': 'url|extmetadata', 'titles': '|'.join(ch)})
    if not j:
        continue
    for p in j.get('query', {}).get('pages', []):
        ii = (p.get('imageinfo') or [None])[0]
        if not ii:
            continue
        em = ii.get('extmetadata') or {}
        artist = re.sub(r'<[^>]*>', '', (em.get('Artist') or {}).get('value', '')).strip()
        info[p['title']] = {
            'url': ii.get('url', ''),
            'desc': ii.get('descriptionurl', ''),
            'lic': (em.get('LicenseShortName') or {}).get('value', ''),
            'artist': artist,
        }
    time.sleep(0.15)
print('file info resolved', len(info), '/', len(files), flush=True)

os.makedirs('_poidata', exist_ok=True)
with open('_poidata/poi_images.csv', 'w', newline='', encoding='utf-8-sig') as f:
    w = csv.writer(f)
    w.writerow(['城市', '点位ID', '景点名', '匹配条目', '文件名', '图片直链', '许可协议', '作者署名', '文件页(来源记录)', '来源方式'])
    for city, pid, name in pois:
        e = found.get(name)
        if not e:
            continue
        fi = info.get(e['file'], {})
        w.writerow([city, pid, name, e['article'], e['file'],
                    fi.get('url') or e['url'], fi.get('lic', ''), fi.get('artist', ''),
                    fi.get('desc', ''), e['src_type']])
with open('_poidata/poi_images_missing.csv', 'w', newline='', encoding='utf-8-sig') as f:
    w = csv.writer(f)
    w.writerow(['城市', '点位ID', '景点名'])
    for city, pid, name in pois:
        if name not in found:
            w.writerow([city, pid, name])
print('DONE total_pois', len(pois), 'found_names', len(found), 'missing_names', len(names) - len(found), flush=True)
