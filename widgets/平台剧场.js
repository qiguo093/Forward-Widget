/**
 * 玛卡巴卡云端剧场 Forward Widget
 * 聚合豆瓣榜单、精选剧场、热门番剧与芒果TV推荐 (极速本地全局排序版)
 */

WidgetMetadata = {
  id: "makkapakka_hub_list_2.0",
  title: "平台剧场",
  description: "各個平臺劇場和豆瓣熱榜",
  author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
  site: "https://t.me/MakkaPakkaOvO",
  version: "1.0.9",
  requiredVersion: "0.0.1",
  
  modules: [
    {
      id: "platform.1",
      title: "豆瓣熱榜",
      description: "豆瓣實時熱門影劇綜",
      functionName: "loadDouban",
      cacheDuration: 43200,
      params: [
        {
          name: "channel",
          title: "榜單分類",
          type: "enumeration",
          value: "tv",
          enumOptions: [
            { title: "全部劇集", value: "tv" },
            { title: "大陸劇集", value: "tv_domestic" },
            { title: "歐美劇集", value: "tv_american" },
            { title: "日本劇集", value: "tv_japanese" },
            { title: "南韓劇集", value: "tv_korean" },
            { title: "動漫番劇", value: "tv_animation" },
            { title: "紀錄片", value: "tv_documentary" },
            { title: "大陸綜藝", value: "show_domestic" },
            { title: "國外綜藝", value: "show_foreign" }
          ]
        },
        {
          name: "sort_type",
          title: "排序方式",
          type: "enumeration",
          value: "default",
          enumOptions: [
            { title: "默認原序", value: "default" },
            { title: "最近更新", value: "updated" },
            { title: "最近發佈", value: "recent" },
            { title: "熱度最高", value: "heat" },
            { title: "流行趨勢", value: "trending" },
            { title: "高分優先", value: "rating" }
          ]
        },
        {
          name: "page",
          title: "頁碼",
          type: "page",
          startPage: 1
        }
      ]
    },
    {
      id: "platform.2",
      title: "各平臺劇場",
      description: "網路平臺劇場榜單",
      functionName: "loadTheater",
      cacheDuration: 43200,
      params: [
        {
          name: "brand",
          title: "劇場品牌",
          type: "enumeration",
          value: "迷雾剧场",
          enumOptions: [
            { title: "迷霧劇場", value: "迷雾剧场" },
            { title: "暗流劇場", value: "暗流剧场" },
            { title: "白夜劇場", value: "白夜剧场" },
            { title: " X 劇場", value: "X剧场" },
            { title: "橫屏短劇", value: "横屏短剧" },
            { title: "生花劇場", value: "生花剧场" },
            { title: "大家劇場", value: "大家剧场" },
            { title: "小逗劇場", value: "小逗剧场" },
            { title: "十分劇場", value: "十分剧场" },
            { title: "板凳單元", value: "板凳单元" },
            { title: "螢火單元", value: "萤火单元" },
            { title: "正午陽光", value: "正午阳光" },
            { title: "戀戀劇場", value: "恋恋剧场" },
            { title: "懸疑劇場", value: "悬疑剧场" },
            { title: "微塵劇場", value: "微尘剧场" }
          ]
        },
        {
          name: "status",
          title: "播出狀態",
          type: "enumeration",
          value: "all",
          enumOptions: [
            { title: "全部", value: "all" },
            { title: "已開播", value: "aired" },
            { title: "即將推出", value: "upcoming" }
          ]
        },
        {
          name: "sort_type",
          title: "排序方式",
          type: "enumeration",
          value: "default",
          enumOptions: [
            { title: "默認原序", value: "default" },
            { title: "最近更新", value: "updated" },
            { title: "最近發佈", value: "recent" },
            { title: "熱度最高", value: "heat" },
            { title: "流行趨勢", value: "trending" },
            { title: "高分優先", value: "rating" }
          ]
        },
        {
          name: "page",
          title: "頁碼",
          type: "page",
          startPage: 1
        }
      ]
    },
    {
      id: "platform.3",
      title: "熱門番劇",
      description: "Bangumi 實時熱榜",
      functionName: "loadBangumi",
      cacheDuration: 43200,
      params: [
        {
          name: "genre",
          title: "番劇類型",
          type: "enumeration",
          value: "",
          enumOptions: [
            { title: "全部", value: "" },
            { title: "動作", value: "28" },
            { title: "冒險", value: "12" },
            { title: "動畫", value: "16" },
            { title: "喜劇", value: "35" },
            { title: "奇幻", value: "14" },
            { title: "劇情", value: "18" },
            { title: "科幻", value: "878" },
            { title: "懸疑", value: "9648" }
          ]
        },
        {
          name: "sort_type",
          title: "排序方式",
          type: "enumeration",
          value: "default",
          enumOptions: [
            { title: "默認原序", value: "default" },
            { title: "最近更新", value: "updated" },
            { title: "最近發佈", value: "recent" },
            { title: "熱度最高", value: "heat" },
            { title: "流行趨勢", value: "trending" },
            { title: "高分優先", value: "rating" }
          ]
        },
        {
          name: "page",
          title: "頁碼",
          type: "page",
          startPage: 1
        }
      ]
    },
    {
      id: "platform.4",
      title: "芒果TV熱榜",
      description: "最新芒果TV熱播劇集與綜藝",
      functionName: "loadMangoTV",
      cacheDuration: 43200,
      params: [
        {
          name: "sort_by",
          title: "類型",
          type: "enumeration",
          value: "tv",
          enumOptions: [
            { title: "全部劇集", value: "tv" },
            { title: "王牌綜藝", value: "show" }
          ]
        },
        {
          name: "sort_type",
          title: "排序方式",
          type: "enumeration",
          value: "default",
          enumOptions: [
            { title: "默認原序", value: "default" },
            { title: "最近更新", value: "updated" },
            { title: "最近發佈", value: "recent" },
            { title: "熱度最高", value: "heat" },
            { title: "流行趨勢", value: "trending" },
            { title: "高分優先", value: "rating" }
          ]
        },
        {
          name: "page",
          title: "頁碼",
          type: "page",
          startPage: 1
        }
      ]
    }
  ]
};

