WidgetMetadata = {
  id: "qiguo.douban.rankings",
  title: "豆瓣榜单",
  description: "豆瓣热门剧集、动漫与综艺榜单",
  author: "七果",
  version: "1.0.0",
  requiredVersion: "0.0.2",
  modules: [{
    id: "douban.rankings",
    title: "豆瓣热门榜单",
    description: "每日自动更新",
    functionName: "loadDoubanRankings",
    cacheDuration: 21600,
    params: [
      { name: "channel", title: "榜单分类", type: "enumeration", value: "tv", enumOptions: [
        { title: "全部剧集", value: "tv" }, { title: "大陆剧集", value: "tv_domestic" },
        { title: "欧美剧集", value: "tv_american" }, { title: "日本剧集", value: "tv_japanese" },
        { title: "韩国剧集", value: "tv_korean" }, { title: "动漫番剧", value: "tv_animation" },
        { title: "大陆综艺", value: "show_domestic" }, { title: "国外综艺", value: "show_foreign" },
        { title: "电影实时热门", value: "movie_real_time_hotest" }, { title: "剧集实时热门", value: "tv_real_time_hotest" }
      ]},
      { name: "sort_type", title: "排序方式", type: "enumeration", value: "default", enumOptions: [
        { title: "默认原序", value: "default" }, { title: "最近更新", value: "updated" },
        { title: "最近发布", value: "recent" }, { title: "热度最高", value: "heat" },
        { title: "评分优先", value: "rating" }
      ]},
      { name: "page", title: "页码", type: "page", value: 1 }
    ]
  }]
};

async function loadDoubanRankings(params = {}) {
  const url = "https://raw.githubusercontent.com/qiguo093/List/main/data/douban-hot.json";
  try {
    const response = await Widget.http.get(url);
    const data = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
    let list = Array.isArray(data[params.channel]) ? [...data[params.channel]] : [];
    const sort = params.sort_type;
    if (sort === "updated" || sort === "recent") list.sort((a,b) => String(b[sort === "updated" ? "lastUpdateDate" : "releaseDate"] || "").localeCompare(String(a[sort === "updated" ? "lastUpdateDate" : "releaseDate"] || "")));
    if (sort === "heat") list.sort((a,b) => (b.vote_count || 0) - (a.vote_count || 0));
    if (sort === "rating") list.sort((a,b) => (b.rating || 0) - (a.rating || 0));
    const page = Math.max(1, parseInt(params.page) || 1);
    return list.slice((page - 1) * 24, page * 24);
  } catch (e) {
    console.error("[豆瓣榜单] 加载失败:", e.message || e);
    return [];
  }
}
