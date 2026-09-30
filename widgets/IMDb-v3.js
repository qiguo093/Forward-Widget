// ============================================================================
// IMDb 分类资源 v3（数据层重制版）
//
// 原版依赖的静态数据仓库 opix-maker/Forward（以及 opix-maker/121416）已被作者
// 删除，全站 404，所有模块都取不到数据。这里改为直接调用 TMDB 实时接口，
// 于是「内容类型 / 地区 / 年份 / 分类主题 / 排序」这些筛选参数才真正生效。
//
// 另修掉原版的几个问题：
//   1. 卡片用 type:"url" 却没有 link / loadDetail → 点了没反应。改为 type:"tmdb"。
//   2. 内存缓存 key 只用了常量 URL → 动画组与真人组互相污染。
//   3. params.nextPageParams 不是 Forward 的分页机制，删除；分页交给 App 传 page。
//   4. rating 用字符串、posterPath 依赖数据源相对路径 → 统一成模型要求的类型。
// ============================================================================

const DEBUG_LOG = true;
const POSTER_BASE = "https://image.tmdb.org/t/p/w500";
const BACKDROP_BASE = "https://image.tmdb.org/t/p/w780";
const LANGUAGE = "zh-CN";
const CURRENT_YEAR = new Date().getFullYear();

console.log("[IMDb-v3] 脚本初始化：数据源改为 TMDB 实时接口");

// --- 参数辅助 ---

function processEnumOptions(options, allValue = "all", allTitle = "全部", allLast = false) {
    let processed = [...options];
    const allIndex = processed.findIndex(opt => opt.value === allValue);
    let allItem = null;
    if (allIndex > -1) {
        allItem = processed.splice(allIndex, 1)[0];
        allItem.title = allTitle;
    } else {
        allItem = { title: allTitle, value: allValue };
    }
    if (options.length > 0 && options.some(opt => /^\d{4}$/.test(opt.value))) {
        processed.sort((a, b) => parseInt(b.value) - parseInt(a.value));
    } else {
        processed.sort((a, b) => a.title.localeCompare(b.title, 'zh-Hans-CN'));
    }
    if (allLast) processed.push(allItem); else processed.unshift(allItem);
    return processed;
}

const pageParam = { name: "page", title: "页码", type: "page" };

const sortOptions = [
    { title: "🔥综合热度", value: "hs_desc" },
    { title: "👍评分", value: "r_desc" },
    { title: "🆕最新上线", value: "d_desc" }
];
const sortParam = (defaultValue = "hs_desc") => ({ name: "sort", title: "排序方式", type: "enumeration", value: defaultValue, enumOptions: sortOptions });

const yearOptionsRaw = [];
for (let y = CURRENT_YEAR; y >= 1990; y--) { yearOptionsRaw.push({ title: `${y} 年`, value: String(y) }); }
const yearEnumParam = { name: "year", title: "年份", type: "enumeration", value: String(CURRENT_YEAR), description: "选择特定年份", enumOptions: processEnumOptions(yearOptionsRaw, "all", "全部年份", true) };

const regionOptionsRefined = [
    { title: "中国大陆", value: "country:cn" }, { title: "美国", value: "country:us" }, { title: "英国", value: "country:gb" },
    { title: "日本", value: "country:jp" }, { title: "韩国", value: "country:kr" }, { title: "欧美", value: "region:us-eu" },
    { title: "香港", value: "country:hk" }, { title: "台湾", value: "country:tw" },
];
const regionParamSelect = { name: "region", title: "选择地区/语言", type: "enumeration", value: "all", enumOptions: processEnumOptions(regionOptionsRefined, "all", "全部地区", false) };
const regionFilterParam = { name: "region", title: "选择地区/语言", type: "enumeration", value: "all", enumOptions: processEnumOptions(regionOptionsRefined, "all", "全部地区", true) };

