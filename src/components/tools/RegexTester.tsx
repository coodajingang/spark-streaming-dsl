'use client';

import { useState, useCallback, useMemo } from 'react';

interface MatchResult {
  index: number;
  match: string;
  groups: RegExpExecArray | null;
  position: number;
}

export function RegexTester() {
  const [pattern, setPattern] = useState('\\b\\w+@\\w+\\.\\w+\\b');
  const [flags, setFlags] = useState('g');
  const [testText, setTestText] = useState(`示例文本：
这是一个测试邮件地址：user@example.com
另一个地址：admin@test-site.org
普通文本不会被匹配
再次测试：contact@company.co.uk`);
  const [language, setLanguage] = useState<'javascript' | 'python' | 'go'>('javascript');
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [error, setError] = useState('');
  const [highlightedText, setHighlightedText] = useState('');

  // 常用正则表达式模板
  const commonPatterns = [
    { name: '邮箱地址', pattern: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b', flags: 'gi' },
    { name: '手机号码', pattern: '^1[3-9]\\d{9}$', flags: '' },
    { name: '身份证号', pattern: '^[1-9]\\d{5}(18|19|([23]\\d))\\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\\d{3}[0-9Xx]$', flags: '' },
    { name: 'URL', pattern: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)', flags: 'gi' },
    { name: 'IP地址', pattern: '^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$', flags: '' },
    { name: '日期格式', pattern: '^\\d{4}-\\d{2}-\\d{2}$', flags: '' },
    { name: '时间格式', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$', flags: '' },
    { name: '中文字符', pattern: '[一-鿿]', flags: 'u' },
    { name: '数字', pattern: '\\d+', flags: 'g' },
    { name: '空白字符', pattern: '\\s+', flags: 'g' },
  ];

  // 不同语言的语法差异说明
  const languageNotes = {
    javascript: {
      name: 'JavaScript',
      note: '使用 JavaScript RegExp 语法，支持 i, g, m, s, u, y 标志',
      flags: 'i(忽略大小写) g(全局匹配) m(多行模式) s(点号匹配换行) u(Unicode) y(粘性匹配)'
    },
    python: {
      name: 'Python',
      note: '使用 Python re 模块语法，在 Python 中使用 raw 字符串',
      flags: 'i(忽略大小写) g(全局匹配) m(多行模式) s(点号匹配换行) u(Unicode)'
    },
    go: {
      name: 'Go',
      note: '使用 Go regexp 包语法',
      flags: 'i(忽略大小写) g(全局匹配) m(多行模式) s(点号匹配换行) u(Unicode)'
    }
  };

  const testRegex = useCallback(() => {
    setError('');
    setMatches([]);
    setHighlightedText('');

    if (!pattern.trim()) {
      setError('请输入正则表达式');
      return;
    }

    if (!testText.trim()) {
      setError('请输入测试文本');
      return;
    }

    try {
      // 验证正则表达式
      let regex: RegExp;
      try {
        regex = new RegExp(pattern, flags);
      } catch (regexError) {
        setError(`正则表达式语法错误：${regexError instanceof Error ? regexError.message : '未知错误'}`);
        return;
      }

      const results: MatchResult[] = [];
      let match;
      let matchCount = 0;

      if (flags.includes('g')) {
        // 全局匹配
        while ((match = regex.exec(testText)) !== null && matchCount < 1000) {
          results.push({
            index: matchCount,
            match: match[0],
            groups: match,
            position: match.index
          });
          matchCount++;
          
          // 防止无限循环
          if (match[0] === '') {
            regex.lastIndex++;
          }
        }
      } else {
        // 单次匹配
        match = regex.exec(testText);
        if (match) {
          results.push({
            index: 0,
            match: match[0],
            groups: match,
            position: match.index
          });
        }
      }

      setMatches(results);
      
      // 生成高亮文本
      if (results.length > 0) {
        let highlighted = '';
        let lastIndex = 0;
        
        results.forEach((result, index) => {
          // 添加匹配前的文本
          highlighted += testText.slice(lastIndex, result.position);
          // 添加高亮的匹配文本
          highlighted += `<mark class="bg-yellow-200 px-1 rounded">${result.match}</mark>`;
          lastIndex = result.position + result.match.length;
        });
        
        // 添加剩余文本
        highlighted += testText.slice(lastIndex);
        setHighlightedText(highlighted);
      } else {
        setHighlightedText(testText);
      }
      
    } catch (err) {
      setError(`测试失败：${err instanceof Error ? err.message : '未知错误'}`);
    }
  }, [pattern, flags, testText]);

  // 格式化正则表达式代码
  const formatCode = useMemo(() => {
    const escapeText = (text: string) => {
      if (language === 'javascript') {
        return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      }
      return text;
    };

    switch (language) {
      case 'javascript':
        return `// JavaScript
const regex = /${pattern}/${flags};
const matches = text.match(regex);
if (matches) {
  console.log('找到匹配:', matches);
}`;
      case 'python':
        return `# Python
import re
pattern = r"${escapeText(pattern)}"
flags = ${flags ? `re.${flags.split('').map(f => {
  const flagMap: Record<string, string> = { i: 'IGNORECASE', g: '0', m: 'MULTILINE', s: 'DOTALL', u: 'UNICODE', y: '0' };
  return flagMap[f] || '0';
}).filter(f => f !== '0').join(' | re.') || '0'}` : '0'}
matches = re.findall(pattern, text${flags ? `, flags=${flags}` : ''})
print(f"找到匹配: {matches}")`;
      case 'go':
        return `// Go
package main

import (
  "fmt"
  "regexp"
)

func main() {
  pattern := "${escapeText(pattern)}"
  flags := "${flags}"
  
  r := regexp.MustCompile(pattern)
  matches := r.FindAllString(text, -1)
  fmt.Printf("找到匹配: %v\\n", matches)
}`;
      default:
        return '';
    }
  }, [pattern, flags, language]);

  return (
    <div className="space-y-6">
      {/* 语言选择 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">正则表达式语法</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择语言
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="go">Go</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-600 mb-2">{languageNotes[language].note}</p>
            <p className="text-xs text-gray-500">{languageNotes[language].flags}</p>
          </div>
        </div>
      </div>

      {/* 常用模板 */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">常用模板</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {commonPatterns.map((template) => (
            <button
              key={template.name}
              onClick={() => {
                setPattern(template.pattern);
                setFlags(template.flags);
              }}
              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
            >
              <div className="font-medium text-gray-900">{template.name}</div>
              <div className="text-xs text-gray-500 truncate">{template.pattern}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 正则表达式输入 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              正则表达式
            </label>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">标志:</label>
              <input
                type="text"
                value={flags}
                onChange={(e) => setFlags(e.target.value)}
                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                placeholder="g"
              />
            </div>
          </div>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="输入正则表达式，如：\\b\\w+@\\w+\\.\\w+\\b"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            当前表达式
          </label>
          <div className="bg-gray-100 rounded px-3 py-2 font-mono text-sm">
            /{pattern}/{flags || '无'}
          </div>
        </div>
      </div>

      {/* 测试文本输入 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            测试文本
          </label>
          <button
            onClick={() => setTestText('')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            清空
          </button>
        </div>
        <textarea
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          placeholder="在此输入要测试的文本..."
          className="textarea w-full"
          rows={6}
        />
      </div>

      {/* 操作按钮 */}
      <div className="flex space-x-4">
        <button
          onClick={testRegex}
          className="btn-primary flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>运行测试</span>
        </button>
        <button
          onClick={() => {
            setPattern('\\b\\w+@\\w+\\.\\w+\\b');
            setFlags('g');
            setTestText(`示例文本：
这是一个测试邮件地址：user@example.com
另一个地址：admin@test-site.org
普通文本不会被匹配
再次测试：contact@company.co.uk`);
          }}
          className="btn-secondary"
        >
          重置示例
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* 匹配结果 */}
      {matches.length > 0 && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">
              匹配结果：共找到 {matches.length} 处匹配
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-800">匹配次数:</span>
                <span className="ml-2 font-medium text-green-900">{matches.length}</span>
              </div>
              <div>
                <span className="text-green-800">使用标志:</span>
                <span className="ml-2 font-medium text-green-900">{flags || '无'}</span>
              </div>
            </div>
          </div>

          {/* 匹配详情 */}
          <div className="bg-white rounded-lg border">
            <div className="border-b border-gray-200 px-6 py-3">
              <h4 className="font-semibold text-gray-900">匹配详情</h4>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {matches.slice(0, 20).map((match, index) => (
                  <div key={index} className="flex items-start space-x-4 p-3 bg-gray-50 rounded">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          位置 {match.position}
                        </span>
                        <span className="text-xs text-gray-500">
                          长度: {match.match.length}
                        </span>
                      </div>
                      <div className="bg-white rounded border p-2 font-mono text-sm">
                        <code className="text-gray-800">{match.match}</code>
                      </div>
                      {match.groups && match.groups.length > 1 && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-600">捕获组:</span>
                          <div className="mt-1 space-y-1">
                            {Array.from(match.groups).slice(1).map((group, groupIndex) => (
                              <div key={groupIndex} className="text-xs text-gray-700">
                                组 {groupIndex + 1}: {group || '(空)'}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {matches.length > 20 && (
                  <div className="text-center text-sm text-gray-500 py-2">
                    还有 {matches.length - 20} 个匹配未显示
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 高亮显示 */}
      {highlightedText && (
        <div className="bg-white rounded-lg border">
          <div className="border-b border-gray-200 px-6 py-3">
            <h4 className="font-semibold text-gray-900">高亮匹配结果</h4>
          </div>
          <div className="p-6">
            <div 
              className="whitespace-pre-wrap text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: highlightedText }}
            />
          </div>
        </div>
      )}

      {/* 代码示例 */}
      <div className="bg-white rounded-lg border">
        <div className="border-b border-gray-200 px-6 py-3">
          <h4 className="font-semibold text-gray-900">
            {languageNotes[language].name} 代码示例
          </h4>
        </div>
        <div className="p-6">
          <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm overflow-x-auto">
            <code>{formatCode}</code>
          </pre>
          <button
            onClick={() => navigator.clipboard.writeText(formatCode)}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800"
          >
            复制代码
          </button>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">使用说明</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 选择相应的编程语言语法，查看对应的代码示例</li>
          <li>• 标志含义：g(全局匹配) i(忽略大小写) m(多行模式) s(点号匹配换行) u(Unicode) y(粘性匹配)</li>
          <li>• 使用常用模板快速测试常见的正则表达式模式</li>
          <li>• 匹配结果会以黄色高亮显示，方便查看匹配位置</li>
          <li>• 支持捕获组查看，可以分析正则表达式的各个匹配部分</li>
        </ul>
      </div>
    </div>
  );
}