'use client';

import { useState, useCallback, useEffect } from 'react';

interface CronField {
  minute: string;
  hour: string;
  day: string;
  month: string;
  weekday: string;
}

export function CronGenerator() {
  const [cronExpression, setCronExpression] = useState('0 9 * * 1'); // 默认每周一 09:00
  const [cronDescription, setCronDescription] = useState('');
  const [nextExecutions, setNextExecutions] = useState<string[]>([]);
  const [reverseInput, setReverseInput] = useState('');
  const [reverseDescription, setReverseDescription] = useState('');
  const [error, setError] = useState('');

  // 生成 Cron 表达式
  const generateCron = useCallback((fields: Partial<CronField>) => {
    const minute = fields.minute ?? '*';
    const hour = fields.hour ?? '*';
    const day = fields.day ?? '*';
    const month = fields.month ?? '*';
    const weekday = fields.weekday ?? '*';
    
    const expression = `${minute} ${hour} ${day} ${month} ${weekday}`;
    setCronExpression(expression);
    
    // 生成中文描述
    let description = '执行频率：';
    const parts: string[] = [];
    
    if (minute !== '*') parts.push(`第${minute}分钟`);
    if (hour !== '*') parts.push(`${hour}点`);
    if (day !== '*') parts.push(`每月第${day}天`);
    if (month !== '*') parts.push(`${month}月`);
    if (weekday !== '*') {
      const weekdayNames = ['日', '一', '二', '三', '四', '五', '六'];
      parts.push(`周${weekdayNames[parseInt(weekday)]}`);
    }
    
    if (parts.length === 0) {
      description += '每分钟执行一次';
    } else if (parts.length === 1) {
      description += parts[0];
    } else {
      description += parts.join('，');
    }
    
    setCronDescription(description);
    setError('');
  }, []);

  // 计算下次执行时间（简化版本）
  const calculateNextExecutions = useCallback((expression: string) => {
    const now = new Date();
    const executions: string[] = [];
    
    // 简化的执行时间计算，实际项目中可能需要更复杂的逻辑
    if (expression === '0 9 * * 1') {
      // 每周一 09:00
      const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
      const nextMonday = new Date(now);
      nextMonday.setDate(now.getDate() + daysUntilMonday);
      nextMonday.setHours(9, 0, 0, 0);
      executions.push(nextMonday.toLocaleString('zh-CN'));
    } else if (expression === '0 0 * * *') {
      // 每天午夜
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      executions.push(tomorrow.toLocaleString('zh-CN'));
    } else if (expression === '0 0 1 * *') {
      // 每月1号午夜
      const nextMonth = new Date(now);
      nextMonth.setMonth(now.getMonth() + 1, 1);
      nextMonth.setHours(0, 0, 0, 0);
      executions.push(nextMonth.toLocaleString('zh-CN'));
    } else {
      // 通用处理（简化）
      const nextMinute = new Date(now.getTime() + 60000);
      executions.push(nextMinute.toLocaleString('zh-CN'));
    }
    
    // 添加接下来几次执行时间
    for (let i = 1; i < 5; i++) {
      const nextExecution = new Date(executions[0]);
      if (expression === '0 9 * * 1') {
        // 每周一
        nextExecution.setDate(nextExecution.getDate() + (7 * i));
      } else {
        nextExecution.setMinutes(nextExecution.getMinutes() + (60 * 24 * i));
      }
      executions.push(nextExecution.toLocaleString('zh-CN'));
    }
    
    setNextExecutions(executions);
  }, []);

  // 监听 Cron 表达式变化
  useEffect(() => {
    calculateNextExecutions(cronExpression);
  }, [cronExpression, calculateNextExecutions]);

  // 反向解析 Cron 表达式
  const reverseParse = useCallback(() => {
    if (!reverseInput.trim()) {
      setReverseDescription('');
      return;
    }

    try {
      const parts = reverseInput.trim().split(/\s+/);
      if (parts.length !== 5) {
        setError('Cron 表达式必须包含 5 个字段');
        return;
      }

      const [minute, hour, day, month, weekday] = parts;
      let description = '执行时间：';
      
      // 解析各个字段
      const partsList: string[] = [];
      
      if (minute !== '*') partsList.push(`第${minute}分钟`);
      if (hour !== '*') partsList.push(`${hour}点`);
      if (day !== '*') partsList.push(`每月第${day}天`);
      if (month !== '*') partsList.push(`${month}月`);
      if (weekday !== '*') {
        const weekdayNames = ['日', '一', '二', '三', '四', '五', '六'];
        const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
        partsList.push(`周${dayNames[parseInt(weekday)]}`);
      }
      
      if (partsList.length === 0) {
        description += '每分钟执行一次';
      } else {
        description += partsList.join('，');
      }
      
      setReverseDescription(description);
      setError('');
    } catch (err) {
      setError('Cron 表达式格式错误');
    }
  }, [reverseInput]);

  const presetPatterns = [
    { name: '每分钟', expression: '* * * * *', description: '每分钟执行一次' },
    { name: '每小时', expression: '0 * * * *', description: '每小时的开始执行' },
    { name: '每天午夜', expression: '0 0 * * *', description: '每天午夜执行' },
    { name: '每周一', expression: '0 9 * * 1', description: '每周一上午9点执行' },
    { name: '每月1号', expression: '0 0 1 * *', description: '每月1号午夜执行' },
    { name: '工作日', expression: '0 9 * * 1-5', description: '工作日上午9点执行' },
  ];

  return (
    <div className="space-y-6">
      {/* 可视化创建区域 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">可视化创建</h3>
        
        {/* 预设模板 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            预设模板
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {presetPatterns.map((preset) => (
              <button
                key={preset.name}
                onClick={() => {
                  setCronExpression(preset.expression);
                  setCronDescription(preset.description);
                }}
                className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* 自定义设置 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              分钟
            </label>
            <input
              type="text"
              value="0"
              onChange={(e) => generateCron({ minute: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="0-59"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              小时
            </label>
            <input
              type="text"
              value="9"
              onChange={(e) => generateCron({ hour: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="0-23"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              日期
            </label>
            <input
              type="text"
              value="*"
              onChange={(e) => generateCron({ day: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="1-31"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              月份
            </label>
            <input
              type="text"
              value="*"
              onChange={(e) => generateCron({ month: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="1-12"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              星期
            </label>
            <input
              type="text"
              value="1"
              onChange={(e) => generateCron({ weekday: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="0-6"
            />
          </div>
        </div>

        {/* 生成的表达式 */}
        <div className="bg-white rounded border p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Cron 表达式
            </label>
            <button
              onClick={() => navigator.clipboard.writeText(cronExpression)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              复制
            </button>
          </div>
          <code className="block w-full p-3 bg-gray-100 rounded font-mono text-lg">
            {cronExpression}
          </code>
          {cronDescription && (
            <p className="mt-2 text-sm text-gray-600">
              <strong>描述：</strong>{cronDescription}
            </p>
          )}
        </div>
      </div>

      {/* 下次执行时间 */}
      {nextExecutions.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">下次执行时间</h4>
          <div className="space-y-1">
            {nextExecutions.slice(0, 5).map((time, index) => (
              <div key={index} className="text-sm text-blue-800">
                第 {index + 1} 次：{time}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 反向解析区域 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">反向解析</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              输入 Cron 表达式
            </label>
            <input
              type="text"
              value={reverseInput}
              onChange={(e) => setReverseInput(e.target.value)}
              placeholder="例如：0 9 * * 1"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={reverseParse}
            className="btn-primary"
          >
            解析表达式
          </button>
          
          {reverseDescription && (
            <div className="bg-white rounded border p-4">
              <h4 className="font-semibold text-gray-900 mb-2">解析结果</h4>
              <p className="text-gray-700">{reverseDescription}</p>
            </div>
          )}
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* 使用说明 */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">使用说明</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Cron 表达式格式：秒 分 时 日 月 星期</li>
          <li>• 常用符号：*（任意值）、-（范围）、,（多个值）、/（步长）</li>
          <li>• 分钟：0-59，小时：0-23，日期：1-31，月份：1-12，星期：0-6（0为周日）</li>
          <li>• 示例："0 9 * * 1" 表示每周一上午9点执行</li>
          <li>• 示例："0 0 */2 * *" 表示每2天午夜执行一次</li>
        </ul>
      </div>
    </div>
  );
}