const genreMap = [
    { title: "爱情", value: "genre:爱情" }, { title: "冒险", value: "genre:冒险" }, { title: "悬疑", value: "genre:悬疑" }, { title: "惊悚", value: "genre:惊悚" }, { title: "恐怖", value: "genre:恐怖" }, { title: "科幻", value: "genre:科幻" },
    { title: "奇幻", value: "genre:奇幻" }, { title: "动作", value: "genre:动作" }, { title: "喜剧", value: "genre:喜剧" }, { title: "剧情", value: "genre:剧情" }, { title: "历史", value: "genre:历史" }, { title: "战争", value: "genre:战争" }, { title: "犯罪", value: "genre:犯罪" },
];
const themeOptionsRaw = [
    { title: "赛博朋克", value: "theme:cyberpunk" }, { title: "太空歌剧", value: "theme:space-opera" }, { title: "时间旅行", value: "theme:time-travel" }, { title: "末世废土", value: "theme:post-apocalyptic" }, { title: "机甲", value: "theme:mecha" }, { title: "丧尸", value: "theme:zombie" }, { title: "怪物", value: "theme:monster" }, { title: "灵异", value: "theme:ghost" }, { title: "魔法", value: "theme:magic" }, { title: "黑帮", value: "theme:gangster" }, { title: "黑色电影", value: "theme:film-noir" }, { title: "连环杀手", value: "theme:serial-killer" }, { title: "仙侠", value: "theme:xianxia" }, { title: "怪兽(Kaiju)", value: "theme:kaiju" }, { title: "异世界", value: "theme:isekai" },
    { title: "侦探推理", value: "theme:whodunit" }, { title: "谍战", value: "theme:spy" }, { title: "律政", value: "theme:courtroom" }, { title: "校园/日常", value: "theme:slice-of-life" }, { title: "武侠", value: "theme:wuxia" }, { title: "超级英雄", value: "theme:superhero" }
];
const allCategoryOptions = [...genreMap, ...themeOptionsRaw];
const categoryParam = { name: "category", title: "选择分类/主题", type: "enumeration", value: "genre:爱情", enumOptions: processEnumOptions(allCategoryOptions, "all", "全部分类/主题", true) };

const contentTypeParam = {
    name: "contentType", title: "内容分类", type: "enumeration", value: "all",
    enumOptions: [
        { title: "🔥全部类型", value: "all" }, { title: "🎬电影", value: "movie" },
        { title: "📺剧集", value: "tv" }, { title: "✨动画", value: "anime" }
    ]
};

// --- 元数据 ---

var WidgetMetadata = {
    id: "imdb_v3",
    title: "IMDb 分类资源 v3",
    description: "影视热门聚合（v3 重制：原静态数据仓库已被作者删除，改为 TMDB 实时接口，各地区/年份/分类筛选已真正生效）",
    author: "𝓚𝓾𝓰𝓾𝓸𝔃𝓪𝓲 ⁷",
    version: "3.0.0",
    requiredVersion: "0.0.1",
    detailCacheDuration: 36000,
    cacheDuration: 3600,
    modules: [
        { title: "🆕 近期热门", functionName: "listRecentHot", params: [contentTypeParam, regionFilterParam, sortParam("hs_desc"), pageParam], cacheDuration: 1800, requiresWebView: false },
        { title: "🎭 分类/主题", functionName: "listByCategory", params: [categoryParam, contentTypeParam, regionFilterParam, sortParam(), pageParam], cacheDuration: 3600, requiresWebView: false },
        { title: "📅 按年份浏览", functionName: "listByYear", params: [yearEnumParam, contentTypeParam, regionFilterParam, sortParam("d_desc"), pageParam], cacheDuration: 3600, requiresWebView: false },
        { title: "🎬 电影", functionName: "listMovies", params: [regionParamSelect, sortParam(), pageParam], cacheDuration: 3600, requiresWebView: false },
        { title: "📺 剧集", functionName: "listTVSeries", params: [regionParamSelect, sortParam(), pageParam], cacheDuration: 3600, requiresWebView: false },
        { title: "✨ 动画", functionName: "listAnime", params: [regionParamSelect, sortParam(), pageParam], cacheDuration: 3600, requiresWebView: false },
    ]
};


// --- 映射表 ---

const GENRE_ID = {
    "爱情": 10749, "冒险": 12, "悬疑": 9648, "惊悚": 53, "恐怖": 27, "科幻": 878,
    "奇幻": 14, "动作": 28, "喜剧": 35, "剧情": 18, "历史": 36, "战争": 10752, "犯罪": 80
};

// 主题 → TMDB 关键词（先经 /search/keyword 换成 id，再喂给 with_keywords）
const THEME_KEYWORDS = {
    cyberpunk: "cyberpunk", "space-opera": "space opera", "time-travel": "time travel",
    "post-apocalyptic": "post-apocalyptic", mecha: "mecha", zombie: "zombie", monster: "monster",
    ghost: "ghost", magic: "magic", gangster: "gangster", "film-noir": "film noir",
    "serial-killer": "serial killer", xianxia: "xianxia", kaiju: "kaiju", isekai: "isekai",
    whodunit: "whodunit", spy: "spy", courtroom: "courtroom", "slice-of-life": "slice of life",
    wuxia: "wuxia", superhero: "superhero"
};

const REGION_COUNTRY = {
    cn: "CN", us: "US", gb: "GB", jp: "JP", kr: "KR", hk: "HK", tw: "TW",
    "us-eu": "US|GB|CA|AU|IE|NZ"
};

