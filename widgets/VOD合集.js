var WidgetMetadata = {
  id: "qiguo.vod.hub.collection",
  title: "VOD合集列表",
  description: "聚合实时榜单、欧乐影视、金牌影院、骨朵热度指数榜",
  author: "𝓚𝓾𝓰𝓾𝓸𝔃𝓪𝓲 ⁷",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  site: "https://github.com/qiguo093/Forward-Widget",
  icon: "https://github.com/qiguo093/Forward-Widget/raw/refs/heads/main/icon2.png",
  modules: [
{
            title: "VOD合集列表",
            description: "聚合实时榜单、豆瓣片单、欧乐影视",
            functionName: "loadVodHubMerged",
            type: "video",
            cacheDuration: 43200,
            params: [
                {"name":"vod_list","title":"选择子列表","type":"enumeration","value":"榜单","enumOptions":[{"title":"聚合实时榜单","value":"榜单"},{"title":"欧乐影视","value":"欧乐"},{"title":"金牌影院","value":"金牌"},{"title":"骨朵热度指数榜","value":"骨朵"}]},
                {"name":"榜单_section","title":"功能分类","type":"enumeration","value":"0","enumOptions":[{"title":"Netflix新片榜","value":"0"},{"title":"Disney+新片榜","value":"1"},{"title":"Apple TV+新片榜","value":"2"},{"title":"HBOmax新片榜","value":"3"},{"title":"prime video新片榜","value":"4"},{"title":"本周国剧排行榜","value":"5"},{"title":"本周美剧排行榜","value":"6"},{"title":"本周动漫排行榜","value":"7"},{"title":"本周电影排行榜","value":"8"},{"title":"本周韩剧排行榜","value":"9"},{"title":"本周英剧排行榜","value":"10"},{"title":"本周日剧排行榜","value":"11"},{"title":"本周泰剧排行榜","value":"12"},{"title":"本周综艺排行榜","value":"13"},{"title":"本周纪录片排行榜","value":"14"}],"belongTo":{"paramName":"vod_list","value":["榜单"]}},
                {"name":"欧乐_section","title":"功能分类","type":"enumeration","value":"0","enumOptions":[{"title":"电影","value":"0"},{"title":"剧集","value":"1"},{"title":"综艺","value":"2"},{"title":"动漫","value":"3"},{"title":"短剧","value":"4"}],"belongTo":{"paramName":"vod_list","value":["欧乐"]}},
                {"name":"欧乐_area","title":"地区","type":"enumeration","value":"0","enumOptions":[{"title":"全部","value":"0"},{"title":"大陆","value":"大陆"},{"title":"香港","value":"香港"},{"title":"台湾","value":"台湾"},{"title":"美国","value":"美国"},{"title":"日本","value":"日本"},{"title":"韩国","value":"韩国"},{"title":"英国","value":"英国"},{"title":"法国","value":"法国"},{"title":"德国","value":"德国"},{"title":"西班牙","value":"西班牙"},{"title":"泰国","value":"泰国"},{"title":"印度","value":"印度"}],"belongTo":{"paramName":"vod_list","value":["欧乐"]}},
                {"name":"欧乐_sort_by","title":"榜单类型","type":"enumeration","value":"hot","enumOptions":[{"title":"热门榜","value":"hot"},{"title":"高分榜","value":"score"},{"title":"最新","value":"update"},{"title":"最近添加","value":"desc"}],"belongTo":{"paramName":"vod_list","value":["欧乐"]}},
                {"name":"欧乐_count","title":"每页数量","type":"enumeration","value":"48","enumOptions":[{"title":"48 条","value":"48"},{"title":"96 条","value":"96"},{"title":"144 条","value":"144"},{"title":"192 条","value":"192"}],"belongTo":{"paramName":"vod_list","value":["欧乐"]}},
                {"name":"欧乐_page","title":"页码","type":"page","startPage":1,"belongTo":{"paramName":"vod_list","value":["欧乐"]}},
                {"name":"金牌_section","title":"功能分类","type":"enumeration","value":"0","enumOptions":[{"title":"电影","value":"0"},{"title":"电视剧","value":"1"},{"title":"综艺","value":"2"},{"title":"动漫","value":"3"},{"title":"短剧","value":"4"}],"belongTo":{"paramName":"vod_list","value":["金牌"]}},
                {"name":"金牌_area","title":"地区","type":"enumeration","value":"","enumOptions":[{"title":"全部","value":""},{"title":"中国大陆","value":"中国大陆"},{"title":"中国香港","value":"中国香港"},{"title":"中国台湾","value":"中国台湾"},{"title":"美国","value":"美国"},{"title":"日本","value":"日本"},{"title":"韩国","value":"韩国"},{"title":"泰国","value":"泰国"},{"title":"英国","value":"英国"},{"title":"法国","value":"法国"},{"title":"其他","value":"其他"}],"belongTo":{"paramName":"vod_list","value":["金牌"]}},
                {"name":"金牌_year","title":"年份","type":"enumeration","value":"","enumOptions":[{"title":"全部","value":""},{"title":"2026","value":"2026"},{"title":"2025","value":"2025"},{"title":"2024","value":"2024"},{"title":"2023","value":"2023"},{"title":"2022","value":"2022"},{"title":"2021","value":"2021"},{"title":"2020","value":"2020"}],"belongTo":{"paramName":"vod_list","value":["金牌"]}},
                {"name":"金牌_sort_by","title":"排序方式","type":"enumeration","value":"hot","enumOptions":[{"title":"综合","value":"hot"},{"title":"最近更新","value":"update"},{"title":"人气高低","value":"heat"},{"title":"评分高低","value":"score"}],"belongTo":{"paramName":"vod_list","value":["金牌"]}},
                {"name":"金牌_count","title":"每页数量","type":"enumeration","value":"30","enumOptions":[{"title":"30 条","value":"30"},{"title":"60 条","value":"60"},{"title":"90 条","value":"90"},{"title":"120 条","value":"120"},{"title":"200 条","value":"200"},{"title":"300 条","value":"300"},{"title":"500 条","value":"500"}],"belongTo":{"paramName":"vod_list","value":["金牌"]}},
                {"name":"金牌_page","title":"页码","type":"page","startPage":1,"belongTo":{"paramName":"vod_list","value":["金牌"]}},
                {"name":"金牌_host","title":"接口地址","type":"input","value":"https://www.jiabaide.cn","belongTo":{"paramName":"vod_list","value":["金牌"]}},
                {"name":"骨朵_category","title":"榜单分类","type":"enumeration","value":"剧集","enumOptions":[{"title":"陆剧","value":"剧集"},{"title":"国漫","value":"动漫"},{"title":"综艺","value":"综艺"},{"title":"电影","value":"电影"}],"belongTo":{"paramName":"vod_list","value":["骨朵"]}},
            ]
        }
  ]
};

