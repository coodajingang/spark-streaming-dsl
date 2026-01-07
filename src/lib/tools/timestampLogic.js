// 时间戳转换逻辑

/**
 * 时间戳转日期
 * @param {number} timestamp - 时间戳
 * @param {string} unit - 单位 ('seconds' | 'milliseconds')
 * @returns {Date} 日期对象
 */
function timestampToDate(timestamp, unit = 'seconds') {
  if (typeof timestamp !== 'number' || isNaN(timestamp)) {
    throw new Error('时间戳必须是数字');
  }

  try {
    let date;
    
    if (unit === 'seconds') {
      // 秒级时间戳
      date = new Date(timestamp * 1000);
    } else if (unit === 'milliseconds') {
      // 毫秒级时间戳
      date = new Date(timestamp);
    } else {
      throw new Error('单位必须是 seconds 或 milliseconds');
    }

    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      throw new Error('时间戳超出有效范围');
    }

    return date;
  } catch (error) {
    throw new Error('时间戳转换失败: ' + error.message);
  }
}

/**
 * 日期转时间戳
 * @param {Date} date - 日期对象
 * @param {string} unit - 单位 ('seconds' | 'milliseconds')
 * @returns {number} 时间戳
 */
function dateToTimestamp(date, unit = 'seconds') {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('输入必须是有效的日期对象');
  }

  try {
    const timestamp = date.getTime();
    
    if (unit === 'seconds') {
      return Math.floor(timestamp / 1000);
    } else if (unit === 'milliseconds') {
      return timestamp;
    } else {
      throw new Error('单位必须是 seconds 或 milliseconds');
    }
  } catch (error) {
    throw new Error('日期转换失败: ' + error.message);
  }
}

/**
 * 格式化日期为本地时间字符串
 * @param {Date} date - 日期对象
 * @param {object} options - 格式化选项
 * @returns {string} 格式化后的字符串
 */
function formatLocalTime(date, options = {}) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('输入必须是有效的日期对象');
  }

  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  };

  return date.toLocaleString('zh-CN', { ...defaultOptions, ...options });
}

/**
 * 格式化日期为 UTC 时间字符串
 * @param {Date} date - 日期对象
 * @returns {string} UTC 时间字符串
 */
function formatUtcTime(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('输入必须是有效的日期对象');
  }

  return date.toUTCString();
}

/**
 * 格式化日期为 ISO 字符串
 * @param {Date} date - 日期对象
 * @returns {string} ISO 字符串
 */
function formatIsoString(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('输入必须是有效的日期对象');
  }

  return date.toISOString();
}

/**
 * 计算相对时间
 * @param {number} timestamp - 毫秒时间戳
 * @returns {string} 相对时间字符串
 */
function formatRelativeTime(timestamp) {
  if (typeof timestamp !== 'number' || isNaN(timestamp)) {
    throw new Error('时间戳必须是数字');
  }

  const now = Date.now();
  const diff = now - timestamp;
  const absDiff = Math.abs(diff);

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (diff > 0) {
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
}

/**
 * 获取下次执行时间（简化版本）
 * @param {string} cronExpression - Cron 表达式
 * @param {number} count - 要获取的次数
 * @returns {string[]} 执行时间数组
 */
function getNextExecutions(cronExpression, count = 5) {
  if (typeof cronExpression !== 'string') {
    throw new Error('Cron 表达式必须是字符串');
  }

  const now = new Date();
  const executions = [];

  // 简化的执行时间计算
  switch (cronExpression) {
    case '0 9 * * 1': // 每周一 09:00
      for (let i = 0; i < count; i++) {
        const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
        const nextExecution = new Date(now);
        nextExecution.setDate(now.getDate() + daysUntilMonday + (7 * i));
        nextExecution.setHours(9, 0, 0, 0);
        executions.push(formatLocalTime(nextExecution));
      }
      break;

    case '0 0 * * *': // 每天午夜
      for (let i = 0; i < count; i++) {
        const nextExecution = new Date(now);
        nextExecution.setDate(now.getDate() + i + 1);
        nextExecution.setHours(0, 0, 0, 0);
        executions.push(formatLocalTime(nextExecution));
      }
      break;

    case '0 0 1 * *': // 每月1号午夜
      for (let i = 0; i < count; i++) {
        const nextExecution = new Date(now);
        nextExecution.setMonth(now.getMonth() + i + 1, 1);
        nextExecution.setHours(0, 0, 0, 0);
        executions.push(formatLocalTime(nextExecution));
      }
      break;

    default:
      // 通用处理（每分钟）
      for (let i = 0; i < count; i++) {
        const nextExecution = new Date(now.getTime() + (60000 * (i + 1)));
        executions.push(formatLocalTime(nextExecution));
      }
  }

  return executions;
}

/**
 * 获取当前时间戳
 * @param {string} unit - 单位 ('seconds' | 'milliseconds')
 * @returns {number} 当前时间戳
 */
function getCurrentTimestamp(unit = 'seconds') {
  const now = Date.now();
  
  if (unit === 'seconds') {
    return Math.floor(now / 1000);
  } else if (unit === 'milliseconds') {
    return now;
  } else {
    throw new Error('单位必须是 seconds 或 milliseconds');
  }
}

/**
 * 验证时间戳
 * @param {number} timestamp - 时间戳
 * @param {string} unit - 单位
 * @returns {boolean} 是否有效
 */
function isValidTimestamp(timestamp, unit = 'seconds') {
  if (typeof timestamp !== 'number' || isNaN(timestamp)) {
    return false;
  }

  try {
    const date = timestampToDate(timestamp, unit);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}

module.exports = {
  timestampToDate,
  dateToTimestamp,
  formatLocalTime,
  formatUtcTime,
  formatIsoString,
  formatRelativeTime,
  getNextExecutions,
  getCurrentTimestamp,
  isValidTimestamp
};