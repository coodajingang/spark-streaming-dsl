'use client';

import { useState, useCallback } from 'react';

export function Base64Encoder() {
  const [activeTab, setActiveTab] = useState<'encode' | 'decode'>('encode');
  const [textInput, setTextInput] = useState('');
  const [base64Input, setBase64Input] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const encodeText = useCallback(() => {
    setError('');
    setSuccessMessage('');
    
    if (!textInput.trim()) {
      setError('请输入要编码的文本');
      return;
    }

    try {
      // 处理 Unicode 字符
      const encoded = btoa(unescape(encodeURIComponent(textInput)));
      setResult(encoded);
      setSuccessMessage('文本编码成功');
      
      // 3秒后清除成功消息
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(`编码失败：${err instanceof Error ? err.message : '未知错误'}`);
    }
  }, [textInput]);

  const decodeBase64 = useCallback(() => {
    setError('');
    setSuccessMessage('');
    
    if (!base64Input.trim()) {
      setError('请输入要解码的 Base64 字符串');
      return;
    }

    try {
      // 清理输入（移除空白字符）
      const cleanedInput = base64Input.replace(/\s+/g, '');
      
      // 验证 Base64 格式
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(cleanedInput)) {
        setError('Base64 格式不正确');
        return;
      }

      // 解码
      const decoded = decodeURIComponent(escape(atob(cleanedInput)));
      setResult(decoded);
      setSuccessMessage('Base64 解码成功');
      
      // 3秒后清除成功消息
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(`解码失败：${err instanceof Error ? err.message : 'Base64 格式错误'}`);
    }
  }, [base64Input]);

  const clearAll = () => {
    setTextInput('');
    setBase64Input('');
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
      const example = '你好，世界！Hello, World! 🌍';
      setTextInput(example);
    } else {
      const example = '5LiW55WM6L+Z5piv5Lq65byF5a65';
      setBase64Input(example);
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

  const handleFileDownload = () => {
    if (result) {
      const blob = new Blob([result], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `decoded_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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
            文本 → Base64
          </button>
          <button
            onClick={() => setActiveTab('decode')}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'decode'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Base64 → 文本
          </button>
        </div>
      </div>

      {/* Tab 1: 文本转 Base64 */}
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
              onClick={encodeText}
              className="btn-primary flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>编码为 Base64</span>
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

      {/* Tab 2: Base64 转文本 */}
      {activeTab === 'decode' && (
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Base64 输入
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={loadExample}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  示例
                </button>
                <button
                  onClick={() => setBase64Input('')}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  清空
                </button>
              </div>
            </div>
            <textarea
              value={base64Input}
              onChange={(e) => setBase64Input(e.target.value)}
              placeholder="在此输入 Base64 字符串..."
              className="textarea w-full"
              rows={6}
            />
            <div className="mt-1 text-xs text-gray-500">
              长度: {base64Input.length.toLocaleString()} 字符
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={decodeBase64}
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
              {activeTab === 'encode' ? 'Base64 结果' : '解码文本结果'}
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => copyToClipboard(result)}
                className="btn-secondary text-sm"
              >
                复制
              </button>
              {activeTab === 'decode' && (
                <button
                  onClick={handleFileDownload}
                  className="btn-secondary text-sm"
                >
                  下载
                </button>
              )}
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
                Base64 长度: {result.length.toLocaleString()} | 
                等效字节数: {Math.ceil(result.length * 3 / 4).toLocaleString()}
              </>
            ) : (
              <>
                字符数: {result.length.toLocaleString()} | 
                字节数: {new Blob([result]).size.toLocaleString()}
              </>
            )}
          </div>
        </div>
      )}

      {/* Base64 验证器 */}
      <div className="bg-yellow-50 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-900 mb-2">Base64 格式验证</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-yellow-800">字符集:</span>
            <span className="ml-2 text-yellow-700">A-Z, a-z, 0-9, +, /</span>
          </div>
          <div>
            <span className="text-yellow-800">填充:</span>
            <span className="ml-2 text-yellow-700">= 字符（可选）</span>
          </div>
          <div>
            <span className="text-yellow-800">4字符一组:</span>
            <span className="ml-2 text-yellow-700">每组4字符</span>
          </div>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">使用说明</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 支持中文字符和 Unicode 编码</li>
          <li>• 可以上传文本文件进行编码</li>
          <li>• Base64 编码会增大约 33% 的数据大小</li>
          <li>• 常用于数据传输、图像编码等场景</li>
          <li>• 所有处理均在浏览器本地进行，数据不会上传</li>
        </ul>
      </div>
    </div>
  );
}