// ================= 骨朵榜单数据源 =================
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

// 欧乐上游每页固定 48 条。把「每页数量」换算成需要抓取的上游页并合并，
// 这样用户把数量调大后，一屏就能滑很久（翻页用 offset 对齐，避免重复）。
var OLE_PAGE_SIZE = 48;
function oleFetchPaged(params, cateId) {
  var apiHost = (params && params.ApiHost) ? params.ApiHost : DEFAULT_API_HOST;
  apiHost = apiHost.replace(/\/$/, "");
  var area = (params && params.area) ? params.area : "0";
  var sortBy = (params && params.sort_by) ? params.sort_by : "hot";
  var sortValue = SORT_MAP[sortBy] || "hot";
  var page = parseInt(params && params.page, 10) || 1;
  var count = parseInt(params && params.count, 10) || OLE_PAGE_SIZE;
  if (count < OLE_PAGE_SIZE) count = OLE_PAGE_SIZE;

  var startIdx = (page - 1) * count;
  var firstUp = Math.floor(startIdx / OLE_PAGE_SIZE) + 1;
  var lastUp = Math.floor((startIdx + count - 1) / OLE_PAGE_SIZE) + 1;
  lastUp = Math.min(lastUp, firstUp + 19);   // 安全上限，避免一次抓过多

  var tasks = [];
  for (var p = firstUp; p <= lastUp; p++) {
    tasks.push(fetchCategoryList(apiHost, cateId, area, sortValue, p));
  }
  return Promise.all(tasks).then(function (pages) {
    var merged = [];
    for (var i = 0; i < pages.length; i++) merged = merged.concat(pages[i] || []);
    var offset = startIdx % OLE_PAGE_SIZE;
    var items = merged.slice(offset, offset + count);
    if (!items.length && page <= 1) {
      return [{ id: "empty", type: "text", title: "暂无数据，请检查网络或API地址" }];
    }
    return items;
  });
}