// TMDB 的 genre id → 中文
const GENRE_TEXT = {
    28: "动作", 12: "冒险", 16: "动画", 35: "喜剧", 80: "犯罪", 99: "纪录", 18: "剧情", 10751: "家庭",
    14: "奇幻", 36: "历史", 27: "恐怖", 10402: "音乐", 9648: "悬疑", 10749: "爱情", 878: "科幻",
    10770: "电视电影", 53: "惊悚", 10752: "战争", 37: "西部", 10759: "动作冒险", 10762: "儿童",
    10763: "新闻", 10764: "真人秀", 10765: "科幻奇幻", 10766: "肥皂剧", 10767: "脱口秀", 10768: "战综"
};

function genreText(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return "";
    return ids.map(id => GENRE_TEXT[id]).filter(Boolean).slice(0, 2).join(" / ");
}

function todayStr() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
}

// --- 卡片构造（type:"tmdb"，App 用 id + mediaType 打开内置详情页） ---

function buildCard(item, mediaType) {
    if (!item || !item.id) return null;
    const poster = item.poster_path ? POSTER_BASE + item.poster_path : "";
    if (!poster) return null;
    const date = item.release_date || item.first_air_date || "";
    const rating = Number(item.vote_average || 0);
    const title = item.title || item.name || item.original_title || item.original_name || "未知标题";
    return {
        id: String(item.id),
        tmdbId: item.id,
        type: "tmdb",
        mediaType: mediaType,
        title: title,
        releaseDate: date,
        year: date ? date.slice(0, 4) : "",
        rating: Number(rating.toFixed(1)),
        posterPath: poster,
        coverUrl: poster,
        backdropPath: item.backdrop_path ? BACKDROP_BASE + item.backdrop_path : poster,
        genreTitle: genreText(item.genre_ids),
        subTitle: date ? `${date.slice(0, 4)} · ⭐ ${rating.toFixed(1)}` : `⭐ ${rating.toFixed(1)}`,
        description: `⭐ ${rating.toFixed(1)}${date ? " · 上线 " + date : ""}\n${item.overview || "暂无简介"}`
    };
}

// --- 查询构建 ---

function resolveTypes(contentType) {
    if (contentType === "movie") return ["movie"];
    if (contentType === "tv" || contentType === "anime") return ["tv"];
    return ["tv", "movie"];
}

function regionCountry(region) {
    if (!region || region === "all") return null;
    const key = String(region).replace("country:", "").replace("region:", "");
    return REGION_COUNTRY[key] || null;
}

// 分类/主题 → 具体查询条件（genre 直接给 id，theme 需要先查 keyword id）
async function resolveCategory(category) {
    const raw = String(category || "all");
    if (raw === "all") return { ok: true, query: {} };
    if (raw.startsWith("genre:")) {
        const name = raw.slice("genre:".length);
        const id = GENRE_ID[name];
        if (!id) return { ok: false, reason: `未知分类 ${name}` };
        return { ok: true, query: { with_genres: String(id) } };
    }
    if (raw.startsWith("theme:")) {
        const key = raw.slice("theme:".length);
        const text = THEME_KEYWORDS[key];
        if (!text) return { ok: false, reason: `未知主题 ${key}` };
        try {
            const res = await Widget.tmdb.get("/search/keyword", { params: { query: text } });
            const hit = (res && res.results || [])[0];
            if (!hit) return { ok: false, reason: `TMDB 无关键词 ${text}` };
            return { ok: true, query: { with_keywords: String(hit.id) } };
        } catch (e) {
            return { ok: false, reason: `关键词查询失败 ${text}: ${e.message || e}` };
        }
    }
    return { ok: false, reason: `无法识别的分类 ${raw}` };
}

function buildQuery(kind, opts) {
    const q = { language: LANGUAGE, include_adult: false };

    // 排序
    if (opts.sort === "r_desc") {
        q.sort_by = "vote_average.desc";
        q["vote_count.gte"] = 50;   // 门槛别设高，实测 >=20 在某些年份区间会返回空
    } else if (opts.sort === "d_desc") {
        q.sort_by = kind === "movie" ? "primary_release_date.desc" : "first_air_date.desc";
        q[kind === "movie" ? "primary_release_date.lte" : "first_air_date.lte"] = todayStr();
    } else {
        q.sort_by = "popularity.desc";
    }

    // 内容类型
    if (opts.anime) q.with_genres = q.with_genres ? `${q.with_genres},16` : "16";
    if (opts.genres) q.with_genres = q.with_genres ? `${q.with_genres},${opts.genres}` : String(opts.genres);
    if (opts.keywords) q.with_keywords = String(opts.keywords);

    // 地区
    const cc = regionCountry(opts.region);
    if (cc) q.with_origin_country = cc;

    // 年份
    if (opts.year && opts.year !== "all") {
        if (kind === "movie") q.primary_release_year = String(opts.year);
        else {
            q["first_air_date.gte"] = `${opts.year}-01-01`;
            q["first_air_date.lte"] = `${opts.year}-12-31`;
        }
    }
    return q;
}

