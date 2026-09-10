WidgetMetadata = {
  id: "qiguo.platform.theater",
  title: "平台剧场",
  description: "实时读取各大剧场片单",
  author: "七果",
  version: "2.0.1",
  requiredVersion: "0.0.2",
  modules: [
    {
      id: "platform.theater",
      title: "各平台剧场",
      description: "实时剧场片单",
      functionName: "loadTheater",
      cacheDuration: 300,
      params: [
        {
          name: "brand",
          title: "剧场品牌",
          type: "enumeration",
          value: "迷雾剧场",
          enumOptions: [
            { title: "迷雾剧场", value: "迷雾剧场" },
            { title: "暗流剧场", value: "暗流剧场" },
            { title: "白夜剧场", value: "白夜剧场" },
            { title: "X剧场", value: "X剧场" },
            { title: "玛卡巴卡的悬疑剧", value: "玛卡巴卡的悬疑剧" },
            { title: "横屏短剧", value: "横屏短剧" },
            { title: "生花剧场", value: "生花剧场" },
            { title: "大家剧场", value: "大家剧场" },
            { title: "小逗剧场", value: "小逗剧场" },
            { title: "十分剧场", value: "十分剧场" },
            { title: "板凳单元", value: "板凳单元" },
            { title: "萤火单元", value: "萤火单元" },
            { title: "正午阳光", value: "正午阳光" },
            { title: "恋恋剧场", value: "恋恋剧场" },
            { title: "悬疑剧场", value: "悬疑剧场" },
            { title: "微尘剧场", value: "微尘剧场" },
            { title: "暗流剧场", value: "暗流剧场" }
          ]
        },
        {
          name: "status",
          title: "播出状态",
          type: "enumeration",
          value: "all",
          enumOptions: [
            { title: "全部", value: "all" },
            { title: "已开播", value: "aired" },
            { title: "即将推出", value: "upcoming" }
          ]
        },
        {
          name: "sort_type",
          title: "排序方式",
          type: "enumeration",
          value: "default",
          enumOptions: [
            { title: "默认原序", value: "default" },
            { title: "最近更新", value: "updated" },
            { title: "最近发布", value: "recent" },
            { title: "热度最高", value: "heat" },
            { title: "流行趋势", value: "trending" },
            { title: "高分优先", value: "rating" }
          ]
        },
        { name: "page", title: "页码", type: "page", startPage: 1 }
      ]
    }
  ]
};

const DATA_URL = "https://raw.githubusercontent.com/qiguo093/-/main/data/theater-data.json?v=20260814";

function pageItems(items, page) {
  const p = Math.max(1, Number(page) || 1);
  return items.slice((p - 1) * 24, p * 24);
}

function sortItems(items, mode) {
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

async function loadTheater(params = {}) {
  try {
    const response = await Widget.http.get(DATA_URL);
    const body = response && response.data !== undefined ? response.data : response;
    const data = typeof body === "string" ? JSON.parse(body) : body;
    const group = data && data[String(params.brand || "迷雾剧场")];
    if (!group) return [];

    let items;
    if (params.status === "aired") items = group.aired || [];
    else if (params.status === "upcoming") items = group.upcoming || [];
    else items = [...(group.aired || []), ...(group.upcoming || [])];

    return pageItems(sortItems(items, params.sort_type), params.page);
  } catch (error) {
    console.error("[平台剧场] 加载失败:", error.message || error);
    return [];
  }
}