function loadMovieList(params) { return oleFetchPaged(params, CATEGORY_ID.movie); }
function loadTvList(params) { return oleFetchPaged(params, CATEGORY_ID.tv); }
function loadVarietyList(params) { return oleFetchPaged(params, CATEGORY_ID.variety); }
function loadAnimeList(params) { return oleFetchPaged(params, CATEGORY_ID.anime); }
function loadShortList(params) { return oleFetchPaged(params, CATEGORY_ID.short); }

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
(function(){
// @name 金牌影院数据源
// @description 金牌影院（自建数据源：签名请求 + 分类浏览 + 详情播放）
// @version 1.0.0
// 说明：本块只提供数据与播放能力，UI 入口挂在「VOD合集列表 → 选择子列表 → 金牌影院」。
//       内部的 jpList / jpLoadDetail 通过 __vod_group_sources 暴露给顶层的分发函数。

var JP_DEFAULT_HOST = "https://www.jiabaide.cn";
var JP_SIGN_KEY = "cb808529bae6b6be45ecfab29a4889bc";
var JP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.61 Chrome/126.0.6478.61 Not/A)Brand/8 Safari/537.36";
var JP_PAGE_SIZE = 30;
var JP_EP_CONCURRENCY = 8;

// ==================== 哈希（签名的基石） ====================
// ⚠️ 本仓库另有一份把 charCodeAt 直接当字节使用的 md5，遇到中文会算错；
//    而签名字符串包含地区/语言等中文值，必须使用下面这份 UTF-8 版本。
function jpMd5(str) {
  var bytes = [], i, c;
  for (i = 0; i < str.length; i++) {
    c = str.charCodeAt(i);
    if (c < 0x80) bytes.push(c);
    else if (c < 0x800) bytes.push(0xC0 | (c >> 6), 0x80 | (c & 0x3F));
    else if (c < 0xD800 || c >= 0xE000) bytes.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F));
    else {
      i++;
      c = 0x10000 + (((c & 0x3FF) << 10) | (str.charCodeAt(i) & 0x3FF));
      bytes.push(0xF0 | (c >> 18), 0x80 | ((c >> 12) & 0x3F), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F));
    }
  }
  var bitLen = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  var lo = bitLen >>> 0, hi = Math.floor(bitLen / 4294967296);
  bytes.push(lo & 0xFF, (lo >>> 8) & 0xFF, (lo >>> 16) & 0xFF, (lo >>> 24) & 0xFF);
  bytes.push(hi & 0xFF, (hi >>> 8) & 0xFF, (hi >>> 16) & 0xFF, (hi >>> 24) & 0xFF);

  var S = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,
           5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,
           4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,
           6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
  var K = [];
  for (i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296);

  var a0 = 0x67452301, b0 = 0xEFCDAB89, c0 = 0x98BADCFE, d0 = 0x10325476;
  var M = new Array(16);
  function rotl(x, n) { return (x << n) | (x >>> (32 - n)); }

  for (var off = 0; off < bytes.length; off += 64) {
    for (i = 0; i < 16; i++) {
      M[i] = bytes[off + i * 4] | (bytes[off + i * 4 + 1] << 8) | (bytes[off + i * 4 + 2] << 16) | (bytes[off + i * 4 + 3] << 24);
    }
    var A = a0, B = b0, C = c0, D = d0, F, g;
    for (i = 0; i < 64; i++) {
      if (i < 16) { F = (B & C) | ((~B) & D); g = i; }
      else if (i < 32) { F = (D & B) | ((~D) & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | (~D)); g = (7 * i) % 16; }
      F = (F + A + K[i] + M[g]) | 0;
      A = D; D = C; C = B;
      B = (B + rotl(F, S[i])) | 0;
    }
    a0 = (a0 + A) | 0; b0 = (b0 + B) | 0; c0 = (c0 + C) | 0; d0 = (d0 + D) | 0;
  }
  function hex(n) {
    var s = "";
    for (var k = 0; k < 4; k++) s += ("0" + ((n >>> (k * 8)) & 0xFF).toString(16)).slice(-2);
    return s;
  }
  return (hex(a0) + hex(b0) + hex(c0) + hex(d0)).toLowerCase();
}

