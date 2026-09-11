#!/usr/bin/env python3
import json
from datetime import datetime, timezone
from urllib.request import Request, urlopen

SOURCE = "https://raw.githubusercontent.com/MakkaPakka518/List/main/data/douban-hot.json"
OUTPUT = "data/douban-hot.json"
KEEP = ["tv", "tv_domestic", "tv_american", "tv_japanese", "tv_korean", "tv_animation", "show_domestic", "show_foreign"]

req = Request(SOURCE, headers={"User-Agent": "qiguo093-List-douban-sync/1.0"})
with urlopen(req, timeout=30) as r:
    source = json.load(r)
out = {"last_updated": datetime.now(timezone.utc).isoformat(), **{k: source.get(k, []) for k in KEEP}}
with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)
    f.write("\n")
print("updated", OUTPUT, "items", sum(len(out[k]) for k in KEEP))
