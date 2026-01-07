'use client';

import { useState, useCallback } from 'react';

interface JsonFormatterProps {
  initialInput?: string;
}

export function JsonFormatter({ initialInput = '' }: JsonFormatterProps) {
  const [input, setInput] = useState(initialInput);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'format' | 'minify'>('format');
  const [indent, setIndent] = useState<'2' | '4' | 'tab'>('2');
  const [successMessage, setSuccessMessage] = useState('');

  const formatJson = useCallback(() => {
    setError('');
    setSuccessMessage('');
    
    if (!input.trim()) {
      setError('请先输入 JSON 内容');
      return;
    }

    try {
      let result;
      
      if (mode === 'format') {
        // 格式化 JSON
        const parsed = JSON.parse(input);
        const indentValue = indent === 'tab' ? '\t' : parseInt(indent);
        result = JSON.stringify(parsed, null, indentValue);
      } else {
        // 压缩 JSON
        const parsed = JSON.parse(input);
        result = JSON.stringify(parsed);
      }
      
      setOutput(result);
      setSuccessMessage(mode === 'format' ? 'JSON 格式化成功' : 'JSON 压缩成功');
      
      // 3秒后清除成功消息
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'JSON 格式错误';
      setError(`解析失败：${errorMsg}`);
      setOutput('');
    }
  }, [input, mode, indent]);

  const clearAll = () => {
    setInput('');
    setOutput('');
    setError('');
    setSuccessMessage('');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccessMessage('已复制到剪贴板');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err) {
      setError('复制失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* 设置区域 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">设置</h3>
        <div className="flex flex-wrap gap-4">
          {/* 模式选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              模式
            </label>
            <div className="flex space-x-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="format"
                  checked={mode === 'format'}
                  onChange={(e) => setMode(e.target.value as 'format')}
                  className="mr-2"
                />
                格式化
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="minify"
                  checked={mode === 'minify'}
                  onChange={(e) => setMode(e.target.value as 'minify')}
                  className="mr-2"
                />
                压缩
              </label>
            </div>
          </div>

          {/* 缩进设置 */}
          {mode === 'format' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                缩进
              </label>
              <select
                value={indent}
                onChange={(e) => setIndent(e.target.value as '2' | '4' | 'tab')}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="2">2 个空格</option>
                <option value="4">4 个空格</option>
                <option value="tab">Tab 缩进</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 输入区域 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            输入 JSON
          </label>
          <div className="flex space-x-2">
            <button
              onClick={() => setInput('')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              清空
            </button>
            <button
              onClick={() => {
                const example = `{
  "name": "张三",
  "age": 30,
  "city": "北京",
  "hobbies": ["阅读", "游泳", "编程"],
  "isMarried": true,
  "children": null,
  "address": {
    "street": "中关村大街1号",
    "zipCode": "100190"
  }
}`;
                setInput(example);
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              示例
            </button>
          </div>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="在此粘贴或输入 JSON 内容..."
          className="textarea w-full"
          rows={10}
        />
      </div>

      {/* 操作按钮 */}
      <div className="flex space-x-4">
        <button
          onClick={formatJson}
          className="btn-primary flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{mode === 'format' ? '格式化 JSON' : '压缩 JSON'}</span>
        </button>
        <button
          onClick={clearAll}
          className="btn-secondary"
        >
          清空全部
        </button>
      </div>

      {/* 消息提示 */}
      {successMessage && (
        <div className="alert alert-success">
          {successMessage}
        </div>
      )}
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* 大文件警告 */}
      {input.length > 1024 * 1024 && (
        <div className="alert alert-warning">
          内容较大，格式化可能稍慢。建议分批处理。
        </div>
      )}

      {/* 输出区域 */}
      {output && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              输出结果
            </label>
            <button
              onClick={() => copyToClipboard(output)}
              className="btn-secondary text-sm"
            >
              复制
            </button>
          </div>
          <textarea
            value={output}
            readOnly
            className="textarea w-full bg-gray-50"
            rows={10}
            placeholder="格式化后的 JSON 将显示在此处..."
          />
          
          {/* 统计信息 */}
          <div className="mt-2 text-sm text-gray-500">
            <span>字符数: {output.length.toLocaleString()}</span>
            <span className="ml-4">行数: {output.split('\n').length.toLocaleString()}</span>
            <span className="ml-4">大小: {(new Blob([output]).size / 1024).toFixed(2)} KB</span>
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">使用说明</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 支持标准的 JSON 格式输入</li>
          <li>• 可选择不同的缩进方式：2个空格、4个空格或 Tab</li>
          <li>• 压缩模式可移除所有空白字符，减小文件大小</li>
          <li>• 支持大文件处理，但建议单次处理不超过 10MB</li>
          <li>• 所有操作均在浏览器本地进行，数据不会上传到服务器</li>
        </ul>
      </div>
    </div>
  );
}