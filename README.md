# Kindle Codex Quota Dashboard

为未越狱的 Kindle 7（WP63GW，600×800）设计的轻量 Codex 配额页面。

## 使用

启用 GitHub Pages 后，在 Kindle Experimental Browser 打开：

`https://adg331.github.io/kindle-dashboard/`

页面每 10 分钟重新加载一次，并读取 `data/quota.json`。页面只使用旧版浏览器兼容的 HTML、CSS 和 ES5 JavaScript。

## 数据格式

```json
{
  "plan": "Codex",
  "five_hour": {"used_percent": 32, "resets_at": "今天 18:30"},
  "weekly": {"used_percent": 61, "resets_at": "周一 09:00"},
  "updated_at": "2026-09-04 14:20"
}
```

不要向仓库提交 OAuth token、API key、Cookie 或 Codex 登录文件。Public GitHub Pages 中的 `quota.json` 对所有人可见。

## 从当前 Mac 更新配额

只更新本地文件：

```bash
python3 scripts/update_codex_quota.py
```

更新后提交到 GitHub Pages：

```bash
python3 scripts/update_codex_quota.py --publish
```

脚本通过本机 Codex `app-server` 的只读 `account/rateLimits/read` 方法读取百分比和重置时间，不读取或上传登录凭证。
