#!/usr/bin/env python3
"""
自动同步上游 Universal 弹幕插件：
1. 监控 npm registry 上游包（@rexnow/danmu-universal 及原 @forward-widget/danmu-universe，或动态按作者 baranwang 探测）。
2. 若上游发布了新版本（与仓库本地 widgets/Universal-danmu-version 记录不一致）：
   - 从 unpkg 下载最新构建产物
   - 用大括号配对抽取并移除上游 WidgetMetadata
   - 保留并缝合仓库本地固定的 WidgetMetadata（包含作者 𝓚𝓾𝓰𝓾𝓸𝔃𝓪𝓲 ⁷、版本 1.0.0、本地 id 与 site）
   - 通过 node --check 做语法强校验
   - 覆盖 widgets/Universal-danmu.js 并更新 widgets/Universal-danmu-version
3. 若无更新或校验失败则安全退出，不破坏现有代码。

版本标记文件只记录纯版本号（如 `0.16.1`），比对时也只用版本号。
"""
import sys
import json
import urllib.request
import urllib.parse
import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
TARGET_FILE = REPO_ROOT / "widgets" / "Universal-danmu.js"
VERSION_FILE = REPO_ROOT / "widgets" / "Universal-danmu-version"

MAINTAINER = "baranwang"
CANDIDATE_PACKAGES = [
    "@rexnow/danmu-universal",
    "@forward-widget/danmu-universe",
]

def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Minis-Sync-Bot/1.0"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode("utf-8"))

def discover_latest_pkg():
    for pkg in CANDIDATE_PACKAGES:
        url = f"https://registry.npmjs.org/{urllib.parse.quote(pkg, safe='')}/latest"
        try:
            d = fetch_json(url)
            if "version" in d:
                dist_file = "dist/danmu-universal.js" if "universal" in pkg else "dist/danmu-universe.js"
                return pkg, d["version"], f"https://unpkg.com/{pkg}@{d['version']}/{dist_file}"
        except Exception as e:
            print(f"[WARN] 查询 {pkg} 失败: {e}")
    # 动态搜作者名下 danmu 包（防御再次改名）
    try:
        url = f"https://registry.npmjs.org/-/v1/search?text=maintainer:{MAINTAINER}&size=250"
        d = fetch_json(url)
        for obj in d.get("objects", []):
            name = obj["package"]["name"]
            if "danmu" in name and "lite" not in name:
                ver = obj["package"]["version"]
                return name, ver, f"https://unpkg.com/{name}@{ver}/dist/{name.split('/')[-1]}.js"
    except Exception as e:
        print(f"[WARN] 动态检索维护者包列表失败: {e}")
    return None, None, None

def extract_meta(src):
    i = src.find("WidgetMetadata")
    if i < 0:
        raise ValueError("未在代码中找到 WidgetMetadata 声明")
    j = src.find("{", i)
    d = 0
    k = j
    while k < len(src):
        if src[k] == "{":
            d += 1
        elif src[k] == "}":
            d -= 1
            if d == 0:
                break
        k += 1
    return src[:i], src[i:k+1], src[k+1:]

def main():
    pkg, ver, unpkg_url = discover_latest_pkg()
    if not pkg:
        print("❌ 无法从 npm 解析到上游包，安全退出")
        sys.exit(1)

    tag = f"{pkg}@{ver}"
    print(f"📦 上游最新发布: {tag}")

    # 版本标记文件只记录纯版本号（如 0.16.1）
    current_ver = VERSION_FILE.read_text(encoding="utf-8").strip() if VERSION_FILE.exists() else ""
    if current_ver == ver and TARGET_FILE.exists():
        print(f"✅ 上游版本未变动（{ver}），无需更新")
        return

    print(f"📥 正在获取上游构建产物: {unpkg_url}")
    req = urllib.request.Request(unpkg_url, headers={"User-Agent": "Minis-Sync-Bot/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        up_src = r.read().decode("utf-8")

    up_head, _, up_tail = extract_meta(up_src)

    if not TARGET_FILE.exists():
        print(f"❌ 本地目标文件 {TARGET_FILE} 不存在")
        sys.exit(1)

    lo_src = TARGET_FILE.read_text(encoding="utf-8")
    _, lo_meta, _ = extract_meta(lo_src)

    merged = up_head + lo_meta + up_tail
    tmp_path = TARGET_FILE.with_suffix(".tmp.js")
    tmp_path.write_text(merged, encoding="utf-8")

    # node --check 语法校验
    res = subprocess.run(["node", "--check", str(tmp_path)], capture_output=True, text=True)
    if res.returncode != 0:
        print(f"❌ 新产物语法检查失败，放弃写入: {res.stderr}")
        tmp_path.unlink(missing_ok=True)
        sys.exit(2)

    tmp_path.replace(TARGET_FILE)
    VERSION_FILE.write_text(ver + "\n", encoding="utf-8")
    print(f"🎉 成功同步 {tag}，保留本地元数据，语法校验通过！")

if __name__ == "__main__":
    main()
