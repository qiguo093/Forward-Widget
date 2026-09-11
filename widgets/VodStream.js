const RESOURCE_SITES = `
非凡影视,http://ffzy4.tv/api.php/provide/vod/
欧乐影视,ole
如意资源站,https://cj.rycjapi.com/api.php/provide/vod/at/json/
量子资源站,https://cj.lziapi.com/api.php/provide/vod/at/json/
爱奇艺资源站,https://iqiyizyapi.com/api.php/provide/vod/
`;

const CHINESE_NUM_MAP = {
  '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
  '六': 6, '七': 7, '八': 8, '九': 9, '十': 10
};

WidgetMetadata = {
  id: "vod_stream",
  title: "VOD Stream",
  icon: "https://assets.vvebo.vip/scripts/icon.png",
  version: "1.3.0",
  requiredVersion: "0.0.1",
  description: "获取聚合VOD影片资源",
  author: "两块",
  site: "https://github.com/2kuai/ForwardWidgets",
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
      name: "VodData",
      title: "JSON或CSV格式的源配置",
      type: "input",
      value: RESOURCE_SITES
    }
  ],
  modules: [
    {
      id: "loadResource",
      title: "加载资源",
      functionName: "loadResource",
      type: "stream",
      params: [],
    }
  ],
};

// --- 辅助工具函数 ---

const isM3U8Url = (url) => url?.toLowerCase().includes('m3u8') || false;

function extractSeasonInfo(seriesName) {
  if (!seriesName) return { baseName: seriesName, seasonNumber: 1 };
  const chineseMatch = seriesName.match(/第([一二三四五六七八九十\d]+)[季部]/);
  if (chineseMatch) {
    const val = chineseMatch[1];
    const seasonNum = CHINESE_NUM_MAP[val] || parseInt(val) || 1;
    const baseName = seriesName.replace(/第[一二三四五六七八九十\d]+[季部]/, '').trim();
    return { baseName, seasonNumber: seasonNum };
  }
  const digitMatch = seriesName.match(/(.+?)(\d+)$/);
  if (digitMatch) {
    return { baseName: digitMatch[1].trim(), seasonNumber: parseInt(digitMatch[2]) || 1 };
  }
  return { baseName: seriesName.trim(), seasonNumber: 1 };
}

/**
 * 修改后的提取逻辑：不再直接过滤集数，而是返回带标记的所有集数以便缓存
 */
function extractPlayInfoForCache(item, siteTitle, type) {
  const { vod_name, vod_play_url, vod_play_from, vod_remarks = '' } = item;
  if (!vod_name || !vod_play_url) return [];

  const playSources = vod_play_url.replace(/#+$/, '').split('$$$');
  const sourceNames = (vod_play_from || '').split('$$$');
  
  return playSources.flatMap((playSource, i) => {
    const sourceName = sourceNames[i] || '默认源';
    const isTV = playSource.includes('#');
    const results = [];

    if (type === 'tv' && isTV) {
      const episodes = playSource.split('#').filter(Boolean);
      episodes.forEach(ep => {
        const [epName, url] = ep.split('$');
        if (url && isM3U8Url(url)) {
          // 提取数字集数用于后续精确过滤
          const epMatch = epName.match(/第(\d+)集/);
          results.push({
            name: siteTitle,
            description: `${vod_name} - ${epName}${vod_remarks ? ' - ' + vod_remarks : ''} - [${sourceName}]`,
            url: url.trim(),
            _ep: epMatch ? parseInt(epMatch[1]) : null // 内部标记
          });
        }
      });
    } else if (type === 'movie' && !isTV) {
      const firstM3U8 = playSource.split('#').find(v => isM3U8Url(v.split('$')[1]));
      if (firstM3U8) {
        const [quality, url] = firstM3U8.split('$');
        const qualityText = quality.toLowerCase().includes('tc') ? '抢先版' : '正片';
        results.push({
          name: siteTitle,
          description: `${vod_name} - ${qualityText} - [${sourceName}]`,
          url: url.trim()
        });
      }
    }
    return results;
  });
}

function parseResourceSites(VodData) {
  const parseLine = (line) => {
    const [title, value] = line.split(',').map(s => s.trim());
    if (title && (value?.startsWith('http') || value === 'ole')) {
      return { title, value: value.endsWith('/') ? value : value + '/' };
    }
    return null;
  };
  try {
    const trimmed = VodData?.trim() || "";
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      return JSON.parse(trimmed).map(s => ({ title: s.title || s.name, value: s.url || s.value })).filter(s => s.title && s.value);
    }
    return trimmed.split('\n').map(parseLine).filter(Boolean);
  } catch (e) {
    return RESOURCE_SITES.trim().split('\n').map(parseLine).filter(Boolean);
  }
}



