'use client';

import { useState, useCallback, useMemo } from 'react';

export function TimestampConverter() {
  const [timestamp, setTimestamp] = useState('');
  const [unit, setUnit] = useState<'seconds' | 'milliseconds'>('seconds');
  const [result, setResult] = useState<{
    localTime: string;
    utcTime: string;
    isoString: string;
    relative: string;
  } | null>(null);
  const [error, setError] = useState('');

  // 获取当前时间戳
  const getCurrentTimestamp = () => {
    const now = Date.now();
    const timestampValue = unit === 'seconds' ? Math.floor(now / 1000) : now;
    setTimestamp(timestampValue.toString());
  };

  // 转换时间戳
  const convertTimestamp = useCallback(() => {
    setError('');
    
    if (!timestamp.trim()) {
      setError('请输入时间戳');
      return;
    }

    const numTimestamp = parseInt(timestamp);
    if (isNaN(numTimestamp)) {
      setError('请输入有效的时间戳数字');
      return;
    }

    try {
      let date: Date;
      
      if (unit === 'seconds') {
        // 秒级时间戳
        date = new Date(numTimestamp * 1000);
      } else {
        // 毫秒级时间戳
        date = new Date(numTimestamp);
      }

      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        setError('时间戳超出有效范围');
        return;
      }

      const localTime = date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      });

      const utcTime = date.toUTCString();

      const isoString = date.toISOString();

      // 相对时间
      const now = Date.now();
      const timestampMs = unit === 'seconds' ? numTimestamp * 1000 : numTimestamp;
      const diff = now - timestampMs;
      const relative = formatRelativeTime(diff);

      setResult({
        localTime,
        utcTime,
        isoString,
        relative
      });

    } catch (err) {
      setError('转换失败，请检查时间戳格式');
    }
  }, [timestamp, unit]);

  // 格式化相对时间
  const formatRelativeTime = (ms: number) => {
    const absDiff = Math.abs(ms);
    const seconds = Math.floor(absDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (ms > 0) {
      // 未来时间
      if (years > 0) return `${years}年后`;
      if (months > 0) return `${months}个月后`;
      if (weeks > 0) return `${weeks}周后`;
      if (days > 0) return `${days}天后`;
      if (hours > 0) return `${hours}小时后`;
      if (minutes > 0) return `${minutes}分钟后`;
      return '刚刚';
    } else {
      // 过去时间
      if (years > 0) return `${years}年前`;
      if (months > 0) return `${months}个月前`;
      if (weeks > 0) return `${weeks}周前`;
      if (days > 0) return `${days}天前`;
      if (hours > 0) return `${hours}小时前`;
      if (minutes > 0) return `${minutes}分钟前`;
      return '刚刚';
    }
  };

  // 反向转换：从日期时间到时间戳
  const [datetimeInput, setDatetimeInput] = useState('');

  const convertDatetimeToTimestamp = () => {
    setError('');
    
    if (!datetimeInput.trim()) {
      setError('请输入日期时间');
      return;
    }

    try {
      const date = new Date(datetimeInput);
      if (isNaN(date.getTime())) {
        setError('无效的日期时间格式');
        return;
      }

      const timestampSeconds = Math.floor(date.getTime() / 1000);
      const timestampMs = date.getTime();
      
      setTimestamp(unit === 'seconds' ? timestampSeconds.toString() : timestampMs.toString());
      
    } catch (err) {
      setError('转换失败，请检查日期时间格式');
    }
  };

  // 预设时间戳示例
  const presetTimestamps = [
    { name: '当前时间', value: () => unit === 'seconds' ? Math.floor(Date.now() / 1000) : Date.now() },
    { name: '2000年1月1日', value: () => unit === 'seconds' ? 946684800 : 946684800000 },
    { name: '2020年1月1日', value: () => unit === 'seconds' ? 1577836800 : 1577836800000 },
    { name: 'Unix纪元', value: () => unit === 'seconds' ? 0 : 0 }
  ];

  // 常用日期格式
  const commonFormats = [
    '2024-01-01 12:00:00',
    '2024-01-01T12:00:00',
    '01/01/2024 12:00:00',
    '2024/01/01 12:00:00'
  ];

  return (
    <div className="space-y-6">
      {/* 时间戳输入 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">时间戳转换</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                时间戳
              </label>
              <div className="flex items-center space-x-2">
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as 'seconds' | 'milliseconds')}
                  className="px-3 py-1 text-sm border border-gray-300 rounded"
                >
                  <option value="seconds">秒</option>
                  <option value="milliseconds">毫秒</option>
                </select>
                <button
                  onClick={getCurrentTimestamp}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  当前时间
                </button>
              </div>
            </div>
            <input
              type="text"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              placeholder={`输入${unit === 'seconds' ? '秒' : '毫秒'}级时间戳`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            
            {/* 预设时间戳 */}
            <div className="mt-3">
              <label className="block text-sm text-gray-600 mb-2">快速选择</label>
              <div className="grid grid-cols-2 gap-2">
                {presetTimestamps.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setTimestamp(preset.value().toString())}
                    className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              日期时间 → 时间戳
            </label>
            <input
              type="datetime-local"
              value={datetimeInput}
              onChange={(e) => setDatetimeInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={convertDatetimeToTimestamp}
              className="mt-2 w-full btn-secondary text-sm"
            >
              转换
            </button>
            
            {/* 常用格式 */}
            <div className="mt-3">
              <label className="block text-sm text-gray-600 mb-2">常用格式</label>
              <div className="space-y-1">
                {commonFormats.map((format, index) => (
                  <button
                    key={index}
                    onClick={() => setDatetimeInput(format.replace(/\//g, '-'))}
                    className="block w-full text-left px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                  >
                    {format}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={convertTimestamp}
            className="btn-primary"
          >
            转换时间戳
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* 转换结果 */}
      {result && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">
              转换结果
            </h4>
            <p className="text-sm text-green-800">
              {result.relative}
            </p>
          </div>

          {/* 时间信息卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg border p-6">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                本地时间
              </h4>
              <div className="space-y-2">
                <div className="text-lg font-mono text-gray-900">{result.localTime}</div>
                <button
                  onClick={() => navigator.clipboard.writeText(result.localTime)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  复制
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                UTC 时间
              </h4>
              <div className="space-y-2">
                <div className="text-lg font-mono text-gray-900">{result.utcTime}</div>
                <button
                  onClick={() => navigator.clipboard.writeText(result.utcTime)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  复制
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                ISO 格式
              </h4>
              <div className="space-y-2">
                <div className="text-sm font-mono text-gray-900 break-all">{result.isoString}</div>
                <button
                  onClick={() => navigator.clipboard.writeText(result.isoString)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  复制
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                时间戳值
              </h4>
              <div className="space-y-2">
                <div className="text-lg font-mono text-gray-900">{timestamp}</div>
                <div className="text-sm text-gray-600">
                  {unit === 'seconds' ? '秒级' : '毫秒级'}时间戳
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(timestamp)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  复制
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 时间戳说明 */}
      <div className="bg-yellow-50 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-900 mb-2">时间戳说明</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-yellow-800">秒级时间戳:</span>
            <span className="ml-2 text-yellow-700">自1970年1月1日起的秒数</span>
          </div>
          <div>
            <span className="text-yellow-800">毫秒级时间戳:</span>
            <span className="ml-2 text-yellow-700">自1970年1月1日起的毫秒数</span>
          </div>
          <div>
            <span className="text-yellow-800">Unix纪元:</span>
            <span className="ml-2 text-yellow-700">1970年1月1日 00:00:00 UTC</span>
          </div>
          <div>
            <span className="text-yellow-800">适用范围:</span>
            <span className="ml-2 text-yellow-700">约到2038年（32位系统限制）</span>
          </div>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">使用说明</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 支持秒级和毫秒级时间戳转换</li>
          <li>• 可以从当前时间快速获取时间戳</li>
          <li>• 支持常用预设时间点快速选择</li>
          <li>• 提供多种时间格式：本地时间、UTC时间、ISO格式</li>
          <li>• 适用于日志分析、API调试、数据库操作等场景</li>
        </ul>
      </div>
    </div>
  );
}