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
    id: "🅖 🅖ᴳMedia.library",
    title: "终极影视榜单Pro",
    description: "影视、动漫、综艺、弹幕、全球聚合",
    icon: "https://github.com/qiguo093/Forward-Widget/raw/refs/heads/main/icon2.png",
    author: "𝓚𝓾𝓰𝓾𝓸𝔃𝓪𝓲 ⁷",
    version: "2.0.1",
    requiredVersion: "0.0.1",
    site: "https://t.me/MakkaPakkaOvO",
    
    globalParams: [
        {
            name: "traktClientId",
            title: "Trakt Client ID",
            type: "input",
            description: "选填，不填则使用内置。Trakt 榜单专用。",
            value: ""
        },
        { name: "serverName", title: "🏷️ 源1 名称", type: "input", value: "🅖 🅖ᴳ" },
        { name: "server", title: "🔗 源1 链接", type: "input", value: "https://danmu-qiguo.vercel.app/guoguo/api/v2" },
        { name: "serverName2", title: "🏷️ 源2 名称", type: "input", value: "AlphaTV-Pro" },
        { name: "server2", title: "🔗 源2 链接", type: "input", value: "http://nl.jc.cd/87654321" },
        { name: "serverName3", title: "🏷️ 源3 名称", type: "input", value: "公益" },
        { name: "server3", title: "🔗 源3 链接", type: "input", value: "https://Dm.LiaoVm.com/luosen" },
        { name: "pollServerName", title: "🔄 轮询源1名称", type: "input", value: "SaoDu" },
        { name: "pollServer", title: "🔄 轮询源1链接", type: "input", value: "https://ybdm.saodu.wang:9999/api/v1/saoduyb" },
        { name: "pollServerName2", title: "🔄 轮询源2名称", type: "input", value: "" },
        { name: "pollServer2", title: "🔄 轮询源2链接", type: "input", value: "" },
        { name: "pollServerName3", title: "🔄 轮询源3名称", type: "input", value: "" },
        { name: "pollServer3", title: "🔄 轮询源3链接", type: "input", value: "" },
        { name: "maxCount", title: "📊 弹幕数量上限", type: "input", value: "50000" },
        { name: "searchBlockKeywords", title: "👁️ 搜索结果屏蔽词", type: "input", value: "" },
        { name: "convertMode", title: "🔠 弹幕转换", type: "enumeration", value: "none", enumOptions: [{ title: "保持原样", value: "none" }, { title: "转简体 (繁->简)", value: "t2s" }, { title: "转繁体 (简->繁)", value: "s2t" }] },
        { name: "colorMode", title: "🎨 弹幕颜色", type: "enumeration", value: "none", enumOptions: [{ title: "保持原样", value: "none" }, { title: "全部纯白", value: "white" }, { title: "部分彩色", value: "partial" }, { title: "完全彩色", value: "all" }] },
        { name: "blockKeywords", title: "🚫 弹幕内容屏蔽词", type: "input", value: "" },
        { name: "danmuMode", title: "弹幕模式", type: "enumeration", value: "fast", enumOptions: [
            { title: "⚡ 极速弹幕（并发）", value: "fast" }, { title: "🔄 轮询弹幕（稳定）", value: "poll" }
        ] }
    ],

    modules: [
        // 极速弹幕三阶段：保持 ForwardWidget 固定入口
        { id: "searchDanmu", title: "搜索弹幕", functionName: "searchDanmu", type: "danmu", params: [] },
        { id: "getDetail", title: "获取详情", functionName: "getDetailById", type: "danmu", params: [] },
        { id: "getComments", title: "获取弹幕", functionName: "getCommentsById", type: "danmu", params: [] },
        // ---------------- 大栏目 0：新片追踪 ----------------
        {
            title: "🎬 新片追踪",
            functionName: "loadMonthlyUpcomingStrict",
            type: "video",
            cacheDuration: 60,
            params: [
                {
                    name: "upcoming_category",
                    title: "选择频道",
                    type: "enumeration",
                    value: "movie_upcoming",
                    enumOptions: [
                        { title: "🍿 即将上映 (期待榜)", value: "movie_upcoming" },
                        { title: "🔥 正在热映 (院线)", value: "movie_now_playing" },
                        { title: "📺 本月定档待播 (新剧集)", value: "tv_monthly_upcoming" },
                        { title: "📅 今日首播 (追更)", value: "tv_airing_today" }
                    ]
                },
                { name: "page", title: "页码", type: "page", startPage: 1 }
            ]
        },

        // ---------------- 大栏目 6：平台剧场（已移除热门番剧） ----------------
        {
            title: "🎭 平台剧场",
            description: "豆瓣热榜与各平台剧场",
            functionName: "loadTheaterHub",
            type: "video",
            cacheDuration: 43200,
            params: [
                { name: "theater_source", title: "选择子列表", type: "enumeration", value: "douban", enumOptions: [
                    { title: "豆瓣热榜", value: "douban" }, { title: "各平台剧场", value: "theater" }, { title: "芒果TV热榜", value: "mango" }
                ] },
                { name: "channel", title: "榜单分类", type: "enumeration", value: "tv", belongTo: { paramName: "theater_source", value: ["douban"] }, enumOptions: [
                    { title: "全部剧集", value: "tv" }, { title: "大陆剧集", value: "tv_domestic" }, { title: "欧美剧集", value: "tv_american" }, { title: "日本剧集", value: "tv_japanese" }, { title: "南韩剧集", value: "tv_korean" }, { title: "动漫番剧", value: "tv_animation" }, { title: "纪录片", value: "tv_documentary" }, { title: "大陆综艺", value: "show_domestic" }, { title: "国外综艺", value: "show_foreign" }
                ] },
                { name: "brand", title: "剧场品牌", type: "enumeration", value: "迷雾剧场", belongTo: { paramName: "theater_source", value: ["theater"] }, enumOptions: [ { title: "迷雾剧场", value: "迷雾剧场" }, { title: "白夜剧场", value: "白夜剧场" }, { title: "X剧场", value: "X剧场" }, { title: "玛卡巴卡的悬疑剧", value: "玛卡巴卡的悬疑剧" }, { title: "横屏短剧", value: "横屏短剧" }, { title: "生花剧场", value: "生花剧场" }, { title: "大家剧场", value: "大家剧场" }, { title: "小逗剧场", value: "小逗剧场" }, { title: "十分剧场", value: "十分剧场" }, { title: "板凳单元", value: "板凳单元" }, { title: "萤火单元", value: "萤火单元" }, { title: "正午阳光", value: "正午阳光" }, { title: "恋恋剧场", value: "恋恋剧场" }, { title: "悬疑剧场", value: "悬疑剧场" }, { title: "微尘剧场", value: "微尘剧场" } ] },
                { name: "status", title: "播出状态", type: "enumeration", value: "all", belongTo: { paramName: "theater_source", value: ["theater"] }, enumOptions: [ { title: "全部", value: "all" }, { title: "已开播", value: "aired" }, { title: "即将推出", value: "upcoming" } ] },
                { name: "mango_sort_by", title: "类型", type: "enumeration", value: "tv", belongTo: { paramName: "theater_source", value: ["mango"] }, enumOptions: [ { title: "全部剧集", value: "tv" }, { title: "王牌综艺", value: "show" } ] },
                { name: "sort_type", title: "排序方式", type: "enumeration", value: "default", enumOptions: [ { title: "默认原序", value: "default" }, { title: "最近更新", value: "updated" }, { title: "最近发布", value: "recent" }, { title: "热度最高", value: "heat" }, { title: "流行趋势", value: "trending" }, { title: "高分优先", value: "rating" } ] },
                { name: "page", title: "页码", type: "page", startPage: 1 }
            ]
        },

        // ---------------- 大栏目 6：全球追剧时刻表 ----------------
        {
            title: "📅 全球追剧时刻表",
            description: "聚合全球剧集更新表、综艺排期与动漫周更表",
            functionName: "loadGlobalCalendarHub",
            type: "video",
            cacheDuration: 43200,
            params: [
                { name: "calendar_source", title: "选择子列表", type: "enumeration", value: "drama", enumOptions: [ { title: "追剧日历", value: "drama" }, { title: "综艺时刻", value: "variety" }, { title: "动漫周更", value: "anime" }, { title: "综艺聚合", value: "aggregate" } ] },
                { name: "calendar_mode", title: "时间范围", type: "enumeration", value: "update_today", belongTo: { paramName: "calendar_source", value: ["drama"] }, enumOptions: [ { title: "今日更新", value: "update_today" }, { title: "明日首播", value: "premiere_tomorrow" }, { title: "7天内首播", value: "premiere_week" }, { title: "30天内首播", value: "premiere_month" } ] },
                { name: "drama_region", title: "地区偏好", type: "enumeration", value: "Global", belongTo: { paramName: "calendar_source", value: ["drama"] }, enumOptions: [ { title: "🌍 全球聚合", value: "Global" }, { title: "🇺🇸 美国", value: "US" }, { title: "🇯🇵 日本", value: "JP" }, { title: "🇰🇷 韩国", value: "KR" }, { title: "🇨🇳 中国", value: "CN" }, { title: "🇬🇧 英国", value: "GB" } ] },
                { name: "variety_mode", title: "时间范围", type: "enumeration", value: "today", belongTo: { paramName: "calendar_source", value: ["variety"] }, enumOptions: [ { title: "今日更新 (Trakt优先)", value: "today" }, { title: "明日预告 (Trakt优先)", value: "tomorrow" }, { title: "近期热播 (TMDB源)", value: "trending" } ] },
                { name: "variety_region", title: "综艺地区", type: "enumeration", value: "cn", belongTo: { paramName: "calendar_source", value: ["variety"] }, enumOptions: [ { title: "🇨🇳 国产综艺", value: "cn" }, { title: "🇰🇷 韩国综艺", value: "kr" }, { title: "🇺🇸 欧美综艺", value: "us" }, { title: "🇯🇵 日本综艺", value: "jp" }, { title: "🌍 全球热门", value: "global" } ] },
                { name: "anime_day", title: "选择日期", type: "enumeration", value: "today", belongTo: { paramName: "calendar_source", value: ["anime"] }, enumOptions: [ { title: "📅 今天", value: "today" }, { title: "周一", value: "1" }, { title: "周二", value: "2" }, { title: "周三", value: "3" }, { title: "周四", value: "4" }, { title: "周五", value: "5" }, { title: "周六", value: "6" }, { title: "周日", value: "7" } ] },
                { name: "aggregate_listType", title: "榜单类型", type: "enumeration", value: "calendar", belongTo: { paramName: "calendar_source", value: ["aggregate"] }, enumOptions: [ { title: "📅 追新榜 (未来排期)", value: "calendar" }, { title: "🔥 热度榜 (按流行度)", value: "hot" } ] },
                { name: "aggregate_days", title: "预告范围", type: "enumeration", value: "14", belongTo: { paramName: "aggregate_listType", value: ["calendar"] }, enumOptions: [ { title: "未来 7 天", value: "7" }, { title: "未来 14 天", value: "14" }, { title: "未来 30 天", value: "30" } ] },
                { name: "aggregate_region", title: "地区筛选", type: "enumeration", value: "all", belongTo: { paramName: "calendar_source", value: ["aggregate"] }, enumOptions: [ { title: "🌏 全部地区", value: "all" }, { title: "🇨🇳 国内综艺", value: "cn" }, { title: "✈️ 国外综艺", value: "global" } ] },
                
                { name: "page", title: "页码", type: "page" }
            ]
        },

        // ---------------- 大栏目 7：骨朵热度指数榜 ----------------
        {
            title: "📈 骨朵热度指数榜",
            description: "每日更新的剧集、动漫、综艺、电影全网热度排行",
            functionName: "loadGuduoRank",
            type: "video",
            requiresWebView: false,
            cacheDuration: 43200,
            params: [
                {
                    name: "guduo_category",
                    title: "榜单分类",
                    type: "enumeration",
                    value: "剧集",
                    enumOptions: [
                        { title: "陆剧", value: "剧集" },
                        { title: "国漫", value: "动漫" },
                        { title: "综艺", value: "综艺" },
                        { title: "电影", value: "电影" }
                    ]
                }
            ]
        },

        // ---------------- VOD合集列表 ----------------
        {
            title: "📦 VOD合集列表",
            description: "聚合实时榜单、豆瓣片单、欧乐影视、人人美剧",
            functionName: "loadVodHubMerged",
            type: "video",
            cacheDuration: 43200,
            params: [
                { name: "vod_list", title: "选择子列表", type: "enumeration", value: "榜单", enumOptions: [ { title: "聚合实时榜单", value: "榜单" }, { title: "豆瓣片单", value: "豆瓣" }, { title: "欧乐影视", value: "欧乐" }, { title: "人人美剧", value: "人人" } ] },
                {"name": "榜单_section", "title": "功能分类", "type": "enumeration", "value": "0", "enumOptions": [{"title": "Netflix新片榜", "value": "0"}, {"title": "Disney+新片榜", "value": "1"}, {"title": "Apple TV+新片榜", "value": "2"}, {"title": "HBOmax新片榜", "value": "3"}, {"title": "prime video新片榜", "value": "4"}, {"title": "本周国剧排行榜", "value": "5"}, {"title": "本周美剧排行榜", "value": "6"}, {"title": "本周动漫排行榜", "value": "7"}, {"title": "本周电影排行榜", "value": "8"}, {"title": "本周韩剧排行榜", "value": "9"}, {"title": "本周英剧排行榜", "value": "10"}, {"title": "本周日剧排行榜", "value": "11"}, {"title": "本周泰剧排行榜", "value": "12"}, {"title": "本周综艺排行榜", "value": "13"}, {"title": "本周纪录片排行榜", "value": "14"}], "belongTo": {"paramName": "vod_list", "value": ["榜单"]}},
                {"name": "豆瓣_section", "title": "功能分类", "type": "enumeration", "value": "0", "enumOptions": [{"title": "豆瓣片单", "value": "0"}, {"title": "即将上映", "value": "1"}], "belongTo": {"paramName": "vod_list", "value": ["豆瓣"]}},
                {"name": "豆瓣_m0_list", "title": "选择片单", "type": "enumeration", "value": "1652843", "enumOptions": [{"title": "Time Out影史百大恐怖片", "value": "1652843"}, {"title": "看电影40部最经典恐怖片", "value": "36980"}, {"title": "恐惧感的丧失(309部)", "value": "36280"}, {"title": "难忘的经典惊悚/恐怖片(547部)", "value": "37140418"}, {"title": "7分以上的恐怖/惊悚电影(174部)", "value": "526461"}, {"title": "高分精品恐怖片(280部)", "value": "5916567"}, {"title": "2000后优秀恐怖电影(204部)", "value": "3356598"}, {"title": "被忽略掉的不沉闷恐怖劲片！(77部)", "value": "724565"}, {"title": "Indiewire: 50位导演心中的最佳恐怖片(48部)", "value": "152540212"}, {"title": "稀有难找 underground horror films(466部)", "value": "109801736"}, {"title": "血浆片已阅整理 Gory Horror Film(47部)", "value": "159889980"}, {"title": "女性导演恐怖片(383部)", "value": "124549602"}, {"title": "Body Horror｜身体恐怖电影(155部)", "value": "162107956"}, {"title": "瘆临其境！恐怖伪纪录片(193部)", "value": "161922461"}, {"title": "码住！盘点欧美高分恐怖电影(585部)", "value": "163019144"}, {"title": "怪力乱神！欧美超自然恐怖电影(206部)", "value": "163048555"}, {"title": "审美与创意兼顾的恐怖片(96部)", "value": "159035683"}, {"title": "我看过的恐怖片们(254部)", "value": "148836450"}, {"title": "我的恐怖片之旅(1534部)", "value": "45782339"}, {"title": "码住！2026年恐怖电影大盘点(304部)", "value": "163145526"}, {"title": "⏎ 自定义URL", "value": "custom"}], "belongTo": {"paramName": "vod_list", "value": ["豆瓣"]}},
                {"name": "豆瓣_m0_url", "title": "自定义URL", "type": "input", "description": "填入豆瓣豆列/列表链接", "placeholders": [{"title": "https://www.douban.com/doulist/xxx/", "value": ""}], "belongTo": {"paramName": "vod_list", "value": ["豆瓣"]}},
                {"name": "豆瓣_m0_page", "title": "页码", "type": "page", "belongTo": {"paramName": "vod_list", "value": ["豆瓣"]}},
                {"name": "豆瓣_m1_page", "title": "页码", "type": "page", "belongTo": {"paramName": "vod_list", "value": ["豆瓣"]}},
                {"name": "欧乐_section", "title": "功能分类", "type": "enumeration", "value": "0", "enumOptions": [{"title": "电影", "value": "0"}, {"title": "剧集", "value": "1"}, {"title": "综艺", "value": "2"}, {"title": "动漫", "value": "3"}, {"title": "短剧", "value": "4"}, {"title": "搜索", "value": "5"}, {"title": "搜索", "value": "6"}], "belongTo": {"paramName": "vod_list", "value": ["欧乐"]}},
                {"name": "欧乐_m0_area", "title": "地区", "type": "enumeration", "value": "0", "enumOptions": [{"title": "全部", "value": "0"}, {"title": "大陆", "value": "大陆"}, {"title": "香港", "value": "香港"}, {"title": "台湾", "value": "台湾"}, {"title": "美国", "value": "美国"}, {"title": "日本", "value": "日本"}, {"title": "韩国", "value": "韩国"}, {"title": "英国", "value": "英国"}, {"title": "法国", "value": "法国"}, {"title": "德国", "value": "德国"}, {"title": "西班牙", "value": "西班牙"}, {"title": "泰国", "value": "泰国"}, {"title": "印度", "value": "印度"}], "belongTo": {"paramName": "vod_list", "value": ["欧乐"]}},
                {"name": "欧乐_m0_sort_by", "title": "榜单类型", "type": "enumeration", "value": "hot", "enumOptions": [{"title": "热门电影", "value": "hot"}, {"title": "高分电影", "value": "score"}, {"title": "最新电影", "value": "update"}, {"title": "最近添加", "value": "desc"}], "belongTo": {"paramName": "vod_list", "value": ["欧乐"]}},
                {"name": "欧乐_m0_page", "title": "页码", "type": "page", "startPage": 1, "belongTo": {"paramName": "vod_list", "value": ["欧乐"]}},
                {"name": "欧乐_m1_area", "title": "地区", "type": "enumeration", "value": "0", "enumOptions": [{"title": "全部", "value": "0"}, {"title": "大陆", "value": "大陆"}, {"title": "香港", "value": "香港"}, {"title": "台湾", "value": "台湾"}, {"title": "美国", "value": "美国"}, {"title": "日本", "value": "日本"}, {"title": "韩国", "value": "韩国"}, {"title": "英国", "value": "英国"}, {"title": "法国", "value": "法国"}, {"title": "德国", "value": "德国"}, {"title": "西班牙", "value": "西班牙"}, {"title": "泰国", "value": "泰国"}, {"title": "印度", "value": "印度"}], "belongTo": {"paramName": "vod_list", "value": ["欧乐"]}},
                {"name": "欧乐_m1_sort_by", "title": "榜单类型", "type": "enumeration", "value": "hot", "enumOptions": [{"title": "热门剧集", "value": "hot"}, {"title": "高分剧集", "value": "score"}, {"title": "最新剧集", "value": "update"}, {"title": "最近添加", "value": "desc"}], "belongTo": {"paramName": "vod_list", "value": ["欧乐"]}},
                {"name": "欧乐_m1_page", "title": "页码", "type": "page", "startPage": 1, "belongTo": {"paramName": "vod_list", "value": ["欧乐"]}},
                {"name": "欧乐_m2_area", "title": "地区", "type": "enumeration", "value": "0", "enumOptions": [{"title": "全部", "value": "0"}, {"title": "大陆", "value": "大陆"}, {"title": "香港", "value": "香港"}, {"title": "台湾", "value": "台湾"}, {"title": "美国", "value": "美国"}, {"title": "日本", "value": "日本"}, {"title": "韩国", "value": "韩国"}, {"title": "英国", "value": "英国"}, {"title": "法国", "value": "法国"}, {"title": "德国", "value": "德国"}, {"title": "西班牙", "value": "西班牙"}, {"title": "泰国", "value": "泰国"}, {"title": "印度", "value": "印度"}], "belongTo": {"paramName": "vod_list", "value": ["欧乐"]}},
                {"name": "欧乐_m2_sort_by", "title": "榜单类型", "type": "enumeration", "value": "hot", "enumOptions": [{"title": "热门综艺", "value": "hot"}, {"title": "高分综艺", "value": "score"}, {"title": "最新综艺", "value": "update"}, {"title": "最近添加", "value": "desc"}], "belongTo": {"paramName": "vod_list", "value": ["欧乐"]}},
                {"name": "欧乐_m2_page", "title": "页码", "type": "page", "startPage": 1, "belongTo": {"paramName": "vod_list", "value": ["欧乐"]}},
                {"name": "欧乐_m3_area", "title": "地区", "type": "enumeration", "value": "0", "enumOptions": [{"title": "全部", "value": "0"}, {"title": "大陆", "value": "大陆"}, {"title": "香港", "value": "香港"}, {"title": "台湾", "value": "台湾"}, {"title": "美国", "value": "美国"}, {"title": "日本", "value": "日本"}, {"title": "韩国", "value": "韩国"}, {"title": "英国", "value": "英国"}, {"title": "法国", "value": "法国"}, {"title": "德国", "value": "德国"}, {"title": "西班牙", "value": "西班牙"}, {"title": "泰国", "value": "泰国"}, {"title": "印度", "value": "印度"}], "belongTo": {"paramName": "vod_list", "value": ["欧乐"]}},
                {"name": "欧乐_m3_sort_by", "title": "榜单类型", "type": "enumeration", "value": "hot", "enumOptions": [{"title": "热门动漫", "value": "hot"}, {"title": "高分动漫", "value": "score"}, {"title": "最新动漫", "value": "update"}, {"title": "最近添加", "value": "desc"}], "belongTo": {"paramName": "vod_list", "value": ["欧乐"]}},
                {"name": "欧乐_m3_page", "title": "页码", "type": "page", "startPage": 1, "belongTo": {"paramName": "vod_list", "value": ["欧乐"]}},
                {"name": "欧乐_m4_area", "title": "地区", "type": "enumeration", "value": "0", "enumOptions": [{"title": "全部", "value": "0"}, {"title": "大陆", "value": "大陆"}, {"title": "香港", "value": "香港"}, {"title": "台湾", "value": "台湾"}, {"title": "美国", "value": "美国"}, {"title": "日本", "value": "日本"}, {"title": "韩国", "value": "韩国"}, {"title": "英国", "value": "英国"}, {"title": "法国", "value": "法国"}, {"title": "德国", "value": "德国"}, {"title": "西班牙", "value": "西班牙"}, {"title": "泰国", "value": "泰国"}, {"title": "印度", "value": "印度"}], "belongTo": {"paramName": "vod_list", "value": ["欧乐"]}},
                {"name": "欧乐_m4_sort_by", "title": "榜单类型", "type": "enumeration", "value": "hot", "enumOptions": [{"title": "热门短剧", "value": "hot"}, {"title": "高分短剧", "value": "score"}, {"title": "最新短剧", "value": "update"}, {"title": "最近添加", "value": "desc"}], "belongTo": {"paramName": "vod_list", "value": ["欧乐"]}},
                {"name": "欧乐_m4_page", "title": "页码", "type": "page", "startPage": 1, "belongTo": {"paramName": "vod_list", "value": ["欧乐"]}},
                {"name": "欧乐_m5_wd", "title": "关键词", "type": "input", "value": "", "belongTo": {"paramName": "vod_list", "value": ["欧乐"]}},
                {"name": "欧乐_m5_pg", "title": "页码", "type": "page", "value": "1", "belongTo": {"paramName": "vod_list", "value": ["欧乐"]}},
                {"name": "欧乐_m6_wd", "title": "关键词", "type": "input", "value": "", "belongTo": {"paramName": "vod_list", "value": ["欧乐"]}},
                {"name": "欧乐_m6_pg", "title": "页码", "type": "page", "value": "1", "belongTo": {"paramName": "vod_list", "value": ["欧乐"]}},
                {"name": "人人_section", "title": "功能分类", "type": "enumeration", "value": "0", "enumOptions": [], "belongTo": {"paramName": "vod_list", "value": ["人人"]}},
                { name: "page", title: "页码", type: "page" }
            ]
        },

        // ---------------- 大栏目 8：二次元全境聚合 ----------------
        {
            title: "🌸 动漫全境聚合",
            functionName: "routeAnimeOmni",
            type: "video",
            cacheDuration: 43200,
            params: [
                {
                    name: "anime_source", title: "选择数据源", type: "enumeration", value: "cal",
                    enumOptions: [
                        { title: "Bangumi 追番日历", value: "cal" },
                        { title: "Bilibili 热度榜单", value: "bili" },
                        { title: "Bangumi 近期热门", value: "hot" },
                        { title: "Bangumi 年季度榜", value: "rank" },
                        { title: "Bangumi 每日放送", value: "daily" },
                        { title: "TMDB 热门/新番", value: "tmdb" },
                        { title: "AniList 流行榜单", value: "anilist" },
                        { title: "MAL 权威榜单", value: "mal" }
                    ]
                },
                { name: "cal_day", title: "选择日期", type: "enumeration", value: "today", belongTo: { paramName: "anime_source", value: ["cal"] }, enumOptions: [ { title: "📅 今日更新", value: "today" }, { title: "周一 (月)", value: "1" }, { title: "周二 (火)", value: "2" }, { title: "周三 (水)", value: "3" }, { title: "周四 (木)", value: "4" }, { title: "周五 (金)", value: "5" }, { title: "周六 (土)", value: "6" }, { title: "周日 (日)", value: "7" } ] },
                { name: "bili_sort", title: "榜单分区", type: "enumeration", value: "1", belongTo: { paramName: "anime_source", value: ["bili"] }, enumOptions: [ { title: "📺 B站番剧 (日漫)", value: "1" }, { title: "🇨🇳 B站国创 (国漫)", value: "4" } ] },
                { name: "hot_cat", title: "分类", type: "enumeration", value: "anime", belongTo: { paramName: "anime_source", value: ["hot"] }, enumOptions: [ { title: "动画", value: "anime" } ] },
                { name: "rank_cat", title: "分类", type: "enumeration", value: "anime", belongTo: { paramName: "anime_source", value: ["rank"] }, enumOptions: [ { title: "动画", value: "anime" }, { title: "三次元", value: "real" } ] },
                { name: "rank_year", title: "年份", type: "enumeration", value: `${currentYear}`, belongTo: { paramName: "anime_source", value: ["rank"] }, enumOptions: yearOptions },
                { name: "rank_month", title: "月份/季度", type: "enumeration", value: "all", belongTo: { paramName: "anime_source", value: ["rank"] }, enumOptions: [ { title: "全年", value: "all" }, { title: "冬季 (1月)", value: "1" }, { title: "春季 (4月)", value: "4" }, { title: "夏季 (7月)", value: "7" }, { title: "秋季 (10月)", value: "10" } ] },
                { name: "rank_sort", title: "排序方式", type: "enumeration", value: "collects", belongTo: { paramName: "anime_source", value: ["rank"] }, enumOptions: [ { title: "排名", value: "rank" }, { title: "热度", value: "trends" }, { title: "收藏数", value: "collects" }, { title: "发售日期", value: "date" }, { title: "名称", value: "title" } ] },
                { name: "daily_filter", title: "筛选范围", type: "enumeration", value: "today", belongTo: { paramName: "anime_source", value: ["daily"] }, enumOptions: [ { title: "今日放送", value: "today" }, { title: "指定单日", value: "specific_day" }, { title: "本周一至四", value: "mon_thu" }, { title: "本周五至日", value: "fri_sun" }, { title: "整周放送", value: "all_week" } ] },
                { name: "daily_weekday", title: "指定单日星期", type: "enumeration", value: "1", belongTo: { paramName: "anime_source", value: ["daily"] }, enumOptions: [ { title: "星期一", value: "1" }, { title: "星期二", value: "2" }, { title: "星期三", value: "3" }, { title: "星期四", value: "4" }, { title: "星期五", value: "5" }, { title: "星期六", value: "6" }, { title: "星期日", value: "7" } ] },
                { name: "daily_sort", title: "排序方式", type: "enumeration", value: "popularity_rat_bgm", belongTo: { paramName: "anime_source", value: ["daily"] }, enumOptions: [ { title: "热度(评分人数)", value: "popularity_rat_bgm" }, { title: "评分", value: "score_bgm_desc" }, { title: "放送日(更新日期)", value: "airdate_desc" }, { title: "默认", value: "default" } ] },
                { name: "tmdb_sort", title: "榜单类型", type: "enumeration", value: "trending", belongTo: { paramName: "anime_source", value: ["tmdb"] }, enumOptions: [ { title: "🔥 实时流行 (Trending)", value: "trending" }, { title: "📅 最新首播 (New)", value: "new" }, { title: "👑 高分神作 (Top Rated)", value: "top" } ] },
                { name: "anilist_sort", title: "排序方式", type: "enumeration", value: "TRENDING_DESC", belongTo: { paramName: "anime_source", value: ["anilist"] }, enumOptions: [ { title: "📈 近期趋势 (Trending)", value: "TRENDING_DESC" }, { title: "💖 历史人气 (Popularity)", value: "POPULARITY_DESC" }, { title: "⭐ 评分最高 (Score)", value: "SCORE_DESC" } ] },
                { name: "mal_sort", title: "榜单类型", type: "enumeration", value: "airing", belongTo: { paramName: "anime_source", value: ["mal"] }, enumOptions: [ { title: "🔥 当前热播 Top", value: "airing" }, { title: "🏆 历史总榜 Top", value: "all" }, { title: "🎥 最佳剧场版", value: "movie" }, { title: "🔜 即将上映", value: "upcoming" } ] },
                { name: "page", title: "页码", type: "page" }
            ]
        },

        // ---------------- 大栏目 3：全能电影榜 ----------------
        {
            title: "🎬 全能电影榜单",
            functionName: "routeMovieOmni",
            type: "video",
            cacheDuration: 43200,
            params: [
                {
                    name: "movie_source", title: "榜单模式", type: "enumeration", value: "general",
                    enumOptions: [
                        { title: "🔥 电影综合榜", value: "general" },
                        { title: "🏆 年度最佳电影", value: "yearly" },
                        { title: "🏷️ 按类型探索", value: "genre" }
                    ]
                },
                { name: "general_sort", title: "榜单分类", type: "enumeration", value: "popular", belongTo: { paramName: "movie_source", value: ["general"] }, enumOptions: [ { title: "🔥 流行趋势 (Popular)", value: "popular" }, { title: "⭐️ 历史高分 (Top Rated)", value: "top_rated" }, { title: "💰 全球票房榜 (Box Office)", value: "box_office" }, { title: "🏆 奥斯卡佳片 (Oscar)", value: "oscar" } ] },
                { name: "yearly_sort", title: "选择年份", type: "enumeration", value: "2024", belongTo: { paramName: "movie_source", value: ["yearly"] }, enumOptions: [ { title: "2025年 最佳", value: "2025" }, { title: "2024年 最佳", value: "2024" }, { title: "2023年 最佳", value: "2023" }, { title: "2022年 最佳", value: "2022" }, { title: "2021年 最佳", value: "2021" }, { title: "2020年 最佳", value: "2020" }, { title: "2019年 最佳", value: "2019" }, { title: "2018年 最佳", value: "2018" }, { title: "2017年 最佳", value: "2017" }, { title: "2016年 最佳", value: "2016" }, { title: "2015年 最佳", value: "2015" } ] },
                { name: "genre_sort", title: "选择类型", type: "enumeration", value: "878", belongTo: { paramName: "movie_source", value: ["genre"] }, enumOptions: [ { title: "🛸 科幻 (Sci-Fi)", value: "878" }, { title: "🎭 剧情 (Drama)", value: "18" }, { title: "🤯 悬疑 (Mystery)", value: "9648" }, { title: "💥 动作 (Action)", value: "28" }, { title: "😂 喜剧 (Comedy)", value: "35" }, { title: "❤️ 爱情 (Romance)", value: "10749" }, { title: "👻 恐怖 (Horror)", value: "27" }, { title: "🔪 犯罪 (Crime)", value: "80" }, { title: "🧙‍♂️ 奇幻 (Fantasy)", value: "14" }, { title: "🦄 动画 (Animation)", value: "16" } ] },
                { name: "page", title: "页码", type: "page", startPage: 1 }
            ]
        },

        // ---------------- 大栏目 2：全球影剧类别 ----------------
        {
            title: "🏷️ 全球影剧类别",
            functionName: "loadGenreRank",
            type: "video",
            cacheDuration: 43200,
            params: [
                { name: "sort_by", title: "影视类型", type: "enumeration", value: "all", enumOptions: [ { title: "🌟 全部 (影+剧混合)", value: "all" }, { title: "🎬 电影 (Movie)", value: "movie" }, { title: "📺 电视剧 (TV)", value: "tv" } ] },
                { name: "genre", title: "题材流派", type: "enumeration", value: "all", enumOptions: [ { title: "🌟 全部题材 (All)", value: "all" }, { title: "🛸 科幻 (Sci-Fi)", value: "scifi" }, { title: "🔍 悬疑 (Mystery)", value: "mystery" }, { title: "👻 恐怖 (Horror)", value: "horror" }, { title: "🔪 犯罪 (Crime)", value: "crime" }, { title: "💥 动作 (Action)", value: "action" }, { title: "😂 喜剧 (Comedy)", value: "comedy" }, { title: "❤️ 爱情 (Romance)", value: "romance" }, { title: "🎭 剧情 (Drama)", value: "drama" }, { title: "🐉 奇幻 (Fantasy)", value: "fantasy" }, { title: "🎨 动画 (Animation)", value: "animation" }, { title: "🎥 纪录片 (Documentary)", value: "documentary" } ] },
                { name: "region", title: "国家/地区", type: "enumeration", value: "all", enumOptions: [ { title: "🌍 全球 (所有国家)", value: "all" }, { title: "🇨🇳 中国大陆", value: "cn" }, { title: "🇭🇰 中国香港", value: "hk" }, { title: "🇹🇼 中国台湾", value: "tw" }, { title: "🏮 港台 (香港+台湾)", value: "hktw" }, { title: "🇯🇵 日本", value: "jp" }, { title: "🇰🇷 韩国", value: "kr" }, { title: "🌸 日韩合集", value: "jpkr" }, { title: "🇹🇭 泰国", value: "th" }, { title: "🇸🇬 新加坡", value: "sg" }, { title: "🇲🇾 马来西亚", value: "my" }, { title: "🇮🇳 印度", value: "in" }, { title: "🌏 亚太大区", value: "apac" }, { title: "🇺🇸 美国", value: "us" }, { title: "🇬🇧 英国", value: "gb" }, { title: "🇩🇪 德国", value: "de" }, { title: "🇸🇪 瑞典", value: "se" }, { title: "🇪🇺 欧洲全境", value: "europe" }, { title: "🇪🇸 西班牙", value: "es" }, { title: "🇲🇽 墨西哥", value: "mx" }, { title: "💃 西语/拉丁美洲", value: "latin" } ] },
                { name: "order_rule", title: "排序规则", type: "enumeration", value: "popularity", enumOptions: [ { title: "🔥 热门趋势", value: "popularity" }, { title: "⭐ 评分最高", value: "rating" }, { title: "📅 最新上线", value: "time" } ] },
                { name: "page", title: "页码", type: "page", startPage: 1 }
            ]
        },


        // ---------------- 全球影视专区 ----------------
// ================= 模块 1：全球探索发现 =================
        {
            title: "🌍 全球探索发现",
            functionName: "loadGlobalZoneList",
            type: "video", // 保留你需要的自适应排版
            cacheDuration: 43200,
            params: [
                {
                    name: "region",
                    title: "选择国家/地区",
                    type: "enumeration",
                    value: "CN",
                    enumOptions: [
                        { title: "🇨🇳 大陆 (Mainland China)", value: "CN" },
                        { title: "🇭🇰 香港 (Hong Kong)", value: "HK" },
                        { title: "🇹🇼 台湾 (Taiwan)", value: "TW" },
                        { title: "🇺🇸 美国 (United States)", value: "US" },
                        { title: "🇬🇧 英国 (United Kingdom)", value: "GB" },
                        { title: "🇯🇵 日本 (Japan)", value: "JP" },
                        { title: "🇰🇷 韩国 (South Korea)", value: "KR" },
                        { title: "🇪🇺 欧洲综合 (法/德/意/荷)", value: "EU" },
                        { title: "💃 西语世界 (西班牙/拉美)", value: "ES_LANG" },
                        { title: "🇲🇽 墨西哥 (Mexico)", value: "MX" },
                        { title: "🇸🇪 瑞典 (Sweden)", value: "SE" },
                        { title: "🇮🇳 印度 (India)", value: "IN" },
                        { title: "🇹🇭 泰国 (Thailand)", value: "TH" }
                    ]
                },
                {
                    name: "mediaType",
                    title: "影视类型",
                    type: "enumeration",
                    value: "all",
                    enumOptions: [
                        { title: "🌟 全部 (影+剧混合)", value: "all" },
                        { title: "🎬 仅看电影 (Movie)", value: "movie" },
                        { title: "📺 仅看剧集 (TV)", value: "tv" }
                    ]
                },
                {
                    // 👉 关键修复：改为 sort_by
                    name: "sort_by",
                    title: "排序榜单",
                    type: "enumeration",
                    value: "hot",
                    enumOptions: [
                        { title: "🔥 近期热播榜", value: "hot" },
                        { title: "🆕 最新上线榜", value: "new" },
                        { title: "🏆 历史高分榜", value: "top" }
                    ]
                },
                { name: "page", title: "页码", type: "page", startPage: 1 }
            ]
        },
        // ---------------- 大栏目 4：全球综艺频道 ----------------
        {
            title: "📺 全球综艺频道",
            functionName: "loadVarietyShows",
            type: "video",
            cacheDuration: 43200,
            params: [
                {
                    name: "sort_by", title: "国家/地区", type: "enumeration", value: "cn",
                    enumOptions: [
                        { title: "🇨🇳 中国大陆", value: "cn" },
                        { title: "🇰🇷 韩国", value: "kr" },
                        { title: "🇯🇵 日本", value: "jp" },
                        { title: "🇹🇼 中国台湾", value: "tw" },
                        { title: "🇭🇰 中国香港", value: "hk" },
                        { title: "🇺🇸 欧美综合", value: "eu_us" },
                        { title: "🌍 全球综合", value: "all" }
                    ]
                },
                {
                    name: "list_type", title: "排播与榜单", type: "enumeration", value: "hot",
                    enumOptions: [
                        { title: "🔥 近期热播 (Hot)", value: "hot" },
                        { title: "📅 今日更新 (Today)", value: "today" },
                        { title: "🔜 明日预告 (Tomorrow)", value: "tomorrow" },
                        { title: "📈 流行趋势 (5年内热榜)", value: "trend" },
                        { title: "⭐ 高分神级 (Top Rated)", value: "top" }
                    ]
                },
                { name: "page", title: "页码", type: "page", startPage: 1 }
            ]
        },

        // ---------------- 大栏目 6：平台分流片库 ----------------
        {
            title: "🔀 平台分流片库",
            functionName: "loadPlatformFlowHub",
            type: "video", 
            cacheDuration: 43200,
            params: [
                {
                    name: "platform_flow_source", title: "选择子列表", type: "enumeration", value: "matrix", enumOptions: [ { title: "平台分流片库", value: "matrix" }, { title: "独家原创 & 追更日历", value: "originals" } ] },
                { name: "sort_by", title: "内容分类", type: "enumeration", value: "tv_drama", belongTo: { paramName: "platform_flow_source", value: ["matrix"] },
                    enumOptions: [ 
                        { title: "📺 电视剧", value: "tv_drama" }, 
                        { title: "🎤 综艺", value: "tv_variety" }, 
                        { title: "🐲 动漫", value: "tv_anime" }, 
                        { title: "🎬 电影", value: "movie" } 
                    ]
                },
                {
                    name: "platform", title: "播出平台", type: "enumeration", value: "2007", belongTo: { paramName: "platform_flow_source", value: ["matrix"] },
                    enumOptions: [
                        { title: "腾讯视频", value: "2007" }, { title: "爱奇艺", value: "1330" }, { title: "优酷", value: "1419" }, { title: "芒果TV", value: "1631" }, { title: "Bilibili", value: "1605" }, { title: "Netflix", value: "213" }, { title: "Disney+", value: "2739" }, { title: "HBO", value: "49" }, { title: "Apple TV+", value: "2552" }
                    ]
                },
                {
                    name: "sort", title: "排序", type: "enumeration", value: "popularity.desc", belongTo: { paramName: "platform_flow_source", value: ["matrix"] },
                    enumOptions: [ { title: "🔥 热度最高", value: "popularity.desc" }, { title: "📅 最新首播", value: "first_air_date.desc" }, { title: "⭐ 评分最高", value: "vote_average.desc" } ]
                },
                { name: "page", title: "页码", type: "page", startPage: 1, belongTo: { paramName: "platform_flow_source", value: ["matrix"] } },
                { name: "global_platform", title: "选择频道/平台", type: "enumeration", value: "netflix", belongTo: { paramName: "platform_flow_source", value: ["global"] }, enumOptions: [ { title: "🌟 全球综合热播", value: "all" }, { title: "🔴 Netflix (网飞)", value: "netflix" }, { title: "🟣 HBO", value: "hbo" }, { title: "🔵 Disney+", value: "disney" }, { title: "🍏 Apple TV+", value: "apple" }, { title: "📦 Amazon Prime", value: "amazon" }, { title: "🐧 腾讯视频", value: "tencent" }, { title: "🥝 爱奇艺", value: "iqiyi" }, { title: "👖 优酷", value: "youku" }, { title: "🥭 芒果TV", value: "mango" }, { title: "📺 BiliBili", value: "bilibili" }, { title: "📡 湖南卫视", value: "hunan" }, { title: "📡 浙江卫视", value: "zhejiang" }, { title: "📡 东方卫视", value: "dragon" }, { title: "📡 CCTV-8", value: "cctv8" }, { title: "🇭🇰 ViuTV", value: "viutv" }, { title: "🇹🇼 LINE TV", value: "linetv" }, { title: "🇹🇼 Hami Video", value: "hami" }, { title: "🇹🇼 CATCHPLAY", value: "catchplay" }, { title: "🇰🇷 tvN", value: "tvn" }, { title: "🇰🇷 SBS", value: "sbs" }, { title: "🇰🇷 KBS2", value: "kbs2" }, { title: "🇺🇸 ABC", value: "abc" }, { title: "🌍 国家地理频道", value: "natgeo" } ] },
                { name: "global_page", title: "页码", type: "page", belongTo: { paramName: "platform_flow_source", value: ["global"] } },
                { name: "original_platform", title: "出品平台", type: "enumeration", value: "213", belongTo: { paramName: "platform_flow_source", value: ["originals"] }, enumOptions: [ { title: "Netflix (网飞)", value: "213" }, { title: "HBO (Max)", value: "49" }, { title: "Apple TV+", value: "2552" }, { title: "Disney+", value: "2739" }, { title: "Amazon Prime", value: "1024" }, { title: "Hulu", value: "453" }, { title: "Peacock", value: "3353" }, { title: "Paramount+", value: "4330" }, { title: "腾讯视频", value: "2007" }, { title: "爱奇艺", value: "1330" }, { title: "Bilibili (B站)", value: "1605" }, { title: "优酷视频", value: "1419" }, { title: "芒果TV", value: "1631" }, { title: "TVING (韩)", value: "4096" } ] },
                { name: "original_contentType", title: "内容类型", type: "enumeration", value: "tv", belongTo: { paramName: "platform_flow_source", value: ["originals"] }, enumOptions: [ { title: "📺 剧集 (默认)", value: "tv" }, { title: "🎬 电影", value: "movie" }, { title: "🌸 动漫/动画", value: "anime" }, { title: "🎤 综艺/真人秀", value: "variety" } ] },
                { name: "original_sortBy", title: "排序与功能", type: "enumeration", value: "popularity.desc", belongTo: { paramName: "platform_flow_source", value: ["originals"] }, enumOptions: [ { title: "🔥 综合热度", value: "popularity.desc" }, { title: "⭐ 最高评分", value: "vote_average.desc" }, { title: "🆕 最新首播", value: "first_air_date.desc" }, { title: "📅 按更新时间 (追更模式)", value: "next_episode" }, { title: "📆 今日播出 (每日榜单)", value: "daily_airing" } ] },
                { name: "page", title: "页码", type: "page", belongTo: { paramName: "platform_flow_source", value: ["originals"] } }
            ]
        },

        // ---------------- 大栏目 8：全球影视平台 ----------------
        {
            title: "🌐 全球影视平台",
            description: "全网频道与流媒体平台聚合",
            functionName: "loadGlobalNetworkPlatform",
            type: "video",
            cacheDuration: 43200,
            params: [
                { name: "global_source", title: "选择子列表", type: "enumeration", value: "platform", enumOptions: [
                    { title: "🌐 全球影视平台", value: "platform" }, { title: "🔥 分流聚合（防风控版）", value: "diversion" }
                ] },
                { name: "sort_by", title: "选择频道/平台", type: "enumeration", belongTo: { paramName: "global_source", value: ["platform"] }, value: "netflix", enumOptions: [
                    { title: "🌟 全球综合热播", value: "all" }, { title: "🔴 Netflix", value: "netflix" }, { title: "🟣 HBO", value: "hbo" }, { title: "🔵 Disney+", value: "disney" }, { title: "🍏 Apple TV+", value: "apple" }, { title: "📦 Amazon Prime", value: "amazon" }, { title: "🐧 腾讯视频", value: "tencent" }, { title: "🥝 爱奇艺", value: "iqiyi" }, { title: "👖 优酷", value: "youku" }, { title: "🥭 芒果TV", value: "mango" }, { title: "📺 BiliBili", value: "bilibili" }, { title: "📡 湖南卫视", value: "hunan" }, { title: "📡 浙江卫视", value: "zhejiang" }, { title: "📡 东方卫视", value: "dragon" }, { title: "📡 CCTV-8", value: "cctv8" }, { title: "🇭🇰 ViuTV", value: "viutv" }, { title: "🇹🇼 LINE TV", value: "linetv" }, { title: "🇹🇼 Hami Video", value: "hami" }, { title: "🇹🇼 CATCHPLAY", value: "catchplay" }, { title: "🇰🇷 tvN", value: "tvn" }, { title: "🇰🇷 SBS", value: "sbs" }, { title: "🇰🇷 KBS2", value: "kbs2" }, { title: "🇺🇸 ABC", value: "abc" }, { title: "🌍 国家地理频道", value: "natgeo" }
                ] },
                { name: "mediaType", title: "影视分类", type: "enumeration", value: "tv", enumOptions: [
                    { title: "📺 剧集", value: "tv" }, { title: "🎬 电影", value: "movie" }, { title: "🐰 动漫", value: "anime" }, { title: "🎤 综艺", value: "variety" }
                ] },
                { name: "sortBy", title: "排序方式", type: "enumeration", value: "hot", enumOptions: [
                    { title: "🔥 平台热度榜", value: "hot" }, { title: "🆕 最新上线榜", value: "new" }, { title: "🏆 TMDB高分榜", value: "top" }
                ] },
                { name: "page", title: "页码", type: "page", startPage: 1, belongTo: { paramName: "global_source", value: ["platform"] } },
                { name: "diversion_list", title: "分流子列表", type: "enumeration", belongTo: { paramName: "global_source", value: ["diversion"] }, value: "trend", enumOptions: [
                    { title: "🔥 全球热榜聚合", value: "trend" }, { title: "📺 平台分流片库", value: "matrix" }
                ] },
                { name: "diversion_sort_by", title: "选择榜单", type: "enumeration", belongTo: { paramName: "diversion_list", value: ["trend"] }, value: "trakt_trending", enumOptions: [
                    { title: "🌍 Trakt - 实时热播", value: "trakt_trending" }, { title: "🌍 Trakt - 最受欢迎", value: "trakt_popular" }, { title: "🌍 Trakt - 最受期待", value: "trakt_anticipated" }, { title: "🇨🇳 豆瓣 - 热门国产剧", value: "db_tv_cn" }, { title: "🇨🇳 豆瓣 - 热门综艺", value: "db_variety" }, { title: "🇨🇳 豆瓣 - 热门电影", value: "db_movie" }, { title: "🇺🇸 豆瓣 - 热门美剧", value: "db_tv_us" }, { title: "📺 B站 - 番剧热播", value: "bili_bgm" }, { title: "📺 B站 - 国创热播", value: "bili_cn" }, { title: "🌸 Bangumi - 每日放送", value: "bgm_daily" }
                ] },
                { name: "diversion_traktType", title: "Trakt 类型", type: "enumeration", belongTo: { paramName: "diversion_sort_by", value: ["trakt_trending", "trakt_popular", "trakt_anticipated"] }, value: "all", enumOptions: [
                    { title: "全部 (剧集+电影)", value: "all" }, { title: "剧集", value: "shows" }, { title: "电影", value: "movies" }
                ] },
                { name: "diversion_matrix_platform", title: "播出平台", type: "enumeration", belongTo: { paramName: "diversion_list", value: ["matrix"] }, value: "2007", enumOptions: [
                    { title: "腾讯视频", value: "2007" }, { title: "爱奇艺", value: "1330" }, { title: "优酷", value: "1419" }, { title: "芒果TV", value: "1631" }, { title: "Bilibili", value: "1605" }, { title: "Netflix", value: "213" }, { title: "Disney+", value: "2739" }, { title: "HBO", value: "49" }, { title: "Apple TV+", value: "2552" }
                ] },
                { name: "diversion_category", title: "内容分类", type: "enumeration", belongTo: { paramName: "diversion_list", value: ["matrix"] }, value: "tv_drama", enumOptions: [
                    { title: "📺 电视剧", value: "tv_drama" }, { title: "🎤 综艺", value: "tv_variety" }, { title: "🐲 动漫", value: "tv_anime" }, { title: "🎬 电影", value: "movie" }
                ] },
                { name: "diversion_sort", title: "排序", type: "enumeration", belongTo: { paramName: "diversion_list", value: ["matrix"] }, value: "popularity.desc", enumOptions: [
                    { title: "🔥 热度最高", value: "popularity.desc" }, { title: "📅 最新首播", value: "first_air_date.desc" }, { title: "⭐ 评分最高", value: "vote_average.desc" }
                ] },
                { name: "diversion_page", title: "页码", type: "page", belongTo: { paramName: "global_source", value: ["diversion"] } }
            ]
        },

        // ---------------- 大栏目 9：串流平台TOP10 (FlixPatrol) ----------------
        {
            title: "🥇 流媒体TOP10",
            functionName: "loadOfficialTop10",
            type: "video", 
            cacheDuration: 43200,
            params: [
                {
                    name: "sort_by", title: "榜单地区", type: "enumeration", value: "united-states",
                    enumOptions: [
                        { title: "🇺🇸 美国", value: "united-states" }, { title: "🇰🇷 韩国", value: "south-korea" }, { title: "🇹🇼 台湾", value: "taiwan" }, { title: "🇭🇰 香港", value: "hong-kong" }, { title: "🇯🇵 日本", value: "japan" }, { title: "🇬🇧 英国", value: "united-kingdom" }, { title: "🌍 全球", value: "world" }
                    ]
                },
                {
                    name: "platform", title: "流媒体平台", type: "enumeration", value: "netflix",
                    enumOptions: [
                        { title: "Netflix", value: "netflix" }, { title: "HBO", value: "hbo" }, { title: "Disney+", value: "disney" }, { title: "Apple TV+", value: "apple-tv" }, { title: "Amazon Prime", value: "amazon-prime" }
                    ]
                },
                {
                    name: "mediaType", title: "榜单类型", type: "enumeration", value: "tv",
                    enumOptions: [ { title: "📺 剧集 (TV Shows)", value: "tv" }, { title: "🎬 电影 (Movies)", value: "movie" } ]
                },
                { name: "page", title: "页码", type: "page", startPage: 1 }
            ]
        },

        // ---------------- 大栏目 5：影剧流行风向（独立入口，右上角独立榜单菜单） ----------------
        { title: "🔥 TMDB热门趋势", functionName: "loadTmdbTrendEntry", type: "video", cacheDuration: 43200, params: [
            { name: "tmdb_mode", title: "模式", type: "enumeration", value: "trend", enumOptions: [ { title: "热门趋势", value: "trend" }, { title: "电影热榜", value: "movie_hot" }, { title: "剧集热榜", value: "tv_hot" }, { title: "电影筛选", value: "movie" }, { title: "剧集筛选", value: "tv" }, { title: "全部 (电影+剧集)", value: "all_hot" } ] },
            { name: "sort_by", title: "地区", type: "enumeration", value: "", enumOptions: [{ title: "全部地区", value: "" }, { title: "中国", value: "CN" }, { title: "美国", value: "US" }, { title: "韩国", value: "KR" }, { title: "日本", value: "JP" }, { title: "英国", value: "GB" }, { title: "中国香港", value: "HK" }, { title: "中国台湾", value: "TW" }, { title: "泰国", value: "TH" }, { title: "意大利", value: "IT" }, { title: "德国", value: "DE" }, { title: "西班牙", value: "ES" }, { title: "俄罗斯", value: "RU" }, { title: "瑞典", value: "SE" }, { title: "巴西", value: "BR" }, { title: "丹麦", value: "DK" }, { title: "印度", value: "IN" }, { title: "加拿大", value: "CA" }, { title: "爱尔兰", value: "IE" }, { title: "澳大利亚", value: "AU" }] },
            { name: "genre", title: "类型", type: "enumeration", value: "", enumOptions: [ { title: "全部", value: "" }, { title: "动作/冒险", value: "28" }, { title: "科幻/奇幻", value: "878" }, { title: "剧情", value: "18" }, { title: "喜剧", value: "35" }, { title: "动画", value: "16" }, { title: "悬疑/犯罪", value: "9648" }, { title: "恐怖/惊悚", value: "27" }, { title: "爱情", value: "10749" } ] },
            { name: "year", title: "年份", type: "input", value: "", description: "例如: 2024" },
            { name: "tmdb_sort", title: "排序", type: "enumeration", value: "popularity.desc", enumOptions: [ { title: "🔥 热度最高", value: "popularity.desc" }, { title: "⭐️ 评分最高", value: "vote_average.desc" }, { title: "🆕 最新上映", value: "primary_release_date.desc" } ] },
            { name: "page", title: "页码", type: "page", startPage: 1 } ] },
        { title: "🟡 IMDb权威榜单", functionName: "loadImdbTrendEntry", type: "video", cacheDuration: 43200, params: [
            { name: "sort_by", title: "IMDb榜单", type: "enumeration", value: "trending_week", enumOptions: [{ title: "本周热榜", value: "trending_week" }, { title: "今日热榜", value: "trending_day" }, { title: "流行趋势", value: "popular" }, { title: "高分神作", value: "top_rated" }, { title: "国产剧热度", value: "china_tv" }, { title: "国产电影热度", value: "china_movie" }] },
            { name: "mediaType", title: "范围", type: "enumeration", value: "all", enumOptions: [ { title: "全部 (剧集+电影)", value: "all" }, { title: "电影", value: "movie" }, { title: "剧集", value: "tv" } ] },
            { name: "page", title: "页码", type: "page", startPage: 1 } ] },
        { title: "🍅 烂番茄风向标", functionName: "loadRtTrendEntry", type: "video", cacheDuration: 43200, params: [
            { name: "sort_by", title: "烂番茄 榜单", type: "enumeration", value: "rt_movies_home", enumOptions: [{ title: "🎬 流媒体热映", value: "rt_movies_home" }, { title: "🍿 院线热映", value: "rt_movies_theater" }, { title: "💎 最佳流媒体", value: "rt_movies_best" }, { title: "📺 热门剧集", value: "rt_tv_popular" }, { title: "🆕 最新上线", value: "rt_tv_new" }] },
            { name: "page", title: "页码", type: "page", startPage: 1 } ] },
        { title: "🌍 Trakt趋势榜", functionName: "loadTraktTrendEntry", type: "video", cacheDuration: 43200, params: [
            { name: "sort_by", title: "Trakt榜单", type: "enumeration", value: "trending", enumOptions: [{ title: "实时热播", value: "trending" }, { title: "最受欢迎", value: "popular" }, { title: "最受期待", value: "anticipated" }] },
            { name: "traktType", title: "Trakt类型", type: "enumeration", value: "all", enumOptions: [ { title: "全部", value: "all" }, { title: "剧集", value: "shows" }, { title: "电影", value: "movies" } ] },
            { name: "page", title: "页码", type: "page", startPage: 1 } ] },
        { title: "🟢 豆瓣国内风向", functionName: "loadDoubanTrendEntry", type: "video", cacheDuration: 43200, params: [
            {
                name: "sort_by", title: "豆瓣 榜单", type: "enumeration", value: "db_tv_cn",
                enumOptions: [
                    { value: "db_tv_cn", title: "热门国产剧" }, { value: "db_variety", title: "热门综艺" }, { value: "db_movie", title: "热门电影" }, { value: "db_tv_us", title: "热门美剧" }, { value: "tv_american", title: "英美剧" }, { value: "tv_korean", title: "韩剧" }, { value: "tv_japanese", title: "日剧" }, { value: "tv_domestic", title: "国产剧" }, { value: "movie_weekly", title: "一周口碑电影" }, { value: "movie_top250", title: "豆瓣 Top250" }, { value: "custom_movie_hot", title: "豆瓣电影实时热榜" }, { value: "custom_tv_hot", title: "豆瓣剧集实时热榜" }, { value: "custom_subject_hot", title: "豆瓣书影音实时热榜" }, { value: "custom_tv_chinese", title: "华语口碑剧集榜" }, { value: "custom_tv_global", title: "全球口碑剧集榜" }, { value: "custom_show_domestic", title: "国内热播综艺" }, { value: "custom_show_foreign", title: "国外热播综艺" }, { value: "custom_movie_showing", title: "当地影院热映" }, { value: "custom_tv_animation", title: "热门动画" }, { value: "custom_url", title: "自定义URL" }
                ]
            },
            {
                name: "mediaType", title: "范围", type: "enumeration", value: "all",
                enumOptions: [ { title: "全部 (剧集+电影)", value: "all" }, { title: "电影", value: "movie" }, { title: "剧集", value: "tv" } ]
            },
            {
                name: "custom_douban_url", title: "片单地址", type: "input", value: "",
                description: "输入豆瓣片单网址，支持 doulist、subject_collection 或豆瓣 App dispatch 地址",
                belongTo: { paramName: "sort_by", value: ["custom_url"] }
            },
            { name: "page", title: "页码", type: "page", startPage: 1 } ] },

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
    const baseQuery = {
        language: "zh-CN",
        include_adult: false,
        include_null_first_air_dates: false,
        "first_air_date.gte": start,
        "first_air_date.lte": end,
        sort_by: "first_air_date.asc"
    };
    try {
        const pages = await Promise.all([1, 2, 3, 4, 5, 6, 7, 8].map(p =>
            Widget.tmdb.get("/discover/tv", { params: { ...baseQuery, page: p } })
        ));
        const seen = new Set();
        const blockedGenreIds = [16, 99, 10763, 10770]; // 动画/纪录片/新闻/电视电影
        const blockedTitleWords = [
            "TikTok", "Talent", "Kevin", "Langue", "Mesa", "Cristina", "Botched", "Kolonihaver",
            "Quel est", "Got Talent", "Locker Diaries", "Samson", "Karlchen", "Joy of Life"
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
            if (genres.some(id => blockedGenreIds.includes(id))) return;
            if (isVariety && !countries.includes("CN")) return;
            if (!item.poster_path) return;
            if (blockedTitleWords.some(w => title.toLowerCase().includes(w.toLowerCase()))) return;
            items.push(item);
        }));
        items.sort((a, b) => String(a.first_air_date || "").localeCompare(String(b.first_air_date || "")) || ((b.popularity || 0) - (a.popularity || 0)));
        return items.slice((page - 1) * 20, page * 20).map(item => buildUpcomingItem(item, "tv")).filter(Boolean);
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
async function loadDoubanTrendEntry(params = {}) {
    const sortBy = params.sort_by || "db_tv_cn";
    const page = params.page || 1;
    if (sortBy === "db_tv_cn") return await fetchDoubanAndMap("国产剧", "tv", page);
    if (sortBy === "db_variety") return await fetchDoubanAndMap("综艺", "tv", page);
    if (sortBy === "db_movie") return await fetchDoubanAndMap("热门", "movie", page);
    if (sortBy === "db_tv_us") return await fetchDoubanAndMap("美剧", "tv", page);
    if (sortBy === "custom_url") return await loadLiteCustomDouban(params);
    return await loadDoubanModule({ sort_by: sortBy, page });
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
    "action": { movie: "28", tv: "10759" }, "comedy": { movie: "35", tv: "35" }, "romance": { movie: "10749", tv: "10749" }, "drama": { movie: "18", tv: "18" }, "fantasy": { movie: "14", tv: "10765" }, "animation": { movie: "16", tv: "16" }, "documentary": { movie: "99", tv: "99" }
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

async function loadGenreRank(params = {}) {
    const page = parseInt(params.page) || 1;
    const mediaType = params.sort_by || "all"; 
    const genre = params.genre || "all"; 
    const region = params.region || "all"; 
    const sort_rule = params.order_rule || "popularity";

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

async function loadVarietyShows(params = {}) {
    const page = parseInt(params.page) || 1;
    const region = params.sort_by || "cn";
    const list_type = params.list_type || "hot";

    const varietyGenres = "10764|10767";

    const varietyRegionMap = {
        "all": "", "cn": "CN", "kr": "KR", "jp": "JP",
        "tw": "TW", "hk": "HK", "eu_us": "US|GB|DE|FR|IT|ES|CA|AU"
    };
    const originCountry = varietyRegionMap[region] || "";

    let queryParams = { language: "zh-CN", page: page, with_genres: varietyGenres, include_adult: false };
    if (originCountry) queryParams.with_origin_country = originCountry;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    let tmrw = new Date(now); tmrw.setDate(tmrw.getDate() + 1);
    const tomorrowStr = tmrw.toISOString().split('T')[0];
    let fiveYearsAgo = new Date(now); fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    const fiveYearsAgoStr = fiveYearsAgo.toISOString().split('T')[0];

    if (list_type === "today") {
        queryParams.sort_by = "popularity.desc"; queryParams["air_date.gte"] = todayStr; queryParams["air_date.lte"] = todayStr;
    } else if (list_type === "tomorrow") {
        queryParams.sort_by = "popularity.desc"; queryParams["air_date.gte"] = tomorrowStr; queryParams["air_date.lte"] = tomorrowStr;
    } else if (list_type === "hot") {
        queryParams.sort_by = "popularity.desc";
    } else if (list_type === "trend") {
        queryParams.sort_by = "popularity.desc"; queryParams["first_air_date.gte"] = fiveYearsAgoStr; 
    } else if (list_type === "top") {
        queryParams.sort_by = "vote_average.desc"; queryParams["vote_count.gte"] = 15; 
    }

    try {
        const res = await Widget.tmdb.get("/discover/tv", { params: queryParams });
        const items = res.results || [];
        if (items.length === 0) return page === 1 ? [{ id: "empty", type: "text", title: "暂无综艺数据" }] : [];
        return items.map(item => {
            const date = item.release_date || item.first_air_date || ""; 
            let genreLabel = getGlobalGenreText(item.genre_ids);
            if (genreLabel === "影视") genreLabel = "综艺";
            return {
                id: String(item.id), tmdbId: parseInt(item.id), type: "tmdb", mediaType: "tv", title: item.title || item.name,
                genreTitle: genreLabel, releaseDate: date, 
                subTitle: `${date ? date.substring(0, 4) : "未知"}`, 
                description: `${date}\n${item.overview || "暂无简介"}`,
                posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "", 
                backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : ""
            };
        });
    } catch (e) { return [{ id: "err", type: "text", title: "加载失败" }]; }
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
        const res = await Widget.http.get(`https://api.trakt.tv/${type}/${list}?limit=15&page=${page}`, { headers: { "Content-Type": "application/json", "trakt-api-version": "2", "trakt-api-key": id } });
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
}

async function searchTmdbForDouban(query, type) {
    const q = query.replace(/第[一二三四五六七八九十\d]+[季章]/g, "").trim();
    try {
        const res = await Widget.tmdb.get(`/search/${type}`, { params: { query: encodeURIComponent(q), language: "zh-CN" } });
        return (res.results || [])[0];
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
                posterPath: item.cover 
            };
            const tmdb = await searchTmdbForDouban(item.title, type);
            if (tmdb) mergeDoubanTmdb(finalItem, tmdb); 
            return finalItem;
        });
        return await Promise.all(promises);
    } catch (e) { 
        return [{ id: "err", type: "text", title: "豆瓣拒绝了请求", description: "网络IP被豆瓣限制，请切换流量(4G/5G)或更换节点。" }]; 
    }
}

