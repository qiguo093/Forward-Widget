WidgetMetadata = {
  id: "qiguo.danmu.轮询弹幕",
  title: "轮询弹幕",
  description: "独立轮询弹幕模块",
  author: "𝓚𝓾𝓰𝓾𝓸𝔃𝓪𝓲 ⁷",
  version: "1.0.0",
  requiredVersion: "0.0.2",
  globalParams: [
    { name: "pollServerName", title: "轮询源1名称", type: "input", value: "SaoDu" },
    { name: "pollServer", title: "轮询源1链接", type: "input", value: "https://ybdm.saodu.wang:9999/api/v1/saoduyb" },
    { name: "pollServerName2", title: "轮询源2名称", type: "input", value: "" },
    { name: "pollServer2", title: "轮询源2链接", type: "input", value: "" },
    { name: "pollServerName3", title: "轮询源3名称", type: "input", value: "" },
    { name: "pollServer3", title: "轮询源3链接", type: "input", value: "" },
    { name: "maxCount", title: "弹幕数量上限", type: "input", value: "50000" },
    { name: "searchBlockKeywords", title: "搜索结果屏蔽词", type: "input", value: "" },
    { name: "convertMode", title: "弹幕转换", type: "enumeration", value: "none", enumOptions: [{ title: "保持原样", value: "none" }, { title: "转简体", value: "t2s" }, { title: "转繁体", value: "s2t" }] },
    { name: "colorMode", title: "弹幕颜色", type: "enumeration", value: "none", enumOptions: [{ title: "保持原样", value: "none" }, { title: "全部纯白", value: "white" }, { title: "部分彩色", value: "partial" }, { title: "完全彩色", value: "all" }] },
    { name: "blockKeywords", title: "弹幕内容屏蔽词", type: "input", value: "" }
  ],
  modules: [
    { id: "searchDanmu", title: "搜索弹幕", functionName: "searchDanmu", type: "danmu", params: [] },
    { id: "getDetail", title: "获取详情", functionName: "getDetailById", type: "danmu", params: [] },
    { id: "getComments", title: "获取弹幕", functionName: "getCommentsById", type: "danmu", params: [] }
  ]
};

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

async function searchDanmu(params) { return await pollSearch(params || {}); }
async function getDetailById(params) { return await pollDetail(params || {}); }
async function getCommentsById(params) { return await pollComments(params || {}); }

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

