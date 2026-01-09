# API

本文档描述扩展内各模块的 API、消息格式以及存储数据结构。

---

## 1. 模块 API

### 1.1 `src/utils/logger.js`

统一日志管理器。

**日志级别**：`DEBUG | INFO | WARN | ERROR`

**核心方法**（模块 logger 实例）：

- `debug(message, data?)`
- `info(message, data?)`
- `warn(message, data?)`
- `error(message, data?)`

- `getLogs(filter?)`
  - `filter.level?: 'DEBUG'|'INFO'|'WARN'|'ERROR'`
  - `filter.module?: string`
  - `filter.search?: string`

- `clearLogs()`

- `setLogLevel(level)`
- `enableConsole(bool)`
- `enableStorage(bool)`

额外能力：

- `exportLogs(format = 'json'|'text', filter?)`
- `setMaxLogCount(n)`

> 说明：日志会进行脱敏处理（Authorization/Token/Cookie 等）。

### 1.2 `src/utils/config.js`

配置管理。

- `getDefaultConfig()`
- `loadConfig({forceReload?})`
- `saveConfig(key, value)`
- `resetConfig()`

- `getSelectors()` / `setSelectors(arrayOrLines)`
- `getInterceptUrls()` / `setInterceptUrls(arrayOrLines)`

- `exportConfig()`
- `importConfig(configStr)`

> `loadConfig` 会合并：默认配置 +（可选）manifest 注入 + 存储配置，并做验证。

### 1.3 `src/element-detector.js`

- `new ElementDetector({selectors, onDebugClick})`
- `start()`：扫描页面并注入按钮，返回 `{matchedCount, addedCount}`
- `stop()`：停止 MutationObserver
- `setSelectors(selectors)`：更新选择器

### 1.4 `src/request-interceptor.js`

- `new RequestInterceptor({interceptUrls})`
- `start()`：注入 Main World 拦截脚本并开始监听
- `stop()`：移除监听
- `setInterceptUrls(interceptUrls)`：更新拦截 URL

### 1.5 `src/request-handler.js`

用于 Service Worker 落盘拦截数据。

- `storeInterceptedRequest(payload)`
- `getLatestInterceptedRequest()`
- `getRequestHistory()`
- `clearRequestHistory()`
- `storeLastSentRequest(request)`
- `getLastSentRequest()`

### 1.6 `src/side-panel/api-sender.js`

Side Panel 内发送请求。

- `sendRequest({url, method, body})`
  - 先直接 fetch，失败则发消息 `proxyRequest` 走 Service Worker 代理
- `sendGet(url)`
- `sendPost(url, body)`

---

## 2. 消息格式定义（Side Panel / Content Script ↔ Background）

### 2.1 `openSidePanel`

**方向**：Content Script → Background

```json
{ "type": "openSidePanel" }
```

### 2.2 `interceptedRequest`

**方向**：Content Script → Background

```json
{
  "type": "interceptedRequest",
  "payload": {
    "requestId": "1",
    "timestamp": "2026-01-09T00:00:00.000Z",
    "request": {
      "url": "https://example.com/api",
      "method": "GET",
      "headers": {"accept": "application/json"},
      "body": null
    },
    "response": {
      "status": 200,
      "statusText": "OK",
      "headers": {"content-type": "application/json"},
      "bodySize": 1234,
      "bodySnippet": "{...}",
      "durationMs": 42
    }
  }
}
```

### 2.3 `interceptedRequestUpdated`

**方向**：Background → Side Panel

```json
{
  "type": "interceptedRequestUpdated",
  "payload": { "...": "同 interceptedRequest.payload" }
}
```

### 2.4 `getLatestRequest`

**方向**：Side Panel → Background

```json
{ "type": "getLatestRequest" }
```

响应：

```json
{ "ok": true, "latest": {"...": "intercepted payload"} }
```

### 2.5 `getRequestHistory`

**方向**：Side Panel → Background

```json
{ "type": "getRequestHistory" }
```

响应：

```json
{ "ok": true, "history": [ {"...": "payload"} ] }
```

### 2.6 `clearRequestHistory`

**方向**：Side Panel → Background

```json
{ "type": "clearRequestHistory" }
```

### 2.7 `proxyRequest`

**方向**：Side Panel → Background

```json
{
  "type": "proxyRequest",
  "payload": {
    "url": "https://example.com/api",
    "method": "POST",
    "headers": {"content-type": "application/json"},
    "body": "{\"title\":\"foo\"}"
  }
}
```

响应：

```json
{
  "ok": true,
  "result": {
    "ok": true,
    "status": 200,
    "headers": {"content-type": "application/json"},
    "body": "{...}",
    "bodySize": 123,
    "durationMs": 50
  }
}
```

### 2.8 `configUpdated`

**方向**：Side Panel → Background → Content Scripts（广播）

```json
{ "type": "configUpdated" }
```

Content Script 收到后会 `loadConfig({forceReload:true})` 并重新初始化。

---

## 3. 存储数据结构

### 3.1 配置（`storageKeys.CONFIG`）

默认 key：`ext_config`

结构：见 [`docs/CONFIG.md`](./CONFIG.md)。

### 3.2 最新拦截请求（`storageKeys.LATEST_REQUEST`）

默认 key：`latest_intercepted_request`

值：`interceptedRequest.payload`

### 3.3 拦截历史（`storageKeys.REQUEST_HISTORY`）

默认 key：`request_history`

值：数组 `interceptedRequest.payload[]`（默认保留最近 200 条）

### 3.4 日志（`storageKeys.LOGS`）

默认 key：`extension_logs`

值：数组

```json
{
  "timestamp": "2024-01-15 14:23:45",
  "level": "INFO",
  "module": "ContentScript",
  "message": "页面加载完成，开始扫描",
  "data": {"count": 5}
}
```