async function loadPlatformMatrix(params = {}) {
    const category = params.sort_by || "tv_drama";
    const platformId = params.platform || "2007";
    const sort = params.sort || "popularity.desc";
    const page = params.page || 1;

    const foreignPlatforms = ["213", "2739", "49", "2552"];
    if (category === "movie" && !foreignPlatforms.includes(platformId)) return page === 1 ? [{ id: "empty", type: "text", title: "暂不支持国内平台电影", description: "请切换为剧集或国外平台" }] : [];

    const queryParams = { language: "zh-CN", sort_by: sort, page: page, include_adult: false, include_null_first_air_dates: false };
    if (category.startsWith("tv_")) {
        queryParams.with_networks = platformId;
        if (category === "tv_anime") queryParams.with_genres = "16";
        else if (category === "tv_variety") queryParams.with_genres = "10764|10767";
        else if (category === "tv_drama") queryParams.without_genres = "16,10764,10767";
        return await loadPlatformMatrixData("tv", queryParams);
    } else if (category === "movie") {
        const usMap = { "213":"8", "2739":"337", "49":"1899|15", "2552":"350" };
        queryParams.watch_region = "US"; queryParams.with_watch_providers = usMap[platformId];
        return await loadPlatformMatrixData("movie", queryParams);
    }
}

