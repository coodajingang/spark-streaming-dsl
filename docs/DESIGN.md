# DESIGN

## 1. 概述

本项目是一个基于 **Chrome Extension Manifest V3 (MV3)** 的调试辅助扩展，核心能力包括：

- **页面元素检测 + 调试按钮注入**：根据配置的 CSS Selector 扫描页面，为匹配元素注入“调试”按钮。
- **请求拦截**：在页面主世界（Main World）拦截 `fetch` / `XMLHttpRequest`，采集请求与响应概要。
- **Side Panel 调试面板**：在右侧 Side Panel 中查看最新拦截数据、发送 GET/POST 请求、管理配置、查看与导出日志。
- **统一日志系统**：提供 DEBUG/INFO/WARN/ERROR 四级日志、控制台彩色输出、持久化存储与导出。

典型使用场景：

- 在调试页面列表、动态 DOM（SPA）时快速定位元素并触发 Side Panel。
- 快速观察特定 API 请求的响应信息（状态码、响应体大小、片段）。
- 通过 Side Panel 直接重放请求（GET/POST），并在需要时通过 Service Worker 代理绕过 CORS 限制。

---

## 2. Chrome Extension MV3 原理

### 2.1 Manifest V3 关键概念

#### 2.1.1 Content Script 的隔离性与通信

- Content Script 运行在 **Isolated World**，与页面 JS（Main World）隔离。
- 直接覆盖 `window.fetch` / `XMLHttpRequest` **不会影响页面脚本**，因此本项目通过 **注入脚本到页面** 的方式在 Main World 完成拦截。
- 通信方式：
  - **Main World → Content Script**：使用 `window.postMessage`。
  - **Content Script → Service Worker**：使用 `chrome.runtime.sendMessage`。

#### 2.1.2 Service Worker 生命周期

- MV3 的后台脚本是 **Service Worker**，具有“按需启动、空闲回收”的生命周期。
- 不应依赖长期驻留的全局变量；持久数据应写入 `chrome.storage`。
- 本项目中 Service Worker 负责：
  - Side Panel 打开请求处理（`chrome.sidePanel.open()`）
  - 消息路由与数据落盘（`chrome.storage.local`）
  - 代理发送请求（用于绕过 CORS 或统一网络出口）

#### 2.1.3 Side Panel API 简介

- Side Panel 是 Chrome 的右侧固定面板能力（Chrome 114+）。
- 面板页面属于扩展页面（`chrome-extension://`），可直接使用扩展资源与 `chrome.*` API。
- 本项目的 Side Panel 提供三类功能：
  - 请求数据查看
  - 配置管理
  - 日志查看与导出

#### 2.1.4 权限系统

- `permissions.storage`：用于 `chrome.storage.local` 存储请求历史、日志等。
- `permissions.sidePanel`：允许调用 Side Panel API。
- `permissions.tabs` / `activeTab`：用于广播配置更新到已打开的标签页。
- `host_permissions`：允许扩展跨域访问目标 URL（用于代理请求或扩展页面 fetch）。

### 2.2 消息通信流程

#### 2.2.1 Content Script ↔ Background

- Content Script 通过 `chrome.runtime.sendMessage()` 发消息给 Service Worker。
- Service Worker 通过 `chrome.runtime.onMessage` 统一处理。

核心消息类型（摘要）：

- `openSidePanel`
  - 触发来源：页面“调试”按钮
  - 处理：Background 调用 `chrome.sidePanel.open({tabId})`

- `interceptedRequest`
  - 触发来源：请求拦截器捕获到请求+响应
  - 处理：Background 存储到 `chrome.storage.local` 并通知 Side Panel

- `configUpdated`
  - 触发来源：Side Panel 保存/重置配置
  - 处理：Background 广播给所有 tabs，Content Script 收到后重新初始化

#### 2.2.2 Content Script ↔ Side Panel

Content Script 不直接与 Side Panel 通信（避免耦合和面板开关状态问题），而是通过 Background 做中转：

- Side Panel 读取数据：
  - `getLatestRequest`
  - `getRequestHistory`
- Side Panel 代理发送请求：
  - `proxyRequest`
- Side Panel 接收更新：
  - Background `chrome.runtime.sendMessage({type:'interceptedRequestUpdated'})`

#### 2.2.3 详细消息格式定义

详见 [`docs/API.md`](./API.md)（包含字段解释与示例）。

### 2.3 存储机制

#### 2.3.1 localStorage vs chrome.storage

- `localStorage`
  - 同步 API
  - 只在有 DOM 的上下文可用（扩展页面 / 普通网页）
  - Content Script 访问到的 `localStorage` **属于网页域名**，不等于扩展页面的 localStorage

- `chrome.storage.local`
  - 异步 API
  - 扩展级别的持久存储，跨 Content Script / Side Panel / Background 共享
  - 更适合 MV3