function jpSha1(str) {
  var bytes = [], i, c;
  for (i = 0; i < str.length; i++) {
    c = str.charCodeAt(i);
    if (c < 0x80) bytes.push(c);
    else if (c < 0x800) bytes.push(0xC0 | (c >> 6), 0x80 | (c & 0x3F));
    else if (c < 0xD800 || c >= 0xE000) bytes.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F));
    else {
      i++;
      c = 0x10000 + (((c & 0x3FF) << 10) | (str.charCodeAt(i) & 0x3FF));
      bytes.push(0xF0 | (c >> 18), 0x80 | ((c >> 12) & 0x3F), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F));
    }
  }
  var bitLen = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  var hi = Math.floor(bitLen / 4294967296), lo = bitLen >>> 0;
  bytes.push((hi >>> 24) & 0xFF, (hi >>> 16) & 0xFF, (hi >>> 8) & 0xFF, hi & 0xFF);
  bytes.push((lo >>> 24) & 0xFF, (lo >>> 16) & 0xFF, (lo >>> 8) & 0xFF, lo & 0xFF);

  var h0 = 0x67452301, h1 = 0xEFCDAB89, h2 = 0x98BADCFE, h3 = 0x10325476, h4 = 0xC3D2E1F0;
  var w = new Array(80), j, a, b, d, e, f, k, temp;
  function rotl(n, s) { return (n << s) | (n >>> (32 - s)); }
  for (i = 0; i < bytes.length; i += 64) {
    for (j = 0; j < 16; j++) {
      w[j] = (bytes[i + j * 4] << 24) | (bytes[i + j * 4 + 1] << 16) | (bytes[i + j * 4 + 2] << 8) | bytes[i + j * 4 + 3];
    }
    for (j = 16; j < 80; j++) w[j] = rotl(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
    a = h0; b = h1; c = h2; d = h3; e = h4;
    for (j = 0; j < 80; j++) {
      if (j < 20) { f = (b & c) | ((~b) & d); k = 0x5A827999; }
      else if (j < 40) { f = b ^ c ^ d; k = 0x6ED9EBA1; }
      else if (j < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8F1BBCDC; }
      else { f = b ^ c ^ d; k = 0xCA62C1D6; }
      temp = (rotl(a, 5) + f + e + k + w[j]) >>> 0;
      e = d; d = c; c = rotl(b, 30); b = a; a = temp;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0; h4 = (h4 + e) >>> 0;
  }
  function hex(n) { return ("00000000" + n.toString(16)).slice(-8); }
  return (hex(h0) + hex(h1) + hex(h2) + hex(h3) + hex(h4)).toLowerCase();
}

// ==================== 请求层 ====================
// 协议：sign = sha1(md5("按插入顺序拼接的全部查询参数&key=KEY&t=毫秒时间戳"))
//       参与签名的参数集合必须与 URL 上实际发送的完全一致（含取空值的参数）。
// ⚠️ 参数必须按字母序排列：服务端会用「排序后的业务参数 + &key + &t」重算签名，
//    顺序不同就会返回 code 122001（应用签名失败）。实测乱序必失败。
function jpBuildQuery(p) {
  var keys = [], k;
  for (k in p) {
    if (Object.prototype.hasOwnProperty.call(p, k) && p[k] !== undefined && p[k] !== null) keys.push(k);
  }
  keys.sort();
  var parts = [];
  for (var i = 0; i < keys.length; i++) parts.push(keys[i] + "=" + p[keys[i]]);
  return parts.join("&");
}

var jpDeviceId = null;
function jpGetDeviceId() {
  if (jpDeviceId) return jpDeviceId;
  jpDeviceId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (ch) {
    var r = (Math.random() * 16) | 0;
    return (ch === "x" ? r : ((r & 0x3) | 0x8)).toString(16);
  });
  return jpDeviceId;
}

function jpSignedGet(host, path, params) {
  params = params || {};
  var t = String(Date.now());
  // 先按字母序拼好业务参数，再追加 key 与 t 参与签名（与站点前端的行为一致）
  var qs = jpBuildQuery(params);
  var sign = jpSha1(jpMd5(qs + "&key=" + JP_SIGN_KEY + "&t=" + t));
  var url = host + path + (qs ? "?" + qs : "");
  return Widget.http.get(url, {
    headers: {
      "sign": sign,
      "t": t,
      "deviceid": jpGetDeviceId(),
      "User-Agent": JP_UA,
      "Accept": "application/json, text/plain, */*",
      "Referer": host + "/"
    }
  }).then(function (res) {
    var data = res && res.data !== undefined ? res.data : res;
    if (typeof data === "string") { try { data = JSON.parse(data); } catch (e) { return null; } }
    if (!data || data.code !== 200) {
      console.error("[金牌影院] 接口异常 " + path + " code=" + (data && data.code) + " " + (data && data.msg));
      return null;
    }
    return data;
  }).catch(function (e) {
    console.error("[金牌影院] 请求失败 " + path + ": " + (e && e.message));
    return null;
  });
}