// --- 欧乐影视适配器：将自定义接口转换为 VodStream 资源 ---
var DEFAULT_API_HOST = "https://api.olelive.com";
var REFERER = "https://www.olelive.com";
var REQUEST_TIMEOUT = 10000;
var MAX_RETRIES = 2;
var GLOBAL_COOKIE = "";
var REQUEST_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "zh-CN,zh;q=0.9",
  "Referer": REFERER,
  "Origin": REFERER,
  "Content-Type": "application/json"
};
var cacheStore = new Map();
function getCacheKey(seriesName, type, episode) { return seriesName + "_" + type + "_" + (episode || "all"); }
function getFromCache(key) { var entry = cacheStore.get(key); if (entry && Date.now() - entry.timestamp < 3600000) return entry.data; if (entry) cacheStore.delete(key); return null; }
function setToCache(key, data) { cacheStore.set(key, { data: data, timestamp: Date.now() }); }

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

function loadOleResource(params) {
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




// --- 瓜子影视适配器：复用终极模块已验证的播放处理器 ---
const loadGuaziResource = (() => {
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
  return loadResource;
})();

// --- 主入口函数 ---

async function loadResource(params) {
  const configured = parseResourceSites(params && params.VodData);
  if (!configured.some(site => site.title === '欧乐影视' || site.value === 'ole')) {
    configured.push({ title: '欧乐影视', value: 'ole' });
  }
  const oleSite = configured.find(site => site.title === '欧乐影视' || site.value === 'ole');
  const standardSites = configured.filter(site => !(site.title === '欧乐影视' || site.value === 'ole'));
  const results = [];
  try {
    const guaziResults = await loadGuaziResource(params || {});
    results.push(...(Array.isArray(guaziResults) ? guaziResults : []));
  } catch (error) {
    console.error('[瓜子影视] 资源加载失败:', error.message || error);
  }
  if (oleSite) {
    try {
      const oleResults = await loadOleResource(params || {});
      results.push(...(Array.isArray(oleResults) ? oleResults.map(item => ({
        name: '欧乐影视',
        description: item.description || '欧乐影视',
        url: item.url,
        _ep: item.epNum
      })) : []));
    } catch (error) {
      console.error('[欧乐影视] 资源加载失败:', error.message || error);
    }
  }
  if (standardSites.length > 0) {
    const standardParams = Object.assign({}, params, {
      VodData: standardSites.map(site => site.title + ',' + site.value).join('\n')
    });
    results.push(...await loadStandardResources(standardParams));
  }
  const seen = new Set();
  return results.filter(item => item && item.url && !seen.has(item.url) && seen.add(item.url));
}
async function loadStandardResources(params) {
  const { seriesName, type = 'tv', season, episode, multiSource, VodData } = params;
  if (multiSource !== "enabled" || !seriesName) return [];

  const resourceSites = parseResourceSites(VodData);
  const { baseName, seasonNumber } = extractSeasonInfo(seriesName);
  const targetSeason = season ? parseInt(season) : seasonNumber;
  const targetEpisode = episode ? parseInt(episode) : null;

  // 1. 尝试从缓存获取
  const cacheKey = `vod_exact_cache_${baseName}_s${targetSeason}_${type}`;
  let allResources = [];
  
  try {
    const cached = Widget.storage.get(cacheKey);
    if (cached && Array.isArray(cached)) {
      console.log(`命中缓存: ${cacheKey}`);
      allResources = cached;
    }
  } catch (e) {}

  // 2. 如果没有缓存，则发起网络请求
  if (allResources.length === 0) {
    const fetchTasks = resourceSites.map(async (site) => {
      try {
        const response = await Widget.http.get(site.value, {
          params: { ac: "detail", wd: baseName.trim() },
          timeout: 10000 
        });
        const list = response?.data?.list;
        if (!Array.isArray(list)) return [];

        return list.flatMap(item => {
          const itemInfo = extractSeasonInfo(item.vod_name);
          
          // --- 保留你的精确匹配逻辑 ---
          if (itemInfo.baseName !== baseName || itemInfo.seasonNumber !== targetSeason) {
            return [];
          }
          
          return extractPlayInfoForCache(item, site.title, type);
        });
      } catch (error) {
        return [];
      }
    });

    const results = await Promise.all(fetchTasks);
    const merged = results.flat();

    // URL 去重
    const urlSet = new Set();
    allResources = merged.filter(res => {
      if (urlSet.has(res.url)) return false;
      urlSet.add(res.url);
      return true;
    });

    // 写入缓存（有效期3小时 = 10800秒）
    if (allResources.length > 0) {
      try { Widget.storage.set(cacheKey, allResources, 10800); } catch (e) {}
    }
  }

  // 3. 结果返回：根据 targetEpisode 进行最后的精确过滤
  if (type === 'tv' && targetEpisode !== null) {
    return allResources.filter(res => {
      // 优先根据提取时的 _ep 数字匹配，若无则根据描述文字匹配
      if (res._ep !== undefined && res._ep !== null) {
        return res._ep === targetEpisode;
      }
      return res.description.includes(`第${targetEpisode}集`);
    });
  }

  return allResources;
}
