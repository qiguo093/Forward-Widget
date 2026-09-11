#!/usr/bin/env python3
"""豆瓣榜单数据生成脚本
1. 同步豆瓣热榜 8 个分类（去掉纪录片）；
2. 抓取豆瓣「实时热门」subject_collection（电影 / 剧集），并用 TMDB 匹配海报与信息。
"""
import json
import os
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone

SOURCE = "https://raw.githubusercontent.com/MakkaPakka518/List/main/data/douban-hot.json"
OUTPUT = "data/douban-hot.json"
TMDB_API_KEY = os.environ.get("TMDB_API_KEY")

KEEP = ["tv", "tv_domestic", "tv_american", "tv_japanese", "tv_korean",
        "tv_animation", "show_domestic", "show_foreign"]

# 豆瓣实时热门 subject_collection
COLLECTIONS = [
    {"key": "movie_real_time_hotest", "media": "movie", "fallback": "电影实时热门"},
    {"key": "tv_real_time_hotest", "media": "tv", "fallback": "剧集实时热门"},
]

UA = ("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
      "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1")

GENRE_MAP = {
    28: "动作", 12: "冒险", 16: "动画", 35: "喜剧", 80: "犯罪", 99: "纪录片", 18: "剧情",
    10751: "家庭", 14: "奇幻", 36: "历史", 27: "恐怖", 10402: "音乐", 9648: "悬疑",
    10749: "爱情", 878: "科幻", 10770: "电视电影", 53: "惊悚", 10752: "战争", 37: "西部",
    10759: "动作冒险", 10762: "儿童", 10763: "新闻", 10764: "真人秀", 10765: "科幻奇幻",
    10766: "肥皂剧", 10767: "脱口秀", 10768: "战争政治",
}


def get_json(url, headers=None, retries=3, timeout=30):
    last = None
    for _ in range(retries):
        try:
            req = urllib.request.Request(url, headers=headers or {"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(2)
    raise RuntimeError(f"请求失败 {url}: {last}")


def fetch_collection(key, limit=20):
    """抓取豆瓣实时热门 collection 条目。"""
    items, start = [], 0
    while len(items) < limit:
        url = (f"https://m.douban.com/rexxar/api/v2/subject_collection/{key}/items"
               f"?start={start}&count=20&items_only=1&type_tag=")
        data = get_json(url, headers={"User-Agent": UA,
                                      "Referer": f"https://m.douban.com/subject_collection/{key}"})
        batch = data.get("subject_collection_items") or []
        if not batch:
            break
        items.extend(batch)
        start += len(batch)
        if start >= (data.get("total") or 0):
            break
    return items[:limit]


def tmdb_search(media, title, year):
    if not TMDB_API_KEY:
        return None
    params = {"query": title, "language": "zh-CN"}
    headers = {"User-Agent": "qiguo093-List/1.0"}
    if TMDB_API_KEY.startswith("eyJ"):
        headers["Authorization"] = f"Bearer {TMDB_API_KEY}"
    else:
        params["api_key"] = TMDB_API_KEY
    if year:
        params["first_air_date_year" if media == "tv" else "primary_release_year"] = year
    url = f"https://api.themoviedb.org/3/search/{media}?{urllib.parse.urlencode(params)}"
    try:
        data = get_json(url, headers=headers, retries=2)
    except Exception:  # noqa: BLE001
        return None
    for res in data.get("results", []):
        name = (res.get("name") or res.get("title") or "").strip().lower()
        query = title.strip().lower()
        if not name or not (query in name or name in query):
            continue
        if not res.get("poster_path") or not res.get("backdrop_path"):
            continue
        date = res.get("first_air_date") or res.get("release_date") or ""
        if year and date and not date.startswith(str(year)):
            continue
        genres = ",".join(GENRE_MAP.get(g, "") for g in res.get("genre_ids", []) if GENRE_MAP.get(g))
        return {
            "id": str(res.get("id")),
            "type": "tmdb",
            "title": res.get("name") or res.get("title") or title,
            "description": res.get("overview") or "",
            "rating": res.get("vote_average") or 0,
            "voteCount": res.get("vote_count") or 0,
            "popularity": res.get("popularity") or 0,
            "releaseDate": date,
            "lastUpdateDate": date,
            "posterPath": res["poster_path"],
            "backdropPath": res["backdrop_path"],
            "mediaType": media,
            "genreTitle": genres,
        }
    return None


def fallback_item(raw, media):
    """TMDB 未匹配时使用豆瓣原始信息兜底。"""
    pic = (raw.get("pic") or {}).get("large") or (raw.get("cover") or {}).get("url") or ""
    return {
        "id": str(raw.get("id")),
        "type": "douban",
        "title": raw.get("title") or "",
        "description": raw.get("description") or raw.get("card_subtitle") or "",
        "rating": (raw.get("rating") or {}).get("value") or 0,
        "voteCount": (raw.get("rating") or {}).get("count") or 0,
        "popularity": raw.get("score") or 0,
        "releaseDate": raw.get("release_year") or raw.get("year") or "",
        "lastUpdateDate": raw.get("year") or "",
        "posterPath": pic,
        "backdropPath": pic,
        "mediaType": media,
        "genreTitle": raw.get("type_name") or "",
        "doubanUrl": raw.get("url") or "",
    }


def build_collection(cfg):
    raw_items = fetch_collection(cfg["key"])
    if not raw_items:
        raise RuntimeError(f"{cfg['key']} 抓取为空")

    def convert(raw):
        year = (raw.get("year") or "").strip()
        item = tmdb_search(cfg["media"], raw.get("title") or "", year)
        return item or fallback_item(raw, cfg["media"])

    with ThreadPoolExecutor(max_workers=6) as pool:
        result = [x for x in pool.map(convert, raw_items) if x and x.get("posterPath")]
    print(f"  {cfg['key']}: 豆瓣 {len(raw_items)} 条 -> 输出 {len(result)} 条")
    return result


def main():
    src = get_json(SOURCE)
    out = {}
    for key in KEEP:
        out[key] = src.get(key, [])
    for cfg in COLLECTIONS:
        out[cfg["key"]] = build_collection(cfg)
    tz = timezone(timedelta(hours=8))
    out["last_updated"] = datetime.now(tz).strftime("%Y-%m-%d %H:%M:%S")

    total = sum(len(v) for k, v in out.items() if isinstance(v, list))
    if total == 0:
        raise SystemExit("数据为空，已中止写入，避免覆盖旧数据")
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"updated {OUTPUT} items {total}")


if __name__ == "__main__":
    main()