function jpNormalizeHost(host) {
  var h = (host || JP_DEFAULT_HOST).trim();
  if (!/^https?:\/\//i.test(h)) h = "https://" + h;
  return h.replace(/\/+$/, "");
}

// ==================== 数据映射 ====================
var JP_CATEGORY = { "0": 1, "1": 2, "2": 3, "3": 4, "4": 88 };   // 电影/电视剧/综艺/动漫/短剧
var JP_SORT = { hot: "1", update: "2", heat: "3", score: "4" };    // 综合 / 最近更新 / 人气 / 评分

function jpMapItem(it, host) {
  var pic = it.vodPic || "";
  var parts = [];
  if (it.vodPubdate) parts.push(String(it.vodPubdate).slice(0, 4));
  if (it.vodClass) parts.push(it.vodClass);
  if (it.vodRemarks) parts.push(it.vodRemarks);
  return {
    id: "jp_" + it.vodId,
    type: "url",
    title: it.vodName,
    posterPath: pic,
    backdropPath: it.vodPicSlide || pic,
    releaseDate: String(it.vodPubdate || ""),
    description: parts.join(" · "),
    genreTitle: it.vodClass || "",
    rating: it.vodScore || 0,
    link: "jp://detail?id=" + it.vodId + "&host=" + encodeURIComponent(host)
  };
}

// ==================== 分类列表 ====================
function jpFetchList(params) {
  var host = jpNormalizeHost(params["金牌_host"]);
  var catId = JP_CATEGORY[String(params["金牌_section"] || "0")] || JP_CATEGORY["0"];
  var page = parseInt(params["金牌_page"], 10) || 1;
  // 「每页数量」由客户端 count 参数决定：一页装得多，往下就能一直滑。
  var count = parseInt(params["金牌_count"], 10) || JP_PAGE_SIZE;
  if (count < JP_PAGE_SIZE) count = JP_PAGE_SIZE;

  // 计算本次要覆盖的条目区间，再换算成上游页码（上游每页固定 JP_PAGE_SIZE 条）。
  // 例：count=120、page=1 → 需要上游第 1~4 页；page=2 → 需要第 5~8 页。
  var startIdx = (page - 1) * count;
  var firstUp = Math.floor(startIdx / JP_PAGE_SIZE) + 1;
  var lastUp = Math.floor((startIdx + count - 1) / JP_PAGE_SIZE) + 1;
  lastUp = Math.min(lastUp, firstUp + 19);   // 安全上限，避免一次抓过多

  var baseQ = {
    pageSize: String(JP_PAGE_SIZE),
    sort: JP_SORT[params["金牌_sort_by"] || "hot"] || "1",
    sortBy: "1",
    type1: String(catId)
  };
  // 只在用户确实选了筛选项时才带上，避免发送空值参数
  // ⚠️ 不要发送 filterStatus：它会额外收窄目录（实测综艺 3023 → 307），
  //    导致 App 与网站展示的内容对不上。网站前端也不发它。
  if (params["金牌_area"]) baseQ.area = params["金牌_area"];
  if (params["金牌_year"]) baseQ.year = params["金牌_year"];

  var tasks = [];
  for (var p = firstUp; p <= lastUp; p++) {
    var q = {};
    for (var k in baseQ) if (Object.prototype.hasOwnProperty.call(baseQ, k)) q[k] = baseQ[k];
    q.pageNum = String(p);
    tasks.push(jpSignedGet(host, "/api/mw-movie/anonymous/video/list", q));
  }

  return Promise.all(tasks).then(function (pages) {
    var merged = [];
    for (var i = 0; i < pages.length; i++) {
      var list = (pages[i] && pages[i].data && pages[i].data.list) || [];
      for (var j = 0; j < list.length; j++) merged.push(list[j]);
    }
    // 对齐到用户请求的区间起点，避免每次翻页出现重复条目
    var offset = startIdx % JP_PAGE_SIZE;
    var slice = merged.slice(offset, offset + count);
    var items = [];
    for (var m = 0; m < slice.length; m++) items.push(jpMapItem(slice[m], host));
    if (!items.length && page <= 1) {
      return [{ id: "empty", type: "text", title: "暂无数据，请检查网络或接口地址" }];
    }
    return items;
  });
}

// ==================== 详情与播放 ====================
// ⚠️ 该站没有「一次取回全部集数地址」的接口：episodeList 只给 nid，
//    每集播放地址都要带 nid 单独请求一次。故固定并发拉取，个别失败不影响整体；
//    集数越多耗时越长（按 App 端约 3.4 请求/秒估算，160 集约需 45 秒）。
function jpFetchEpisodeUrls(host, vodId, eps) {
  var out = new Array(eps.length);
  for (var z = 0; z < out.length; z++) out[z] = null;
  var cursor = 0;
  function worker() {
    var i = cursor++;
    if (i >= eps.length) return Promise.resolve();
    return jpSignedGet(host, "/api/mw-movie/anonymous/v2/video/episode/url", {
      clientType: "1", id: String(vodId), nid: String(eps[i].nid)
    }).then(function (res) {
      var list = (res && res.data && res.data.list) || [];
      var best = null;
      for (var k = 0; k < list.length; k++) {
        if (!list[k].url) continue;
        if (!best || (list[k].resolution || 0) > (best.resolution || 0)) best = list[k];
      }
      out[i] = best ? best.url : null;
    }).catch(function () { out[i] = null; }).then(worker);
  }
  var chain = Promise.resolve();
  var n = Math.min(JP_EP_CONCURRENCY, eps.length);
  for (var w = 0; w < n; w++) chain = chain.then(worker);
  return chain.then(function () { return out; });
}

function jpLoadDetail(params) {
  var link = "";
  if (typeof params === "string") link = params;
  else if (params && typeof params === "object") link = params.id || params.link || "";
  if (!link || String(link).indexOf("jp://detail") !== 0) return Promise.resolve(null);

  var idMatch = String(link).match(/[?&]id=(\d+)/);
  if (!idMatch) return Promise.resolve(null);
  var vodId = idMatch[1];
  var hostMatch = String(link).match(/[?&]host=([^&]+)/);
  var host = hostMatch ? jpNormalizeHost(decodeURIComponent(hostMatch[1])) : JP_DEFAULT_HOST;

  return jpSignedGet(host, "/api/mw-movie/anonymous/video/detail", { id: vodId }).then(function (res) {
    var d = res && res.data;
    if (!d) throw new Error("获取影片详情失败");
    var eps = d.episodeList || [];
    if (!eps.length) throw new Error("该影片暂无可播放剧集");
    return jpFetchEpisodeUrls(host, vodId, eps).then(function (urls) {
      var isMovie = String(d.typeId1) === "1" || eps.length === 1;
      var episodeItems = [];
      for (var i = 0; i < eps.length; i++) {
        if (!urls[i]) continue;
        episodeItems.push({
          id: vodId + "_" + i,
          type: "url",
          title: isMovie ? d.vodName : (d.vodName + " 第" + (eps[i].name || (i + 1)) + "集"),
          videoUrl: urls[i],
          mediaType: "episode"
        });
      }
      if (!episodeItems.length) throw new Error("未获取到可播放地址");
      var mediaType = "tv", videoUrl = null;
      if (isMovie) { mediaType = "movie"; videoUrl = episodeItems[0].videoUrl; episodeItems = []; }
      return {
        id: "jp_" + vodId,
        type: "url",
        title: d.vodName,
        description: d.vodContent ? String(d.vodContent).replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\r\n/g, "\n").trim() : "",
        posterPath: d.vodPic || "",
        backdropPath: d.vodPicSlide || d.vodPic || "",
        mediaType: mediaType,
        episode: episodeItems.length,
        episodeItems: episodeItems,
        videoUrl: videoUrl
      };
    });
  });
}