// ============================================
// Handler Functions
// ============================================

const Utils = {
  emptyTips: [{ id: "empty", type: "text", title: "⚠️ 加载失败", description: "请检查网络连线" }],

  async fetch(filename) {
    const url = `https://raw.githubusercontent.com/MakkaPakka518/List/refs/heads/main/data/${filename}`;
    try {
      const resp = await Widget.http.get(url);
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
async function loadDouban(params = {}) {
  const data = await Utils.fetch("douban-hot.json");
  if (data === Utils.emptyTips) return data;
  
  let list = data?.[params.channel] || [];
  list = Utils.sortList(list, params.sort_type); // 直接同步调用，不再 await
  return Utils.paginate(list, params.page);
}

/**
 * 模块 2：加载精选剧场
 */
async function loadTheater(params = {}) {
  const url = "https://raw.githubusercontent.com/qiguo093/-/main/data/theater-data.json";
  try {
    const response = await Widget.http.get(url);
    const data = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
    const root = data && (data.data || data.result || data);
    const aliases = {
      "迷雾剧场": "迷雾剧场", "迷霧劇場": "迷雾剧场",
      "白夜剧场": "白夜剧场", "白夜劇場": "白夜剧场",
      "X剧场": "X剧场", "X 劇場": "X剧场",
      "横屏短剧": "横屏短剧", "橫屏短劇": "横屏短剧",
      "生花剧场": "生花剧场", "生花劇場": "生花剧场",
      "大家剧场": "大家剧场", "大家劇場": "大家剧场",
      "小逗剧场": "小逗剧场", "小逗劇場": "小逗剧场",
      "十分剧场": "十分剧场", "十分劇場": "十分剧场",
      "板凳单元": "板凳单元", "板凳單元": "板凳单元",
      "萤火单元": "萤火单元", "螢火單元": "萤火单元",
      "正午阳光": "正午阳光", "正午陽光": "正午阳光",
      "恋恋剧场": "恋恋剧场", "戀戀劇場": "恋恋剧场",
      "悬疑剧场": "悬疑剧场", "懸疑劇場": "悬疑剧场",
      "微尘剧场": "微尘剧场", "微塵劇場": "微尘剧场"
    };
    const brand = aliases[String(params.brand || "迷雾剧场")] || String(params.brand || "迷雾剧场");
    const group = root?.[brand];
    if (!group) return [];
    let list = params.status === "aired" ? (group.aired || []) : params.status === "upcoming" ? (group.upcoming || []) : [...(group.upcoming || []), ...(group.aired || [])];
    return Utils.paginate(Utils.sortList(list, params.sort_type), params.page);
  } catch (e) {
    console.error(`[loadTheater] ${e.message || e}`);
    return [];
  }
}

/* 实时采集由 GitHub Actions 生成 data/theater-data.json，模块只读取该文件。 */
const THEATER_DOUBAN_IDS = {
  "迷雾剧场": "128396349", "白夜剧场": "158539495", "X剧场": "155026800",
  "横屏短剧": "152299516", "生花剧场": "159069554",
  "大家剧场": "160644809", "小逗剧场": "146055365", "十分剧场": "147708618",
  "板凳单元": "163392459", "萤火单元": "163549603", "正午阳光": "125370543",
  "恋恋剧场": "156086548", "悬疑剧场": "128400108", "微尘剧场": "161658331"
};

async function loadTheaterLive(brand, params = {}) {
  const listId = THEATER_DOUBAN_IDS[brand];
  if (!listId) return [];
  const page = Math.max(1, parseInt(params.page) || 1);
  const start = (page - 1) * 25;
  const url = `https://m.douban.com/doulist/${listId}/?start=${start}`;
  try {
    const response = await Widget.http.get(url, { headers: { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)" } });
    const html = typeof response.data === "string" ? response.data : "";
    if (!html) return [];
    const $ = Widget.html.load(html);
    const raw = [];
    $("ul.doulist-items > li").each((_, el) => {
      const node = $(el);
      const title = node.find(".info .title").text().trim();
      const meta = node.find(".info .meta").text().trim();
      const year = (meta.match(/(19\\d{2}|20\\d{2})/) || [])[1] || "";
      if (title) raw.push({ title, year });
    });
    if (!raw.length) return [];
    const matched = await Promise.all(raw.map(async item => {
      try {
        const r = await Widget.tmdb.get("search/tv", { params: { query: item.title, language: "zh-CN", first_air_date_year: item.year || undefined } });
        const hit = (r.results || []).find(x => x.poster_path && x.backdrop_path) || (r.results || [])[0];
        if (!hit) return null;
        return { id: hit.id, type: "tmdb", mediaType: "tv", title: hit.name || item.title, posterPath: hit.poster_path, backdropPath: hit.backdrop_path, releaseDate: hit.first_air_date || "", rating: hit.vote_average || 0, description: hit.overview || `${brand} 实时片单`, genreTitle: "剧集" };
      } catch (_) { return null; }
    }));
    let result = matched.filter(Boolean);
    if (params.status === "upcoming") result = result.filter(x => x.releaseDate && x.releaseDate > new Date().toISOString().slice(0,10));
    if (params.status === "aired") result = result.filter(x => !x.releaseDate || x.releaseDate <= new Date().toISOString().slice(0,10));
    return Utils.paginate(Utils.sortList(result, params.sort_type), 1);
  } catch (e) {
    console.error(`[loadTheaterLive] ${brand}: ${e.message || e}`);
    return [];
  }
}

/**
 * 模块 3：加载热门番剧 (Bangumi)
 */
async function loadBangumi(params = {}) {
  const data = await Utils.fetch("bangumi-hot.json");
  if (data === Utils.emptyTips) return data;
  
  let list = data?.hot_anime || data?.items || [];

  if (params.genre && params.genre !== "") {
    const genreId = parseInt(params.genre);
    list = list.filter(item => item.rawGenres && item.rawGenres.includes(genreId));
  }
  
  list = Utils.sortList(list, params.sort_type); // 同步调用
  return Utils.paginate(list, params.page);
}

/**
 * 模块 4：加载芒果TV热榜
 */
async function loadMangoTV(params = {}) {
  const data = await Utils.fetch("mgtv-hot.json");
  if (data === Utils.emptyTips) return data;
  
  const sort_by = params.sort_by || "tv";
  let list = data?.[sort_by] || [];

  list = Utils.sortList(list, params.sort_type); // 同步调用
  return Utils.paginate(list, params.page);
}