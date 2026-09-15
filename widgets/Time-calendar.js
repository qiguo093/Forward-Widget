// =========================================================================
// 1. 全局配置与纯净内存缓存 (必须置于顶部)
// =========================================================================

const currentYear = new Date().getFullYear();
const startYear = Math.max(currentYear + 1, 2026); 
const yearOptions = [];
for (let year = startYear; year >= 1940; year--) { 
    yearOptions.push({ title: `${year}`, value: `${year}` });
}

// 🚀 全新的纯净内存缓存（仅用于动态网页刮削，彻底废弃旧版 JSON 请求）
const ScrapingCache = {
    airtime: {},
    daily: []
};

const DEFAULT_TRAKT_ID = "95b59922670c84040db3632c7aac6f33704f6ffe5cbf3113a056e37cb45cb482";

// Trakt 对没有 User-Agent 的请求直接 403 返回 HTML，所有 Trakt 请求必须显式携带。
const TRAKT_REQUEST_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

const GLOBAL_GENRE_MAP_ALL = {
    16: "动画", 10759: "动作冒险", 35: "喜剧", 18: "剧情", 14: "奇幻", 878: "科幻", 9648: "悬疑", 
    10749: "爱情", 27: "恐怖", 10765: "科幻奇幻", 80: "犯罪", 99: "纪录片", 10751: "家庭", 
    36: "历史", 10402: "音乐", 10770: "电视电影", 53: "惊悚", 10752: "战争", 37: "西部", 28: "动作", 12: "冒险",
    10762: "儿童", 10763: "新闻", 10764: "真人秀", 10766: "肥皂剧", 10767: "脱口秀", 10768: "战综"
};

function getGlobalGenreText(ids) {
    if (!ids || !Array.isArray(ids)) return "影视";
    const genres = ids.map(id => GLOBAL_GENRE_MAP_ALL[id]).filter(Boolean);
    return genres.length > 0 ? genres.slice(0, 2).join(" / ") : "影视";
}

// 统一 UI 卡片构建工厂
function buildItem({ id, tmdbId, type, title, date, poster, backdrop, rating, genreText, subTitle, desc }) {
    const baseInfo = [date, subTitle].filter(Boolean).join(" · ");
    const overview = desc ? `\n${desc}` : "\n暂无简介";

    return {
        id: String(id),
        tmdbId: parseInt(tmdbId) || parseInt(id),
        type: "tmdb",
        mediaType: type,
        title: title,
        genreTitle: genreText || (type === "tv" ? "剧集" : "电影"), 
        description: baseInfo ? (baseInfo + overview) : (desc || "暂无简介"),
        releaseDate: date,
        posterPath: poster ? `https://image.tmdb.org/t/p/w500${poster}` : "",
        backdropPath: backdrop ? `https://image.tmdb.org/t/p/w780${backdrop}` : "",
        subTitle: subTitle
    };
}

// =========================================================================
// 2. 终极聚合版 Widget Metadata (史诗七大阵营)
// =========================================================================
var WidgetMetadata = {
    id: "qiguo.calendar.schedule",
    title: "追剧日历",
    description: "影剧时间表",
    icon: "https://github.com/qiguo093/Forward-Widget/raw/refs/heads/main/icon2.png",
    author: "𝓚𝓾𝓰𝓾𝓸𝔃𝓪𝓲 ⁷",
    version: "1.0.0",
    requiredVersion: "0.0.1",
    site: "https://t.me/Kuguozai",
    
    // 🔒 Trakt Client ID 全局参数已隐藏（2026-09-12）。
    // 原实现：globalParams: [{ name: "traktClientId", title: "Trakt Client ID", type: "input", ... }]
    // 代码内 4 处 `params.traktClientId || DEFAULT_TRAKT_ID` 兜底逻辑保留，行为不变（始终使用内置 ID）。
    // 需要重新显示该输入框时，把上面那段 globalParams 数组加回此处即可，无需改动其他代码。

    modules: [
        {
            title: "新片追踪",
            description: "即将上映、正在热映与定档待播",
            functionName: "loadMonthlyUpcomingStrict",
            type: "video",
            cacheDuration: 43200,
            params: [
                {
                    name: "upcoming_category",
                    title: "选择频道",
                    type: "enumeration",
                    value: "movie_upcoming",
                    enumOptions: [
                        { title: "即将上映", value: "movie_upcoming" },
                        { title: "正在热映", value: "movie_now_playing" },
                        { title: "定档待播", value: "tv_monthly_upcoming" },
                        { title: "今日首播", value: "tv_airing_today" }
                    ]
                },
                { name: "page", title: "页码", type: "page", startPage: 1 }
            ]
        },
        {
            title: "剧集追更",
            description: "全球剧集更新与首播日历",
            functionName: "loadStandaloneDramaCalendar",
            type: "video",
            // 宿主结果缓存 2 小时（7200 秒）。注意：宿主缓存命中时脚本不会执行，
            // 因此不宜设得过长（如 86400），否则志愿者补录当天集数后刷新看不到。
            // 脚本内部另有内存数据集，翻页/切地区为 0 请求。
            cacheDuration: 7200,
            params: [
                { name: "sort_by", title: "地区偏好", type: "enumeration", value: "Global", enumOptions: [ { title: "全球聚合", value: "Global" }, { title: "美国", value: "US" }, { title: "日本", value: "JP" }, { title: "韩国", value: "KR" }, { title: "中国", value: "CN" }, { title: "英国", value: "GB" } ] },
                { name: "calendar_mode", title: "时间范围", type: "enumeration", value: "update_today", enumOptions: [ { title: "今日更新", value: "update_today" }, { title: "明日首播", value: "premiere_tomorrow" }, { title: "7天内首播", value: "premiere_week" }, { title: "30天内首播", value: "premiere_month" } ] },
                { name: "page", title: "页码", type: "page" }
            ]
        },
        {
            title: "综艺追更",
            description: "未来综艺排期与热度榜单",
            functionName: "loadStandaloneVarietyAggregate",
            type: "video",
            // 宿主结果缓存 2 小时（7200 秒）。注意：宿主缓存命中时脚本不会执行，
            // 因此不宜设得过长（如 86400），否则志愿者补录当天集数后刷新看不到。
            // 脚本内部另有内存数据集，翻页/切地区为 0 请求。
            cacheDuration: 7200,
            params: [
                { name: "sort_by", title: "综艺筛选", type: "enumeration", value: "all", enumOptions: [ { title: "全部地区", value: "all" }, { title: "国内综艺", value: "cn" }, { title: "国外综艺", value: "global" } ] },
                { name: "list_type", title: "榜单类型", type: "enumeration", value: "calendar", enumOptions: [ { title: "追新榜", value: "calendar" }, { title: "热度榜", value: "hot" } ] },
                { name: "days", title: "预告范围", type: "enumeration", value: "14", belongTo: { paramName: "list_type", value: ["calendar"] }, enumOptions: [ { title: "今日更新", value: "0" }, { title: "未来 7 天", value: "7" }, { title: "未来 14 天", value: "14" }, { title: "未来 30 天", value: "30" } ] },
                { name: "page", title: "页码", type: "page" }
            ]
        },
        {
            title: "动漫周更",
            description: "国创与番剧每周更新表",
            functionName: "loadStandaloneAnimeWeek",
            type: "video",
            cacheDuration: 7200,
            params: [
                { name: "sort_by", title: "选择日期", type: "enumeration", value: "today", enumOptions: [ { title: "今天", value: "today" }, { title: "周一", value: "1" }, { title: "周二", value: "2" }, { title: "周三", value: "3" }, { title: "周四", value: "4" }, { title: "周五", value: "5" }, { title: "周六", value: "6" }, { title: "周日", value: "7" } ] },
                { name: "page", title: "页码", type: "page" }
            ]
        }
    ]
};

// =========================================================================
// 即将上映与热映榜
// =========================================================================
const UPCOMING_GENRE_MAP = {
    10759: "动作冒险", 16: "动画", 35: "喜剧", 80: "犯罪", 99: "纪录片",
    18: "剧情", 10751: "家庭", 9648: "悬疑", 10765: "科幻", 28: "动作",
    12: "冒险", 14: "奇幻", 878: "科幻", 27: "恐怖", 10749: "爱情", 53: "惊悚"
};

function buildUpcomingItem(item, mediaType) {
    if (!item) return null;
    const title = item.title || item.name;
    const releaseDate = item.release_date || item.first_air_date || "";
    const score = item.vote_average ? item.vote_average.toFixed(1) : "暂无";
    const popularity = item.popularity ? Math.round(item.popularity) : 0;
    const genre = (item.genre_ids || []).map(id => UPCOMING_GENRE_MAP[id]).filter(Boolean)[0] || "影视";
    let dateLabel = `📅 ${releaseDate || "日期待定"}`;
    if (releaseDate) {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const date = new Date(releaseDate); date.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((date - today) / 86400000);
        dateLabel = diffDays > 0 ? `⏳ 还有 ${diffDays} 天上映 (${releaseDate})` : diffDays === 0 ? `🔥 今天首映! (${releaseDate})` : `✅ 已上映 (${releaseDate})`;
    }
    return {
        id: String(item.id), tmdbId: parseInt(item.id), type: "tmdb", mediaType,
        title, genreTitle: `${genre} 热度:${popularity}`, subTitle: `${genre} 热度:${popularity}`,
        posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "",
        backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : "",
        description: `${dateLabel} | ⭐ 评分: ${score}\n${item.overview || "这部影片目前还没有中文简介，敬请期待！"}`,
        rating: item.vote_average || 0, releaseDate
    };
}

async function loadMonthlyUpcomingStrict(params = {}) {
    const category = params.upcoming_category || "movie_upcoming";
    if (category !== "tv_monthly_upcoming") return await loadUpcomingCenter(params);
    const page = Math.max(1, Number(params.page || 1));
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const toDate = date => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    };
    const start = toDate(today);
    const end = toDate(monthEnd);
    // 屏蔽指定国家/语言，并排除低质小语种杂剧、自制短片与同性恋/BL/摔角等内容。
    const blockedCountries = ["TH", "IN", "RU", "TR", "RO", "PL", "FI", "HU", "NL", "BR"];
    const blockedLanguages = ["th", "hi", "ta", "te", "ru", "tr", "ro", "pl", "fi", "hu", "nl", "pt"];
    const blockedUpcomingGenreText = /(?:\bgay\b|\blgbtq?\b|\blesbian\b|\bhomosexual\b|\bsame[- ]sex\b|\bqueer\b|\bboys['’]?\s*love\b|\bbl\b|\bgl\b|\byaoi\b|\byuri\b|同性恋|耽美|男男|女女|同志|腐剧|双男主|恋上他|爱上他|绑架我的人)/i;
    const blockedUpcomingSportsText = /(?:\bwrestling\b|\bpro[- ]wrestling\b|\baew\b|\bwwe\b|\bnwa\b|\bmlw\b|\bstardom\b|\bseadlin[n]?ng\b|\btjpw\b|\bufc\b|\bmma\b|\braw\b|\bsmackdown\b|\bcollision\b|\bdynamite\b|\bpowerrr\b|\bbaseball\b|\bfootball\b|\bbasketball\b|プロレス|女子プロレス|摔角|摔跤|格斗|角力|スターダム)/i;
    const isBlockedOrigin = (item, detail = item) => {
        const countries = [
            ...(item?.origin_country || []),
            ...(detail?.origin_country || []),
            ...((detail?.production_countries || []).map(c => c.iso_3166_1).filter(Boolean))
        ];
        return countries.some(code => blockedCountries.includes(String(code).toUpperCase())) ||
            [item?.original_language, detail?.original_language].some(lang => blockedLanguages.includes(String(lang || "").toLowerCase()));
    };
    const isExcludedUpcomingItem = (item, detail = item, keywords = []) => {
        if (isBlockedOrigin(item, detail)) return true;
        const genres = (detail?.genres ? detail.genres.map(g => g.id) : (item?.genre_ids || [])).map(Number);
        if (genres.length === 0) return true;
        const text = `${item?.name || ""} ${item?.title || ""} ${item?.original_name || ""} ${detail?.overview || item?.overview || ""} ${(keywords || []).join(" ")}`;
        if (blockedUpcomingGenreText.test(text)) return true;
        if (blockedUpcomingSportsText.test(text)) return true;
        const countries = (item?.origin_country || detail?.origin_country || []).map(c => String(c).toUpperCase());
        const isMajor = countries.some(c => ["CN", "HK", "TW", "US", "GB", "JP", "KR"].includes(c));
        const overview = String(detail?.overview || item?.overview || "").trim();
        if (!isMajor && (!overview || overview.length === 0) && (Number(item?.popularity || 0) < 1.5)) return true;
        return false;
    };
    const baseQuery = {
        language: "zh-CN",
        include_adult: false,
        include_null_first_air_dates: false,
        "first_air_date.gte": start,
        "first_air_date.lte": end,
        without_genres: "99,10751,10763,10766,10770",
        without_origin_country: blockedCountries.join("|"),
        without_original_language: blockedLanguages.join("|"),
        sort_by: "first_air_date.asc"
    };
    try {
        // 同时取 8 页保证翻页有足够数据；并发请求避免原先的 8 次串行等待。
        const pages = await Promise.all([1, 2, 3, 4, 5, 6, 7, 8].map(p =>
            Widget.tmdb.get("/discover/tv", { params: { ...baseQuery, page: p } }).catch(() => ({ results: [] }))
        ));
        const seen = new Set();
        const blockedGenreIds = [99, 10751, 10763, 10766, 10770]; // 纪录片/家庭/新闻/肥皂剧/电视电影
        const blockedTitleWords = [
            "TikTok", "Talent", "Kevin", "Langue", "Mesa", "Cristina", "Botched", "Kolonihaver",
            "Quel est", "Got Talent", "Locker Diaries", "Samson", "Karlchen", "Joy of Life",
            "FĂRĂ URMĂ", "Fara Urma", "SUR LE FIL"
        ];
        const items = [];
        pages.forEach(res => (res.results || []).forEach(item => {
            if (!item || seen.has(item.id)) return;
            seen.add(item.id);
            const title = item.name || item.title || "";
            const date = item.first_air_date || "";
            const genres = item.genre_ids || [];
            const countries = item.origin_country || [];
            const isVariety = genres.includes(10764) || genres.includes(10767);
            if (date < start || date > end) return;
            if (isExcludedUpcomingItem(item)) return;
            if (genres.some(id => blockedGenreIds.includes(id))) return;
            // 保留日剧、日漫与动画；仅按 TMDB 明确的综艺类型过滤非国内节目。
            if (isVariety && !countries.includes("CN")) return;
            if (!item.poster_path) return;
            if (blockedTitleWords.some(w => title.toLowerCase().includes(w.toLowerCase()))) return;
            items.push(item);
        }));
        const keywordCheckedItems = await Promise.all(items.map(async item => {
            try {
                const detail = await Widget.tmdb.get(`/tv/${item.id}`, { params: { language: "zh-CN" } });
                const keywordRes = await Widget.tmdb.get(`/tv/${item.id}/keywords`, { params: {} });
                const keywords = (keywordRes.results || keywordRes.keywords || []).map(k => k.name || "");
                return isExcludedUpcomingItem(item, detail, keywords) ? null : { ...item, _keywordsChecked: true };
            } catch (e) { return item; }
        }));
        items.length = 0;
        keywordCheckedItems.filter(Boolean).forEach(item => items.push(item));

        const seasonRaw = [];
        const seasonSeen = new Set();
        // 新季候选仅取前两页；详情以 8 路并发加载，避免 80 次串行请求卡住页面
        const seasonPages = await Promise.all([1, 2].map(p =>
            Widget.tmdb.get("/discover/tv", { params: {
                language: "zh-CN", include_adult: false, page: p,
                "air_date.gte": start, "air_date.lte": end,
                without_origin_country: blockedCountries.join("|"),
                without_original_language: blockedLanguages.join("|"),
                sort_by: "popularity.desc"
            } }).catch(() => ({ results: [] }))
        ));
        seasonPages.forEach(res => (res.results || []).forEach(item => {
            if (item && !seasonSeen.has(item.id)) { seasonSeen.add(item.id); seasonRaw.push(item); }
        }));
        // 国内综艺单独补查，不受全站 popularity 排序和前 24 个详情候选限制。
        const domesticVarietyPages = await Promise.all([1, 2, 3].map(p =>
            Widget.tmdb.get("/discover/tv", { params: {
                language: "zh-CN", include_adult: false, page: p,
                with_origin_country: "CN", with_genres: "10764|10767",
                "air_date.gte": start, "air_date.lte": end,
                sort_by: "popularity.desc"
            } }).catch(() => ({ results: [] }))
        ));
        const domesticVarietyRaw = [];
        domesticVarietyPages.forEach(res => (res.results || []).forEach(item => {
            if (item && !domesticVarietyRaw.some(existing => existing.id === item.id)) domesticVarietyRaw.push(item);
        }));
        const seasonCandidates = [];
        // 详情最多检查 24 项、每批 8 项并发，兼顾《流人》等热门新季与加载速度。
        const detailTargetMap = new Map();
        seasonRaw.slice(0, 24).forEach(item => detailTargetMap.set(item.id, item));
        domesticVarietyRaw.forEach(item => detailTargetMap.set(item.id, item));
        const detailTargets = Array.from(detailTargetMap.values());
        for (let offset = 0; offset < detailTargets.length; offset += 8) {
            const details = await Promise.all(detailTargets.slice(offset, offset + 8).map(async item => {
                try { return { item, detail: await Widget.tmdb.get(`/tv/${item.id}`, { params: { language: "zh-CN" } }) }; }
                catch (e) { return null; }
            }));
            details.filter(Boolean).forEach(({ item, detail }) => {
                const countries = detail.origin_country || [];
                const genres = detail.genres || [];
                if (isBlockedOrigin(item, detail)) return;
                if (isExcludedUpcomingItem(item, detail)) return;
                if (genres.some(g => blockedGenreIds.includes(g.id))) return;
                const isVariety = genres.some(g => g.id === 10764 || g.id === 10767);
                // 保留日本正剧、日漫和动画的新季；仅过滤非国内的明确综艺类型。
                if (isVariety && !countries.includes("CN")) return;
                const newSeason = (detail.seasons || []).find(season =>
                    season.season_number > 1 && season.air_date && season.air_date >= start && season.air_date <= end
                );
                if (!newSeason) return;
                item._seasonNumber = newSeason.season_number;
                item._seasonAirDate = newSeason.air_date;
                item._seasonTitle = detail.name || item.name || item.title;
                seasonCandidates.push(item);
            });
        }
        // 固定补查已确认的本月重点新季，避免它们因 discover 热度排序落在候选范围外。
        const featuredSeasonQueries = ["Slow Horses", "幸福伽菜子的快乐杀手生活"];
        const featuredResults = await Promise.all(featuredSeasonQueries.map(async query => {
            try {
                const search = await Widget.tmdb.get("/search/tv", { params: { language: "zh-CN", query } });
                const item = (search.results || [])[0];
                if (!item) return null;
                const detail = await Widget.tmdb.get(`/tv/${item.id}`, { params: { language: "zh-CN" } });
                if (isBlockedOrigin(item, detail)) return null;
                if (isExcludedUpcomingItem(item, detail)) return null;
                const season = (detail.seasons || []).find(s => s.season_number > 1 && s.air_date && s.air_date >= start && s.air_date <= end);
                if (!season) return null;
                return { ...item, _seasonNumber: season.season_number, _seasonAirDate: season.air_date, _seasonTitle: detail.name || item.name };
            } catch (e) { return null; }
        }));
        featuredResults.filter(Boolean).forEach(item => {
            if (!seasonCandidates.some(candidate => candidate.id === item.id)) seasonCandidates.push(item);
        });
        const merged = [];
        const mergedIds = new Set();
        seasonCandidates.forEach(item => {
            if (!mergedIds.has(item.id)) { mergedIds.add(item.id); merged.push(item); }
        });
        items.forEach(item => {
            if (!mergedIds.has(item.id)) { mergedIds.add(item.id); merged.push(item); }
        });
        merged.sort((a, b) => String(a._seasonAirDate || a.first_air_date || "").localeCompare(String(b._seasonAirDate || b.first_air_date || "")) || ((b.popularity || 0) - (a.popularity || 0)));
        return merged.slice((page - 1) * 20, page * 20).map(item => {
            const card = buildUpcomingItem(item, "tv");
            if (item._seasonNumber) {
                const seasonName = `${item._seasonTitle} 第${item._seasonNumber}季`;
                card.title = seasonName;
                card.releaseDate = item._seasonAirDate;
                card.subTitle = `📺 ${item._seasonAirDate} · 第${item._seasonNumber}季上线`;
                card.genreTitle = card.subTitle;
                card.description = `📅 ${item._seasonAirDate} 上线第${item._seasonNumber}季\n${item.overview || "暂无简介"}`;
            }
            return card;
        }).filter(Boolean);
    } catch (error) {
        console.error("[loadMonthlyUpcomingStrict] 请求失败:", error.message || error);
        return [{ id: "error", type: "text", title: "加载失败", description: "获取本月定档待播剧集失败，请下拉刷新或检查网络" }];
    }
}

async function loadUpcomingCenter(params = {}) {
    const category = params.upcoming_category || "movie_upcoming";
    const page = Number(params.page || 1);
    const routes = {
        movie_upcoming: ["movie/upcoming", "movie"],
        movie_now_playing: ["movie/now_playing", "movie"],
        tv_monthly_upcoming: ["/discover/tv", "tv"],
        tv_airing_today: ["tv/airing_today", "tv"]
    };
    const route = routes[category] || routes.movie_upcoming;
    try {
        let query = { language: "zh-CN", page, region: "US" };
        if (category === "tv_monthly_upcoming") {
            // 仅查询从今天起至本月月底、已有明确首播日期的待播剧集
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            // 使用本地日期，避免中国时区被 toISOString 转成前一天
            const toDate = date => {
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, "0");
                const d = String(date.getDate()).padStart(2, "0");
                return `${y}-${m}-${d}`;
            };
            query = {
                language: "zh-CN", page, include_adult: false,
                include_null_first_air_dates: false,
                // 由 TMDB 分页返回，保持应用分页正常工作
                "first_air_date.gte": toDate(today),
                "first_air_date.lte": toDate(monthEnd),
                sort_by: "first_air_date.asc"
            };
        }
        let rawItems = [];
        if (category === "tv_monthly_upcoming") {
            // 多拉几页再过滤，避免某一页被国外综艺占满后返回空列表
            const pages = await Promise.all([1, 2, 3, 4, 5].map(p =>
                Widget.tmdb.get(route[0], { params: { ...query, page: p } })
            ));
            const seen = new Set();
            pages.forEach(res => (res.results || []).forEach(item => {
                if (!seen.has(item.id)) { seen.add(item.id); rawItems.push(item); }
            }));
        } else {
            const res = await Widget.tmdb.get(route[0], { params: query });
            rawItems = res.results || [];
        }
        const filtered = rawItems.filter(item => {
            if (category !== "tv_monthly_upcoming") return true;
            const date = item.first_air_date || "";
            if (date < query["first_air_date.gte"] || date > query["first_air_date.lte"]) return false;
            // 排除动画、纪录片、新闻、电视电影；国外综艺排除，国内综艺保留
            const genres = item.genre_ids || [];
            if (genres.some(id => [16, 99, 10763, 10770].includes(id))) return false;
            const isVariety = genres.includes(10764) || genres.includes(10767);
            if (isVariety && !(item.origin_country || []).includes("CN")) return false;
            return true;
        }).sort((a, b) => String(a.first_air_date || "").localeCompare(String(b.first_air_date || "")));
        const output = category === "tv_monthly_upcoming" ? filtered.slice((page - 1) * 20, page * 20) : filtered;
        return output.map(item => buildUpcomingItem(item, route[1])).filter(Boolean);
    } catch (error) {
        console.error("[loadUpcomingCenter] 请求失败:", error.message || error);
        return [{ id: "error", type: "text", title: "加载失败", description: "获取最新上映数据失败，请下拉刷新或检查网络" }];
    }
}

// =========================================================================
// 3. 路由与各分类底层
// =========================================================================

async function routeAnimeOmni(params) {
    const source = params.anime_source || "cal";
    let subParams = { page: params.page || 1 };

    if (source === "cal") { subParams.sort_by = params.cal_day || "today"; return await loadBangumiCalendar(subParams); }
    if (source === "bili") { subParams.sort_by = params.bili_sort || "1"; return await loadBilibiliRank(subParams); }
    if (source === "hot") { subParams.category = params.hot_cat || "anime"; return await fetchRecentHot(subParams); }
    if (source === "rank") {
        subParams.category = params.rank_cat || "anime"; subParams.year = params.rank_year || "2026";
        subParams.month = params.rank_month || "all"; subParams.sort = params.rank_sort || "collects";
        return await fetchAirtimeRanking(subParams);
    }
    if (source === "daily") {
        subParams.filterType = params.daily_filter || "today"; subParams.specificWeekday = params.daily_weekday || "1";
        subParams.dailySortOrder = params.daily_sort || "popularity_rat_bgm"; return await fetchDailyCalendarApi(subParams);
    }
    if (source === "tmdb") { subParams.sort_by = params.tmdb_sort || "trending"; return await loadTmdbAnimeRanking(subParams); }
    if (source === "anilist") { subParams.sort_by = params.anilist_sort || "TRENDING_DESC"; return await loadAniListRanking(subParams); }
    if (source === "mal") { subParams.sort_by = params.mal_sort || "airing"; return await loadMalRanking(subParams); }
    return [];
}

async function routeMovieOmni(params) {
    const source = params.movie_source || "general";
    let subParams = { page: params.page || 1 };

    if (source === "general") { subParams.sort_by = params.general_sort || "popular"; return await loadGeneralMovies(subParams); }
    if (source === "yearly") { subParams.sort_by = params.yearly_sort || "2024"; return await loadYearlyBestMovies(subParams); }
    if (source === "genre") { subParams.sort_by = params.genre_sort || "878"; return await loadGenreMovies(subParams); }
    return [];
}

async function loadTmdbTrendEntry(params = {}) {
    const mode = params.tmdb_mode || "trend";
    const page = params.page || 1;
    // 保留原热门趋势；电影/剧集筛选复用 Lite 的 TMDB discover 能力。
    if (mode === "trend") return await loadTmdbHotTrend({ mediaType: "all", region: params.sort_by || "", page });
    // 电影热榜与剧集热榜合并：各取同页数据，按原排行交替展示。
    if (mode === "all_hot") {
        const [movies, shows] = await Promise.all([
            loadTmdbHotTrend({ mediaType: "movie", region: params.sort_by || "", page }),
            loadTmdbHotTrend({ mediaType: "tv", region: params.sort_by || "", page })
        ]);
        const merged = []; const length = Math.max(movies.length, shows.length);
        for (let i = 0; i < length; i++) { if (movies[i]) merged.push(movies[i]); if (shows[i]) merged.push(shows[i]); }
        return merged;
    }
    if (mode === "movie_hot") return await loadTmdbHotTrend({ mediaType: "movie", region: params.sort_by || "", page });
    if (mode === "tv_hot") return await loadTmdbHotTrend({ mediaType: "tv", region: params.sort_by || "", page });
    const isMovie = mode === "movie";
    // 使用 Lite 同一套官方 discover URL，避免 Widget.tmdb 的参数缓存使更改筛选后仍返回旧列表。
    const query = { api_key: LITE_DEFAULT_TMDB_KEY, language: "zh-CN", page: Number(page) || 1, sort_by: params.tmdb_sort || "popularity.desc", include_adult: false };
    if (params.genre) query.with_genres = params.genre;
    if (params.year) { if (isMovie) query.primary_release_year = params.year; else query.first_air_date_year = params.year; }
    if (query.sort_by === "vote_average.desc") query["vote_count.gte"] = 100;
    try {
        const qs = Object.keys(query).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(query[k])}`).join("&");
        const res = await Widget.http.get(`https://api.themoviedb.org/3/discover/${isMovie ? "movie" : "tv"}?${qs}`);
        const data = typeof res.data === "string" ? safeJsonParse(res.data) : res.data;
        return ((data && data.results) || []).map(item => buildImdbItem(item, isMovie ? "movie" : "tv"));
    } catch (e) { return [{ id: "tmdb_filter_error", type: "text", title: "加载失败", description: e.message || "TMDB 筛选请求失败" }]; }
}
async function loadImdbTrendEntry(params = {}) { return await loadImdbList(params.sort_by || "trending_week", params.mediaType || "all", params.page || 1); }
async function loadRtTrendEntry(params = {}) { return await loadRottenTomatoesTrends(params.sort_by || "rt_movies_home", params.page || 1); }
async function loadTraktTrendEntry(params = {}) { return await handleTraktList(params.sort_by || "trending", params.traktType || "all", params.traktClientId || DEFAULT_TRAKT_ID, params.page || 1); }
// 🟢 豆瓣榜单：排序支持（沿用平台剧场一致的排序方式）
function sortDoubanTrendItems(list, sortType) {
    if (!Array.isArray(list) || !list.length) return list || [];
    if (!sortType || sortType === "default") return list;
    if (list[0] && list[0].type === "text") return list; // 错误/空提示项不参与排序
    const toNum = (v) => parseFloat(v) || 0;
    const toTs = (v) => { const t = v ? new Date(v).getTime() : 0; return isNaN(t) ? 0 : t; };
    const updatedTs = (x) => toTs(x.lastUpdateDate) || toTs(x.releaseDate);
    return [...list].sort((a, b) => {
        switch (sortType) {
            case "updated": return updatedTs(b) - updatedTs(a);
            case "recent": return toTs(b.releaseDate) - toTs(a.releaseDate);
            case "heat": return toNum(b.voteCount || b.vote_count) - toNum(a.voteCount || a.vote_count);
            case "trending": return toNum(b.popularity) - toNum(a.popularity);
            case "rating": return toNum(b.rating) - toNum(a.rating);
            default: return 0;
        }
    });
}

async function loadDoubanTrendEntry(params = {}) {
    const sortBy = params.sort_by || "db_tv_cn";
    const page = params.page || 1;
    const sortType = params.sort_type || "default";
    let list;
    if (sortBy === "db_tv_cn") list = await fetchDoubanAndMap("国产剧", "tv", page);
    else if (sortBy === "db_variety") list = await fetchDoubanAndMap("综艺", "tv", page);
    else if (sortBy === "db_movie") list = await fetchDoubanAndMap("热门", "movie", page);
    else if (sortBy === "db_tv_us") list = await fetchDoubanAndMap("美剧", "tv", page);
    else if (sortBy === "custom_url") list = await loadLiteCustomDouban(params);
    else list = await loadDoubanModule({ sort_by: sortBy, page });
    return sortDoubanTrendItems(list, sortType);
}

async function routeTrendsHub(params) {
    const hubSource = params.hub_source || "imdb";
    const page = params.page || 1;

    if (hubSource === "tmdb_hot") {
        return await loadTmdbHotTrend({
            mediaType: params.tmdb_hot_type || "all",
            region: params.sort_by || "",
            page
        });
    }
    if (hubSource === "rt") {
        const rtSort = params.sort_by || "rt_movies_home";
        return await loadRottenTomatoesTrends(rtSort, page);
    }
    if (hubSource === "imdb") {
        const imdbSort = params.sort_by || "trending_week";
        const mediaType = params.mediaType || "all";
        return await loadImdbList(imdbSort, mediaType, page);
    }
    if (hubSource === "trakt") {
        const traktSort = params.sort_by || "trending";
        const traktType = params.traktType || "all";
        const traktClientId = params.traktClientId || DEFAULT_TRAKT_ID;
        return await handleTraktList(traktSort, traktType, traktClientId, page);
    }
    if (hubSource === "douban") {
        const dbSort = params.sort_by || "db_tv_cn";
        let tag = "热门", type = "tv";
        if (dbSort === "db_tv_cn") { tag = "国产剧"; type = "tv"; }
        else if (dbSort === "db_variety") { tag = "综艺"; type = "tv"; }
        else if (dbSort === "db_movie") { tag = "热门"; type = "movie"; }
        else if (dbSort === "db_tv_us") { tag = "美剧"; type = "tv"; }
        return await fetchDoubanAndMap(tag, type, page);
    }
    return [];
}

async function loadTmdbHotTrend({ mediaType = "all", region = "", page = 1 } = {}) {
    const language = "zh-CN";
    const types = mediaType === "all" ? ["tv", "movie"] : [mediaType];
    try {
        const responses = await Promise.all(types.map(type => {
            const endpoint = region ? `/discover/${type}` : `/${type}/popular`;
            const query = { language, page: Number(page) || 1, include_adult: false };
            if (region) {
                query.with_origin_country = region;
                query.sort_by = "popularity.desc";
                query["vote_count.gte"] = 0;
            }
            return Widget.tmdb.get(endpoint, { params: query });
        }));
        const items = [];
        responses.forEach((data, index) => {
            const type = types[index];
            (data.results || []).forEach(item => {
                if (!item || !item.id || !item.poster_path) return;
                const date = item.first_air_date || item.release_date || "";
                items.push({
                    id: String(item.id), tmdbId: item.id, type: "tmdb", mediaType: type,
                    title: item.name || item.title, releaseDate: date,
                    year: date.substring(0, 4), rating: item.vote_average || 0,
                    genreTitle: getGlobalGenreText(item.genre_ids),
                    subTitle: type === "tv" ? "TMDB 热门剧集" : "TMDB 热门电影",
                    description: `${date || "暂无日期"} · ⭐ ${item.vote_average || 0}\n${item.overview || "暂无简介"}`,
                    posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "",
                    backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : ""
                });
            });
        });
        return items;
    } catch (error) {
        console.error("[loadTmdbHotTrend] 请求失败:", error.message || error);
        return [];
    }
}

const MOVIE_GENRE_MAP = {
    16: "动画", 10759: "动作冒险", 35: "喜剧", 18: "剧情", 14: "奇幻", 878: "科幻", 9648: "悬疑", 
    10749: "爱情", 27: "恐怖", 10765: "科幻奇幻", 80: "犯罪", 99: "纪录片", 10751: "家庭", 
    36: "历史", 10402: "音乐", 10770: "电视电影", 53: "惊悚", 10752: "战争", 37: "西部", 28: "动作", 12: "冒险"
};
function movie_getGenreText(ids) {
    if (!ids || !Array.isArray(ids)) return "电影";
    const genres = ids.map(id => MOVIE_GENRE_MAP[id]).filter(Boolean);
    return genres.length > 0 ? genres.slice(0, 2).join(" / ") : "电影";
}
function movie_buildItem(item) {
    if (!item) return null;
    const releaseDate = item.release_date || "";
    return {
        id: String(item.id), tmdbId: parseInt(item.id), type: "tmdb", mediaType: "movie",
        title: item.title, releaseDate: releaseDate, genreTitle: movie_getGenreText(item.genre_ids),    
        subTitle: `${releaseDate.substring(0,4)}`,            
        posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "", 
        backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : "", 
        description: `电影\n${item.overview || "暂无简介"}`
    };
}

async function loadGeneralMovies(params) {
    const sortBy = params.sort_by || "popular";
    let endpoint = "/movie/popular";
    let queryParams = { language: "zh-CN", page: params.page || 1 };
    
    if (sortBy === "top_rated") endpoint = "/movie/top_rated";
    else if (sortBy === "box_office") { endpoint = "/discover/movie"; queryParams.sort_by = "revenue.desc"; }
    else if (sortBy === "oscar") { 
        endpoint = "/discover/movie"; 
        queryParams.with_keywords = "818"; 
        queryParams.sort_by = "vote_average.desc"; 
        queryParams["vote_count.gte"] = 1000; 
    }
    try { const res = await Widget.tmdb.get(endpoint, { params: queryParams }); return (res.results || []).map(i => movie_buildItem(i)).filter(Boolean); } catch (e) { return []; }
}
async function loadYearlyBestMovies(params) {
    try {
        let queryParams = { language: "zh-CN", page: params.page || 1, primary_release_year: params.sort_by || "2024", sort_by: "vote_average.desc", "vote_count.gte": 500 };
        const res = await Widget.tmdb.get("/discover/movie", { params: queryParams }); return (res.results || []).map(i => movie_buildItem(i)).filter(Boolean);
    } catch (e) { return []; }
}
async function loadGenreMovies(params) {
    try {
        let queryParams = { language: "zh-CN", page: params.page || 1, with_genres: params.sort_by || "878", sort_by: "popularity.desc" };
        const res = await Widget.tmdb.get("/discover/movie", { params: queryParams }); return (res.results || []).map(i => movie_buildItem(i)).filter(Boolean);
    } catch (e) { return []; }
}

const ADVANCED_GENRE_MAP = {
    "all": { movie: "", tv: "" }, "scifi": { movie: "878", tv: "10765" }, "mystery": { movie: "9648", tv: "9648" }, "horror": { movie: "27", tv: "27" }, "crime": { movie: "80", tv: "80" },
    "action": { movie: "28", tv: "10759" }, "wuxia": { movie: "28", tv: "10759" }, "war": { movie: "10752", tv: "10768" }, "comedy": { movie: "35", tv: "35" }, "romance": { movie: "10749", tv: "10749" }, "drama": { movie: "18", tv: "18" }, "fantasy": { movie: "14", tv: "10765" }, "animation": { movie: "16", tv: "16" }, "documentary": { movie: "99", tv: "99" }
};
const REGION_MAP = { "all": "", "cn": "CN", "hk": "HK", "tw": "TW", "hktw": "HK|TW", "jp": "JP", "kr": "KR", "jpkr": "JP|KR", "th": "TH", "sg": "SG", "my": "MY", "in": "IN", "apac": "CN|HK|TW|JP|KR|TH|SG|MY|IN", "us": "US", "gb": "GB", "de": "DE", "se": "SE", "europe": "GB|DE|FR|IT|ES|SE|NO|DK|FI|NL|BE|CH|AT|IE", "es": "ES", "mx": "MX", "latin": "ES|MX|AR|CO|CL|PE|VE" };

async function fetchGenreRankData(mediaType, genre, region, sort_rule, page) {
    const genreId = ADVANCED_GENRE_MAP[genre] ? ADVANCED_GENRE_MAP[genre][mediaType] : "";
    const originCountry = REGION_MAP[region] || "";
    let tmdbSortBy = sort_rule === "rating" ? "vote_average.desc" : (sort_rule === "time" ? (mediaType === "movie" ? "primary_release_date.desc" : "first_air_date.desc") : "popularity.desc");
    const queryParams = { language: "zh-CN", page: page, sort_by: tmdbSortBy, include_adult: false, include_video: false };
    if (genreId) queryParams.with_genres = genreId;
    if (originCountry) queryParams.with_origin_country = originCountry;
    queryParams["vote_count.gte"] = sort_rule === "rating" ? 200 : 10;
    if (sort_rule === "time") {
        const today = new Date(); today.setMonth(today.getMonth() + 1); const maxDate = today.toISOString().split('T')[0];
        if (mediaType === "movie") queryParams["primary_release_date.lte"] = maxDate; else queryParams["first_air_date.lte"] = maxDate;
    }
    try {
        const res = await Widget.tmdb.get(`/discover/${mediaType}`, { params: queryParams });
        return (res.results || []).map(item => {
            const date = item.release_date || item.first_air_date || ""; 
            return {
                id: String(item.id), tmdbId: parseInt(item.id), type: "tmdb", mediaType: mediaType, title: item.title || item.name,
                genreTitle: getGlobalGenreText(item.genre_ids),
                releaseDate: date,
                subTitle: `${date ? date.substring(0, 4) : "未知"}`, 
                description: `${date}\n${item.overview || "暂无简介"}`,
                posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "", 
                backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : "", 
                _popularity: item.popularity || 0,
                _date: date || "1970-01-01"
            };
        });
    } catch (e) { return []; }
}

async function fetchDoubanWuxiaRank(mediaType, region, sortRule, page) {
    const start = (Math.max(1, Number(page) || 1) - 1) * 20;
    const doubanSort = sortRule === "rating" ? "S" : (sortRule === "time" ? "R" : "U");
    const regionNames = { cn: "中国大陆", hk: "中国香港", tw: "中国台湾", jp: "日本", kr: "韩国", th: "泰国", us: "美国", gb: "英国", de: "德国", es: "西班牙", in: "印度" };
    const regionName = regionNames[region] || "";
    const selectedCategories = mediaType === "tv"
        ? { "类型": "武侠", "形式": "电视剧", "地区": regionName }
        : { "类型": "武侠", "地区": regionName };
    const tags = ["武侠", regionName].filter(Boolean).join(",");
    const url = `https://m.douban.com/rexxar/api/v2/${mediaType}/recommend?refresh=0&start=${start}&count=20&selected_categories=${encodeURIComponent(JSON.stringify(selectedCategories))}&uncollect=false&score_range=0,10&tags=${encodeURIComponent(tags)}&sort=${doubanSort}`;
    try {
        const response = await Widget.http.get(url, { headers: { "Referer": "https://movie.douban.com/explore", "User-Agent": LITE_UA_PC } });
        const data = typeof response.data === "string" ? safeJsonParse(response.data) : response.data;
        const sourceItems = (data && Array.isArray(data.items) ? data.items : []).filter(item => item && item.card === "subject");
        if (!sourceItems.length) return [];
        const mapped = await Promise.all(sourceItems.map(async item => {
            const rawTitle = item.title || "";
            const year = String(item.year || (item.card_subtitle || "").match(/\b\d{4}\b/)?.[0] || "");
            const tmdb = await searchTmdbForDouban(rawTitle, mediaType, year);
            const target = {
                id: `db_${item.id || rawTitle}`, type: "tmdb", mediaType, title: rawTitle,
                subTitle: `豆瓣 ${item.rating?.value || item.rate || ""}`,
                description: `豆瓣 ${item.rating?.value || item.rate || ""}\n${item.card_subtitle || "暂无简介"}`,
                genreTitle: "武侠", posterPath: item.cover_url || item.cover || "",
                rating: parseFloat(item.rating?.value || item.rate) || 0, popularity: 0, voteCount: 0
            };
            if (tmdb) {
                const tmdbDate = tmdb.first_air_date || tmdb.release_date || "";
                if (!year || !tmdbDate || tmdbDate.slice(0, 4) === year) mergeDoubanTmdb(target, tmdb);
                else mergeDoubanTmdb(target, tmdb);
            }
            return target;
        }));
        return mapped.filter(Boolean);
    } catch (e) {
        console.error(`[DoubanWuxia] ${mediaType} 请求失败: ${e.message}`);
        return [];
    }
}

async function loadDoubanWuxiaGenre(params = {}) {
    const mediaType = params.media_type || "all";
    const region = params.region || "all";
    const sortRule = params.sort_by || "popularity";
    const page = params.page || 1;
    if (mediaType !== "all") return await fetchDoubanWuxiaRank(mediaType, region, sortRule, page);
    const [movies, tvs] = await Promise.all([
        fetchDoubanWuxiaRank("movie", region, sortRule, page),
        fetchDoubanWuxiaRank("tv", region, sortRule, page)
    ]);
    const merged = [];
    const max = Math.max(movies.length, tvs.length);
    for (let i = 0; i < max && merged.length < 20; i++) {
        if (movies[i]) merged.push(movies[i]);
        if (tvs[i] && merged.length < 20) merged.push(tvs[i]);
    }
    return merged;
}

async function loadGenreRank(params = {}) {
    const page = parseInt(params.page) || 1;
    const mediaType = params.media_type || "all"; 
    const genre = params.genre || "all"; 
    const region = params.region || "all"; 
    const sort_rule = params.sort_by || "popularity";

    if (genre === "wuxia") return await loadDoubanWuxiaGenre(params);

    if (mediaType === "all") {
        const [movies, tvs] = await Promise.all([
            fetchGenreRankData("movie", genre, region, sort_rule, page),
            fetchGenreRankData("tv", genre, region, sort_rule, page)
        ]);
        let items = [...movies, ...tvs];
        items.sort((a, b) => { 
            if (sort_rule === "popularity") return b._popularity - a._popularity; 
            else if (sort_rule === "time") return new Date(b._date) - new Date(a._date); 
            else return b.rating - a.rating; 
        });
        items = items.slice(0, 20); 
        if (items.length === 0) return page === 1 ? [{ id: "empty", type: "text", title: "未找到符合条件" }] : [];
        return items;
    } else {
        const items = await fetchGenreRankData(mediaType, genre, region, sort_rule, page);
        if (items.length === 0) return page === 1 ? [{ id: "empty", type: "text", title: "未找到符合条件" }] : [];
        return items;
    }
}

const RT_URLS = {
    "rt_movies_theater": "https://www.rottentomatoes.com/browse/movies_in_theaters/sort:popular?minTomato=75",
    "rt_movies_home": "https://www.rottentomatoes.com/browse/movies_at_home/sort:popular?minTomato=75",
    "rt_movies_best": "https://www.rottentomatoes.com/browse/movies_at_home/sort:critic_highest?minTomato=90",
    "rt_tv_popular": "https://www.rottentomatoes.com/browse/tv_series_browse/sort:popular?minTomato=75",
    "rt_tv_new": "https://www.rottentomatoes.com/browse/tv_series_browse/sort:newest?minTomato=75"
};

async function loadRottenTomatoesTrends(listType, page) {
    const pageSize = 15;
    const allItems = await fetchRottenTomatoesList(listType);
    if (allItems.length === 0) return page === 1 ? [{ id: "empty", type: "text", title: "无数据" }] : [];
    const start = (page - 1) * pageSize;
    const pageItems = allItems.slice(start, start + pageSize);
    const promises = pageItems.map((item, i) => searchRtTmdb(item, start + i + 1));
    return (await Promise.all(promises)).filter(Boolean);
}

async function fetchRottenTomatoesList(type) {
    const url = RT_URLS[type] || RT_URLS["rt_movies_home"];
    try {
        const res = await Widget.http.get(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        const $ = Widget.html.load(res.data || "");
        const items = [];
        $('[data-qa="discovery-media-list-item"]').each((i, el) => {
            const $el = $(el);
            // 标题、评分在 poster-tile 的同级 caption 内，不是 poster-tile 的子元素。
            const $card = $el.parent();
            const title = $card.find('[data-qa="discovery-media-list-item-title"]').text().trim();
            if (!title) return;
            // RT 2026 页面已由 score-pairs 改为 score-pairs-deprecated + rt-text，兼容两种结构。
            const scoreEl = $card.find('score-pairs, score-pairs-deprecated');
            const scores = scoreEl.find('rt-text').map((_, node) => $(node).text().trim()).get();
            items.push({ title: title, tomatoScore: scoreEl.attr('critics-score') || scores[0] || "", popcornScore: scoreEl.attr('audiencescore') || scores[1] || "", mediaType: type.includes("tv") ? "tv" : "movie" });
        });
        return items;
    } catch (e) { return []; }
}

async function searchRtTmdb(rtItem, rank) {
    const cleanTitle = rtItem.title.replace(/\s\(\d{4}\)$/, "");
    try {
        const res = await Widget.tmdb.get(`/search/${rtItem.mediaType}`, { params: { query: cleanTitle, language: "zh-CN" } });
        const match = (res.results || [])[0];
        if (!match) return null;
        let scores = [];
        if (rtItem.tomatoScore) scores.push(`🍅 ${rtItem.tomatoScore}%`);
        if (rtItem.popcornScore) scores.push(`🍿 ${rtItem.popcornScore}%`);
        const customSub = scores.join("  ") || "烂番茄认证";
        const dateStr = match.first_air_date || match.release_date || "";
        
        return {
            id: String(match.id), tmdbId: match.id, type: "tmdb", mediaType: rtItem.mediaType, title: `${rank}. ${match.name || match.title}`, 
            genreTitle: getGlobalGenreText(match.genre_ids) || (rtItem.mediaType === "movie" ? "电影" : "剧集"),
            description: `${dateStr}\n原名: ${rtItem.title}`, releaseDate: dateStr, subTitle: customSub, 
            posterPath: match.poster_path ? `https://image.tmdb.org/t/p/w500${match.poster_path}` : "", 
            backdropPath: match.backdrop_path ? `https://image.tmdb.org/t/p/w780${match.backdrop_path}` : ""
        };
    } catch (e) { return null; }
}

function buildImdbItem(item, forceType) {
    if (!item) return null;
    const type = forceType || item.media_type || (item.title ? "movie" : "tv");
    const fullDate = item.release_date || item.first_air_date || ""; 
    return {
        id: String(item.id), tmdbId: parseInt(item.id), type: "tmdb", mediaType: type, title: item.title || item.name,
        subTitle: fullDate || "", 
        description: fullDate ? `${fullDate}\n${item.overview || "暂无简介"}` : (item.overview || "暂无简介"),
        releaseDate: fullDate, 
        posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "", 
        backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : "",
        year: fullDate.substring(0, 4), 
        genreTitle: getGlobalGenreText(item.genre_ids) || (type === "tv" ? "剧集" : "电影")
    };
}

async function loadImdbList(category, mediaType, page) {
    try {
        let items = [];
        if (category.startsWith("china_")) {
            const isTv = category === "china_tv";
            const endpoint = isTv ? "tv" : "movie";
            const res = await Widget.tmdb.get(`/discover/${endpoint}`, { params: { language: "zh-CN", page: page, sort_by: "popularity.desc", with_original_language: "zh", "vote_count.gte": 2 } });
            items = (res.results || []).map(i => buildImdbItem(i, endpoint));
            return items;
        }
        if (category.startsWith("trending_")) {
            const timeWindow = category === "trending_day" ? "day" : "week";
            const res = await Widget.tmdb.get(`/trending/${mediaType}/${timeWindow}`, { params: { language: "zh-CN", page: page } });
            items = (res.results || []).map(i => buildImdbItem(i));
        } else {
            if (mediaType === "all") {
                const [resM, resT] = await Promise.all([ Widget.tmdb.get(`/movie/${category}`, { params: { language: "zh-CN", page: page } }), Widget.tmdb.get(`/tv/${category}`, { params: { language: "zh-CN", page: page } }) ]);
                const movies = (resM.results || []).map(i => buildImdbItem(i, "movie"));
                const tvs = (resT.results || []).map(i => buildImdbItem(i, "tv"));
                items = [...movies, ...tvs].sort((a, b) => { if (category === "top_rated") return b._rating - a._rating; return 0; }).slice(0, 20);
            } else {
                const res = await Widget.tmdb.get(`/${mediaType}/${category}`, { params: { language: "zh-CN", page: page } });
                items = (res.results || []).map(i => buildImdbItem(i, mediaType));
            }
        }
        return items;
    } catch (e) { return [{ id: "err", type: "text", title: "加载异常" }]; }
}

async function fetchTraktData(type, list, id, page) {
    try {
        const res = await Widget.http.get(`https://api.trakt.tv/${type}/${list}?limit=15&page=${page}`, { headers: { "Content-Type": "application/json", "trakt-api-version": "2", "trakt-api-key": id, "User-Agent": TRAKT_REQUEST_UA } });
        return res.data || [];
    } catch (e) { return []; }
}

async function handleTraktList(listType, traktType, traktClientId, page) {
    let rawData = [];
    if (traktType === "all") {
        const [movies, shows] = await Promise.all([ fetchTraktData("movies", listType, traktClientId, page), fetchTraktData("shows", listType, traktClientId, page) ]);
        rawData = [...movies, ...shows].sort((a, b) => (b.watchers || b.list_count || 0) - (a.watchers || a.list_count || 0));
    } else {
        rawData = await fetchTraktData(traktType, listType, traktClientId, page);
    }
    if (!rawData || rawData.length === 0) return page === 1 ? [] : []; 
    const promises = rawData.slice(0, 20).map(async (item, index) => {
        let subject = item.show || item.movie || item;
        const mediaType = item.show ? "tv" : "movie";
        let stats = listType === "trending" ? `🔥 ${item.watchers || 0} 人在看` : (listType === "anticipated" ? `❤️ ${item.list_count || 0} 人想看` : `No. ${(page - 1) * 15 + index + 1}`); 
        if (traktType === "all") stats = `[${mediaType === "tv" ? "剧" : "影"}] ${stats}`;
        if (!subject || !subject.ids || !subject.ids.tmdb) return null;
        try {
            const d = await Widget.tmdb.get(`/${mediaType}/${subject.ids.tmdb}`, { params: { language: "zh-CN" } });
            return {
                id: String(d.id), tmdbId: d.id, type: "tmdb", mediaType: mediaType, title: d.name || d.title || subject.title,
                genreTitle: getGlobalGenreText(d.genres?.map(g => g.id)), releaseDate: d.first_air_date || d.release_date || "",
                subTitle: stats, 
                description: `${d.first_air_date || d.release_date || ""}\n${d.overview || "暂无简介"}`,
                posterPath: d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : "", 
                backdropPath: d.backdrop_path ? `https://image.tmdb.org/t/p/w780${d.backdrop_path}` : ""
            };
        } catch (e) { return null; }
    });
    return (await Promise.all(promises)).filter(Boolean);
}

function mergeDoubanTmdb(target, source) {
    target.id = String(source.id); target.tmdbId = source.id;
    target.posterPath = source.poster_path ? `https://image.tmdb.org/t/p/w500${source.poster_path}` : target.posterPath;
    target.backdropPath = source.backdrop_path ? `https://image.tmdb.org/t/p/w780${source.backdrop_path}` : "";
    const date = source.first_air_date || source.release_date || ""; target.genreTitle = getGlobalGenreText(source.genre_ids) || (target.mediaType === "tv" ? "剧集" : "电影"); target.releaseDate = date;
    target.description = (date ? `${date} · ${target.subTitle}` : target.subTitle) + (source.overview ? `\n${source.overview}` : "\n暂无简介"); target.rating = source.vote_average ? parseFloat(source.vote_average) : 0;
    target.popularity = parseFloat(source.popularity) || 0; target.voteCount = parseFloat(source.vote_count) || 0;
}

function normalizeDoubanTmdbTitle(title) {
    return String(title || "")
        .toLowerCase()
        .replace(/Ⅱ/g, "ii")
        .replace(/Ⅲ/g, "iii")
        .replace(/[^\p{L}\p{N}]+/gu, "")
        .replace(/ii/g, "2")
        .replace(/iii/g, "3");
}

async function searchTmdbForDouban(query, type, year) {
    const cleaned = String(query || "").replace(/第[一二三四五六七八九十\d]+[季章]/g, "").trim();
    try {
        const res = await Widget.tmdb.get(`/search/${type}`, { params: { query: cleaned, language: "zh-CN" } });
        const results = Array.isArray(res.results) ? res.results : [];
        if (!results.length) return null;
        const wantedTitle = normalizeDoubanTmdbTitle(query);
        const wantedYear = String(year || "");
        const titleMatches = results.filter(item => {
            const candidate = item.title || item.name || "";
            return normalizeDoubanTmdbTitle(candidate) === wantedTitle;
        });
        const yearOf = item => String(item.first_air_date || item.release_date || "").slice(0, 4);
        const exactYearMatches = titleMatches.filter(item => !wantedYear || yearOf(item) === wantedYear);
        const exactYear = exactYearMatches.find(item => item.poster_path) || exactYearMatches[0];
        if (exactYear) return exactYear;
        if (titleMatches.length) return titleMatches.find(item => item.poster_path) || titleMatches[0];
        const yearMatch = results.find(item => !wantedYear || yearOf(item) === wantedYear);
        return yearMatch || results[0];
    } catch (e) { return null; }
}

async function fetchDoubanAndMap(tag, type, page) {
    const start = (page - 1) * 20;
    try {
        const randomBid = Math.random().toString(36).substring(2, 13);
        const res = await Widget.http.get(`https://movie.douban.com/j/search_subjects?type=${type}&tag=${encodeURIComponent(tag)}&sort=recommend&page_limit=20&page_start=${start}`, {
            headers: { 
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
                "Referer": "https://movie.douban.com/explore",
                "Host": "movie.douban.com",
                "X-Requested-With": "XMLHttpRequest", 
                "Cookie": `bid=${randomBid};`
            }
        });

        const data = (typeof res.data === 'string') ? JSON.parse(res.data) : (res.data || {});
        const list = data.subjects || [];
        if (list.length === 0) return page === 1 ? [{ id: "empty", type: "text", title: "暂无数据" }] : [];
        
        const promises = list.map(async item => {
            let finalItem = { 
                id: `db_${item.id}`, type: "tmdb", mediaType: type, 
                title: item.title, subTitle: `豆瓣 ${item.rate}`, 
                description: `豆瓣 ${item.rate}\n暂无简介`, 
                genreTitle: type === "tv" ? "剧集" : "电影",
                posterPath: item.cover,
                rating: parseFloat(item.rate) || 0, popularity: 0, voteCount: 0
            };
            const tmdb = await searchTmdbForDouban(item.title, type, item.year);
            if (tmdb) mergeDoubanTmdb(finalItem, tmdb); 
            return finalItem;
        });
        return await Promise.all(promises);
    } catch (e) { 
        return [{ id: "err", type: "text", title: "豆瓣拒绝了请求", description: "网络IP被豆瓣限制，请切换流量(4G/5G)或更换节点。" }]; 
    }
}

async function loadOfficialTop10(params = {}) {
    const region = params.sort_by || "united-states"; 
    const platform = params.platform || "netflix";
    const mediaType = params.mediaType || "tv";

    let titles = await fetchFlixPatrolData(platform, region, mediaType);

    if (titles.length === 0) {
        return await fetchTmdbFallback_Top10(platform, region, mediaType);
    }

    const searchPromises = titles.slice(0, 10).map((title, index) => 
        searchTmdbForTop10(title, mediaType, index + 1)
    );

    const results = await Promise.all(searchPromises);
    const finalItems = results.filter(r => r !== null);

    if (finalItems.length === 0) {
        return [{ id: "error", title: "匹配失败", description: "获取了榜单但TMDB无数据", type: "text" }];
    }
    return finalItems;
}

async function fetchFlixPatrolData(platform, region, mediaType) {
    const url = region === "world" ? `https://flixpatrol.com/top10/${platform}/` : `https://flixpatrol.com/top10/${platform}/${region}/`;
    try {
        const res = await Widget.http.get(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        const html = typeof res === 'string' ? res : (res.data || "");
        if (!html) return [];
        const $ = Widget.html.load(html);
        const tables = $('.card-table tbody');
        
        let targetTable = null;
        if (tables.length >= 2) targetTable = mediaType === "movie" ? tables.eq(0) : tables.eq(1);
        else if (tables.length === 1) targetTable = tables.eq(0);
        else return [];

        const titles = [];
        targetTable.find('tr').each((i, el) => {
            if (i >= 10) return; 
            const textLink = $(el).find('a.hover\\:underline').text().trim();
            const textTd = $(el).find('td').eq(2).text().trim();
            const finalTitle = textLink || textTd;
            if (finalTitle && finalTitle.length > 1) titles.push(finalTitle.split('(')[0].trim());
        });
        return titles;
    } catch (e) { return []; }
}

async function searchTmdbForTop10(queryTitle, mediaType, rank) {
    try {
        const data = await Widget.tmdb.get(`/search/${mediaType}`, { params: { query: queryTitle.trim(), language: "zh-CN", page: 1 } });
        if (data && data.results && data.results.length > 0) {
            let item = data.results[0];
            const date = item.first_air_date || item.release_date || ""; 
            
            return {
                id: String(item.id), tmdbId: parseInt(item.id), type: "tmdb", mediaType: mediaType, title: item.name || item.title,
                releaseDate: date, year: date.substring(0, 4), genreTitle: getGlobalGenreText(item.genre_ids),
                subTitle: `TOP ${rank}`, posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "",
                backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : "",
                description: `TOP ${rank}\n${item.overview || "暂无简介"}`
            };
        }
    } catch (e) {} return null;
}

async function fetchTmdbFallback_Top10(platform, region, mediaType) {
    const providerMap = { "netflix": "8", "disney": "337", "hbo": "1899|118", "apple-tv": "350", "amazon-prime": "119" };
    const regionMap = { "united-states": "US", "south-korea": "KR", "taiwan": "TW", "hong-kong": "HK", "japan": "JP", "united-kingdom": "GB", "world": "US" };
    try {
        const data = await Widget.tmdb.get(`/discover/${mediaType}`, { params: { watch_region: regionMap[region] || "US", with_watch_providers: providerMap[platform] || "8", sort_by: "popularity.desc", page: 1, language: "zh-CN" } });
        return (data.results || []).slice(0, 10).map((item, index) => {
            const date = item.first_air_date || item.release_date || ""; 
            return {
                id: String(item.id), tmdbId: parseInt(item.id), type: "tmdb", mediaType: mediaType, title: item.name || item.title,
                releaseDate: date, year: date.substring(0, 4), genreTitle: getGlobalGenreText(item.genre_ids), subTitle: `TOP ${index + 1}`,
                posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "", backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : "",
                description: `TOP ${index + 1}\n${item.overview || "暂无简介"}`
            };
        });
    } catch (e) { return []; }
}

const GENRE_MAP = {
    16: "动画", 10759: "动作冒险", 35: "喜剧", 18: "剧情", 14: "奇幻", 
    878: "科幻", 9648: "悬疑", 10749: "爱情", 27: "恐怖", 10765: "科幻奇幻"
};

function getGenreText(ids) {
    if (!ids || !Array.isArray(ids)) return "动画";
    const genres = ids.filter(id => id !== 16).map(id => GENRE_MAP[id]).filter(Boolean);
    return genres.length > 0 ? genres.slice(0, 2).join(" / ") : "动画";
}

function parseDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return '';
    let match = dateStr.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (match) return `${match[1]}-${String(match[2]).padStart(2, '0')}-${String(match[3]).padStart(2, '0')}`;
    match = dateStr.match(/^(\d{4})年(\d{1,2})月/);
    if (match) return `${match[1]}-${String(match[2]).padStart(2, '0')}-01`;
    match = dateStr.match(/^(\d{4})$/);
    if (match) return `${match[1]}-01-01`;
    return dateStr;
}

async function searchTmdbAnimeStrict(title1, title2, year) {
    async function doSearch(query) {
        if (!query || typeof query !== 'string') return null;
        const cleanQuery = query.replace(/第[一二三四五六七八九十\d]+[季章]/g, "").replace(/Season \d+/i, "").trim();
        
        try {
            let params = { query: cleanQuery, language: "zh-CN", include_adult: false };
            if (year) params.first_air_date_year = year;
            
            let res = await Widget.tmdb.get("/search/tv", { params });
            let candidates = res.results || [];
            
            if (candidates.length === 0 && year) {
                delete params.first_air_date_year;
                res = await Widget.tmdb.get("/search/tv", { params });
                candidates = res.results || [];
            }
            
            let animeTvs = candidates.filter(r => r.genre_ids?.includes(16));
            if (animeTvs.length > 0) return animeTvs.find(r => r.poster_path) || animeTvs[0];

            let mParams = { query: cleanQuery, language: "zh-CN", include_adult: false };
            if (year) mParams.primary_release_year = year;
            res = await Widget.tmdb.get("/search/movie", { params: mParams });
            candidates = res.results || [];

            if (candidates.length === 0 && year) {
                delete mParams.primary_release_year;
                res = await Widget.tmdb.get("/search/movie", { params: mParams });
                candidates = res.results || [];
            }
            
            let animeMovies = candidates.filter(r => r.genre_ids?.includes(16));
            if (animeMovies.length > 0) return animeMovies.find(r => r.poster_path) || animeMovies[0];

        } catch (e) {}
        return null;
    }

    let match = await doSearch(title1);
    if (!match && title2 && title1 !== title2) {
        match = await doSearch(title2);
    }
    return match;
}

async function sanitizeAndEnsureTmdb(items) {
    if (!items || !Array.isArray(items)) return [];
    const promises = items.map(async (item) => {
        const title = item.name_cn || item.title || item.name;
        const subTitle = item.title !== title ? item.title : null; 
        const rawDate = item.releaseDate || item.description || item.air_date || item.info || "";
        const yearMatch = rawDate.match(/(\d{4})/);
        const year = yearMatch ? yearMatch[1] : null;

        const tmdbMatch = await searchTmdbAnimeStrict(title, subTitle, year);
        
        if (tmdbMatch) {
            return {
                id: String(tmdbMatch.id),
                tmdbId: parseInt(tmdbMatch.id),
                type: "tmdb",
                mediaType: tmdbMatch.title ? "movie" : "tv",
                title: tmdbMatch.name || tmdbMatch.title || title,
                genreTitle: getGenreText(tmdbMatch.genre_ids),
                description: tmdbMatch.first_air_date || tmdbMatch.release_date || parseDate(rawDate) || "即将播出",
                releaseDate: tmdbMatch.first_air_date || tmdbMatch.release_date || parseDate(rawDate),
                posterPath: tmdbMatch.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbMatch.poster_path}` : "",
                backdropPath: tmdbMatch.backdrop_path ? `https://image.tmdb.org/t/p/w780${tmdbMatch.backdrop_path}` : "",
                rating: tmdbMatch.vote_average ? tmdbMatch.vote_average.toFixed(1) : (item.rating || "0.0")
            };
        }
        return null; 
    });
    
    const results = await Promise.all(promises);
    return results.filter(Boolean);
}

async function loadBangumiCalendar(params = {}) {
    const { sort_by = "today", page = 1 } = params;
    let targetDayId = parseInt(sort_by);
    if (sort_by === "today") {
        const jsDay = new Date().getDay();
        targetDayId = jsDay === 0 ? 7 : jsDay;
    }
    
    try {
        const res = await Widget.http.get("https://api.bgm.tv/calendar");
        const dayData = (res.data || []).find(d => d.weekday && d.weekday.id === targetDayId);
        if (!dayData) return [];
        
        const pageSize = 20;
        const pageItems = dayData.items.slice((page - 1) * pageSize, page * pageSize);

        const promises = pageItems.map(async (item) => {
            const cleanTitle = (item.name_cn || item.name).replace(/第[一二三四五六七八九十\d]+[季章]/g, "").trim();
            const year = item.air_date ? item.air_date.substring(0, 4) : null;
            const tmdbItem = await searchTmdbAnimeStrict(cleanTitle, item.name, year);
            if (!tmdbItem) return null;

            return buildItem({
                id: tmdbItem.id,
                tmdbId: tmdbItem.id,
                type: "tv",
                title: tmdbItem.name || tmdbItem.title || item.name_cn || item.name,
                date: tmdbItem.first_air_date || item.air_date,
                poster: tmdbItem.poster_path,
                backdrop: tmdbItem.backdrop_path,
                rating: tmdbItem.vote_average || item.rating?.score,
                genreText: getGenreText(tmdbItem.genre_ids),
                desc: tmdbItem.overview || item.summary || "暂无简介"
            });
        });
        
        const results = await Promise.all(promises);
        return results.filter(Boolean);
    } catch (e) { return []; }
}

// =========================================================================
// 🚀🚀🚀 全新：接入专属 JSON 抓取源 (Bangumi 近期热门)
// =========================================================================
async function fetchRecentHot(params = {}) {
    const url = "https://raw.githubusercontent.com/MakkaPakka518/List/refs/heads/main/data/bangumi-hot.json";
    
    try {
        const res = await Widget.http.get(url);
        const data = res.data || {};
        const hotList = data.hot_anime || [];

        if (hotList.length === 0) {
            return [{ id: "empty", type: "text", title: "暂无数据", description: "获取到的热门列表为空" }];
        }

        // 分页支持
        const page = parseInt(params.page || "1", 10);
        const pageSize = 20;
        const start = (page - 1) * pageSize;
        const pageItems = hotList.slice(start, start + pageSize);

        return pageItems.map((item, index) => {
            // 智能过滤简介：去除原数据自带的第一行（年份·评分·国家），防止和原生排版重复
            const descLines = (item.description || "").split('\n');
            const pureDesc = descLines.length > 1 ? descLines.slice(1).join('\n') : item.description;

            return buildItem({
                id: item.id,
                tmdbId: item.tmdbId,
                type: item.mediaType || "tv",
                title: item.title,
                date: item.releaseDate || "",
                poster: item.posterPath,
                backdrop: item.backdropPath,
                genreText: item.genreTitle,
                subTitle: `🔥 热度 TOP ${start + index + 1}`,
                desc: pureDesc || "暂无简介"
            });
        });
        
    } catch (error) {
        return [{ id: "error", type: "text", title: "网络异常", description: "获取热门列表失败" }];
    }
}

// =========================================================================
// 🌐 纯净刮削引擎 (彻底抛弃老旧 GitHub 数据请求)
// =========================================================================
async function fetchAirtimeRanking(params = {}) {
    const category = params.category || "anime";
    const year = params.year || `${new Date().getFullYear()}`;
    const month = params.month || "all";
    const sort = params.sort || "collects";
    const page = parseInt(params.page || "1", 10);

    const cacheKey = `airtime-${category}-${year}-${month}-${sort}-${page}`;
    if (ScrapingCache.airtime[cacheKey]) {
        return await sanitizeAndEnsureTmdb(ScrapingCache.airtime[cacheKey]);
    }
    
    let url = `https://bgm.tv/${category}/browser/airtime/${year}/${month}?sort=${sort}&page=${page}`;
    const results = await DynamicDataProcessor.processBangumiPage(url, category);
    ScrapingCache.airtime[cacheKey] = results;
    return await sanitizeAndEnsureTmdb(results);
}

async function fetchDailyCalendarApi(params = {}) {
    if (!ScrapingCache.daily || ScrapingCache.daily.length === 0) {
        ScrapingCache.daily = await DynamicDataProcessor.processDailyCalendar();
    }
    let items = ScrapingCache.daily || [];
    
    const { filterType = "today", specificWeekday = "1", dailySortOrder = "popularity_rat_bgm" } = params;
    const JS_DAY_TO_BGM_API_ID = { 0: 7, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 };
    
    let filteredByDay = [];
    if (filterType === "all_week") {
        filteredByDay = items;
    } else {
        const today = new Date();
        const currentJsDay = today.getDay();
        const targetBgmIds = new Set();
        switch (filterType) {
            case "today": targetBgmIds.add(JS_DAY_TO_BGM_API_ID[currentJsDay]); break;
            case "specific_day": targetBgmIds.add(parseInt(specificWeekday, 10)); break;
            case "mon_thu": [1, 2, 3, 4].forEach(id => targetBgmIds.add(id)); break;
            case "fri_sun": [5, 6, 7].forEach(id => targetBgmIds.add(id)); break;
        }
        filteredByDay = items.filter(item => item.bgm_weekday_id && targetBgmIds.has(item.bgm_weekday_id));
    }

    let sortedResults = [...filteredByDay];
    if (dailySortOrder !== "default") {
        sortedResults.sort((a, b) => {
            if (dailySortOrder === "popularity_rat_bgm") return (b.bgm_rating_total || 0) - (a.bgm_rating_total || 0);
            if (dailySortOrder === "score_bgm_desc") return (b.bgm_score || 0) - (a.bgm_score || 0);
            if (dailySortOrder === "airdate_desc") {
                const dateA = a.air_date || 0;
                const dateB = b.air_date || 0;
                return new Date(dateB).getTime() - new Date(dateA).getTime();
            }
            return 0;
        });
    }
    return await sanitizeAndEnsureTmdb(sortedResults);
}

async function loadBilibiliRank(params = {}) {
    const { sort_by = "1", page = 1 } = params; 
    const url = `https://api.bilibili.com/pgc/web/rank/list?day=3&season_type=${sort_by}`; 
    try {
        const res = await Widget.http.get(url, { headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://www.bilibili.com/" } });
        const data = res.data || {};
        const fullList = data.result?.list || data.data?.list || [];
        const pageSize = 20;
        const slicedList = fullList.slice((page - 1) * pageSize, page * pageSize);

        const promises = slicedList.map(async (item) => {
            const cleanTitle = item.title.replace(/第[一二三四五六七八九十\d]+[季章]/g, "").trim();
            const tmdbItem = await searchTmdbAnimeStrict(cleanTitle, item.title, null);
            if (!tmdbItem) return null; 
            return buildItem({
                id: tmdbItem.id, tmdbId: tmdbItem.id, type: "tv", title: tmdbItem.name || tmdbItem.title,
                date: tmdbItem.first_air_date, poster: tmdbItem.poster_path, backdrop: tmdbItem.backdrop_path, rating: tmdbItem.vote_average?.toFixed(1),
                genreText: getGlobalGenreText(tmdbItem.genre_ids), desc: tmdbItem.overview, subTitle: item.new_ep?.index_show || "热播中"
            });
        });
        const results = await Promise.all(promises);
        return results.filter(Boolean); 
    } catch (e) { return []; }
}

async function loadTmdbAnimeRanking(params = {}) {
    const { sort_by = "trending", page = 1 } = params; 
    let queryParams = { language: "zh-CN", page: page, with_genres: "16", with_original_language: "ja" };
    
    if (sort_by === "trending") queryParams.sort_by = "popularity.desc"; 
    else if (sort_by === "new") queryParams.sort_by = "first_air_date.desc"; 
    else if (sort_by === "top") queryParams.sort_by = "vote_average.desc"; 

    try {
        const res = await Widget.tmdb.get("/discover/tv", { params: queryParams });
        return (res.results || []).map(item => buildItem({
            id: item.id, tmdbId: item.id, type: "tv", title: item.name || item.title, date: item.first_air_date, poster: item.poster_path, backdrop: item.backdrop_path, rating: item.vote_average?.toFixed(1), genreText: getGlobalGenreText(item.genre_ids), desc: item.overview
        }));
    } catch (e) { return []; }
}

async function loadAniListRanking(params = {}) {
    const { sort_by = "TRENDING_DESC", page = 1 } = params; 
    const query = `query ($page: Int, $perPage: Int) { Page (page: $page, perPage: $perPage) { media (sort: ${sort_by}, type: ANIME) { title { native romaji english } averageScore seasonYear } } }`; 
    try {
        const res = await Widget.http.post("https://graphql.anilist.co", { query, variables: { page, perPage: 20 } });
        const data = res.data?.data?.Page?.media || [];
        const promises = data.map(async (media) => {
            const tmdbItem = await searchTmdbAnimeStrict(media.title.native || media.title.romaji, media.title.english, media.seasonYear);
            if (!tmdbItem) return null; 
            return buildItem({ id: tmdbItem.id, tmdbId: tmdbItem.id, type: "tv", title: tmdbItem.name || tmdbItem.title, date: tmdbItem.first_air_date, poster: tmdbItem.poster_path, backdrop: tmdbItem.backdrop_path, rating: tmdbItem.vote_average?.toFixed(1), genreText: getGlobalGenreText(tmdbItem.genre_ids), desc: tmdbItem.overview });
        });
        const results = await Promise.all(promises);
        return results.filter(Boolean);
    } catch (e) { return []; }
}

async function loadMalRanking(params = {}) {
    const { sort_by = "airing", page = 1 } = params; 
    let apiParams = { page: page };
    if (sort_by === "airing") apiParams.filter = "airing"; 
    else if (sort_by === "upcoming") apiParams.filter = "upcoming"; 

    try {
        const res = await Widget.http.get("https://api.jikan.moe/v4/top/anime", { params: apiParams });
        const data = res.data?.data || [];
        const promises = data.map(async (item) => {
            const tmdbItem = await searchTmdbAnimeStrict(item.title_japanese || item.title, item.title_english, null);
            if (!tmdbItem) return null; 
            return buildItem({ id: tmdbItem.id, tmdbId: tmdbItem.id, type: "tv", title: tmdbItem.name || tmdbItem.title, date: tmdbItem.first_air_date, poster: tmdbItem.poster_path, backdrop: tmdbItem.backdrop_path, rating: tmdbItem.vote_average?.toFixed(1), genreText: getGlobalGenreText(tmdbItem.genre_ids), desc: tmdbItem.overview });
        });
        const results = await Promise.all(promises);
        return results.filter(Boolean);
    } catch (e) { return []; }
}

const DynamicDataProcessor = (() => {
    function parseBangumiListItems(htmlContent) {
        const $ = Widget.html.load(htmlContent);
        const items = [];
        $('ul#browserItemList li.item').each((_, element) => {
            const $item = $(element);
            const id = $item.attr('id')?.substring(5);
            if (!id) return;
            const title = $item.find('h3 a.l').text().trim();
            const info = $item.find('p.info.tip').text().trim();
            const rating = $item.find('small.fade').text().trim();
            items.push({ id, title, info, rating });
        });
        return items;
    }

    async function processBangumiPage(url, category) {
        try {
            const listHtmlResp = await Widget.http.get(url);
            return parseBangumiListItems(listHtmlResp.data);
        } catch (error) { return []; }
    }

    async function processDailyCalendar() {
        try {
            const apiResponse = await Widget.http.get("https://api.bgm.tv/calendar");
            const allItems = [];
            if (apiResponse && Array.isArray(apiResponse.data)) {
                apiResponse.data.forEach(dayData => {
                    if (dayData && Array.isArray(dayData.items)) {
                        dayData.items.forEach(item => {
                            item.bgm_weekday_id = dayData.weekday?.id;
                            allItems.push(item);
                        });
                    }
                });
            }
            return allItems;
        } catch (error) { return []; }
    }
    return { processBangumiPage, processDailyCalendar };
})();


// ================= 影视榜单Lite =================
var LITE_GENRE_MAP = {
  28:"动作",12:"冒险",16:"动画",35:"喜剧",80:"犯罪",99:"纪录片",18:"剧情",10751:"家庭",14:"奇幻",36:"历史",27:"恐怖",10402:"音乐",9648:"悬疑",10749:"爱情",878:"科幻",10770:"电视电影",53:"惊悚",10752:"战争",37:"西部",10759:"动作冒险",10765:"科幻奇幻"
};

var LITE_DEFAULT_TMDB_KEY = "d913a144d0ba98fdca978f53a1ce27a5";
var LITE_UA_PC = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36";
const LITE_DOUBAN_URLS = {
 tv_american:"https://m.douban.com/rexxar/api/v2/subject_collection/tv_american/items", tv_korean:"https://m.douban.com/rexxar/api/v2/subject_collection/tv_korean/items", tv_japanese:"https://m.douban.com/rexxar/api/v2/subject_collection/tv_japanese/items", tv_domestic:"https://m.douban.com/rexxar/api/v2/subject_collection/tv_domestic/items", tv_animation:"https://m.douban.com/rexxar/api/v2/subject_collection/tv_animation/items", movie_hot:"https://m.douban.com/rexxar/api/v2/subject_collection/movie_real_time_hotest/items", movie_weekly:"https://m.douban.com/rexxar/api/v2/subject_collection/movie_weekly_best/items", movie_top250:"https://m.douban.com/rexxar/api/v2/subject_collection/movie_top250/items", movie_showing:"https://m.douban.com/rexxar/api/v2/subject_collection/movie_showing/items", show_domestic:"https://m.douban.com/rexxar/api/v2/subject_collection/show_domestic/items", show_foreign:"https://m.douban.com/rexxar/api/v2/subject_collection/show_foreign/items", tv_global_best:"https://m.douban.com/rexxar/api/v2/subject_collection/tv_global_best_weekly/items", tv_chinese_best:"https://m.douban.com/rexxar/api/v2/subject_collection/tv_chinese_best_weekly/items", custom_movie_hot:"https://m.douban.com/rexxar/api/v2/subject_collection/movie_real_time_hotest/items", custom_tv_hot:"https://m.douban.com/rexxar/api/v2/subject_collection/tv_real_time_hotest/items", custom_subject_hot:"https://m.douban.com/rexxar/api/v2/subject_collection/subject_real_time_hotest/items", custom_movie_weekly:"https://m.douban.com/rexxar/api/v2/subject_collection/movie_weekly_best/items", custom_tv_chinese:"https://m.douban.com/rexxar/api/v2/subject_collection/tv_chinese_best_weekly/items", custom_tv_global:"https://m.douban.com/rexxar/api/v2/subject_collection/tv_global_best_weekly/items", custom_show_domestic:"https://m.douban.com/rexxar/api/v2/subject_collection/show_domestic/items", custom_show_foreign:"https://m.douban.com/rexxar/api/v2/subject_collection/show_foreign/items", custom_movie_showing:"https://m.douban.com/rexxar/api/v2/subject_collection/movie_showing/items", custom_tv_animation:"https://m.douban.com/rexxar/api/v2/subject_collection/tv_animation/items"
};
function safeJsonParse(data) {
    try {
        if (typeof data === 'object') return data;
        return JSON.parse(data);
    } catch (e) { return null; }
}

function getTmdbImage(path) {
    if (!path) return undefined;
    if (path.startsWith("/")) return "https://image.tmdb.org/t/p/w500" + path;
    return path;
}

function getGenreString(ids) {
    if (!ids || !ids.length) return "";
    return ids.map(function(id) { return LITE_GENRE_MAP[id]; })
              .filter(Boolean)
              .slice(0, 3) 
              .join(" / ");
}

// 🔴 新增：清洗豆瓣剧名，剥离季数等后缀提高匹配率
function cleanDoubanTitle(rawTitle) {
    if (!rawTitle) return "";
    var title = rawTitle.trim();
    // 剔除 "第一季"、"第2部"、"Season 1" 等
    title = title.replace(/第[一二三四五六七八九十百\d]+[季部]/g, '');
    title = title.replace(/season\s*\d+/ig, '');
    // 压缩多余空格
    title = title.replace(/\s+/g, ' ').trim();
    return title;
}

// ============================================================================
// 🟢 模块逻辑 1：豆瓣 (统一入口)
// ============================================================================

async function searchTmdb(title, year, apiKey, isTv) {
    if (!title) return null;
    var url = "https://api.themoviedb.org/3/search/multi?api_key=" + apiKey + "&language=zh-CN&query=" + encodeURIComponent(title);
    try {
        var res = await Widget.http.get(url);
        var data = safeJsonParse(res.data);
        if (!data || !data.results || data.results.length === 0) return null;
        
        var validItems = data.results.filter(function(item) {
            return item.media_type === 'movie' || item.media_type === 'tv';
        });
        if (validItems.length === 0) return null;

        if (year) {
            var targetYear = parseInt(year);
            var match = validItems.find(function(item) {
                var d = item.release_date || item.first_air_date || "0000";
                var y = parseInt(d.substring(0, 4));
                return Math.abs(y - targetYear) <= 1;
            });
            if (match) return match;
        }

        if (isTv) {
             var tvMatch = validItems.find(function(item) { return item.media_type === 'tv'; });
             if (tvMatch) return tvMatch;
        }
        return validItems[0];
    } catch (e) { return null; }
}

async function loadDoubanModule(params) {
    var categoryKey = params.sort_by || "tv_american";
    var url = LITE_DOUBAN_URLS[categoryKey];
    
    if (!url) return [{ title: "配置错误", subTitle: "未找到API", type: "text" }];

    var page = params.page || 1;
    var apiKey = LITE_DEFAULT_TMDB_KEY;
    var isTv = (url.indexOf("tv") > -1 || url.indexOf("show") > -1);

    var count = 20;
    var start = (page - 1) * count;
    var finalUrl = url.includes("?") ? `${url}&start=${start}&count=${count}` : `${url}?start=${start}&count=${count}`;

    try {
        var headers = { "Referer": "https://m.douban.com/", "User-Agent": LITE_UA_PC };
        var res = await Widget.http.get(finalUrl, { headers: headers });
        var data = safeJsonParse(res.data);
        
        if (!data || !data.subject_collection_items) return [{ title: "列表为空", type: "text" }];

        var items = data.subject_collection_items;
        var promises = items.map(async function(item) {
            var rawTitle = item.title;
            // 🔴 关键改动：搜索前先清洗剧名
            var cleanTitle = cleanDoubanTitle(rawTitle);
            
            var year = item.year;
            var sub = item.card_subtitle || "";
            var rate = item.rating ? item.rating.value.toFixed(1) : "0.0";
            
            var tmdbItem = await searchTmdb(cleanTitle, year, apiKey, isTv);

            // 🔴 关键改动：如果匹配成功则返回数据，匹配失败则直接丢弃 (返回 null)
            if (tmdbItem) {
                var dateStr = tmdbItem.release_date || tmdbItem.first_air_date || (year + "");
                var yearStr = dateStr.substring(0, 4);
                var genreStr = getGenreString(tmdbItem.genre_ids);
                var finalGenreTitle = genreStr || (isTv ? "剧集" : "电影");

                return {
                    id: String(tmdbItem.id),
                    tmdbId: tmdbItem.id,
                    type: "tmdb",
                    mediaType: tmdbItem.media_type,
                    title: tmdbItem.title || tmdbItem.name || rawTitle, // 界面显示依然保留原始名或TMDB名
                    
                    genreTitle: finalGenreTitle, 
                    subTitle: dateStr ? `⭐ ${rate} | ${dateStr}` : `⭐ ${rate}`,
                    description: dateStr ? `${dateStr} · ⭐ ${rate}\n${item.info || tmdbItem.overview || "暂无简介"}` : (item.info || tmdbItem.overview),
                    
                    posterPath: getTmdbImage(tmdbItem.poster_path),
                    backdropPath: getTmdbImage(tmdbItem.backdrop_path),
                    rating: parseFloat(rate) || tmdbItem.vote_average,
                    popularity: tmdbItem.popularity || 0,
                    voteCount: tmdbItem.vote_count || 0,
                    releaseDate: dateStr,
                    year: yearStr
                };
            }
            
            return null; // 搜不到直接抛弃
        });
        
        var results = await Promise.all(promises);
        
        // 🔴 关键改动：过滤掉所有 null 的数据，不给客户端返回
        var finalResults = results.filter(function(r) { return r !== null; });
        
        if (finalResults.length === 0) return [{ title: "数据为空", subTitle: "本页无匹配TMDB的数据", type: "text" }];
        
        return finalResults;
        
    } catch (e) { return [{ title: "错误", subTitle: e.message, type: "text" }]; }
}

// ============================================================================
// 🔵 模块逻辑 2：TMDB (统一入口)
// ============================================================================

function buildTmdbItem(item, mediaType) {
    var title = item.title || item.name;
    var dateStr = item.release_date || item.first_air_date || "";
    var yearStr = dateStr.substring(0, 4);
    var vote = item.vote_average ? item.vote_average.toFixed(1) : "0.0";
    var genreNames = getGenreString(item.genre_ids);

    return {
        id: String(item.id),
        tmdbId: item.id,
        type: "tmdb",
        mediaType: mediaType,
        title: title,
        
        genreTitle: genreNames || (mediaType === "tv" ? "剧集" : "电影"),
        subTitle: dateStr ? `⭐ ${vote} | ${dateStr}` : `⭐ ${vote}`,
        description: dateStr ? `${dateStr} · ⭐ ${vote}\n${item.overview || "暂无简介"}` : (item.overview || ""),
        
        posterPath: getTmdbImage(item.poster_path),
        backdropPath: getTmdbImage(item.backdrop_path),
        releaseDate: dateStr,
        year: yearStr,
        rating: item.vote_average
    };
}

async function loadTMDBModule(params) {
    var mode = params.sort_by || "movie"; 
    var page = params.page || 1;
    var sortMethod = params.sortBy || "popularity.desc"; 
    
    var queryParams = {
        api_key: LITE_DEFAULT_TMDB_KEY,
        language: "zh-CN",
        page: page,
        sort_by: sortMethod,
        include_adult: false
    };

    if (params.genre) queryParams.with_genres = params.genre;
    if (params.year) {
        if (mode === "movie") queryParams.primary_release_year = params.year;
        else queryParams.first_air_date_year = params.year;
    }
    if (sortMethod && sortMethod.includes("vote_average")) queryParams["vote_count.gte"] = 100;

    var endpoint = (mode === "movie") ? "/discover/movie" : "/discover/tv";
    var baseUrl = "https://api.themoviedb.org/3";

    try {
        var queryString = Object.keys(queryParams).map(k => k + '=' + queryParams[k]).join('&');
        var res = await Widget.http.get(`${baseUrl}${endpoint}?${queryString}`);
        var data = safeJsonParse(res.data);
        var items = (data && data.results) ? data.results : [];
        return items.map(function(item) { return buildTmdbItem(item, mode); });
    } catch (e) { return []; }
}
// ============================================================================
// 🗓 模块逻辑：追剧日历 (实时计算本周更新)
// ============================================================================

async function loadCalendarModule(params) {
    var dateChoice = params.dateStr || "today";
    var showType = params.showType || "all";
    var page = params.page || 1;
    
    // 📅 核心黑科技 1：实时计算目标日期 (算出本周一到周日的具体是哪一天 YYYY-MM-DD)
    var targetDate = new Date();
    if (dateChoice !== "today") {
        var currentDay = targetDate.getDay(); 
        var currentIsoDay = currentDay === 0 ? 7 : currentDay; // 强制转换：周日从 0 变成 7
        var targetIsoDay = parseInt(dateChoice); // 获取下拉框里选择的 1 ~ 7
        var diffDays = targetIsoDay - currentIsoDay; // 算出相差的天数
        targetDate.setDate(targetDate.getDate() + diffDays);
    }
    
    var year = targetDate.getFullYear();
    var month = ("0" + (targetDate.getMonth() + 1)).slice(-2);
    var day = ("0" + targetDate.getDate()).slice(-2);
    var exactDateStr = year + "-" + month + "-" + day; // 最终得到比如 2024-05-20
    
    // 🌐 核心黑科技 2：拿着精准日期，去 TMDB “点杀”获取当天的影视
    var baseUrl = "https://api.themoviedb.org/3/discover";
    var commonParams = `api_key=${LITE_DEFAULT_TMDB_KEY}&language=zh-CN&page=${page}&sort_by=popularity.desc`;
    var rawResults = [];

    try {
        // 📺 抓取剧集类 (包含 TV、动漫、综艺)
        if (showType === 'tv' || showType === 'anime' || showType === 'show' || showType === 'all') {
            var tvUrl = `${baseUrl}/tv?${commonParams}&air_date.gte=${exactDateStr}&air_date.lte=${exactDateStr}`;
            
            // 精准过滤流派 (剔除动漫和综艺，让剧集更纯粹)
            if (showType === 'anime') tvUrl += "&with_genres=16";
            if (showType === 'show') tvUrl += "&with_genres=10764";
            if (showType === 'tv' || showType === 'all') tvUrl += "&without_genres=16,10764"; 

            var resTv = await Widget.http.get(tvUrl);
            var dataTv = safeJsonParse(resTv.data);
            if (dataTv && dataTv.results) {
                // 打上 media_type 标签，方便后续构建
                dataTv.results.forEach(item => { item.media_type = 'tv'; rawResults.push(item); });
            }
        }

        // 🎬 抓取电影类 (电影的日期字段和剧集不一样，是 primary_release_date)
        if (showType === 'movie' || showType === 'all') {
            var movieUrl = `${baseUrl}/movie?${commonParams}&primary_release_date.gte=${exactDateStr}&primary_release_date.lte=${exactDateStr}`;
            var resMovie = await Widget.http.get(movieUrl);
            var dataMovie = safeJsonParse(resMovie.data);
            if (dataMovie && dataMovie.results) {
                dataMovie.results.forEach(item => { item.media_type = 'movie'; rawResults.push(item); });
            }
        }

        // 🌟 将结果按 TMDB 的流行度 (Popularity) 从高到低排序，避免好剧被烂剧挤下去
        rawResults.sort(function(a, b) {
            return (b.popularity || 0) - (a.popularity || 0);
        });

        if (rawResults.length === 0) {
            return [{ title: "今日无更新", subTitle: "去别的日子看看吧", type: "text" }];
        }

        // 最终通过现有的 buildTmdbItem 渲染成卡片
        return rawResults.map(function(item) {
            return buildTmdbItem(item, item.media_type);
        });

    } catch (e) {
        return [{ title: "错误", subTitle: e.message, type: "text" }];
    }
}


async function liteLoadDoubanModule(params) {
    return await loadDoubanModule(params);
}

async function liteLoadCalendarModule(params) {
    return await loadCalendarModule(params);
}

async function liteLoadTMDBModule(params) {
    return await loadTMDBModule(params);
}


// Lite stable implementation: use ForwardWidget TMDB runtime directly.
const LITE_CATEGORY_MAP = {
  tv_american: {type:"tv", country:"US"}, tv_korean:{type:"tv",country:"KR"}, tv_japanese:{type:"tv",country:"JP"}, tv_domestic:{type:"tv",country:"CN"}, tv_animation:{type:"tv",genre:"16"},
  movie_hot:{type:"movie",sort:"popularity.desc"}, movie_weekly:{type:"movie",sort:"vote_average.desc"}, movie_top250:{type:"movie",sort:"vote_average.desc"}, movie_showing:{type:"movie",sort:"primary_release_date.desc"},
  show_domestic:{type:"tv",country:"CN",genre:"10764"}, show_foreign:{type:"tv",genre:"10764"}, tv_global_best:{type:"tv",sort:"vote_average.desc"}, tv_chinese_best:{type:"tv",country:"CN",sort:"vote_average.desc"}
};
function liteStableItem(x, type) {
  const date=x.release_date||x.first_air_date||"";
  return {id:x.id,type:"tmdb",mediaType:type,title:x.title||x.name,posterPath:x.poster_path||"",backdropPath:x.backdrop_path||"",releaseDate:date,rating:x.vote_average||0,description:x.overview||"暂无简介"};
}
async function loadLiteStable_unused(params={}) {
  const source=params.lite_source||"douban", page=Number(params.page||1);
  try {
    if(source==="tmdb") {
      const type=params.sort_by||"movie", q={language:"zh-CN",page,sort_by:params.sortBy||"popularity.desc",include_adult:false};
      if(params.genre) q.with_genres=params.genre;
      if(params.year) q[type==="movie"?"primary_release_year":"first_air_date_year"]=params.year;
      const r=await Widget.tmdb.get("discover/"+type,{params:q});
      return (r.results||[]).map(x=>liteStableItem(x,type));
    }
    if(source==="calendar") {
      const r=await Widget.tmdb.get("trending/all/week",{params:{language:"zh-CN",page}});
      return (r.results||[]).filter(x=>x.media_type==="movie"||x.media_type==="tv").map(x=>liteStableItem(x,x.media_type));
    }
    const c=LITE_CATEGORY_MAP[params.sort_by||"tv_american"]||LITE_CATEGORY_MAP.tv_american;
    const q={language:"zh-CN",page,sort_by:c.sort||"popularity.desc",include_adult:false};
    if(c.country) q.with_origin_country=c.country;
    if(c.genre) q.with_genres=c.genre;
    const r=await Widget.tmdb.get("discover/"+c.type,{params:q});
    return (r.results||[]).map(x=>liteStableItem(x,c.type));
  } catch(e) { console.error("[影视榜单Lite] ",e.message||e); return []; }
}

async function loadLiteDouban(params = {}) { const source=params.lite_source||"douban"; if(source==="calendar") return await loadCalendarModule(params); if(source==="tmdb") return await loadTMDBModule(params); return await liteLoadDoubanModule(params); }

async function liteCustomDoubanFetch(params = {}) {
    const raw = String(params.url || "").trim();
    let url = raw;
    const dispatch = raw.match(/uri=([^&]+)/);
    if (dispatch) url = decodeURIComponent(dispatch[1]);
    const listId = url.match(/doulist\/(\d+)/)?.[1];
    const collection = url.match(/subject_collection\/([A-Za-z0-9_]+)/)?.[1];
    const page = Number(params.page || 1);
    const start = (page - 1) * 20;
    let endpoint;
    if (collection) endpoint = `https://m.douban.com/rexxar/api/v2/subject_collection/${collection}/items?start=${start}&count=20&items_only=1&for_mobile=1`;
    else if (listId) endpoint = `https://www.douban.com/doulist/${listId}/?start=${start}`;
    else return [{ id: "custom_url_invalid", type: "text", title: "片单地址格式不支持", description: "请输入豆列、subject_collection 或 App dispatch 地址" }];
    try {
        const res = await Widget.http.get(endpoint, { headers: { "User-Agent": LITE_UA_PC, "Referer": "https://www.douban.com/" } });
        const data = safeJsonParse(res.data);
        let rows = data?.subject_collection_items || data?.items || data?.subjects || [];
        if (!rows.length && listId && typeof res.data === "string") {
            const matches = [...res.data.matchAll(/<a[^>]+href=["']https?:\/\/movie\.douban\.com\/subject\/(\d+)[^"']*["'][^>]*>([\s\S]*?)<\/a>/g)];
            rows = [...new Map(matches.map(m => [m[1], { id: m[1], title: m[2].replace(/<[^>]+>/g, "").trim(), subtype: "movie" }])).values()];
        }
        if (!rows.length && listId) return await fetchFromDouban({ ...params, list: "custom", url: raw });
        return rows.map((item, i) => {
            const subject = item.subject || item;
            return { id: subject.id || item.id || `custom_${start+i}`, type: "douban", mediaType: subject.subtype === "tv" ? "tv" : "movie", title: subject.title || item.title || "未知标题", posterPath: subject.pic?.normal || subject.cover_url || item.cover_url || "", rating: Number(subject.rating?.value || item.rating?.value || 0), releaseDate: subject.year || item.year || "", description: subject.card_subtitle || item.info || "" };
        });
    } catch (e) { return [{ id: "custom_url_error", type: "text", title: "自定义片单读取失败", description: e.message || "豆瓣返回格式异常" }]; }
}

async function loadLiteCustomDouban(params = {}) {
    const url = String(params.custom_douban_url || "").trim();
    if (!url) return [{ id: "custom_url_empty", type: "text", title: "请输入片单地址" }];
    // 与VOD合集列表的“自定义URL”一致：支持 doulist、subject_collection、豆瓣 App dispatch。
    return await liteCustomDoubanFetch({ ...params, url });
}

async function loadLiteHub(params = {}) {
    const source = params.lite_source || "douban";
    if (source === "calendar") return await liteLoadCalendarModule(params);
    if (source === "tmdb") return await liteLoadTMDBModule({ ...params, sort_by: params.tmdb_sort_by || "movie" });
    if (source === "custom_url" || (source === "douban" && params.sort_by === "custom_url")) return await loadLiteCustomDouban(params);
    return await liteLoadDoubanModule(params);
}

// ================= 平台剧场（删除热门番剧） =================
const THEATER_UTILS = {
  emptyTips: [{ id: "empty", type: "text", title: "⚠️ 加载失败", description: "请检查网络连线" }],

  async fetch(filename) {
    const url = `https://raw.githubusercontent.com/MakkaPakka518/List/refs/heads/main/data/${filename}`;
    return this.fetchUrl(url);
  },

  async fetchTheaterData() {
    return this.fetchAny(THEATER_DATA_URLS, "theater-data");
  },

  // 多源容错：依次尝试，任一成功即返回
  async fetchAny(urls, tag = "data") {
    const list = Array.isArray(urls) ? urls : [urls];
    let lastErr = null;
    for (const url of list) {
      try {
        let resp;
        try {
          // 优先要求桥接层解码 JSON；旧版本不接受 options 时再退回单参数调用。
          resp = await Widget.http.get(url, { decodable: true });
        } catch (_) {
          resp = await Widget.http.get(url);
        }
        const raw = resp?.data ?? resp;
        if (!raw) throw new Error("空响应");
        const data = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (!data || typeof data !== "object") throw new Error("数据格式异常");
        return data;
      } catch (e) {
        lastErr = e;
        console.error(`[${tag}] 数据源失败 ${url}: ${e.message}`);
      }
    }
    console.error(`[${tag}] 全部数据源失败: ${lastErr && lastErr.message}`);
    this.lastError = (lastErr && lastErr.message) || "未知原因";
    return null;
  },

  async fetchUrl(url) {
    try {
      const resp = await Widget.http.get(url, { decodable: true });
      if (!resp?.data) return this.emptyTips;
      return typeof resp.data === "string" ? JSON.parse(resp.data) : resp.data;
    } catch (e) {
      console.error(`[Error] ${url}: ${e.message}`);
      return this.emptyTips;
    }
  },

  // 完全纯本地的同步排序逻辑，速度极快
  sortList(list, sortType) {
    if (!list || !Array.isArray(list) || list.length === 0) return list || [];
    if (!sortType || sortType === "default") return list;

    // 复制数组以防污染原数据
    return [...list].sort((a, b) => {
      switch (sortType) {
        case "updated":
          // 优先取爬虫抓好的 lastUpdateDate，如果没有则回退到 releaseDate (首播)
          const updateA = a.lastUpdateDate ? new Date(a.lastUpdateDate).getTime() : (a.releaseDate ? new Date(a.releaseDate).getTime() : 0);
          const updateB = b.lastUpdateDate ? new Date(b.lastUpdateDate).getTime() : (b.releaseDate ? new Date(b.releaseDate).getTime() : 0);
          return updateB - updateA;
        case "recent":
          const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
          const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
          return dateB - dateA;
        case "heat":
          const heatA = parseFloat(a.voteCount || a.vote_count) || 0;
          const heatB = parseFloat(b.voteCount || b.vote_count) || 0;
          return heatB - heatA;
        case "trending":
          const trendA = parseFloat(a.popularity) || 0;
          const trendB = parseFloat(b.popularity) || 0;
          return trendB - trendA;
        case "rating":
          const rateA = parseFloat(a.rating) || 0;
          const rateB = parseFloat(b.rating) || 0;
          return rateB - rateA;
        default:
          return 0;
      }
    });
  },

  paginate(list, pageNum, pageSize = 24) {
    if (!list || !Array.isArray(list)) return [];
    const p = parseInt(pageNum) || 1;
    const start = (p - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }
};

/**
 * 模块 2：加载精选剧场
 */
const THEATER_DATA_URL = "https://raw.githubusercontent.com/qiguo093/Forward-Widget/main/data/theater-data.json";
const THEATER_DATA_URLS = [
  THEATER_DATA_URL,
  "https://gcore.jsdelivr.net/gh/qiguo093/Forward-Widget@main/data/theater-data.json",
  "https://fastly.jsdelivr.net/gh/qiguo093/Forward-Widget@main/data/theater-data.json",
  "https://raw.githack.com/qiguo093/Forward-Widget/main/data/theater-data.json",
  "https://ghfast.top/https://raw.githubusercontent.com/qiguo093/Forward-Widget/main/data/theater-data.json",
  "https://gh-proxy.com/https://raw.githubusercontent.com/qiguo093/Forward-Widget/main/data/theater-data.json",
  "https://raw.githubusercontent.com/qiguo093/Forward-Widget/main/data/theater-data.json"
];
const THEATER_SHARD_FILES = {
  "迷雾剧场": "mist", "暗流剧场": "anliu", "白夜剧场": "white", "X剧场": "x",
  "横屏短剧": "short", "生花剧场": "shenghua", "大家剧场": "dajia", "小逗剧场": "xiaodou",
  "十分剧场": "shifen", "板凳单元": "bandeng", "萤火单元": "yinghuo", "正午阳光": "zhengwu",
  "恋恋剧场": "lianlian", "悬疑剧场": "xuan疑", "微尘剧场": "weichen"
};

function theaterShardUrls(name) {
  const file = THEATER_SHARD_FILES[name];
  if (!file) return [];
  return [
    `https://raw.githubusercontent.com/qiguo093/Forward-Widget/main/data/theaters/${file}.json`,
    `https://cdn.jsdelivr.net/gh/qiguo093/Forward-Widget@main/data/theaters/${file}.json`,
    `https://fastly.jsdelivr.net/gh/qiguo093/Forward-Widget@main/data/theaters/${file}.json`
  ];
}

function theaterPageItems(items, page) {
  const p = Math.max(1, Number(page) || 1);
  return items.slice((p - 1) * 24, p * 24);
}

function theaterSortItems(items, mode) {
  if (!mode || mode === "default") return items;
  const copy = [...items];
  const num = (v) => Number(v) || 0;
  if (mode === "rating") return copy.sort((a, b) => num(b.rating) - num(a.rating));
  if (mode === "trending") return copy.sort((a, b) => num(b.popularity) - num(a.popularity));
  if (mode === "heat") return copy.sort((a, b) => num(b.voteCount || b.vote_count) - num(a.voteCount || a.vote_count));
  if (mode === "recent" || mode === "updated") {
    const key = mode === "updated" ? "lastUpdateDate" : "releaseDate";
    return copy.sort((a, b) => String(b[key] || "").localeCompare(String(a[key] || "")));
  }
  return copy;
}

// 平台剧场：读取 qiguo093/Forward-Widget 自己生成的纯 TMDB 数据。
const OWN_PLATFORM_THEATER = {
  emptyTips: [{ id: "empty", type: "text", title: "加载失败", description: "请检查网络连接" }],
  async fetch(filename) {
    const url = `https://raw.githubusercontent.com/qiguo093/Forward-Widget/main/data/${filename}`;
    try {
      const resp = await Widget.http.get(url, { decodable: true });
      if (!resp?.data) return this.emptyTips;
      return typeof resp.data === "string" ? JSON.parse(resp.data) : resp.data;
    } catch (e) {
      console.error(`[CopiedPlatformTheater] ${url}: ${e.message}`);
      return this.emptyTips;
    }
  },
  sortList(list, sortType) {
    if (!Array.isArray(list) || !list.length || !sortType || sortType === "default") return list || [];
    return [...list].sort((a, b) => {
      if (sortType === "updated") return new Date(b.lastUpdateDate || b.releaseDate || 0) - new Date(a.lastUpdateDate || a.releaseDate || 0);
      if (sortType === "recent") return new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0);
      if (sortType === "heat") return (parseFloat(b.voteCount || b.vote_count) || 0) - (parseFloat(a.voteCount || a.vote_count) || 0);
      if (sortType === "trending") return (parseFloat(b.popularity) || 0) - (parseFloat(a.popularity) || 0);
      if (sortType === "rating") return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
      return 0;
    });
  },
  paginate(list, page) { const p = parseInt(page) || 1; return Array.isArray(list) ? list.slice((p - 1) * 24, p * 24) : []; }
};

async function loadTheaterList(params = {}) {
  const data = await OWN_PLATFORM_THEATER.fetch("theater-data.json");
  if (data === OWN_PLATFORM_THEATER.emptyTips) return data;
  const brandData = data?.[params.brand || "迷雾剧场"];
  if (!brandData) return [];
  const status = params.status || "all";
  let list = status === "aired" ? (brandData.aired || []) : status === "upcoming" ? (brandData.upcoming || []) : [...(brandData.upcoming || []), ...(brandData.aired || [])];
  list = OWN_PLATFORM_THEATER.sortList(list, params.sort_type);
  return OWN_PLATFORM_THEATER.paginate(list, params.page);
}

/**
 * 模块 4：加载芒果TV热榜
 */
async function loadTheaterMangoTV(params = {}) {
  const data = await THEATER_UTILS.fetch("mgtv-hot.json");
  if (data === THEATER_UTILS.emptyTips) return data;
  
  const sort_by = params.sort_by || "tv";
  let list = data?.[sort_by] || [];

  list = THEATER_UTILS.sortList(list, params.sort_type); // 同步调用
  return THEATER_UTILS.paginate(list, params.page);
}

async function loadTheaterHub(params = {}) {
    const source = params.theater_source || "theater";
    if (source === "mango") return await loadTheaterMangoTV(params);
    return await loadTheaterList(params);
}

function platformCompanyGetBeijingDate() {
    const now = new Date();
    const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    return `${beijingTime.getUTCFullYear()}-${String(beijingTime.getUTCMonth() + 1).padStart(2, "0")}-${String(beijingTime.getUTCDate()).padStart(2, "0")}`;
}

function platformCompanyBuildItem(item, mediaType) {
    const date = item._platformReleaseDate || item.first_air_date || item.release_date || "";
    // discover 返回的 poster/backdrop 并不总是同时存在；两者互相兜底，避免横版卡片空图。
    const poster = item.poster_path || item.backdrop_path || "";
    const backdrop = item.backdrop_path || item.poster_path || "";
    return {
        id: String(item.id),
        tmdbId: item.id,
        type: "tmdb",
        mediaType,
        title: (mediaType === "movie" ? (item.title || item.name) : (item.name || item.title)) || "未命名",
        genreTitle: getGlobalGenreText(item.genre_ids || []),
        releaseDate: date,
        year: date.slice(0, 4),
        subTitle: date ? `⭐ ${Number(item.vote_average || 0).toFixed(1)} | ${date}` : `⭐ ${Number(item.vote_average || 0).toFixed(1)}`,
        description: `${date || "暂无日期"} · ⭐ ${Number(item.vote_average || 0).toFixed(1)}\n${item.overview || "暂无简介"}`,
        posterPath: poster ? `https://image.tmdb.org/t/p/w500${poster}` : "",
        backdropPath: backdrop ? `https://image.tmdb.org/t/p/w780${backdrop}` : "",
        rating: item.vote_average || 0,
        popularity: item.popularity || 0,
        voteCount: item.vote_count || 0
    };
}

async function platformCompanyGetMatchingSeason(item, status, today, language) {
    try {
        const detail = await Widget.tmdb.get(`tv/${item.id}`, { params: { language } });
        const seasons = (detail?.seasons || [])
            .filter(season => Number(season.season_number) > 0 && season.air_date);
        if (!seasons.length) return null;
        const matched = seasons.filter(season => status === "upcoming"
            ? season.air_date >= today
            : status === "released"
                ? season.air_date <= today
                : true);
        if (!matched.length) return null;
        matched.sort((a, b) => String(a.air_date).localeCompare(String(b.air_date)));
        const season = status === "released" ? matched[matched.length - 1] : matched[0];
        return { seasonNumber: Number(season.season_number), airDate: season.air_date };
    } catch (error) {
        console.error("[platformCompany] 季信息补查失败:", item.id, error.message || error);
        return null;
    }
}

function platformCompanyWithSeason(item, season) {
    if (!season) return item;
    return {
        ...item,
        _platformReleaseDate: season.airDate,
        _platformSeasonNumber: season.seasonNumber,
        name: season.seasonNumber > 1 ? `${item.name || item.title} 第${season.seasonNumber}季` : (item.name || item.title),
        title: season.seasonNumber > 1 ? `${item.title || item.name} 第${season.seasonNumber}季` : (item.title || item.name),
        overview: `${season.seasonNumber > 1 ? `第${season.seasonNumber}季` : "本季"} ${item.overview || ""}`.trim()
    };
}

async function platformCompanyLoadNetwork(params, query, results, today, language) {
    const status = params.air_status || "released";
    let items = results;
    if (status !== "released" && status !== "upcoming") return items;
    if (status === "released" || status === "upcoming") {
        items = (await Promise.all(items.map(async item => {
            const season = await platformCompanyGetMatchingSeason(item, status, today, language);
            return season ? platformCompanyWithSeason(item, season) : item;
        }))).filter(Boolean);
    }

    // discover/tv 按整部剧首播日期排序，可能漏掉老剧新季；补查前三页。
    const backfillParams = { ...query };
    if (status === "upcoming") {
        // 与原始模块一致：待播补查不能受整部剧 first_air_date.gte 限制，否则老剧新季会漏掉。
        delete backfillParams["first_air_date.gte"];
        backfillParams.sort_by = "first_air_date.desc";
    }
    const backfillPages = await Promise.all([1, 2, 3].map(page =>
        Widget.tmdb.get("discover/tv", { params: { ...backfillParams, page } }).catch(() => ({ results: [] }))
    ));
    const existing = new Set(items.map(item => String(item.id)));
    const supplemental = [];
    const recentStart = new Date(`${today}T00:00:00Z`);
    recentStart.setUTCDate(recentStart.getUTCDate() - 365);
    const recentStartDate = recentStart.toISOString().slice(0, 10);
    for (const raw of backfillPages.flatMap(page => page.results || [])) {
        if (!raw?.id || existing.has(String(raw.id)) || !raw.poster_path) continue;
        const season = await platformCompanyGetMatchingSeason(raw, status, today, language);
        if (!season || (status === "released" && season.airDate < recentStartDate) || (status === "upcoming" && season.seasonNumber < 2)) continue;
        existing.add(String(raw.id));
        supplemental.push(platformCompanyWithSeason(raw, season));
    }
    items = items.concat(supplemental);
    items.sort((a, b) => String(b._platformReleaseDate || b.first_air_date || "").localeCompare(String(a._platformReleaseDate || a.first_air_date || "")));
    return items;
}

async function platformCompanyLoadDcExtras(params, results, today, language, sortBy) {
    if (String(params.with_companies || "") !== "128064") return results;
    const extraIds = [1061474, 1081003, 49521, 209112, 272, 155, 49026, 44912, 1523140];
    const existing = new Set(results.map(item => String(item.id)));
    const extras = await Promise.all(extraIds.map(async id => {
        if (existing.has(String(id))) return null;
        try {
            const detail = await Widget.tmdb.get(`movie/${id}`, { params: { language } });
            if (!detail?.id) return null;
            const date = detail.release_date || "";
            if (params.air_status === "released" && date > today) return null;
            if (params.air_status === "upcoming" && date && date < today) return null;
            const genres = (detail.genres || []).map(genre => genre.id);
            if (genres.includes(16) || genres.includes(99) || genres.includes(10770)) return null;
            return detail;
        } catch (error) {
            console.error("[platformCompany] DC 电影补查失败:", id, error.message || error);
            return null;
        }
    }));
    // 原始 tmdbCompanies 会过滤动画/纪录片/电视电影，并把 DC 特殊条目并入后重新按上映日期排序。
    const merged = results.filter(item =>
        !(item.genre_ids || []).includes(16) &&
        !(item.genre_ids || []).includes(99) &&
        !(item.genre_ids || []).includes(10770) &&
        String(item.title || item.name || "").trim() !== "Etta's Mission"
    ).concat(extras.filter(Boolean));
    merged.sort((a, b) => {
        const aDate = a.release_date || "";
        const bDate = b.release_date || "";
        return sortBy === "primary_release_date.asc"
            ? aDate.localeCompare(bDate)
            : bDate.localeCompare(aDate);
    });
    return merged;
}

async function loadPlatformCompanyLibrary(params = {}) {
    const source = params.library_source || "network";
    const page = Math.max(1, Number(params.page || 1));
    const language = params.language || "zh-CN";
    const status = params.air_status || "released";
    const sortKey = params.sort_by || "first_air_date.desc";
    const sortBy = source === "company"
        ? (sortKey === "first_air_date.desc" ? "primary_release_date.desc" : sortKey === "first_air_date.asc" ? "primary_release_date.asc" : sortKey)
        : sortKey;
    const isCompany = source === "company";
    const mediaType = isCompany ? "movie" : "tv";
    const today = platformCompanyGetBeijingDate();
    const query = { language, page, sort_by: sortBy, include_adult: false, include_video: false };

    if (isCompany) {
        if (params.with_companies) query.with_companies = params.with_companies;
        if (params.company_genre) query.with_genres = params.company_genre;
        if (params.with_companies !== "128064") query.without_genres = "99,10770";
        if (status !== "upcoming" && params.with_companies !== "128064") query["with_runtime.gte"] = 60;
        if (sortBy === "vote_average.desc") query["vote_count.gte"] = 50;
        if (sortBy === "popularity.desc") { query["vote_count.gte"] = 50; query["vote_average.gte"] = 5.0; }
        if (sortBy === "vote_count.desc") query["vote_average.gte"] = 6.0;
        if (status === "released") query["primary_release_date.lte"] = today;
        else if (status === "upcoming") query["primary_release_date.gte"] = today;
    } else {
        if (params.with_networks) query.with_networks = params.with_networks;
        if (params.network_genre) query.with_genres = params.network_genre;
        const foreign = ["213","2739","49","3186","2552","453","1024","19","4330","94","332","295","6","174","3732","2146","48","952","989","1056","521","866","156","1363"];
        if (params.with_networks && !foreign.includes(String(params.with_networks)) && !params.network_genre) query.without_genres = "99,10764,10767";
        if (sortBy === "vote_average.desc") query["vote_count.gte"] = 30;
        if (status === "released") query["first_air_date.lte"] = today;
        else if (status === "upcoming") query["first_air_date.gte"] = today;
    }

    try {
        const response = await Widget.tmdb.get(`discover/${mediaType}`, { params: query });
        let results = Array.isArray(response?.results) ? response.results : [];
        // 与原始两个模块一致：没有海报的条目不进入列表，避免空卡片。
        results = results.filter(item => item && item.id && item.poster_path && (item.title || item.name) && Array.isArray(item.genre_ids) && item.genre_ids.length > 0);
        if (isCompany) {
            results = await platformCompanyLoadDcExtras(params, results, today, language, sortBy);
        } else {
            results = await platformCompanyLoadNetwork(params, query, results, today, language);
        }
        return results.map(item => platformCompanyBuildItem(item, mediaType));
    } catch (error) {
        console.error("[loadPlatformCompanyLibrary] 请求失败:", error.message || error);
        return [{ id: "platform_company_error", type: "text", title: "加载失败", description: "平台/公司片库请求失败，请稍后重试" }];
    }
}

// ================= 全球追剧时刻表（英文已删除） =================
const CALENDAR_TRAKT_ID = "95b59922670c84040db3632c7aac6f33704f6ffe5cbf3113a056e37cb45cb482";

const CALENDAR_GENRE_MAP = {
    10759: "动作冒险", 16: "动画", 35: "喜剧", 80: "犯罪", 99: "纪录片",
    18: "剧情", 10751: "家庭", 10762: "儿童", 9648: "悬疑", 10763: "新闻",
    10764: "真人秀", 10765: "科幻", 10766: "肥皂剧", 10767: "脱口秀",
    10768: "政治", 37: "西部", 28: "动作", 12: "冒险", 14: "奇幻", 
    878: "科幻", 27: "恐怖", 10749: "爱情", 53: "惊悚", 10752: "战争"
};

function calendarGetGenreText(ids) {
    if (!ids || !Array.isArray(ids)) return "";
    return ids.map(id => CALENDAR_GENRE_MAP[id]).filter(Boolean).slice(0, 1).join("");
}

// 剧集追更专用：家庭(10751)在"今天更新了哪一集"这个场景里没有信息量，
// 而《兰香如故》这类国产剧常被 TMDB 标上它，会显示成"第9集 家庭"。
// 只在剧集追更内部跳过该标签，不影响动漫周更 / 综艺聚合共用的公共函数。
function dramaGetGenreText(ids) {
    if (!ids || !Array.isArray(ids)) return "";
    const list = ids.map(Number).filter(id => id !== 10751);
    return calendarGetGenreText(list.length ? list : ids);
}

// ✨ 核心渲染拦截函数：恢复 year 和 releaseDate 的赋值
function calendarBuildItem({ id, tmdbId, type, title, poster, backdrop, rating, subTitle, desc, year, releaseDate }) {
    // Bangumi/B站常只有竖版封面，TMDB有时只有背景图；两种图片互相兜底，避免横版卡片空白。
    const posterSource = poster || backdrop || "";
    const backdropSource = backdrop || poster || "";
    const fullPoster = posterSource && posterSource.startsWith("http") ? posterSource : (posterSource ? `https://image.tmdb.org/t/p/w500${posterSource}` : "");
    const fullBackdrop = backdropSource && backdropSource.startsWith("http") ? backdropSource : (backdropSource ? `https://image.tmdb.org/t/p/w780${backdropSource}` : "");

    return {
        id: String(id),
        tmdbId: parseInt(tmdbId),
        type: "tmdb",
        mediaType: type,
        title: title,
        
        genreTitle: subTitle, 
        subTitle: subTitle,
        
        posterPath: fullPoster,
        backdropPath: fullBackdrop,
        description: `${subTitle} · ⭐ ${rating}\n${desc || "暂无简介"}`,
        rating: parseFloat(rating) || 0,
        
        // 关键字段恢复
        year: year || "",            // 负责横版榜单的最前面年份
        releaseDate: releaseDate || "" // 负责竖版海报下方的完整日期显示
    };
}

async function calendarFetchTraktChineseAnime(updateDate, dayName) {
    try {
        const url = `https://api.trakt.tv/calendars/all/shows/${updateDate}/1?genres=donghua&countries=cn`;
        const res = await Widget.http.get(url, {
            headers: {
                "Content-Type": "application/json",
                "trakt-api-version": "2",
                "trakt-api-key": CALENDAR_TRAKT_ID,
                "User-Agent": TRAKT_REQUEST_UA
            }
        });
        const rows = Array.isArray(res.data) ? res.data : [];
        const items = await Promise.all(rows.map(async row => {
            const show = row.show || {};
            const episode = row.episode || {};
            const tmdbId = show.ids && show.ids.tmdb;
            if (!tmdbId) return null;
            try {
                const detail = await Widget.tmdb.get(`/tv/${tmdbId}`, { params: { language: "zh-CN" } });
                if (!detail) return null;
                const season = Number(episode.season || 0);
                const number = Number(episode.number || 0);
                const episodeLabel = season || number ? ` · 第${season}季第${number}集` : "";
                return calendarBuildItem({
                    id: tmdbId,
                    tmdbId,
                    type: "tv",
                    title: detail.name || show.title,
                    poster: detail.poster_path,
                    backdrop: detail.backdrop_path,
                    rating: detail.vote_average?.toFixed(1) || "0.0",
                    subTitle: `${updateDate} ${dayName} 国漫 · 今日更新${episodeLabel}`,
                    desc: detail.overview || `Trakt 今日更新${episodeLabel}`,
                    year: updateDate.substring(0, 4),
                    releaseDate: updateDate
                });
            } catch (e) { return null; }
        }));
        return items.filter(Boolean);
    } catch (e) {
        console.error("[calendar] Trakt 国漫更新获取失败:", e.message || e);
        return [];
    }
}

// =========================================================================
// 1. 业务逻辑：动漫周更 (Anime) 
// =========================================================================
const ANIME_CACHE_TTL_MS = 5 * 60 * 1000;
const AnimePageCache = {};
const AnimeCacheTime = {};

async function calendarLoadAnime(params = {}) {
    const weekday = params.sort_by || "today"; 
    const page = Math.max(1, Number(params.page || 1));
    const pageSize = 20;

    const cacheKey = `${weekday}|${page}`;
    const now = Date.now();
    // 首页 (page=1) 时做 5 分钟 TTL 判定：若已超时则整体释放动漫缓存，确保 12:00 新上线的动漫下午刷新可见
    if (page === 1) {
        const lastTime = AnimeCacheTime[weekday] || 0;
        if (!lastTime || (now - lastTime) >= ANIME_CACHE_TTL_MS) {
            Object.keys(AnimePageCache).forEach(k => {
                if (k.startsWith(`${weekday}|`)) delete AnimePageCache[k];
            });
            delete AnimeCacheTime[weekday];
        }
    }
    if (AnimePageCache[cacheKey]) return AnimePageCache[cacheKey];

    let targetDayId = parseInt(weekday);
    if (weekday === "today" || isNaN(targetDayId)) {
        const today = new Date();
        const jsDay = today.getDay();
        targetDayId = jsDay === 0 ? 7 : jsDay;
    }
    const dayName = calendarGetWeekdayName(targetDayId);
    // 显示本次所选周更日，而非作品最初首播日；指定星期则取最近一次该星期。
    const updateDateObj = new Date();
    const currentDayId = updateDateObj.getDay() || 7;
    updateDateObj.setDate(updateDateObj.getDate() + ((targetDayId - currentDayId + 7) % 7));
    const updateDate = [updateDateObj.getFullYear(), String(updateDateObj.getMonth() + 1).padStart(2, "0"), String(updateDateObj.getDate()).padStart(2, "0")].join("-");

    try {
        const [bgmRes, biliRes, traktItems] = await Promise.all([
            Widget.http.get("https://api.bgm.tv/calendar").catch(() => ({ data: [] })),
            Widget.http.get("https://api.bilibili.com/pgc/web/timeline?types=4").catch(() => ({ data: {} })),
            calendarFetchTraktChineseAnime(updateDate, dayName)
        ]);

        const bgmData = bgmRes.data || [];
        const dayData = bgmData.find(d => d.weekday && d.weekday.id === targetDayId);
        const bangumiRawItems = dayData && Array.isArray(dayData.items) ? dayData.items : [];

        // 1. 解析 Bangumi 番剧
        const bangumiPromises = bangumiRawItems.map(async (item) => {
            const title = item.name_cn || item.name;
            const cover = item.images ? (item.images.large || item.images.common) : "";
            let itemData = {
                id: `bgm_${item.id}`,
                tmdbId: 0,
                type: "tv",
                title: title,
                poster: cover,
                backdrop: "",
                rating: item.rating?.score?.toFixed(1) || "0.0",
                genreText: "动画",
                desc: item.summary,
                year: updateDate.substring(0, 4),
                releaseDate: updateDate
            };
            const tmdbItem = await calendarSearchBestMatch(title, item.name);
            if (tmdbItem) {
                itemData.id = String(tmdbItem.id);
                itemData.tmdbId = tmdbItem.id;
                itemData.poster = tmdbItem.poster_path || cover; 
                itemData.backdrop = tmdbItem.backdrop_path;
                itemData.genreText = calendarGetGenreText(tmdbItem.genre_ids) || "动画";
                itemData.desc = tmdbItem.overview || itemData.desc;
                itemData.rating = tmdbItem.vote_average?.toFixed(1) || itemData.rating;
            }
            return calendarBuildItem({
                ...itemData,
                subTitle: `${updateDate} ${dayName} ${itemData.genreText}`
            });
        });

        // 2. 解析 B 站国创周更时间线（真实周更国漫）
        const biliTimeline = (biliRes.data && biliRes.data.result) || [];
        const biliDayObj = biliTimeline.find(d => Number(d.day_of_week) === Number(targetDayId));
        const biliEpisodes = (biliDayObj && biliDayObj.episodes) || [];
        const biliPromises = biliEpisodes.map(async (ep) => {
            const title = ep.title || "";
            const pubIndex = ep.pub_index ? ` · ${ep.pub_index}` : "";
            const cover = ep.cover || "";
            let itemData = {
                id: `bili_${ep.season_id || title}`,
                tmdbId: 0,
                type: "tv",
                title: title,
                poster: cover,
                backdrop: "",
                rating: "0.0",
                genreText: "国漫",
                desc: `今日更新${pubIndex}`,
                year: updateDate.substring(0, 4),
                releaseDate: updateDate
            };
            const tmdbItem = await calendarSearchBestMatch(title);
            if (tmdbItem) {
                itemData.id = String(tmdbItem.id);
                itemData.tmdbId = tmdbItem.id;
                itemData.poster = tmdbItem.poster_path || cover;
                itemData.backdrop = tmdbItem.backdrop_path;
                itemData.desc = tmdbItem.overview || itemData.desc;
                itemData.rating = tmdbItem.vote_average?.toFixed(1) || itemData.rating;
            }
            return calendarBuildItem({
                ...itemData,
                subTitle: `${updateDate} ${dayName} 国漫${pubIndex}`
            });
        });

        const [bangumiItems, biliItems] = await Promise.all([
            Promise.all(bangumiPromises),
            Promise.all(biliPromises)
        ]);

        const seenIds = new Set();
        const dedupeAdd = (item, list) => {
            if (!item) return;
            const key = String(item.tmdbId || item.id || item.title);
            if (seenIds.has(key)) return;
            seenIds.add(key);
            list.push(item);
        };

        const uniqueBiliItems = [];
        biliItems.forEach(item => dedupeAdd(item, uniqueBiliItems));

        const uniqueTraktItems = [];
        traktItems.forEach(item => dedupeAdd(item, uniqueTraktItems));

        const uniqueBangumiItems = [];
        bangumiItems.forEach(item => dedupeAdd(item, uniqueBangumiItems));

        // 3. 不再使用 TMDB 的单日 air_date 作为国漫确认依据：国内连载剧常存在日期偏差。
        // 国漫只采用 B站真实时间线和 Trakt donghua/cn 当天更新结果，避免 TMDB 单日日期偏差。

        // 4. 国漫优先与番剧合理混排：交错合并，确保前页同时看到国漫和番剧
        const allCnItems = [...uniqueBiliItems, ...uniqueTraktItems];
        const mergedAll = [];
        const maxLen = Math.max(allCnItems.length, uniqueBangumiItems.length);
        for (let i = 0; i < maxLen; i++) {
            if (i < allCnItems.length) mergedAll.push(allCnItems[i]);
            if (i < uniqueBangumiItems.length) mergedAll.push(uniqueBangumiItems[i]);
        }

        if (mergedAll.length === 0) {
            const emptyRes = page === 1 ? [{ id: "empty", type: "text", title: "暂无更新" }] : [];
            AnimePageCache[cacheKey] = emptyRes;
            AnimeCacheTime[weekday] = Date.now();
            return emptyRes;
        }

        const start = (page - 1) * pageSize;
        const resSlice = mergedAll.slice(start, start + pageSize);
        AnimePageCache[cacheKey] = resSlice;
        AnimeCacheTime[weekday] = Date.now();
        return resSlice;

    } catch (e) {
        return [{ id: "err", type: "text", title: "加载失败", subTitle: e.message }];
    }
}

// =========================================================================
// 2. 业务逻辑：追剧日历 & 综艺时刻 (原生逻辑)
// =========================================================================

// =========================================================================
// 剧集追更 · 多源引擎
// 数据源分工（各司其职，避免 TMDB 热度榜"截断"漏剧）：
//   · Trakt 当日日历   —— 美剧/韩剧/英剧/日剧等国际剧集，一次请求拿到当天全部 + 具体集数
//   · TVmaze 中国播出表 —— 国产剧（Trakt 不收录国产真人剧）
//   · TMDB             —— 只给"当页要显示的那 20 条"换中文名/海报/评分
// 缓存策略：当天全量数据集驻留内存，下拉翻页与切换地区只做增量，不再重复请求。
// =========================================================================
const DRAMA_PAGE_SIZE = 20;
const DRAMA_CACHE_TTL_MS = 5 * 60 * 1000;
let DramaCacheTime = 0;
const DramaTodayCache = {};      // dateStr → { dataset, enriched, region }
const DramaPremiereCache = {};   // `${mode}|${region}|${dateStr}|${page}` → cards
const DramaTmdbDetailCache = {}; // tmdbId → TMDB 详情
const DramaTvmazeMatch = {};     // TVmaze show.id → TMDB 匹配结果
const DramaCnDayCache = {};      // dateStr → 国产剧当日条目

// 全球聚合净化规则（沿用既有约定，不新增口径）
// 题材：纪录片(99)、家庭(10751)、新闻(10763)、真人秀(10764)、肥皂剧(10766)、脱口秀(10767)
// 产地：印度/泰国/俄罗斯/土耳其/波兰/芬兰/匈牙利/荷兰/罗马尼亚/巴西 + 阿拉伯语区
// 题材关键词：同性恋/BL/GL/耽美；职业摔角/体育竞技
const DRAMA_EXCLUDED_GENRE_IDS = [99, 10751, 10763, 10764, 10766, 10767];
// 动画(16)/儿童(10762)：无论哪个产地都排除 —— 动漫有独立的「动漫周更」模块
const DRAMA_ANIMATION_GENRE_IDS = [16, 10762];
// 服务端只排除"任何地区都不要"的题材，家庭(10751)交给客户端判断，
// 否则《兰香如故》这类被 TMDB 标了家庭标签的国产剧会被服务端参数提前枪毙。
const DRAMA_SERVER_EXCLUDED_GENRE_IDS = [99, 10763, 10764, 10766, 10767];
const DRAMA_EXCLUDED_COUNTRIES = ["IN", "TH", "RU", "TR", "PL", "FI", "HU", "NL", "RO", "BR", "LB", "SY", "AE", "EG", "SA", "JO", "IQ", "KW", "QA", "OM", "BH", "DZ", "MA", "TN"];
const DRAMA_EXCLUDED_LANGUAGES = ["hi", "th", "ru", "tr", "ta", "te", "pl", "fi", "hu", "nl", "ro", "pt", "ar"];
// Trakt 的题材是小写短横线形式，与 TMDB 数字 id 一一对应
const DRAMA_EXCLUDED_TRAKT_GENRES = ["reality", "news", "talk-show", "documentary", "soap", "family", "game-show", "award-show", "sports"];
// 动画/国创/欧美动画一律不收 —— 动漫有独立的「动漫周更」模块，这里只留真人剧
const DRAMA_ANIME_GENRES = ["anime", "donghua", "animation"];
const DRAMA_BL_KEYWORDS = /(?:\bgay\b|\blgbtq?\b|\blesbian\b|\bhomosexual\b|\bsame[- ]sex\b|\bqueer\b|\bboys['’]?\s*love\b|\byaoi\b|\byuri\b|同性恋|耽美|男男|女女|同志|腐剧|双男主|恋上他|爱上他|美少年之恋|绑架我的人)/i;
const DRAMA_SPORTS_KEYWORDS = /(?:\bwrestling\b|\bpro[- ]wrestling\b|\baew\b|\bwwe\b|\bnwa\b|\bmlw\b|\bstardom\b|\bseadlin[n]?ng\b|\btjpw\b|\bufc\b|\bmma\b|\braw\b|\bsmackdown\b|\bcollision\b|\bdynamite\b|\bpowerrr\b|\bbaseball\b|\bfootball\b|\bbasketball\b|プロレス|女子プロレス|摔角|摔跤|格斗|角力|スターダム)/i;
const DRAMA_TRASH_KEYWORDS = /(?:\bsvengoolie\b|\bdice actors\b|\btivolt\b|\bnadie sabe nada\b|\bkovan viikon\b|\balucina[çc][ãa]o\b|\bmegaszt[aá]r\b|\bbeste zangers\b|\bthe missing piece\b|请记住我的名字|绑架我的人)/i;

// TMDB genre_ids 判定（用于首播类，以及详情补全后的兜底）
function dramaIsExcludedTmdbItem(item) {
    const genres = Array.isArray(item.genre_ids) ? item.genre_ids.map(Number) : [];
    if (genres.length === 0) return true;
    // 动画(16)/儿童(10762) 一律不进「剧集追更」—— 该看「动漫周更」，避免番剧刷屏
    if (genres.some(id => DRAMA_ANIMATION_GENRE_IDS.includes(id))) return true;
    const countries = (item.origin_country || []).map(c => String(c).toUpperCase());
    const isChinese = countries.some(c => ["CN", "HK", "TW"].includes(c)) || item.original_language === "zh";
    if (genres.some(id => DRAMA_EXCLUDED_GENRE_IDS.includes(id))) {
        if (!isChinese || genres.some(id => [99, 10763, 10764, 10766, 10767].includes(id))) return true;
    }
    const origLang = String(item.original_language || "").toLowerCase();
    if (countries.some(c => DRAMA_EXCLUDED_COUNTRIES.includes(c))) return true;
    if (DRAMA_EXCLUDED_LANGUAGES.includes(origLang)) return true;
    const text = `${item.name || ""} ${item.original_name || ""} ${item.overview || ""}`;
    if (DRAMA_BL_KEYWORDS.test(text) || DRAMA_TRASH_KEYWORDS.test(text)) return true;
    // 摔角/体育品牌名（AEW、WWE、UFC…）只比对标题：
    // 剧情简介里出现 "football" 的剧本剧（如《未来全明星》）不该被误杀
    const titleText = `${item.name || ""} ${item.original_name || ""}`;
    if (DRAMA_SPORTS_KEYWORDS.test(titleText)) return true;
    const isMajor = countries.some(c => ["CN", "HK", "TW", "US", "GB", "JP", "KR"].includes(c));
    if (!isMajor && (!item.overview || !item.overview.trim()) && (item.vote_count || 0) === 0) return true;
    return false;
}

// 剧集追更专用：家庭(10751)在"今天更新了哪一集"场景里没有信息量，
// 而《兰香如故》这类国产剧常被 TMDB 标上它，会显示成"第9集 家庭"。
function dramaGetGenreText(ids) {
    if (!ids || !Array.isArray(ids)) return "";
    const list = ids.map(Number).filter(id => id !== 10751);
    return calendarGetGenreText(list.length ? list : ids);
}

// -------------------------------------------------------------------------
// ① 国际剧集专线：Trakt 当日日历（一次请求 = 当天全部剧集 + 集数 + TMDB id）
// -------------------------------------------------------------------------
async function dramaFetchTraktDay(dateStr) {
    try {
        // Trakt 的日历按北美时区切分"一天"，边界是模糊的：查 date 会混进次日，
        // 而当日真正要播的剧又有一部分落在前一天。所以从「前一天」起抓 3 天窗口，
        // 再由 dramaCollectTraktEntries 按实际播出日期精确过滤。
        const t = new Date(`${dateStr}T00:00:00Z`);
        t.setUTCDate(t.getUTCDate() - 1);
        const from = t.toISOString().slice(0, 10);
        const url = `https://api.trakt.tv/calendars/all/shows/${from}/3?extended=full`;
        const res = await Widget.http.get(url, {
            headers: {
                "Content-Type": "application/json",
                "trakt-api-version": "2",
                "trakt-api-key": CALENDAR_TRAKT_ID,
                // Trakt 对没有 User-Agent 的请求直接返回 403，必须显式带上
                "User-Agent": TRAKT_REQUEST_UA
            }
        });
        const rows = (res && res.data) || [];
        return Array.isArray(rows) ? rows : [];
    } catch (_) { return null; }   // null 表示不可用，调用方降级
}

// 取一集的"实际播出日期"，对齐 TMDB 详情页显示的日期。
// ⚠️ 坑：Trakt 的 released 是 **UTC 日期**，而 TMDB 详情页用的是 **节目所在地的当地日期**。
// 美剧黄金档 20:00~23:00 ET 播出时，UTC 已经是次日，两者会整整差一天：
//   实测《费城永远阳光灿烂》S18E6 → TMDB 9/14，Trakt released 9/15；
//   实测《未来全明星》S8E11     → TMDB 9/14，Trakt released 9/15；
//   实测《流人》S6E1            → TMDB 9/16，Trakt released 9/16（伦敦时段，不跨日）。
// 所以这里按节目的 airs.timezone 把 first_aired 换算成当地日期，与详情页保持一致。
function dramaTraktAirDate(row) {
    const show = (row && row.show) || {};
    const fa = row && row.first_aired;
    if (fa) {
        const d = new Date(fa);
        if (!isNaN(d.getTime())) {
            const tz = (show.airs && show.airs.timezone) || "";
            if (tz) {
                try {
                    const parts = new Intl.DateTimeFormat("en-US", {
                        timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit"
                    }).formatToParts(d);
                    const pick = t => { for (const p of parts) if (p.type === t) return p.value; return ""; };
                    const y = pick("year"), m = pick("month"), dd = pick("day");
                    if (y && m && dd) return `${y}-${m}-${dd}`;
                } catch (_) { /* Intl 不可用或时区无效 → 走下面的兜底 */ }
                // 兜底：用「节目表的当地播出时刻」与「UTC 时刻」的时差反推当地日期，无需时区库
                const t = String((show.airs && show.airs.time) || "").slice(0, 5);
                const hm = t.match(/^(\d{1,2}):(\d{2})$/);
                if (hm) {
                    const localMin = Number(hm[1]) * 60 + Number(hm[2]);
                    const utcMin = d.getUTCHours() * 60 + d.getUTCMinutes();
                    let diff = localMin - utcMin;
                    if (diff > 780) diff -= 1440;
                    if (diff < -780) diff += 1440;
                    return new Date(d.getTime() + diff * 60000).toISOString().slice(0, 10);
                }
            }
            return d.toISOString().slice(0, 10);
        }
    }
    return row && row.released ? String(row.released).slice(0, 10) : "";
}

// 按剧聚合（同一部剧当天可能连播多集），并套用净化规则
function dramaCollectTraktEntries(rows, dateStr) {
    const byId = {};
    for (const row of rows) {
        const show = (row && row.show) || {};
        const ep = (row && row.episode) || {};
        const tmdbId = show.ids && show.ids.tmdb;
        if (!tmdbId) continue;
        // 精确校验播出日期：Trakt 的日历按北美时区切"天"，边界模糊 ——
        // 实测查 9/15 返回的 111 条里有 72 条实际是 9/16；反过来当天真正要播的
        // 剧又有相当一部分落在 9/14 的查询里。所以上面多抓一天，这里按实际日期过滤。
        if (dateStr && dramaTraktAirDate(row) !== dateStr) continue;
        const genres = (show.genres || []).map(g => String(g).toLowerCase());
        if (genres.length === 0) continue;
        const country = String(show.country || "").toLowerCase();
        const lang = String(show.language || "").toLowerCase();
        const isChinese = ["cn", "hk", "tw"].includes(country) || lang === "zh";
        // 家庭(family) 对国产剧放行 —— 与 TMDB 路径的规则保持一致，
        // 否则《兰香如故》这类被标了家庭标签的国产剧会被误杀；其余题材任何地区都排。
        const blockedGenres = genres.filter(g => DRAMA_EXCLUDED_TRAKT_GENRES.includes(g));
        if (blockedGenres.length) {
            const onlyFamily = blockedGenres.every(g => g === "family");
            if (!(isChinese && onlyFamily)) continue;
        }
        if (genres.some(g => DRAMA_ANIME_GENRES.includes(g))) continue;
        if (DRAMA_EXCLUDED_COUNTRIES.includes(country.toUpperCase())) continue;
        if (DRAMA_EXCLUDED_LANGUAGES.includes(lang)) continue;
        const text = `${show.title || ""} ${show.original_title || ""} ${show.overview || ""}`;
        if (DRAMA_BL_KEYWORDS.test(text) || DRAMA_TRASH_KEYWORDS.test(text)) continue;
        // 摔角/体育品牌名只比对标题，避免误杀"讲球队故事的剧本剧"
        if (DRAMA_SPORTS_KEYWORDS.test(`${show.title || ""} ${show.original_title || ""}`)) continue;
        const key = String(tmdbId);
        if (!byId[key]) {
            byId[key] = {
                source: "trakt", tmdbId, key,
                title: show.title || show.original_title || "",
                country, language: lang,
                rating: show.rating || 0,
                overview: show.overview || "",
                season: Number(ep.season || 0),
                episodes: []
            };
        }
        if (ep.number) byId[key].episodes.push(Number(ep.number));
    }
    return Object.keys(byId).map(k => byId[k]);
}

// -------------------------------------------------------------------------
// ② 国产剧专线：TVmaze 当日播出表
// TMDB discover 按 popularity 排序，《兰香如故》《冬城猎凶》这类热度一般的国产日更剧
// 会排到十几页之后被截断；TVmaze 直接给出"当天有播出的全部剧集"，一次请求覆盖全。
// -------------------------------------------------------------------------
async function dramaFetchTvmazeDay(dateStr, country) {
    try {
        const res = await Widget.http.get(`https://api.tvmaze.com/schedule?date=${dateStr}&country=${country}`);
        const rows = (res && res.data) || [];
        if (!Array.isArray(rows)) return [];
        return rows.filter(r => r && r.show && (!r.airdate || r.airdate === dateStr));
    } catch (_) { return []; }
}

// TVmaze 只给英文名且没有 TMDB id，需回到 TMDB 换中文名/海报/id。
// 优先同年份 + 有海报的结果，避免同名剧误配；结果按 show.id 缓存。
async function dramaSearchTmdbForShow(show) {
    const key = String(show.id || "");
    if (key && key in DramaTvmazeMatch) return DramaTvmazeMatch[key];
    let best = null;
    const year = String(show.premiered || "").substring(0, 4);
    const names = [show.name, show.original_name].filter(Boolean);
    for (const raw of names) {
        try {
            const clean = String(raw).replace(/第[一二三四五六七八九十\d]+[季章]/g, "").trim();
            if (!clean) continue;
            const res = await Widget.tmdb.get("/search/tv", { params: { query: clean, language: "zh-CN", page: 1 } });
            const results = (res && res.results) || [];
            if (!results.length) continue;
            const sameYear = r => year && String(r.first_air_date || "").startsWith(year);
            best = results.find(r => sameYear(r) && r.poster_path) ||
                   results.find(sameYear) ||
                   results.find(r => r.poster_path) || results[0];
            if (best) break;
        } catch (_) { /* 换下一个关键词 */ }
    }
    if (key) DramaTvmazeMatch[key] = best;
    return best;
}

// 只保留真人剧集；TVmaze 的 Animation 类型（国创动画）归「动漫周更」管
const DRAMA_TVMAZE_KEEP_TYPES = ["Scripted"];

async function dramaCollectChineseEntries(dateStr) {
    if (dateStr in DramaCnDayCache) return DramaCnDayCache[dateStr];
    const rows = await dramaFetchTvmazeDay(dateStr, "CN");
    if (!rows.length) { DramaCnDayCache[dateStr] = []; return []; }

    const grouped = {};
    for (const r of rows) {
        const show = r.show || {};
        if (!DRAMA_TVMAZE_KEEP_TYPES.includes(show.type)) continue;
        const sid = String(show.id || "");
        if (!sid) continue;
        if (!grouped[sid]) grouped[sid] = { show, episodes: [] };
        if (r.number) grouped[sid].episodes.push(Number(r.number));
    }
    const groups = Object.keys(grouped).map(k => grouped[k]);
    const matched = await Promise.all(groups.map(async g => ({ g, tmdb: await dramaSearchTmdbForShow(g.show) })));

    const entries = [];
    for (const { g, tmdb } of matched) {
        const show = g.show;
        const text = `${show.name || ""} ${show.original_name || ""}`;
        if (DRAMA_BL_KEYWORDS.test(text) || DRAMA_SPORTS_KEYWORDS.test(text)) continue;
        if (!tmdb) continue;   // 匹配不到 TMDB 就无法打开详情页，跳过
        // 兜底：TVmaze 把部分国创动画归到了 Scripted，用 TMDB 的题材再筛一遍
        const tmdbGenres = Array.isArray(tmdb.genre_ids) ? tmdb.genre_ids.map(Number) : [];
        if (tmdbGenres.some(id => DRAMA_ANIMATION_GENRE_IDS.includes(id))) continue;
        entries.push({
            source: "tvmaze", tmdbId: tmdb.id, key: String(tmdb.id),
            title: tmdb.name || show.name || "",
            country: "cn", language: "zh",
            rating: tmdb.vote_average || (show.rating && show.rating.average) || 0,
            overview: tmdb.overview || String(show.summary || "").replace(/<[^>]+>/g, "").trim(),
            poster: tmdb.poster_path, backdrop: tmdb.backdrop_path,
            genreIds: tmdb.genre_ids,
            season: g.episodes.length ? 1 : 0,
            episodes: g.episodes
        });
    }
    DramaCnDayCache[dateStr] = entries;
    return entries;
}

// -------------------------------------------------------------------------
// ③ 合并当日数据集：按国家轮转交错，保证美剧/韩剧/国产剧同屏出现，无单一产地刷屏
// -------------------------------------------------------------------------
async function dramaBuildTodayDataset(dateStr) {
    let st = DramaTodayCache[dateStr];
    if (st && st.dataset) return st.dataset;
    if (!st) st = DramaTodayCache[dateStr] = {};

    const [traktRows, cnEntries] = await Promise.all([
        dramaFetchTraktDay(dateStr),
        dramaCollectChineseEntries(dateStr)
    ]);
    st.traktOk = traktRows !== null;
    // Trakt 不可用时用 TMDB discover 兜底国际剧集，避免整块空白
    const intl = st.traktOk
        ? dramaCollectTraktEntries(traktRows, dateStr)
        : await dramaCollectTmdbFallback(dateStr);

    // 去重：同一部剧两边都有时以 Trakt 为准（它带集数）
    const cnKeys = {};
    for (const e of intl) cnKeys[e.key] = true;
    const cn = cnEntries.filter(e => !cnKeys[e.key]);

    // 按产地分组，条目多的产地优先排，然后轮转
    const buckets = {};
    for (const e of intl.concat(cn)) {
        const c = e.country || "??";
        if (!buckets[c]) buckets[c] = [];
        buckets[c].push(e);
    }
    const order = Object.keys(buckets).sort((a, b) => buckets[b].length - buckets[a].length || (a < b ? -1 : 1));
    const dataset = [];
    let more = true;
    while (more) {
        more = false;
        for (const c of order) {
            const list = buckets[c];
            if (!list || !list.length) continue;
            dataset.push(list.shift());
            if (list.length) more = true;
        }
    }
    st.dataset = dataset;
    st.enriched = {};
    return dataset;
}

// -------------------------------------------------------------------------
// ④ 取当页卡片：只对"这一页要显示的条目"补 TMDB 中文名/海报，其余保持零请求
// -------------------------------------------------------------------------
async function dramaEnrichEntry(entry) {
    if (entry.source === "tvmaze") return entry;              // 搜索结果已含中文名/海报
    const cached = DramaTmdbDetailCache[entry.tmdbId];
    if (cached !== undefined) return cached ? Object.assign({}, entry, cached) : entry;
    try {
        const d = await Widget.tmdb.get(`/tv/${entry.tmdbId}`, { params: { language: "zh-CN" } });
        if (!d) { DramaTmdbDetailCache[entry.tmdbId] = null; return entry; }
        const info = {
            title: d.name || entry.title,
            poster: d.poster_path || entry.poster,
            backdrop: d.backdrop_path || entry.backdrop,
            rating: d.vote_average || entry.rating,
            overview: d.overview || entry.overview,
            genreIds: d.genre_ids
        };
        DramaTmdbDetailCache[entry.tmdbId] = info;
        return Object.assign({}, entry, info);
    } catch (_) {
        DramaTmdbDetailCache[entry.tmdbId] = null;
        return entry;
    }
}

function dramaEpisodeLabel(entry) {
    const eps = (entry.episodes || []).slice().sort((a, b) => a - b);
    if (eps.length === 0) return "今日更新";
    if (eps.length === 1) return `第${eps[0]}集`;
    return `第${eps[0]}-${eps[eps.length - 1]}集`;
}

function dramaEntryToCard(entry, dateStr) {
    const genreText = dramaGetGenreText(entry.genreIds) || "剧集";
    const poster = entry.poster, backdrop = entry.backdrop;
    const isHttp = s => s && String(s).startsWith("http");
    const fullPoster = isHttp(poster) ? poster : (poster ? `https://image.tmdb.org/t/p/w500${poster}` : "");
    const fullBackdrop = isHttp(backdrop) ? backdrop : (backdrop ? `https://image.tmdb.org/t/p/w780${backdrop}` : "");
    return {
        id: String(entry.tmdbId),
        tmdbId: entry.tmdbId,
        type: "tmdb",
        mediaType: "tv",
        title: entry.title,
        genreTitle: `${dramaEpisodeLabel(entry)} ${genreText}`.trim(),
        subTitle: `${dramaEpisodeLabel(entry)} ${genreText}`.trim(),
        posterPath: fullPoster || fullBackdrop,
        backdropPath: fullBackdrop || fullPoster,
        description: `${dramaEpisodeLabel(entry)} ${genreText} · ⭐ ${(Number(entry.rating) || 0).toFixed(1)}\n${entry.overview || "暂无简介"}`,
        rating: Number(entry.rating) || 0,
        year: String(dateStr).substring(0, 4),
        releaseDate: dateStr
    };
}

// -------------------------------------------------------------------------
// ⑤ 降级方案：Trakt 不可用（网络/403）时用 TMDB discover 兜底国际剧集
// 只取前几页，不逐条校验分集 —— 宁可集数显示为"今日更新"，也不能整块空白。
// -------------------------------------------------------------------------
async function dramaCollectTmdbFallback(dateStr) {
    const q = {
        language: "zh-CN", sort_by: "popularity.desc", include_null_first_air_dates: false,
        "air_date.gte": dateStr, "air_date.lte": dateStr, timezone: "Asia/Shanghai",
        without_genres: DRAMA_SERVER_EXCLUDED_GENRE_IDS.join(","),
        without_origin_country: DRAMA_EXCLUDED_COUNTRIES.join("|"),
        without_original_language: DRAMA_EXCLUDED_LANGUAGES.join("|")
    };
    const pages = [1, 2, 3, 4];
    const batches = await Promise.all(pages.map(async p => {
        try {
            const r = await Widget.tmdb.get("/discover/tv", { params: Object.assign({}, q, { page: p }) });
            return (r && r.results) || [];
        } catch (_) { return []; }
    }));
    const flat = [].concat(...batches);
    const out = [];
    const seen = {};
    for (const it of flat) {
        if (!it || !it.id || seen[it.id]) continue;
        seen[it.id] = true;
        if (dramaIsExcludedTmdbItem(it)) continue;
        out.push({
            source: "tmdb", tmdbId: it.id, key: String(it.id), title: it.name,
            country: String((it.origin_country || [""])[0] || "").toLowerCase(),
            language: String(it.original_language || "").toLowerCase(),
            rating: it.vote_average || 0, overview: it.overview || "",
            poster: it.poster_path, backdrop: it.backdrop_path, genreIds: it.genre_ids,
            episodes: []
        });
    }
    return out;
}

// -------------------------------------------------------------------------
// ⑥ 主入口：从当天数据集里按地区取当页
// -------------------------------------------------------------------------
async function calendarScanDramaToday(region, dateStr, baseParams, needCount, isExcluded) {
    const dataset = await dramaBuildTodayDataset(dateStr);
    const page = Math.max(1, Math.round(needCount / DRAMA_PAGE_SIZE));
    const rk = String(region || "").toUpperCase();
    const pool = rk === "GLOBAL" ? dataset : dataset.filter(e => String(e.country || "").toUpperCase() === rk);
    if (!pool.length) return [];
    const slice = pool.slice((page - 1) * DRAMA_PAGE_SIZE, page * DRAMA_PAGE_SIZE);
    const enriched = await Promise.all(slice.map(e => dramaEnrichEntry(e).catch(() => e)));
    return enriched.map(e => dramaEntryToCard(e, dateStr));
}

async function calendarLoadDrama(params = {}) {
    const mode = params.mode || "update_today";
    const region = params.sort_by || "Global";
    const page = Number(params.page || 1);

    // 第一页加载时检查 5 分钟 TTL：若超过则全量清理剧集缓存（包含 Trakt/TVmaze 当日表和 TMDB 详情缓存），
    // 保证上午查到的旧排期在下午志愿者补录后刷新即可见最新集数。
    if (page === 1) {
        const now = Date.now();
        if (!DramaCacheTime || (now - DramaCacheTime) >= DRAMA_CACHE_TTL_MS) {
            Object.keys(DramaTodayCache).forEach(k => delete DramaTodayCache[k]);
            Object.keys(DramaPremiereCache).forEach(k => delete DramaPremiereCache[k]);
            Object.keys(DramaTmdbDetailCache).forEach(k => delete DramaTmdbDetailCache[k]);
            Object.keys(DramaCnDayCache).forEach(k => delete DramaCnDayCache[k]);
            DramaCacheTime = now;
        }
    }

    const dates = calendarCalculateDates(mode);
    const isPremiere = mode.includes("premiere");

    const queryParams = {
        language: "zh-CN",
        sort_by: "popularity.desc",
        include_null_first_air_dates: false,
        page: page,
        timezone: "Asia/Shanghai"
    };
    if (region === "Global") {
        queryParams.without_genres = DRAMA_SERVER_EXCLUDED_GENRE_IDS.join(",");
        queryParams.without_origin_country = DRAMA_EXCLUDED_COUNTRIES.join("|");
        queryParams.without_original_language = DRAMA_EXCLUDED_LANGUAGES.join("|");
    }
    const dateField = isPremiere ? "first_air_date" : "air_date";
    queryParams[`${dateField}.gte`] = dates.start;
    queryParams[`${dateField}.lte`] = dates.end;
    if (region !== "Global") {
        queryParams.with_origin_country = region;
        const langMap = { "JP": "ja", "KR": "ko", "CN": "zh", "GB": "en", "US": "en" };
        if (langMap[region]) queryParams.with_original_language = langMap[region];
    }
    try {
        // 今日更新：多源数据集 + 当页补全
        if (mode === "update_today") {
            const needCount = page * DRAMA_PAGE_SIZE;
            const pageItems = await calendarScanDramaToday(region, dates.start, queryParams, needCount, dramaIsExcludedTmdbItem);
            if (!pageItems.length) return page === 1 ? [{ id: "empty", type: "text", title: "暂无今日排期" }] : [];
            return pageItems;
        }

        // 首播类（明日/7天/30天）单次请求即可，按页缓存，切地区不再重复等待
        const pKey = `${mode}|${region}|${dates.start}|${page}`;
        if (DramaPremiereCache[pKey]) return DramaPremiereCache[pKey];
        const res = await Widget.tmdb.get("/discover/tv", { params: queryParams });
        // 排除规则对所有地区都要生效（此前只在"全球聚合"下过滤，
        // 导致切到中国/美国等地区时动画会漏进来）
        const results = ((res && res.results) || []).filter(item => !dramaIsExcludedTmdbItem(item));
        if (results.length === 0) return page === 1 ? [{ id: "empty", type: "text", title: "暂无更新" }] : [];
        const built = results.map(item => {
            const fullDate = item.first_air_date || "";
            const shortDate = fullDate.slice(5).replace("-", "/");
            const genreText = dramaGetGenreText(item.genre_ids) || "剧集";
            const displaySubtitle = shortDate ? `${shortDate} ${genreText}` : genreText;
            return calendarBuildItem({
                id: item.id, tmdbId: item.id, type: "tv",
                title: item.name, poster: item.poster_path, backdrop: item.backdrop_path,
                rating: item.vote_average?.toFixed(1),
                subTitle: displaySubtitle,
                desc: item.overview,
                year: fullDate.substring(0, 4),
                releaseDate: fullDate
            });
        });
        DramaPremiereCache[pKey] = built;
        return built;
    } catch (e) { return [{ id: "err", type: "text", title: "网络错误" }]; }
}
async function calendarLoadVariety(params = {}) {
    const mode = params.mode || "today";
    const region = params.sort_by || "cn";
    const clientId = CALENDAR_TRAKT_ID;
    if (mode === "trending") return await calendarFetchVariety(region, null); 

    const dateStr = calendarGetSafeDate(mode); 
    const countryParam = region === "global" ? "" : region; 
    const traktUrl = `https://api.trakt.tv/calendars/all/shows/${dateStr}/1?genres=reality,game-show,talk-show${countryParam ? `&countries=${countryParam}` : ''}`;

    try {
        const res = await Widget.http.get(traktUrl, {
            headers: { "Content-Type": "application/json", "trakt-api-version": "2", "trakt-api-key": clientId, "User-Agent": TRAKT_REQUEST_UA }
        });
        const data = res.data || [];

        if (Array.isArray(data) && data.length > 0) {
            const promises = data.map(async (item) => {
                if (!item.show.ids.tmdb) return null;
                return await calendarFetchDetail(item.show.ids.tmdb, item);
            });
            return (await Promise.all(promises)).filter(Boolean);
        }
    } catch (e) {
        console.error("Trakt Request Failed:", e.message);
    }

    return await calendarFetchVariety(region, dateStr);
}

// =========================================================================
// 3. 辅助函数
// =========================================================================

function calendarCalculateDates(mode) {
    const today = new Date();
    const toStr = (d) => d.toISOString().split('T')[0];
    if (mode === "update_today") return { start: toStr(today), end: toStr(today) };
    if (mode === "premiere_tomorrow") {
        const tmr = new Date(today); tmr.setDate(today.getDate() + 1); return { start: toStr(tmr), end: toStr(tmr) };
    }
    if (mode === "premiere_week") {
        const start = new Date(today); start.setDate(today.getDate() + 1);
        const end = new Date(today); end.setDate(today.getDate() + 7);
        return { start: toStr(start), end: toStr(end) };
    }
    const start = new Date(today); start.setDate(today.getDate() + 1);
    const end = new Date(today); end.setDate(today.getDate() + 30);
    return { start: toStr(start), end: toStr(end) };
}

function calendarGetSafeDate(mode) {
    const d = new Date();
    if (mode === "tomorrow") d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
}

function calendarGetWeekdayName(id) {
    const map = { 1: "周一", 2: "周二", 3: "周三", 4: "周四", 5: "周五", 6: "周六", 7: "周日" };
    return map[id] || "";
}

async function calendarFetchVariety(region, dateStr) {
    const queryParams = {
        language: "zh-CN",
        sort_by: "popularity.desc", 
        page: 1,
        with_genres: "10764|10767", 
        include_null_first_air_dates: false,
        timezone: "Asia/Shanghai" 
    };
    if (region !== "global") queryParams.with_origin_country = region.toUpperCase();
    if (dateStr) {
        queryParams["air_date.gte"] = dateStr;
        queryParams["air_date.lte"] = dateStr;
    } else {
        queryParams.sort_by = "first_air_date.desc";
    }

    try {
        const res = await Widget.tmdb.get("/discover/tv", { params: queryParams });
        const data = res || {};
        if (!data.results) return [];

        return data.results.map(item => {
            const fullDate = item.first_air_date || dateStr || "";
            const yearStr = fullDate.substring(0, 4);
            const genreText = calendarGetGenreText(item.genre_ids) || "综艺";
            const shortDate = dateStr ? dateStr.substring(5).replace("-", "/") : "";
            
            const displaySubtitle = shortDate ? `${shortDate} ${genreText}` : `近期热播 ${genreText}`;

            return calendarBuildItem({
                id: item.id, tmdbId: item.id, type: "tv",
                title: item.name, poster: item.poster_path, backdrop: item.backdrop_path,
                rating: item.vote_average?.toFixed(1), 
                subTitle: displaySubtitle, 
                desc: item.overview,
                year: yearStr,
                releaseDate: fullDate
            });
        });
    } catch (e) { return []; }
}

async function calendarFetchDetail(tmdbId, traktItem) {
    try {
        const d = await Widget.tmdb.get(`/tv/${tmdbId}`, { params: { language: "zh-CN" } });
        if (!d) return null;
        
        const fullDate = d.first_air_date || traktItem.first_aired?.substring(0, 10) || "";
        const yearStr = fullDate.substring(0, 4);
        
        const ep = traktItem.episode;
        const s = String(ep.season).padStart(2,'0');
        const e = String(ep.number).padStart(2,'0');
        const genreText = calendarGetGenreText(d.genres?.map(g=>g.id)) || "综艺";
        
        const displaySubtitle = `S${s}-E${e} ${genreText}`;

        return calendarBuildItem({
            id: d.id, tmdbId: d.id, type: "tv",
            title: d.name || traktItem.show.title,
            poster: d.poster_path, backdrop: d.backdrop_path,
            rating: d.vote_average?.toFixed(1),
            subTitle: displaySubtitle,
            desc: d.overview,
            year: yearStr,
            releaseDate: fullDate
        });
    } catch (e) { return null; }
}

async function calendarSearchBestMatch(query1, query2) {
    let res = await calendarSearchTmdb(query1);
    if (!res && query2) res = await calendarSearchTmdb(query2);
    return res;
}

async function calendarSearchTmdb(query) {
    if (!query) return null;
    const cleanQuery = query.replace(/第[一二三四五六七八九十\d]+[季章]/g, "").trim();
    try {
        const res = await Widget.tmdb.get("/search/tv", { params: { query: cleanQuery, language: "zh-CN", page: 1 } });
        return (res.results || [])[0];
    } catch (e) { return null; }
}

async function loadGlobalCalendarHub(params = {}) {
 const source=params.calendar_source||"drama";
 if(source==="anime") return await calendarLoadAnime({sort_by:params.anime_day||"today",page:params.page});
 if(source==="variety") return await calendarLoadVariety({mode:params.variety_mode||"today",sort_by:params.variety_region||"cn",page:params.page});
 if(source==="aggregate") return await calendarLoadVarietyUltimate({listType:params.aggregate_listType||"calendar",days:params.aggregate_days||"14",region:params.aggregate_region||"all",page:params.page});
 return await calendarLoadDrama({mode:params.calendar_mode||"update_today",sort_by:params.sort_by||"Global",page:params.page});
}

// 独立追剧时刻表入口：三个子模块分别拥有自己的第一个快捷参数。
async function loadStandaloneDramaCalendar(params = {}) {
    return await calendarLoadDrama({ mode: params.calendar_mode || "update_today", sort_by: params.sort_by || "Global", page: params.page });
}
async function loadStandaloneAnimeWeek(params = {}) {
    return await calendarLoadAnime({ sort_by: params.sort_by || "today", page: params.page });
}
async function loadStandaloneVarietyAggregate(params = {}) {
    return await calendarLoadVarietyUltimate({ listType: params.list_type || "calendar", days: params.days || "14", region: params.sort_by || "all", page: params.page });
}

// =========================================================================
// 综艺聚合（追新榜 / 热度榜）
// -------------------------------------------------------------------------
// 数据源：TMDB discover（综艺 = 真人秀 10764 + 脱口秀 10767）
// 地区口径：
//   all    = 国内 + 国外主流产地，1:1 轮转交错
//   cn     = 仅 CN
//   global = 仅主流海外产地（US/KR/JP/GB/CA/AU/TW/HK/SG/NZ/IE）
// 追新榜 = 未来 N 天内有新集播出；热度榜 = 正在播出的高人气综艺
// 追新榜按「播出日期 → 人气」排序；候选池与详情均驻留内存，
// 同一地区首次加载后，下拉翻页与切回该地区都是 0 请求。
// =========================================================================

const VARIETY_PAGE_SIZE = 20;
// 注意：日本（JP）已按用户要求整体屏蔽，见 VARIETY_EXCLUDED_COUNTRIES。
const VARIETY_MAIN_COUNTRIES = "US|KR|GB|CA|AU|TW|HK|SG|NZ|IE";
const VARIETY_MAX_RESOLVE = 160;
const VARIETY_RESOLVE_CONCURRENCY = 24;

// 扫描页数接受 0（今日更新）
function varietyDays(v) {
    const n = parseInt(v, 10);
    return (isFinite(n) && n >= 0) ? n : 14;
}

// 扫描页数随预览范围自适应：范围越长，需要翻的页越多。
// 8 页会把 160 条候选全部拉回来，其中相当一部分在详情校验后会被丢弃（discover 的
// air_date 过滤误报率高），所以短范围没必要扫到底 —— 这是首屏耗时的主要来源。
// 扫描页数随「榜单类型 + 预览范围」自适应：
// · 热度榜是纯人气榜（几乎不做日期过滤），discover 已按人气排序，前几页足够撑满列表
// · 追新榜需要更深的候选池 —— 大量条目会在日期校验阶段被丢弃
function varietyScanPages(days, listType) {
    if (listType === "hot") return 2;
    const d = parseInt(days) || 14;
    if (d <= 7) return 4;
    if (d <= 14) return 6;
    return 8;
}

// 低质 / 小语种产地（与剧集追更口径保持一致，作为白名单之外的兜底防线）
const VARIETY_EXCLUDED_COUNTRIES = ["JP", "IN", "TH", "RU", "TR", "PL", "FI", "HU", "NL", "RO", "BR", "ID", "PH", "VN", "MY", "DE", "FR", "IT", "ES", "PT", "SE", "NO", "DK", "LB", "SY", "AE", "EG", "SA", "JO", "IQ", "KW", "QA", "OM", "BH", "DZ", "MA", "TN", "AR", "MX", "CO", "PE", "CL"];

const VARIETY_EXCLUDED_LANGUAGES = ["hi", "th", "ru", "tr", "ta", "te", "pl", "fi", "hu", "nl", "ro", "pt", "ar", "id", "vi", "he", "ms", "tl", "fa", "ur", "uk", "cs", "sv", "da", "no"];

// 职业摔角 / 格斗（只比对标题，避免误杀讲体育故事的节目）
const VARIETY_SPORTS_KEYWORDS = /(?:\bwrestling\b|\bwwe\b|\baew\b|\bnwa\b|\bmlw\b|\bnjpw\b|\bstardom\b|\bseadlin\w*ng\b|\btjpw\b|\bufc\b|\bmma\b|\bbellator\b|\bsmackdown\b|\bwrestlemania\b|\bimpact wrestling\b|\bring of honor\b|摔角|摔跤|格斗|角力|プロレス|スターダム)/i;

const VARIETY_TRASH_KEYWORDS = /(?:\bsvengoolie\b|\bdice actors\b|\btivolt\b|\bnadie sabe nada\b|\bkovan viikon\b|\balucina[çc][ãa]o\b|\bmegaszt[aá]r\b|\bbeste zangers\b|\bthe missing piece\b|\bdimension 20\b|\bcritical role\b|\bactual play\b|\badventuring party\b|\bsmosh\b|\bm\s*countdown\b|\bmusic\s*bank\b|\bmusic\s*core\b|\binkigayo\b|show\s*champion|跑团|打歌|音乐中心|人气歌谣|音乐银行|쇼!?\s*챔피언|电视购物|付费课程|口语流利|零基础直达)/i;

// 韩/日/台/港综艺单独把质量关（见 varietyIsExcluded）
const VARIETY_ASIAN_COUNTRIES = ["KR", "JP", "TW", "HK", "SG"];

// 国外真人秀一律屏蔽（用户明确：这类内容垃圾太多），仅放行「唱歌 / 舞蹈 / 达人秀」
// 这类正经选秀竞技节目（The Voice、与星共舞、Got Talent、Strictly Come Dancing…）。
// 韩综单独保留（用户要求加入，见下方 isKR 分支）。
const VARIETY_TALENT_KEYWORDS = /(?:\bgot\s*talent\b|\btalent\b|\bthe\s*voice\b|\bvoice\b|\bx[- ]?factor\b|\bidol\b|\bmasked\s*singer\b|\bsing(?:ing|er|s)?\b|\bdanc(?:ing|e|er|ers)\b|\bstrictly\b|\bworld\s*of\s*dance\b|达人秀|达人|好声音|蒙面|歌手|歌唱|合唱|唱歌|歌王|舞蹈|街舞|舞动|舞林|与星共舞|选秀|偶像练习)/i;

const VARIETY_BL_KEYWORDS = /(?:\bboys['\u2019]?\s*love\b|\byaoi\b|\byuri\b|\bbl drama\b|同性恋|耽美|男男|女女|腐剧|双男主)/i;

function varietyBeijingDate(offsetDays) {
    const t = new Date(Date.now() + 8 * 3600 * 1000 + (offsetDays || 0) * 86400000);
    return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}

function calendarPadZero(num) {
    return String(num).padStart(2, "0");
}

// 综艺聚合已改为北京时间 + 内存数据集，保留兼容别名
function calendarGetTodayStr() {
    return varietyBeijingDate(0);
}

function calendarGetFutureDateStr(days) {
    return varietyBeijingDate(parseInt(days) || 0);
}

// -------------------------------------------------------------------------
// 垃圾过滤
// 国外真人秀一律屏蔽（用户明确要求：这类内容垃圾太多），仅放行「唱歌 / 舞蹈 /
// 达人秀」类选秀竞技；韩综单独保留。国产综艺口径不变。
// 纪录片一律拦截：不论产地、不论是否同时带真人秀标签，只要 genre 含 99 就排除。
// 日本（JP）整体屏蔽。
// 其余仍然一律排除：摔角格斗与体育、新闻、非真人秀的脱口秀、小语种产地、无海报。
// -------------------------------------------------------------------------
function varietyIsExcluded(item) {
    if (!item || !item.id) return true;
    if (!item.poster_path) return true;

    const countries = Array.isArray(item.origin_country) ? item.origin_country : [];
    const country = countries[0] || "";
    const lang = String(item.original_language || "");
    const titleText = `${item.name || ""} ${item.original_name || ""}`;
    const genres = Array.isArray(item.genre_ids) ? item.genre_ids : [];
    const isCN = country === "CN" || lang === "zh";
    const isKR = country === "KR" || lang === "ko";
    const isReality = genres.indexOf(10764) >= 0;
    const isTalent = VARIETY_TALENT_KEYWORDS.test(titleText);
    // 国外真人秀一律屏蔽；仅放行唱歌/舞蹈/达人秀类选秀竞技，韩综单独保留。
    if (!isCN && isReality && !isKR && !isTalent) return true;
    // 放宽「要求中文简介」仅对仍有资格进入列表的条目生效
    const relaxReality = !isCN && isReality && (isKR || isTalent);

    if (genres.indexOf(99) >= 0) return true;                          // 纪录片：一律拦截
    if (VARIETY_EXCLUDED_COUNTRIES.indexOf(country) >= 0) return true;
    if (VARIETY_EXCLUDED_LANGUAGES.indexOf(lang) >= 0) return true;
    if (VARIETY_SPORTS_KEYWORDS.test(titleText)) return true;
    if (VARIETY_TRASH_KEYWORDS.test(titleText)) return true;
    if (VARIETY_BL_KEYWORDS.test(titleText)) return true;
    if (!isCN && genres.indexOf(10763) >= 0) return true;              // 新闻

    if (!relaxReality && String(item.overview || "").trim().length < 8) return true;

    if (!isCN) {
        const votes = Number(item.vote_count) || 0;
        const pop = Number(item.popularity) || 0;
        if (votes <= 0 && pop < 10) return true;                        // 零票零热度海外杂项
        if (!isReality && genres.indexOf(10767) >= 0) return true;      // 非真人秀的脱口秀
    }

    // 韩/日/台/港综艺：没有中文简介时要求有一定口碑或热度，
    // 避免 YouTube 自制小节目、打歌节目混进「正经韩综」。
    if (VARIETY_ASIAN_COUNTRIES.indexOf(country) >= 0 && String(item.overview || "").trim().length < 8) {
        const v = Number(item.vote_count) || 0;
        const p = Number(item.popularity) || 0;
        if (v < 10 && p < 20) return true;
    }
    return false;
}

// -------------------------------------------------------------------------
// 候选池：多页扫描 discover，服务端 air_date 过滤 + 客户端垃圾过滤
// -------------------------------------------------------------------------
// 统一的 TMDB 请求（带重试）。任何一页失败若被当成"空页"，该页节目会整批消失
// （实测《一万元舞台》在第 2 页，丢页就看不到它）。
async function varietyHttpGet(api, params, tries = 3) {
    for (let attempt = 0; attempt < tries; attempt++) {
        if (attempt > 0) {
            await new Promise(r => setTimeout(r, 250 * attempt));
        }
        try {
            const res = await Widget.tmdb.get(api, { params });
            if (res) return res;
        } catch (e) {
            /* 继续重试 */
        }
    }
    return null;
}

async function varietyFetchDiscoverPage(country, listType, days, page) {
    const params = {
        language: "zh-CN",
        page: page,
        with_genres: "10764|10767",
        include_null_first_air_dates: false,
        sort_by: "popularity.desc",
        timezone: "Asia/Shanghai"
    };
    if (country) params.with_origin_country = country;
    if (listType === "calendar") {
        const dNum = parseInt(days, 10);
        // 如果 days 是 0（今日更新），discover 查询拉取 7 天候选池，再由详情层严格筛选今天播出的分集
        const dVal = (isFinite(dNum) && dNum > 0) ? dNum : 7;
        params["air_date.gte"] = varietyBeijingDate(0);
        params["air_date.lte"] = varietyBeijingDate(dVal);
    } else {
        params["air_date.gte"] = varietyBeijingDate(-7);
        params["air_date.lte"] = varietyBeijingDate(60);
    }
    // 失败返回 null（区别于"确实没有结果"），调用方据此重试
    return await varietyHttpGet("/discover/tv", params);
}

async function varietyCollectPool(country, listType, days) {
    const first = await varietyFetchDiscoverPage(country, listType, days, 1);
    if (!first) return [];   // 首页失败：放弃该产地，避免用到残缺数据
    let rows = Array.isArray(first.results) ? first.results.slice() : [];
    const totalPages = Math.min(Number(first.total_pages) || 1, varietyScanPages(days, listType));
    if (totalPages > 1) {
        const jobs = [];
        for (let p = 2; p <= totalPages; p++) jobs.push(varietyFetchDiscoverPage(country, listType, days, p));
        const pages = await Promise.all(jobs);
        // 单页失败必须重试，不能静默跳过 —— 否则该页节目整批消失
        for (let i = 0; i < pages.length; i++) {
            let r = pages[i];
            if (!r) r = await varietyFetchDiscoverPage(country, listType, days, i + 2);
            if (r && Array.isArray(r.results)) rows = rows.concat(r.results);
        }
    }
    const seen = {};
    const out = [];
    rows.forEach(r => {
        if (!r || !r.id || seen[r.id]) return;
        seen[r.id] = 1;
        if (varietyIsExcluded(r)) return;
        out.push(r);
    });
    return out;
}

// -------------------------------------------------------------------------
// 地区与日期参数健壮归一化
// -------------------------------------------------------------------------
// -------------------------------------------------------------------------
// 地区与日期参数健壮归一化
// -------------------------------------------------------------------------
function varietyNormalizeRegion(r) {
    const s = String(r || "all").toLowerCase().trim();
    if (s === "cn" || s.includes("国") || s.includes("中") || s === "china") return "cn";
    if (s === "global" || s.includes("外") || s.includes("洋")) return "global";
    if (s.includes("国") && !s.includes("中")) return "global";
    return "all";
}

function varietyDays(v) {
    const n = parseInt(v, 10);
    return (isFinite(n) && n >= 0) ? n : 14;
}

// 缓存有效期：TMDB 的志愿者会随时补录当天的分集（例如中午播出、下午才补上日期），
// 若长期缓存会导致「上午看不到 → 下午刷新仍然看不到」。设一个短 TTL，到点自动整体失效。
const VARIETY_CACHE_TTL_MS = 5 * 60 * 1000;

const VarietyCandidateCache = {};
const VarietyDetailCache = {};
const VarietySeasonCache = {};
const VarietyResolvedCache = {};
// 热度榜按需增量解析的进度（追新榜需要全局排序，仍走全量解析）
const VarietyHotState = {};
const VarietyCacheTime = {};

function varietyCacheStale(key) {
    const t = VarietyCacheTime[key];
    return !t || (Date.now() - t) >= VARIETY_CACHE_TTL_MS;
}

// 让某个数据集（含候选池、详情、解析结果）整体失效。
// 详情缓存必须一起清 —— 分集日期正是存在详情里，只清结果缓存会继续读到旧的分集日期。
function varietyInvalidateDataset(key) {
    delete VarietyCandidateCache[key];
    delete VarietyResolvedCache[key];
    delete VarietyHotState[key];
    delete VarietyCacheTime[key];
    Object.keys(VarietyDetailCache).forEach(k => delete VarietyDetailCache[k]);
    Object.keys(VarietySeasonCache).forEach(k => delete VarietySeasonCache[k]);
}

async function varietyFetchDetail(tmdbId) {
    if (tmdbId in VarietyDetailCache) return VarietyDetailCache[tmdbId];
    const d = await varietyHttpGet(`/tv/${tmdbId}`, { language: "zh-CN" });
    // 只缓存成功结果；失败不进缓存，下次刷新还能重新尝试
    if (d) VarietyDetailCache[tmdbId] = d;
    return d;
}

// 取某一季的分集表。TMDB 的 next/last_episode_to_air 字段偶尔滞后或不完整
// （当天分集确实存在，但字段没指向当天），需回查季分集表做兜底确认 ——
// 与「剧集追更」的 dramaResolveOne 同一思路。
async function varietyFetchSeasonEpisodes(tmdbId, seasonNumber) {
    const key = `${tmdbId}|${seasonNumber}`;
    if (key in VarietySeasonCache) return VarietySeasonCache[key];
    const se = await varietyHttpGet(`/tv/${tmdbId}/season/${seasonNumber}`, { language: "zh-CN" });
    const eps = (se && Array.isArray(se.episodes)) ? se.episodes : null;
    if (eps) VarietySeasonCache[key] = eps;
    return eps || [];
}

// 该节目最新的有效季号（用于兜底回查）
function varietyLatestSeasonNumber(detail, next, last) {
    if (next && next.season_number) return next.season_number;
    if (last && last.season_number) return last.season_number;
    const seasons = Array.isArray(detail.seasons)
        ? detail.seasons.filter(s => s && Number(s.season_number) > 0).map(s => Number(s.season_number))
        : [];
    if (!seasons.length) return null;
    seasons.sort((a, b) => b - a);
    return seasons[0];
}

function varietyBuildCard(detail, ep, listType, sortDate) {
    const ratingNum = detail.vote_average ? Number(detail.vote_average).toFixed(1) : "0.0";
    const ratingText = Number(ratingNum) > 0 ? `${ratingNum}分` : "暂无评分";
    const dateStr = sortDate || detail.first_air_date || "";

    let epString = "首播";
    if (ep && ep.air_date) {
        epString = `S${calendarPadZero(ep.season_number)}-E${calendarPadZero(ep.episode_number)}`;
    }

    const sub = listType === "calendar"
        ? `${ratingText} • ${epString}`
        : `${ratingText} • 热度 ${Math.round(Number(detail.popularity) || 0)}`;

    return {
        id: String(detail.id),
        tmdbId: detail.id,
        type: "tmdb",
        mediaType: "tv",
        title: detail.name || detail.original_name,
        genreTitle: sub,
        subTitle: sub,
        posterPath: detail.poster_path ? `https://image.tmdb.org/t/p/w500${detail.poster_path}` : "",
        backdropPath: detail.backdrop_path ? `https://image.tmdb.org/t/p/w780${detail.backdrop_path}` : "",
        description: `📅 播出时间: ${dateStr}\n${detail.overview || "暂无简介"}`,
        rating: parseFloat(ratingNum),
        year: String(dateStr).substring(0, 4),
        releaseDate: dateStr,
        _country: (Array.isArray(detail.origin_country) && detail.origin_country[0]) || ""
    };
}

function varietyCountryRank(c) {
    const order = ["CN", "KR", "JP", "TW", "HK", "SG", "NZ", "IE", "AU", "CA", "GB", "US"];
    const i = order.indexOf(c);
    return i < 0 ? 99 : i;
}

function varietyInterleaveByRegion(items) {
    const dates = [];
    const byDate = {};
    items.forEach(it => {
        const d = it.releaseDate || "";
        if (!byDate[d]) { byDate[d] = []; dates.push(d); }
        byDate[d].push(it);
    });
    const out = [];
    dates.forEach(d => {
        const buckets = {};
        const order = [];
        byDate[d].forEach(it => {
            const c = it._country || "??";
            if (!buckets[c]) { buckets[c] = []; order.push(c); }
            buckets[c].push(it);
        });
        order.sort((a, b) => varietyCountryRank(a) - varietyCountryRank(b));
        let more = true;
        while (more) {
            more = false;
            order.forEach(c => {
                const b = buckets[c];
                if (b.length) { out.push(b.shift()); more = true; }
            });
        }
    });
    return out;
}

// -------------------------------------------------------------------------
// 候选池获取与过滤
// -------------------------------------------------------------------------
async function varietyGetCandidates(region, listType, days) {
    const cleanRegion = varietyNormalizeRegion(region);
    const dVal = varietyDays(days);
    const key = `${listType}|${cleanRegion}|${dVal}`;
    if (VarietyCandidateCache[key]) return VarietyCandidateCache[key];

    let cnList = [];
    let osList = [];
    const jobs = [];

    if (cleanRegion === "cn" || cleanRegion === "all") {
        jobs.push(varietyCollectPool("CN", listType, dVal).then(r => { cnList = r; }));
    }
    if (cleanRegion === "global" || cleanRegion === "all") {
        jobs.push((async () => {
            const merged = await varietyCollectPool(VARIETY_MAIN_COUNTRIES, listType, dVal);
            const krExtra = await varietyCollectPool("KR", listType, dVal);
            const seen = {};
            const out = [];
            merged.concat(krExtra).forEach(x => {
                if (x && x.id && !seen[x.id]) { seen[x.id] = 1; out.push(x); }
            });
            osList = out;
        })());
    }
    await Promise.all(jobs);

    let list;
    if (cleanRegion === "cn") {
        list = cnList;
    } else if (cleanRegion === "global") {
        list = osList;
    } else {
        list = [];
        const maxLen = Math.max(cnList.length, osList.length);
        for (let i = 0; i < maxLen; i++) {
            if (i < cnList.length) list.push(cnList[i]);
            if (i < osList.length) list.push(osList[i]);
        }
    }
    VarietyCandidateCache[key] = list;
    return list;
}

function varietyGetLatestSeasonAirDate(detail) {
    if (!detail) return "";
    const seasons = Array.isArray(detail.seasons) ? detail.seasons.filter(s => s && s.season_number > 0 && s.air_date) : [];
    if (seasons.length > 0) {
        seasons.sort((a, b) => (a.season_number < b.season_number ? 1 : (a.season_number > b.season_number ? -1 : 0)));
        return seasons[0].air_date || detail.first_air_date || "";
    }
    return detail.first_air_date || "";
}

async function varietyResolveOne(cand, listType, todayStr, endStr, cleanRegion) {
    const detail = await varietyFetchDetail(cand.id);
    if (!detail || !detail.id) return null;

    // 严厉拦截：若用户选了国内综艺，但后端详情里发现非中国产地或非中文，直接抛弃
    const candsCountry = (Array.isArray(detail.origin_country) && detail.origin_country[0]) || "";
    const origLang = String(detail.original_language || "");
    const isActuallyCN = candsCountry === "CN" || origLang === "zh";
    if (cleanRegion === "cn" && !isActuallyCN) return null;

    const next = detail.next_episode_to_air;
    const last = detail.last_episode_to_air;

    if (listType === "calendar") {
        const targetGte = todayStr;
        const targetLte = endStr;

        // 收集所有落在 [gte, lte] 有效区间内的分集候选
        const eps = [];
        if (next && next.air_date && next.air_date >= targetGte && next.air_date <= targetLte) eps.push(next);
        if (last && last.air_date && last.air_date >= targetGte && last.air_date <= targetLte) eps.push(last);

        if (!eps.length) {
            // 兜底：next/last_episode_to_air 偶尔滞后（当天分集已存在却没指向当天），
            // 回查最近一季的分集表确认。仅国产区启用 —— 该区以 TMDB 为主源、候选量小；
            // 海外由 Trakt 保证精度，全开会产生大量额外请求。
            if (cleanRegion === "cn") {
                const seasonNumber = varietyLatestSeasonNumber(detail, next, last);
                if (seasonNumber) {
                    const list = await varietyFetchSeasonEpisodes(detail.id, seasonNumber);
                    list.forEach(e => {
                        if (e && e.air_date && e.air_date >= targetGte && e.air_date <= targetLte) eps.push(e);
                    });
                }
            }
        }

        if (!eps.length) return null;

        // 优先选择离今天（todayStr）最新的/最近的分集
        eps.sort((a, b) => (a.air_date > b.air_date ? 1 : (a.air_date < b.air_date ? -1 : 0)));
        const ep = eps[0];
        return varietyBuildCard(detail, ep, listType, ep.air_date);
    }

    // 热度榜 (hot)：显示该节目的最近一季首播日（若多季则为最新一季年度，单季则为第一季首播日）
    const latestSeasonDate = varietyGetLatestSeasonAirDate(detail);
    return varietyBuildCard(detail, null, listType, latestSeasonDate);
}

async function varietyResolveDataset(region, listType, days, cands, needCount) {
    const cleanRegion = varietyNormalizeRegion(region);
    const dVal = varietyDays(days);
    const key = `${listType}|${cleanRegion}|${dVal}`;
    const todayStr = varietyBeijingDate(0);
    const endStr = varietyBeijingDate(dVal);

    // 热度榜：纯人气序（discover 已排序），按需增量解析 ——
    // 首页只要 20 条，没必要把 70+ 条候选的详情全部拉一遍（这是首屏耗时的主因）。
    if (listType !== "calendar") {
        const need = Math.max(1, Number(needCount) || VARIETY_PAGE_SIZE);
        const state = VarietyHotState[key] || (VarietyHotState[key] = { items: [], cursor: 0 });
        while (state.items.length < need && state.cursor < cands.length) {
            const chunk = cands.slice(state.cursor, state.cursor + VARIETY_RESOLVE_CONCURRENCY);
            state.cursor += chunk.length;
            const rows = await Promise.all(chunk.map(c => varietyResolveOne(c, listType, todayStr, endStr, cleanRegion)));
            rows.forEach(r => {
                if (!r) return;
                // 国内模式必须绝对纯净
                if (cleanRegion === "cn" && r._country !== "CN" && !(r.description || "").includes("CN")) return;
                state.items.push(r);
            });
        }
        VarietyCacheTime[key] = Date.now();
        return state.items;
    }

    // 追新榜：需要全局排序（日期升序 + 同日产地交错），必须全量解析后缓存
    // 时效由首页（page=1）统一把关，翻页时直接用现有数据集
    if (VarietyResolvedCache[key]) return VarietyResolvedCache[key];

    const limit = Math.min(cands.length, VARIETY_MAX_RESOLVE);
    const items = [];

    for (let i = 0; i < limit; i += VARIETY_RESOLVE_CONCURRENCY) {
        const chunk = cands.slice(i, Math.min(i + VARIETY_RESOLVE_CONCURRENCY, limit));
        const rows = await Promise.all(chunk.map(c => varietyResolveOne(c, listType, todayStr, endStr, cleanRegion)));
        rows.forEach(r => { if (r) items.push(r); });
    }

    // 二次硬核过滤：若为 cn 模式，强制只留 CN 产地
    const filteredItems = items.filter(it => {
        if (cleanRegion === "cn") {
            return it._country === "CN" || (it.description && it.description.includes("CN"));
        }
        return true;
    });

    filteredItems.sort((a, b) => {
        if (a.releaseDate === b.releaseDate) return 0;
        return a.releaseDate > b.releaseDate ? 1 : -1;
    });
    const ordered = varietyInterleaveByRegion(filteredItems);

    VarietyResolvedCache[key] = ordered;
    VarietyCacheTime[key] = Date.now();
    return ordered;
}

async function calendarLoadVarietyUltimate(params = {}) {
    const listType = params.listType || params.list_type || "calendar";
    const rawRegion = params.region || params.sort_by || "all";
    const cleanRegion = varietyNormalizeRegion(rawRegion);
    const days = String(params.days ?? "14");
    const pageNum = Math.max(1, parseInt(params.page) || 1);

    // 首页请求时检查缓存时效：超过 TTL 就整体失效（含详情缓存），
    // 这样「上午看不到的新集数，下午志愿者补录后刷新即可见」。
    const cacheKey = `${listType}|${cleanRegion}|${varietyDays(days)}`;
    if (pageNum === 1 && varietyCacheStale(cacheKey)) {
        varietyInvalidateDataset(cacheKey);
    }

    try {
        const cands = await varietyGetCandidates(cleanRegion, listType, days);
        if (!cands.length) {
            return pageNum === 1
                ? [{ id: "variety_empty", type: "text", title: "暂无排期", subTitle: listType === "calendar" ? (days === "0" ? "今日暂无播出的综艺" : `未来 ${days} 天内暂无可播出的综艺`) : "暂无可播出的综艺" }]
                : [];
        }

        // 热度榜按需解析：只需要「当前页 + 少量缓冲」条，避免拉满全部候选详情
        const needCount = pageNum * VARIETY_PAGE_SIZE + 4;
        const items = await varietyResolveDataset(cleanRegion, listType, days, cands, needCount);
        if (!items.length) {
            return pageNum === 1
                ? [{ id: "variety_empty", type: "text", title: "暂无排期", subTitle: listType === "calendar" ? (days === "0" ? "今日暂无播出的综艺" : `未来 ${days} 天内暂无可播出的综艺`) : "暂无可播出的综艺" }]
                : [];
        }

        const start = (pageNum - 1) * VARIETY_PAGE_SIZE;
        return items.slice(start, start + VARIETY_PAGE_SIZE);
    } catch (e) {
        return [{ id: "variety_err", type: "text", title: "加载失败", subTitle: e.message }];
    }
}

async function loadGuduoRank(params = {}) {
    try {
        const category = params.guduo_category || "剧集";
        const url = "https://raw.githubusercontent.com/MakkaPakka518/List/refs/heads/main/data/guduo-hot.json?t=" + Math.floor(Date.now() / 3600000);
        const response = await Widget.http.get(url, { decodable: true });
        let data = response && response.data;
        if (typeof data === "string") data = JSON.parse(data);
        const items = data && data.categories && data.categories[category] || [];
        return items.map(item => ({
            id: item.tmdbId ? String(item.tmdbId) : String(item.title),
            type: "tmdb",
            mediaType: item.mediaType || "tv",
            title: item.tmdbTitle || item.title,
            description: `🏆 TOP ${item.rank} | 🔥 热度: ${item.heat} | 评分: ${item.rating}\n\n${item.overview || "暂无简介"}`,
            posterPath: item.posterPath || "",
            backdropPath: item.backdropPath || "",
            releaseDate: item.releaseDate || "",
            rating: Number(item.rating) || 0,
            genreTitle: item.genreTitle || category
        }));
    } catch (error) {
        console.error("[骨朵榜单] 请求失败:", error.message || error);
        return [{ id: "guduo_error", type: "text", title: "骨朵榜单加载失败", description: "请稍后重试" }];
    }
}

// ================= VOD合集完整实现（私有作用域） =================
const VOD_MERGED = (() => {
;

const __vod_group_sources=[];
(function(){var WidgetMetadata;
WidgetMetadata = {
  id: "https://t.me/Nzmgs?rev=20260726b",
  title: "聚合实时榜单",
  description: "聚合各平台实时榜单数据",
  author: "TG@ZenMoFiShi",
  site: "https://t.me/Nzmgs",
  version: "1.4.3",
  requiredVersion: "0.0.1",
  modules: [
    { title: "Netflix新片榜", description: "实时获取 Netflix 新片榜真实内容", requiresWebView: false, functionName: "getNetflixNew", cacheDuration: 43200, params: [] },
    { title: "Disney+新片榜", description: "实时获取 Disney+ 新片榜真实内容", requiresWebView: false, functionName: "getDisneyNew", cacheDuration: 43200, params: [] },
    { title: "Apple TV+新片榜", description: "实时获取 Apple TV+ 新片榜真实内容", requiresWebView: false, functionName: "getAppleTvNew", cacheDuration: 43200, params: [] },
    { title: "HBOmax新片榜", description: "实时获取 HBOmax 新片榜真实内容", requiresWebView: false, functionName: "getHboNew", cacheDuration: 43200, params: [] },
    { title: "prime video新片榜", description: "实时获取 prime video 新片榜真实内容", requiresWebView: false, functionName: "getPrimeVideoNew", cacheDuration: 43200, params: [] },
    { title: "本周国剧排行榜", description: "实时获取本周国剧排行榜真实内容", requiresWebView: false, functionName: "getWeeklyDomesticDrama", cacheDuration: 43200, params: [] },
    { title: "本周美剧排行榜", description: "实时获取本周美剧排行榜真实内容", requiresWebView: false, functionName: "getWeeklyUSDrama", cacheDuration: 43200, params: [] },
    { title: "本周动漫排行榜", description: "实时获取本周动漫排行榜真实内容", requiresWebView: false, functionName: "getWeeklyAnime", cacheDuration: 43200, params: [] },
    { title: "本周电影排行榜", description: "实时获取本周电影排行榜真实内容", requiresWebView: false, functionName: "getWeeklyMovie", cacheDuration: 43200, params: [] },
    { title: "本周韩剧排行榜", description: "实时获取本周韩剧排行榜真实内容", requiresWebView: false, functionName: "getWeeklyKDrama", cacheDuration: 43200, params: [] },
    { title: "本周英剧排行榜", description: "实时获取本周英剧排行榜真实内容", requiresWebView: false, functionName: "getWeeklyUKDrama", cacheDuration: 43200, params: [] },
    { title: "本周日剧排行榜", description: "实时获取本周日剧排行榜真实内容", requiresWebView: false, functionName: "getWeeklyJDrama", cacheDuration: 43200, params: [] },
    { title: "本周泰剧排行榜", description: "实时获取本周泰剧排行榜真实内容", requiresWebView: false, functionName: "getWeeklyThaiDrama", cacheDuration: 43200, params: [] },
    { title: "本周综艺排行榜", description: "实时获取本周综艺排行榜真实内容", requiresWebView: false, functionName: "getWeeklyVariety", cacheDuration: 43200, params: [] },
    { title: "本周纪录片排行榜", description: "实时获取本周纪录片排行榜真实内容", requiresWebView: false, functionName: "getWeeklyDocumentary", cacheDuration: 43200, params: [] },
    { id: "loadResource", title: "瓜子影视播放源", description: "返回瓜子影视播放源", functionName: "loadResource", type: "stream", cacheDuration: 43200, params: [] }
  ]
};

const USER_AGENT = "LeanMirror/3 CFNetwork/3892.100.1 Darwin/27.0.0";
const PLAY_USER_AGENT = "AppleCoreMedia/1.0.0.24A5390f (iPhone; U; CPU OS 27_0 like Mac OS X; zh_cn)";
const LIB_CRYPTO_JS = "https://cdn.jsdelivr.net/npm/crypto-js@4.2.0/crypto-js.min.js";
const LIB_JSENCRYPT = "https://cdn.jsdelivr.net/npm/jsencrypt@3.3.2/bin/jsencrypt.min.js";

const APP_CONFIG = {
  baseURL: "",
  baseURLs: [
    "https://api.8b42w67.com",
    "https://api.4pmyvfz.com",
    "https://sdapi.s3432pr.com",
    "https://sdapi.q5sn3gk.com",
    "https://apinew.qwepe.com"
  ],
  thirdPartyDomainURL: "https://raw.githubusercontent.com/tdopops/jiafeimao/main/0103/jfm-ios-prod.json",
  thirdPartyAes: { key: "m4nQCskrndxTCULX", iv: "92ilxgNlcweTTfvG" },
  versionCode: "2026033001",
  apiVersion: "3.0.5.0",
  productnumber: "1",
  platform: "2",
  packageName: "com.jfm202203",
  code: "GZ0520",
  requestAes: { key: "aaaabbbbccccdddd", iv: "1111222233334444" },
  requestPublicKey: "-----BEGIN PUBLIC KEY-----MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCWJafJAdhTPWMrNpbmlk672o06smRwxe1LoHjy2XbLRaKIXfQJWgJTBhLH4qUIPMmpnIKQYqjMLTrJhwG5Bwsd3/15YHdL7eWad7lpomF5doOQmmexK2+gSBHmCOhXeumhrOD63vx8ERepxR6UCxTi5b5fZmqMdbLk45IW39mn6wIDAQAB-----END PUBLIC KEY-----",
  responsePrivateKey: "-----BEGIN RSA PRIVATE KEY-----MIICXQIBAAKBgQCM+iJdCeYFydG3DiFG0Ajr6IS0NENW1Bb2MSwrUdvLiI7nXHG+zZZuyqewVUPUPQRdEvhSMCyTKjjX9QajRJ1Uv+xVnsOmxEQQIhAIUa1dsXsN30nLGA+VuNHF7J1SE+Vh/46duR/0Q+Iq+3esSYlb3/PdN4wgK5ab+jKeR0JA2wIDAQABAoGAbst/CkPnRZFRgl5WhMKm4FDDSqTwb2MMELygjAMvjIxsUyRyOJR2r+gRViIMxtaVgViRVHaL8bTzK7ZkWxhn1LEM7RpWB1zjKFvXxE+dzxPrYY/Qw7dobzAAMyQhZ2+7PTO/plUYOxNgZPUzsvcoI44M3HRy1yFxGbF9z9LiMDECQQDTs5eXJnjEN1JmqbBotFw0III0/se/r0oDv4AvJdbxl64t64dZI2tS3BO7NL3OAOzf+WL14Pf2uADFDZz9kzHPAkEAqnn7TBlZXc6L70TnCaggMAN9C+2Iuik2Q2dePfTBI9IyJiC54k4G66iT+kQ5F6T4MGWf6jb7xUuUTk6AHck/NQJBALk+5oAh7v0rt5QUGkSUxjXq2GUNKLbn6Ok8sisPfnVrF8Qg3A+4+ZnI8A8ZSJkxoBUgwWKMWA5w1mOX1O7i1WsCQHV0qgHajUomnx9x18U9gz/Rh3yKYmPxNSPnunTxh4kIr+i5L5mOrRH9CkeqbbOuxBmES1PyIjHjSwFQ8NCU8ekCQQCwb4PirUbcqeHbjN0Nv6vm5pqsgJ29GhA9qiy2l+1Wb637STe9L2mEt7ImUd9FGy7k3Nnsn5eou/t2SV3OkGaU-----END RSA PRIVATE KEY-----",
  iosRequestSalt: "&ffddffujhjhgvdvdvdz4Y!s!2br",
  token: "",
  tokenId: "",
  deviceId: "",
  ip: "",
  lang: "zh_cn"
};

let __libsReady = false;
let __authPromise = null;
let __domainPromise = null;
let __domainsReady = false;
let __activeDomainIndex = 0;
const AUTH_STORAGE_KEY = "gxf.auth.v2";
const DOMAIN_STORAGE_KEY = "gxf.domains.v2";
const MEDIA_BINDING_PREFIX = "gxf.media.v3.";
const __tmdbMovieDetailCache = {};

async function ensureLibs() {
  if (__libsReady && typeof CryptoJS !== "undefined" && typeof JSEncrypt !== "undefined") return;
  const g = (function () {
    if (typeof globalThis !== "undefined") return globalThis;
    if (typeof self !== "undefined") return self;
    if (typeof window !== "undefined") return window;
    return this;
  })();
  if (!g.window) g.window = g;
  if (!g.self) g.self = g;
  if (!g.global) g.global = g;
  if (!g.navigator) g.navigator = { appName: "Netscape", userAgent: USER_AGENT };
  if (typeof CryptoJS === "undefined") {
    const resp = await Widget.http.get(LIB_CRYPTO_JS, { headers: { "User-Agent": USER_AGENT } });
    (0, eval)(typeof resp.data === "string" ? resp.data : String(resp.data || ""));
  }
  if (typeof JSEncrypt === "undefined") {
    const resp = await Widget.http.get(LIB_JSENCRYPT, { headers: { "User-Agent": USER_AGENT } });
    (0, eval)(typeof resp.data === "string" ? resp.data : String(resp.data || ""));
  }
  if (typeof CryptoJS === "undefined") throw new Error("CryptoJS 加载失败");
  if (typeof JSEncrypt === "undefined") throw new Error("JSEncrypt 加载失败");
  __libsReady = true;
}

function buildHeaders(extra = {}) {
  return Object.assign({
    "Content-Type": "application/json",
    "Accept": "application/json, text/plain, */*",
    "Version": APP_CONFIG.versionCode,
    "api-ver": APP_CONFIG.apiVersion,
    "packagename": APP_CONFIG.packageName,
    "code": APP_CONFIG.code,
    "ver": APP_CONFIG.apiVersion,
    "deviceid": APP_CONFIG.deviceId,
    "ip": APP_CONFIG.ip,
    "lang": APP_CONFIG.lang,
    "x-customer-client-ip": "",
    "User-Agent": USER_AGENT,
    "parent-code": ""
  }, extra);
}

function aesEncryptHex(text, keyStr, ivStr) {
  const key = CryptoJS.enc.Utf8.parse(keyStr);
  const iv = CryptoJS.enc.Utf8.parse(ivStr);
  const data = CryptoJS.enc.Utf8.parse(text);
  return CryptoJS.AES.encrypt(data, key, { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }).ciphertext.toString();
}

function aesDecryptHex(cipherHex, keyStr, ivStr) {
  const key = CryptoJS.enc.Utf8.parse(keyStr);
  const iv = CryptoJS.enc.Utf8.parse(ivStr);
  return CryptoJS.AES.decrypt({ ciphertext: CryptoJS.enc.Hex.parse(cipherHex) }, key, { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }).toString(CryptoJS.enc.Utf8);
}

function rsaEncryptBase64(text, publicKey) {
  const js = new JSEncrypt();
  js.setPublicKey(publicKey);
  return js.encrypt(text);
}

function rsaDecryptBase64(text, privateKey) {
  const js = new JSEncrypt();
  js.setPrivateKey(privateKey);
  return js.decrypt(text);
}

function buildRequestBody(params = {}) {
  const ts = Math.floor(Date.now() / 1000);
  const requestKey = aesEncryptHex(JSON.stringify(params), APP_CONFIG.requestAes.key, APP_CONFIG.requestAes.iv);
  const keys = rsaEncryptBase64(JSON.stringify(APP_CONFIG.requestAes), APP_CONFIG.requestPublicKey);
  const signBase = "token_id=" + APP_CONFIG.tokenId + ",token=" + APP_CONFIG.token + ",phone_type=" + APP_CONFIG.platform + ",request_key=" + requestKey + ",app_id=" + APP_CONFIG.productnumber + ",time=" + String(ts) + ",keys=" + keys;
  const signature = CryptoJS.MD5(signBase + "*" + APP_CONFIG.iosRequestSalt).toString().toUpperCase();
  return { token: APP_CONFIG.token, token_id: APP_CONFIG.tokenId, time: ts, app_id: APP_CONFIG.productnumber, phone_type: APP_CONFIG.platform, keys, request_key: requestKey, signature, ad_version: 1 };
}

function decryptResponse(responseData) {
  const aesInfo = JSON.parse(rsaDecryptBase64(responseData.keys, APP_CONFIG.responsePrivateKey));
  return JSON.parse(aesDecryptHex(responseData.response_key, aesInfo.key, aesInfo.iv));
}

function storageGet(key) {
  try { return Widget.storage && Widget.storage.get ? Widget.storage.get(key) : null; } catch (e) { return null; }
}

function storageSet(key, value) {
  try { if (Widget.storage && Widget.storage.set) Widget.storage.set(key, value); } catch (e) {}
}

function mediaBindingKey(mediaType, tmdbId) {
  const type = normalizeMediaType(mediaType);
  const id = String(tmdbId || "").trim();
  return type && id ? MEDIA_BINDING_PREFIX + type + "." + id : "";
}

function saveMediaBinding(mediaType, tmdbId, item) {
  const key = mediaBindingKey(mediaType, tmdbId);
  if (!key || !item || !item.vod_id) return;
  storageSet(key, JSON.stringify({
    vodId: String(item.vod_id),
    title: String(item.title || item.vod_name || ""),
    year: String(item.vod_year || "").slice(0, 4),
    area: String(item.vod_area || item.area || ""),
    category: mediaType === "movie" ? "movie" : "tv",
    updatedAt: Date.now()
  }));
}

function loadMediaBinding(mediaType, tmdbId) {
  const key = mediaBindingKey(mediaType, tmdbId);
  return key ? parseJSON(storageGet(key), null) : null;
}

async function getTmdbMovieContext(tmdbId) {
  const id = String(tmdbId || "").replace(/^movie\./i, "").trim();
  if (!/^\d+$/.test(id)) return null;
  if (!__tmdbMovieDetailCache[id]) {
    __tmdbMovieDetailCache[id] = Widget.tmdb.get("movie/" + id, { params: { language: "zh-CN", append_to_response: "credits" } }).catch(() => null);
  }
  const data = await __tmdbMovieDetailCache[id];
  if (!data || !data.id) return null;
  return {
    tmdbId: String(data.id),
    title: cleanText(data.title || data.original_title || ""),
    originalTitle: cleanText(data.original_title || ""),
    releaseDate: String(data.release_date || ""),
    year: String(data.release_date || "").slice(0, 4),
    actors: safeArray(data.credits && data.credits.cast).slice(0, 8).map(x => x && x.name).filter(Boolean).join("/")
  };
}

function parseJSON(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value === "object") return value;
  try { return JSON.parse(String(value)); } catch (e) { return fallback; }
}

function randomHex(size) {
  const chars = "0123456789ABCDEF";
  let out = "";
  for (let i = 0; i < size; i++) out += chars.charAt(Math.floor(Math.random() * 16));
  return out;
}

function createDeviceId() {
  return `${randomHex(8)}-${randomHex(4)}-4${randomHex(3)}-${"89AB".charAt(Math.floor(Math.random() * 4))}${randomHex(3)}-${randomHex(12)}`;
}

function normalizeBaseURL(value) {
  const url = String(value || "").trim().replace(/\/+$/, "");
  return /^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(url) ? url : "";
}

function uniqueBaseURLs(values) {
  const out = [];
  for (const value of values || []) {
    const url = normalizeBaseURL(value);
    if (url && out.indexOf(url) < 0) out.push(url);
  }
  return out;
}

async function getPublicIP() {
  try {
    const response = await Widget.http.get("https://api.ipify.org/?format=json", { headers: { "User-Agent": USER_AGENT } });
    const data = parseJSON(response && response.data, {});
    return String(data && data.ip || "");
  } catch (e) {
    return "";
  }
}

async function loadRemoteDomains() {
  try {
    const response = await Widget.http.get(APP_CONFIG.thirdPartyDomainURL, { headers: { "User-Agent": USER_AGENT } });
    const root = parseJSON(response && response.data, null);
    const encrypted = root && root.code === 200 && root.data && root.data.response_key;
    if (!encrypted) return [];
    const text = aesDecryptHex(encrypted, APP_CONFIG.thirdPartyAes.key, APP_CONFIG.thirdPartyAes.iv);
    return uniqueBaseURLs(parseJSON(text, {}).list || []);
  } catch (e) {
    return [];
  }
}

async function initializeDomains(force = false) {
  if (__domainsReady && !force && APP_CONFIG.baseURL) return APP_CONFIG.baseURL;
  if (__domainPromise) return __domainPromise;
  __domainPromise = (async () => {
    const cached = parseJSON(storageGet(DOMAIN_STORAGE_KEY), {});
    const cachedList = uniqueBaseURLs(cached && cached.list || []);
    const remote = await loadRemoteDomains();
    APP_CONFIG.baseURLs = uniqueBaseURLs([].concat(remote, cachedList, APP_CONFIG.baseURLs));
    if (remote.length) storageSet(DOMAIN_STORAGE_KEY, JSON.stringify({ list: remote, updatedAt: Date.now() }));
    const checks = APP_CONFIG.baseURLs.slice(0, 3).map(async (url, index) => {
      try {
        const response = await Widget.http.get(url + "/domain/check", { headers: { "User-Agent": USER_AGENT } });
        const text = String(response && response.data || "").trim().toLowerCase();
        if ((response && response.status && Number(response.status) >= 400) || (text && text !== "success")) throw new Error("domain check failed");
        return { url, index };
      } catch (e) {
        return null;
      }
    });
    const results = await Promise.all(checks);
    const hit = results.filter(Boolean)[0];
    APP_CONFIG.baseURL = hit ? hit.url : (APP_CONFIG.baseURLs[0] || "");
    __activeDomainIndex = Math.max(0, APP_CONFIG.baseURLs.indexOf(APP_CONFIG.baseURL));
    if (!APP_CONFIG.baseURL) throw new Error("瓜子 API 域名不可用");
    __domainsReady = true;
    return APP_CONFIG.baseURL;
  })();
  try { return await __domainPromise; } finally { __domainPromise = null; }
}

function loadStoredAuth() {
  const auth = parseJSON(storageGet(AUTH_STORAGE_KEY), {});
  if (!auth || !auth.deviceId || !auth.token) return false;
  APP_CONFIG.deviceId = String(auth.deviceId);
  APP_CONFIG.token = String(auth.token);
  APP_CONFIG.tokenId = String(auth.tokenId || "");
  APP_CONFIG.ip = String(auth.ip || "");
  return true;
}

function saveAuth() {
  storageSet(AUTH_STORAGE_KEY, JSON.stringify({
    deviceId: APP_CONFIG.deviceId,
    token: APP_CONFIG.token,
    tokenId: APP_CONFIG.tokenId,
    ip: APP_CONFIG.ip,
    updatedAt: Date.now()
  }));
}

async function rawPrivatePost(path, params = {}, baseURL = "") {
  const url = normalizeBaseURL(baseURL || APP_CONFIG.baseURL);
  if (!url) throw new Error("瓜子 API 域名为空");
  const response = await Widget.http.post(url + path, buildRequestBody(params), { headers: buildHeaders() });
  const root = parseJSON(response && response.data, null);
  if (!root) throw new Error("瓜子 API 响应格式异常");
  let data = root.data;
  if (data && data.response_key && data.keys) data = decryptResponse(data);
  return { root, data };
}

async function authenticate(force = false) {
  if (__authPromise) return __authPromise;
  __authPromise = (async () => {
    await ensureLibs();
    await initializeDomains(false);
    if (!force && !APP_CONFIG.token) loadStoredAuth();
    if (!APP_CONFIG.deviceId) APP_CONFIG.deviceId = createDeviceId();
    if (!APP_CONFIG.ip) APP_CONFIG.ip = await getPublicIP();
    const payload = { new_key: APP_CONFIG.deviceId, old_key: APP_CONFIG.deviceId };
    APP_CONFIG.token = "";
    APP_CONFIG.tokenId = "";
    let lastError = null;
    const total = Math.max(1, APP_CONFIG.baseURLs.length);
    for (let attempt = 0; attempt < total; attempt++) {
      const index = (__activeDomainIndex + attempt) % total;
      const baseURL = APP_CONFIG.baseURLs[index];
      APP_CONFIG.baseURL = baseURL;
      try {
        let result = await rawPrivatePost("/App/Authentication/Device/signIn", payload, baseURL);
        if (!result.root || result.root.code !== 200 || !result.data || !result.data.token) {
          result = await rawPrivatePost("/App/Authentication/Device/signUp", payload, baseURL);
        }
        if (!result.root || result.root.code !== 200 || !result.data || !result.data.token) {
          throw new Error((result.root && result.root.msg) || "瓜子设备鉴权失败");
        }
        APP_CONFIG.token = String(result.data.token);
        APP_CONFIG.tokenId = String(result.data.token_id || "");
        __activeDomainIndex = index;
        saveAuth();
        return true;
      } catch (e) {
        lastError = e;
      }
    }
    throw lastError || new Error("瓜子设备鉴权失败");
  })();
  try { return await __authPromise; } finally { __authPromise = null; }
}

function shouldReauthenticate(root) {
  const code = Number(root && root.code || 0);
  const msg = String(root && root.msg || "");
  return code === 401 || code === 403 || code === 451 || /token|登录|鉴权|认证|设备.*不存在|过期/i.test(msg);
}

function shouldRotateDomain(error, root) {
  if (error) return true;
  const code = Number(root && root.code || 0);
  return code === 502 || code === 503 || code === 504 || code === 404;
}

async function privatePost(path, params = {}) {
  await ensureLibs();
  await initializeDomains(false);
  if (!APP_CONFIG.token) loadStoredAuth();
  if (!APP_CONFIG.token) await authenticate(false);
  let authRetried = false;
  let lastError = null;
  const total = Math.max(1, APP_CONFIG.baseURLs.length);
  for (let attempt = 0; attempt < total; attempt++) {
    const index = (__activeDomainIndex + attempt) % total;
    const baseURL = APP_CONFIG.baseURLs[index];
    APP_CONFIG.baseURL = baseURL;
    try {
      let result = await rawPrivatePost(path, params, baseURL);
      if (shouldReauthenticate(result.root) && !authRetried) {
        authRetried = true;
        await authenticate(true);
        result = await rawPrivatePost(path, params, APP_CONFIG.baseURL);
      }
      if (result.root && result.root.code === 200) {
        __activeDomainIndex = Math.max(0, APP_CONFIG.baseURLs.indexOf(APP_CONFIG.baseURL));
        return result.data != null ? result.data : result.root;
      }
      if (shouldReauthenticate(result.root) || !shouldRotateDomain(null, result.root)) {
        const error = new Error((result.root && result.root.msg) || "请求失败");
        error.noRotate = true;
        throw error;
      }
      lastError = new Error((result.root && result.root.msg) || "域名请求失败");
    } catch (e) {
      lastError = e;
      if (e && e.noRotate) break;
    }
  }
  throw lastError || new Error("瓜子 API 全部域名不可用");
}

function safeArray(v) { return Array.isArray(v) ? v : []; }

function normalizeTitle(text) {
  return String(text || "").toLowerCase().replace(/[\s·•・:：\-–—_!！?？.,，。、"'`~()（）\[\]【】]/g, "");
}

function extractCardSeason(text) {
  const t = String(text || "");
  const cnNums = ["零","一","二","三","四","五","六","七","八","九","十","十一","十二","十三","十四","十五","十六","十七","十八","十九","二十"];
  let m = t.match(/第\s*([一二三四五六七八九十]+|\d+)\s*[季部]/);
  if (m) {
    const v = m[1];
    if (/^\d+$/.test(v)) return parseInt(v, 10);
    const idx = cnNums.indexOf(v);
    if (idx >= 0) return idx;
  }
  return null;
}

function stripCardSeason(text) {
  return String(text || "").replace(/第\s*[一二三四五六七八九十0-9]+\s*[季部]/g, "").trim();
}

const __tmdbSearchCache = {};

async function searchForwardEntity(item) {
  const isMovie = safeArray(item.tags).includes("电影");
  const mediaType = isMovie ? "movie" : "tv";
  const rawTitle = String(item.title || "").trim();
  const keyword = stripCardSeason(rawTitle) || rawTitle;
  const cacheKey = mediaType + "::" + keyword;
  if (!__tmdbSearchCache[cacheKey]) {
    __tmdbSearchCache[cacheKey] = Widget.tmdb.get("search/" + mediaType, { params: { query: keyword, language: "zh-CN", page: 1 } }).catch(() => ({ results: [] }));
  }
  const data = await __tmdbSearchCache[cacheKey];
  const results = safeArray(data && data.results);
  if (!results.length) return null;

  const rawNorm = normalizeTitle(stripQualityTag(rawTitle));
  const baseNorm = normalizeTitle(stripQualityTag(keyword));
  const seasonNum = extractCardSeason(rawTitle);
  const year = String(item.vod_year || "").slice(0, 4);
  let best = null;
  let bestScore = -1e9;
  for (const r of results) {
    const name = String(r.name || r.title || "");
    const nameNorm = normalizeTitle(name);
    const firstAirDate = String(r.first_air_date || r.release_date || "");
    const releaseYear = firstAirDate.slice(0, 4);
    if (isMovie && year && releaseYear && releaseYear !== year) continue;
    let score = 0;
    if (nameNorm === rawNorm) score += 100;
    if (nameNorm === baseNorm) score += 90;
    if (nameNorm.includes(baseNorm) || baseNorm.includes(nameNorm)) score += 35;
    if (year && releaseYear === year) score += 80;
    if (r.media_type === mediaType || !r.media_type) score += 8;
    if (score > bestScore) {
      bestScore = score;
      best = r;
    }
  }
  if (!best) return null;
  return {
    id: best.id,
    mediaType,
    seasonNum,
    info: {
      id: best.id,
      originalTitle: best.original_name || best.original_title || "",
      description: best.overview || "",
      releaseDate: best.first_air_date || best.release_date || "",
      backdropPath: best.backdrop_path || "",
      posterPath: best.poster_path || "",
      rating: best.vote_average || 0,
      mediaType,
      seasonInfo: seasonNum ? `第 ${seasonNum} 季` : ""
    }
  };
}

function stripQualityTag(text) {
  const s = String(text || "").trim();
  const out = s.replace(/(^|[\s._\-]|[\u4e00-\u9fff\d])TC$/, "$1").replace(/[\s._\-]+$/, "").trim();
  return out || s;
}

async function mapRankItems(data) {
  const out = [];
  for (const item of safeArray(data.list)) {
    if (item && item.title) item.title = stripQualityTag(item.title);
    const entity = await searchForwardEntity(item);
    const seasonNum = extractCardSeason(item.title || "");
    const tagsArr = safeArray(item.tags);
    const isAnime = tagsArr.some(t => /动漫|动画|漫画/.test(String(t)));
    const isVariety = tagsArr.some(t => /综艺|脱口秀|真人秀/.test(String(t)));
    const isDoc = tagsArr.some(t => /纪录/.test(String(t)));
    const isMovieTag = tagsArr.includes("电影");
    let cat = "tv";
    if (isMovieTag) cat = "movie";
    else if (isAnime) cat = "anime";
    else if (isVariety) cat = "variety";
    else if (isDoc) cat = "documentary";
    // genreTitle 中追加 [GXF cat=…|area=…] 标记，loadResource 端可解析回锁
    const gxfMarker = `[GXF cat=${cat}|area=${item.vod_area || item.area || ""}|t=${item.t_id || ""}|vid=${item.vod_id || ""}]`;
    const genreOut = (tagsArr.length ? tagsArr.join(" / ") + " " : "") + gxfMarker;
    if (entity && entity.id) {
      saveMediaBinding(entity.mediaType, entity.id, item);
      out.push({
        id: entity.id,
        type: "tmdb",
        title: item.title,
        originalTitle: entity.info.originalTitle || "",
        posterPath: item.pic || entity.info.posterPath || item.pre_video_pic || "",
        backdropPath: item.pre_video_pic || entity.info.backdropPath || item.pic || "",
        description: [
          entity.info.description || item.sub_title || "",
          item.vod_director ? `导演：${item.vod_director}` : "",
          item.vod_actor ? `演员：${item.vod_actor}` : "",
          tagsArr.length ? `标签：${tagsArr.join(" / ")}` : "",
          item.new_continue ? `更新：${item.new_continue}` : (item.vod_remarks ? `更新：${item.vod_remarks}` : "")
        ].filter(Boolean).join("\n"),
        releaseDate: entity.info.releaseDate || item.vod_year || "",
        rating: item.score || entity.info.rating || "",
        mediaType: entity.mediaType,
        genreTitle: genreOut,
        tmdbInfo: entity.info,
        tmdbId: entity.id,
        seasonInfo: seasonNum ? `第 ${seasonNum} 季` : ""
      });
    } else {
      out.push({
        id: item.vod_id,
        type: "url",
        title: item.title,
        posterPath: item.pic || item.pre_video_pic || "",
        backdropPath: item.pre_video_pic || item.pic || "",
        description: [
          item.sub_title || "",
          item.vod_director ? `导演：${item.vod_director}` : "",
          item.vod_actor ? `演员：${item.vod_actor}` : "",
          safeArray(item.tags).length ? `标签：${item.tags.join(" / ")}` : "",
          item.new_continue ? `更新：${item.new_continue}` : (item.vod_remarks ? `更新：${item.vod_remarks}` : "")
        ].filter(Boolean).join("\n"),
        releaseDate: item.vod_year || "",
        rating: item.score || "",
        mediaType: safeArray(item.tags).includes("电影") ? "movie" : "tv",
        genreTitle: safeArray(item.tags).join(" / "),
        videoUrl: item.pre_video || "",
        previewUrl: item.pre_video || "",
        playerType: "system"
      });
    }
  }
  return out;
}

async function getRankByCateId(cateId, expectedTitle) {
  const data = await privatePost("/App/NewDiscover/getList", { cateId, page: 1, pageSize: 10 });
  if (data.name !== expectedTitle) throw new Error(`标题与接口内容不一致：期望 ${expectedTitle}，实际 ${data.name}`);
  return await mapRankItems(data);
}

async function getNetflixNew() { return getRankByCateId(2, "Netflix新片榜"); }
async function getDisneyNew() { return getRankByCateId(3, "Disney+新片榜"); }
async function getAppleTvNew() { return getRankByCateId(5, "Apple TV+新片榜"); }
async function getHboNew() { return getRankByCateId(4, "HBOmax新片榜"); }
async function getPrimeVideoNew() { return getRankByCateId(6, "prime video新片榜"); }
async function getWeeklyDomesticDrama() { return getRankByCateId(15, "本周国剧排行榜"); }
async function getWeeklyUSDrama() { return getRankByCateId(8, "本周美剧排行榜"); }
async function getWeeklyAnime() { return getRankByCateId(12, "本周动漫排行榜"); }
async function getWeeklyMovie() { return getRankByCateId(148, "本周电影排行榜"); }
async function getWeeklyKDrama() { return getRankByCateId(10, "本周韩剧排行榜"); }
async function getWeeklyUKDrama() { return getRankByCateId(9, "本周英剧排行榜"); }
async function getWeeklyJDrama() { return getRankByCateId(11, "本周日剧排行榜"); }
async function getWeeklyThaiDrama() { return getRankByCateId(149, "本周泰剧排行榜"); }
async function getWeeklyVariety() { return getRankByCateId(171, "本周综艺排行榜"); }
async function getWeeklyDocumentary() { return getRankByCateId(172, "本周纪录片排行榜"); }

function cleanText(text) {
  return String(text || "")
    .replace(/[\u200B-\u200D\uFEFF\u2060\u00AD]/g, "")
    .trim();
}

function toInt(v, defVal = 0) {
  const n = parseInt(String(v == null ? "" : v).trim(), 10);
  return Number.isFinite(n) ? n : defVal;
}

function chineseNumberToInt(value) {
  const t = cleanText(value);
  if (!t) return null;
  if (/^\d+$/.test(t)) return parseInt(t, 10);
  const digitMap = { "零": 0, "〇": 0, "一": 1, "二": 2, "两": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9 };
  if (Object.prototype.hasOwnProperty.call(digitMap, t)) return digitMap[t];
  if (t === "十") return 10;
  const m = t.match(/^([一二两三四五六七八九])?十([一二两三四五六七八九])?$/);
  if (!m) return null;
  return (m[1] ? digitMap[m[1]] : 1) * 10 + (m[2] ? digitMap[m[2]] : 0);
}

function extractSeasonNumber(text) {
  const t = cleanText(text);
  const patterns = [
    /第\s*([零〇一二两三四五六七八九十百\d]+)\s*[季部]/i,
    /(?:season|series)\s*[-_.:]?\s*(\d{1,3})/i,
    /\bS(?:eason)?\s*[-_.:]?\s*(\d{1,3})(?:\s*E\d+)?\b/i,
    /([零〇一二两三四五六七八九十]+)\s*[季部](?:\s|$|[（(【[])/
  ];
  for (const pattern of patterns) {
    const m = t.match(pattern);
    if (!m) continue;
    const n = chineseNumberToInt(m[1]);
    if (n != null && n > 0) return n;
  }
  return null;
}

function extractYear(text) {
  const m = cleanText(text).match(/\b(19|20)\d{2}\b/);
  return m ? m[0] : "";
}

function stripSeasonHints(text) {
  return cleanText(text)
    .replace(/第\s*[零〇一二两三四五六七八九十百0-9]+\s*[季部]/ig, "")
    .replace(/(?:season|series)\s*[-_.:]?\s*\d{1,3}/ig, "")
    .replace(/\bS(?:eason)?\s*[-_.:]?\s*\d{1,3}(?:\s*E\d{1,3})?\b/ig, "")
    .replace(/[零〇一二两三四五六七八九十]+\s*[季部](?=\s|$|[（(【[])/ig, "")
    .trim();
}

function normalizeName(text) {
  return cleanText(text)
    .toLowerCase()
    .replace(/[\s·•・:：\-–—_!！?？.,，。、"'`~()（）\[\]【】]/g, "");
}

function normalizeMediaType(value) {
  const t = cleanText(value).toLowerCase();
  if (t === "movie" || t === "film") return "movie";
  if (t === "tv" || t === "series" || t === "show" || t === "episode") return "tv";
  return "";
}

function firstPositiveInt(values) {
  for (const value of values) {
    const n = toInt(value, 0);
    if (n > 0) return n;
  }
  return 0;
}

function buildPlaybackContext(params = {}) {
  const mediaType = normalizeMediaType(params.type) || normalizeMediaType(params.mediaType);
  const title = cleanText(params.title || "");
  const seriesName = cleanText(params.seriesName || "");
  const episodeName = cleanText(params.episodeName || "");
  const season = firstPositiveInt([
    params.season,
    params.seasonNumber,
    extractSeasonNumber(seriesName),
    extractSeasonNumber(title),
    extractSeasonNumber(episodeName),
    extractSeasonNumber(params.seasonInfo || "")
  ]);
  const episode = firstPositiveInt([params.episode, params.episodeNumber, extractEpisodeNumber(episodeName)]);
  let showTitle = seriesName;
  if (!showTitle && mediaType === "movie") showTitle = title;
  if (!showTitle && title && !/^\s*(?:第\s*)?\d+\s*[集话期]?\s*$/i.test(title)) showTitle = title;
  if (!showTitle) showTitle = cleanText(params.originalTitle || (params.tmdbInfo && params.tmdbInfo.originalTitle) || "");
  return Object.assign({}, params, {
    type: mediaType || (season > 0 || episode > 0 ? "tv" : params.type),
    seriesName: showTitle,
    title,
    episodeName,
    season,
    episode
  });
}

function typeScoreByParams(item, params) {
  const tid = String(item.t_id || item.type_id || "");
  const cat = String(params.__gxfCategory || params.gxfCategory || "").toLowerCase();
  if (!tid) return 0;
  // 强类别约束（动漫/综艺/纪录片/电影/电视剧），错类别一票否决式扣分
  if (cat === "anime") {
    if (tid === "4") return 80;
    if (tid === "1") return -200;
    if (tid === "2") return -200;
    return -120;
  }
  if (cat === "variety") {
    if (tid === "3") return 80;
    return -200;
  }
  if (cat === "documentary") {
    if (tid === "5") return 80;
    return -200;
  }
  if (cat === "movie" || params.type === "movie") {
    if (tid === "1") return 60;
    // 动画电影（猫和老鼠/迪士尼动画等）源站常归类 t_id=4（动漫），电影场景不应一票否决
    if (tid === "4") return 30;
    return -200;
  }
  // 默认 tv
  if (tid === "1") return -120;
  if (tid === "2") return 40;
  if (tid === "4") return -150;
  if (tid === "3" || tid === "5") return -200;
  return 0;
}

function areaScore(item, params) {
  const want = String(params.__gxfArea || "").trim();
  if (!want) return 0;
  const got = String(item.vod_area || "").trim();
  if (!got) return 0;
  if (got === want) return 50;
  // 大陆/中国互通
  if (/大陆|中国|内地/.test(want) && /大陆|中国|内地/.test(got)) return 50;
  return -40;
}

function actorScore(item, params) {
  const wantActors = String(params.__gxfActor || "").toLowerCase();
  if (!wantActors) return 0;
  const got = String(item.vod_actor || "").toLowerCase();
  if (!got) return 0;
  const wantList = wantActors.split(/[,，、\/\s]+/).filter(Boolean);
  let hit = 0;
  for (const a of wantList) {
    if (a.length >= 2 && got.indexOf(a) >= 0) hit++;
  }
  if (hit >= 2) return 25;
  if (hit === 1) return 12;
  return 0;
}

function scoreCandidate(item, want, params) {
  const name = String(item.vod_name || item.title || "");
  const matchName = stripQualityTag(name);
  const normName = normalizeName(matchName);
  const baseName = normalizeName(stripSeasonHints(matchName));
  const year = String(item.vod_year || "").slice(0, 4);
  const seasonNum = extractSeasonNumber(matchName);
  const sameFranchise = !!want.baseNorm && baseName === want.baseNorm;
  const typeScore = typeScoreByParams(item, params);
  if (!sameFranchise || typeScore < 0) return -1e9;
  if (params.type === "movie" && want.year && year && year !== want.year) return -1e9;
  if (params.type === "movie" && seasonNum != null) return -1e9;
  if (params.type !== "movie" && want.season > 1 && seasonNum !== want.season) return -1e9;
  if (params.type !== "movie" && want.season === 1 && seasonNum != null && seasonNum !== 1) return -1e9;
  let score = 0;
  if (want.fullNorm && normName === want.fullNorm) score += 320;
  if (want.baseNorm && baseName === want.baseNorm) score += 220;
  if (want.baseNorm && (normName.includes(want.baseNorm) || want.baseNorm.includes(normName))) score += 45;
  score += typeScore;
  score += areaScore(item, params);
  score += actorScore(item, params);
  // —— 季匹配：对“按季拆分条目”的数据源（瓜子影视）这是决定性信号 ——
  // 仅当候选与目标同属一个系列（去季名后的基名一致）时才施加强季权重，
  // 避免无关剧集仅凭季号蒙分；裸标题（无季号）在季拆分源里通常即第一季。
  if (want.season > 0) {
    if (sameFranchise && seasonNum === want.season) {
      score += 300;
    } else if (sameFranchise && seasonNum != null) {
      score -= 420;
    } else if (sameFranchise && want.season === 1) {
      score += 100;
    } else if (sameFranchise) {
      score -= 320;
    } else if (seasonNum != null && seasonNum !== want.season) {
      score -= 120;
    }
  } else if (seasonNum != null && seasonNum > 1) {
    score -= 15;
  }
  if (want.year && year === want.year) score += 70;
  if (/解说|速看|合集|全系列|电影解说|预告|花絮|彩蛋/.test(name)) score -= 80;
  // 集数容量兜底：候选总集数若装不下 want.episode，强扣分（防止挑到只有 10 集的同名剧集）
  const wantEp = toInt(params.episode, 0);
  if (wantEp > 0) {
    const cap = toInt(item.vod_continu, 0) || toInt(item.d_total, 0) || toInt(item.vod_total, 0);
    if (cap > 0 && cap < wantEp) score -= 250;
  }
  // 名称过度扩展惩罚：用“去季名”后的基名比较，避免误伤合法分季条目（如“梦魇绝镇第四季”）
  if (want.baseNorm && baseName !== want.baseNorm && (!want.fullNorm || normName !== want.fullNorm)) {
    if (baseName.length > want.baseNorm.length + 2) score -= 30;
    if (!baseName.startsWith(want.baseNorm) && want.baseNorm.length >= 4) score -= 25;
  }
  return score;
}

function pickBestVod(list, params) {
  const rawSeries = cleanText(params.seriesName || params.title || "");
  const rawEpisodeName = cleanText(params.episodeName || "");
  const fullText = [rawSeries, rawEpisodeName].filter(Boolean).join(" ");
  const inferredSeason = toInt(params.season, 0) || extractSeasonNumber(fullText) || extractSeasonNumber(rawSeries) || extractSeasonNumber(rawEpisodeName) || 0;
  const inferredYear = params.type === "movie" ? (String(params.premiereDate || params.releaseDate || "").slice(0, 4) || extractYear(fullText) || "") : "";
  const matchSeries = params.type === "movie" ? stripQualityTag(rawSeries) : rawSeries;
  const baseTitle = stripSeasonHints(matchSeries || rawEpisodeName || fullText);
  const want = {
    season: inferredSeason,
    year: inferredYear,
    fullNorm: normalizeName(matchSeries || fullText),
    baseNorm: normalizeName(baseTitle || matchSeries || fullText)
  };
  // 0) 若 params 中带 GXF 锁定 vod_id，且候选里存在，直接命中
  const lockVid = String(params.__gxfVid || "").trim();
  if (lockVid && !(params.type !== "movie" && want.season > 1)) {
    const hit = safeArray(list).find(it => String(it.vod_id || "") === lockVid);
    if (hit) {
      const hitName = stripQualityTag(String(hit.vod_name || hit.title || ""));
      const hitBase = normalizeName(stripSeasonHints(hitName));
      const hitSeason = extractSeasonNumber(hitName);
      const hitYear = String(hit.vod_year || "").slice(0, 4);
      const yearMatches = params.type !== "movie" || !want.year || !hitYear || hitYear === want.year;
      if (yearMatches && hitBase === want.baseNorm && (!want.season || hitSeason === want.season || (want.season === 1 && hitSeason == null))) return hit;
    }
  }
  const ranked = safeArray(list)
    .map(item => ({ item, score: scoreCandidate(item, want, params) }))
    .filter(entry => entry.score > -1e8)
    .sort((a, b) => b.score - a.score);
  if (!ranked.length) return null;
  const top = ranked[0];
  const topName = stripQualityTag(String(top.item.vod_name || top.item.title || ""));
  const topBase = normalizeName(stripSeasonHints(topName));
  const topSeason = extractSeasonNumber(topName);
  const topYear = String(top.item.vod_year || "").slice(0, 4);
  const sameTitle = !!want.baseNorm && topBase === want.baseNorm;
  if (!sameTitle || top.score < 120) return null;
  if (params.type === "movie" && want.year && topYear && topYear !== want.year) return null;
  if (want.season > 1 && topSeason !== want.season) return null;
  if (want.season === 1 && topSeason != null && topSeason !== 1) return null;
  // 调试日志（仅在 console 可用时）
  try {
    if (typeof console !== "undefined" && console.log) {
      console.log("[forward_rank] candidates for", rawSeries, "want=", JSON.stringify(want), "cat=", params.__gxfCategory || "", "area=", params.__gxfArea || "");
      ranked.slice(0, 6).forEach(r => console.log("  ", r.score, r.item.vod_id, r.item.t_id, r.item.vod_area, r.item.vod_year, r.item.vod_name));
    }
  } catch (e) {}
  return top.item;
}

function extractEpisodeNumber(text) {
  const t = cleanText(text);
  if (!t) return 0;
  const patterns = [
    /(?:第\s*)?(\d{1,4})\s*[集话期]/i,
    /\bE(?:P(?:ISODE)?)?\s*[-_.:]?\s*(\d{1,4})\b/i,
    /\bS\d{1,3}\s*E(\d{1,4})\b/i,
    /^0*(\d{1,4})$/
  ];
  for (const pattern of patterns) {
    const m = t.match(pattern);
    if (m) return toInt(m[1], 0);
  }
  return 0;
}

function pickEpisode(list, params) {
  const eps = safeArray(list);
  if (!eps.length) return null;
  if (params.type === "movie") return eps[0];
  const wantEp = firstPositiveInt([params.episode, params.episodeNumber, extractEpisodeNumber(params.episodeName || "")]);
  if (wantEp <= 0) return null;
  for (const ep of eps) {
    if (extractEpisodeNumber(ep.title || "") === wantEp) return ep;
  }
  for (const ep of eps) {
    if (toInt(ep.sort, 0) === wantEp) return ep;
  }
  return null;
}

const GXF_FAKE_HOST_RE = /xn--55qx2ai23bz99b|xn--fiqs8s|wanglaoshi|(^|\.)(\u529e\u516c\u9694\u65ad)\.cn|(^|\.)(\u7f51\u8001\u5e08)/i;

function isFakePlayUrl(url) {
  const u = String(url || "");
  if (!u) return true;
  return GXF_FAKE_HOST_RE.test(u);
}

function decodePlaylistBody(value) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text || text.indexOf("#EXTM3U") >= 0) return text;
  if (!/^[A-Za-z0-9+/=\r\n]+$/.test(text)) return text;
  try {
    if (typeof CryptoJS !== "undefined") return CryptoJS.enc.Base64.parse(text).toString(CryptoJS.enc.Utf8);
  } catch (e) {}
  return text;
}

async function probePlayUrl(url) {
  try {
    const probe = await Widget.http.get(url, { headers: { "User-Agent": PLAY_USER_AGENT }, allow_redirects: true });
    const loc = probe && probe.headers && (probe.headers.location || probe.headers.Location);
    const finalUrl = loc || url;
    if (isFakePlayUrl(finalUrl)) return null;
    const body = decodePlaylistBody(probe && probe.data);
    if (!body) return finalUrl;
    if (GXF_FAKE_HOST_RE.test(body)) return null;
    if (/#EXT-X-STREAM-INF/i.test(body)) return finalUrl;
    if (/#EXTINF/i.test(body)) {
      let total = 0;
      let count = 0;
      const re = /#EXTINF:([\d.]+)/g;
      let m;
      while ((m = re.exec(body)) !== null) {
        total += parseFloat(m[1]) || 0;
        count++;
      }
      if (/#EXT-X-ENDLIST/i.test(body) && count > 0 && total < 200) return null;
    }
    return finalUrl;
  } catch (e) {
    return null;
  }
}

function compareResolution(a, b) {
  return toInt(b && b.resolution, 0) - toInt(a && a.resolution, 0);
}

async function resolvePlayUrls(ep, params = {}) {
  const s = toInt(params.season, 0);
  const e = toInt(params.episode, 0);
  const label = params.type !== "movie" && s > 0 && e > 0 ? ` S${s}E${e}` : " 正片";
  const details = safeArray(await privatePost("/App/Resource/Vod/vurlDetail", { vurl_id: ep.id }));
  const ordered = details.slice().sort(compareResolution);
  for (const item of ordered) {
    if (!item || !item.url || isFakePlayUrl(item.url)) continue;
    const real = await probePlayUrl(item.url);
    if (!real) continue;
    return [{
      name: `瓜子影视${label}`,
      description: "瓜子影视",
      url: real,
      customHeaders: { "User-Agent": PLAY_USER_AGENT },
      headers: { "User-Agent": PLAY_USER_AGENT }
    }];
  }
  return [];
}

function parseGxfMarker(text) {
  // 解析 [GXF cat=anime|area=大陆|t=4|vid=39]
  const m = String(text || "").match(/\[GXF\s+([^\]]+)\]/);
  if (!m) return {};
  const out = {};
  m[1].split("|").forEach(seg => {
    const idx = seg.indexOf("=");
    if (idx > 0) out[seg.slice(0, idx).trim()] = seg.slice(idx + 1).trim();
  });
  return out;
}

function inferCategoryFromParams(params) {
  // 优先使用 GXF marker
  const m = parseGxfMarker(params.genreTitle || "");
  if (m.cat) return { cat: m.cat, area: m.area || "", vid: m.vid || "", t: m.t || "" };
  const text = [
    params.genreTitle || "",
    params.tagsText || "",
    params.title || "",
    params.seriesName || "",
    params.originalTitle || "",
    params.tmdbInfo && params.tmdbInfo.originalTitle || ""
  ].join(" ");
  let cat = "";
  if (params.type === "movie") cat = "movie";
  else if (/动漫|动画|漫画|Animation|Anime/i.test(text)) cat = "anime";
  else if (/综艺|脱口秀|真人秀|Reality|Talk[- ]?Show/i.test(text)) cat = "variety";
  else if (/纪录|Documentary/i.test(text)) cat = "documentary";
  else cat = "tv";
  return { cat, area: "", vid: "", t: "" };
}

async function loadResource(rawParams = {}) {
  const seed = Object.assign({}, rawParams);
  const initialType = normalizeMediaType(seed.type) || normalizeMediaType(seed.mediaType);
  const rawTmdbId = seed.tmdbId || (initialType === "movie" && /^\d+$/.test(String(seed.id || "")) ? seed.id : "");
  const tmdbId = String(rawTmdbId || "").replace(/^movie\./i, "").trim();
  let movieContext = null;
  let binding = null;
  if (initialType === "movie") {
    binding = loadMediaBinding("movie", tmdbId);
    if (tmdbId) movieContext = await getTmdbMovieContext(tmdbId);
    if (movieContext) {
      seed.title = movieContext.title || seed.title;
      seed.seriesName = movieContext.title || seed.seriesName || seed.title;
      seed.originalTitle = movieContext.originalTitle || seed.originalTitle;
      seed.releaseDate = movieContext.releaseDate || seed.releaseDate;
      seed.premiereDate = movieContext.releaseDate || seed.premiereDate;
      if (binding && binding.year && movieContext.year && binding.year !== movieContext.year) binding = null;
    } else if (binding) {
      seed.seriesName = binding.title || seed.seriesName || seed.title;
      seed.releaseDate = binding.year || seed.releaseDate;
      seed.premiereDate = binding.year || seed.premiereDate;
    }
  }
  const params = buildPlaybackContext(seed);
  const rawSeries = String(params.seriesName || "").trim();
  const searchKeyword = stripSeasonHints(rawSeries) || rawSeries;
  if (!searchKeyword) return [];
  if (params.type !== "movie" && (toInt(params.season, 0) <= 0 || toInt(params.episode, 0) <= 0)) return [];
  const meta = inferCategoryFromParams(params);
  const enrichedParams = Object.assign({}, params, {
    __gxfCategory: binding && binding.category || meta.cat,
    __gxfArea: binding && binding.area || meta.area,
    __gxfVid: binding && binding.vodId || meta.vid,
    __gxfActor: movieContext && movieContext.actors || ""
  });
  const searchData = await privatePost("/App/Index/findMoreVod", { keywords: searchKeyword, order_val: "" });
  const candidates = safeArray(searchData && searchData.list);
  if (params.type === "movie" && !String(params.premiereDate || params.releaseDate || "").slice(0, 4)) {
    const wantedName = normalizeName(stripQualityTag(searchKeyword));
    const years = [];
    for (const item of candidates) {
      if (normalizeName(stripQualityTag(item.vod_name || item.title || "")) !== wantedName) continue;
      const y = String(item.vod_year || "").slice(0, 4);
      if (y && years.indexOf(y) < 0) years.push(y);
    }
    if (years.length > 1) return [];
  }
  let best = pickBestVod(candidates, enrichedParams);
  if (!best && params.type !== "movie" && toInt(params.season, 0) > 1) {
    const seasonKeyword = rawSeries + " 第" + params.season + "季";
    const seasonData = await privatePost("/App/Index/findMoreVod", { keywords: seasonKeyword, order_val: "" });
    const merged = candidates.concat(safeArray(seasonData && seasonData.list).filter(item => !candidates.some(old => String(old.vod_id || "") === String(item.vod_id || ""))));
    best = pickBestVod(merged, enrichedParams);
  }
  if (!best || !best.vod_id) return [];
  if (params.type === "movie" && tmdbId) saveMediaBinding("movie", tmdbId, best);
  const wantEp = toInt(params.episode, 0);
  if (params.type !== "movie" && wantEp > 0) {
    const updated = toInt(best.vod_continu, 0);
    if (updated > 0 && wantEp > updated) {
      try { console.log("[forward_rank] episode " + wantEp + " not yet released for vod_id=" + best.vod_id + " (updated to " + updated + ")"); } catch (e) {}
      return [];
    }
  }
  const vurlData = await privatePost("/App/Resource/Vurl/show", { vod_d_id: best.vod_id, vurl_cloud_id: "2" });
  const pickedEp = pickEpisode(vurlData && vurlData.list, params);
  if (!pickedEp) return [];
  return await resolvePlayUrls(pickedEp, params);
}

__vod_group_sources.push({handlers:{"getNetflixNew":(typeof getNetflixNew==="function"?getNetflixNew:null),"getDisneyNew":(typeof getDisneyNew==="function"?getDisneyNew:null),"getAppleTvNew":(typeof getAppleTvNew==="function"?getAppleTvNew:null),"getHboNew":(typeof getHboNew==="function"?getHboNew:null),"getPrimeVideoNew":(typeof getPrimeVideoNew==="function"?getPrimeVideoNew:null),"getWeeklyDomesticDrama":(typeof getWeeklyDomesticDrama==="function"?getWeeklyDomesticDrama:null),"getWeeklyUSDrama":(typeof getWeeklyUSDrama==="function"?getWeeklyUSDrama:null),"getWeeklyAnime":(typeof getWeeklyAnime==="function"?getWeeklyAnime:null),"getWeeklyMovie":(typeof getWeeklyMovie==="function"?getWeeklyMovie:null),"getWeeklyKDrama":(typeof getWeeklyKDrama==="function"?getWeeklyKDrama:null),"getWeeklyUKDrama":(typeof getWeeklyUKDrama==="function"?getWeeklyUKDrama:null),"getWeeklyJDrama":(typeof getWeeklyJDrama==="function"?getWeeklyJDrama:null),"getWeeklyThaiDrama":(typeof getWeeklyThaiDrama==="function"?getWeeklyThaiDrama:null),"getWeeklyVariety":(typeof getWeeklyVariety==="function"?getWeeklyVariety:null),"getWeeklyDocumentary":(typeof getWeeklyDocumentary==="function"?getWeeklyDocumentary:null),"loadResource":(typeof loadResource==="function"?loadResource:null)}});})();
(function(){var WidgetMetadata;
WidgetMetadata = {
  id: "douban.list",
  title: "豆瓣片单",
  version: "2.0.0",
  requiredVersion: "0.0.1",
  description: "内置20个经典恐怖/惊悚片豆列 + 即将上映（从 GitHub 数据源读取，无需实时抓取豆瓣），或填入自定义豆瓣豆列链接",
  author: ".|EL",
  site: "https://douban.com",
  modules: [
    {
      id: "list",
      title: "豆瓣片单",
      functionName: "list",
      cacheDuration: 43200,
      params: [
        {
          name: "list",
          title: "选择片单",
          type: "enumeration",
          value: "1652843",
          enumOptions: [
            { title: "Time Out影史百大恐怖片", value: "1652843" },
            { title: "看电影40部最经典恐怖片", value: "36980" },
            { title: "恐惧感的丧失(309部)", value: "36280" },
            { title: "难忘的经典惊悚/恐怖片(547部)", value: "37140418" },
            { title: "7分以上的恐怖/惊悚电影(174部)", value: "526461" },
            { title: "高分精品恐怖片(280部)", value: "5916567" },
            { title: "2000后优秀恐怖电影(204部)", value: "3356598" },
            { title: "被忽略掉的不沉闷恐怖劲片！(77部)", value: "724565" },
            { title: "Indiewire: 50位导演心中的最佳恐怖片(48部)", value: "152540212" },
            { title: "稀有难找 underground horror films(466部)", value: "109801736" },
            { title: "血浆片已阅整理 Gory Horror Film(47部)", value: "159889980" },
            { title: "女性导演恐怖片(383部)", value: "124549602" },
            { title: "Body Horror｜身体恐怖电影(155部)", value: "162107956" },
            { title: "瘆临其境！恐怖伪纪录片(193部)", value: "161922461" },
            { title: "码住！盘点欧美高分恐怖电影(585部)", value: "163019144" },
            { title: "怪力乱神！欧美超自然恐怖电影(206部)", value: "163048555" },
            { title: "审美与创意兼顾的恐怖片(96部)", value: "159035683" },
            { title: "我看过的恐怖片们(254部)", value: "148836450" },
            { title: "我的恐怖片之旅(1534部)", value: "45782339" },
            { title: "码住！2026年恐怖电影大盘点(304部)", value: "163145526" },
            { title: "⏎ 自定义URL", value: "custom" },
          ],
        },
        {
          name: "url",
          title: "自定义URL",
          type: "input",
          description: "填入豆瓣豆列/列表链接",
          placeholders: [
            { title: "https://www.douban.com/doulist/xxx/", value: "" },
          ],
          belongTo: { paramName: "list", value: ["custom"] },
        },
        {
          name: "page",
          title: "页码",
          type: "page",
        }
      ],
    },
    {
      id: "comingSoon",
      title: "即将上映",
      functionName: "listComingSoon",
      cacheDuration: 43200,
      params: [
        {
          name: "page",
          title: "页码",
          type: "page",
        }
      ],
    }
  ],
};

// ─── GitHub 数据源（直连 raw） ───
var DATA_BASE = "https://raw.githubusercontent.com/cyanbees/douban-widget/main/data/";

// ─── 内置豆列名称 + 文件名映射 ───
var BUILTIN_LISTS = {
  "1652843":   { t: "Time Out影史百大恐怖片", f: "doulist_1652843.json" },
  "36980":     { t: "看电影40部最经典恐怖片", f: "doulist_36980.json" },
  "36280":     { t: "恐惧感的丧失(309部)", f: "doulist_36280.json" },
  "37140418":  { t: "难忘的经典惊悚/恐怖片(547部)", f: "doulist_37140418.json" },
  "526461":    { t: "7分以上的恐怖/惊悚电影(174部)", f: "doulist_526461.json" },
  "5916567":   { t: "高分精品恐怖片(280部)", f: "doulist_5916567.json" },
  "3356598":   { t: "2000后优秀恐怖电影(204部)", f: "doulist_3356598.json" },
  "724565":    { t: "被忽略掉的不沉闷恐怖劲片！(77部)", f: "doulist_724565.json" },
  "152540212": { t: "Indiewire: 50位导演心中的最佳恐怖片(48部)", f: "doulist_152540212.json" },
  "109801736": { t: "稀有难找 underground horror films(466部)", f: "doulist_109801736.json" },
  "159889980": { t: "血浆片已阅整理 Gory Horror Film(47部)", f: "doulist_159889980.json" },
  "124549602": { t: "女性导演恐怖片(383部)", f: "doulist_124549602.json" },
  "162107956": { t: "Body Horror｜身体恐怖电影(155部)", f: "doulist_162107956.json" },
  "161922461": { t: "瘆临其境！恐怖伪纪录片(193部)", f: "doulist_161922461.json" },
  "163019144": { t: "码住！盘点欧美高分恐怖电影(585部)", f: "doulist_163019144.json" },
  "163048555": { t: "怪力乱神！欧美超自然恐怖电影(206部)", f: "doulist_163048555.json" },
  "159035683": { t: "审美与创意兼顾的恐怖片(96部)", f: "doulist_159035683.json" },
  "148836450": { t: "我看过的恐怖片们(254部)", f: "doulist_148836450.json" },
  "45782339":  { t: "我的恐怖片之旅(1534部)", f: "doulist_45782339.json" },
  "163145526": { t: "码住！2026年恐怖电影大盘点(304部)", f: "doulist_163145526.json" },
  "comingSoon":{ t: "即将上映", f: "coming_soon.json" },
};

// ─── 辅助：直接请求 GitHub raw，超时 5秒 ───
async function fetchDataJSON(path) {
  var res = await Widget.http.get(DATA_BASE + path, {
    headers: { "User-Agent": "Mozilla/5.0" },
    timeout: 5000,
  });
  if (!res || !res.data) throw new Error("数据为空");
  return typeof res.data === "object" ? res.data : JSON.parse(res.data);
}

// ─── 实时抓取的片单（数据量大，不走 GitHub JSON） ───
var LIVE_IDS = { "163145526": 1, "124549602": 1, "109801736": 1 };

// ─── 主函数（同时服务"豆瓣片单"和"即将上映"两个模块） ───
async function list(params) {
  try {
    var selectedList = params.list || "1652843";

    if (selectedList === "custom" || LIVE_IDS[selectedList]) {
      return await fetchFromDouban(params);
    }

    var preset = BUILTIN_LISTS[selectedList];
    if (!preset) throw new Error("无效的片单选择");
    console.log("[豆瓣] 使用内置片单:", preset.t);

    var doulistData = await fetchDataJSON(preset.f);
    if (!doulistData || !doulistData.items) throw new Error("豆列数据格式错误");

    var page = Number(params.page || 1);
    var start = (page - 1) * 25;
    var pageItems = doulistData.items.slice(start, start + 25);

    console.log("[豆瓣] 片单:", preset.t, "第" + page + "页, 共" + pageItems.length + "条");

    return pageItems.map(function (item) {
      return {
        id: item.doubanId,
        type: "douban",
        mediaType: "movie",
        title: item.title || "",
        posterPath: item.posterPath || undefined,
        rating: item.rating || undefined,
      };
    });

  } catch (error) {
    console.error("[豆瓣] list 失败:", error.message || error);
    var msg = error.message || "";
    if (msg.indexOf("数据") >= 0 || msg.indexOf("豆列") >= 0) {
      console.warn("[豆瓣] 降级到实时抓取兜底...");
      return await fetchFromDouban(params);
    }
    throw error;
  }
}

// ─── 兜底函数：实时抓取豆瓣 ───
async function fetchFromDouban(params) {
  var selectedList = params.list || "1652843";
  var url = params.url ? params.url.trim() : "";

  if (selectedList !== "custom") {
    var presetName = BUILTIN_LISTS[selectedList];
    if (!presetName) throw new Error("无效的片单选择");
    url = "https://www.douban.com/doulist/" + selectedList + "/";
    console.log("[豆瓣] 降级抓取片单:", presetName.t);
  } else if (!url) {
    throw new Error("请提供豆瓣片单地址");
  }

  var page = Number(params.page || 1);
  var start = (page - 1) * 25;
  url = url.replace(/([?&])start=\d+/, '$1').replace(/[?&]$/, '');
  url += (url.indexOf('?') >= 0 ? '&' : '?') + 'start=' + start;

  console.log("[豆瓣] 实时抓取:", url);

  var response = await Widget.http.get(url, {
    headers: {
      "Referer": "https://movie.douban.com/",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    timeout: 8000,
  });

  if (!response || !response.data) {
    throw new Error("获取豆瓣片单数据失败");
  }

  var $ = Widget.html.load(response.data);
  if (!$ || $ === null) {
    throw new Error("解析 HTML 失败");
  }

  var doubanItems = [];
  var seen = new Set();

  // 策略1：标准 doulist-item
  $(".doulist-item").each(function (i, el) {
    var $item = $(el);
    var $link = $item.find(".title a");
    var href = $link.attr("href");
    if (!href) return;

    var match = href.match(/movie\.douban\.com\/subject\/(\d+)/);
    if (!match) return;

    var id = Number(match[1]);
    if (seen.has(id)) return;
    seen.add(id);

    var title = $link.text().trim();
    var posterPath = $item.find(".post img").attr("src");
    var ratingText = $item.find(".rating_nums").text().trim();

    doubanItems.push({
      id: id,
      type: "douban",
      mediaType: "movie",
      title: title || "",
      posterPath: posterPath || undefined,
      rating: ratingText ? Number(ratingText) : undefined,
    });
  });

  // 策略2：兜底
  if (doubanItems.length === 0) {
    $("a[href*='movie.douban.com/subject/']").each(function (i, el) {
      var href = $(el).attr("href");
      if (!href) return;
      var match = href.match(/movie\.douban\.com\/subject\/(\d+)/);
      if (!match) return;
      var id = Number(match[1]);
      if (seen.has(id)) return;
      seen.add(id);
      var title = $(el).text().trim();
      doubanItems.push({
        id: id,
        type: "douban",
        mediaType: "movie",
        title: title || "",
      });
    });
  }

  console.log("[豆瓣] 实时抓取完成，提取:", doubanItems.length, "条");
  return doubanItems;
}

// ─── 即将上映独立模块 ───
var COMING_SOON_URL = "https://raw.githubusercontent.com/cyanbees/douban-widget/main/data/coming_soon.json";

async function listComingSoon(params) {
  try {
    var res = await Widget.http.get(COMING_SOON_URL, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 10000,
    });
    if (!res || !res.data) return [];

    var data = typeof res.data === "object" ? res.data : JSON.parse(res.data);
    if (!data || !data.items) return [];

    var page = Number(params.page || 1);
    var start = (page - 1) * 25;
    var pageItems = data.items.slice(start, start + 25);

    console.log("[豆瓣] 即将上映: 第" + page + "页, 共" + pageItems.length + "条");

    return pageItems.map(function (item) {
      var displayTitle = item.title || "";
      if (item.releaseDate) {
        displayTitle = "[" + item.releaseDate.substring(5) + "] " + displayTitle;
      }
      // posterPath 传 TMDB raw path（以/开头），App 会自动拼接 image.tmdb.org
      var rawPoster = null;
      if (item.posterPath) {
        var m = item.posterPath.match(/\/[^/]+\.jpg$/);
        if (m) rawPoster = m[0];
      }
      return {
        id: item.tmdbId,
        type: "tmdb",
        mediaType: "movie",
        title: displayTitle,
        posterPath: rawPoster,
        releaseDate: item.releaseDate || undefined,
      };
    });

  } catch (error) {
    console.error("[豆瓣] 即将上映获取失败:", error.message || error);
    return [];
  }
}

__vod_group_sources.push({handlers:{"list":(typeof list==="function"?list:null),"listComingSoon":(typeof listComingSoon==="function"?listComingSoon:null)}});})();
(function(){var WidgetMetadata;
// @name 欧乐影视 + 搜索模块
// @description 欧乐影视（支持Cookie登录VIP）+ 独立搜索模块（直接搜索欧乐全部资源）
// @version 2.9.3

var DEFAULT_API_HOST = "https://api.olelive.com";
var REFERER = "https://www.olelive.com";
var REQUEST_TIMEOUT = 10000;
var MAX_RETRIES = 2;
var CACHE_TTL = 3600000;

var GLOBAL_COOKIE = "";

var REQUEST_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "zh-CN,zh;q=0.9",
  "Referer": REFERER,
  "Origin": REFERER,
  "Content-Type": "application/json"
};

// ==================== 缓存管理 ====================
var cacheStore = new Map();

function getCacheKey(seriesName, type, episode) {
  return seriesName + "_" + type + "_" + (episode || "all");
}

function getFromCache(key) {
  var entry = cacheStore.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    logInfo("缓存命中: " + key);
    return entry.data;
  }
  if (entry) cacheStore.delete(key);
  return null;
}

function setToCache(key, data) {
  cacheStore.set(key, { data: data, timestamp: Date.now() });
  if (cacheStore.size > 50) {
    var oldestKey = cacheStore.keys().next().value;
    cacheStore.delete(oldestKey);
  }
}

// ==================== MD5 实现 ====================
function md5(string) {
  function rotateLeft(lValue, iShiftBits) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }
  function addUnsigned(lX, lY) {
    var lX4, lY4, lX8, lY8, lResult;
    lX8 = (lX & 0x80000000);
    lY8 = (lY & 0x80000000);
    lX4 = (lX & 0x40000000);
    lY4 = (lY & 0x40000000);
    lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
    if (lX4 & lY4) return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
    if (lX4 | lY4) {
      if (lResult & 0x40000000) return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
      else return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
    } else return (lResult ^ lX8 ^ lY8);
  }
  function f(x, y, z) { return (x & y) | ((~x) & z); }
  function g(x, y, z) { return (x & z) | (y & (~z)); }
  function h(x, y, z) { return x ^ y ^ z; }
  function i(x, y, z) { return y ^ (x | (~z)); }
  function ff(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(f(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function gg(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(g(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function hh(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(h(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function ii(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(i(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function convertToWordArray(string) {
    var lWordCount;
    var lMessageLength = string.length;
    var lNumberOfWords_temp1 = lMessageLength + 8;
    var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
    var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
    var lWordArray = Array(lNumberOfWords - 1);
    var lBytePosition = 0;
    var lByteCount = 0;
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition));
      lByteCount++;
    }
    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  }
  function wordToHex(lValue) {
    var wordToHexValue = "", wordToHexValue_temp = "", lByte, lCount;
    for (lCount = 0; lCount <= 3; lCount++) {
      lByte = (lValue >>> (lCount * 8)) & 255;
      wordToHexValue_temp = "0" + lByte.toString(16);
      wordToHexValue = wordToHexValue + wordToHexValue_temp.substr(wordToHexValue_temp.length - 2, 2);
    }
    return wordToHexValue;
  }
  var x = convertToWordArray(string);
  var a = 0x67452301;
  var b = 0xEFCDAB89;
  var c = 0x98BADCFE;
  var d = 0x10325476;
  for (var k = 0; k < x.length; k += 16) {
    var AA = a, BB = b, CC = c, DD = d;
    a = ff(a, b, c, d, x[k+0], 7, 0xD76AA478);
    d = ff(d, a, b, c, x[k+1], 12, 0xE8C7B756);
    c = ff(c, d, a, b, x[k+2], 17, 0x242070DB);
    b = ff(b, c, d, a, x[k+3], 22, 0xC1BDCEEE);
    a = ff(a, b, c, d, x[k+4], 7, 0xF57C0FAF);
    d = ff(d, a, b, c, x[k+5], 12, 0x4787C62A);
    c = ff(c, d, a, b, x[k+6], 17, 0xA8304613);
    b = ff(b, c, d, a, x[k+7], 22, 0xFD469501);
    a = ff(a, b, c, d, x[k+8], 7, 0x698098D8);
    d = ff(d, a, b, c, x[k+9], 12, 0x8B44F7AF);
    c = ff(c, d, a, b, x[k+10], 17, 0xFFFF5BB1);
    b = ff(b, c, d, a, x[k+11], 22, 0x895CD7BE);
    a = ff(a, b, c, d, x[k+12], 7, 0x6B901122);
    d = ff(d, a, b, c, x[k+13], 12, 0xFD987193);
    c = ff(c, d, a, b, x[k+14], 17, 0xA679438E);
    b = ff(b, c, d, a, x[k+15], 22, 0x49B40821);
    a = gg(a, b, c, d, x[k+1], 5, 0xF61E2562);
    d = gg(d, a, b, c, x[k+6], 9, 0xC040B340);
    c = gg(c, d, a, b, x[k+11], 14, 0x265E5A51);
    b = gg(b, c, d, a, x[k+0], 20, 0xE9B6C7AA);
    a = gg(a, b, c, d, x[k+5], 5, 0xD62F105D);
    d = gg(d, a, b, c, x[k+10], 9, 0x02441453);
    c = gg(c, d, a, b, x[k+15], 14, 0xD8A1E681);
    b = gg(b, c, d, a, x[k+4], 20, 0xE7D3FBC8);
    a = gg(a, b, c, d, x[k+9], 5, 0x21E1CDE6);
    d = gg(d, a, b, c, x[k+14], 9, 0xC33707D6);
    c = gg(c, d, a, b, x[k+3], 14, 0xF4D50D87);
    b = gg(b, c, d, a, x[k+8], 20, 0x455A14ED);
    a = gg(a, b, c, d, x[k+13], 5, 0xA9E3E905);
    d = gg(d, a, b, c, x[k+2], 9, 0xFCEFA3F8);
    c = gg(c, d, a, b, x[k+7], 14, 0x676F02D9);
    b = gg(b, c, d, a, x[k+12], 20, 0x8D2A4C8A);
    a = hh(a, b, c, d, x[k+5], 4, 0xFFFA3942);
    d = hh(d, a, b, c, x[k+8], 11, 0x8771F681);
    c = hh(c, d, a, b, x[k+11], 16, 0x6D9D6122);
    b = hh(b, c, d, a, x[k+14], 23, 0xFDE5380C);
    a = hh(a, b, c, d, x[k+1], 4, 0xA4BEEA44);
    d = hh(d, a, b, c, x[k+4], 11, 0x4BDECFA9);
    c = hh(c, d, a, b, x[k+7], 16, 0xF6BB4B60);
    b = hh(b, c, d, a, x[k+10], 23, 0xBEBFBC70);
    a = hh(a, b, c, d, x[k+13], 4, 0x289B7EC6);
    d = hh(d, a, b, c, x[k+0], 11, 0xEAA127FA);
    c = hh(c, d, a, b, x[k+3], 16, 0xD4EF3085);
    b = hh(b, c, d, a, x[k+6], 23, 0x04881D05);
    a = hh(a, b, c, d, x[k+9], 4, 0xD9D4D039);
    d = hh(d, a, b, c, x[k+12], 11, 0xE6DB99E5);
    c = hh(c, d, a, b, x[k+15], 16, 0x1FA27CF8);
    b = hh(b, c, d, a, x[k+2], 23, 0xC4AC5665);
    a = ii(a, b, c, d, x[k+0], 6, 0xF4292244);
    d = ii(d, a, b, c, x[k+7], 10, 0x432AFF97);
    c = ii(c, d, a, b, x[k+14], 15, 0xAB9423A7);
    b = ii(b, c, d, a, x[k+5], 21, 0xFC93A039);
    a = ii(a, b, c, d, x[k+12], 6, 0x655B59C3);
    d = ii(d, a, b, c, x[k+3], 10, 0x8F0CCC92);
    c = ii(c, d, a, b, x[k+10], 15, 0xFFEFF47D);
    b = ii(b, c, d, a, x[k+1], 21, 0x85845DD1);
    a = ii(a, b, c, d, x[k+8], 6, 0x6FA87E4F);
    d = ii(d, a, b, c, x[k+15], 10, 0xFE2CE6E0);
    c = ii(c, d, a, b, x[k+6], 15, 0xA3014314);
    b = ii(b, c, d, a, x[k+13], 21, 0x4E0811A1);
    a = ii(a, b, c, d, x[k+4], 6, 0xF7537E82);
    d = ii(d, a, b, c, x[k+11], 10, 0xBD3AF235);
    c = ii(c, d, a, b, x[k+2], 15, 0x2AD7D2BB);
    b = ii(b, c, d, a, x[k+9], 21, 0xEB86D391);
    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }
  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}

function he(e) {
  var t = [];
  var r = e.split("");
  for (var i = 0; i < r.length; i++) {
    if (i != 0) t.push(" ");
    var code = r[i].charCodeAt().toString(2);
    t.push(code);
  }
  return t.join("");
}

function signature() {
  return t(Math.floor(Date.now() / 1000));
}

function t(e) {
  var str = e.toString();
  var r = [[], [], [], []];
  for (var i = 0; i < str.length; i++) {
    var e_val = he(str[i]);
    r[0] += e_val.slice(2, 3);
    r[1] += e_val.slice(3, 4);
    r[2] += e_val.slice(4, 5);
    r[3] += e_val.slice(5);
  }
  var a = [];
  for (var i = 0; i < r.length; i++) {
    var e_val = parseInt(r[i], 2).toString(16);
    if (e_val.length == 2) e_val = "0" + e_val;
    if (e_val.length == 1) e_val = "00" + e_val;
    if (e_val.length == 0) e_val = "000";
    a[i] = e_val;
  }
  var n = md5(str);
  return n.slice(0, 3) + a[0] + n.slice(6, 11) + a[1] + n.slice(14, 19) + a[2] + n.slice(22, 27) + a[3] + n.slice(30);
}

function logInfo(message, data) {
  if (data) console.log("[欧乐] " + message + ":", JSON.stringify(data));
  else console.log("[欧乐] " + message);
}

function logError(message, error) {
  if (error) console.error("[欧乐] " + message + ":", error.message || error);
  else console.error("[欧乐] " + message);
}

function normalizeTitle(title) {
  if (!title) return "";
  return title.toLowerCase().replace(/[^\u4e00-\u9fa5a-z0-9]/g, "");
}

function extractYear(title) {
  if (!title) return null;
  var match = title.match(/\b(19|20)\d{2}\b/);
  return match ? parseInt(match[0]) : null;
}

function extractBaseName(title) {
  if (!title) return "";
  var cleaned = title.replace(/[\(\[（【][^\)\]）】]*[\)\]）】]/g, "");
  var separators = /[:：\-—\s]+/;
  var parts = cleaned.split(separators);
  return parts[0] ? parts[0].trim() : cleaned.trim();
}

function extractEpisodeNumber(epName) {
  if (!epName) return null;
  var match = epName.match(/第\s*(\d+)\s*[集话期]/);
  if (match) return parseInt(match[1]);
  match = epName.match(/[Ee][Pp]?\s*(\d+)/);
  if (match) return parseInt(match[1]);
  match = epName.match(/\b(\d{1,3})\b/);
  if (match && !match[1].match(/^(1080|720|480|2160|4k)$/i)) return parseInt(match[1]);
  return null;
}

function extractLanguage(remarks, title) {
  var combined = (remarks + " " + title).toLowerCase();
  if (combined.indexOf("国语") !== -1 || combined.indexOf("普通话") !== -1) return "国语";
  if (combined.indexOf("粤语") !== -1) return "粤语";
  if (combined.indexOf("英语") !== -1) return "英语";
  if (combined.indexOf("日语") !== -1) return "日语";
  if (combined.indexOf("韩语") !== -1) return "韩语";
  return "";
}

function httpGet(url, retryCount, customHeaders) {
  if (retryCount === undefined) retryCount = 0;
  var headers = Object.assign({}, REQUEST_HEADERS);
  if (GLOBAL_COOKIE) headers["Cookie"] = GLOBAL_COOKIE;
  if (customHeaders) Object.assign(headers, customHeaders);
  return new Promise(function(resolve, reject) {
    Widget.http.get(url, { headers: headers, timeout: REQUEST_TIMEOUT })
      .then(function(response) {
        var data = response.data;
        if (typeof data === "string") {
          try { data = JSON.parse(data); } catch(e) { logError("JSON解析失败: " + url, e); resolve(null); return; }
        }
        resolve(data);
      })
      .catch(function(error) {
        if (retryCount < MAX_RETRIES) {
          logInfo("请求失败，重试第 " + (retryCount + 1) + " 次: " + url);
          setTimeout(function() { httpGet(url, retryCount + 1).then(resolve).catch(reject); }, 1000);
        } else { logError("请求失败: " + url, error); resolve(null); }
      });
  });
}

function buildApiUrl(apiHost, path, params) {
  var url = apiHost + path;
  var queryParams = {};
  for (var key in params) if (params.hasOwnProperty(key)) queryParams[key] = params[key];
  queryParams._vv = signature();
  var queryString = "";
  for (var key in queryParams) {
    if (queryParams[key] !== undefined && queryParams[key] !== "") {
      if (queryString !== "") queryString += "&";
      queryString += encodeURIComponent(key) + "=" + encodeURIComponent(queryParams[key]);
    }
  }
  if (queryString !== "") url += (url.indexOf("?") === -1 ? "?" : "&") + queryString;
  return url;
}

function searchVodOle(apiHost, keyword, pg) {
  pg = pg || 1;
  var url = buildApiUrl(apiHost, "/v1/pub/index/search/" + encodeURIComponent(keyword) + "/vod/0/" + pg + "/48", {});
  logInfo("搜索URL: " + url);
  return httpGet(url).then(function(res) {
    if (!res) { logInfo("搜索请求无响应"); return []; }
    if (res.code !== 0) { logInfo("搜索API返回异常码 " + res.code); return []; }
    if (!res.data || !res.data.data) { logInfo("搜索返回缺少 data.data 字段"); return []; }
    var vodData = null;
    for (var i = 0; i < res.data.data.length; i++) {
      if (res.data.data[i].type === "vod") { vodData = res.data.data[i]; break; }
    }
    if (!vodData || !vodData.list) { logInfo("未找到 vod 类型数据或 list 为空"); return []; }
    var results = [];
    for (var i = 0; i < vodData.list.length; i++) {
      var item = vodData.list[i];
      if (!GLOBAL_COOKIE && item.vip === true) continue;
      results.push({
        vod_id: String(item.id), vod_name: item.name, vod_pic: "https://static.olelive.com/" + item.pic,
        vod_remarks: item.remark || "", year: item.year || "", lang: item.lang || "",
        vod_type: item.type || "", vip: item.vip || false
      });
    }
    logInfo("搜索结果数量: " + results.length + (GLOBAL_COOKIE ? " (含VIP)" : " (仅免费)"));
    if (results.length) logInfo("首个结果: " + JSON.stringify(results[0]));
    return results;
  }).catch(function(e) { logError("搜索异常", e); return []; });
}

function getDetailOle(apiHost, vodId) {
  var url = buildApiUrl(apiHost, "/v1/pub/vod/detail/" + vodId + "/true", {});
  logInfo("详情URL: " + url);
  return httpGet(url).then(function(res) {
    if (!res || res.code !== 0) { logInfo("详情API返回异常: " + JSON.stringify(res)); return null; }
    return res.data;
  }).catch(function(e) { logError("获取详情异常", e); return null; });
}

// ==================== 智能匹配（测试模块） ====================
function loadResource(params) {
  if (params && params.Cookie) GLOBAL_COOKIE = params.Cookie;
  else GLOBAL_COOKIE = "";
  var apiHost = (params && params.ApiHost) ? params.ApiHost : DEFAULT_API_HOST;
  apiHost = apiHost.replace(/\/$/, "");
  var seriesName = (params && (params.seriesName || params.title || params.name || params.keyword)) || "";
  if (!seriesName && params && params.TestTitle) seriesName = params.TestTitle;
  var type = (params && params.type === "movie") ? "movie" : "tv";
  var episode = (params && params.episode) ? parseInt(params.episode) : null;
  logInfo("触发 - API: " + apiHost + ", 搜索: " + seriesName + ", 类型: " + type + ", 集: " + episode);
  if (!seriesName) return Promise.resolve([]);
  var cacheKey = getCacheKey(seriesName, type, episode);
  var cached = getFromCache(cacheKey);
  if (cached) return Promise.resolve(cached);
  var searchKeyword = extractBaseName(seriesName);
  logInfo("搜索关键词: " + searchKeyword);
  return searchVodOle(apiHost, searchKeyword).then(function(searchResults) {
    if (!searchResults.length) { logInfo("未找到任何视频: " + searchKeyword); return []; }
    var rawUserTitle = seriesName;
    var userNorm = normalizeTitle(rawUserTitle);
    var userYear = extractYear(rawUserTitle);
    var isMovieRequest = (type === "movie");
    var candidates = [];
    for (var i = 0; i < searchResults.length; i++) {
      var item = searchResults[i];
      var itemNorm = normalizeTitle(item.vod_name);
      var score = 0;
      if (itemNorm === userNorm) score = 100;
      else {
        var itemNormNoYear = itemNorm.replace(/\d+/g, "");
        var userNormNoYear = userNorm.replace(/\d+/g, "");
        if (itemNormNoYear === userNormNoYear && userNormNoYear.length > 0) score = 95;
        else if (itemNorm.includes(userNorm) || userNorm.includes(itemNorm)) score = 80;
      }
      if (score > 0) candidates.push({ item: item, score: score });
    }
    if (candidates.length === 0) { logInfo("未找到任何匹配的影片"); return []; }
    candidates.sort(function(a, b) { return b.score - a.score; });
    var bestCandidate = candidates[0].item;
    var bestScore = candidates[0].score;
    var finalMatch = null;
    var bestItemYear = bestCandidate.year ? parseInt(bestCandidate.year) : null;
    var bestYearOk = (userYear === null) || (bestItemYear === userYear);
    var bestTypeOk = (!isMovieRequest) || (bestCandidate.vod_type === "movie");
    if (bestYearOk && bestTypeOk) finalMatch = bestCandidate;
    else {
      for (var i = 0; i < candidates.length; i++) {
        var cand = candidates[i].item;
        var candYear = cand.year ? parseInt(cand.year) : null;
        var yearOk = (userYear === null) || (candYear === userYear);
        var typeOk = (!isMovieRequest) || (cand.vod_type === "movie");
        if (yearOk && typeOk) { finalMatch = cand; break; }
      }
      if (!finalMatch) finalMatch = bestCandidate;
    }
    logInfo("最终匹配: " + finalMatch.vod_name + " (ID: " + finalMatch.vod_id + ", 得分: " + bestScore + ")");
    return getDetailOle(apiHost, finalMatch.vod_id).then(function(detail) {
      if (!detail || !detail.urls || !detail.urls.length) { logInfo("获取详情失败或无播放源"); return []; }
      var realTitle = detail.title || detail.name || finalMatch.vod_name;
      var matchedResources = [];
      for (var i = 0; i < detail.urls.length; i++) {
        var item = detail.urls[i];
        if (!GLOBAL_COOKIE && item.vip === true) continue;
        var epName = item.title || "";
        var epNum = extractEpisodeNumber(epName);
        var language = extractLanguage(finalMatch.vod_remarks, epName);
        var videoUrl = item.url || item.play_url || item.link || "";
        if (!videoUrl) continue;
        if (type === "movie") {
          if (matchedResources.length === 0) matchedResources.push({ url: videoUrl, title: item.title, epNum: epNum, language: language });
        } else {
          if (episode !== null) { if (epNum === episode) matchedResources.push({ url: videoUrl, title: item.title, epNum: epNum, language: language }); }
          else matchedResources.push({ url: videoUrl, title: item.title, epNum: epNum, language: language });
        }
      }
      if (matchedResources.length === 0) { logInfo("未找到匹配的集数"); return []; }
      var urlSet = new Set();
      var uniqueResources = [];
      for (var i = 0; i < matchedResources.length; i++) {
        var item = matchedResources[i];
        var videoUrl = item.url;
        if (!videoUrl || urlSet.has(videoUrl)) continue;
        urlSet.add(videoUrl);
        var description = realTitle;
        var epName = item.title || "";
        if (type === "tv" && epName && epName.indexOf("正片") === -1) description = realTitle + " " + epName;
        if (item.language) description += " [" + item.language + "]";
        uniqueResources.push({ id: finalMatch.vod_id + "_" + Date.now() + "_" + uniqueResources.length, name: "欧乐影视", type: type, description: description, url: videoUrl });
      }
      setToCache(cacheKey, uniqueResources);
      return uniqueResources;
    });
  });
}

// ==================== 独立搜索模块（返回列表） ====================
async function searchOle(params = {}) {
  var cookie = params.Cookie || "";
  var apiHost = params.ApiHost || DEFAULT_API_HOST;
  if (cookie) GLOBAL_COOKIE = cookie;
  apiHost = apiHost.replace(/\/$/, "");
  var keyword = params.wd || params.keyword || "";
  if (!keyword.trim()) throw new Error("请输入搜索关键词");
  var page = params.pg || 1;
  var results = await searchVodOle(apiHost, keyword, page);
  if (!results.length) return [{ id: "empty", type: "text", title: "未找到相关影片，请尝试其他关键词" }];
  return results.map(item => ({
    id: "ole_detail_" + item.vod_id, type: "url", title: item.vod_name,
    posterPath: item.vod_pic, releaseDate: item.year,
    description: (item.year ? item.year + " · " : "") + (item.vod_type === "movie" ? "电影" : "剧集") + (item.vip ? " [VIP]" : ""),
    link: "ole://detail?id=" + item.vod_id + "&api=" + encodeURIComponent(apiHost)
  }));
}

// ==================== 分类浏览函数 ====================
var CATEGORY_ID = { movie: 1, tv: 2, variety: 3, anime: 4, short: 14 };
var CATEGORY_NAME = { 1: "电影", 2: "剧集", 3: "综艺", 4: "动漫", 14: "短剧" };
var SORT_MAP = { hot: "hot", score: "score", update: "update", desc: "desc" };

function fetchCategoryList(apiHost, cateId, area, sortBy, page) {
  var urlPath = "/v1/pub/vod/list/true/3/0/" + area + "/" + cateId + "/0/0/" + sortBy + "/" + page + "/48";
  var url = buildApiUrl(apiHost, urlPath, {});
  logInfo("请求分类列表: " + url);
  return httpGet(url).then(function(res) {
    if (!res || res.code !== 0) return [];
    var list = (res.data && res.data.list) ? res.data.list : [];
    var categoryName = CATEGORY_NAME[cateId] || "影视";
    var items = [];
    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      var year = item.year || "";
      var displayYear = (year !== "") ? year : "未知年份";
      items.push({
        id: "ole_" + item.id, type: "url", title: item.name,
        posterPath: "https://static.olelive.com/" + item.pic,
        backdropPath: "https://static.olelive.com/" + item.pic,
        releaseDate: year, description: displayYear + " · " + categoryName,
        genreTitle: categoryName, vod_id: item.id, api_host: apiHost,
        link: "ole://detail?id=" + item.id + "&api=" + encodeURIComponent(apiHost)
      });
    }
    return items;
  }).catch(function(e) { logError("获取分类列表失败", e); return []; });
}

function loadMovieList(params) { var apiHost = (params && params.ApiHost) ? params.ApiHost : DEFAULT_API_HOST; apiHost = apiHost.replace(/\/$/, ""); var area = (params && params.area) ? params.area : "0"; var sortBy = (params && params.sort_by) ? params.sort_by : "hot"; var page = (params && params.page) ? parseInt(params.page) : 1; var sortValue = SORT_MAP[sortBy] || "hot"; return fetchCategoryList(apiHost, CATEGORY_ID.movie, area, sortValue, page).then(function(items) { if (items.length === 0 && page === 1) return [{ id: "empty", type: "text", title: "暂无数据，请检查网络或API地址" }]; return items; }); }
function loadTvList(params) { var apiHost = (params && params.ApiHost) ? params.ApiHost : DEFAULT_API_HOST; apiHost = apiHost.replace(/\/$/, ""); var area = (params && params.area) ? params.area : "0"; var sortBy = (params && params.sort_by) ? params.sort_by : "hot"; var page = (params && params.page) ? parseInt(params.page) : 1; var sortValue = SORT_MAP[sortBy] || "hot"; return fetchCategoryList(apiHost, CATEGORY_ID.tv, area, sortValue, page).then(function(items) { if (items.length === 0 && page === 1) return [{ id: "empty", type: "text", title: "暂无数据，请检查网络或API地址" }]; return items; }); }
function loadVarietyList(params) { var apiHost = (params && params.ApiHost) ? params.ApiHost : DEFAULT_API_HOST; apiHost = apiHost.replace(/\/$/, ""); var area = (params && params.area) ? params.area : "0"; var sortBy = (params && params.sort_by) ? params.sort_by : "hot"; var page = (params && params.page) ? parseInt(params.page) : 1; var sortValue = SORT_MAP[sortBy] || "hot"; return fetchCategoryList(apiHost, CATEGORY_ID.variety, area, sortValue, page).then(function(items) { if (items.length === 0 && page === 1) return [{ id: "empty", type: "text", title: "暂无数据，请检查网络或API地址" }]; return items; }); }
function loadAnimeList(params) { var apiHost = (params && params.ApiHost) ? params.ApiHost : DEFAULT_API_HOST; apiHost = apiHost.replace(/\/$/, ""); var area = (params && params.area) ? params.area : "0"; var sortBy = (params && params.sort_by) ? params.sort_by : "hot"; var page = (params && params.page) ? parseInt(params.page) : 1; var sortValue = SORT_MAP[sortBy] || "hot"; return fetchCategoryList(apiHost, CATEGORY_ID.anime, area, sortValue, page).then(function(items) { if (items.length === 0 && page === 1) return [{ id: "empty", type: "text", title: "暂无数据，请检查网络或API地址" }]; return items; }); }
function loadShortList(params) { var apiHost = (params && params.ApiHost) ? params.ApiHost : DEFAULT_API_HOST; apiHost = apiHost.replace(/\/$/, ""); var area = (params && params.area) ? params.area : "0"; var sortBy = (params && params.sort_by) ? params.sort_by : "hot"; var page = (params && params.page) ? parseInt(params.page) : 1; var sortValue = SORT_MAP[sortBy] || "hot"; return fetchCategoryList(apiHost, CATEGORY_ID.short, area, sortValue, page).then(function(items) { if (items.length === 0 && page === 1) return [{ id: "empty", type: "text", title: "暂无数据，请检查网络或API地址" }]; return items; }); }

// ==================== 统一的详情加载入口（修复集数显示） ====================
async function loadDetail(params) {
  logInfo("loadDetail 被调用，参数: " + JSON.stringify(params));
  var detailId = "", apiHost = DEFAULT_API_HOST;
  if (typeof params === "object") { detailId = params.id || params.link || ""; apiHost = params.api_host || params.ApiHost || DEFAULT_API_HOST; }
  else if (typeof params === "string") detailId = params;
  if (!detailId) throw new Error("无效的详情请求");
  if (detailId.includes("ole://detail")) {
    var match = detailId.match(/[?&]id=(\d+)/);
    if (!match) throw new Error("无法解析视频ID");
    var vodId = match[1];
    apiHost = apiHost.replace(/\/$/, "");
    return getDetailOle(apiHost, vodId).then(function(detail) {
      if (!detail || !detail.urls || !detail.urls.length) throw new Error("获取详情失败或无播放源");
      var title = detail.title || detail.name || "未知标题";
      var episodeItems = [];
      // 判断是否为电影
      var isMovie = false;
      if (detail.urls.length === 1) {
        var onlyTitle = detail.urls[0].title || "";
        if (!onlyTitle.match(/第\d+集/) && onlyTitle.indexOf("集") === -1) isMovie = true;
      }
      for (var i = 0; i < detail.urls.length; i++) {
        var item = detail.urls[i];
        if (!GLOBAL_COOKIE && item.vip === true) continue;
        var rawTitle = item.title || "";
        var videoUrl = item.url || item.play_url || item.link || "";
        if (!videoUrl) continue;
        var epDisplayTitle = "";
        if (isMovie) {
          epDisplayTitle = title;
        } else {
          // 直接使用 API 返回的原始标题，不再重复拼接片名
          if (rawTitle && (rawTitle.includes(title) || rawTitle.match(/第\d+集/))) {
            epDisplayTitle = rawTitle;
          } else {
            var epNum = extractEpisodeNumber(rawTitle);
            if (epNum !== null) epDisplayTitle = title + " 第" + epNum + "集";
            else epDisplayTitle = title + " " + (rawTitle || "播放");
          }
        }
        episodeItems.push({
          id: vodId + "_" + i, type: "url", title: epDisplayTitle,
          videoUrl: videoUrl, mediaType: "episode"
        });
      }
      if (episodeItems.length === 0) throw new Error("未找到可播放的链接");
      var mediaType = "tv", videoUrl = null;
      if (isMovie) { mediaType = "movie"; videoUrl = episodeItems[0].videoUrl; episodeItems = []; }
      return {
        id: "ole_" + vodId, type: "url", title: title, description: detail.intro || "",
        posterPath: detail.pic || "", backdropPath: detail.pic || "",
        mediaType: mediaType, episode: episodeItems.length, episodeItems: episodeItems, videoUrl: videoUrl
      };
    });
  } else {
    return { id: detailId, type: "url", title: "播放", videoUrl: detailId, mediaType: "movie" };
  }
}

// ==================== Widget 元数据 ====================
WidgetMetadata = {
  id: "OleLive.Search",
  title: "欧乐影视",
  icon: "",
  version: "2.9.3",
  requiredVersion: "0.0.1",
  description: "欧乐影视（支持Cookie登录VIP）+ 独立搜索模块（直接搜索欧乐全部资源）+ 分类浏览",
  author: "MoYan",
  globalParams: [
    { name: "ApiHost", title: "欧乐API地址 (可填镜像站)", type: "input", value: "https://api.olelive.com" },
    { name: "Cookie", title: "欧乐Cookie (从浏览器登录后复制，留空则只看免费资源)", type: "input", value: "" },
    { name: "TestTitle", title: "测试片名 (手动输入)", type: "input", value: "" }
  ],
  search: { title: "搜索", functionName: "searchOle", params: [ { name: "wd", title: "关键词", type: "input", value: "" }, { name: "pg", title: "页码", type: "page", value: "1" } ] },
  modules: [
    { id: "ole_movie", title: "电影", functionName: "loadMovieList", type: "video", cacheDuration: 43200, params: [ { name: "area", title: "地区", type: "enumeration", value: "0", enumOptions: [ { title: "全部", value: "0" }, { title: "大陆", value: "大陆" }, { title: "香港", value: "香港" }, { title: "台湾", value: "台湾" }, { title: "美国", value: "美国" }, { title: "日本", value: "日本" }, { title: "韩国", value: "韩国" }, { title: "英国", value: "英国" }, { title: "法国", value: "法国" }, { title: "德国", value: "德国" }, { title: "西班牙", value: "西班牙" }, { title: "泰国", value: "泰国" }, { title: "印度", value: "印度" } ] }, { name: "sort_by", title: "榜单类型", type: "enumeration", value: "hot", enumOptions: [ { title: "热门电影", value: "hot" }, { title: "高分电影", value: "score" }, { title: "最新电影", value: "update" }, { title: "最近添加", value: "desc" } ] }, { name: "page", title: "页码", type: "page", startPage: 1 } ] },
    { id: "ole_tv", title: "剧集", functionName: "loadTvList", type: "video", cacheDuration: 43200, params: [ { name: "area", title: "地区", type: "enumeration", value: "0", enumOptions: [ { title: "全部", value: "0" }, { title: "大陆", value: "大陆" }, { title: "香港", value: "香港" }, { title: "台湾", value: "台湾" }, { title: "美国", value: "美国" }, { title: "日本", value: "日本" }, { title: "韩国", value: "韩国" }, { title: "英国", value: "英国" }, { title: "法国", value: "法国" }, { title: "德国", value: "德国" }, { title: "西班牙", value: "西班牙" }, { title: "泰国", value: "泰国" }, { title: "印度", value: "印度" } ] }, { name: "sort_by", title: "榜单类型", type: "enumeration", value: "hot", enumOptions: [ { title: "热门剧集", value: "hot" }, { title: "高分剧集", value: "score" }, { title: "最新剧集", value: "update" }, { title: "最近添加", value: "desc" } ] }, { name: "page", title: "页码", type: "page", startPage: 1 } ] },
    { id: "ole_variety", title: "综艺", functionName: "loadVarietyList", type: "video", cacheDuration: 43200, params: [ { name: "area", title: "地区", type: "enumeration", value: "0", enumOptions: [ { title: "全部", value: "0" }, { title: "大陆", value: "大陆" }, { title: "香港", value: "香港" }, { title: "台湾", value: "台湾" }, { title: "美国", value: "美国" }, { title: "日本", value: "日本" }, { title: "韩国", value: "韩国" }, { title: "英国", value: "英国" }, { title: "法国", value: "法国" }, { title: "德国", value: "德国" }, { title: "西班牙", value: "西班牙" }, { title: "泰国", value: "泰国" }, { title: "印度", value: "印度" } ] }, { name: "sort_by", title: "榜单类型", type: "enumeration", value: "hot", enumOptions: [ { title: "热门综艺", value: "hot" }, { title: "高分综艺", value: "score" }, { title: "最新综艺", value: "update" }, { title: "最近添加", value: "desc" } ] }, { name: "page", title: "页码", type: "page", startPage: 1 } ] },
    { id: "ole_anime", title: "动漫", functionName: "loadAnimeList", type: "video", cacheDuration: 43200, params: [ { name: "area", title: "地区", type: "enumeration", value: "0", enumOptions: [ { title: "全部", value: "0" }, { title: "大陆", value: "大陆" }, { title: "香港", value: "香港" }, { title: "台湾", value: "台湾" }, { title: "美国", value: "美国" }, { title: "日本", value: "日本" }, { title: "韩国", value: "韩国" }, { title: "英国", value: "英国" }, { title: "法国", value: "法国" }, { title: "德国", value: "德国" }, { title: "西班牙", value: "西班牙" }, { title: "泰国", value: "泰国" }, { title: "印度", value: "印度" } ] }, { name: "sort_by", title: "榜单类型", type: "enumeration", value: "hot", enumOptions: [ { title: "热门动漫", value: "hot" }, { title: "高分动漫", value: "score" }, { title: "最新动漫", value: "update" }, { title: "最近添加", value: "desc" } ] }, { name: "page", title: "页码", type: "page", startPage: 1 } ] },
    { id: "ole_short", title: "短剧", functionName: "loadShortList", type: "video", cacheDuration: 43200, params: [ { name: "area", title: "地区", type: "enumeration", value: "0", enumOptions: [ { title: "全部", value: "0" }, { title: "大陆", value: "大陆" }, { title: "香港", value: "香港" }, { title: "台湾", value: "台湾" }, { title: "美国", value: "美国" }, { title: "日本", value: "日本" }, { title: "韩国", value: "韩国" }, { title: "英国", value: "英国" }, { title: "法国", value: "法国" }, { title: "德国", value: "德国" }, { title: "西班牙", value: "西班牙" }, { title: "泰国", value: "泰国" }, { title: "印度", value: "印度" } ] }, { name: "sort_by", title: "榜单类型", type: "enumeration", value: "hot", enumOptions: [ { title: "热门短剧", value: "hot" }, { title: "高分短剧", value: "score" }, { title: "最新短剧", value: "update" }, { title: "最近添加", value: "desc" } ] }, { name: "page", title: "页码", type: "page", startPage: 1 } ] },
    { id: "searchOle", title: "搜索", functionName: "searchOle", type: "video", cacheDuration: 43200, params: [ { name: "wd", title: "关键词", type: "input", value: "" }, { name: "pg", title: "页码", type: "page", value: "1" } ] },
    { id: "loadResource", title: "测试", functionName: "loadResource", type: "stream", params: [] }
  ]
};
__vod_group_sources.push({handlers:{"searchOle":(typeof searchOle==="function"?searchOle:null),"loadMovieList":(typeof loadMovieList==="function"?loadMovieList:null),"loadTvList":(typeof loadTvList==="function"?loadTvList:null),"loadVarietyList":(typeof loadVarietyList==="function"?loadVarietyList:null),"loadAnimeList":(typeof loadAnimeList==="function"?loadAnimeList:null),"loadShortList":(typeof loadShortList==="function"?loadShortList:null),"loadResource":(typeof loadResource==="function"?loadResource:null),loadDetail:(typeof loadDetail==="function"?loadDetail:null)}});})();
async function __vod_group_榜单(params = {}) { if(String(params["榜单_section"]||"0")==="0") { const f=__vod_group_sources[0].handlers["getNetflixNew"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="1") { const f=__vod_group_sources[0].handlers["getDisneyNew"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="2") { const f=__vod_group_sources[0].handlers["getAppleTvNew"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="3") { const f=__vod_group_sources[0].handlers["getHboNew"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="4") { const f=__vod_group_sources[0].handlers["getPrimeVideoNew"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="5") { const f=__vod_group_sources[0].handlers["getWeeklyDomesticDrama"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="6") { const f=__vod_group_sources[0].handlers["getWeeklyUSDrama"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="7") { const f=__vod_group_sources[0].handlers["getWeeklyAnime"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="8") { const f=__vod_group_sources[0].handlers["getWeeklyMovie"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="9") { const f=__vod_group_sources[0].handlers["getWeeklyKDrama"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="10") { const f=__vod_group_sources[0].handlers["getWeeklyUKDrama"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="11") { const f=__vod_group_sources[0].handlers["getWeeklyJDrama"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="12") { const f=__vod_group_sources[0].handlers["getWeeklyThaiDrama"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="13") { const f=__vod_group_sources[0].handlers["getWeeklyVariety"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="14") { const f=__vod_group_sources[0].handlers["getWeeklyDocumentary"]; return f ? await f({}) : []; } return []; }
async function __vod_group_豆瓣(params = {}) { if(String(params["豆瓣_section"]||"0")==="0") { const f=__vod_group_sources[1].handlers["list"]; return f ? await f({"list": params["豆瓣_m0_list"],"url": params["豆瓣_m0_url"],"page": params["豆瓣_m0_page"]}) : []; } if(String(params["豆瓣_section"]||"0")==="1") { const f=__vod_group_sources[1].handlers["listComingSoon"]; return f ? await f({"page": params["豆瓣_m1_page"]}) : []; } return []; }
async function __vod_group_欧乐(params = {}) { if(String(params["欧乐_section"]||"0")==="0") { const f=__vod_group_sources[2].handlers["loadMovieList"]; return f ? await f({"area": params["欧乐_m0_area"],"sort_by": params["欧乐_m0_sort_by"],"page": params["欧乐_m0_page"]}) : []; } if(String(params["欧乐_section"]||"0")==="1") { const f=__vod_group_sources[2].handlers["loadTvList"]; return f ? await f({"area": params["欧乐_m1_area"],"sort_by": params["欧乐_m1_sort_by"],"page": params["欧乐_m1_page"]}) : []; } if(String(params["欧乐_section"]||"0")==="2") { const f=__vod_group_sources[2].handlers["loadVarietyList"]; return f ? await f({"area": params["欧乐_m2_area"],"sort_by": params["欧乐_m2_sort_by"],"page": params["欧乐_m2_page"]}) : []; } if(String(params["欧乐_section"]||"0")==="3") { const f=__vod_group_sources[2].handlers["loadAnimeList"]; return f ? await f({"area": params["欧乐_m3_area"],"sort_by": params["欧乐_m3_sort_by"],"page": params["欧乐_m3_page"]}) : []; } if(String(params["欧乐_section"]||"0")==="4") { const f=__vod_group_sources[2].handlers["loadShortList"]; return f ? await f({"area": params["欧乐_m4_area"],"sort_by": params["欧乐_m4_sort_by"],"page": params["欧乐_m4_page"]}) : []; } if(String(params["欧乐_section"]||"0")==="5") { const f=__vod_group_sources[2].handlers["searchOle"]; return f ? await f({"wd": params["欧乐_m5_wd"],"pg": params["欧乐_m5_pg"]}) : []; } if(String(params["欧乐_section"]||"0")==="6") { const f=__vod_group_sources[2].handlers["searchOle"]; return f ? await f({"wd": params["欧乐_m6_wd"],"pg": params["欧乐_m6_pg"]}) : []; } return []; }
async function __vod_group_骨朵(params = {}) {
    return await loadGuduoRank({ guduo_category: params["骨朵_category"] || "剧集" });
}
async function loadDetail(link){for(const s of __vod_group_sources){if(typeof s.handlers.loadDetail==="function"){try{const r=await s.handlers.loadDetail(link);if(r)return r}catch(_){}}}return null;}

 return {
"__vod_group_榜单": (typeof __vod_group_榜单 === "function" ? __vod_group_榜单 : null),
"__vod_group_豆瓣": (typeof __vod_group_豆瓣 === "function" ? __vod_group_豆瓣 : null),
"__vod_group_欧乐": (typeof __vod_group_欧乐 === "function" ? __vod_group_欧乐 : null),
"__vod_group_骨朵": (typeof __vod_group_骨朵 === "function" ? __vod_group_骨朵 : null),
"loadResource": async function(params = {}) {
  const resources = [];
  const guazi = __vod_group_sources[0] && __vod_group_sources[0].handlers.loadResource;
  const ole = __vod_group_sources[2] && __vod_group_sources[2].handlers.loadResource;
  if (guazi) {
    try { resources.push(...(await guazi(params) || [])); } catch (_) {}
  }
  if (ole) {
    try { resources.push(...(await ole(params) || [])); } catch (_) {}
  }
  const seen = new Set();
  return resources.filter(item => {
    const url = item && (item.url || item.videoUrl);
    if (!url || seen.has(url)) return false;
    seen.add(url);
    return true;
  });
},
"loadDetail": (typeof loadDetail === "function" ? loadDetail : null)
 };
})();
async function loadResource(params = {}) {
 const fn = VOD_MERGED.loadResource;
 return fn ? await fn(params) : [];
}
async function loadDetail(link) {
 const fn = VOD_MERGED.loadDetail;
 return fn ? await fn(link) : null;
}
async function vodMerged_0(params = {}) { const f=VOD_MERGED["__vod_group_榜单"]; return f ? await f(params) : []; }
async function vodMerged_1(params = {}) { const f=VOD_MERGED["__vod_group_豆瓣"]; return f ? await f(params) : []; }
async function vodMerged_2(params = {}) { const f=VOD_MERGED["__vod_group_欧乐"]; return f ? await f(params) : []; }
async function vodMerged_3(params = {}) { const f=VOD_MERGED["__vod_group_骨朵"]; return f ? await f(params) : []; }

async function loadVodHubMerged(params = {}) {
 const src=params.vod_list||"榜单";
 const map={"榜单":"__vod_group_榜单","豆瓣":"__vod_group_豆瓣","欧乐":"__vod_group_欧乐","骨朵":"__vod_group_骨朵"};
 const section={"榜单":"榜单_section","豆瓣":"豆瓣_section","欧乐":"欧乐_section","骨朵":"骨朵_category"};
 const fn=VOD_MERGED[map[src]]; if(!fn)return []; const p={...params}; p[section[src]]=params[section[src]]||"0"; return await fn(p);
}

// ===== 极速弹幕实现 =====
// ==========================================
// 1. 繁简转换核心
// ==========================================
const DANMU_DICT_URL_S2T = "https://cdn.jsdelivr.net/npm/opencc-data@1.0.3/data/STCharacters.txt";
const DANMU_DICT_URL_T2S = "https://cdn.jsdelivr.net/npm/opencc-data@1.0.3/data/TSCharacters.txt";
let DANMU_MEM_DICT = null;

async function danmuInitDict(mode) {
  if (!mode || mode === "none") return;
  if (DANMU_MEM_DICT) return; 
  const key = `dict_${mode}`;
  let local = await Widget.storage.get(key);
  if (!local) {
      try {
          const res = await Widget.http.get(mode === "s2t" ? DANMU_DICT_URL_S2T : DANMU_DICT_URL_T2S);
          let text = res.data || res;
          if (typeof text === 'string' && text.length > 100) {
              const map = {};
              text.split('\n').forEach(l => {
                  const p = l.split(/\s+/);
                  if (p.length >= 2) map[p[0]] = p[1];
              });
              await Widget.storage.set(key, JSON.stringify(map));
              DANMU_MEM_DICT = map;
          }
      } catch (e) {}
  } else {
      try { DANMU_MEM_DICT = JSON.parse(local); } catch (e) {}
  }
}

function danmuConvertText(text) {
  if (!text || !DANMU_MEM_DICT) return text;
  let res = "";
  for (let char of text) { res += DANMU_MEM_DICT[char] || char; }
  return res;
}

// ==========================================
// 2. 底层工具与多源管理
// ==========================================
const DANMU_DEFAULT_SERVER = "https://api.dandanplay.net";
const DANMU_ID_SEPARATOR = "__FORWARD_DANMU_SERVER__";
const DANMU_BATCH_SIZE = 5;

function danmuNormalizeServer(server) {
  return String(server || "").trim().replace(/\/+$/, "");
}

function danmuSourceTitle(server) {
  try { return new URL(server).host || server; } catch (error) { return server; }
}

function danmuLooksLikeAddress(value) {
  return /^(https?:\/\/|localhost\b|127\.0\.0\.1\b)/i.test(value);
}

function danmuMakeSource(title, server, explicitTitle) {
  const normalizedServer = danmuNormalizeServer(server);
  const normalizedTitle = String(title || "").trim();
  return {
    title: normalizedTitle || danmuSourceTitle(normalizedServer),
    server: normalizedServer,
    explicitTitle: Boolean(explicitTitle && normalizedTitle),
  };
}

function danmuParseSourceLine(line) {
  const separatorMatch = line.match(/[，,]/);
  if (!separatorMatch) return danmuMakeSource("", line, false);
  const separatorIndex = separatorMatch.index;
  const title = line.slice(0, separatorIndex).trim();
  const server = line.slice(separatorIndex + separatorMatch[0].length).trim();
  if (!server && danmuLooksLikeAddress(title)) return danmuMakeSource("", title, false);
  return danmuMakeSource(title, server, true);
}

function danmuMergedSources(params) {
  const { server = "https://danmu-qiguo.vercel.app/guoguo/api/v2", serverName = "🅖 🅖ᴳ", server2 = "http://nl.jc.cd/87654321", serverName2 = "AlphaTV-Pro", server3 = "https://Dm.LiaoVm.com/luosen", serverName3 = "公益" } = params;
  const buildLine = (name, url) => {
      if (!url || String(url).trim().length === 0) return "";
      if (name && String(name).trim().length > 0) return `${String(name).trim()},${String(url).trim()}`;
      return String(url).trim();
  };

  const allServers = [
      buildLine(serverName, server),
      buildLine(serverName2, server2),
      buildLine(serverName3, server3)
  ].filter(s => s.length > 0);
  
  if (allServers.length === 0) return [danmuMakeSource("弹弹play", DANMU_DEFAULT_SERVER, true)];
  
  let lines = [];
  allServers.forEach(s => {
      lines.push(...String(s).split(/\r?\n/).map(line => line.trim()).filter(Boolean));
  });

  return danmuDedupeSources(lines.map(danmuParseSourceLine).filter((source) => source.server));
}

function danmuDedupeSources(sources) {
  const sourceMap = new Map();
  for (const source of sources) {
    if (!sourceMap.has(source.server)) {
      sourceMap.set(source.server, source);
    }
  }
  return Array.from(sourceMap.values());
}

function danmuBindId(id, source, shouldBind) {
  if (!shouldBind || id === undefined || id === null) return id;
  const payload = JSON.stringify({ title: source.title, server: source.server });
  return `${encodeURIComponent(payload)}${DANMU_ID_SEPARATOR}${id}`;
}

function danmuParseId(id) {
  if (typeof id !== "string") return { id, source: null };
  const separatorIndex = id.indexOf(DANMU_ID_SEPARATOR);
  if (separatorIndex === -1) return { id, source: null };

  const encodedSource = id.slice(0, separatorIndex);
  const rawId = id.slice(separatorIndex + DANMU_ID_SEPARATOR.length);
  const decodedSource = decodeURIComponent(encodedSource);
  try {
    const source = JSON.parse(decodedSource);
    if (source && source.server) {
      return { id: rawId, source: danmuMakeSource(source.title, source.server, true) };
    }
  } catch (error) {}
  return { id: rawId, source: danmuMakeSource("", decodedSource, false) };
}

function danmuRequestSources(mergedSources, boundSource) {
  return boundSource ? [boundSource] : mergedSources;
}

function danmuShouldShowSource(sources) {
  return sources.some((source) => source.explicitTitle) || sources.length > 1;
}

function danmuAppendTitle(title, source, shouldAppend) {
  if (!shouldAppend) return title;
  return `${title} - ${source.title}`;
}

function danmuHeaders() {
  return { "Content-Type": "application/json", "User-Agent": "ForwardWidgets/1.0.0" };
}

async function danmuMapBatches(sources, batchSize, task) {
  const results = [];
  for (let index = 0; index < sources.length; index += batchSize) {
    const batch = sources.slice(index, index + batchSize);
    const batchResults = await Promise.all(batch.map(task));
    results.push(...batchResults);
  }
  return results;
}

function danmuSeason(animeTitle) {
  const title = String(animeTitle || "");
  let m = title.match(/第\s*([0-9一二三四五六七八九十壹贰叁肆伍陆柒捌玖拾]+)\s*[季部]/);
  if (m) {
    const n = danmuChineseNumber(m[1]);
    if (n > 0) return n;
  }
  m = title.match(/(?:_|\bS|\bSeason\s+)(\d{1,2})\b/i);
  if (m) return Number(m[1]);
  m = title.match(/[^\d](\d{1,2})$/);
  if (m) return Number(m[1]);
  return null;
}

function danmuFilterAnimes(rawAnimes, type, season, queryTitle) {
  const movieTypes = ["movie", "电影", "奇幻片", "剧场版"];
  let animes = [];
  if (rawAnimes && rawAnimes.length > 0) {
    animes = rawAnimes.filter((anime) => {
      const animeType = (anime.type || "").toLowerCase();
      if (type === "movie") return movieTypes.some(t => t.toLowerCase() === animeType);
      if (type === "tv") return !movieTypes.some(t => t.toLowerCase() === animeType);
      return true;
    });
    if (season) {
      const seasonNum = Number(season);
      const matchedAnimes = animes.filter((anime) => {
        if (!anime.animeTitle.includes(queryTitle)) return false;
        const animeSeason = danmuSeason(anime.animeTitle);
        return animeSeason !== null && animeSeason === seasonNum;
      });
      if (matchedAnimes.length > 0) animes = matchedAnimes;
    }
  }
  return animes;
}

function danmuChineseNumber(chineseNumber) {
  if (/^\d+$/.test(chineseNumber)) return Number(chineseNumber);
  const digits = {
    '零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9,
    '壹': 1, '貳': 2, '參': 3, '肆': 4, '伍': 5, '陸': 6, '柒': 7, '捌': 8, '玖': 9
  };
  const units = { '十': 10, '百': 100, '千': 1000, '拾': 10, '佰': 100, '仟': 1000 };
  let result = 0, current = 0, lastUnit = 1;
  for (let i = 0; i < chineseNumber.length; i++) {
    const char = chineseNumber[i];
    if (digits[char] !== undefined) current = digits[char];
    else if (units[char] !== undefined) {
      const unit = units[char];
      if (current === 0) current = 1;
      if (unit >= lastUnit) result = current * unit;
      else result += current * unit;
      lastUnit = unit; current = 0;
    }
  }
  if (current > 0) result += current;
  return result;
}

// ==========================================
// 3. 核心 API 方法 (全面采用并发模式)
// ==========================================

async function danmuSearch(params) {
  const { type, title, season, searchBlockKeywords } = params;
  let queryTitle = title;
  
  const sources = danmuMergedSources(params);
  const shouldBindSource = danmuShouldShowSource(sources);
  
  // 这里的底层其实已经就是并发 (Promise.all) 的了
  const results = await danmuMapBatches(sources, DANMU_BATCH_SIZE, async (source) => {
    try {
      const response = await Widget.http.get(
        `${source.server}/api/v2/search/anime?keyword=${encodeURIComponent(queryTitle)}`,
        { headers: danmuHeaders() }
      );
      if (!response) throw new Error("获取数据失败");
      const data = response.data;
      if (!data.success) throw new Error(data.errorMessage || "API调用失败");

      let rawAnimes = Array.isArray(data.animes) ? data.animes : [];
      
      if (rawAnimes.length === 0) {
        const epResponse = await Widget.http.get(
          `${source.server}/api/v2/search/episodes?anime=${encodeURIComponent(queryTitle)}`,
          { headers: danmuHeaders() }
        );
        const epData = epResponse && epResponse.data;
        if (epData && Array.isArray(epData.animes)) {
          rawAnimes = epData.animes.map(({ episodes, ...anime }) => anime);
        }
      }

      if (rawAnimes.length > 0 && searchBlockKeywords) {
          const blockedList = searchBlockKeywords.split(/[,，]/).map(k => k.trim()).filter(k => k.length > 0);
          if (blockedList.length > 0) {
              rawAnimes = rawAnimes.filter(a => {
                  if (!a.animeTitle) return false;
                  for (const keyword of blockedList) {
                      if (a.animeTitle.includes(keyword)) return false; 
                  }
                  return true;
              });
          }
      }

      return {
        source,
        animes: danmuFilterAnimes(rawAnimes, type, season, queryTitle),
      };
    } catch (error) {
      console.error(`请求 ${source.server} 失败:`, error);
      return { source, error };
    }
  });

  let hasSuccessfulResponse = false;
  const animes = [];
  let seenIds = new Set(); 

  for (const result of results) {
    if (result.error) continue;
    hasSuccessfulResponse = true;
    for (const anime of result.animes) {
        const uid = anime.bangumiId || anime.animeId;
        if (!seenIds.has(uid)) {
            seenIds.add(uid);
            animes.push({
                ...anime,
                animeId: danmuBindId(uid, result.source, shouldBindSource),
                animeTitle: danmuAppendTitle(anime.animeTitle, result.source, shouldBindSource),
            });
        }
    }
  }

  if (hasSuccessfulResponse) return { animes: animes };
  throw new Error("获取数据失败");
}

function danmuCleanTitle(title) {
  return String(title || "").replace(/（[^）]*）/g, "").replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
}

async function danmuEpisodesBangumi(source, id) {
  try {
    const response = await Widget.http.get(`${source.server}/api/v2/bangumi/${id}`, { headers: danmuHeaders() });
    const episodes = response && response.data && response.data.bangumi && response.data.bangumi.episodes;
    return Array.isArray(episodes) && episodes.length > 0 ? episodes : null;
  } catch (error) { return null; }
}

async function danmuEpisodesMatch(source, title, season, episode) {
  const cleanTitle = danmuCleanTitle(title).replace(/\s*第\s*[一二三四五六七八九十百零〇\d]+\s*[季部]\s*$/g, "").trim();
  const e = Number(episode);
  if (!cleanTitle || Number.isNaN(e) || e <= 0) return null;
  const s = Number(season);
  const seasonNum = !Number.isNaN(s) && s > 0 ? s : 1;
  const fileName = `${cleanTitle} S${String(seasonNum).padStart(2, "0")}E${String(e).padStart(2, "0")}`;
  try {
    const response = await Widget.http.post(
      `${source.server}/api/v2/match`,
      { fileName, fileHash: null, fileSize: 0, videoDuration: 0 },
      { headers: danmuHeaders() }
    );
    const data = response && response.data;
    if (!data || !data.isMatched || !Array.isArray(data.matches) || data.matches.length === 0) return null;
    const matched = data.matches[0];
    
    if (matched.animeId) {
        const fullEpisodes = await danmuEpisodesBangumi(source, matched.animeId);
        if (fullEpisodes && fullEpisodes.length > 0) return fullEpisodes;
    }

    return [{
      episodeId: matched.episodeId,
      episodeTitle: matched.episodeTitle || `第${e}集`,
      episodeNumber: String(e),
    }];
  } catch (error) { return null; }
}

async function danmuEpisodesLibrary(source, title, season) {
  const query = danmuCleanTitle(title);
  if (!query) return null;
  try {
    const response = await Widget.http.get(
      `${source.server}/api/v2/search/episodes?anime=${encodeURIComponent(query)}`,
      { headers: danmuHeaders() }
    );
    const animes = response && response.data && response.data.animes;
    if (!Array.isArray(animes) || animes.length === 0) return null;
    let target = animes[0];
    const s = Number(season);
    if (animes.length > 1 && !Number.isNaN(s) && s > 0) {
      const matched = animes.find((a) => danmuSeason(a.animeTitle) === s);
      if (matched) target = matched;
    }
    return Array.isArray(target.episodes) && target.episodes.length > 0 ? target.episodes : null;
  } catch (error) { return null; }
}

async function fetchEpisodesByResearch(source, title, season) {
  const query = danmuCleanTitle(title);
  if (!query) return null;
  try {
    const searchRes = await Widget.http.get(
      `${source.server}/api/v2/search/anime?keyword=${encodeURIComponent(query)}`,
      { headers: danmuHeaders() }
    );
    const animes = searchRes && searchRes.data && searchRes.data.animes;
    if (!Array.isArray(animes) || animes.length === 0) return null;
    let target = animes.find((a) => a.animeTitle === title);
    if (!target) {
      const cands = animes.filter((a) => {
        const c = danmuCleanTitle(a.animeTitle);
        return c === query || c.startsWith(query) || query.startsWith(c);
      });
      const s = Number(season);
      if (!Number.isNaN(s) && s > 0) {
        target = cands.find((a) => danmuSeason(a.animeTitle) === s);
      }
      target = target || cands[0];
    }
    if (!target) return null;
    const freshId = target.bangumiId || target.animeId;
    const detailRes = await Widget.http.get(
      `${source.server}/api/v2/bangumi/${freshId}`,
      { headers: danmuHeaders() }
    );
    const episodes = detailRes && detailRes.data && detailRes.data.bangumi && detailRes.data.bangumi.episodes;
    return Array.isArray(episodes) && episodes.length > 0 ? episodes : null;
  } catch (error) { return null; }
}

// 【提速修改】：将 for...of 串行排队改为 Promise.all 并发获取详情
async function danmuDetail(params) {
  const { animeId, title, seriesName, season, episode } = params;
  const matchTitle = seriesName || title;
  const parsedAnimeId = danmuParseId(animeId);
  const sources = danmuRequestSources(danmuMergedSources(params), parsedAnimeId.source);
  const shouldBindSource = danmuShouldShowSource(sources) || Boolean(parsedAnimeId.source);
  
  const fetchFromSingleSource = async (source) => {
    try {
      let episodes = null;
      if (parsedAnimeId && parsedAnimeId.id && parsedAnimeId.id !== "undefined" && parsedAnimeId.id !== "null") {
          episodes = await danmuEpisodesBangumi(source, parsedAnimeId.id);
      }
      if (!episodes) episodes = await danmuEpisodesMatch(source, matchTitle, season, episode);
      if (!episodes) episodes = await fetchEpisodesByResearch(source, title, season);
      if (!episodes) episodes = await danmuEpisodesLibrary(source, title, season);

      if (episodes && episodes.length > 0) {
        return episodes.map((episode) => ({
          ...episode,
          episodeId: danmuBindId(episode.episodeId, source, shouldBindSource),
          episodeTitle: danmuAppendTitle(episode.episodeTitle, source, shouldBindSource),
        }));
      }
      return null;
    } catch (error) {
      console.error(`请求详情失败 ${source.server}:`, error);
      return null;
    }
  };

  // 并发请求所有源！
  const results = await Promise.all(sources.map(fetchFromSingleSource));
  
  const allEpisodes = [];
  for (const res of results) {
      if (res) allEpisodes.push(...res);
  }

  if (allEpisodes.length > 0) return allEpisodes;
  throw new Error("并发获取详情数据失败");
}

// 【提速修改】：将弹幕获取逻辑改为并发抢答，谁先返回正确数据就直接用谁的！
async function danmuComments(params) {
  const { commentId, convertMode, blockKeywords, colorMode, maxCount } = params;

  if (commentId) {
    await danmuInitDict(convertMode);

    const parsedCommentId = danmuParseId(commentId);
    const sources = danmuRequestSources(danmuMergedSources(params), parsedCommentId.source);

    const fetchCommentsFromSingleSource = async (source) => {
      try {
        const response = await Widget.http.get(
          `${source.server}/api/v2/comment/${parsedCommentId.id}?async=1&withRelated=true&chConvert=1`,
          { headers: danmuHeaders() }
        );

        if (response && response.data) {
          let data = response.data;
          let list = data.comments || [];
          
          const blockedList = blockKeywords 
            ? blockKeywords.split(/[,，]/).map(k => k.trim()).filter(k => k.length > 0) 
            : [];

          if (list.length > 0) {
              if (convertMode !== "none" && DANMU_MEM_DICT) {
                  list.forEach(c => {
                      if (c.m) c.m = danmuConvertText(c.m);
                      if (c.message) c.message = danmuConvertText(c.message);
                  });
              }

              if (blockedList.length > 0) {
                  list = list.filter(c => {
                      const msg = c.m || c.message || "";
                      for (const keyword of blockedList) {
                          if (msg.includes(keyword)) return false; 
                      }
                      return true;
                  });
              }

              let limit = parseInt(maxCount);
              if (!isNaN(limit) && limit > 0 && list.length > limit) {
                  for (let i = list.length - 1; i > 0; i--) {
                      const j = Math.floor(Math.random() * (i + 1));
                      [list[i], list[j]] = [list[j], list[i]];
                  }
                  list = list.slice(0, limit);
                  list.sort((a, b) => {
                      let timeA = a.p ? parseFloat(a.p.split(',')[0]) || 0 : 0;
                      let timeB = b.p ? parseFloat(b.p.split(',')[0]) || 0 : 0;
                      return timeA - timeB;
                  });
              }

              if (colorMode && colorMode !== "none") {
                  const COLORS = [16711680, 16776960, 16752384, 16738740, 13445375, 11730943, 11730790];
                  const COLOR_WHITE = "16777215";

                  list.forEach(c => {
                      if (c.p) {
                          let parts = c.p.split(',');
                          if (parts.length >= 3) {
                              let colorIndex = parts.length >= 8 ? 3 : 2; 
                              let targetColor = COLOR_WHITE;
                              if (colorMode === "white") targetColor = COLOR_WHITE;
                              else if (colorMode === "partial") {
                                  targetColor = Math.random() < 0.5 
                                      ? COLORS[Math.floor(Math.random() * COLORS.length)].toString() 
                                      : COLOR_WHITE;
                              } else if (colorMode === "all") {
                                  targetColor = COLORS[Math.floor(Math.random() * COLORS.length)].toString();
                              }
                              parts[colorIndex] = targetColor;
                              c.p = parts.join(',');
                          }
                      }
                  });
              }
              data.comments = list;
          }
          return data;
        }
        return null;
      } catch (error) {
        console.error(`请求弹幕失败 ${source.server}:`, error);
        return null;
      }
    };

    // 并发抢答：同时请求所有源！
    const results = await Promise.all(sources.map(fetchCommentsFromSingleSource));
    
    // 返回最先成功的结果（按照源的优先级顺序返回第一个有数据的）
    for (const data of results) {
        if (data) return data;
    }
    
    throw new Error("获取弹幕数据失败");
  }
  return null;
}

async function searchDanmu(params) { return params && params.danmuMode === "poll" ? await pollSearch(params) : await danmuSearch(params); }
async function getDetailById(params) { return params && params.danmuMode === "poll" ? await pollDetail(params) : await danmuDetail(params); }
async function getCommentsById(params) { return params && params.danmuMode === "poll" ? await pollComments(params) : await danmuComments(params); }

// ===== 轮询弹幕合并实现 =====
// ==========================================
// 1. 繁简转换核心
// ==========================================
const POLL_DICT_URL_S2T = "https://cdn.jsdelivr.net/npm/opencc-data@1.0.3/data/STCharacters.txt";
const POLL_DICT_URL_T2S = "https://cdn.jsdelivr.net/npm/opencc-data@1.0.3/data/TSCharacters.txt";
let POLL_MEM_DICT = null;

async function pollInitDict(mode) {
  if (!mode || mode === "none") return;
  if (POLL_MEM_DICT) return; 
  const key = `dict_${mode}`;
  let local = await Widget.storage.get(key);
  if (!local) {
      try {
          const res = await Widget.http.get(mode === "s2t" ? POLL_DICT_URL_S2T : POLL_DICT_URL_T2S);
          let text = res.data || res;
          if (typeof text === 'string' && text.length > 100) {
              const map = {};
              text.split('\n').forEach(l => {
                  const p = l.split(/\s+/);
                  if (p.length >= 2) map[p[0]] = p[1];
              });
              await Widget.storage.set(key, JSON.stringify(map));
              POLL_MEM_DICT = map;
          }
      } catch (e) {}
  } else {
      try { POLL_MEM_DICT = JSON.parse(local); } catch (e) {}
  }
}

function pollConvertText(text) {
  if (!text || !POLL_MEM_DICT) return text;
  let res = "";
  for (let char of text) { res += POLL_MEM_DICT[char] || char; }
  return res;
}

// ==========================================
// 2. 底层工具与多源管理
// ==========================================
const POLL_DEFAULT_SERVER = "https://api.dandanplay.net";
const POLL_ID_SEPARATOR = "__FORWARD_DANMU_SERVER__";
const POLL_BATCH_SIZE = 5;

function pollNormalizeServer(pollServer) {
  return String(pollServer || "").trim().replace(/\/+$/, "");
}

function pollSourceTitle(pollServer) {
  try { return new URL(pollServer).host || pollServer; } catch (error) { return pollServer; }
}

function pollLooksLikeAddress(value) {
  return /^(https?:\/\/|localhost\b|127\.0\.0\.1\b)/i.test(value);
}

function pollMakeSource(title, pollServer, explicitTitle) {
  const normalizedServer = pollNormalizeServer(pollServer);
  const normalizedTitle = String(title || "").trim();
  return {
    title: normalizedTitle || pollSourceTitle(normalizedServer),
    pollServer: normalizedServer,
    explicitTitle: Boolean(explicitTitle && normalizedTitle),
  };
}

function pollParseSourceLine(line) {
  const separatorMatch = line.match(/[，,]/);
  if (!separatorMatch) return pollMakeSource("", line, false);
  const separatorIndex = separatorMatch.index;
  const title = line.slice(0, separatorIndex).trim();
  const pollServer = line.slice(separatorIndex + separatorMatch[0].length).trim();
  if (!pollServer && pollLooksLikeAddress(title)) return pollMakeSource("", title, false);
  return pollMakeSource(title, pollServer, true);
}

function pollMergedSources(params) {
  const { pollServer = "https://ybdm.saodu.wang:9999/api/v1/saoduyb", pollServerName = "SaoDu", pollServer2, pollServerName2, pollServer3, pollServerName3 } = params;
  const buildLine = (name, url) => {
      if (!url || String(url).trim().length === 0) return "";
      if (name && String(name).trim().length > 0) return `${String(name).trim()},${String(url).trim()}`;
      return String(url).trim();
  };

  const allServers = [
      buildLine(pollServerName, pollServer),
      buildLine(pollServerName2, pollServer2),
      buildLine(pollServerName3, pollServer3)
  ].filter(s => s.length > 0);
  
  if (allServers.length === 0) return [pollMakeSource("弹弹play", POLL_DEFAULT_SERVER, true)];
  
  let lines = [];
  allServers.forEach(s => {
      lines.push(...String(s).split(/\r?\n/).map(line => line.trim()).filter(Boolean));
  });

  return pollDedupeSources(lines.map(pollParseSourceLine).filter((source) => source.pollServer));
}

function pollDedupeSources(sources) {
  const sourceMap = new Map();
  for (const source of sources) {
    if (!sourceMap.has(source.pollServer)) {
      sourceMap.set(source.pollServer, source);
    }
  }
  return Array.from(sourceMap.values());
}

function pollBindId(id, source, shouldBind) {
  if (!shouldBind || id === undefined || id === null) return id;
  const payload = JSON.stringify({ title: source.title, pollServer: source.pollServer });
  return `${encodeURIComponent(payload)}${POLL_ID_SEPARATOR}${id}`;
}

function pollParseId(id) {
  if (typeof id !== "string") return { id, source: null };
  const separatorIndex = id.indexOf(POLL_ID_SEPARATOR);
  if (separatorIndex === -1) return { id, source: null };

  const encodedSource = id.slice(0, separatorIndex);
  const rawId = id.slice(separatorIndex + POLL_ID_SEPARATOR.length);
  const decodedSource = decodeURIComponent(encodedSource);
  try {
    const source = JSON.parse(decodedSource);
    if (source && source.pollServer) {
      return { id: rawId, source: pollMakeSource(source.title, source.pollServer, true) };
    }
  } catch (error) {}
  return { id: rawId, source: pollMakeSource("", decodedSource, false) };
}

function pollRequestSources(mergedSources, boundSource) {
  return boundSource ? [boundSource] : mergedSources;
}

function pollShouldShowSource(sources) {
  return sources.some((source) => source.explicitTitle) || sources.length > 1;
}

function pollAppendTitle(title, source, shouldAppend) {
  if (!shouldAppend) return title;
  return `${title} - ${source.title}`;
}

function pollHeaders() {
  return { "Content-Type": "application/json", "User-Agent": "ForwardWidgets/1.0.0" };
}

async function pollMapBatches(sources, batchSize, task) {
  const results = [];
  for (let index = 0; index < sources.length; index += batchSize) {
    const batch = sources.slice(index, index + batchSize);
    const batchResults = await Promise.all(batch.map(task));
    results.push(...batchResults);
  }
  return results;
}

function pollSeason(animeTitle) {
  const title = String(animeTitle || "");
  let m = title.match(/第\s*([0-9一二三四五六七八九十壹贰叁肆伍陆柒捌玖拾]+)\s*[季部]/);
  if (m) {
    const n = pollChineseNumber(m[1]);
    if (n > 0) return n;
  }
  m = title.match(/(?:_|\bS|\bSeason\s+)(\d{1,2})\b/i);
  if (m) return Number(m[1]);
  m = title.match(/[^\d](\d{1,2})$/);
  if (m) return Number(m[1]);
  return null;
}

function pollFilterAnimes(rawAnimes, type, season, queryTitle) {
  const movieTypes = ["movie", "电影", "奇幻片", "剧场版"];
  let animes = [];
  if (rawAnimes && rawAnimes.length > 0) {
    animes = rawAnimes.filter((anime) => {
      const animeType = (anime.type || "").toLowerCase();
      if (type === "movie") return movieTypes.some(t => t.toLowerCase() === animeType);
      if (type === "tv") return !movieTypes.some(t => t.toLowerCase() === animeType);
      return true;
    });
    if (season) {
      const seasonNum = Number(season);
      const matchedAnimes = animes.filter((anime) => {
        if (!anime.animeTitle.includes(queryTitle)) return false;
        const animeSeason = pollSeason(anime.animeTitle);
        return animeSeason !== null && animeSeason === seasonNum;
      });
      if (matchedAnimes.length > 0) animes = matchedAnimes;
    }
  }
  return animes;
}

function pollChineseNumber(chineseNumber) {
  if (/^\d+$/.test(chineseNumber)) return Number(chineseNumber);
  const digits = {
    '零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9,
    '壹': 1, '貳': 2, '參': 3, '肆': 4, '伍': 5, '陸': 6, '柒': 7, '捌': 8, '玖': 9
  };
  const units = { '十': 10, '百': 100, '千': 1000, '拾': 10, '佰': 100, '仟': 1000 };
  let result = 0, current = 0, lastUnit = 1;
  for (let i = 0; i < chineseNumber.length; i++) {
    const char = chineseNumber[i];
    if (digits[char] !== undefined) current = digits[char];
    else if (units[char] !== undefined) {
      const unit = units[char];
      if (current === 0) current = 1;
      if (unit >= lastUnit) result = current * unit;
      else result += current * unit;
      lastUnit = unit; current = 0;
    }
  }
  if (current > 0) result += current;
  return result;
}

// ==========================================
// 3. 核心 API 方法
// ==========================================

async function pollSearch(params) {
  const { type, title, season, searchBlockKeywords } = params;
  let queryTitle = title;
  
  const sources = pollMergedSources(params);
  const shouldBindSource = pollShouldShowSource(sources);
  
  const results = await pollMapBatches(sources, POLL_BATCH_SIZE, async (source) => {
    try {
      const response = await Widget.http.get(
        `${source.pollServer}/api/v2/search/anime?keyword=${encodeURIComponent(queryTitle)}`,
        { headers: pollHeaders() }
      );
      if (!response) throw new Error("获取数据失败");
      const data = response.data;
      if (!data.success) throw new Error(data.errorMessage || "API调用失败");

      let rawAnimes = Array.isArray(data.animes) ? data.animes : [];
      
      if (rawAnimes.length === 0) {
        const epResponse = await Widget.http.get(
          `${source.pollServer}/api/v2/search/episodes?anime=${encodeURIComponent(queryTitle)}`,
          { headers: pollHeaders() }
        );
        const epData = epResponse && epResponse.data;
        if (epData && Array.isArray(epData.animes)) {
          rawAnimes = epData.animes.map(({ episodes, ...anime }) => anime);
        }
      }

      if (rawAnimes.length > 0 && searchBlockKeywords) {
          const blockedList = searchBlockKeywords.split(/[,，]/).map(k => k.trim()).filter(k => k.length > 0);
          if (blockedList.length > 0) {
              rawAnimes = rawAnimes.filter(a => {
                  if (!a.animeTitle) return false;
                  for (const keyword of blockedList) {
                      if (a.animeTitle.includes(keyword)) return false; 
                  }
                  return true;
              });
          }
      }

      return {
        source,
        animes: pollFilterAnimes(rawAnimes, type, season, queryTitle),
      };
    } catch (error) {
      console.error(`请求 ${source.pollServer} 失败:`, error);
      return { source, error };
    }
  });

  let lastError = null;
  let hasSuccessfulResponse = false;
  const animes = [];
  let seenIds = new Set(); 

  for (const result of results) {
    if (result.error) {
      lastError = result.error;
      continue;
    }
    hasSuccessfulResponse = true;
    for (const anime of result.animes) {
        const uid = anime.bangumiId || anime.animeId;
        if (!seenIds.has(uid)) {
            seenIds.add(uid);
            animes.push({
                ...anime,
                animeId: pollBindId(uid, result.source, shouldBindSource),
                animeTitle: pollAppendTitle(anime.animeTitle, result.source, shouldBindSource),
            });
        }
    }
  }

  if (hasSuccessfulResponse) return { animes: animes };
  throw lastError || new Error("获取数据失败");
}

function pollCleanTitle(title) {
  return String(title || "").replace(/（[^）]*）/g, "").replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
}

async function pollEpisodesBangumi(source, id) {
  try {
    const response = await Widget.http.get(`${source.pollServer}/api/v2/bangumi/${id}`, { headers: pollHeaders() });
    const episodes = response && response.data && response.data.bangumi && response.data.bangumi.episodes;
    return Array.isArray(episodes) && episodes.length > 0 ? episodes : null;
  } catch (error) { return null; }
}

async function pollEpisodesMatch(source, title, season, episode) {
  const cleanTitle = pollCleanTitle(title).replace(/\s*第\s*[一二三四五六七八九十百零〇\d]+\s*[季部]\s*$/g, "").trim();
  const e = Number(episode);
  if (!cleanTitle || Number.isNaN(e) || e <= 0) return null;
  const s = Number(season);
  const seasonNum = !Number.isNaN(s) && s > 0 ? s : 1;
  const fileName = `${cleanTitle} S${String(seasonNum).padStart(2, "0")}E${String(e).padStart(2, "0")}`;
  try {
    const response = await Widget.http.post(
      `${source.pollServer}/api/v2/match`,
      { fileName, fileHash: null, fileSize: 0, videoDuration: 0 },
      { headers: pollHeaders() }
    );
    const data = response && response.data;
    if (!data || !data.isMatched || !Array.isArray(data.matches) || data.matches.length === 0) return null;
    const matched = data.matches[0];
    
    // 【核心修复】：官方原本直接返回单一集数，这里改为使用提取到的 animeId 去获取全部集数列表
    if (matched.animeId) {
        const fullEpisodes = await pollEpisodesBangumi(source, matched.animeId);
        if (fullEpisodes && fullEpisodes.length > 0) return fullEpisodes;
    }

    return [{
      episodeId: matched.episodeId,
      episodeTitle: matched.episodeTitle || `第${e}集`,
      episodeNumber: String(e),
    }];
  } catch (error) { return null; }
}

async function pollEpisodesLibrary(source, title, season) {
  const query = pollCleanTitle(title);
  if (!query) return null;
  try {
    const response = await Widget.http.get(
      `${source.pollServer}/api/v2/search/episodes?anime=${encodeURIComponent(query)}`,
      { headers: pollHeaders() }
    );
    const animes = response && response.data && response.data.animes;
    if (!Array.isArray(animes) || animes.length === 0) return null;
    let target = animes[0];
    const s = Number(season);
    if (animes.length > 1 && !Number.isNaN(s) && s > 0) {
      const matched = animes.find((a) => pollSeason(a.animeTitle) === s);
      if (matched) target = matched;
    }
    return Array.isArray(target.episodes) && target.episodes.length > 0 ? target.episodes : null;
  } catch (error) { return null; }
}

async function fetchEpisodesByResearch(source, title, season) {
  const query = pollCleanTitle(title);
  if (!query) return null;
  try {
    const searchRes = await Widget.http.get(
      `${source.pollServer}/api/v2/search/anime?keyword=${encodeURIComponent(query)}`,
      { headers: pollHeaders() }
    );
    const animes = searchRes && searchRes.data && searchRes.data.animes;
    if (!Array.isArray(animes) || animes.length === 0) return null;
    let target = animes.find((a) => a.animeTitle === title);
    if (!target) {
      const cands = animes.filter((a) => {
        const c = pollCleanTitle(a.animeTitle);
        return c === query || c.startsWith(query) || query.startsWith(c);
      });
      const s = Number(season);
      if (!Number.isNaN(s) && s > 0) {
        target = cands.find((a) => pollSeason(a.animeTitle) === s);
      }
      target = target || cands[0];
    }
    if (!target) return null;
    const freshId = target.bangumiId || target.animeId;
    const detailRes = await Widget.http.get(
      `${source.pollServer}/api/v2/bangumi/${freshId}`,
      { headers: pollHeaders() }
    );
    const episodes = detailRes && detailRes.data && detailRes.data.bangumi && detailRes.data.bangumi.episodes;
    return Array.isArray(episodes) && episodes.length > 0 ? episodes : null;
  } catch (error) { return null; }
}

async function pollDetail(params) {
  const { animeId, title, seriesName, season, episode } = params;
  const matchTitle = seriesName || title;
  const parsedAnimeId = pollParseId(animeId);
  const sources = pollRequestSources(pollMergedSources(params), parsedAnimeId.source);
  const shouldBindSource = pollShouldShowSource(sources) || Boolean(parsedAnimeId.source);
  
  let lastError = null;
  let hasSuccessfulResponse = false;
  const allEpisodes = [];

  for (const source of sources) {
    try {
      let episodes = null;
      
      // 【核心修复】：优先判定是否为手动点击列表 (存在有效的 animeId)
      // 如果有，则直接获取整部剧的完整集数列表，不走单集截断逻辑
      if (parsedAnimeId && parsedAnimeId.id && parsedAnimeId.id !== "undefined" && parsedAnimeId.id !== "null") {
          episodes = await pollEpisodesBangumi(source, parsedAnimeId.id);
      }
      
      // 如果没有获取到（说明是软件后台自动搜索无感匹配），再按官方流程进行
      if (!episodes) episodes = await pollEpisodesMatch(source, matchTitle, season, episode);
      if (!episodes) episodes = await fetchEpisodesByResearch(source, title, season);
      if (!episodes) episodes = await pollEpisodesLibrary(source, title, season);

      if (episodes) {
        hasSuccessfulResponse = true;
        allEpisodes.push(...episodes.map((episode) => ({
          ...episode,
          episodeId: pollBindId(episode.episodeId, source, shouldBindSource),
          episodeTitle: pollAppendTitle(episode.episodeTitle, source, shouldBindSource),
        })));
        continue;
      }
      lastError = new Error("获取数据失败");
    } catch (error) {
      lastError = error;
      console.error(`请求 ${source.pollServer} 失败:`, error);
    }
  }

  if (hasSuccessfulResponse) return allEpisodes;
  throw lastError || new Error("获取数据失败");
}

async function pollComments(params) {
  const { commentId, convertMode, blockKeywords, colorMode, maxCount } = params;

  if (commentId) {
    await pollInitDict(convertMode);

    const parsedCommentId = pollParseId(commentId);
    const sources = pollRequestSources(pollMergedSources(params), parsedCommentId.source);
    let lastError = null;

    for (const source of sources) {
      try {
        const response = await Widget.http.get(
          `${source.pollServer}/api/v2/comment/${parsedCommentId.id}?async=1&withRelated=true&chConvert=1`,
          { headers: pollHeaders() }
        );

        if (response && response.data) {
          let data = response.data;
          let list = data.comments || [];
          
          const blockedList = blockKeywords 
            ? blockKeywords.split(/[,，]/).map(k => k.trim()).filter(k => k.length > 0) 
            : [];

          if (list.length > 0) {
              if (convertMode !== "none" && POLL_MEM_DICT) {
                  list.forEach(c => {
                      if (c.m) c.m = pollConvertText(c.m);
                      if (c.message) c.message = pollConvertText(c.message);
                  });
              }

              if (blockedList.length > 0) {
                  list = list.filter(c => {
                      const msg = c.m || c.message || "";
                      for (const keyword of blockedList) {
                          if (msg.includes(keyword)) return false; 
                      }
                      return true;
                  });
              }

              let limit = parseInt(maxCount);
              if (!isNaN(limit) && limit > 0 && list.length > limit) {
                  for (let i = list.length - 1; i > 0; i--) {
                      const j = Math.floor(Math.random() * (i + 1));
                      [list[i], list[j]] = [list[j], list[i]];
                  }
                  list = list.slice(0, limit);
                  list.sort((a, b) => {
                      let timeA = a.p ? parseFloat(a.p.split(',')[0]) || 0 : 0;
                      let timeB = b.p ? parseFloat(b.p.split(',')[0]) || 0 : 0;
                      return timeA - timeB;
                  });
              }

              if (colorMode && colorMode !== "none") {
                  const COLORS = [16711680, 16776960, 16752384, 16738740, 13445375, 11730943, 11730790];
                  const COLOR_WHITE = "16777215";

                  list.forEach(c => {
                      if (c.p) {
                          let parts = c.p.split(',');
                          if (parts.length >= 3) {
                              let colorIndex = parts.length >= 8 ? 3 : 2; 
                              let targetColor = COLOR_WHITE;
                              if (colorMode === "white") targetColor = COLOR_WHITE;
                              else if (colorMode === "partial") {
                                  targetColor = Math.random() < 0.5 
                                      ? COLORS[Math.floor(Math.random() * COLORS.length)].toString() 
                                      : COLOR_WHITE;
                              } else if (colorMode === "all") {
                                  targetColor = COLORS[Math.floor(Math.random() * COLORS.length)].toString();
                              }
                              parts[colorIndex] = targetColor;
                              c.p = parts.join(',');
                          }
                      }
                  });
              }
              
              data.comments = list;
          }
          return data;
        }

        lastError = new Error("获取数据失败");
      } catch (error) {
        lastError = error;
        console.error(`请求 ${source.pollServer} 失败:`, error);
      }
    }
    throw lastError || new Error("获取数据失败");
  }
  return null;
}


// ===== 全球影视专区实现（命名空间隔离） =====
// =========================================================================
// 2. 模块 1 专属逻辑 (全球探索发现)
// =========================================================================

const ZONE_GLOBAL_GENRE_MAP = {
    28: "动作", 12: "冒险", 16: "动画", 35: "喜剧", 80: "犯罪", 99: "纪录片",
    18: "剧情", 10751: "家庭", 14: "奇幻", 36: "历史", 27: "恐怖", 10402: "音乐",
    9648: "悬疑", 10749: "爱情", 878: "科幻", 10770: "电视电影", 53: "惊悚",
    10752: "战争", 37: "西部", 10759: "动作冒险"
};

function zoneGetGenreText(ids) {
    if (!ids || !Array.isArray(ids)) return "";
    return ids.map(id => ZONE_GLOBAL_GENRE_MAP[id]).filter(Boolean).slice(0, 3).join(" / ");
}

function zoneBuildItem(item, forceMediaType) {
    if (!item) return null;
    
    const mediaType = forceMediaType || item.media_type || (item.title ? "movie" : "tv");
    const title = item.title || item.name;
    const releaseDate = item.release_date || item.first_air_date || "";
    const score = item.vote_average ? item.vote_average.toFixed(1) : "暂无";
    const genreText = zoneGetGenreText(item.genre_ids) || "影视";
    
    const typeTag = mediaType === "movie" ? "🎬电影" : "📺剧集";

    return {
        id: String(item.id),
        tmdbId: parseInt(item.id),
        type: "tmdb", 
        mediaType: mediaType,
        title: title,
        releaseDate: releaseDate, 
        genreTitle: genreText,    
        subTitle: "",            
        posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "", 
        backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : "", 
        description: `${typeTag} | ⭐ ${score}\n${item.overview || "暂无简介"}`,
        rating: item.vote_average || 0,
        _popularity: item.popularity || 0,
        _date: releaseDate || "1970-01-01"
    };
}

async function zoneFetchFromTmdb(endpoint, sort_by, page, regionKey) { // 👉 改为 sort_by
    const today = new Date().toISOString().split('T')[0];
    
    let queryParams = {
        language: "zh-CN",
        page: page
    };

    if (regionKey === "GLOBAL") {
        // 全球综合热播：不按国家/地区过滤
    } else if (regionKey === "ES_LANG") {
        queryParams.with_original_language = "es";
    } else if (regionKey === "EU") {
        queryParams.with_origin_country = "FR|DE|IT|NL|DK|NO|FI"; 
    } else {
        queryParams.with_origin_country = regionKey;
    }

    const isMovie = endpoint.includes("movie");

    if (sort_by === "hot") { // 👉 改为 sort_by
        queryParams.sort_by = "popularity.desc";
        queryParams["vote_count.gte"] = 5; 
    } 
    else if (sort_by === "new") { // 👉 改为 sort_by
        queryParams.sort_by = isMovie ? "primary_release_date.desc" : "first_air_date.desc";
        if (isMovie) {
            queryParams["primary_release_date.lte"] = today;
        } else {
            queryParams["first_air_date.lte"] = today;
        }
        queryParams["vote_count.gte"] = 1;
    } 
    else if (sort_by === "top") { // 👉 改为 sort_by
        queryParams.sort_by = "vote_average.desc";
        queryParams["vote_count.gte"] = isMovie ? 50 : 20; 
    }

    const res = await Widget.tmdb.get(endpoint, { params: queryParams });
    const mediaType = isMovie ? "movie" : "tv";
    return (res.results || []).map(i => zoneBuildItem(i, mediaType)).filter(Boolean);
}

async function loadGlobalZoneList(params) {
    const region = params.region || "CN";
    const mediaType = params.mediaType || "all";
    const sort_by = params.sort_by || "hot"; // 👉 改为 sort_by
    const page = parseInt(params.page) || 1;

    try {
        let items = [];

        if (mediaType === "all") {
            const [movies, tvs] = await Promise.all([
                zoneFetchFromTmdb("/discover/movie", sort_by, page, region),
                zoneFetchFromTmdb("/discover/tv", sort_by, page, region)
            ]);
            
            items = [...movies, ...tvs];

            items.sort((a, b) => {
                if (sort_by === "hot") { // 👉 改为 sort_by
                    return b._popularity - a._popularity; 
                } else if (sort_by === "new") { // 👉 改为 sort_by
                    return new Date(b._date) - new Date(a._date); 
                } else if (sort_by === "top") { // 👉 改为 sort_by
                    return b.rating - a.rating; 
                }
                return 0;
            });
            
            items = items.slice(0, 20);

        } else {
            const endpoint = mediaType === "movie" ? "/discover/movie" : "/discover/tv";
            items = await zoneFetchFromTmdb(endpoint, sort_by, page, region);
        }

        if (items.length === 0) {
             return page === 1 ? [{ id: "empty", type: "text", title: "无数据", description: "该区域下暂无满足条件的影片" }] : [];
        }

        return items;

    } catch (error) {
        console.error("数据请求异常:", error);
        return [{ id: "error", type: "text", title: "网络异常", description: "请下拉刷新重试" }];
    }
}