// --- 取数 ---

// TMDB 的 discover 参数组合偶尔会确定性/间歇性报 error 34，
// 已知「vote_average.desc + 年份区间 + vote_count.gte」带 with_origin_country 时必错，
// 故失败后去掉地区再试一次。
async function fetchDiscover(kind, query, page) {
    const endpoint = kind === "movie" ? "/discover/movie" : "/discover/tv";
    const base = Object.assign({}, query, { page: Math.max(1, Number(page) || 1) });
    try {
        const res = await Widget.tmdb.get(endpoint, { params: base });
        return (res && res.results) || [];
    } catch (e) {
        if (base.with_origin_country) {
            const retry = Object.assign({}, base);
            delete retry.with_origin_country;
            try {
                const res2 = await Widget.tmdb.get(endpoint, { params: retry });
                if (DEBUG_LOG) console.log(`[IMDb-v3] ${endpoint} 带地区失败，去掉地区重试成功`);
                return (res2 && res2.results) || [];
            } catch (e2) {
                console.error(`[IMDb-v3 ERROR] ${endpoint} 重试仍失败: ${e2.message || e2}`);
                return [];
            }
        }
        console.error(`[IMDb-v3 ERROR] ${endpoint} 请求失败: ${e.message || e}`);
        return [];
    }
}

// 多类型并行后按名次交错，避免「全部类型」下电影把剧集整段压到后面
function interleave(lists) {
    const out = [];
    const max = Math.max(0, ...lists.map(l => l.length));
    for (let i = 0; i < max; i++) {
        lists.forEach(l => { if (l[i]) out.push(l[i]); });
    }
    return out;
}

async function runDiscovery(types, opts, page) {
    const lists = await Promise.all(types.map(kind =>
        fetchDiscover(kind, buildQuery(kind, opts), page)
            .then(list => list.map(item => buildCard(item, kind === "movie" ? "movie" : "tv")).filter(Boolean))
    ));
    const items = interleave(lists);
    if (DEBUG_LOG) console.log(`[IMDb-v3] page=${page} types=${types.join("+")} sort=${opts.sort} 返回 ${items.length} 条`);
    return items;
}


// --- 模块入口 ---

// 🆕 近期热门：TMDB 当前热门，可按内容类型与地区收窄
async function listRecentHot(params = {}) {
    return await runDiscovery(resolveTypes(params.contentType), {
        sort: params.sort || "hs_desc",
        region: params.region || "all",
        anime: params.contentType === "anime"
    }, params.page);
}

// 🎭 分类/主题：类型走 with_genres，主题先查 keyword id 再走 with_keywords
async function listByCategory(params = {}) {
    const cat = await resolveCategory(params.category);
    if (!cat.ok) {
        console.error(`[IMDb-v3] 分类不可用：${cat.reason}`);
        return [];
    }
    const opts = { sort: params.sort || "hs_desc", region: params.region || "all" };
    if (cat.query.with_genres) opts.genres = cat.query.with_genres;
    if (cat.query.with_keywords) opts.keywords = cat.query.with_keywords;
    return await runDiscovery(resolveTypes(params.contentType), opts, params.page);
}

// 📅 按年份浏览：电影用 primary_release_year，剧集用 first_air_date 区间
async function listByYear(params = {}) {
    return await runDiscovery(resolveTypes(params.contentType), {
        sort: params.sort || "d_desc",
        region: params.region || "all",
        year: params.year || "all"
    }, params.page);
}

// 🎬 电影
async function listMovies(params = {}) {
    return await runDiscovery(["movie"], {
        sort: params.sort || "hs_desc",
        region: params.region || "all"
    }, params.page);
}

// 📺 剧集
async function listTVSeries(params = {}) {
    return await runDiscovery(["tv"], {
        sort: params.sort || "hs_desc",
        region: params.region || "all"
    }, params.page);
}

// ✨ 动画：TMDB 剧集里的动画类型（含日番、国创、欧美动画）
async function listAnime(params = {}) {
    return await runDiscovery(["tv"], {
        sort: params.sort || "hs_desc",
        region: params.region || "all",
        anime: true
    }, params.page);
}

console.log("[IMDb-v3] 脚本加载成功.");
