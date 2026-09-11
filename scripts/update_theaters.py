import asyncio
import aiohttp
from bs4 import BeautifulSoup
import json
import os
import re
import datetime

# --- 配置区 ---
TMDB_API_KEY = os.environ.get('TMDB_API_KEY')
DATA_DIR = "data"
OUTPUT_FILE = os.path.join(DATA_DIR, "theater-data.json")
MAX_FETCH_RETRIES = 3
REQUEST_TIMEOUT = aiohttp.ClientTimeout(total=45)

# TMDB 类型映射表
GENRE_MAP = {
    28: "动作", 12: "冒险", 16: "动画", 35: "喜剧", 80: "犯罪", 99: "纪录片", 18: "剧情", 
    10751: "家庭", 14: "奇幻", 36: "历史", 27: "恐怖", 10402: "音乐", 9648: "悬疑", 
    10749: "爱情", 878: "科幻", 10770: "电视电影", 53: "惊悚", 10752: "战争", 37: "西部", 
    10759: "动作冒险", 10762: "儿童", 10763: "新闻", 10764: "真人秀", 10765: "科幻奇幻", 
    10766: "肥皂剧", 10767: "脱口秀", 10768: "战争政治"
}

# 你的终极片单宇宙！
# 每个剧场均支持 custom_items 自定义追加列表。当豆瓣片单更新不及时或漏掉剧集时，
# 填入 {"title": "剧名", "year": "可选开播年份"}，脚本会在抓取时自动去重并合并进 TMDB 匹配与排序。
THEATERS = [
    { "name": "迷雾剧场", "id": "164880152", "custom_items": [] },
    { "name": "白夜剧场", "id": "164880158", "custom_items": [] },
    { "name": "X剧场", "id": "164880165", "custom_items": [] },
    { "name": "横屏短剧", "id": "152299516", "custom_items": [] },
    { "name": "生花剧场", "id": "164880852", "custom_items": [] },
    { "name": "大家剧场", "id": "160644809", "custom_items": [] },
    { "name": "小逗剧场", "id": "146055365", "custom_items": [] },
    { "name": "十分剧场", "id": "147708618", "custom_items": [] },
    { "name": "板凳单元", "id": "163392459", "custom_items": [] },
    { "name": "萤火单元", "id": "164881201", "custom_items": [] },
    { "name": "正午阳光", "id": "164881266", "custom_items": [] },
    { "name": "恋恋剧场", "id": "164880465", "custom_items": [] },
    { "name": "悬疑剧场", "id": "128400108", "custom_items": [] },
    { "name": "微尘剧场", "id": "161658331", "custom_items": [] },
    { "name": "暗流剧场", "id": "164879624", "custom_items": [] }
]

def clean_douban_title(raw_title):
    """去除标题中可能的括号、年份后缀，以及季数 (第X季/Season X)"""
    # 1. 先去除结尾的年份，例如 (2022)
    match = re.match(r'^(.*?)(?:\((\d{4})\))?$', raw_title)
    if match:
        title = match.group(1).strip()
    else:
        title = raw_title.strip()
        
    # 2. 正则剔除 "第一季"、"第1季"、"Season 1"、"season1" 等字眼 (忽略大小写)
    title = re.sub(r'第[一二三四五六七八九十百\d]+季', '', title)
    title = re.sub(r'(?i)Season\s*\d+', '', title)
    
    # 3. 清理剔除后可能残留的多余空格 (例如 "巴瑞   Barry " 变成 "巴瑞 Barry")
    title = re.sub(r'\s+', ' ', title).strip()
    
    return title

