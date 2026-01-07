'use client';

import { useState, useCallback, useMemo } from 'react';

export function MarkdownToHtml() {
  const [markdown, setMarkdown] = useState(`# 欢迎使用 Markdown 转 HTML 工具

这是一个**简单的**示例文本。

## 主要功能

- 支持基本的 Markdown 语法
- 实时预览转换结果
- 可复制生成的 HTML 代码

### 代码示例

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

### 链接和图片

这是一个 [示例链接](https://example.com)。

> 这是一个引用块
> 
> 可以包含多行内容

### 表格

| 列1 | 列2 | 列3 |
|-----|-----|-----|
| A1  | B1  | C1  |
| A2  | B2  | C2  |

### 列表

1. 有序列表项 1
2. 有序列表项 2
3. 有序列表项 3

- 无序列表项 1
- 无序列表项 2
- 无序列表项 3

---

**粗体文本** 和 *斜体文本* 以及 ~~删除线文本~~`);

  const [htmlOutput, setHtmlOutput] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [activeTab, setActiveTab] = useState<'html' | 'preview'>('html');
  const [error, setError] = useState('');

  // 简化的 Markdown 转 HTML 转换器
  const convertMarkdown = useCallback((md: string) => {
    try {
      let html = md;

      // 转义 HTML 特殊字符（除了 Markdown 标记）
      html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      // 处理代码块（前后优先级）
      html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
      
      // 处理内联代码
      html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

      // 处理标题
      html = html.replace(/^###### (.*$)/gm, '<h6>$1</h6>');
      html = html.replace(/^##### (.*$)/gm, '<h5>$1</h5>');
      html = html.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
      html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
      html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
      html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

      // 处理引用块
      html = html.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>');

      // 处理水平线
      html = html.replace(/^---+$/gm, '<hr>');
      html = html.replace(/^\*\*\*+$/gm, '<hr>');
      html = html.replace(/^_+$/gm, '<hr>');

      // 处理粗体和斜体
      html = html.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong>$1</strong>');
      html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
      html = html.replace(/___([^_]+)___/g, '<strong>$1</strong>');
      html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
      html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

      // 处理删除线
      html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');

      // 处理链接
      html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

      // 处理图片（简化版本）
      html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

      // 处理表格（简化版本）
      html = html.replace(/\|(.+)\|/g, (match, content) => {
        const cells = content.split('|').map(cell => cell.trim()).filter(cell => cell);
        if (cells.length > 1) {
          return '<tr>' + cells.map(cell => `<td>${cell}</td>`).join('') + '</tr>';
        }
        return match;
      });

      // 处理有序列表
      html = html.replace(/^\d+\. (.*$)/gm, '<li>$1</li>');
      html = html.replace(/(<li>.*<\/li>\s*)+/gs, '<ol>$&</ol>');

      // 处理无序列表
      html = html.replace(/^\* (.*$)/gm, '<li>$1</li>');
      html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
      html = html.replace(/(<li>.*<\/li>\s*)+/gs, '<ul>$&</ul>');

      // 处理段落
      const lines = html.split('\n');
      let processedLines: string[] = [];
      let inCodeBlock = false;
      let inPreBlock = false;
      let inList = false;
      let inTable = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.includes('<pre>') || line.includes('<code')) {
          inPreBlock = true;
          processedLines.push(line);
          continue;
        }
        
        if (line.includes('</pre>') || line.includes('</code>')) {
          inPreBlock = false;
          processedLines.push(line);
          continue;
        }
        
        if (line.includes('<blockquote>')) {
          processedLines.push(line);
          continue;
        }
        
        if (line.includes('<h')) {
          processedLines.push(line);
          continue;
        }
        
        if (line.includes('<hr>')) {
          processedLines.push(line);
          continue;
        }
        
        if (line.includes('<table>') || line.includes('<tr>') || line.includes('<td>')) {
          inTable = true;
          if (line.includes('<table>')) {
            processedLines.push('<table>');
          } else {
            processedLines.push(line);
          }
          continue;
        }
        
        if (inTable && (line === '' || !line.includes('<td>'))) {
          if (line === '') {
            processedLines.push('</table>');
            inTable = false;
          }
          continue;
        }
        
        if (line.includes('<ol>') || line.includes('<ul>') || line.includes('<li>')) {
          if (line.includes('<li>') && !inList) {
            inList = true;
          }
          processedLines.push(line);
          continue;
        }
        
        if (inList && line === '') {
          processedLines.push('</ul>');
          inList = false;
          continue;
        }
        
        if (line && !inPreBlock && !inTable) {
          processedLines.push(`<p>${line}</p>`);
        } else if (!line && !inList && !inTable) {
          processedLines.push('');
        } else {
          processedLines.push(line);
        }
      }

      return processedLines.join('\n');
    } catch (err) {
      throw new Error(`Markdown 转换失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
  }, []);

  // 实时转换
  useMemo(() => {
    try {
      const converted = convertMarkdown(markdown);
      setHtmlOutput(converted);
      setPreviewHtml(converted);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '转换失败');
    }
  }, [markdown, convertMarkdown]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('已复制到剪贴板');
    } catch (err) {
      alert('复制失败');
    }
  };

  const downloadHtml = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>转换后的 HTML</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1, h2, h3, h4, h5, h6 { margin-top: 24px; margin-bottom: 16px; }
        code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 16px; border-radius: 6px; overflow-x: auto; }
        blockquote { border-left: 4px solid #ddd; padding-left: 16px; color: #666; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        ul, ol { padding-left: 20px; }
    </style>
</head>
<body>
${htmlOutput}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    setMarkdown('');
    setHtmlOutput('');
    setPreviewHtml('');
    setError('');
  };

  return (
    <div className="space-y-6">
      {/* 输入区域 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Markdown 输入
          </label>
          <div className="flex space-x-2">
            <button
              onClick={() => setMarkdown('# 新标题\n\n这是内容')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              简单示例
            </button>
            <button
              onClick={clearAll}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              清空
            </button>
          </div>
        </div>
        <textarea
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          placeholder="在此输入 Markdown 文本..."
          className="textarea w-full"
          rows={12}
        />
      </div>

      {/* 输出选项卡 */}
      <div className="bg-gray-50 rounded-lg p-1">
        <div className="flex">
          <button
            onClick={() => setActiveTab('html')}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'html'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            HTML 源码
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'preview'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            预览效果
          </button>
        </div>
      </div>

      {/* 输出区域 */}
      {activeTab === 'html' ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              HTML 源码
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => copyToClipboard(htmlOutput)}
                className="btn-secondary text-sm"
              >
                复制 HTML
              </button>
              <button
                onClick={downloadHtml}
                className="btn-secondary text-sm"
              >
                下载 HTML
              </button>
            </div>
          </div>
          <textarea
            value={htmlOutput}
            readOnly
            className="textarea w-full bg-gray-50 font-mono text-sm"
            rows={12}
            placeholder="转换后的 HTML 将显示在此处..."
          />
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              预览效果
            </label>
            <div className="text-xs text-gray-500">
              实时预览，编辑 Markdown 可立即看到效果
            </div>
          </div>
          <div 
            className="border rounded-lg p-6 bg-white min-h-[300px] prose max-w-none"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Markdown 语法说明 */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-3">支持的 Markdown 语法</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-blue-800 mb-2">文本格式</h5>
            <ul className="text-blue-700 space-y-1">
              <li>**粗体** 或 __粗体__</li>
              <li>*斜体* 或 _斜体_</li>
              <li>***粗斜体***</li>
              <li>~~删除线~~</li>
              <li>`行内代码`</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-blue-800 mb-2">结构元素</h5>
            <ul className="text-blue-700 space-y-1">
              <li># 标题1 到 ###### 标题6</li>
              <li>> 引用块</li>
              <li>--- 水平线</li>
              <li>[链接文本](URL)</li>
              <li>![图片描述](图片URL)</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-blue-800 mb-2">列表</h5>
            <ul className="text-blue-700 space-y-1">
              <li>- 无序列表项</li>
              <li>1. 有序列表项</li>
              <li>- [ ] 待办事项</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-blue-800 mb-2">代码</h5>
            <ul className="text-blue-700 space-y-1">
              <li>```代码块```</li>
              <li>```javascript 支持语法高亮</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">使用说明</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 实时转换：编辑 Markdown 时自动转换，无需手动操作</li>
          <li>• 双视图：同时查看 HTML 源码和渲染效果</li>
          <li>• 复制功能：一键复制转换后的 HTML 代码</li>
          <li>• 下载功能：生成完整的 HTML 文件并下载</li>
          <li>• 兼容标准 Markdown 语法，适合博客、文档等场景</li>
        </ul>
      </div>
    </div>
  );
}