async function loadPlatformMatrixData(mediaType, params) {
    try {
        const res = await Widget.tmdb.get(`/discover/${mediaType}`, { params });
        if (!res.results || res.results.length === 0) return params.page === 1 ? [{ id: "empty", type: "text", title: "暂无流媒体数据" }] : [];
        return res.results.map(item => {
            const date = item.first_air_date || item.release_date || "";
            return {
                id: String(item.id), tmdbId: item.id, type: "tmdb", mediaType: mediaType, title: item.name || item.title, date: date, releaseDate: date,
                posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "", 
                backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : "", 
                genreTitle: getGlobalGenreText(item.genre_ids),
                description: `${date}\n${item.overview || "暂无简介"}`
            };
        });
    } catch (e) { return [{ id: "err", type: "text", title: "流媒体拉取失败" }]; }
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
 * 模块 1：加载豆瓣榜单
 */
async function loadTheaterDouban(params = {}) {
  const data = await THEATER_UTILS.fetch("douban-hot.json");
  if (data === THEATER_UTILS.emptyTips) return data;
  
  let list = data?.[params.channel] || [];
  list = THEATER_UTILS.sortList(list, params.sort_type); // 直接同步调用，不再 await
  return THEATER_UTILS.paginate(list, params.page);
}

/**
 * 模块 2：加载精选剧场
 */
const THEATER_DATA_URL = "https://raw.githubusercontent.com/qiguo093/-/main/data/theater-data.json?v=20260814";

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

async function loadTheaterList(params = {}) {
  const data = await THEATER_UTILS.fetchUrl(THEATER_DATA_URL);
  if (data === THEATER_UTILS.emptyTips) return data;
  
  const brand = params.brand || "迷雾剧场";
  const status = params.status || "all";
  
  const brandData = data[brand];
  if (!brandData) return [];
  
  let list = [];
  if (status === "aired") {
    list = brandData.aired || [];
  } else if (status === "upcoming") {
    list = brandData.upcoming || [];
  } else {
    list = [...(brandData.upcoming || []), ...(brandData.aired || [])];
  }
  
  list = THEATER_UTILS.sortList(list, params.sort_type); // 同步调用
  return THEATER_UTILS.paginate(list, params.page);
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
    const source = params.theater_source || "douban";
    if (source === "theater") return await loadTheaterList(params);
    if (source === "mango") return await loadTheaterMangoTV(params);
    return await loadTheaterDouban(params);
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

// ✨ 核心渲染拦截函数：恢复 year 和 releaseDate 的赋值
function calendarBuildItem({ id, tmdbId, type, title, poster, backdrop, rating, subTitle, desc, year, releaseDate }) {
    const fullPoster = poster && poster.startsWith("http") ? poster : (poster ? `https://image.tmdb.org/t/p/w500${poster}` : "");
    const fullBackdrop = backdrop && backdrop.startsWith("http") ? backdrop : (backdrop ? `https://image.tmdb.org/t/p/w780${backdrop}` : "");

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

// =========================================================================
// 1. 业务逻辑：动漫周更 (Anime) 
// =========================================================================

async function calendarLoadAnime(params = {}) {
    // 👈 核心修改：接管 sort_by 变回 weekday
    const weekday = params.sort_by || "today"; 
    const page = params.page || 1;
    const pageSize = 20;

    let targetDayId = parseInt(weekday);
    if (weekday === "today") {
        const today = new Date();
        const jsDay = today.getDay();
        targetDayId = jsDay === 0 ? 7 : jsDay;
    }
    const dayName = calendarGetWeekdayName(targetDayId);

    try {
        const res = await Widget.http.get("https://api.bgm.tv/calendar");
        const data = res.data || [];
        const dayData = data.find(d => d.weekday && d.weekday.id === targetDayId);

        if (!dayData || !dayData.items || dayData.items.length === 0) {
            return page === 1 ? [{ id: "empty", type: "text", title: "暂无更新" }] : [];
        }

        const allItems = dayData.items;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        if (start >= allItems.length) return [];
        const pageItems = allItems.slice(start, end);

        const promises = pageItems.map(async (item) => {
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
                year: "",
                releaseDate: ""
            };

            const tmdbItem = await calendarSearchBestMatch(title, item.name);
            if (tmdbItem) {
                const fullDate = tmdbItem.first_air_date || "";
                itemData.id = String(tmdbItem.id);
                itemData.tmdbId = tmdbItem.id;
                itemData.poster = tmdbItem.poster_path || cover; 
                itemData.backdrop = tmdbItem.backdrop_path;
                itemData.genreText = calendarGetGenreText(tmdbItem.genre_ids) || "动画";
                itemData.desc = tmdbItem.overview || itemData.desc;
                itemData.rating = tmdbItem.vote_average?.toFixed(1) || itemData.rating;
                itemData.year = fullDate.substring(0, 4);
                itemData.releaseDate = fullDate; // 为竖版海报提供日期
            }
            
            const displaySubtitle = `${dayName} ${itemData.genreText}`;

            return calendarBuildItem({
                ...itemData,
                subTitle: displaySubtitle
            });
        });

        return await Promise.all(promises);

    } catch (e) {
        return [{ id: "err", type: "text", title: "加载失败", subTitle: e.message }];
    }
}

// =========================================================================
// 2. 业务逻辑：追剧日历 & 综艺时刻 (原生逻辑)
// =========================================================================

async function calendarLoadDrama(params = {}) {
    const mode = params.mode || "update_today";
    // 👈 核心修改：接管 sort_by 变回 region
    const region = params.sort_by || "Global"; 
    const page = params.page || 1;
    
    const dates = calendarCalculateDates(mode);
    const isPremiere = mode.includes("premiere");
    
    const queryParams = {
        language: "zh-CN",
        sort_by: "popularity.desc",
        include_null_first_air_dates: false,
        page: page,
        timezone: "Asia/Shanghai"
    };

    const dateField = isPremiere ? "first_air_date" : "air_date";
    queryParams[`${dateField}.gte`] = dates.start;
    queryParams[`${dateField}.lte`] = dates.end;

    if (region !== "Global") {
        queryParams.with_origin_country = region;
        const langMap = { "JP": "ja", "KR": "ko", "CN": "zh", "GB": "en", "US": "en" };
        if (langMap[region]) queryParams.with_original_language = langMap[region];
    }

    try {
        const res = await Widget.tmdb.get("/discover/tv", { params: queryParams });
        const data = res || {};
        if (!data.results || data.results.length === 0) return page === 1 ? [{ id: "empty", type: "text", title: "暂无更新" }] : [];

        return data.results.map(item => {
            const fullDate = (mode === "update_today") ? dates.start : (item.first_air_date || "");
            
            const yearStr = fullDate.substring(0, 4);
            const shortDate = fullDate.slice(5).replace("-", "/"); // e.g. 02/23
            const genreText = calendarGetGenreText(item.genre_ids) || "剧集";
            
            let timeLabel = mode === "update_today" ? "" : shortDate;
            const displaySubtitle = timeLabel ? `${timeLabel} ${genreText}` : genreText;

            return calendarBuildItem({
                id: item.id, tmdbId: item.id, type: "tv",
                title: item.name, poster: item.poster_path, backdrop: item.backdrop_path,
                rating: item.vote_average?.toFixed(1),
                subTitle: displaySubtitle, 
                desc: item.overview,
                year: yearStr,           // 传给横版拼年份
                releaseDate: fullDate    // 传给竖版显完整日期
            });
        });
    } catch (e) { return [{ id: "err", type: "text", title: "网络错误" }]; }
}

async function calendarLoadVariety(params = {}) {
    const mode = params.mode || "today";
    // 👈 核心修改：接管 sort_by 变回 region
    const region = params.sort_by || "cn"; 
    
    const clientId = CALENDAR_TRAKT_ID;

    if (mode === "trending") return await calendarFetchVariety(region, null); 

    const dateStr = calendarGetSafeDate(mode); 
    const countryParam = region === "global" ? "" : region; 
    const traktUrl = `https://api.trakt.tv/calendars/all/shows/${dateStr}/1?genres=reality,game-show,talk-show${countryParam ? `&countries=${countryParam}` : ''}`;

    try {
        const res = await Widget.http.get(traktUrl, {
            headers: { "Content-Type": "application/json", "trakt-api-version": "2", "trakt-api-key": clientId }
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
 return await calendarLoadDrama({mode:params.calendar_mode||"update_today",sort_by:params.drama_region||"Global",page:params.page});
}

// ================= 综艺聚合 =================
function calendarPadZero(num) {
    return String(num).padStart(2, '0');
}

// 获取今天 (YYYY-MM-DD) - 用于比较
function calendarGetTodayStr() {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    const local = new Date(d.getTime() - offset);
    return local.toISOString().split('T')[0];
}

// 获取 N 天后的日期
function calendarGetFutureDateStr(days) {
    const d = new Date();
    d.setDate(d.getDate() + parseInt(days));
    const offset = d.getTimezoneOffset() * 60000;
    const local = new Date(d.getTime() - offset);
    return local.toISOString().split('T')[0];
}

// =========================================================================
// 1. 核心逻辑
// =========================================================================

async function calendarLoadVarietyUltimate(params = {}) {
    const { listType = "calendar", region = "all", days = "14", page = 1 } = params;

    const todayStr = calendarGetTodayStr(); // 获取今天的日期字符串 (2026-02-23)

    let discoverUrl = `/discover/tv`;
    let queryParams = {
        language: "zh-CN",
        page: page,
        with_genres: "10764|10767", 
        sort_by: "popularity.desc",
        "vote_count.gte": 0,
        include_null_first_air_dates: false
    };

    if (region === "cn") {
        queryParams.with_origin_country = "CN";
    } else if (region === "global") {
        queryParams.with_origin_country = "US|KR|JP|GB|TW|HK|TH";
    }

    // === 📅 步骤1：初步筛选 ===
    if (listType === "calendar") {
        const endDate = calendarGetFutureDateStr(days);
        // API 查询时，gte 设为今天
        queryParams["air_date.gte"] = todayStr;
        queryParams["air_date.lte"] = endDate;
    }

    try {
        const res = await Widget.tmdb.get(discoverUrl, { params: queryParams });
        const rawResults = res.results || [];

        if (rawResults.length === 0) return [];

        const detailPromises = rawResults.map(async (item) => {
            if (!item.poster_path) return null;

            try {
                const detail = await Widget.tmdb.get(`/tv/${item.id}`, { 
                    params: { language: "zh-CN" } 
                });
                
                const nextEp = detail.next_episode_to_air;
                const lastEp = detail.last_episode_to_air;
                
                let sortDate = "1900-01-01"; 
                let epString = ""; 

                // 逻辑：找到最接近未来的那一集，并组装 S01-E03
                if (nextEp) {
                    sortDate = nextEp.air_date;
                    epString = `S${calendarPadZero(nextEp.season_number)}-E${calendarPadZero(nextEp.episode_number)}`;
                } else if (lastEp) {
                    sortDate = lastEp.air_date;
                    epString = `S${calendarPadZero(lastEp.season_number)}-E${calendarPadZero(lastEp.episode_number)}`;
                } else {
                    sortDate = item.first_air_date;
                    epString = "首播";
                }

                // === 🛑 步骤2：最终强制过滤 ===
                if (listType === "calendar") {
                    if (!sortDate || sortDate < todayStr) {
                        return null; 
                    }
                }

                return {
                    detail: detail,
                    sortDate: sortDate,
                    epString: epString
                };
            } catch (e) {
                return null;
            }
        });

        const detailedItems = (await Promise.all(detailPromises)).filter(Boolean);

        // === 📅 步骤3：排序 (今天 -> 未来) ===
        if (listType === "calendar") {
            detailedItems.sort((a, b) => {
                if (a.sortDate === b.sortDate) return 0;
                return a.sortDate > b.sortDate ? 1 : -1; 
            });
        }

        return detailedItems.map(data => {
            const { detail, epString, sortDate } = data;
            
            const ratingNum = detail.vote_average ? detail.vote_average.toFixed(1) : "0.0";
            const ratingText = ratingNum > 0 ? `${ratingNum}分` : "暂无评分";
            
            let finalSubTitle = "";

            if (listType === "calendar") {
                // 生成副标题：8.5分 • S01-E03
                finalSubTitle = `${ratingText} • ${epString}`;  
            } else {
                // 热度榜副标题
                finalSubTitle = `${ratingText} • 热度 ${Math.round(detail.popularity)}`;
            }

            // 提取年份，用当前播出的这集的年份
            const yearStr = sortDate ? sortDate.substring(0, 4) : (detail.first_air_date || "").substring(0, 4);

            return {
                id: String(detail.id),
                tmdbId: detail.id,
                type: "tmdb",
                mediaType: "tv",
                title: detail.name || detail.original_name,
                
                // 给横版的副标题
                genreTitle: finalSubTitle, 
                subTitle: finalSubTitle,
                
                posterPath: detail.poster_path ? `https://image.tmdb.org/t/p/w500${detail.poster_path}` : "",
                backdropPath: detail.backdrop_path ? `https://image.tmdb.org/t/p/w780${detail.backdrop_path}` : "",
                description: `📅 播出时间: ${sortDate}\n${detail.overview || "暂无简介"}`,
                rating: parseFloat(ratingNum),
                
                // 核心字段回归
                year: yearStr,           // 负责横版榜单前面拼接的年份："2026"
                releaseDate: sortDate    // 负责竖版海报下方显示的完整日期："2026-02-23"
            };
        });

    } catch (e) {
        return [{ id: "err", type: "text", title: "加载失败", subTitle: e.message }];
    }
}


// ================= 骨朵热度指数榜 =================
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
(function(){var WidgetMetadata;

WidgetMetadata = {
  id: "rr_vod_full",
  title: "人人美剧",
  icon: "https://assets.vvebo.vip/scripts/icon.png",
  version: "1.0.1",
  requiredVersion: "0.0.1",
  description: "获取人人美剧在线资源",
  author: "两块",
  globalParams: [
    {
      name: "multiSource",
      title: "是否启用聚合搜索",
      type: "enumeration",
      enumOptions: [
        { title: "启用", value: "enabled" },
        { title: "禁用", value: "disabled" }
      ]
    },
    {
      name: "Token",
      title: "VIP Token",
      type: "input",
      value: "rrtv-05188573836c6a02cce84f931ad161282cf039b4"
    }
  ],
  modules: [
    {
      id: "loadResource",
      title: "加载资源",
      functionName: "loadResource",
      type: "stream",
      params: []
    }
  ],
};

const SITE_API = 'https://api.rrmj.plus';

async function loadResource(params) {
  const { seriesName, season, episode, type, Token, multiSource} = params;
  if (multiSource !== "enabled" || !seriesName) return [];
  if (typeof CryptoJS === 'undefined') return [];
  
  const deviceId = getUUID();

  try {
    // --- 1. 搜索 ---
    const searchUrl = `${SITE_API}/m-station/search/drama`;
    const sParams = { 
        isExecuteVipActivity: true,
        keywords: seriesName, 
        order: 'match', 
        search_after: '',
        size: 20 
    };

    const sHeaders = buildSignedHeaders("GET", searchUrl, sParams, deviceId, "");
    const sRes = await Widget.http.get(`${searchUrl}?${sortedQueryString(sParams)}`, { headers: sHeaders });
    const sData = JSON.parse(decrypt(sRes.data));
    const list = sData.data?.searchDramaList || [];

    if (list.length === 0) return [];

    let drama = null;

    // --- 2. 匹配 ---
    const sNum = parseInt(season);
    const cNum = numberToChinese(sNum);
    
    // 定义需要精确对撞的候选标题
    let targetVariants = [];
    if (type === 'movie') {
      targetVariants = [seriesName];
    } else {
      // 电视剧：匹配 剧名+数字季 / 剧名+中文季 / 剧名（仅限第1季）
      targetVariants = [
        `${seriesName} 第${sNum}季`,
        `${seriesName}第${sNum}季`,
        `${seriesName} 第${cNum}季`,
        `${seriesName}第${cNum}季`
      ];
      if (sNum === 1) targetVariants.push(seriesName);
    }

    // 格式化函数：统一转为小写并移除所有空格、特殊标点，确保"对撞"成功
    const normalize = (s) => s.replace(/[\s：:·\-\.!\?\/]/g, '').toLowerCase();
    const normalizedVariants = targetVariants.map(normalize);

    // 在搜索结果中寻找精确匹配项
    drama = list.find(item => {
      const itemTitle = normalize(item.title);
      return normalizedVariants.includes(itemTitle);
    });

    if (!drama) return [];

    // --- 3. 获取剧集列表 (Page) ---
    const pageUrl = `${SITE_API}/m-station/drama/page`;
    const pParams = { dramaId: String(drama.id), hevcOpen: 1, hsdrOpen: 0, isAgeLimit: 0, quality: 'AI4K', tria4k: 1 };
    const pHeaders = buildSignedHeaders("GET", pageUrl, pParams, deviceId, "");
    const pRes = await Widget.http.get(`${pageUrl}?${sortedQueryString(pParams)}`, { headers: pHeaders });
    const pData = JSON.parse(decrypt(pRes.data));
    
    const targetEpNo = type === 'movie' ? 1 : parseInt(episode);
    const episodeInfo = pData.data.episodeList.find(e => parseInt(e.episodeNo) === targetEpNo);
    if (!episodeInfo) return [];

    // --- 4. 播放解析 ---
    const qualityCode = pData.data.watchInfo.sortedItems[0]?.qualityCode || 'HD';
    const playUrl = `${SITE_API}/m-station/drama/play`;
    const plParams = { 
        dramaId: String(drama.id), 
        episodeSid: episodeInfo.sid, 
        hevcOpen: 1, 
        quality: qualityCode,
        tria4k: 1 
    };
    
    const plHeaders = buildSignedHeaders("GET", playUrl, plParams, deviceId, Token);
    const plRes = await Widget.http.get(`${playUrl}?${sortedQueryString(plParams)}`, { headers: plHeaders });
    const plData = JSON.parse(decrypt(plRes.data));
    
    const finalUrl = decryptPlayUrl(plData.data.m3u8.url, plData.data.newSign);

    return [{
      name: plData.data.m3u8.currentQuality,
      url: finalUrl
    }];

  } catch (err) {
    return [];
  }
}

/**
 * 数字转中文（支持1-99）
 */
function numberToChinese(num) {
  const chineseNums = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  if (num < 10) return chineseNums[num];
  if (num === 10) return "十";
  if (num < 20) return "十" + chineseNums[num % 10];
  if (num % 10 === 0) return chineseNums[Math.floor(num / 10)] + "十";
  return chineseNums[Math.floor(num / 10)] + "十" + chineseNums[num % 10];
}


// --- 签名与 Headers 构建 ---
function buildSignedHeaders(method, url, params, deviceId, token) {
  const SIGN_SECRET = 'ES513W0B1CsdUrR13Qk5EgDAKPeeKZY';
  
  let pathname = "/";
  const pathStart = url.indexOf("/", url.indexOf("//") + 2);
  if (pathStart !== -1) {
    const queryStart = url.indexOf("?", pathStart);
    pathname = queryStart !== -1 ? url.substring(pathStart, queryStart) : url.substring(pathStart);
  }

  const qs = sortedQueryString(params);
  const nowMs = Date.now();
  
  // 签名公式包含 Pathname 和 排序后的 Query
  const signStr = `${method.toUpperCase()}\naliId:${deviceId}\nct:web_pc\ncv:1.0.0\nt:${nowMs}\n${pathname}?${qs}`;
  const signature = CryptoJS.HmacSHA256(signStr, SIGN_SECRET);
  const xCaSign = CryptoJS.enc.Base64.stringify(signature);

  return {
    'Host': 'api.rrmj.plus',
    'Origin': 'https://rrsp.com.cn/',
    'Referer': 'https://rrsp.com.cn/',
    'clientType': 'web_pc',
    'clientVersion': '1.0.0',
    'aliId': deviceId,
    'deviceId': deviceId,
    'umid': deviceId,
    'ct': 'web_pc',
    'cv': '1.0.0',
    't': String(nowMs),
    'uet': '9',
    'x-ca-sign': xCaSign,
    'token': token || '',
    'User-Agent': 'Mozilla/5.0',
    'Accept': 'application/json',
    'Connection': 'keep-alive'
  };
}

// --- 数据包解密 (ECB) ---
function decrypt(str) {
  const key = CryptoJS.enc.Utf8.parse('3b744389882a4067');
  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext: CryptoJS.enc.Base64.parse(str) }, 
    key, 
    { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
  );
  return decrypted.toString(CryptoJS.enc.Utf8);
}

// --- 播放直链二次解密 (CBC) ---
function decryptPlayUrl(url, newSign) {
  const key = CryptoJS.enc.Utf8.parse(newSign.substring(4, 20)); // 截取 newSign 4-20位作为 Key
  const iv = CryptoJS.enc.Utf8.parse('b1da7878016e4e2b'); // 固定 IV
  const decrypted = CryptoJS.AES.decrypt(url, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
  return decrypted.toString(CryptoJS.enc.Utf8);
}

// --- 参数排序 ---
function sortedQueryString(params) {
  return Object.keys(params).sort().map(k => {
    let v = params[k];
    if (typeof v === 'boolean') v = v ? 'true' : 'false';
    if (v == null) v = '';
    return `${encodeURIComponent(k)}=${encodeURIComponent(v)}`;
  }).join('&');
}

/**
 * 获取UUID
 */
function getUUID() {
  // 定义缓存key
  const UUID_CACHE_KEY = 'RR_UUID';
  // 优先读取缓存
  const cachedUUID = Widget.storage.get(UUID_CACHE_KEY);
  if (cachedUUID) {
    return cachedUUID;
  }
  // 无缓存时生成新UUID
  const newUUID = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (e) =>
    ('x' === e ? (16 * Math.random()) | 0 : (Math.random() * 0x4 | 0x8)).toString(16)
  ).toUpperCase();
  // 存入缓存
  Widget.storage.set(UUID_CACHE_KEY, newUUID);
  return newUUID;
}


// ============================================================
// CryptoJS 的完整代码 (crypto-js.min.js)
// ============================================================
!function(t,e){"object"==typeof exports?module.exports=exports=e():"function"==typeof define&&define.amd?define([],e):t.CryptoJS=e()}(this,function(){var n,o,s,a,h,t,e,l,r,i,c,f,d,u,p,S,x,b,A,H,z,_,v,g,y,B,w,k,m,C,D,E,R,M,F,P,W,O,I,U=U||function(h){var i;if("undefined"!=typeof window&&window.crypto&&(i=window.crypto),"undefined"!=typeof self&&self.crypto&&(i=self.crypto),!(i=!(i=!(i="undefined"!=typeof globalThis&&globalThis.crypto?globalThis.crypto:i)&&"undefined"!=typeof window&&window.msCrypto?window.msCrypto:i)&&"undefined"!=typeof global&&global.crypto?global.crypto:i)&&"function"==typeof require)try{i=require("crypto")}catch(t){}var r=Object.create||function(t){return e.prototype=t,t=new e,e.prototype=null,t};function e(){}var t={},n=t.lib={},o=n.Base={extend:function(t){var e=r(this);return t&&e.mixIn(t),e.hasOwnProperty("init")&&this.init!==e.init||(e.init=function(){e.$super.init.apply(this,arguments)}),(e.init.prototype=e).$super=this,e},create:function(){var t=this.extend();return t.init.apply(t,arguments),t},init:function(){},mixIn:function(t){for(var e in t)t.hasOwnProperty(e)&&(this[e]=t[e]);t.hasOwnProperty("toString")&&(this.toString=t.toString)},clone:function(){return this.init.prototype.extend(this)}},l=n.WordArray=o.extend({init:function(t,e){t=this.words=t||[],this.sigBytes=null!=e?e:4*t.length},toString:function(t){return(t||c).stringify(this)},concat:function(t){var e=this.words,r=t.words,i=this.sigBytes,n=t.sigBytes;if(this.clamp(),i%4)for(var o=0;o<n;o++){var s=r[o>>>2]>>>24-o%4*8&255;e[i+o>>>2]|=s<<24-(i+o)%4*8}else for(var c=0;c<n;c+=4)e[i+c>>>2]=r[c>>>2];return this.sigBytes+=n,this},clamp:function(){var t=this.words,e=this.sigBytes;t[e>>>2]&=4294967295<<32-e%4*8,t.length=h.ceil(e/4)},clone:function(){var t=o.clone.call(this);return t.words=this.words.slice(0),t},random:function(t){for(var e=[],r=0;r<t;r+=4)e.push(function(){if(i){if("function"==typeof i.getRandomValues)try{return i.getRandomValues(new Uint32Array(1))[0]}catch(t){}if("function"==typeof i.randomBytes)try{return i.randomBytes(4).readInt32LE()}catch(t){}}throw new Error("Native crypto module could not be used to get secure random number.")}());return new l.init(e,t)}}),s=t.enc={},c=s.Hex={stringify:function(t){for(var e=t.words,r=t.sigBytes,i=[],n=0;n<r;n++){var o=e[n>>>2]>>>24-n%4*8&255;i.push((o>>>4).toString(16)),i.push((15&o).toString(16))}return i.join("")},parse:function(t){for(var e=t.length,r=[],i=0;i<e;i+=2)r[i>>>3]|=parseInt(t.substr(i,2),16)<<24-i%8*4;return new l.init(r,e/2)}},a=s.Latin1={stringify:function(t){for(var e=t.words,r=t.sigBytes,i=[],n=0;n<r;n++){var o=e[n>>>2]>>>24-n%4*8&255;i.push(String.fromCharCode(o))}return i.join("")},parse:function(t){for(var e=t.length,r=[],i=0;i<e;i++)r[i>>>2]|=(255&t.charCodeAt(i))<<24-i%4*8;return new l.init(r,e)}},f=s.Utf8={stringify:function(t){try{return decodeURIComponent(escape(a.stringify(t)))}catch(t){throw new Error("Malformed UTF-8 data")}},parse:function(t){return a.parse(unescape(encodeURIComponent(t)))}},d=n.BufferedBlockAlgorithm=o.extend({reset:function(){this._data=new l.init,this._nDataBytes=0},_append:function(t){"string"==typeof t&&(t=f.parse(t)),this._data.concat(t),this._nDataBytes+=t.sigBytes},_process:function(t){var e,r=this._data,i=r.words,n=r.sigBytes,o=this.blockSize,s=n/(4*o),c=(s=t?h.ceil(s):h.max((0|s)-this._minBufferSize,0))*o,n=h.min(4*c,n);if(c){for(var a=0;a<c;a+=o)this._doProcessBlock(i,a);e=i.splice(0,c),r.sigBytes-=n}return new l.init(e,n)},clone:function(){var t=o.clone.call(this);return t._data=this._data.clone(),t},_minBufferSize:0}),u=(n.Hasher=d.extend({cfg:o.extend(),init:function(t){this.cfg=this.cfg.extend(t),this.reset()},reset:function(){d.reset.call(this),this._doReset()},update:function(t){return this._append(t),this._process(),this},finalize:function(t){return t&&this._append(t),this._doFinalize()},blockSize:16,_createHelper:function(r){return function(t,e){return new r.init(e).finalize(t)}},_createHmacHelper:function(r){return function(t,e){return new u.HMAC.init(r,e).finalize(t)}}}),t.algo={});return t}(Math);function K(t,e,r){return t&e|~t&r}function X(t,e,r){return t&r|e&~r}function L(t,e){return t<<e|t>>>32-e}function j(t,e,r,i){var n,o=this._iv;o?(n=o.slice(0),this._iv=void 0):n=this._prevBlock,i.encryptBlock(n,0);for(var s=0;s<r;s++)t[e+s]^=n[s]}function T(t){var e,r,i;return 255==(t>>24&255)?(r=t>>8&255,i=255&t,255===(e=t>>16&255)?(e=0,255===r?(r=0,255===i?i=0:++i):++r):++e,t=0,t+=e<<16,t+=r<<8,t+=i):t+=1<<24,t}function N(){for(var t=this._X,e=this._C,r=0;r<8;r++)E[r]=e[r];e[0]=e[0]+1295307597+this._b|0,e[1]=e[1]+3545052371+(e[0]>>>0<E[0]>>>0?1:0)|0,e[2]=e[2]+886263092+(e[1]>>>0<E[1]>>>0?1:0)|0,e[3]=e[3]+1295307597+(e[2]>>>0<E[2]>>>0?1:0)|0,e[4]=e[4]+3545052371+(e[3]>>>0<E[3]>>>0?1:0)|0,e[5]=e[5]+886263092+(e[4]>>>0<E[4]>>>0?1:0)|0,e[6]=e[6]+1295307597+(e[5]>>>0<E[5]>>>0?1:0)|0,e[7]=e[7]+3545052371+(e[6]>>>0<E[6]>>>0?1:0)|0,this._b=e[7]>>>0<E[7]>>>0?1:0;for(r=0;r<8;r++){var i=t[r]+e[r],n=65535&i,o=i>>>16;R[r]=((n*n>>>17)+n*o>>>15)+o*o^((4294901760&i)*i|0)+((65535&i)*i|0)}t[0]=R[0]+(R[7]<<16|R[7]>>>16)+(R[6]<<16|R[6]>>>16)|0,t[1]=R[1]+(R[0]<<8|R[0]>>>24)+R[7]|0,t[2]=R[2]+(R[1]<<16|R[1]>>>16)+(R[0]<<16|R[0]>>>16)|0,t[3]=R[3]+(R[2]<<8|R[2]>>>24)+R[1]|0,t[4]=R[4]+(R[3]<<16|R[3]>>>16)+(R[2]<<16|R[2]>>>16)|0,t[5]=R[5]+(R[4]<<8|R[4]>>>24)+R[3]|0,t[6]=R[6]+(R[5]<<16|R[5]>>>16)+(R[4]<<16|R[4]>>>16)|0,t[7]=R[7]+(R[6]<<8|R[6]>>>24)+R[5]|0}function q(){for(var t=this._X,e=this._C,r=0;r<8;r++)O[r]=e[r];e[0]=e[0]+1295307597+this._b|0,e[1]=e[1]+3545052371+(e[0]>>>0<O[0]>>>0?1:0)|0,e[2]=e[2]+886263092+(e[1]>>>0<O[1]>>>0?1:0)|0,e[3]=e[3]+1295307597+(e[2]>>>0<O[2]>>>0?1:0)|0,e[4]=e[4]+3545052371+(e[3]>>>0<O[3]>>>0?1:0)|0,e[5]=e[5]+886263092+(e[4]>>>0<O[4]>>>0?1:0)|0,e[6]=e[6]+1295307597+(e[5]>>>0<O[5]>>>0?1:0)|0,e[7]=e[7]+3545052371+(e[6]>>>0<O[6]>>>0?1:0)|0,this._b=e[7]>>>0<O[7]>>>0?1:0;for(r=0;r<8;r++){var i=t[r]+e[r],n=65535&i,o=i>>>16;I[r]=((n*n>>>17)+n*o>>>15)+o*o^((4294901760&i)*i|0)+((65535&i)*i|0)}t[0]=I[0]+(I[7]<<16|I[7]>>>16)+(I[6]<<16|I[6]>>>16)|0,t[1]=I[1]+(I[0]<<8|I[0]>>>24)+I[7]|0,t[2]=I[2]+(I[1]<<16|I[1]>>>16)+(I[0]<<16|I[0]>>>16)|0,t[3]=I[3]+(I[2]<<8|I[2]>>>24)+I[1]|0,t[4]=I[4]+(I[3]<<16|I[3]>>>16)+(I[2]<<16|I[2]>>>16)|0,t[5]=I[5]+(I[4]<<8|I[4]>>>24)+I[3]|0,t[6]=I[6]+(I[5]<<16|I[5]>>>16)+(I[4]<<16|I[4]>>>16)|0,t[7]=I[7]+(I[6]<<8|I[6]>>>24)+I[5]|0}return F=(M=U).lib,n=F.Base,o=F.WordArray,(M=M.x64={}).Word=n.extend({init:function(t,e){this.high=t,this.low=e}}),M.WordArray=n.extend({init:function(t,e){t=this.words=t||[],this.sigBytes=null!=e?e:8*t.length},toX32:function(){for(var t=this.words,e=t.length,r=[],i=0;i<e;i++){var n=t[i];r.push(n.high),r.push(n.low)}return o.create(r,this.sigBytes)},clone:function(){for(var t=n.clone.call(this),e=t.words=this.words.slice(0),r=e.length,i=0;i<r;i++)e[i]=e[i].clone();return t}}),"function"==typeof ArrayBuffer&&(P=U.lib.WordArray,s=P.init,(P.init=function(t){if((t=(t=t instanceof ArrayBuffer?new Uint8Array(t):t)instanceof Int8Array||"undefined"!=typeof Uint8ClampedArray&&t instanceof Uint8ClampedArray||t instanceof Int16Array||t instanceof Uint16Array||t instanceof Int32Array||t instanceof Uint32Array||t instanceof Float32Array||t instanceof Float64Array?new Uint8Array(t.buffer,t.byteOffset,t.byteLength):t)instanceof Uint8Array){for(var e=t.byteLength,r=[],i=0;i<e;i++)r[i>>>2]|=t[i]<<24-i%4*8;s.call(this,r,e)}else s.apply(this,arguments)}).prototype=P),function(){var t=U,n=t.lib.WordArray,t=t.enc;t.Utf16=t.Utf16BE={stringify:function(t){for(var e=t.words,r=t.sigBytes,i=[],n=0;n<r;n+=2){var o=e[n>>>2]>>>16-n%4*8&65535;i.push(String.fromCharCode(o))}return i.join("")},parse:function(t){for(var e=t.length,r=[],i=0;i<e;i++)r[i>>>1]|=t.charCodeAt(i)<<16-i%2*16;return n.create(r,2*e)}};function s(t){return t<<8&4278255360|t>>>8&16711935}t.Utf16LE={stringify:function(t){for(var e=t.words,r=t.sigBytes,i=[],n=0;n<r;n+=2){var o=s(e[n>>>2]>>>16-n%4*8&65535);i.push(String.fromCharCode(o))}return i.join("")},parse:function(t){for(var e=t.length,r=[],i=0;i<e;i++)r[i>>>1]|=s(t.charCodeAt(i)<<16-i%2*16);return n.create(r,2*e)}}}(),a=(w=U).lib.WordArray,w.enc.Base64={stringify:function(t){var e=t.words,r=t.sigBytes,i=this._map;t.clamp();for(var n=[],o=0;o<r;o+=3)for(var s=(e[o>>>2]>>>24-o%4*8&255)<<16|(e[o+1>>>2]>>>24-(o+1)%4*8&255)<<8|e[o+2>>>2]>>>24-(o+2)%4*8&255,c=0;c<4&&o+.75*c<r;c++)n.push(i.charAt(s>>>6*(3-c)&63));var a=i.charAt(64);if(a)for(;n.length%4;)n.push(a);return n.join("")},parse:function(t){var e=t.length,r=this._map;if(!(i=this._reverseMap))for(var i=this._reverseMap=[],n=0;n<r.length;n++)i[r.charCodeAt(n)]=n;var o=r.charAt(64);return!o||-1!==(o=t.indexOf(o))&&(e=o),function(t,e,r){for(var i=[],n=0,o=0;o<e;o++){var s,c;o%4&&(s=r[t.charCodeAt(o-1)]<<o%4*2,c=r[t.charCodeAt(o)]>>>6-o%4*2,c=s|c,i[n>>>2]|=c<<24-n%4*8,n++)}return a.create(i,n)}(t,e,i)},_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="},h=(F=U).lib.WordArray,F.enc.Base64url={stringify:function(t,e=!0){var r=t.words,i=t.sigBytes,n=e?this._safe_map:this._map;t.clamp();for(var o=[],s=0;s<i;s+=3)for(var c=(r[s>>>2]>>>24-s%4*8&255)<<16|(r[s+1>>>2]>>>24-(s+1)%4*8&255)<<8|r[s+2>>>2]>>>24-(s+2)%4*8&255,a=0;a<4&&s+.75*a<i;a++)o.push(n.charAt(c>>>6*(3-a)&63));var h=n.charAt(64);if(h)for(;o.length%4;)o.push(h);return o.join("")},parse:function(t,e=!0){var r=t.length,i=e?this._safe_map:this._map;if(!(n=this._reverseMap))for(var n=this._reverseMap=[],o=0;o<i.length;o++)n[i.charCodeAt(o)]=o;e=i.charAt(64);return!e||-1!==(e=t.indexOf(e))&&(r=e),function(t,e,r){for(var i=[],n=0,o=0;o<e;o++){var s,c;o%4&&(s=r[t.charCodeAt(o-1)]<<o%4*2,c=r[t.charCodeAt(o)]>>>6-o%4*2,c=s|c,i[n>>>2]|=c<<24-n%4*8,n++)}return h.create(i,n)}(t,r,n)},_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",_safe_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"},function(a){var t=U,e=t.lib,r=e.WordArray,i=e.Hasher,e=t.algo,A=[];!function(){for(var t=0;t<64;t++)A[t]=4294967296*a.abs(a.sin(t+1))|0}();e=e.MD5=i.extend({_doReset:function(){this._hash=new r.init([1732584193,4023233417,2562383102,271733878])},_doProcessBlock:function(t,e){for(var r=0;r<16;r++){var i=e+r,n=t[i];t[i]=16711935&(n<<8|n>>>24)|4278255360&(n<<24|n>>>8)}var o=this._hash.words,s=t[e+0],c=t[e+1],a=t[e+2],h=t[e+3],l=t[e+4],f=t[e+5],d=t[e+6],u=t[e+7],p=t[e+8],_=t[e+9],y=t[e+10],v=t[e+11],g=t[e+12],B=t[e+13],w=t[e+14],k=t[e+15],m=H(m=o[0],b=o[1],x=o[2],S=o[3],s,7,A[0]),S=H(S,m,b,x,c,12,A[1]),x=H(x,S,m,b,a,17,A[2]),b=H(b,x,S,m,h,22,A[3]);m=H(m,b,x,S,l,7,A[4]),S=H(S,m,b,x,f,12,A[5]),x=H(x,S,m,b,d,17,A[6]),b=H(b,x,S,m,u,22,A[7]),m=H(m,b,x,S,p,7,A[8]),S=H(S,m,b,x,_,12,A[9]),x=H(x,S,m,b,y,17,A[10]),b=H(b,x,S,m,v,22,A[11]),m=H(m,b,x,S,g,7,A[12]),S=H(S,m,b,x,B,12,A[13]),x=H(x,S,m,b,w,17,A[14]),m=z(m,b=H(b,x,S,m,k,22,A[15]),x,S,c,5,A[16]),S=z(S,m,b,x,d,9,A[17]),x=z(x,S,m,b,v,14,A[18]),b=z(b,x,S,m,s,20,A[19]),m=z(m,b,x,S,f,5,A[20]),S=z(S,m,b,x,y,9,A[21]),x=z(x,S,m,b,k,14,A[22]),b=z(b,x,S,m,l,20,A[23]),m=z(m,b,x,S,_,5,A[24]),S=z(S,m,b,x,w,9,A[25]),x=z(x,S,m,b,h,14,A[26]),b=z(b,x,S,m,p,20,A[27]),m=z(m,b,x,S,B,5,A[28]),S=z(S,m,b,x,a,9,A[29]),x=z(x,S,m,b,u,14,A[30]),m=C(m,b=z(b,x,S,m,g,20,A[31]),x,S,f,4,A[32]),S=C(S,m,b,x,p,11,A[33]),x=C(x,S,m,b,v,16,A[34]),b=C(b,x,S,m,w,23,A[35]),m=C(m,b,x,S,c,4,A[36]),S=C(S,m,b,x,l,11,A[37]),x=C(x,S,m,b,u,16,A[38]),b=C(b,x,S,m,y,23,A[39]),m=C(m,b,x,S,B,4,A[40]),S=C(S,m,b,x,s,11,A[41]),x=C(x,S,m,b,h,16,A[42]),b=C(b,x,S,m,d,23,A[43]),m=C(m,b,x,S,_,4,A[44]),S=C(S,m,b,x,g,11,A[45]),x=C(x,S,m,b,k,16,A[46]),m=D(m,b=C(b,x,S,m,a,23,A[47]),x,S,s,6,A[48]),S=D(S,m,b,x,u,10,A[49]),x=D(x,S,m,b,w,15,A[50]),b=D(b,x,S,m,f,21,A[51]),m=D(m,b,x,S,g,6,A[52]),S=D(S,m,b,x,h,10,A[53]),x=D(x,S,m,b,y,15,A[54]),b=D(b,x,S,m,c,21,A[55]),m=D(m,b,x,S,p,6,A[56]),S=D(S,m,b,x,k,10,A[57]),x=D(x,S,m,b,d,15,A[58]),b=D(b,x,S,m,B,21,A[59]),m=D(m,b,x,S,l,6,A[60]),S=D(S,m,b,x,v,10,A[61]),x=D(x,S,m,b,a,15,A[62]),b=D(b,x,S,m,_,21,A[63]),o[0]=o[0]+m|0,o[1]=o[1]+b|0,o[2]=o[2]+x|0,o[3]=o[3]+S|0},_doFinalize:function(){var t=this._data,e=t.words,r=8*this._nDataBytes,i=8*t.sigBytes;e[i>>>5]|=128<<24-i%32;var n=a.floor(r/4294967296),r=r;e[15+(64+i>>>9<<4)]=16711935&(n<<8|n>>>24)|4278255360&(n<<24|n>>>8),e[14+(64+i>>>9<<4)]=16711935&(r<<8|r>>>24)|4278255360&(r<<24|r>>>8),t.sigBytes=4*(e.length+1),this._process();for(var e=this._hash,o=e.words,s=0;s<4;s++){var c=o[s];o[s]=16711935&(c<<8|c>>>24)|4278255360&(c<<24|c>>>8)}return e},clone:function(){var t=i.clone.call(this);return t._hash=this._hash.clone(),t}});function H(t,e,r,i,n,o,s){s=t+(e&r|~e&i)+n+s;return(s<<o|s>>>32-o)+e}function z(t,e,r,i,n,o,s){s=t+(e&i|r&~i)+n+s;return(s<<o|s>>>32-o)+e}function C(t,e,r,i,n,o,s){s=t+(e^r^i)+n+s;return(s<<o|s>>>32-o)+e}function D(t,e,r,i,n,o,s){s=t+(r^(e|~i))+n+s;return(s<<o|s>>>32-o)+e}t.MD5=i._createHelper(e),t.HmacMD5=i._createHmacHelper(e)}(Math),P=(M=U).lib,t=P.WordArray,e=P.Hasher,P=M.algo,l=[],P=P.SHA1=e.extend({_doReset:function(){this._hash=new t.init([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(t,e){for(var r=this._hash.words,i=r[0],n=r[1],o=r[2],s=r[3],c=r[4],a=0;a<80;a++){a<16?l[a]=0|t[e+a]:(h=l[a-3]^l[a-8]^l[a-14]^l[a-16],l[a]=h<<1|h>>>31);var h=(i<<5|i>>>27)+c+l[a];h+=a<20?1518500249+(n&o|~n&s):a<40?1859775393+(n^o^s):a<60?(n&o|n&s|o&s)-1894007588:(n^o^s)-899497514,c=s,s=o,o=n<<30|n>>>2,n=i,i=h}r[0]=r[0]+i|0,r[1]=r[1]+n|0,r[2]=r[2]+o|0,r[3]=r[3]+s|0,r[4]=r[4]+c|0},_doFinalize:function(){var t=this._data,e=t.words,r=8*this._nDataBytes,i=8*t.sigBytes;return e[i>>>5]|=128<<24-i%32,e[14+(64+i>>>9<<4)]=Math.floor(r/4294967296),e[15+(64+i>>>9<<4)]=r,t.sigBytes=4*e.length,this._process(),this._hash},clone:function(){var t=e.clone.call(this);return t._hash=this._hash.clone(),t}}),M.SHA1=e._createHelper(P),M.HmacSHA1=e._createHmacHelper(P),function(n){var t=U,e=t.lib,r=e.WordArray,i=e.Hasher,e=t.algo,o=[],p=[];!function(){function t(t){return 4294967296*(t-(0|t))|0}for(var e=2,r=0;r<64;)!function(t){for(var e=n.sqrt(t),r=2;r<=e;r++)if(!(t%r))return;return 1}(e)||(r<8&&(o[r]=t(n.pow(e,.5))),p[r]=t(n.pow(e,1/3)),r++),e++}();var _=[],e=e.SHA256=i.extend({_doReset:function(){this._hash=new r.init(o.slice(0))},_doProcessBlock:function(t,e){for(var r=this._hash.words,i=r[0],n=r[1],o=r[2],s=r[3],c=r[4],a=r[5],h=r[6],l=r[7],f=0;f<64;f++){f<16?_[f]=0|t[e+f]:(d=_[f-15],u=_[f-2],_[f]=((d<<25|d>>>7)^(d<<14|d>>>18)^d>>>3)+_[f-7]+((u<<15|u>>>17)^(u<<13|u>>>19)^u>>>10)+_[f-16]);var d=i&n^i&o^n&o,u=l+((c<<26|c>>>6)^(c<<21|c>>>11)^(c<<7|c>>>25))+(c&a^~c&h)+p[f]+_[f],l=h,h=a,a=c,c=s+u|0,s=o,o=n,n=i,i=u+(((i<<30|i>>>2)^(i<<19|i>>>13)^(i<<10|i>>>22))+d)|0}r[0]=r[0]+i|0,r[1]=r[1]+n|0,r[2]=r[2]+o|0,r[3]=r[3]+s|0,r[4]=r[4]+c|0,r[5]=r[5]+a|0,r[6]=r[6]+h|0,r[7]=r[7]+l|0},_doFinalize:function(){var t=this._data,e=t.words,r=8*this._nDataBytes,i=8*t.sigBytes;return e[i>>>5]|=128<<24-i%32,e[14+(64+i>>>9<<4)]=n.floor(r/4294967296),e[15+(64+i>>>9<<4)]=r,t.sigBytes=4*e.length,this._process(),this._hash},clone:function(){var t=i.clone.call(this);return t._hash=this._hash.clone(),t}});t.SHA256=i._createHelper(e),t.HmacSHA256=i._createHmacHelper(e)}(Math),r=(w=U).lib.WordArray,F=w.algo,i=F.SHA256,F=F.SHA224=i.extend({_doReset:function(){this._hash=new r.init([3238371032,914150663,812702999,4144912697,4290775857,1750603025,1694076839,3204075428])},_doFinalize:function(){var t=i._doFinalize.call(this);return t.sigBytes-=4,t}}),w.SHA224=i._createHelper(F),w.HmacSHA224=i._createHmacHelper(F),function(){var t=U,e=t.lib.Hasher,r=t.x64,i=r.Word,n=r.WordArray,r=t.algo;function o(){return i.create.apply(i,arguments)}var t1=[o(1116352408,3609767458),o(1899447441,602891725),o(3049323471,3964484399),o(3921009573,2173295548),o(961987163,4081628472),o(1508970993,3053834265),o(2453635748,2937671579),o(2870763221,3664609560),o(3624381080,2734883394),o(310598401,1164996542),o(607225278,1323610764),o(1426881987,3590304994),o(1925078388,4068182383),o(2162078206,991336113),o(2614888103,633803317),o(3248222580,3479774868),o(3835390401,2666613458),o(4022224774,944711139),o(264347078,2341262773),o(604807628,2007800933),o(770255983,1495990901),o(1249150122,1856431235),o(1555081692,3175218132),o(1996064986,2198950837),o(2554220882,3999719339),o(2821834349,766784016),o(2952996808,2566594879),o(3210313671,3203337956),o(3336571891,1034457026),o(3584528711,2466948901),o(113926993,3758326383),o(338241895,168717936),o(666307205,1188179964),o(773529912,1546045734),o(1294757372,1522805485),o(1396182291,2643833823),o(1695183700,2343527390),o(1986661051,1014477480),o(2177026350,1206759142),o(2456956037,344077627),o(2730485921,1290863460),o(2820302411,3158454273),o(3259730800,3505952657),o(3345764771,106217008),o(3516065817,3606008344),o(3600352804,1432725776),o(4094571909,1467031594),o(275423344,851169720),o(430227734,3100823752),o(506948616,1363258195),o(659060556,3750685593),o(883997877,3785050280),o(958139571,3318307427),o(1322822218,3812723403),o(1537002063,2003034995),o(1747873779,3602036899),o(1955562222,1575990012),o(2024104815,1125592928),o(2227730452,2716904306),o(2361852424,442776044),o(2428436474,593698344),o(2756734187,3733110249),o(3204031479,2999351573),o(3329325298,3815920427),o(3391569614,3928383900),o(3515267271,566280711),o(3940187606,3454069534),o(4118630271,4000239992),o(116418474,1914138554),o(174292421,2731055270),o(289380356,3203993006),o(460393269,320620315),o(685471733,587496836),o(852142971,1086792851),o(1017036298,365543100),o(1126000580,2618297676),o(1288033470,3409855158),o(1501505948,4234509866),o(1607167915,987167468),o(1816402316,1246189591)],e1=[];!function(){for(var t=0;t<80;t++)e1[t]=o()}();r=r.SHA512=e.extend({_doReset:function(){this._hash=new n.init([new i.init(1779033703,4089235720),new i.init(3144134277,2227873595),new i.init(1013904242,4271175723),new i.init(2773480762,1595750129),new i.init(1359893119,2917565137),new i.init(2600822924,725511199),new i.init(528734635,4215389547),new i.init(1541459225,327033209)])},_doProcessBlock:function(t,e){for(var r=this._hash.words,i=r[0],n=r[1],o=r[2],s=r[3],c=r[4],a=r[5],h=r[6],l=r[7],f=i.high,d=i.low,u=n.high,p=n.low,_=o.high,y=o.low,v=s.high,g=s.low,B=c.high,w=c.low,k=a.high,m=a.low,S=h.high,x=h.low,b=l.high,r=l.low,A=f,H=d,z=u,C=p,D=_,E=y,R=v,M=g,F=B,P=w,W=k,O=m,I=S,U=x,K=b,X=r,L=0;L<80;L++){var j,T,N=e1[L];L<16?(T=N.high=0|t[e+2*L],j=N.low=0|t[e+2*L+1]):($=(q=e1[L-15]).high,J=q.low,G=(Q=e1[L-2]).high,V=Q.low,Z=(Y=e1[L-7]).high,q=Y.low,Y=(Q=e1[L-16]).high,T=(T=(($>>>1|J<<31)^($>>>8|J<<24)^$>>>7)+Z+((j=(Z=(J>>>1|$<<31)^(J>>>8|$<<24)^(J>>>7|$<<25))+q)>>>0<Z>>>0?1:0))+((G>>>19|V<<13)^(G<<3|V>>>29)^G>>>6)+((j+=J=(V>>>19|G<<13)^(V<<3|G>>>29)^(V>>>6|G<<26))>>>0<J>>>0?1:0),j+=$=Q.low,N.high=T=T+Y+(j>>>0<$>>>0?1:0),N.low=j);var q=F&W^~F&I,Z=P&O^~P&U,V=A&z^A&D^z&D,G=(H>>>28|A<<4)^(H<<30|A>>>2)^(H<<25|A>>>7),J=t1[L],Q=J.high,Y=J.low,$=X+((P>>>14|F<<18)^(P>>>18|F<<14)^(P<<23|F>>>9)),N=K+((F>>>14|P<<18)^(F>>>18|P<<14)^(F<<23|P>>>9))+($>>>0<X>>>0?1:0),J=G+(H&C^H&E^C&E),K=I,X=U,I=W,U=O,W=F,O=P,F=R+(N=(N=(N=N+q+(($=$+Z)>>>0<Z>>>0?1:0))+Q+(($=$+Y)>>>0<Y>>>0?1:0))+T+(($=$+j)>>>0<j>>>0?1:0))+((P=M+$|0)>>>0<M>>>0?1:0)|0,R=D,M=E,D=z,E=C,z=A,C=H,A=N+(((A>>>28|H<<4)^(A<<30|H>>>2)^(A<<25|H>>>7))+V+(J>>>0<G>>>0?1:0))+((H=$+J|0)>>>0<$>>>0?1:0)|0}d=i.low=d+H,i.high=f+A+(d>>>0<H>>>0?1:0),p=n.low=p+C,n.high=u+z+(p>>>0<C>>>0?1:0),y=o.low=y+E,o.high=_+D+(y>>>0<E>>>0?1:0),g=s.low=g+M,s.high=v+R+(g>>>0<M>>>0?1:0),w=c.low=w+P,c.high=B+F+(w>>>0<P>>>0?1:0),m=a.low=m+O,a.high=k+W+(m>>>0<O>>>0?1:0),x=h.low=x+U,h.high=S+I+(x>>>0<U>>>0?1:0),r=l.low=r+X,l.high=b+K+(r>>>0<X>>>0?1:0)},_doFinalize:function(){var t=this._data,e=t.words,r=8*this._nDataBytes,i=8*t.sigBytes;return e[i>>>5]|=128<<24-i%32,e[30+(128+i>>>10<<5)]=Math.floor(r/4294967296),e[31+(128+i>>>10<<5)]=r,t.sigBytes=4*e.length,this._process(),this._hash.toX32()},clone:function(){var t=e.clone.call(this);return t._hash=this._hash.clone(),t},blockSize:32});t.SHA512=e._createHelper(r),t.HmacSHA512=e._createHmacHelper(r)}(),P=(M=U).x64,c=P.Word,f=P.WordArray,P=M.algo,d=P.SHA512,P=P.SHA384=d.extend({_doReset:function(){this._hash=new f.init([new c.init(3418070365,3238371032),new c.init(1654270250,914150663),new c.init(2438529370,812702999),new c.init(355462360,4144912697),new c.init(1731405415,4290775857),new c.init(2394180231,1750603025),new c.init(3675008525,1694076839),new c.init(1203062813,3204075428)])},_doFinalize:function(){var t=d._doFinalize.call(this);return t.sigBytes-=16,t}}),M.SHA384=d._createHelper(P),M.HmacSHA384=d._createHmacHelper(P),function(l){var t=U,e=t.lib,f=e.WordArray,i=e.Hasher,d=t.x64.Word,e=t.algo,A=[],H=[],z=[];!function(){for(var t=1,e=0,r=0;r<24;r++){A[t+5*e]=(r+1)*(r+2)/2%64;var i=(2*t+3*e)%5;t=e%5,e=i}for(t=0;t<5;t++)for(e=0;e<5;e++)H[t+5*e]=e+(2*t+3*e)%5*5;for(var n=1,o=0;o<24;o++){for(var s,c=0,a=0,h=0;h<7;h++)1&n&&((s=(1<<h)-1)<32?a^=1<<s:c^=1<<s-32),128&n?n=n<<1^113:n<<=1;z[o]=d.create(c,a)}}();var C=[];!function(){for(var t=0;t<25;t++)C[t]=d.create()}();e=e.SHA3=i.extend({cfg:i.cfg.extend({outputLength:512}),_doReset:function(){for(var t=this._state=[],e=0;e<25;e++)t[e]=new d.init;this.blockSize=(1600-2*this.cfg.outputLength)/32},_doProcessBlock:function(t,e){for(var r=this._state,i=this.blockSize/2,n=0;n<i;n++){var o=t[e+2*n],s=t[e+2*n+1],o=16711935&(o<<8|o>>>24)|4278255360&(o<<24|o>>>8);(m=r[n]).high^=s=16711935&(s<<8|s>>>24)|4278255360&(s<<24|s>>>8),m.low^=o}for(var c=0;c<24;c++){for(var a=0;a<5;a++){for(var h=0,l=0,f=0;f<5;f++)h^=(m=r[a+5*f]).high,l^=m.low;var d=C[a];d.high=h,d.low=l}for(a=0;a<5;a++)for(var u=C[(a+4)%5],p=C[(a+1)%5],_=p.high,p=p.low,h=u.high^(_<<1|p>>>31),l=u.low^(p<<1|_>>>31),f=0;f<5;f++)(m=r[a+5*f]).high^=h,m.low^=l;for(var y=1;y<25;y++){var v=(m=r[y]).high,g=m.low,B=A[y];l=B<32?(h=v<<B|g>>>32-B,g<<B|v>>>32-B):(h=g<<B-32|v>>>64-B,v<<B-32|g>>>64-B);B=C[H[y]];B.high=h,B.low=l}var w=C[0],k=r[0];w.high=k.high,w.low=k.low;for(a=0;a<5;a++)for(f=0;f<5;f++){var m=r[y=a+5*f],S=C[y],x=C[(a+1)%5+5*f],b=C[(a+2)%5+5*f];m.high=S.high^~x.high&b.high,m.low=S.low^~x.low&b.low}m=r[0],k=z[c];m.high^=k.high,m.low^=k.low}},_doFinalize:function(){var t=this._data,e=t.words,r=(this._nDataBytes,8*t.sigBytes),i=32*this.blockSize;e[r>>>5]|=1<<24-r%32,e[(l.ceil((1+r)/i)*i>>>5)-1]|=128,t.sigBytes=4*e.length,this._process();for(var n=this._state,e=this.cfg.outputLength/8,o=e/8,s=[],c=0;c<o;c++){var a=n[c],h=a.high,a=a.low,h=16711935&(h<<8|h>>>24)|4278255360&(h<<24|h>>>8);s.push(a=16711935&(a<<8|a>>>24)|4278255360&(a<<24|a>>>8)),s.push(h)}return new f.init(s,e)},clone:function(){for(var t=i.clone.call(this),e=t._state=this._state.slice(0),r=0;r<25;r++)e[r]=e[r].clone();return t}});t.SHA3=i._createHelper(e),t.HmacSHA3=i._createHmacHelper(e)}(Math),Math,F=(w=U).lib,u=F.WordArray,p=F.Hasher,F=w.algo,S=u.create([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,7,4,13,1,10,6,15,3,12,0,9,5,2,14,11,8,3,10,14,4,9,15,8,1,2,7,0,6,13,11,5,12,1,9,11,10,0,8,12,4,13,3,7,15,14,5,6,2,4,0,5,9,7,12,2,10,14,1,3,8,11,6,15,13]),x=u.create([5,14,7,0,9,2,11,4,13,6,15,8,1,10,3,12,6,11,3,7,0,13,5,10,14,15,8,12,4,9,1,2,15,5,1,3,7,14,6,9,11,8,12,2,10,0,4,13,8,6,4,1,3,11,15,0,5,12,2,13,9,7,10,14,12,15,10,4,1,5,8,7,6,2,13,14,0,3,9,11]),b=u.create([11,14,15,12,5,8,7,9,11,13,14,15,6,7,9,8,7,6,8,13,11,9,7,15,7,12,15,9,11,7,13,12,11,13,6,7,14,9,13,15,14,8,13,6,5,12,7,5,11,12,14,15,14,15,9,8,9,14,5,6,8,6,5,12,9,15,5,11,6,8,13,12,5,12,13,14,11,8,5,6]),A=u.create([8,9,9,11,13,15,15,5,7,7,8,11,14,14,12,6,9,13,15,7,12,8,9,11,7,7,12,7,6,15,13,11,9,7,15,11,8,6,6,14,12,13,5,14,13,13,7,5,15,5,8,11,14,14,6,14,6,9,12,9,12,5,15,8,8,5,12,9,12,5,14,6,8,13,6,5,15,13,11,11]),H=u.create([0,1518500249,1859775393,2400959708,2840853838]),z=u.create([1352829926,1548603684,1836072691,2053994217,0]),F=F.RIPEMD160=p.extend({_doReset:function(){this._hash=u.create([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(t,e){for(var r=0;r<16;r++){var i=e+r,n=t[i];t[i]=16711935&(n<<8|n>>>24)|4278255360&(n<<24|n>>>8)}for(var o,s,c,a,h,l,f=this._hash.words,d=H.words,u=z.words,p=S.words,_=x.words,y=b.words,v=A.words,g=o=f[0],B=s=f[1],w=c=f[2],k=a=f[3],m=h=f[4],r=0;r<80;r+=1)l=o+t[e+p[r]]|0,l+=r<16?(s^c^a)+d[0]:r<32?K(s,c,a)+d[1]:r<48?((s|~c)^a)+d[2]:r<64?X(s,c,a)+d[3]:(s^(c|~a))+d[4],l=(l=L(l|=0,y[r]))+h|0,o=h,h=a,a=L(c,10),c=s,s=l,l=g+t[e+_[r]]|0,l+=r<16?(B^(w|~k))+u[0]:r<32?X(B,w,k)+u[1]:r<48?((B|~w)^k)+u[2]:r<64?K(B,w,k)+u[3]:(B^w^k)+u[4],l=(l=L(l|=0,v[r]))+m|0,g=m,m=k,k=L(w,10),w=B,B=l;l=f[1]+c+k|0,f[1]=f[2]+a+m|0,f[2]=f[3]+h+g|0,f[3]=f[4]+o+B|0,f[4]=f[0]+s+w|0,f[0]=l},_doFinalize:function(){var t=this._data,e=t.words,r=8*this._nDataBytes,i=8*t.sigBytes;e[i>>>5]|=128<<24-i%32,e[14+(64+i>>>9<<4)]=16711935&(r<<8|r>>>24)|4278255360&(r<<24|r>>>8),t.sigBytes=4*(e.length+1),this._process();for(var e=this._hash,n=e.words,o=0;o<5;o++){var s=n[o];n[o]=16711935&(s<<8|s>>>24)|4278255360&(s<<24|s>>>8)}return e},clone:function(){var t=p.clone.call(this);return t._hash=this._hash.clone(),t}}),w.RIPEMD160=p._createHelper(F),w.HmacRIPEMD160=p._createHmacHelper(F),P=(M=U).lib.Base,_=M.enc.Utf8,M.algo.HMAC=P.extend({init:function(t,e){t=this._hasher=new t.init,"string"==typeof e&&(e=_.parse(e));var r=t.blockSize,i=4*r;(e=e.sigBytes>i?t.finalize(e):e).clamp();for(var t=this._oKey=e.clone(),e=this._iKey=e.clone(),n=t.words,o=e.words,s=0;s<r;s++)n[s]^=1549556828,o[s]^=909522486;t.sigBytes=e.sigBytes=i,this.reset()},reset:function(){var t=this._hasher;t.reset(),t.update(this._iKey)},update:function(t){return this._hasher.update(t),this},finalize:function(t){var e=this._hasher,t=e.finalize(t);return e.reset(),e.finalize(this._oKey.clone().concat(t))}}),F=(w=U).lib,M=F.Base,v=F.WordArray,P=w.algo,F=P.SHA1,g=P.HMAC,y=P.PBKDF2=M.extend({cfg:M.extend({keySize:4,hasher:F,iterations:1}),init:function(t){this.cfg=this.cfg.extend(t)},compute:function(t,e){for(var r=this.cfg,i=g.create(r.hasher,t),n=v.create(),o=v.create([1]),s=n.words,c=o.words,a=r.keySize,h=r.iterations;s.length<a;){var l=i.update(e).finalize(o);i.reset();for(var f=l.words,d=f.length,u=l,p=1;p<h;p++){u=i.finalize(u),i.reset();for(var _=u.words,y=0;y<d;y++)f[y]^=_[y]}n.concat(l),c[0]++}return n.sigBytes=4*a,n}}),w.PBKDF2=function(t,e,r){return y.create(r).compute(t,e)},M=(P=U).lib,F=M.Base,B=M.WordArray,w=P.algo,M=w.MD5,k=w.EvpKDF=F.extend({cfg:F.extend({keySize:4,hasher:M,iterations:1}),init:function(t){this.cfg=this.cfg.extend(t)},compute:function(t,e){for(var r,i=this.cfg,n=i.hasher.create(),o=B.create(),s=o.words,c=i.keySize,a=i.iterations;s.length<c;){r&&n.update(r),r=n.update(t).finalize(e),n.reset();for(var h=1;h<a;h++)r=n.finalize(r),n.reset();o.concat(r)}return o.sigBytes=4*c,o}}),P.EvpKDF=function(t,e,r){return k.create(r).compute(t,e)},U.lib.Cipher||function(){var t=U,e=t.lib,r=e.Base,s=e.WordArray,i=e.BufferedBlockAlgorithm,n=t.enc,o=(n.Utf8,n.Base64),c=t.algo.EvpKDF,a=e.Cipher=i.extend({cfg:r.extend(),createEncryptor:function(t,e){return this.create(this._ENC_XFORM_MODE,t,e)},createDecryptor:function(t,e){return this.create(this._DEC_XFORM_MODE,t,e)},init:function(t,e,r){this.cfg=this.cfg.extend(r),this._xformMode=t,this._key=e,this.reset()},reset:function(){i.reset.call(this),this._doReset()},process:function(t){return this._append(t),this._process()},finalize:function(t){return t&&this._append(t),this._doFinalize()},keySize:4,ivSize:4,_ENC_XFORM_MODE:1,_DEC_XFORM_MODE:2,_createHelper:function(i){return{encrypt:function(t,e,r){return h(e).encrypt(i,t,e,r)},decrypt:function(t,e,r){return h(e).decrypt(i,t,e,r)}}}});function h(t){return"string"==typeof t?p:u}e.StreamCipher=a.extend({_doFinalize:function(){return this._process(!0)},blockSize:1});var l=t.mode={},n=e.BlockCipherMode=r.extend({createEncryptor:function(t,e){return this.Encryptor.create(t,e)},createDecryptor:function(t,e){return this.Decryptor.create(t,e)},init:function(t,e){this._cipher=t,this._iv=e}}),n=l.CBC=((l=n.extend()).Encryptor=l.extend({processBlock:function(t,e){var r=this._cipher,i=r.blockSize;f.call(this,t,e,i),r.encryptBlock(t,e),this._prevBlock=t.slice(e,e+i)}}),l.Decryptor=l.extend({processBlock:function(t,e){var r=this._cipher,i=r.blockSize,n=t.slice(e,e+i);r.decryptBlock(t,e),f.call(this,t,e,i),this._prevBlock=n}}),l);function f(t,e,r){var i,n=this._iv;n?(i=n,this._iv=void 0):i=this._prevBlock;for(var o=0;o<r;o++)t[e+o]^=i[o]}var l=(t.pad={}).Pkcs7={pad:function(t,e){for(var e=4*e,r=e-t.sigBytes%e,i=r<<24|r<<16|r<<8|r,n=[],o=0;o<r;o+=4)n.push(i);e=s.create(n,r);t.concat(e)},unpad:function(t){var e=255&t.words[t.sigBytes-1>>>2];t.sigBytes-=e}},d=(e.BlockCipher=a.extend({cfg:a.cfg.extend({mode:n,padding:l}),reset:function(){var t;a.reset.call(this);var e=this.cfg,r=e.iv,e=e.mode;this._xformMode==this._ENC_XFORM_MODE?t=e.createEncryptor:(t=e.createDecryptor,this._minBufferSize=1),this._mode&&this._mode.__creator==t?this._mode.init(this,r&&r.words):(this._mode=t.call(e,this,r&&r.words),this._mode.__creator=t)},_doProcessBlock:function(t,e){this._mode.processBlock(t,e)},_doFinalize:function(){var t,e=this.cfg.padding;return this._xformMode==this._ENC_XFORM_MODE?(e.pad(this._data,this.blockSize),t=this._process(!0)):(t=this._process(!0),e.unpad(t)),t},blockSize:4}),e.CipherParams=r.extend({init:function(t){this.mixIn(t)},toString:function(t){return(t||this.formatter).stringify(this)}})),l=(t.format={}).OpenSSL={stringify:function(t){var e=t.ciphertext,t=t.salt,e=t?s.create([1398893684,1701076831]).concat(t).concat(e):e;return e.toString(o)},parse:function(t){var e,r=o.parse(t),t=r.words;return 1398893684==t[0]&&1701076831==t[1]&&(e=s.create(t.slice(2,4)),t.splice(0,4),r.sigBytes-=16),d.create({ciphertext:r,salt:e})}},u=e.SerializableCipher=r.extend({cfg:r.extend({format:l}),encrypt:function(t,e,r,i){i=this.cfg.extend(i);var n=t.createEncryptor(r,i),e=n.finalize(e),n=n.cfg;return d.create({ciphertext:e,key:r,iv:n.iv,algorithm:t,mode:n.mode,padding:n.padding,blockSize:t.blockSize,formatter:i.format})},decrypt:function(t,e,r,i){return i=this.cfg.extend(i),e=this._parse(e,i.format),t.createDecryptor(r,i).finalize(e.ciphertext)},_parse:function(t,e){return"string"==typeof t?e.parse(t,this):t}}),t=(t.kdf={}).OpenSSL={execute:function(t,e,r,i){i=i||s.random(8);t=c.create({keySize:e+r}).compute(t,i),r=s.create(t.words.slice(e),4*r);return t.sigBytes=4*e,d.create({key:t,iv:r,salt:i})}},p=e.PasswordBasedCipher=u.extend({cfg:u.cfg.extend({kdf:t}),encrypt:function(t,e,r,i){r=(i=this.cfg.extend(i)).kdf.execute(r,t.keySize,t.ivSize);i.iv=r.iv;i=u.encrypt.call(this,t,e,r.key,i);return i.mixIn(r),i},decrypt:function(t,e,r,i){i=this.cfg.extend(i),e=this._parse(e,i.format);r=i.kdf.execute(r,t.keySize,t.ivSize,e.salt);return i.iv=r.iv,u.decrypt.call(this,t,e,r.key,i)}})}(),U.mode.CFB=((F=U.lib.BlockCipherMode.extend()).Encryptor=F.extend({processBlock:function(t,e){var r=this._cipher,i=r.blockSize;j.call(this,t,e,i,r),this._prevBlock=t.slice(e,e+i)}}),F.Decryptor=F.extend({processBlock:function(t,e){var r=this._cipher,i=r.blockSize,n=t.slice(e,e+i);j.call(this,t,e,i,r),this._prevBlock=n}}),F),U.mode.CTR=(M=U.lib.BlockCipherMode.extend(),P=M.Encryptor=M.extend({processBlock:function(t,e){var r=this._cipher,i=r.blockSize,n=this._iv,o=this._counter;n&&(o=this._counter=n.slice(0),this._iv=void 0);var s=o.slice(0);r.encryptBlock(s,0),o[i-1]=o[i-1]+1|0;for(var c=0;c<i;c++)t[e+c]^=s[c]}}),M.Decryptor=P,M),U.mode.CTRGladman=(F=U.lib.BlockCipherMode.extend(),P=F.Encryptor=F.extend({processBlock:function(t,e){var r=this._cipher,i=r.blockSize,n=this._iv,o=this._counter;n&&(o=this._counter=n.slice(0),this._iv=void 0),0===((n=o)[0]=T(n[0]))&&(n[1]=T(n[1]));var s=o.slice(0);r.encryptBlock(s,0);for(var c=0;c<i;c++)t[e+c]^=s[c]}}),F.Decryptor=P,F),U.mode.OFB=(M=U.lib.BlockCipherMode.extend(),P=M.Encryptor=M.extend({processBlock:function(t,e){var r=this._cipher,i=r.blockSize,n=this._iv,o=this._keystream;n&&(o=this._keystream=n.slice(0),this._iv=void 0),r.encryptBlock(o,0);for(var s=0;s<i;s++)t[e+s]^=o[s]}}),M.Decryptor=P,M),U.mode.ECB=((F=U.lib.BlockCipherMode.extend()).Encryptor=F.extend({processBlock:function(t,e){this._cipher.encryptBlock(t,e)}}),F.Decryptor=F.extend({processBlock:function(t,e){this._cipher.decryptBlock(t,e)}}),F),U.pad.AnsiX923={pad:function(t,e){var r=t.sigBytes,e=4*e,e=e-r%e,r=r+e-1;t.clamp(),t.words[r>>>2]|=e<<24-r%4*8,t.sigBytes+=e},unpad:function(t){var e=255&t.words[t.sigBytes-1>>>2];t.sigBytes-=e}},U.pad.Iso10126={pad:function(t,e){e*=4,e-=t.sigBytes%e;t.concat(U.lib.WordArray.random(e-1)).concat(U.lib.WordArray.create([e<<24],1))},unpad:function(t){var e=255&t.words[t.sigBytes-1>>>2];t.sigBytes-=e}},U.pad.Iso97971={pad:function(t,e){t.concat(U.lib.WordArray.create([2147483648],1)),U.pad.ZeroPadding.pad(t,e)},unpad:function(t){U.pad.ZeroPadding.unpad(t),t.sigBytes--}},U.pad.ZeroPadding={pad:function(t,e){e*=4;t.clamp(),t.sigBytes+=e-(t.sigBytes%e||e)},unpad:function(t){for(var e=t.words,r=t.sigBytes-1,r=t.sigBytes-1;0<=r;r--)if(e[r>>>2]>>>24-r%4*8&255){t.sigBytes=r+1;break}}},U.pad.NoPadding={pad:function(){},unpad:function(){}},m=(P=U).lib.CipherParams,C=P.enc.Hex,P.format.Hex={stringify:function(t){return t.ciphertext.toString(C)},parse:function(t){t=C.parse(t);return m.create({ciphertext:t})}},function(){var t=U,e=t.lib.BlockCipher,r=t.algo,h=[],l=[],f=[],d=[],u=[],p=[],_=[],y=[],v=[],g=[];!function(){for(var t=[],e=0;e<256;e++)t[e]=e<128?e<<1:e<<1^283;for(var r=0,i=0,e=0;e<256;e++){var n=i^i<<1^i<<2^i<<3^i<<4;h[r]=n=n>>>8^255&n^99;var o=t[l[n]=r],s=t[o],c=t[s],a=257*t[n]^16843008*n;f[r]=a<<24|a>>>8,d[r]=a<<16|a>>>16,u[r]=a<<8|a>>>24,p[r]=a,_[n]=(a=16843009*c^65537*s^257*o^16843008*r)<<24|a>>>8,y[n]=a<<16|a>>>16,v[n]=a<<8|a>>>24,g[n]=a,r?(r=o^t[t[t[c^o]]],i^=t[t[i]]):r=i=1}}();var B=[0,1,2,4,8,16,32,64,128,27,54],r=r.AES=e.extend({_doReset:function(){if(!this._nRounds||this._keyPriorReset!==this._key){for(var t=this._keyPriorReset=this._key,e=t.words,r=t.sigBytes/4,i=4*(1+(this._nRounds=6+r)),n=this._keySchedule=[],o=0;o<i;o++)o<r?n[o]=e[o]:(a=n[o-1],o%r?6<r&&o%r==4&&(a=h[a>>>24]<<24|h[a>>>16&255]<<16|h[a>>>8&255]<<8|h[255&a]):(a=h[(a=a<<8|a>>>24)>>>24]<<24|h[a>>>16&255]<<16|h[a>>>8&255]<<8|h[255&a],a^=B[o/r|0]<<24),n[o]=n[o-r]^a);for(var s=this._invKeySchedule=[],c=0;c<i;c++){var a,o=i-c;a=c%4?n[o]:n[o-4],s[c]=c<4||o<=4?a:_[h[a>>>24]]^y[h[a>>>16&255]]^v[h[a>>>8&255]]^g[h[255&a]]}}},encryptBlock:function(t,e){this._doCryptBlock(t,e,this._keySchedule,f,d,u,p,h)},decryptBlock:function(t,e){var r=t[e+1];t[e+1]=t[e+3],t[e+3]=r,this._doCryptBlock(t,e,this._invKeySchedule,_,y,v,g,l);r=t[e+1];t[e+1]=t[e+3],t[e+3]=r},_doCryptBlock:function(t,e,r,i,n,o,s,c){for(var a=this._nRounds,h=t[e]^r[0],l=t[e+1]^r[1],f=t[e+2]^r[2],d=t[e+3]^r[3],u=4,p=1;p<a;p++)var _=i[h>>>24]^n[l>>>16&255]^o[f>>>8&255]^s[255&d]^r[u++],y=i[l>>>24]^n[f>>>16&255]^o[d>>>8&255]^s[255&h]^r[u++],v=i[f>>>24]^n[d>>>16&255]^o[h>>>8&255]^s[255&l]^r[u++],g=i[d>>>24]^n[h>>>16&255]^o[l>>>8&255]^s[255&f]^r[u++],h=_,l=y,f=v,d=g;_=(c[h>>>24]<<24|c[l>>>16&255]<<16|c[f>>>8&255]<<8|c[255&d])^r[u++],y=(c[l>>>24]<<24|c[f>>>16&255]<<16|c[d>>>8&255]<<8|c[255&h])^r[u++],v=(c[f>>>24]<<24|c[d>>>16&255]<<16|c[h>>>8&255]<<8|c[255&l])^r[u++],g=(c[d>>>24]<<24|c[h>>>16&255]<<16|c[l>>>8&255]<<8|c[255&f])^r[u++];t[e]=_,t[e+1]=y,t[e+2]=v,t[e+3]=g},keySize:8});t.AES=e._createHelper(r)}(),function(){var t=U,e=t.lib,i=e.WordArray,r=e.BlockCipher,e=t.algo,h=[57,49,41,33,25,17,9,1,58,50,42,34,26,18,10,2,59,51,43,35,27,19,11,3,60,52,44,36,63,55,47,39,31,23,15,7,62,54,46,38,30,22,14,6,61,53,45,37,29,21,13,5,28,20,12,4],l=[14,17,11,24,1,5,3,28,15,6,21,10,23,19,12,4,26,8,16,7,27,20,13,2,41,52,31,37,47,55,30,40,51,45,33,48,44,49,39,56,34,53,46,42,50,36,29,32],f=[1,2,4,6,8,10,12,14,15,17,19,21,23,25,27,28],d=[{0:8421888,268435456:32768,536870912:8421378,805306368:2,1073741824:512,1342177280:8421890,1610612736:8389122,1879048192:8388608,2147483648:514,2415919104:8389120,2684354560:33280,2952790016:8421376,3221225472:32770,3489660928:8388610,3758096384:0,4026531840:33282,134217728:0,402653184:8421890,671088640:33282,939524096:32768,1207959552:8421888,1476395008:512,1744830464:8421378,2013265920:2,2281701376:8389120,2550136832:33280,2818572288:8421376,3087007744:8389122,3355443200:8388610,3623878656:32770,3892314112:514,4160749568:8388608,1:32768,268435457:2,536870913:8421888,805306369:8388608,1073741825:8421378,1342177281:33280,1610612737:512,1879048193:8389122,2147483649:8421890,2415919105:8421376,2684354561:8388610,2952790017:33282,3221225473:514,3489660929:8389120,3758096385:32770,4026531841:0,134217729:8421890,402653185:8421376,671088641:8388608,939524097:512,1207959553:32768,1476395009:8388610,1744830465:2,2013265921:33282,2281701377:32770,2550136833:8389122,2818572289:514,3087007745:8421888,3355443201:8389120,3623878657:0,3892314113:33280,4160749569:8421378},{0:1074282512,16777216:16384,33554432:524288,50331648:1074266128,67108864:1073741840,83886080:1074282496,100663296:1073758208,117440512:16,134217728:540672,150994944:1073758224,167772160:1073741824,184549376:540688,201326592:524304,218103808:0,234881024:16400,251658240:1074266112,8388608:1073758208,25165824:540688,41943040:16,58720256:1073758224,75497472:1074282512,92274688:1073741824,109051904:524288,125829120:1074266128,142606336:524304,159383552:0,176160768:16384,192937984:1074266112,209715200:1073741840,226492416:540672,243269632:1074282496,260046848:16400,268435456:0,285212672:1074266128,301989888:1073758224,318767104:1074282496,335544320:1074266112,352321536:16,369098752:540688,385875968:16384,402653184:16400,419430400:524288,436207616:524304,452984832:1073741840,469762048:540672,486539264:1073758208,503316480:1073741824,520093696:1074282512,276824064:540688,293601280:524288,310378496:1074266112,327155712:16384,343932928:1073758208,360710144:1074282512,377487360:16,394264576:1073741824,411041792:1074282496,427819008:1073741840,444596224:1073758224,461373440:524304,478150656:0,494927872:16400,511705088:1074266128,528482304:540672},{0:260,1048576:0,2097152:67109120,3145728:65796,4194304:65540,5242880:67108868,6291456:67174660,7340032:67174400,8388608:67108864,9437184:67174656,10485760:65792,11534336:67174404,12582912:67109124,13631488:65536,14680064:4,15728640:256,524288:67174656,1572864:67174404,2621440:0,3670016:67109120,4718592:67108868,5767168:65536,6815744:65540,7864320:260,8912896:4,9961472:256,11010048:67174400,12058624:65796,13107200:65792,14155776:67109124,15204352:67174660,16252928:67108864,16777216:67174656,17825792:65540,18874368:65536,19922944:67109120,20971520:256,22020096:67174660,23068672:67108868,24117248:0,25165824:67109124,26214400:67108864,27262976:4,28311552:65792,29360128:67174400,30408704:260,31457280:65796,32505856:67174404,17301504:67108864,18350080:260,19398656:67174656,20447232:0,21495808:65540,22544384:67109120,23592960:256,24641536:67174404,25690112:65536,26738688:67174660,27787264:65796,28835840:67108868,29884416:67109124,30932992:67174400,31981568:4,33030144:65792},{0:2151682048,65536:2147487808,131072:4198464,196608:2151677952,262144:0,327680:4198400,393216:2147483712,458752:4194368,524288:2147483648,589824:4194304,655360:64,720896:2147487744,786432:2151678016,851968:4160,917504:4096,983040:2151682112,32768:2147487808,98304:64,163840:2151678016,229376:2147487744,294912:4198400,360448:2151682112,425984:0,491520:2151677952,557056:4096,622592:2151682048,688128:4194304,753664:4160,819200:2147483648,884736:4194368,950272:4198464,1015808:2147483712,1048576:4194368,1114112:4198400,1179648:2147483712,1245184:0,1310720:4160,1376256:2151678016,1441792:2151682048,1507328:2147487808,1572864:2151682112,1638400:2147483648,1703936:2151677952,1769472:4198464,1835008:2147487744,1900544:4194304,1966080:64,2031616:4096,1081344:2151677952,1146880:2151682112,1212416:0,1277952:4198400,1343488:4194368,1409024:2147483648,1474560:2147487808,1540096:64,1605632:2147483712,1671168:4096,1736704:2147487744,1802240:2151678016,1867776:4160,1933312:2151682048,1998848:4194304,2064384:4198464},{0:128,4096:17039360,8192:262144,12288:536870912,16384:537133184,20480:16777344,24576:553648256,28672:262272,32768:16777216,36864:537133056,40960:536871040,45056:553910400,49152:553910272,53248:0,57344:17039488,61440:553648128,2048:17039488,6144:553648256,10240:128,14336:17039360,18432:262144,22528:537133184,26624:553910272,30720:536870912,34816:537133056,38912:0,43008:553910400,47104:16777344,51200:536871040,55296:553648128,59392:16777216,63488:262272,65536:262144,69632:128,73728:536870912,77824:553648256,81920:16777344,86016:553910272,90112:537133184,94208:16777216,98304:553910400,102400:553648128,106496:17039360,110592:537133056,114688:262272,118784:536871040,122880:0,126976:17039488,67584:553648256,71680:16777216,75776:17039360,79872:537133184,83968:536870912,88064:17039488,92160:128,96256:553910272,100352:262272,104448:553910400,108544:0,112640:553648128,116736:16777344,120832:262144,124928:537133056,129024:536871040},{0:268435464,256:8192,512:270532608,768:270540808,1024:268443648,1280:2097152,1536:2097160,1792:268435456,2048:0,2304:268443656,2560:2105344,2816:8,3072:270532616,3328:2105352,3584:8200,3840:270540800,128:270532608,384:270540808,640:8,896:2097152,1152:2105352,1408:268435464,1664:268443648,1920:8200,2176:2097160,2432:8192,2688:268443656,2944:270532616,3200:0,3456:270540800,3712:2105344,3968:268435456,4096:268443648,4352:270532616,4608:270540808,4864:8200,5120:2097152,5376:268435456,5632:268435464,5888:2105344,6144:2105352,6400:0,6656:8,6912:270532608,7168:8192,7424:268443656,7680:270540800,7936:2097160,4224:8,4480:2105344,4736:2097152,4992:268435464,5248:268443648,5504:8200,5760:270540808,6016:270532608,6272:270540800,6528:270532616,6784:8192,7040:2105352,7296:2097160,7552:0,7808:268435456,8064:268443656},{0:1048576,16:33555457,32:1024,48:1049601,64:34604033,80:0,96:1,112:34603009,128:33555456,144:1048577,160:33554433,176:34604032,192:34603008,208:1025,224:1049600,240:33554432,8:34603009,24:0,40:33555457,56:34604032,72:1048576,88:33554433,104:33554432,120:1025,136:1049601,152:33555456,168:34603008,184:1048577,200:1024,216:34604033,232:1,248:1049600,256:33554432,272:1048576,288:33555457,304:34603009,320:1048577,336:33555456,352:34604032,368:1049601,384:1025,400:34604033,416:1049600,432:1,448:0,464:34603008,480:33554433,496:1024,264:1049600,280:33555457,296:34603009,312:1,328:33554432,344:1048576,360:1025,376:34604032,392:33554433,408:34603008,424:0,440:34604033,456:1049601,472:1024,488:33555456,504:1048577},{0:134219808,1:131072,2:134217728,3:32,4:131104,5:134350880,6:134350848,7:2048,8:134348800,9:134219776,10:133120,11:134348832,12:2080,13:0,14:134217760,15:133152,2147483648:2048,2147483649:134350880,2147483650:134219808,2147483651:134217728,2147483652:134348800,2147483653:133120,2147483654:133152,2147483655:32,2147483656:134217760,2147483657:2080,2147483658:131104,2147483659:134350848,2147483660:0,2147483661:134348832,2147483662:134219776,2147483663:131072,16:133152,17:134350848,18:32,19:2048,20:134219776,21:134217760,22:134348832,23:131072,24:0,25:131104,26:134348800,27:134219808,28:134350880,29:133120,30:2080,31:134217728,2147483664:131072,2147483665:2048,2147483666:134348832,2147483667:133152,2147483668:32,2147483669:134348800,2147483670:134217728,2147483671:134219808,2147483672:134350880,2147483673:134217760,2147483674:134219776,2147483675:0,2147483676:133120,2147483677:2080,2147483678:131104,2147483679:134350848}],u=[4160749569,528482304,33030144,2064384,129024,8064,504,2147483679],n=e.DES=r.extend({_doReset:function(){for(var t=this._key.words,e=[],r=0;r<56;r++){var i=h[r]-1;e[r]=t[i>>>5]>>>31-i%32&1}for(var n=this._subKeys=[],o=0;o<16;o++){for(var s=n[o]=[],c=f[o],r=0;r<24;r++)s[r/6|0]|=e[(l[r]-1+c)%28]<<31-r%6,s[4+(r/6|0)]|=e[28+(l[r+24]-1+c)%28]<<31-r%6;s[0]=s[0]<<1|s[0]>>>31;for(r=1;r<7;r++)s[r]=s[r]>>>4*(r-1)+3;s[7]=s[7]<<5|s[7]>>>27}for(var a=this._invSubKeys=[],r=0;r<16;r++)a[r]=n[15-r]},encryptBlock:function(t,e){this._doCryptBlock(t,e,this._subKeys)},decryptBlock:function(t,e){this._doCryptBlock(t,e,this._invSubKeys)},_doCryptBlock:function(t,e,r){this._lBlock=t[e],this._rBlock=t[e+1],p.call(this,4,252645135),p.call(this,16,65535),_.call(this,2,858993459),_.call(this,8,16711935),p.call(this,1,1431655765);for(var i=0;i<16;i++){for(var n=r[i],o=this._lBlock,s=this._rBlock,c=0,a=0;a<8;a++)c|=d[a][((s^n[a])&u[a])>>>0];this._lBlock=s,this._rBlock=o^c}var h=this._lBlock;this._lBlock=this._rBlock,this._rBlock=h,p.call(this,1,1431655765),_.call(this,8,16711935),_.call(this,2,858993459),p.call(this,16,65535),p.call(this,4,252645135),t[e]=this._lBlock,t[e+1]=this._rBlock},keySize:2,ivSize:2,blockSize:2});function p(t,e){e=(this._lBlock>>>t^this._rBlock)&e;this._rBlock^=e,this._lBlock^=e<<t}function _(t,e){e=(this._rBlock>>>t^this._lBlock)&e;this._lBlock^=e,this._rBlock^=e<<t}t.DES=r._createHelper(n);e=e.TripleDES=r.extend({_doReset:function(){var t=this._key.words;if(2!==t.length&&4!==t.length&&t.length<6)throw new Error("Invalid key length - 3DES requires the key length to be 64, 128, 192 or >192.");var e=t.slice(0,2),r=t.length<4?t.slice(0,2):t.slice(2,4),t=t.length<6?t.slice(0,2):t.slice(4,6);this._des1=n.createEncryptor(i.create(e)),this._des2=n.createEncryptor(i.create(r)),this._des3=n.createEncryptor(i.create(t))},encryptBlock:function(t,e){this._des1.encryptBlock(t,e),this._des2.decryptBlock(t,e),this._des3.encryptBlock(t,e)},decryptBlock:function(t,e){this._des3.decryptBlock(t,e),this._des2.encryptBlock(t,e),this._des1.decryptBlock(t,e)},keySize:6,ivSize:2,blockSize:2});t.TripleDES=r._createHelper(e)}(),function(){var t=U,e=t.lib.StreamCipher,r=t.algo,i=r.RC4=e.extend({_doReset:function(){for(var t=this._key,e=t.words,r=t.sigBytes,i=this._S=[],n=0;n<256;n++)i[n]=n;for(var n=0,o=0;n<256;n++){var s=n%r,s=e[s>>>2]>>>24-s%4*8&255,o=(o+i[n]+s)%256,s=i[n];i[n]=i[o],i[o]=s}this._i=this._j=0},_doProcessBlock:function(t,e){t[e]^=n.call(this)},keySize:8,ivSize:0});function n(){for(var t=this._S,e=this._i,r=this._j,i=0,n=0;n<4;n++){var r=(r+t[e=(e+1)%256])%256,o=t[e];t[e]=t[r],t[r]=o,i|=t[(t[e]+t[r])%256]<<24-8*n}return this._i=e,this._j=r,i}t.RC4=e._createHelper(i);r=r.RC4Drop=i.extend({cfg:i.cfg.extend({drop:192}),_doReset:function(){i._doReset.call(this);for(var t=this.cfg.drop;0<t;t--)n.call(this)}});t.RC4Drop=e._createHelper(r)}(),F=(M=U).lib.StreamCipher,P=M.algo,D=[],E=[],R=[],P=P.Rabbit=F.extend({_doReset:function(){for(var t=this._key.words,e=this.cfg.iv,r=0;r<4;r++)t[r]=16711935&(t[r]<<8|t[r]>>>24)|4278255360&(t[r]<<24|t[r]>>>8);for(var i=this._X=[t[0],t[3]<<16|t[2]>>>16,t[1],t[0]<<16|t[3]>>>16,t[2],t[1]<<16|t[0]>>>16,t[3],t[2]<<16|t[1]>>>16],n=this._C=[t[2]<<16|t[2]>>>16,4294901760&t[0]|65535&t[1],t[3]<<16|t[3]>>>16,4294901760&t[1]|65535&t[2],t[0]<<16|t[0]>>>16,4294901760&t[2]|65535&t[3],t[1]<<16|t[1]>>>16,4294901760&t[3]|65535&t[0]],r=this._b=0;r<4;r++)N.call(this);for(r=0;r<8;r++)n[r]^=i[r+4&7];if(e){var o=e.words,s=o[0],c=o[1],e=16711935&(s<<8|s>>>24)|4278255360&(s<<24|s>>>8),o=16711935&(c<<8|c>>>24)|4278255360&(c<<24|c>>>8),s=e>>>16|4294901760&o,c=o<<16|65535&e;n[0]^=e,n[1]^=s,n[2]^=o,n[3]^=c,n[4]^=e,n[5]^=s,n[6]^=o,n[7]^=c;for(r=0;r<4;r++)N.call(this)}},_doProcessBlock:function(t,e){var r=this._X;N.call(this),D[0]=r[0]^r[5]>>>16^r[3]<<16,D[1]=r[2]^r[7]>>>16^r[5]<<16,D[2]=r[4]^r[1]>>>16^r[7]<<16,D[3]=r[6]^r[3]>>>16^r[1]<<16;for(var i=0;i<4;i++)D[i]=16711935&(D[i]<<8|D[i]>>>24)|4278255360&(D[i]<<24|D[i]>>>8),t[e+i]^=D[i]},blockSize:4,ivSize:2}),M.Rabbit=F._createHelper(P),F=(M=U).lib.StreamCipher,P=M.algo,W=[],O=[],I=[],P=P.RabbitLegacy=F.extend({_doReset:function(){for(var t=this._key.words,e=this.cfg.iv,r=this._X=[t[0],t[3]<<16|t[2]>>>16,t[1],t[0]<<16|t[3]>>>16,t[2],t[1]<<16|t[0]>>>16,t[3],t[2]<<16|t[1]>>>16],i=this._C=[t[2]<<16|t[2]>>>16,4294901760&t[0]|65535&t[1],t[3]<<16|t[3]>>>16,4294901760&t[1]|65535&t[2],t[0]<<16|t[0]>>>16,4294901760&t[2]|65535&t[3],t[1]<<16|t[1]>>>16,4294901760&t[3]|65535&t[0]],n=this._b=0;n<4;n++)q.call(this);for(n=0;n<8;n++)i[n]^=r[n+4&7];if(e){var o=e.words,s=o[0],t=o[1],e=16711935&(s<<8|s>>>24)|4278255360&(s<<24|s>>>8),o=16711935&(t<<8|t>>>24)|4278255360&(t<<24|t>>>8),s=e>>>16|4294901760&o,t=o<<16|65535&e;i[0]^=e,i[1]^=s,i[2]^=o,i[3]^=t,i[4]^=e,i[5]^=s,i[6]^=o,i[7]^=t;for(n=0;n<4;n++)q.call(this)}},_doProcessBlock:function(t,e){var r=this._X;q.call(this),W[0]=r[0]^r[5]>>>16^r[3]<<16,W[1]=r[2]^r[7]>>>16^r[5]<<16,W[2]=r[4]^r[1]>>>16^r[7]<<16,W[3]=r[6]^r[3]>>>16^r[1]<<16;for(var i=0;i<4;i++)W[i]=16711935&(W[i]<<8|W[i]>>>24)|4278255360&(W[i]<<24|W[i]>>>8),t[e+i]^=W[i]},blockSize:4,ivSize:2}),M.RabbitLegacy=F._createHelper(P),U});
__vod_group_sources.push({handlers:{"loadResource":(typeof loadResource==="function"?loadResource:null)}});})();
async function __vod_group_榜单(params = {}) { if(String(params["榜单_section"]||"0")==="0") { const f=__vod_group_sources[0].handlers["getNetflixNew"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="1") { const f=__vod_group_sources[0].handlers["getDisneyNew"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="2") { const f=__vod_group_sources[0].handlers["getAppleTvNew"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="3") { const f=__vod_group_sources[0].handlers["getHboNew"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="4") { const f=__vod_group_sources[0].handlers["getPrimeVideoNew"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="5") { const f=__vod_group_sources[0].handlers["getWeeklyDomesticDrama"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="6") { const f=__vod_group_sources[0].handlers["getWeeklyUSDrama"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="7") { const f=__vod_group_sources[0].handlers["getWeeklyAnime"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="8") { const f=__vod_group_sources[0].handlers["getWeeklyMovie"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="9") { const f=__vod_group_sources[0].handlers["getWeeklyKDrama"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="10") { const f=__vod_group_sources[0].handlers["getWeeklyUKDrama"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="11") { const f=__vod_group_sources[0].handlers["getWeeklyJDrama"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="12") { const f=__vod_group_sources[0].handlers["getWeeklyThaiDrama"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="13") { const f=__vod_group_sources[0].handlers["getWeeklyVariety"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="14") { const f=__vod_group_sources[0].handlers["getWeeklyDocumentary"]; return f ? await f({}) : []; } return []; }
async function __vod_group_豆瓣(params = {}) { if(String(params["豆瓣_section"]||"0")==="0") { const f=__vod_group_sources[1].handlers["list"]; return f ? await f({"list": params["豆瓣_m0_list"],"url": params["豆瓣_m0_url"],"page": params["豆瓣_m0_page"]}) : []; } if(String(params["豆瓣_section"]||"0")==="1") { const f=__vod_group_sources[1].handlers["listComingSoon"]; return f ? await f({"page": params["豆瓣_m1_page"]}) : []; } return []; }
async function __vod_group_欧乐(params = {}) { if(String(params["欧乐_section"]||"0")==="0") { const f=__vod_group_sources[2].handlers["loadMovieList"]; return f ? await f({"area": params["欧乐_m0_area"],"sort_by": params["欧乐_m0_sort_by"],"page": params["欧乐_m0_page"]}) : []; } if(String(params["欧乐_section"]||"0")==="1") { const f=__vod_group_sources[2].handlers["loadTvList"]; return f ? await f({"area": params["欧乐_m1_area"],"sort_by": params["欧乐_m1_sort_by"],"page": params["欧乐_m1_page"]}) : []; } if(String(params["欧乐_section"]||"0")==="2") { const f=__vod_group_sources[2].handlers["loadVarietyList"]; return f ? await f({"area": params["欧乐_m2_area"],"sort_by": params["欧乐_m2_sort_by"],"page": params["欧乐_m2_page"]}) : []; } if(String(params["欧乐_section"]||"0")==="3") { const f=__vod_group_sources[2].handlers["loadAnimeList"]; return f ? await f({"area": params["欧乐_m3_area"],"sort_by": params["欧乐_m3_sort_by"],"page": params["欧乐_m3_page"]}) : []; } if(String(params["欧乐_section"]||"0")==="4") { const f=__vod_group_sources[2].handlers["loadShortList"]; return f ? await f({"area": params["欧乐_m4_area"],"sort_by": params["欧乐_m4_sort_by"],"page": params["欧乐_m4_page"]}) : []; } if(String(params["欧乐_section"]||"0")==="5") { const f=__vod_group_sources[2].handlers["searchOle"]; return f ? await f({"wd": params["欧乐_m5_wd"],"pg": params["欧乐_m5_pg"]}) : []; } if(String(params["欧乐_section"]||"0")==="6") { const f=__vod_group_sources[2].handlers["searchOle"]; return f ? await f({"wd": params["欧乐_m6_wd"],"pg": params["欧乐_m6_pg"]}) : []; } return []; }
async function __vod_group_人人(params = {}) {  return []; }
async function loadDetail(link){for(const s of __vod_group_sources){if(typeof s.handlers.loadDetail==="function"){try{const r=await s.handlers.loadDetail(link);if(r)return r}catch(_){}}}return null;}

 return {
"__vod_group_榜单": (typeof __vod_group_榜单 === "function" ? __vod_group_榜单 : null),
"__vod_group_豆瓣": (typeof __vod_group_豆瓣 === "function" ? __vod_group_豆瓣 : null),
"__vod_group_欧乐": (typeof __vod_group_欧乐 === "function" ? __vod_group_欧乐 : null),
"__vod_group_人人": (typeof __vod_group_人人 === "function" ? __vod_group_人人 : null)
 };
})();
async function vodMerged_0(params = {}) { const f=VOD_MERGED["__vod_group_榜单"]; return f ? await f(params) : []; }
async function vodMerged_1(params = {}) { const f=VOD_MERGED["__vod_group_豆瓣"]; return f ? await f(params) : []; }
async function vodMerged_2(params = {}) { const f=VOD_MERGED["__vod_group_欧乐"]; return f ? await f(params) : []; }
async function vodMerged_3(params = {}) { const f=VOD_MERGED["__vod_group_人人"]; return f ? await f(params) : []; }

async function loadVodHubMerged(params = {}) {
 const src=params.vod_list||"榜单";
 const map={"榜单":"__vod_group_榜单","豆瓣":"__vod_group_豆瓣","欧乐":"__vod_group_欧乐","人人":"__vod_group_人人"};
 const section={"榜单":"榜单_section","豆瓣":"豆瓣_section","欧乐":"欧乐_section","人人":"人人_section"};
 const fn=VOD_MERGED[map[src]]; if(!fn)return []; const p={...params}; p[section[src]]=params[section[src]]||"0"; return await fn(p);
}

// ================= 流媒体独家原创Pro =================
const ORIGINALS_GENRE_MAP = {10759:"动作冒险",16:"动画",35:"喜剧",80:"犯罪",99:"纪录片",18:"剧情",10751:"家庭",10762:"儿童",9648:"悬疑",10764:"真人秀",10765:"科幻",10767:"脱口秀",28:"动作",12:"冒险",14:"奇幻",878:"科幻",27:"恐怖",10749:"爱情",53:"惊悚"};
function originalsShortDate(s){if(!s)return "";const d=new Date(s);return String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function originalsCard(item, type, subtitle, year, date){return {id:String(item.id),tmdbId:parseInt(item.id),type:"tmdb",mediaType:type,title:item.name||item.title||item.original_name,genreTitle:subtitle,subTitle:subtitle,description:subtitle+" · ⭐ "+(item.vote_average?item.vote_average.toFixed(1):"0.0")+"\n"+(item.overview||"暂无简介"),posterPath:item.poster_path?"https://image.tmdb.org/t/p/w500"+item.poster_path:"",backdropPath:item.backdrop_path?"https://image.tmdb.org/t/p/w780"+item.backdrop_path:"",rating:item.vote_average||0,year:year||"",releaseDate:date||""};}
async function loadPlatformOriginalsHub(params={}){const networkId=params.original_platform||"213",contentType=params.original_contentType||"tv",sortBy=params.original_sortBy||"popularity.desc",page=Number(params.page||1);let endpoint=contentType==="movie"?"/discover/movie":"/discover/tv";let q={with_networks:networkId,language:"zh-CN",include_null_first_air_dates:false,page};if(contentType==="movie"){q.sort_by=sortBy==="first_air_date.desc"?"release_date.desc":(sortBy==="next_episode"||sortBy==="daily_airing"?"popularity.desc":sortBy);}else{if(contentType==="anime")q.with_genres="16";if(contentType==="variety")q.with_genres="10764|10767";if(sortBy==="daily_airing"){const d=new Date().toISOString().split("T")[0];q["air_date.gte"]=d;q["air_date.lte"]=d;q.sort_by="popularity.desc";}else{q.sort_by=sortBy.includes("vote_average")?"vote_average.desc":(sortBy==="next_episode"?"popularity.desc":sortBy);if(sortBy.includes("vote_average"))q["vote_count.gte"]=100;}}try{const r=await Widget.tmdb.get(endpoint,{params:q});const isUpdate=sortBy==="next_episode"||sortBy==="daily_airing";return (r.results||[]).slice(0,20).map(item=>{const date=item.first_air_date||item.release_date||"";const genre=(item.genre_ids||[]).map(x=>ORIGINALS_GENRE_MAP[x]).filter(Boolean)[0]||(contentType==="movie"?"电影":contentType==="anime"?"动漫":contentType==="variety"?"综艺":"剧集");return originalsCard(item,contentType==="movie"?"movie":"tv",isUpdate?((date?originalsShortDate(date):"")+" 首播 "+genre):genre,isUpdate?"":date.slice(0,4),date);});}catch(e){return [{id:"originals_error",type:"text",title:"请求失败",description:e.message||"加载失败"}];}}

async function loadPlatformFlowHub(params = {}) { const source=params.platform_flow_source||"matrix"; if(source==="originals") return await loadPlatformOriginalsHub(params); if(source==="global") return await loadGlobalPlatformHub(params); return await loadPlatformMatrix(params); }

// 全球影视平台ALL IN ONE 子列表实现
const GLOBAL_PLATFORM_MAP = {netflix:{network:"213",provider:"8",region:"US",name:"Netflix"},hbo:{network:"49|3186",provider:"118",region:"US",name:"HBO"},disney:{network:"2739",provider:"337",region:"US",name:"Disney+"},apple:{network:"2552",provider:"350",region:"US",name:"Apple TV+"},amazon:{network:"1024",provider:"119",region:"US",name:"Amazon"},tencent:{network:"2007|3353",provider:"138",region:"CN",name:"腾讯"},iqiyi:{network:"1330",provider:"238",region:"CN",name:"爱奇艺"},youku:{network:"1419",provider:"331",region:"CN",name:"优酷"},mango:{network:"1631",provider:"1944",region:"CN",name:"芒果"},bilibili:{network:"1605",provider:"2280",region:"CN",name:"B站"},hunan:{network:"952",name:"湖南卫视"},zhejiang:{network:"989",name:"浙江卫视"},dragon:{network:"1056",name:"东方卫视"},cctv8:{network:"521",name:"CCTV-8"},viutv:{network:"2146",name:"ViuTV"},linetv:{network:"1671",name:"LINE TV"},hami:{network:"4571",name:"Hami"},catchplay:{network:"5002",name:"CATCHPLAY"},tvn:{network:"866",name:"tvN"},sbs:{network:"156",name:"SBS"},kbs2:{network:"342",name:"KBS2"},abc:{network:"2",name:"ABC"},natgeo:{network:"43",name:"国家地理"},all:{name:"综合"}};
async function loadGlobalPlatformHub(params={}){const p=params.global_platform||"netflix",t="all",sort=params.global_sortBy||"hot",page=Number(params.global_page||1),c=GLOBAL_PLATFORM_MAP[p]||GLOBAL_PLATFORM_MAP.all;const movie=t==="movie",q={language:"zh-CN",page,sort_by:sort==="top"?"vote_average.desc":sort==="new"?(movie?"primary_release_date.desc":"first_air_date.desc"):"popularity.desc"};if(p!=="all")movie&&c.provider?(q.with_watch_providers=c.provider,q.watch_region=c.region||"US"):q.with_networks=c.network;if(t==="anime")q.with_genres="16";if(t==="variety")q.with_genres="10764|10767";if(t==="tv")q.without_genres="16,10764,10767";if(sort==="top")q["vote_count.gte"]=30;try{const r=await Widget.tmdb.get("discover/"+(movie?"movie":"tv"),{params:q});return(r.results||[]).map(x=>({id:String(x.id),tmdbId:x.id,type:"tmdb",mediaType:movie?"movie":"tv",title:x.title||x.name,posterPath:x.poster_path||"",backdropPath:x.backdrop_path||"",releaseDate:x.release_date||x.first_air_date||"",rating:x.vote_average||0,genreTitle:c.name,description:`${c.name} | ⭐ ${x.vote_average||0}
${x.overview||"暂无简介"}`}));}catch(e){return[];}}


// ================= 导入：全球影视平台 =================
// ================= 1. 核心映射配置 (全球ID库) =================

const GLOBAL_NETWORK_PLATFORM_MAP_IMPORTED = {
    netflix: { network: "213", provider: "8", region: "US", name: "Netflix" },
    hbo:     { network: "49|3186", provider: "118", region: "US", name: "HBO" },
    disney:  { network: "2739", provider: "337", region: "US", name: "Disney+" },
    apple:   { network: "2552", provider: "350", region: "US", name: "Apple TV+" },
    amazon:  { network: "1024", provider: "119", region: "US", name: "Amazon" },
    tencent: { network: "2007|3353", provider: "138", region: "CN", name: "腾讯" },
    iqiyi:   { network: "1330", provider: "238", region: "CN", name: "爱奇艺" },
    youku:   { network: "1419", provider: "331", region: "CN", name: "优酷" },
    mango:   { network: "1631", provider: "1944", region: "CN", name: "芒果" },
    bilibili:{ network: "1605", provider: "2280", region: "CN", name: "B站" },
    hunan:   { network: "952", provider: null, region: "CN", name: "湖南卫视" },
    zhejiang:{ network: "989", provider: null, region: "CN", name: "浙江卫视" },
    dragon:  { network: "1056", provider: null, region: "CN", name: "东方卫视" },
    cctv8:   { network: "521", provider: null, region: "CN", name: "CCTV-8" },
    viutv:   { network: "2146", provider: null, region: "HK", name: "ViuTV" },
    linetv:  { network: "1671", provider: null, region: "TW", name: "LINE TV" },
    hami:    { network: "4571", provider: null, region: "TW", name: "Hami" },
    catchplay:{ network: "5002", provider: null, region: "TW", name: "CATCHPLAY" },
    tvn:     { network: "866", provider: null, region: "KR", name: "tvN" },
    sbs:     { network: "156", provider: null, region: "KR", name: "SBS" },
    kbs2:    { network: "342", provider: null, region: "KR", name: "KBS2" },
    abc:     { network: "2", provider: null, region: "US", name: "ABC" },
    natgeo:  { network: "43", provider: null, region: "US", name: "国家地理" },
    all:     { network: null, provider: null, region: null, name: "综合" }
};

const GLOBAL_NETWORK_GENRE_MAP_IMPORTED = {
    28: "动作", 12: "冒险", 16: "动画", 35: "喜剧", 80: "犯罪", 99: "纪录片",
    18: "剧情", 10751: "家庭", 14: "奇幻", 36: "历史", 27: "恐怖", 10402: "音乐",
    9648: "悬疑", 10749: "爱情", 878: "科幻", 10770: "电视电影", 53: "惊悚",
    10752: "战争", 37: "西部", 10759: "动作冒险", 10764: "真人秀", 10767: "脱口秀"
};

function getGlobalNetworkGenreText(ids) {
    if (!ids || !Array.isArray(ids)) return "影视";
    const genres = ids.map(id => GLOBAL_NETWORK_GENRE_MAP_IMPORTED[id]).filter(Boolean);
    return genres.length > 0 ? genres.slice(0, 2).join(" / ") : "影视";
}

// 🎯 核心修正：完全向你的二次元代码对齐
function buildGlobalNetworkItem(item, isMovie, platformName) {
    if (!item) return null;
    
    const mediaType = isMovie ? "movie" : "tv";
    const title = item.title || item.name;
    const releaseDate = item.release_date || item.first_air_date || "";
    const score = item.vote_average ? item.vote_average.toFixed(1) : "0.0";
    const genreText = getGlobalNetworkGenreText(item.genre_ids);
    
    let typeTag = isMovie ? "🎬" : "📺";
    if (item.genre_ids?.includes(16)) typeTag = "🐰";
    if (item.genre_ids?.includes(10764) || item.genre_ids?.includes(10767)) typeTag = "🎤";

    return {
        id: String(item.id),
        tmdbId: parseInt(item.id),
        type: "tmdb", // 🔑 魔法 2：内层项目为 tmdb 类型，完全适配框架逻辑
        mediaType: mediaType,
        title: title,
        
        genreTitle: genreText, 
        
        // 🔑 魔法 3：竖版下这行显示在副标题位置
        description: `${typeTag} ${platformName} | ⭐ ${score}`, 
        
        // 传给内核的日期，横版排版会自动提年份
        releaseDate: releaseDate, 
        
        // 🔑 魔法 4：彻底抛弃 coverUrl，严格使用 posterPath 和 backdropPath
        posterPath: item.poster_path ? item.poster_path || "" : "",
        backdropPath: item.backdrop_path ? item.backdrop_path || "" : "",
        
        rating: score
    };
}

// ================= 2. 核心请求逻辑 =================

async function loadGlobalNetworkPlatform(params = {}) {
    if (params.global_source === "diversion") {
        const page = Number(params.diversion_page || 1);
        if (params.diversion_list === "matrix") return await loadGlobalMatrixSublist({ sort_by: params.diversion_matrix_platform || "2007", category: params.diversion_category || "tv_drama", sort: params.diversion_sort || "popularity.desc", page });
        return await loadGlobalTrendSublist({ sort_by: params.diversion_sort_by || "trakt_trending", page, traktType: params.diversion_traktType, traktClientId: params.traktClientId });
    }
    // 👈 逻辑接管：获取平台选择
    const platform = params.sort_by || "netflix";
    const mediaType = params.mediaType || "tv";
    const category = params.sortBy || "hot";
    const page = params.page || 1;

    const today = new Date().toISOString().split('T')[0];
    const isMovie = (mediaType === "movie");
    const endpoint = isMovie ? "/discover/movie" : "/discover/tv";
    const platformConfig = GLOBAL_NETWORK_PLATFORM_MAP_IMPORTED[platform];

    let queryParams = {
        language: "zh-CN",
        page: page
    };

    if (platform !== "all") {
        if (isMovie) {
            if (!platformConfig.provider) {
                return [{ id: "empty", type: "text", title: "无电影分类", description: `[${platformConfig.name}] 暂不支持该分类。` }];
            }
            queryParams.with_watch_providers = platformConfig.provider;
            queryParams.watch_region = platformConfig.region || "US";
        } else {
            queryParams.with_networks = platformConfig.network;
        }
    }

    if (mediaType === "anime") {
        queryParams.with_genres = "16";
    } else if (mediaType === "variety") {
        queryParams.with_genres = "10764|10767";
    } else if (mediaType === "tv") {
        queryParams.without_genres = "16,10764,10767";
    }

    if (category === "hot") {
        queryParams.sort_by = "popularity.desc";
        queryParams["vote_count.gte"] = 2;
    } 
    else if (category === "new") {
        queryParams.sort_by = isMovie ? "primary_release_date.desc" : "first_air_date.desc";
        if (isMovie) {
            queryParams["primary_release_date.lte"] = today;
        } else {
            queryParams["first_air_date.lte"] = today;
        }
    } 
    else if (category === "top") {
        queryParams.sort_by = "vote_average.desc";
        queryParams["vote_count.gte"] = 30; 
    }

    try {
        const res = await Widget.tmdb.get(endpoint, { params: queryParams });
        const items = (res.results || []).map(i => buildGlobalNetworkItem(i, isMovie, platformConfig.name)).filter(Boolean);

        if (items.length === 0) {
             return [{ id: "empty", type: "text", title: "无数据", description: `在 [${platformConfig.name}] 暂未找到符合该条件的影视记录` }];
        }

        return items;

    } catch (error) {
        return [{ id: "error", type: "text", title: "网络异常", description: "请求失败，请重试" }];
    }
}


// ===== 全球影视平台子列表：分流聚合（防风控版） =====
// ===== 全球影视平台子列表：分流聚合（防风控版） =====
// --- 更新：全新的内置 Trakt Client ID ---
const PRO_DEFAULT_TRAKT_ID = "95b59922670c84040db3632c7aac6f33704f6ffe5cbf3113a056e37cb45cb482";

const PRO_GENRE_MAP = {
    28: "动作", 12: "冒险", 16: "动画", 35: "喜剧", 80: "犯罪", 99: "纪录片",
    18: "剧情", 10751: "家庭", 14: "奇幻", 36: "历史", 27: "恐怖", 10402: "音乐",
    9648: "悬疑", 10749: "爱情", 878: "科幻", 10770: "电视电影", 53: "惊悚",
    10752: "战争", 37: "西部", 10759: "动作冒险", 10762: "儿童", 10763: "新闻",
    10764: "真人秀", 10765: "科幻奇幻", 10766: "肥皂剧", 10767: "脱口秀", 10768: "战争政治"
};

function proGetGenreText(ids) {
    if (!ids || !Array.isArray(ids)) return "";
    return ids.map(id => PRO_GENRE_MAP[id]).filter(Boolean).slice(0, 3).join(" / ");
}

// --- 适配 Video 横竖版的 proBuildItem 函数 ---
function proBuildItem({ id, tmdbId, type, title, date, poster, backdrop, rating, genreText, subTitle, desc }) {
    // 拼接评分、日期和剧情简介
    const baseInfo = date ? `${date} · ${subTitle || '⭐ ' + rating}` : (subTitle || `⭐ ${rating}`);
    const overview = desc ? `\n${desc}` : "\n暂无简介";

    return {
        id: String(id),
        tmdbId: parseInt(tmdbId),
        type: "tmdb",
        mediaType: type,
        title: title,
        
        // 横版：只保留流派和类型
        genreTitle: genreText || (type === "tv" ? "剧集" : "电影"), 
        
        // 竖版详情页展示评分、日期和剧情简介
        description: baseInfo + overview,
        
        // 传递给内核提取横版年份
        releaseDate: date,
        
        posterPath: poster ? poster || "" : "",
        backdropPath: backdrop ? backdrop || "" : "",
        rating: parseFloat(rating) || 0,
        subTitle: subTitle // 备用保留
    };
}

// =========================================================================
// 1. 业务逻辑
// =========================================================================

async function loadGlobalTrendSublist(params = {}) {
    // 👈 逻辑接管：获取右上角选中的榜单
    const source = params.sort_by || "trakt_trending";
    const traktType = params.traktType || "all";
    const page = params.page || 1; 
    const traktClientId = params.traktClientId || PRO_DEFAULT_TRAKT_ID;

    // --- Trakt (支持混合模式) ---
    if (source.startsWith("trakt_")) {
        const listType = source.replace("trakt_", ""); 
        let rawData = [];

        // 1. 混合模式 (All)
        if (traktType === "all") {
            const [movies, shows] = await Promise.all([
                proFetchTraktData("movies", listType, traktClientId, page),
                proFetchTraktData("shows", listType, traktClientId, page)
            ]);
            rawData = [...movies, ...shows];
            
            rawData.sort((a, b) => {
                const valA = a.watchers || a.list_count || 0;
                const valB = b.watchers || b.list_count || 0;
                if (valA === 0 && valB === 0) return 0;
                return valB - valA; // 降序
            });
            
        } else {
            // 单一模式
            rawData = await proFetchTraktData(traktType, listType, traktClientId, page);
        }
        
        if (!rawData || rawData.length === 0) return page === 1 ? await proFetchTmdbFallback(traktType === "all" ? "movie" : traktType) : [];

        // 2. 处理数据
        const promises = rawData.slice(0, 20).map(async (item, index) => {
            let subject = item.show || item.movie || item;
            const mediaType = item.show ? "tv" : "movie";
            
            let rank = (page - 1) * 15 + index + 1;
            let stats = "";
            
            if (listType === "trending") stats = `🔥 ${item.watchers || 0} 人在看`;
            else if (listType === "anticipated") stats = `❤️ ${item.list_count || 0} 人想看`;
            else stats = `No. ${rank}`; // Popular

            if (traktType === "all") {
                stats = `[${mediaType === "tv" ? "剧" : "影"}] ${stats}`;
            }

            if (!subject || !subject.ids || !subject.ids.tmdb) return null;
            return await proFetchTmdbDetail(subject.ids.tmdb, mediaType, stats, subject.title);
        });
        return (await Promise.all(promises)).filter(Boolean);
    }

    // --- Douban (保持不变) ---
    if (source.startsWith("db_")) {
        let tag = "热门", type = "tv";
        if (source === "db_tv_cn") { tag = "国产剧"; type = "tv"; }
        else if (source === "db_variety") { tag = "综艺"; type = "tv"; }
        else if (source === "db_movie") { tag = "热门"; type = "movie"; }
        else if (source === "db_tv_us") { tag = "美剧"; type = "tv"; }
        return await proFetchDoubanAndMap(tag, type, page);
    }

    // --- Bilibili / Bangumi (保持不变) ---
    if (source.startsWith("bili_")) {
        const type = source === "bili_cn" ? 4 : 1; 
        return await proFetchBilibiliRank(type, page);
    }
    if (source === "bgm_daily") {
        if (page > 1) return [];
        return await proFetchBangumiDaily();
    }
}

async function loadGlobalMatrixSublist(params = {}) {
    // 👈 逻辑接管：获取右上角选中的平台
    const platformId = params.sort_by || "2007";
    const category = params.category || "tv_drama";
    const sort = params.sort || "popularity.desc";
    const page = params.page || 1;

    const foreignPlatforms = ["213", "2739", "49", "2552"];
    if (category === "movie" && !foreignPlatforms.includes(platformId)) {
        return page === 1 ? [{ id: "empty", type: "text", title: "暂不支持国内平台电影", description: "请切换为剧集或国外平台" }] : [];
    }

    const queryParams = {
        language: "zh-CN",
        sort_by: sort, // 排序方式，继续使用安全的 sort
        page: page,
        include_adult: false,
        include_null_first_air_dates: false
    };

    if (category.startsWith("tv_")) {
        queryParams.with_networks = platformId;
        if (category === "tv_anime") queryParams.with_genres = "16";
        else if (category === "tv_variety") queryParams.with_genres = "10764|10767";
        else if (category === "tv_drama") queryParams.without_genres = "16,10764,10767";
        
        return await proFetchTmdbDiscover("tv", queryParams);

    } else if (category === "movie") {
        const usMap = { "213":"8", "2739":"337", "49":"1899|15", "2552":"350" };
        queryParams.watch_region = "US";
        queryParams.with_watch_providers = usMap[platformId];
        
        return await proFetchTmdbDiscover("movie", queryParams);
    }
}

// =========================================================================
// 2. 数据获取 (Helpers)
// =========================================================================

async function proFetchTmdbDiscover(mediaType, params) {
    try {
        const res = await Widget.tmdb.get(`/discover/${mediaType}`, { params });
        const data = res || {};
        if (!data.results || data.results.length === 0) return params.page === 1 ? [{ id: "empty", type: "text", title: "暂无数据" }] : [];
        
        return data.results.map(item => {
            const date = item.first_air_date || item.release_date || "";
            const genreText = proGetGenreText(item.genre_ids);
            
            return proBuildItem({
                id: item.id,
                tmdbId: item.id,
                type: mediaType,
                title: item.name || item.title,
                date: date,
                poster: item.poster_path,
                backdrop: item.backdrop_path,
                rating: item.vote_average?.toFixed(1) || "0.0",
                genreText: genreText,
                subTitle: `⭐ ${item.vote_average?.toFixed(1)}`,
                desc: item.overview // 传入简介
            });
        });
    } catch (e) { return [{ id: "err", type: "text", title: "加载失败" }]; }
}

async function proFetchTmdbDetail(id, type, stats, title) {
    try {
        const d = await Widget.tmdb.get(`/${type}/${id}`, { params: { language: "zh-CN" } });
        const date = d.first_air_date || d.release_date || "";
        const genreText = (d.genres || []).map(g => g.name).slice(0, 3).join(" / ");
        
        return proBuildItem({
            id: d.id,
            tmdbId: d.id,
            type: type,
            title: d.name || d.title || title,
            date: date,
            poster: d.poster_path,
            backdrop: d.backdrop_path,
            rating: d.vote_average?.toFixed(1),
            genreText: genreText,
            subTitle: stats,
            desc: d.overview // 传入简介
        });
    } catch (e) { return null; }
}

async function proSearchTmdb(query, type) {
    const q = query.replace(/第[一二三四五六七八九十\d]+[季章]/g, "").trim();
    try {
        const res = await Widget.tmdb.get(`/search/${type}`, { 
            params: { query: encodeURIComponent(q), language: "zh-CN" } 
        });
        return (res.results || [])[0];
    } catch (e) { return null; }
}

// --- 更新：支持混合平台数据的排版融合 ---
function proMergeTmdb(target, source) {
    target.id = String(source.id);
    target.tmdbId = source.id;
    target.posterPath = source.poster_path ? `https://image.tmdb.org/t/p/w500${source.poster_path}` : target.posterPath;
    target.backdropPath = source.backdrop_path ? `https://image.tmdb.org/t/p/w780${source.backdrop_path}` : "";
    
    const date = source.first_air_date || source.release_date || "";
    const genreText = proGetGenreText(source.genre_ids);
    
    target.genreTitle = genreText || (target.mediaType === "tv" ? "剧集" : "电影");
    target.releaseDate = date;
    
    // 合并数据时，把 TMDB 查到的 overview 剧情拼接到末尾
    const baseInfo = date ? `${date} · ${target.subTitle}` : target.subTitle;
    const overview = source.overview ? `\n${source.overview}` : "\n暂无简介";
    target.description = baseInfo + overview;
    
    target.rating = source.vote_average ? parseFloat(source.vote_average) : 0;
}

// =========================================================================
// 第三方源 (防风控策略加强版)
// =========================================================================

async function proFetchTraktData(type, list, id, page) {
    try {
        const res = await Widget.http.get(`https://api.trakt.tv/${type}/${list}?limit=15&page=${page}`, {
            headers: { "Content-Type": "application/json", "trakt-api-version": "2", "trakt-api-key": id }
        });
        return res.data || [];
    } catch (e) { return []; }
}

async function proFetchDoubanAndMap(tag, type, page) {
    const start = (page - 1) * 20;
    try {
        // 💡 终极修复：伪造一个随机的豆瓣访客 Cookie (bid)，这是突破部分风控的关键
        const randomBid = Math.random().toString(36).substring(2, 13);
        
        const res = await Widget.http.get(`https://movie.douban.com/j/search_subjects?type=${type}&tag=${encodeURIComponent(tag)}&sort=recommend&page_limit=20&page_start=${start}`, {
            headers: { 
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
                "Referer": "https://movie.douban.com/explore", // 模拟从发现页点击进入
                "Host": "movie.douban.com",
                // 💡 告诉豆瓣：我是通过网页里的 AJAX 正常请求的，不是爬虫工具
                "X-Requested-With": "XMLHttpRequest", 
                "Accept": "application/json, text/javascript, */*; q=0.01",
                "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
                "Connection": "keep-alive",
                // 💡 携带随机生成的 Cookie，骗过基础的身份校验
                "Cookie": `bid=${randomBid};`
            }
        });

        // 豆瓣有时即使不报错，也会因为风控返回乱码或空数据，这里做个安全解析判断
        const data = (typeof res.data === 'string') ? JSON.parse(res.data) : (res.data || {});
        const list = data.subjects || [];
        
        if (list.length === 0) return page === 1 ? [{ id: "empty", type: "text", title: "暂无数据" }] : [];
        
        const promises = list.map(async (item, i) => {
            let finalItem = { 
                id: `db_${item.id}`, type: "tmdb", mediaType: type, 
                title: item.title, // 去掉前面的数字序号
                subTitle: `豆瓣🫛 ${item.rate}`, 
                description: `豆瓣 ${item.rate}
暂无简介`, // 预设简介格式
                genreTitle: type === "tv" ? "剧集" : "电影",
                posterPath: item.cover 
            };
            const tmdb = await proSearchTmdb(item.title, type);
            if (tmdb) proMergeTmdb(finalItem, tmdb); 
            return finalItem;
        });
        return await Promise.all(promises);
        
    } catch (e) { 
        console.error("豆瓣风控拦截或网络异常:", e);
        return [{ 
            id: "err", 
            type: "text", 
            title: "豆瓣拒绝了请求", 
            description: "对方所在的网络IP被豆瓣限制。请尝试切换手机流量(4G/5G)或重启路由器换个IP再试。" 
        }]; 
    }
}

async function proFetchBilibiliRank(type, page) {
    try {
        const res = await Widget.http.get(`https://api.bilibili.com/pgc/web/rank/list?day=3&season_type=${type}`);
        const allList = (res.data?.result?.list || res.data?.data?.list || []);
        
        const pageSize = 15;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        
        if (start >= allList.length) return [];
        const list = allList.slice(start, end);
        
        const promises = list.map(async (item, i) => {
            const rank = start + i + 1;
            let finalItem = { 
                id: `bili_${rank}`, type: "tmdb", mediaType: "tv", 
                title: item.title, // 去掉了数字序号
                subTitle: item.new_ep?.index_show || "热播中", 
                description: `${item.new_ep?.index_show || "热播中"}
暂无简介`, // 加入 description 占位
                genreTitle: "剧集",
                posterPath: item.cover 
            };
            const tmdb = await proSearchTmdb(item.title, "tv");
            if (tmdb) proMergeTmdb(finalItem, tmdb);
            return finalItem;
        });
        return await Promise.all(promises);
    } catch (e) { return [{ id: "err", type: "text", title: "B站连接失败" }]; }
}

async function proFetchBangumiDaily() {
    try {
        const res = await Widget.http.get("https://api.bgm.tv/calendar");
        const data = res.data || [];
        const dayId = (new Date().getDay() || 7);
        const items = data.find(d => d.weekday.id === dayId)?.items || [];
        
        const promises = items.map(async item => {
            const name = item.name_cn || item.name;
            let finalItem = { 
                id: `bgm_${item.id}`, type: "tmdb", mediaType: "tv", 
                title: name, 
                subTitle: item.name, 
                description: `${item.name}
暂无简介`, // 加入 description 占位
                genreTitle: "剧集",
                posterPath: item.images?.large 
            };
            const tmdb = await proSearchTmdb(name, "tv");
            if (tmdb) proMergeTmdb(finalItem, tmdb);
            return finalItem;
        });
        return await Promise.all(promises);
    } catch (e) { return []; }
}

async function proFetchTmdbFallback(traktType) {
    const type = traktType === "shows" ? "tv" : "movie";
    try {
        const r = await Widget.tmdb.get(`/trending/${type}/day`, { params: { language: "zh-CN" } });
        return (r.results || []).slice(0, 15).map(item => {
            const date = item.first_air_date || item.release_date || "";
            const genreText = proGetGenreText(item.genre_ids);
            return proBuildItem({
                id: item.id, tmdbId: item.id, type: type,
                title: item.name || item.title,
                date: date,
                genreText: genreText,
                poster: item.poster_path,
                subTitle: "TMDB Trending",
                rating: item.vote_average?.toFixed(1),
                desc: item.overview // 补上简介
            });
        });
    } catch(e) { return []; }
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

    if (regionKey === "ES_LANG") {
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