async def fetch_doulist_pages(session, theater):
    """翻页抓取豆瓣片单里的所有剧集；失败时抛错，禁止用空结果覆盖旧数据。"""
    print(f"🎬 开始获取 [{theater['name']}] 数据...")
    all_items = []
    start = 0
    page_size = 25
    page_count = 0

    headers = {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Referer": "https://m.douban.com/"
    }

    while True:
        page_count += 1
        url = f"https://m.douban.com/doulist/{theater['id']}/?start={start}"
        last_error = None
        for attempt in range(1, MAX_FETCH_RETRIES + 1):
            try:
                async with session.get(url, headers=headers, timeout=REQUEST_TIMEOUT) as resp:
                    html = await resp.text(errors="replace")
                    if resp.status != 200:
                        raise RuntimeError(f"HTTP {resp.status}")
                    soup = BeautifulSoup(html, 'html.parser')
                    items = soup.select('ul.doulist-items > li')
                    if not items:
                        # 豆瓣风控/验证页不能被误判为“片单为空”。
                        if start == 0:
                            raise RuntimeError("返回页面没有 doulist-items，可能触发豆瓣风控或页面结构已变化")
                        break
                    last_error = None
                    break
            except Exception as e:
                last_error = e
                if attempt < MAX_FETCH_RETRIES:
                    await asyncio.sleep(attempt * 2)
        if last_error:
            raise RuntimeError(f"第 {page_count} 页抓取失败（重试 {MAX_FETCH_RETRIES} 次）: {last_error}")
        if not items:
            break

        for item in items:
            title_elem = item.select_one('.info .title')
            meta_elem = item.select_one('.info .meta')
            if title_elem:
                raw_title = title_elem.get_text(strip=True)
                clean_title = clean_douban_title(raw_title)
                year = None
                if meta_elem:
                    year_match = re.search(r'(\d{4})(?=-\d{2}-\d{2})', meta_elem.get_text(strip=True))
                    if year_match:
                        year = year_match.group(1)
                all_items.append({"title": clean_title, "year": year})

        if len(items) < page_size:
            break
        start += page_size
        await asyncio.sleep(0.5)

    if not all_items:
        raise RuntimeError("片单页面成功返回，但未解析到任何有效条目")
    return {"items": all_items, "page_count": page_count}

async def search_tmdb(session, item, cache):
    """在 TMDB 中进行严格匹配"""
    title = item['title']
    year = item['year']
    cache_key = f"{title}_{year}"
    
    if cache_key in cache: return cache[cache_key]

    url = "https://api.themoviedb.org/3/search/tv"
    headers = {"accept": "application/json"}
    params = {"query": title, "language": "zh-CN"}
    
    if TMDB_API_KEY.startswith("eyJ"):
        headers["Authorization"] = f"Bearer {TMDB_API_KEY}"
    else:
        params["api_key"] = TMDB_API_KEY

    if year: params["first_air_date_year"] = year

    try:
        async with session.get(url, params=params, headers=headers) as resp:
            if resp.status == 200:
                data = await resp.json()
                results = data.get("results", [])
                
                # 获取当天的北京时间，用于拦截未开播的剧
                tz_bj = datetime.timezone(datetime.timedelta(hours=8))
                today_str = datetime.datetime.now(tz_bj).strftime("%Y-%m-%d")
                
                for res in results:
                    tmdb_name = (res.get("name") or "").strip().lower()
                    query_name = title.strip().lower()
                    
                    # 宽松一点包含匹配，兼容部分副标题
                    is_title_match = (query_name in tmdb_name or tmdb_name in query_name)
                    is_year_match = True
                    first_air = res.get("first_air_date")
                    
                    if year and first_air:
                        is_year_match = first_air.startswith(year)
                        
                    if is_title_match and is_year_match:
                        # 🔴 核心拦截逻辑 1：检查是否缺失ID和海报
                        tmdb_id = res.get("id")
                        poster_path = res.get("poster_path")
                        backdrop_path = res.get("backdrop_path")
                        
                        if not tmdb_id or not poster_path or not backdrop_path:
                            # 数据不全，看 TMDB 返回的下一个搜索结果
                            continue
                            
                        # 🔴 核心拦截逻辑 2：检查是否未开播
                        if not first_air or first_air > today_str:
                            # 未到开播时间，或者 TMDB 根本没写开播时间，直接跳过
                            continue

                        # 🔴 新增：拿着 id 去请求详情，获取最新更新日期 (last_air_date)
                        detail_url = f"https://api.themoviedb.org/3/tv/{tmdb_id}"
                        detail_params = {"language": "zh-CN"}
                        if not TMDB_API_KEY.startswith("eyJ"):
                            detail_params["api_key"] = TMDB_API_KEY
                            
                        last_update_date = first_air # 默认用首播日期兜底
                        try:
                            async with session.get(detail_url, params=detail_params, headers=headers) as d_resp:
                                if d_resp.status == 200:
                                    d_data = await d_resp.json()
                                    last_update_date = d_data.get("last_air_date") or first_air
                        except Exception as e:
                            pass # 详情获取失败不影响主体逻辑

                        genre_ids = res.get("genre_ids", [])
                        genre_names = ",".join([GENRE_MAP.get(gid) for gid in genre_ids if GENRE_MAP.get(gid)])
                        
                        info = {
                            "id": str(tmdb_id),
                            "type": "tmdb",
                            "title": res.get("name"),
                            "description": res.get("overview"),
                            "rating": res.get("vote_average"),
                            "voteCount": res.get("vote_count"),
                            "popularity": res.get("popularity"),
                            "releaseDate": first_air,
                            "lastUpdateDate": last_update_date, # 🔴 新增：这里保存给前端排序用
                            "posterPath": poster_path,
                            "backdropPath": backdrop_path,
                            "mediaType": "tv",
                            "genreTitle": genre_names
                        }
                        cache[cache_key] = info
                        return info
    except: pass
    return None