本项目采用策略：

- **请求与日志的主存储**：`chrome.storage.local`
- **日志的 localStorage 镜像**：在 `chrome-extension://` 页面（Side Panel）中额外写入 localStorage，满足“本地可视化/快速导出”需求

---

## 3. 项目架构

### 3.1 整体架构图

```
用户操作
  ↓
Content Script (src/content.js)
  ├── Element Detector (src/element-detector.js)
  │     ├── 扫描 selectors
  │     ├── 注入“调试”按钮
  │     └── MutationObserver 监听新增元素
  └── Request Interceptor (src/request-interceptor.js)
        ├── 注入 Main World 脚本（patch fetch/XHR）
        ├── postMessage -> Content Script
        └── sendMessage -> Service Worker
          ↓
Service Worker (src/background.js)
  ├── Request Handler (src/request-handler.js)
  │     ├── 存储 latest 请求
  │     └── 维护 request_history
  └── Message Router
        ├── openSidePanel
        ├── proxyRequest
        └── configUpdated 广播
          ↓
Side Panel (src/side-panel/panel.html + panel.js)
  ├── Request Display
  ├── Config Manager
  └── API Sender (src/side-panel/api-sender.js)
```

### 3.2 各模块职责

- `src/utils/logger.js`
  - 统一日志管理（级别过滤、控制台彩色输出、持久化、导出）
  - 敏感信息脱敏（Token/Authorization/Cookie 等）

- `src/utils/config.js`
  - 默认配置定义
  - 从 manifest + 存储加载并合并配置
  - 配置保存/重置/导入/导出
  - 配置验证（URL、Selector、日志级别）

- `src/content.js`
  - Content Script 入口
  - 加载配置并启动 ElementDetector + RequestInterceptor
  - 接收 `configUpdated` 消息后重新初始化

- `src/element-detector.js`
  - 根据 selectors 扫描页面并注入按钮
  - MutationObserver 监听新增元素并增量注入

- `src/request-interceptor.js`
  - 注入脚本到 Main World，拦截 fetch/XHR
  - 将拦截结果通过 postMessage 回传
  - Content Script 收到后：
    - 写入 localStorage（网页域名）作为可选缓存
    - 发消息给 Service Worker 落盘并通知 Side Panel

- `src/background.js`
  - Service Worker 入口
  - 处理消息、打开 Side Panel、存储拦截数据
  - 代理发送请求（proxyRequest）

- `src/request-handler.js`
  - 对 `chrome.storage.local` 的读写封装
  - 维护 latest 与 history

- `src/side-panel/panel.js`
  - Side Panel 入口
  - 三 Tab：请求数据 / 配置 / 日志
  - 通过消息获取 latest 请求、代理发送请求、保存配置

- `src/side-panel/api-sender.js`
  - Side Panel 内请求发送器
  - 先尝试直接 fetch，失败则通过 Service Worker 代理

### 3.3 数据流向说明

1) 拦截数据：页面 → Main World 拦截 → Content Script → Background → chrome.storage → Side Panel 展示

2) 配置：Side Panel 保存 → config.js 写入存储 → Background 广播 configUpdated → Content Script 重启组件生效

3) 日志：各模块写日志 → logger.js 写入存储 → Side Panel 日志 Tab 拉取展示与导出

---

## 4. 交互流程

### 4.1 元素检测和按钮注入流程

```
1. 页面加载完成 (DOMContentLoaded)
   ↓
2. Content Script 注入到页面
   ↓
3. 读取存储中的 selectors 配置
   ↓
4. 遍历页面，检测匹配元素
   ↓
5. 为每个元素添加调试按钮
   ↓
6. 启动 MutationObserver，监听新增元素
   ↓
7. 新元素添加时，重复步骤 4-5
```

### 4.2 请求拦截流程

```
1. Content Script 启动拦截器
   ↓
2. 在页面 Main World patch Fetch/XMLHttpRequest
   ↓
3. 用户操作触发请求
   ↓
4. 拦截器提取请求信息（URL、方法、请求头、请求体）
   ↓
5. 等待响应
   ↓
6. 捕获响应信息（状态码、响应头、响应体大小/片段）
   ↓
7. postMessage 回传给 Content Script
   ↓
8. Content Script 保存到 localStorage（可选缓存）
   ↓
9. Content Script sendMessage 给 Service Worker
   ↓
10. Service Worker 存储到 chrome.storage
   ↓
11. 通知 Side Panel 更新数据
```

### 4.3 按钮点击和 Side Panel 打开流程