// ==================== 智能匹配播放源（提供给「播放资源」面板） ====================
// 当用户在任何地方点开一部片子（如 TMDB 详情、其他榜单）时，App 会调用各数据源
// 的 loadResource，按片名自动搜索并返回一个或多个直链选项。
function jpSearchVod(host, keyword) {
  return jpSignedGet(host, "/api/mw-movie/anonymous/video/searchByWord", {
    keyword: keyword,
    pageNum: "1",
    pageSize: "10",
    sourceCode: "1",
    type: "1"
  }).then(function (res) {
    var d = res && res.data;
    if (!d) return [];
    if (Array.isArray(d)) return d;
    if (d.result && Array.isArray(d.result.list)) return d.result.list;
    if (Array.isArray(d.list)) return d.list;
    return [];
  });
}

function jpLoadResource(params) {
  params = params || {};
  var host = jpNormalizeHost(params.ApiHost || params["金牌_host"]);
  var seriesName = (params.seriesName || params.title || params.name || params.keyword || "").trim();
  if (!seriesName) return Promise.resolve([]);
  var type = (params.type === "movie") ? "movie" : "tv";
  var episode = params.episode ? parseInt(params.episode, 10) : 1;

  // 提取纯净片名去搜（去掉季数等噪声）
  var cleanTitle = seriesName.replace(/第[一二三四五六七八九十\d]+[季部]/g, "").replace(/[\(\[（【][^\)\]）】]*[\)\]）】]/g, "").trim();
  if (!cleanTitle) cleanTitle = seriesName;

  return jpSearchVod(host, cleanTitle).then(function (list) {
    if (!list.length) return [];
    // 找名字最匹配的一部
    var target = null;
    var normUser = cleanTitle.toLowerCase().replace(/[^\u4e00-\u9fa5a-z0-9]/g, "");
    for (var i = 0; i < list.length; i++) {
      var itemNorm = String(list[i].vodName || "").toLowerCase().replace(/[^\u4e00-\u9fa5a-z0-9]/g, "");
      if (itemNorm === normUser) { target = list[i]; break; }
    }
    if (!target) target = list[0];   // 兜底取首个相关结果

    var vodId = target.vodId;
    return jpSignedGet(host, "/api/mw-movie/anonymous/video/detail", { id: String(vodId) }).then(function (res) {
      var d = res && res.data;
      var eps = (d && d.episodeList) || [];
      if (!eps.length) return [];

      // 电影取首集，剧集按指定的 episode 序号找（越界则取最后一集）
      var epIndex = 0;
      if (type !== "movie" && episode > 1) {
        epIndex = Math.min(episode - 1, eps.length - 1);
      }
      var targetEp = eps[epIndex] || eps[0];

      return jpSignedGet(host, "/api/mw-movie/anonymous/v2/video/episode/url", {
        clientType: "1", id: String(vodId), nid: String(targetEp.nid)
      }).then(function (uRes) {
        var uList = (uRes && uRes.data && uRes.data.list) || [];
        var best = null;
        for (var k = 0; k < uList.length; k++) {
          if (!uList[k].url) continue;
          if (!best || (uList[k].resolution || 0) > (best.resolution || 0)) best = uList[k];
        }
        if (!best || !best.url) return [];

        var epLabel = (type === "movie") ? "正片" : ("第 " + (targetEp.name || (epIndex + 1)) + " 集");
        return [{
          id: "jp_res_" + vodId + "_" + (targetEp.nid || epIndex),
          name: "金牌影院",
          type: type,
          description: target.vodName + " · " + epLabel + (best.resolutionName ? " [" + best.resolutionName + "]" : ""),
          url: best.url
        }];
      });
    });
  }).catch(function () { return []; });
}

