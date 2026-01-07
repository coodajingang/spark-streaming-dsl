'use client';

import { useState, useCallback } from 'react';

export function UrlEncoder() {
  const [activeTab, setActiveTab] = useState<'encode' | 'decode'>('encode');
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const encodeUrl = useCallback(() => {
    setError('');
    setSuccessMessage('');
    
    if (!textInput.trim()) {
      setError('请输入要编码的文本');
      return;
    }

    try {
      const encoded = encodeURIComponent(textInput);
      setResult(encoded);
      setSuccessMessage('URL 编码成功');
      
      // 3秒后清除成功消息
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(`编码失败：${err instanceof Error ? err.message : '未知错误'}`);
    }
  }, [textInput]);

  const decodeUrl = useCallback(() => {
    setError('');
    setSuccessMessage('');
    
    if (!urlInput.trim()) {
      setError('请输入要解码的 URL 编码字符串');
      return;
    }

    try {
      const decoded = decodeURIComponent(urlInput);
      setResult(decoded);
      setSuccessMessage('URL 解码成功');
      
      // 3秒后清除成功消息
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(`解码失败：${err instanceof Error ? err.message : 'URL 编码格式错误'}`);
    }
  }, [urlInput]);

  const clearAll = () => {
    setTextInput('');
    setUrlInput('');
    setResult('');
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

  const loadExample = () => {
    if (activeTab === 'encode') {
      const example = 'https://example.com/search?q=Hello 世界&category=编程';
      setTextInput(example);
    } else {
      const example = 'https%3A%2F%2Fexample.com%2Fsearch%3Fq%3DHello%20%E4%B8%96%E7%95%8C%26category%3D%E7%BC%96%E7%A8%8B';
      setUrlInput(example);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setTextInput(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* 标签页导航 */}
      <div className="bg-gray-50 rounded-lg p-1">
        <div className="flex">
          <button
            onClick={() => setActiveTab('encode')}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'encode'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            文本 → URL 编码
          </button>
          <button
            onClick={() => setActiveTab('decode')}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'decode'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            URL 编码 → 文本
          </button>
        </div>
      </div>

      {/* Tab 1: 文本转 URL 编码 */}
      {activeTab === 'encode' && (
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                输入文本
              </label>
              <div className="flex space-x-2">
                <input
                  type="file"
                  accept=".txt,.json,.csv,.xml,.html,.css,.js"
                  onChange={handleFileUpload}
                  className="text-sm"
                />
                <button
                  onClick={loadExample}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  示例
                </button>
                <button
                  onClick={() => setTextInput('')}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  清空
                </button>
              </div>
            </div>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="在此输入要编码的文本，支持中文字符..."
              className="textarea w-full"
              rows={6}
            />
            <div className="mt-1 text-xs text-gray-500">
              字符数: {textInput.length.toLocaleString()} | 字节数: {new Blob([textInput]).size.toLocaleString()}
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={encodeUrl}
              className="btn-primary flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>编码为 URL</span>
            </button>
            <button
              onClick={clearAll}
              className="btn-secondary"
            >
              清空
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: URL 编码转文本 */}
      {activeTab === 'decode' && (
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                URL 编码输入
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={loadExample}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  示例
                </button>
                <button
                  onClick={() => setUrlInput('')}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  清空
                </button>
              </div>
            </div>
            <textarea
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="在此输入 URL 编码字符串..."
              className="textarea w-full"
              rows={6}
            />
            <div className="mt-1 text-xs text-gray-500">
              长度: {urlInput.length.toLocaleString()} 字符
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={decodeUrl}
              className="btn-primary flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>解码为文本</span>
            </button>
            <button
              onClick={clearAll}
              className="btn-secondary"
            >
              清空
            </button>
          </div>
        </div>
      )}

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

      {/* 结果显示 */}
      {result && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              {activeTab === 'encode' ? 'URL 编码结果' : '解码文本结果'}
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => copyToClipboard(result)}
                className="btn-secondary text-sm"
              >
                复制
              </button>
            </div>
          </div>
          <textarea
            value={result}
            readOnly
            className="textarea w-full bg-gray-50"
            rows={6}
            placeholder="结果将显示在此处..."
          />
          <div className="mt-1 text-xs text-gray-500">
            {activeTab === 'encode' ? (
              <>
                编码后长度: {result.length.toLocaleString()} 字符
              </>
            ) : (
              <>
                字符数: {result.length.toLocaleString()} | 字节数: {new Blob([result]).size.toLocaleString()}
              </>
            )}
          </div>
        </div>
      )}

      {/* URL 编码说明 */}
      <div className="bg-yellow-50 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-900 mb-2">URL 编码规则</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-yellow-800">保留字符:</span>
            <span className="ml-2 text-yellow-700">A-Z a-z 0-9 - _ . ~</span>
          </div>
          <div>
            <span className="text-yellow-800">需要编码:</span>
            <span className="ml-2 text-yellow-700">中文、特殊字符、空格等</span>
          </div>
          <div>
            <span className="text-yellow-800">编码格式:</span>
            <span className="ml-2 text-yellow-700">% + 两位十六进制数</span>
          </div>
          <div>
            <span className="text-yellow-800">常见编码:</span>
            <span className="ml-2 text-yellow-700">%20(空格) %3D(=) %26(&)</span>
          </div>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">使用说明</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 支持中文字符和 Unicode 编码</li>
          <li>• 可以上传文本文件进行编码</li>
          <li>• URL 编码用于在 URL 中安全传输特殊字符</li>
          <li>• 常用于 URL 参数、表单提交等场景</li>
          <li>• 所有处理均在浏览器本地进行，数据不会上传</li>
        </ul>
      </div>
    </div>
  );
}