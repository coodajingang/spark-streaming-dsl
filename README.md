# Debug Logger & Config Panel (Chrome Extension MV3)

一个用于调试网页元素与网络请求的 Chrome Extension（Manifest V3），集成：

- 统一日志系统（DEBUG/INFO/WARN/ERROR、彩色控制台输出、持久化、导出）
- 动态配置管理（selectors、拦截 URL、日志级别）
- Side Panel UI（三 Tab：请求数据 / 配置 / 日志）
- 元素检测与按钮注入（MutationObserver 支持动态页面）
- fetch / XHR 请求拦截与存储

## 快速开始

### 安装

1. 克隆仓库
2. 打开 `chrome://extensions`
3. 开启“开发者模式”
4. 点击“加载已解压的扩展程序”
5. 选择项目根目录（包含 `manifest.json`）

### 使用

1. 打开任意网页（示例：`http://example.com`）
2. 页面中匹配配置 selectors 的元素会出现“调试”按钮
3. 点击按钮打开右侧 Side Panel
4. 在“请求数据”Tab 查看最新拦截请求
5. 在“配置”Tab 修改 selectors / interceptUrls / logLevel 并保存
6. 在“日志”Tab 查看与导出日志

## 项目结构

```
.
├── manifest.json
├── src
│   ├── background.js
│   ├── content.js
│   ├── element-detector.js
│   ├── request-interceptor.js
│   ├── request-handler.js
│   ├── utils
│   │   ├── config.js
│   │   └── logger.js
│   └── side-panel
│       ├── panel.html
│       ├── panel.js
│       └── api-sender.js
└── docs
    ├── DESIGN.md
    ├── API.md
    └── CONFIG.md
```

## 文档

- 架构与原理：[`docs/DESIGN.md`](./docs/DESIGN.md)
- 消息协议与数据结构：[`docs/API.md`](./docs/API.md)
- 配置参考：[`docs/CONFIG.md`](./docs/CONFIG.md)

## 贡献指南

- 代码尽量保持模块职责清晰：utils（基础能力）、content（页面逻辑）、background（消息/存储）、side-panel（UI）
- 新增存储字段请同步更新 `storageKeys` 与文档
- 日志中避免输出敏感信息（Token/Authorization/Cookie），必要时在 logger 中扩展脱敏规则