__vod_group_sources.push({handlers:{"scheme":"jp","jpList":(typeof jpFetchList==="function"?jpFetchList:null),"loadDetail":(typeof jpLoadDetail==="function"?jpLoadDetail:null),"loadResource":(typeof jpLoadResource==="function"?jpLoadResource:null)}});})();
// 金牌影院：按 handler 名字查找，不依赖 push 顺序（避免新增数据源时索引错位）
async function __vod_group_金牌(params = {}) {
    for (const s of __vod_group_sources) {
        const h = s && s.handlers;
        if (h && typeof h["jpList"] === "function") return await h["jpList"](params);
    }
    return [];
}
async function __vod_group_榜单(params = {}) { if(String(params["榜单_section"]||"0")==="0") { const f=__vod_group_sources[0].handlers["getNetflixNew"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="1") { const f=__vod_group_sources[0].handlers["getDisneyNew"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="2") { const f=__vod_group_sources[0].handlers["getAppleTvNew"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="3") { const f=__vod_group_sources[0].handlers["getHboNew"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="4") { const f=__vod_group_sources[0].handlers["getPrimeVideoNew"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="5") { const f=__vod_group_sources[0].handlers["getWeeklyDomesticDrama"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="6") { const f=__vod_group_sources[0].handlers["getWeeklyUSDrama"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="7") { const f=__vod_group_sources[0].handlers["getWeeklyAnime"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="8") { const f=__vod_group_sources[0].handlers["getWeeklyMovie"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="9") { const f=__vod_group_sources[0].handlers["getWeeklyKDrama"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="10") { const f=__vod_group_sources[0].handlers["getWeeklyUKDrama"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="11") { const f=__vod_group_sources[0].handlers["getWeeklyJDrama"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="12") { const f=__vod_group_sources[0].handlers["getWeeklyThaiDrama"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="13") { const f=__vod_group_sources[0].handlers["getWeeklyVariety"]; return f ? await f({}) : []; } if(String(params["榜单_section"]||"0")==="14") { const f=__vod_group_sources[0].handlers["getWeeklyDocumentary"]; return f ? await f({}) : []; } return []; }
async function __vod_group_豆瓣(params = {}) { if(String(params["豆瓣_section"]||"0")==="0") { const f=__vod_group_sources[1].handlers["list"]; return f ? await f({"list": params["豆瓣_m0_list"],"url": params["豆瓣_m0_url"],"page": params["豆瓣_m0_page"]}) : []; } if(String(params["豆瓣_section"]||"0")==="1") { const f=__vod_group_sources[1].handlers["listComingSoon"]; return f ? await f({"page": params["豆瓣_m1_page"]}) : []; } return []; }
async function __vod_group_欧乐(params = {}) {
    // 功能分类 0-4 各自对应一个底层接口，共用同一组「地区/榜单类型/页码」；
    // 分类 5（搜索）走关键词接口，由顶层「欧乐影视·搜索」入口注入。
    const sec = String(params["欧乐_section"] || "0");
    const FN = { "0": "loadMovieList", "1": "loadTvList", "2": "loadVarietyList", "3": "loadAnimeList", "4": "loadShortList" };
    const ol = __vod_group_sources[2] && __vod_group_sources[2].handlers;
    if (!ol) return [];
    // 搜索入口已下线；仅当确有关键词参数（旧存档）时才走搜索，否则回落电影榜
    if (sec === "5" && params["欧乐_wd"] !== undefined) {
        const f = ol["searchOle"];
        return f ? await f({ "wd": params["欧乐_wd"], "pg": params["欧乐_pg"] }) : [];
    }
    const f = ol[FN[sec] || "loadMovieList"];
    return f ? await f({ "area": params["欧乐_area"], "sort_by": params["欧乐_sort_by"], "page": params["欧乐_page"], "count": params["欧乐_count"] }) : [];
}
async function __vod_group_骨朵(params = {}) {
    return await loadGuduoRank({ guduo_category: params["骨朵_category"] || "剧集" });
}
// 详情路由：带自有 scheme 的链接只交给声明了该 scheme 的数据源；没有归属者时
// 按原顺序兜底（欧乐的数据源对无法识别的 link 会返回占位「播放」项，故归属方
// 必须优先，且归属方失败时必须返回空而不是让别的数据源伪造结果）。
async function loadDetail(link){
  const s = String(link || "");
  const m = s.match(/^([a-z]+):\/\//);
  let order = [];
  if (m) {
    for (let i = 0; i < __vod_group_sources.length; i++) {
      const h = __vod_group_sources[i] && __vod_group_sources[i].handlers;
      if (h && h.scheme === m[1]) order.push(i);
    }
    if (!order.length) order = null;   // 无归属者 → 走通用顺序
  }
  if (!order) {
    order = [];
    for (let i = 0; i < __vod_group_sources.length; i++) order.push(i);
  }
  for (const i of order) {
    const h = __vod_group_sources[i] && __vod_group_sources[i].handlers;
    if (!h || typeof h.loadDetail !== "function") continue;
    try { const r = await h.loadDetail(link); if (r) return r; } catch (_) {}
  }
  return null;
}

 return {
"__vod_group_榜单": (typeof __vod_group_榜单 === "function" ? __vod_group_榜单 : null),
"__vod_group_豆瓣": (typeof __vod_group_豆瓣 === "function" ? __vod_group_豆瓣 : null),
"__vod_group_欧乐": (typeof __vod_group_欧乐 === "function" ? __vod_group_欧乐 : null),
"__vod_group_金牌": (typeof __vod_group_金牌 === "function" ? __vod_group_金牌 : null),
"__vod_group_骨朵": (typeof __vod_group_骨朵 === "function" ? __vod_group_骨朵 : null),
"loadResource": async function(params = {}) {
  const resources = [];
  for (const s of __vod_group_sources) {
    const fn = s && s.handlers && s.handlers.loadResource;
    if (typeof fn === "function") {
      try { resources.push(...(await fn(params) || [])); } catch (_) {}
    }
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
 // 单级路由：所有子参数（含「功能分类」与其选项）都直接挂在 vod_list 上。
 // 原因：App 判定 belongTo 时只比对被引用参数的值，不看该参数自身是否被隐藏，
 // 因此两级嵌套必然漏显（隐藏的中间层仍保留上次选中的值）—— 层级折叠为一级。
 const raw = String(params.vod_list || "榜单");
 const oleOld = { "欧乐影视·电影": "0", "欧乐影视·剧集": "1", "欧乐影视·综艺": "2", "欧乐影视·动漫": "3", "欧乐影视·短剧": "4", "欧乐影视·搜索": "5" };
 let key = (raw === "豆瓣") ? "豆瓣片单" : ((raw === "欧乐") ? "欧乐" : raw);
 let oleSec = null;
 if (oleOld[raw] !== undefined) { oleSec = oleOld[raw]; key = (oleSec === "5") ? "欧乐搜索" : "欧乐"; }   // 兼容旧存档值
 let group = null, secParam = null, secValue = null;
 switch (key) {
  case "榜单": group = "__vod_group_榜单"; secParam = "榜单_section"; secValue = params["榜单_section"] || "0"; break;
  case "欧乐": group = "__vod_group_欧乐"; secParam = "欧乐_section"; secValue = (oleSec !== null ? oleSec : (params["欧乐_section"] || "0")); break;
  // 金牌影院自己读取 金牌_section 等参数，无需外层注入分类
  case "金牌": group = "__vod_group_金牌"; break;
  case "骨朵": group = "__vod_group_骨朵"; break;
  // 已下线的入口（豆瓣片单 / 豆瓣即将上映 / 欧乐影视·搜索）：
  // 旧存档值命中时回落到首个入口，避免出现空白页
  case "豆瓣片单": case "豆瓣即将上映": case "欧乐搜索":
    group = "__vod_group_榜单"; secParam = "榜单_section"; secValue = "0"; break;
  default:
    group = "__vod_group_榜单"; secParam = "榜单_section"; secValue = "0";
 }
 const fn = VOD_MERGED[group]; if (!fn) return [];
 const p = { ...params };
 if (secParam) p[secParam] = secValue;
 return await fn(p);
}
