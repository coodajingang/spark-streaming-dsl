# CONFIG

本文档提供扩展配置项的详细参考。

---

## 1. 默认配置

`src/utils/config.js` 中的默认配置（`DEFAULT_CONFIG`）：

```json
{
  "targetUrl": "http://example.com/*",
  "selectors": ["li", ".list-item", "[data-item]"],
  "interceptUrls": ["https://jsonplaceholder.typicode.com/posts/1"],
  "logLevel": "INFO",
  "logToConsole": true,
  "logToStorage": true,
  "maxLogCount": 1000,
  "storageKeys": {
    "CONFIG": "ext_config",
    "LATEST_REQUEST": "latest_intercepted_request",
    "REQUEST_HISTORY": "request_history",
    "LAST_SENT_REQUEST": "last_sent_request",
    "LOGS": "extension_logs"
  }
}
```

---

## 2. 字段说明

### 2.1 `targetUrl`

- 类型：string
- 用途：用于 Content Script 判断当前页面是否需要初始化（避免无意义的扫描与拦截）。
- 格式：Chrome Match Pattern（简化支持）：
  - `http://example.com/*`
  - `https://*.example.com/*`
  - `*://example.com/*`

> 注意：manifest 的 `content_scripts.matches` 仍决定 Content Script 是否注入。`targetUrl` 主要用于“注入后是否启用功能”。

### 2.2 `selectors`

- 类型：string[]
- 用途：页面元素检测范围。
- 示例：
  - `li`
  - `.list-item`
  - `[data-item]`

验证策略：

- 在有 DOM 的环境中会用 `document.querySelector` 做语法检查，非法 selector 会被过滤。

### 2.3 `interceptUrls`

- 类型：string[]
- 用途：指定哪些 URL 的请求会被拦截并记录。
- 支持：
  - 完整 URL（推荐）：`https://jsonplaceholder.typicode.com/posts/1`
  - 简单通配符：`https://example.com/api/*`

建议：

- 将列表收敛到少量关键 API，以降低性能开销与日志噪音。

### 2.4 日志相关

- `logLevel`: `DEBUG | INFO | WARN | ERROR`
- `logToConsole`: 是否输出到控制台（带颜色）
- `logToStorage`: 是否保存到存储（`chrome.storage.local` + Side Panel localStorage 镜像）
- `maxLogCount`: 最大保存条数（默认 1000）

### 2.5 `storageKeys`

用于统一定义各类存储键名，便于重构与兼容。

- `CONFIG`: 配置对象
- `LATEST_REQUEST`: 最新拦截请求
- `REQUEST_HISTORY`: 拦截请求历史
- `LAST_SENT_REQUEST`: Side Panel 最后一次发送的请求（可扩展）
- `LOGS`: 日志数组

---

## 3. Side Panel UI 修改方式

在 Side Panel 的“配置”Tab：

- selectors：每行一个 selector
- interceptUrls：每行一个 URL
- logLevel：下拉框

点击“保存配置”后：

1. 写入存储
2. 通知 Background 广播 `configUpdated`
3. Content Script 收到后自动重启组件，立即生效

---

## 4. 导入/导出

- 导出：Side Panel 生成 `config.json`
- 导入：目前提供 `importConfig(configStr)` API，可按需在 UI 中扩展导入入口