async def process_theater(session, theater, cache):
    douban_data = await fetch_doulist_pages(session, theater)
    items = list(douban_data["items"])
    
    # 支持自定义追加片单（去重）
    existing_titles = {it["title"].strip().lower() for it in items}
    for custom in theater.get("custom_items", []):
        c_title = custom.get("title", "").strip()
        if c_title and c_title.lower() not in existing_titles:
            items.append({"title": c_title, "year": custom.get("year")})
            existing_titles.add(c_title.lower())
    
    shows = []
    # 控制并发，防止 TMDB 报错
    for i in range(0, len(items), 5):
        chunk = items[i:i + 5]
        tasks = [search_tmdb(session, item, cache) for item in chunk]
        results = await asyncio.gather(*tasks)
        for tmdb_info in results:
            if tmdb_info:
                shows.append(tmdb_info)
        await asyncio.sleep(0.3) # ⚠️ 稍微放慢一点点，因为多了二次详情请求

    # 经过 search_tmdb 过滤，能留下的 100% 都是已开播的数据，所以 upcoming 恒定为空数组即可
    aired = shows
    upcoming = []
            
    # 已开播按时间倒序排列 (最新的在前面)
    aired.sort(key=lambda x: x.get("releaseDate") or "0000-00-00", reverse=True)
    
    print(f"✅ [{theater['name']}] 处理完成: 共发现 {len(items)} 部，完美匹配 {len(shows)} 部 (全部为已播双图精品)")
    
    return {
        theater["name"]: {
            "aired": aired,
            "upcoming": upcoming, # 保持结构兼容前端，即使为空
            "totalItems": len(items),
            "totalPages": douban_data["page_count"]
        }
    }

async def main():
    if not TMDB_API_KEY:
        raise RuntimeError("未检测到 TMDB_API_KEY，请在仓库 Settings → Secrets and variables → Actions 中添加 TMDB_API_KEY")

    os.makedirs(DATA_DIR, exist_ok=True)
    
    tz_bj = datetime.timezone(datetime.timedelta(hours=8))
    final_data = {
        "last_updated": datetime.datetime.now(tz_bj).strftime("%Y-%m-%d %H:%M:%S")
    }

    async with aiohttp.ClientSession(timeout=REQUEST_TIMEOUT) as session:
        cache = {}
        for theater in THEATERS:
            theater_result = await process_theater(session, theater, cache)
            result = theater_result[theater["name"]]
            if result["totalItems"] <= 0:
                raise RuntimeError(f"[{theater['name']}] 未抓到片单条目，停止写入，保留旧数据")
            final_data.update(theater_result)

    # 只有全部剧场成功抓取后才原子替换；任何异常都会保留仓库中的上一版数据。
    tmp_file = OUTPUT_FILE + ".tmp"
    with open(tmp_file, "w", encoding="utf-8") as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    os.replace(tmp_file, OUTPUT_FILE)

if __name__ == "__main__":
    asyncio.run(main())
