import { Tool, ToolCategory } from '../types/tools';

export const toolCategories: ToolCategory[] = [
  {
    id: 'developer',
    name: '开发者工具',
    icon: '👨‍💻',
    description: '程序员日常工作刚需工具',
    tools: []
  },
  {
    id: 'calculator',
    name: '计算器',
    icon: '📊',
    description: '电商营销必备计算工具',
    tools: []
  },
  {
    id: 'seo',
    name: 'SEO工具',
    icon: '📈',
    description: 'SEO和内容营销辅助工具',
    tools: []
  },
  {
    id: 'converter',
    name: '转换器',
    icon: '🔄',
    description: '数据格式转换工具',
    tools: []
  },
  {
    id: 'counter',
    name: '计数器',
    icon: '🔢',
    description: '文本统计和分析工具',
    tools: []
  }
];

export const tools: Tool[] = [
  // 开发者工具类（1-10）
  {
    id: 'json-formatter',
    name: 'JSON 格式化器',
    description: '强大的 JSON 格式化、校验和转换工具。支持 TypeScript Interface 和 Go Struct 生成。',
    path: '/tools/json-formatter',
    category: 'developer',
    keywords: ['json formatter', 'json beautifier', 'json validator', 'json minify'],
    priority: 1,
    metadata: {
      title: '免费在线 JSON 格式化器 - 即时美化和验证',
      description: '强大的 JSON 格式化、校验和转换工具。支持 TypeScript Interface 和 Go Struct 生成。无需注册，完全免费。',
      keywords: 'json formatter, json beautifier, json validator, free online tool',
      openGraph: {
        title: '免费 JSON 格式化器',
        description: '在线格式化、验证 JSON 数据。支持语法高亮和错误检测。',
        url: 'https://toolhub.example.com/tools/json-formatter',
        type: 'website'
      }
    },
    relatedTools: ['csv-to-json', 'yaml-to-json', 'xml-to-json']
  },
  {
    id: 'cron-generator',
    name: 'Cron 表达式生成器',
    description: '可视化创建和解析 Cron 表达式，支持中文描述和执行时间预览。',
    path: '/tools/cron-generator',
    category: 'developer',
    keywords: ['cron expression', 'task scheduler', 'job scheduler'],
    priority: 2,
    metadata: {
      title: 'Cron 表达式生成器 - 可视化任务调度器',
      description: '可视化创建和解析 Cron 表达式。支持中英文描述，自动生成执行时间。完全免费使用。',
      keywords: 'cron expression generator, task scheduler, job scheduler',
      openGraph: {
        title: 'Cron 表达式生成器',
        description: '可视化创建 Cron 表达式，支持执行时间预览。',
        url: 'https://toolhub.example.com/tools/cron-generator',
        type: 'website'
      }
    },
    relatedTools: ['timestamp-converter']
  },
  {
    id: 'jwt-decoder',
    name: 'JWT Token 解码器',
    description: '安全解码 JWT Token，查看 header 和 payload 内容。支持过期时间检测。',
    path: '/tools/jwt-decoder',
    category: 'developer',
    keywords: ['jwt decoder', 'jwt token', 'json web token'],
    priority: 3,
    metadata: {
      title: 'JWT Token 解码器 - 在线安全解码工具',
      description: '安全解码 JWT Token，查看 header 和 payload 内容。支持过期时间检测，浏览器本地处理。',
      keywords: 'jwt decoder, jwt token, json web token decoder',
      openGraph: {
        title: 'JWT Token 解码器',
        description: '安全解码 JWT Token，查看详细内容。',
        url: 'https://toolhub.example.com/tools/jwt-decoder',
        type: 'website'
      }
    },
    relatedTools: ['base64-encoder', 'url-encoder']
  },
  {
    id: 'regex-tester',
    name: '正则表达式测试器',
    description: '强大的正则表达式测试工具。支持多种编程语言，实时匹配高亮。',
    path: '/tools/regex-tester',
    category: 'developer',
    keywords: ['regex tester', 'regular expression', 'pattern matching'],
    priority: 4,
    metadata: {
      title: '正则表达式测试器 - 在线匹配测试工具',
      description: '强大的正则表达式测试工具。支持多种编程语言语法，实时匹配高亮显示。',
      keywords: 'regex tester, regular expression, pattern matching tool',
      openGraph: {
        title: '正则表达式测试器',
        description: '测试正则表达式匹配结果，实时高亮显示。',
        url: 'https://toolhub.example.com/tools/regex-tester',
        type: 'website'
      }
    },
    relatedTools: ['json-formatter', 'sql-formatter']
  },
  {
    id: 'sql-formatter',
    name: 'SQL 查询格式化器',
    description: 'SQL 查询语句格式化工具。支持多种 SQL 方言，自动美化查询结构。',
    path: '/tools/sql-formatter',
    category: 'developer',
    keywords: ['sql formatter', 'sql beautifier', 'query formatter'],
    priority: 5,
    metadata: {
      title: 'SQL 查询格式化器 - 在线 SQL 美化工具',
      description: 'SQL 查询语句格式化工具。支持 MySQL、PostgreSQL、SQL Server 等多种方言。',
      keywords: 'sql formatter, sql beautifier, query formatter',
      openGraph: {
        title: 'SQL 查询格式化器',
        description: '格式化 SQL 查询语句，支持多种数据库方言。',
        url: 'https://toolhub.example.com/tools/sql-formatter',
        type: 'website'
      }
    },
    relatedTools: ['json-formatter', 'regex-tester']
  },
  {
    id: 'base64-encoder',
    name: 'Base64 编解码器',
    description: '文本与 Base64 格式互转工具。支持中文和特殊字符编码。',
    path: '/tools/base64-encoder',
    category: 'developer',
    keywords: ['base64 encoder', 'base64 decoder', 'data encoding'],
    priority: 6,
    metadata: {
      title: 'Base64 编解码器 - 在线编码解码工具',
      description: '文本与 Base64 格式互转工具。支持中文和特殊字符编码，实时转换。',
      keywords: 'base64 encoder, base64 decoder, data encoding tool',
      openGraph: {
        title: 'Base64 编解码器',
        description: '文本与 Base64 格式互转，支持特殊字符。',
        url: 'https://toolhub.example.com/tools/base64-encoder',
        type: 'website'
      }
    },
    relatedTools: ['url-encoder', 'jwt-decoder']
  },
  {
    id: 'url-encoder',
    name: 'URL 编解码器',
    description: 'URL 编码与解码工具。支持查询参数和特殊字符处理。',
    path: '/tools/url-encoder',
    category: 'developer',
    keywords: ['url encoder', 'url decoder', 'url encoding'],
    priority: 7,
    metadata: {
      title: 'URL 编解码器 - 在线 URL 处理工具',
      description: 'URL 编码与解码工具。支持查询参数和特殊字符处理，实时转换。',
      keywords: 'url encoder, url decoder, url encoding tool',
      openGraph: {
        title: 'URL 编解码器',
        description: 'URL 编码与解码，支持查询参数处理。',
        url: 'https://toolhub.example.com/tools/url-encoder',
        type: 'website'
      }
    },
    relatedTools: ['base64-encoder', 'utm-builder']
  },
  {
    id: 'markdown-to-html',
    name: 'Markdown 转 HTML',
    description: 'Markdown 文档转 HTML 工具。支持实时预览和多种 Markdown 语法。',
    path: '/tools/markdown-to-html',
    category: 'developer',
    keywords: ['markdown to html', 'markdown converter', 'html generator'],
    priority: 8,
    metadata: {
      title: 'Markdown 转 HTML - 在线 Markdown 转换器',
      description: 'Markdown 文档转 HTML 工具。支持实时预览和多种 Markdown 语法，完全免费。',
      keywords: 'markdown to html, markdown converter, html generator',
      openGraph: {
        title: 'Markdown 转 HTML',
        description: 'Markdown 文档转 HTML，支持实时预览。',
        url: 'https://toolhub.example.com/tools/markdown-to-html',
        type: 'website'
      }
    },
    relatedTools: ['color-converter', 'timestamp-converter']
  },
  {
    id: 'color-converter',
    name: '颜色代码转换器',
    description: 'HEX、RGB、HSL 颜色格式互转工具。支持颜色预览和取色器。',
    path: '/tools/color-converter',
    category: 'developer',
    keywords: ['color converter', 'hex rgb', 'color code'],
    priority: 9,
    metadata: {
      title: '颜色代码转换器 - HEX RGB HSL 互转',
      description: 'HEX、RGB、HSL 颜色格式互转工具。支持颜色预览和取色器，前端设计师必备。',
      keywords: 'color converter, hex rgb, color code converter',
      openGraph: {
        title: '颜色代码转换器',
        description: 'HEX、RGB、HSL 颜色格式互转，支持预览。',
        url: 'https://toolhub.example.com/tools/color-converter',
        type: 'website'
      }
    },
    relatedTools: ['markdown-to-html', 'timestamp-converter']
  },
  {
    id: 'timestamp-converter',
    name: '时间戳转换器',
    description: 'Unix 时间戳与日期时间互转工具。支持秒级和毫秒级时间戳。',
    path: '/tools/timestamp-converter',
    category: 'developer',
    keywords: ['timestamp converter', 'unix timestamp', 'datetime converter'],
    priority: 10,
    metadata: {
      title: '时间戳转换器 - Unix 时间戳互转工具',
      description: 'Unix 时间戳与日期时间互转工具。支持秒级和毫秒级时间戳，实时转换。',
      keywords: 'timestamp converter, unix timestamp, datetime converter',
      openGraph: {
        title: '时间戳转换器',
        description: 'Unix 时间戳与日期时间互转。',
        url: 'https://toolhub.example.com/tools/timestamp-converter',
        type: 'website'
      }
    },
    relatedTools: ['cron-generator', 'color-converter']
  },

  // 电商/营销计算类（11-18）
  {
    id: 'fba-profit',
    name: 'FBA 利润计算器',
    description: 'Amazon FBA 卖家专用利润计算工具。精确计算各项成本和利润率。',
    path: '/calculators/fba-profit',
    category: 'calculator',
    keywords: ['fba calculator', 'amazon fba', 'profit calculator'],
    priority: 11,
    metadata: {
      title: 'FBA 利润计算器 - Amazon 卖家专用工具',
      description: 'Amazon FBA 卖家专用利润计算工具。精确计算各项成本和利润率，帮助制定定价策略。',
      keywords: 'fba calculator, amazon fba, profit calculator',
      openGraph: {
        title: 'FBA 利润计算器',
        description: 'Amazon FBA 利润计算，精确成本分析。',
        url: 'https://toolhub.example.com/calculators/fba-profit',
        type: 'website'
      }
    },
    relatedTools: ['cogs', 'markup-margin', 'breakeven']
  },
  {
    id: 'cogs',
    name: '销售成本计算器',
    description: 'COGS（销售成本）计算工具。帮助企业精确计算产品销售成本。',
    path: '/calculators/cogs',
    category: 'calculator',
    keywords: ['cogs calculator', 'cost of goods sold', 'accounting'],
    priority: 12,
    metadata: {
      title: '销售成本计算器 - COGS 计算工具',
      description: 'COGS（销售成本）计算工具。帮助企业精确计算产品销售成本，优化库存管理。',
      keywords: 'cogs calculator, cost of goods sold, accounting tool',
      openGraph: {
        title: '销售成本计算器',
        description: '计算销售成本，优化库存管理。',
        url: 'https://toolhub.example.com/calculators/cogs',
        type: 'website'
      }
    },
    relatedTools: ['fba-profit', 'inventory-turnover', 'payback-period']
  },
  {
    id: 'markup-margin',
    name: '加价与利润率计算器',
    description: '计算商品的加价百分比和利润率。帮助制定合理的定价策略。',
    path: '/calculators/markup-margin',
    category: 'calculator',
    keywords: ['markup calculator', 'margin calculator', 'pricing calculator'],
    priority: 13,
    metadata: {
      title: '加价与利润率计算器 - 定价策略工具',
      description: '计算商品的加价百分比和利润率。帮助制定合理的定价策略，提升盈利能力。',
      keywords: 'markup calculator, margin calculator, pricing calculator',
      openGraph: {
        title: '加价与利润率计算器',
        description: '计算加价百分比和利润率。',
        url: 'https://toolhub.example.com/calculators/markup-margin',
        type: 'website'
      }
    },
    relatedTools: ['breakeven', 'fba-profit', 'sales-tax']
  },
  {
    id: 'breakeven',
    name: '盈亏平衡点计算器',
    description: '计算企业盈亏平衡销量和销售额。帮助制定销售目标和定价策略。',
    path: '/calculators/breakeven',
    category: 'calculator',
    keywords: ['breakeven calculator', 'profit analysis', 'business planning'],
    priority: 14,
    metadata: {
      title: '盈亏平衡点计算器 - 商业分析工具',
      description: '计算企业盈亏平衡销量和销售额。帮助制定销售目标和定价策略。',
      keywords: 'breakeven calculator, profit analysis, business planning',
      openGraph: {
        title: '盈亏平衡点计算器',
        description: '计算盈亏平衡点，分析盈利能力。',
        url: 'https://toolhub.example.com/calculators/breakeven',
        type: 'website'
      }
    },
    relatedTools: ['payback-period', 'markup-margin', 'cogs']
  },
  {
    id: 'shipping-cost',
    name: '国际运费计算器',
    description: '国际快递运费估算工具。支持多种快递公司和运输方式。',
    path: '/calculators/shipping-cost',
    category: 'calculator',
    keywords: ['shipping calculator', 'international shipping', 'freight cost'],
    priority: 15,
    metadata: {
      title: '国际运费计算器 - 快递费用估算工具',
      description: '国际快递运费估算工具。支持多种快递公司和运输方式，帮助控制物流成本。',
      keywords: 'shipping calculator, international shipping, freight cost',
      openGraph: {
        title: '国际运费计算器',
        description: '国际快递运费估算，控制物流成本。',
        url: 'https://toolhub.example.com/calculators/shipping-cost',
        type: 'website'
      }
    },
    relatedTools: ['sales-tax', 'fba-profit']
  },
  {
    id: 'inventory-turnover',
    name: '库存周转率计算器',
    description: '计算库存周转率和周转天数。帮助优化库存管理和资金使用效率。',
    path: '/calculators/inventory-turnover',
    category: 'calculator',
    keywords: ['inventory turnover', 'stock turnover', 'inventory analysis'],
    priority: 16,
    metadata: {
      title: '库存周转率计算器 - 库存管理分析工具',
      description: '计算库存周转率和周转天数。帮助优化库存管理和资金使用效率。',
      keywords: 'inventory turnover, stock turnover, inventory analysis',
      openGraph: {
        title: '库存周转率计算器',
        description: '计算库存周转率，优化库存管理。',
        url: 'https://toolhub.example.com/calculators/inventory-turnover',
        type: 'website'
      }
    },
    relatedTools: ['cogs', 'payback-period']
  },
  {
    id: 'payback-period',
    name: '投资回收期计算器',
    description: '计算投资项目回收期。帮助评估投资价值和风险。',
    path: '/calculators/payback-period',
    category: 'calculator',
    keywords: ['payback period', 'investment analysis', 'roi calculator'],
    priority: 17,
    metadata: {
      title: '投资回收期计算器 - 投资分析工具',
      description: '计算投资项目回收期。帮助评估投资价值和风险，制定投资决策。',
      keywords: 'payback period, investment analysis, roi calculator',
      openGraph: {
        title: '投资回收期计算器',
        description: '计算投资回收期，评估投资价值。',
        url: 'https://toolhub.example.com/calculators/payback-period',
        type: 'website'
      }
    },
    relatedTools: ['breakeven', 'cogs', 'inventory-turnover']
  },
  {
    id: 'sales-tax',
    name: '电商税费计算器',
    description: '计算电商销售税费。支持不同地区税率设置。',
    path: '/calculators/sales-tax',
    category: 'calculator',
    keywords: ['sales tax calculator', 'ecommerce tax', 'tax calculation'],
    priority: 18,
    metadata: {
      title: '电商税费计算器 - 销售税费计算工具',
      description: '计算电商销售税费。支持不同地区税率设置，帮助合规经营。',
      keywords: 'sales tax calculator, ecommerce tax, tax calculation',
      openGraph: {
        title: '电商税费计算器',
        description: '计算电商销售税费，合规经营。',
        url: 'https://toolhub.example.com/calculators/sales-tax',
        type: 'website'
      }
    },
    relatedTools: ['markup-margin', 'shipping-cost']
  },

  // SEO/内容类（19-23）
  {
    id: 'utm-builder',
    name: 'UTM 参数生成器',
    description: '生成 UTM 跟踪参数。帮助追踪营销活动和渠道效果。',
    path: '/tools/utm-builder',
    category: 'seo',
    keywords: ['utm builder', 'utm generator', 'tracking parameters'],
    priority: 19,
    metadata: {
      title: 'UTM 参数生成器 - 营销追踪工具',
      description: '生成 UTM 跟踪参数。帮助追踪营销活动和渠道效果，优化投放策略。',
      keywords: 'utm builder, utm generator, tracking parameters',
      openGraph: {
        title: 'UTM 参数生成器',
        description: '生成营销追踪参数，分析渠道效果。',
        url: 'https://toolhub.example.com/tools/utm-builder',
        type: 'website'
      }
    },
    relatedTools: ['ga-goal-creator', 'meta-tag-checker']
  },
  {
    id: 'og-tag-generator',
    name: 'OG 标签生成器',
    description: '生成 Open Graph 社交媒体分享标签。优化内容在社交平台的显示效果。',
    path: '/tools/og-tag-generator',
    category: 'seo',
    keywords: ['og tag generator', 'open graph', 'social media'],
    priority: 20,
    metadata: {
      title: 'OG 标签生成器 - 社交媒体分享优化',
      description: '生成 Open Graph 社交媒体分享标签。优化内容在社交平台的显示效果。',
      keywords: 'og tag generator, open graph, social media',
      openGraph: {
        title: 'OG 标签生成器',
        description: '生成社交媒体分享标签，优化显示效果。',
        url: 'https://toolhub.example.com/tools/og-tag-generator',
        type: 'website'
      }
    },
    relatedTools: ['meta-tag-checker', 'robots-txt-generator']
  },
  {
    id: 'robots-txt-generator',
    name: 'Robots.txt 生成器',
    description: '生成 robots.txt 文件。帮助搜索引擎爬虫理解网站抓取规则。',
    path: '/tools/robots-txt-generator',
    category: 'seo',
    keywords: ['robots txt generator', 'seo', 'search engine'],
    priority: 21,
    metadata: {
      title: 'Robots.txt 生成器 - SEO 网站规则工具',
      description: '生成 robots.txt 文件。帮助搜索引擎爬虫理解网站抓取规则，优化 SEO 效果。',
      keywords: 'robots txt generator, seo, search engine',
      openGraph: {
        title: 'Robots.txt 生成器',
        description: '生成搜索引擎爬虫规则文件。',
        url: 'https://toolhub.example.com/tools/robots-txt-generator',
        type: 'website'
      }
    },
    relatedTools: ['og-tag-generator', 'meta-tag-checker']
  },
  {
    id: 'ga-goal-creator',
    name: 'GA 目标 URL 创建器',
    description: '创建 Google Analytics 目标追踪 URL。帮助设置转化目标和事件追踪。',
    path: '/tools/ga-goal-creator',
    category: 'seo',
    keywords: ['google analytics', 'goal tracker', 'conversion tracking'],
    priority: 22,
    metadata: {
      title: 'GA 目标 URL 创建器 - 数据分析工具',
      description: '创建 Google Analytics 目标追踪 URL。帮助设置转化目标和事件追踪。',
      keywords: 'google analytics, goal tracker, conversion tracking',
      openGraph: {
        title: 'GA 目标 URL 创建器',
        description: '创建 Google Analytics 目标追踪。',
        url: 'https://toolhub.example.com/tools/ga-goal-creator',
        type: 'website'
      }
    },
    relatedTools: ['utm-builder', 'meta-tag-checker']
  },
  {
    id: 'meta-tag-checker',
    name: 'Meta 标签检查器',
    description: '检查网页 Meta 标签。分析 SEO 优化情况，提供改进建议。',
    path: '/tools/meta-tag-checker',
    category: 'seo',
    keywords: ['meta tag checker', 'seo audit', 'website analysis'],
    priority: 23,
    metadata: {
      title: 'Meta 标签检查器 - SEO 分析工具',
      description: '检查网页 Meta 标签。分析 SEO 优化情况，提供改进建议，提升搜索排名。',
      keywords: 'meta tag checker, seo audit, website analysis',
      openGraph: {
        title: 'Meta 标签检查器',
        description: '检查网页 Meta 标签，分析 SEO 优化。',
        url: 'https://toolhub.example.com/tools/meta-tag-checker',
        type: 'website'
      }
    },
    relatedTools: ['og-tag-generator', 'ga-goal-creator', 'robots-txt-generator']
  },

  // 转换/格式化类（24-28）
  {
    id: 'csv-to-json',
    name: 'CSV 转 JSON',
    description: 'CSV 文件转换为 JSON 格式。数据处理和分析的常用工具。',
    path: '/tools/csv-to-json',
    category: 'converter',
    keywords: ['csv to json', 'data converter', 'file converter'],
    priority: 24,
    metadata: {
      title: 'CSV 转 JSON - 数据格式转换工具',
      description: 'CSV 文件转换为 JSON 格式。数据处理和分析的常用工具，完全免费。',
      keywords: 'csv to json, data converter, file converter',
      openGraph: {
        title: 'CSV 转 JSON',
        description: 'CSV 文件转换为 JSON 格式。',
        url: 'https://toolhub.example.com/tools/csv-to-json',
        type: 'website'
      }
    },
    relatedTools: ['json-formatter', 'yaml-to-json', 'xml-to-json']
  },
  {
    id: 'yaml-to-json',
    name: 'YAML 转 JSON',
    description: 'YAML 配置文件转换为 JSON 格式。开发者和 DevOps 工程师常用工具。',
    path: '/tools/yaml-to-json',
    category: 'converter',
    keywords: ['yaml to json', 'yaml converter', 'devops'],
    priority: 25,
    metadata: {
      title: 'YAML 转 JSON - 配置文件转换工具',
      description: 'YAML 配置文件转换为 JSON 格式。开发者和 DevOps 工程师常用工具。',
      keywords: 'yaml to json, yaml converter, devops',
      openGraph: {
        title: 'YAML 转 JSON',
        description: 'YAML 配置文件转换为 JSON。',
        url: 'https://toolhub.example.com/tools/yaml-to-json',
        type: 'website'
      }
    },
    relatedTools: ['json-formatter', 'csv-to-json', 'xml-to-json']
  },
  {
    id: 'xml-to-json',
    name: 'XML 转 JSON',
    description: 'XML 文档转换为 JSON 格式。API 集成和数据处理工具。',
    path: '/tools/xml-to-json',
    category: 'converter',
    keywords: ['xml to json', 'xml converter', 'data transformation'],
    priority: 26,
    metadata: {
      title: 'XML 转 JSON - 数据转换工具',
      description: 'XML 文档转换为 JSON 格式。API 集成和数据处理的专业工具。',
      keywords: 'xml to json, xml converter, data transformation',
      openGraph: {
        title: 'XML 转 JSON',
        description: 'XML 文档转换为 JSON 格式。',
        url: 'https://toolhub.example.com/tools/xml-to-json',
        type: 'website'
      }
    },
    relatedTools: ['json-formatter', 'csv-to-json', 'yaml-to-json']
  },
  {
    id: 'image-to-webp',
    name: '图片转 WebP',
    description: '图片格式转换为 WebP。支持 JPG、PNG 转 WebP，减小文件大小。',
    path: '/tools/image-to-webp',
    category: 'converter',
    keywords: ['image to webp', 'webp converter', 'image optimization'],
    priority: 27,
    metadata: {
      title: '图片转 WebP - 图片优化工具',
      description: '图片格式转换为 WebP。支持 JPG、PNG 转 WebP，减小文件大小，提升网站性能。',
      keywords: 'image to webp, webp converter, image optimization',
      openGraph: {
        title: '图片转 WebP',
        description: '图片格式转换为 WebP，优化网站性能。',
        url: 'https://toolhub.example.com/tools/image-to-webp',
        type: 'website'
      }
    },
    relatedTools: ['pdf-to-image', 'color-converter']
  },
  {
    id: 'pdf-to-image',
    name: 'PDF 转图片',
    description: 'PDF 文档转换为图片格式。支持分页转换和批量下载。',
    path: '/tools/pdf-to-image',
    category: 'converter',
    keywords: ['pdf to image', 'pdf converter', 'document conversion'],
    priority: 28,
    metadata: {
      title: 'PDF 转图片 - 文档转换工具',
      description: 'PDF 文档转换为图片格式。支持分页转换和批量下载，处理方便快捷。',
      keywords: 'pdf to image, pdf converter, document conversion',
      openGraph: {
        title: 'PDF 转图片',
        description: 'PDF 文档转换为图片格式。',
        url: 'https://toolhub.example.com/tools/pdf-to-image',
        type: 'website'
      }
    },
    relatedTools: ['image-to-webp', 'word-counter']
  },

  // 计数/估算类（29-30）
  {
    id: 'line-counter',
    name: '行数统计器',
    description: '统计文本行数和字符数。代码审计和文档分析工具。',
    path: '/tools/line-counter',
    category: 'counter',
    keywords: ['line counter', 'text analysis', 'code analysis'],
    priority: 29,
    metadata: {
      title: '行数统计器 - 文本分析工具',
      description: '统计文本行数和字符数。代码审计和文档分析工具，提升工作效率。',
      keywords: 'line counter, text analysis, code analysis',
      openGraph: {
        title: '行数统计器',
        description: '统计文本行数和字符数。',
        url: 'https://toolhub.example.com/tools/line-counter',
        type: 'website'
      }
    },
    relatedTools: ['word-counter', 'regex-tester']
  },
  {
    id: 'word-counter',
    name: '字数统计器',
    description: '统计文档字数、字符数和段落数。学生和内容创作者常用工具。',
    path: '/tools/word-counter',
    category: 'counter',
    keywords: ['word counter', 'character counter', 'text analysis'],
    priority: 30,
    metadata: {
      title: '字数统计器 - 文档分析工具',
      description: '统计文档字数、字符数和段落数。学生和内容创作者常用工具。',
      keywords: 'word counter, character counter, text analysis',
      openGraph: {
        title: '字数统计器',
        description: '统计文档字数和字符数。',
        url: 'https://toolhub.example.com/tools/word-counter',
        type: 'website'
      }
    },
    relatedTools: ['line-counter', 'markdown-to-html']
  }
];

// 将工具分配到分类中
toolCategories.forEach(category => {
  category.tools = tools
    .filter(tool => tool.category === category.id)
    .sort((a, b) => a.priority - b.priority)
    .map(tool => tool.id);
});

export const getToolById = (id: string): Tool | undefined => {
  return tools.find(tool => tool.id === id);
};

export const getToolsByCategory = (categoryId: string): Tool[] => {
  return tools.filter(tool => tool.category === categoryId);
};

export const getRelatedTools = (toolId: string): Tool[] => {
  const tool = getToolById(toolId);
  if (!tool) return [];
  
  return tool.relatedTools
    .map(id => getToolById(id))
    .filter(Boolean) as Tool[];
};

export const getAllCategories = (): ToolCategory[] => {
  return toolCategories;
};