```
1. 用户点击页面上的调试按钮
   ↓
2. Content Script 处理点击事件
   ↓
3. 向 Service Worker 发送 openSidePanel 消息
   ↓
4. Service Worker 调用 chrome.sidePanel.open()
   ↓
5. Side Panel 从右侧打开
   ↓
6. Side Panel JS 加载
   ↓
7. 从 chrome.storage 读取最新拦截请求
   ↓
8. 显示请求头和响应数据
```

### 4.4 用户发送请求流程

```
1. 用户在 Side Panel 中输入 URL（可选：填写 POST body）
   ↓
2. 用户点击“发送 GET”或“发送 POST”
   ↓
3. panel.js 调用 api-sender.js
   ↓
4. API Sender 首先尝试直接 fetch
   ↓
5. 若成功，解析响应并显示
   ↓
6. 若失败（例如 CORS），通过 Service Worker 代理
   ↓
7. Service Worker 发起 fetch（需要 host_permissions）
   ↓
8. 返回响应给 Side Panel
   ↓
9. Side Panel 显示格式化结果或错误
```

---

## 5. 配置说明

### 5.1 manifest.json 中的配置

- `permissions`
  - `storage`: 使用 `chrome.storage.local`
  - `sidePanel`: 允许打开 Side Panel
  - `tabs`/`activeTab`: 广播配置更新、获取当前 tab

- `host_permissions`
  - 允许扩展访问的域名范围
  - 本项目为演示使用 `"<all_urls>"`（实际项目建议收敛到业务域名）

- `action`
  - 扩展图标的标题/行为

- `side_panel`
  - `default_path`: Side Panel 默认页面

### 5.2 存储配置（CONFIG Key）

配置以对象形式持久化在 `storageKeys.CONFIG` 对应的键（默认：`ext_config`）中。

示例：

```json
{
  "targetUrl": "http://example.com/*",
  "selectors": ["li", ".list-item"],
  "interceptUrls": ["https://jsonplaceholder.typicode.com/posts/1"],
  "logLevel": "INFO",
  "logToConsole": true,
  "logToStorage": true,
  "maxLogCount": 1000
}
```

### 5.3 配置的影响

- selectors 变化：影响元素检测范围与按钮注入数量
- interceptUrls 变化：影响拦截哪些请求（降低噪音，提升性能）
- logLevel 变化：影响日志量与性能（DEBUG 最详细，ERROR 最少）

---

## 6. 快速开始指南

### 6.1 安装

1. 克隆仓库
2. 打开 Chrome：`chrome://extensions`
3. 开启“开发者模式”
4. 点击“加载已解压的扩展程序”
5. 选择项目根目录（包含 `manifest.json`）

### 6.2 基本使用

1. 访问任意网页（示例：`http://example.com`）
2. 页面上匹配 `selectors` 的元素会被注入蓝色“调试”按钮
3. 点击按钮，右侧 Side Panel 打开
4. 在“请求数据”Tab 查看已拦截的请求
5. 在 Side Panel 输入 URL 并发送 GET/POST 请求

### 6.3 修改配置

方式 1：通过 Side Panel UI

- 点击“配置”Tab
- 修改 selectors / interceptUrls / logLevel
- 点击“保存配置”

方式 2：通过存储直接修改

- 可在扩展页面（Side Panel）或 `chrome.storage` 里查看/修改 `ext_config`

---

## 7. 常见问题

### Q1: 为什么没看到按钮？

- 确认页面存在匹配 selectors 的元素
- 检查配置中的 selectors 是否有效
- 打开“日志”Tab 查看是否有 WARN/ERROR

### Q2: 请求拦截失败？

- 确认请求 URL 在 interceptUrls 配置列表中
- 部分请求可能不经过 fetch/XHR（例如 WebSocket）
- 查看日志：RequestInterceptor 是否有“捕获请求/响应”记录

### Q3: Side Panel 打不开？

- 确保 Chrome 版本 >= 114
- 确认 `manifest.json` 中 `permissions.sidePanel` 与 `side_panel.default_path` 正确
- 在 `chrome://extensions` → 对应扩展 → “Service Worker”查看错误日志

---

## 8. 调试技巧

### 8.1 查看日志

1. 打开 Side Panel
2. 点击“日志”Tab
3. 使用筛选下拉框查看 ERROR/WARN/INFO/DEBUG

### 8.2 导出日志

- 在“日志”Tab 点击“导出日志”
- 获取 JSON 文件，用于离线分析或问题排查

### 8.3 Chrome DevTools

- Content Script：网页 → F12 → Sources → Content scripts
- Service Worker：`chrome://extensions` → 详情 → Service Worker → Inspect
- Side Panel：右键 Side Panel → Inspect

---

## 9. 扩展建议

- 支持更多 HTTP 方法（PUT/DELETE/PATCH）
- 支持自定义请求头与请求体模板
- 请求重放（Replay）与对比（Diff）
- WebSocket / SSE 等更多协议的拦截
- 通过 i18n 支持中英文切换
