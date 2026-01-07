// JSON 格式化逻辑
/**
 * 格式化 JSON 字符串
 * @param {string} jsonString - JSON 字符串
 * @param {number} indent - 缩进空格数
 * @returns {string} 格式化后的 JSON 字符串
 */
function formatJson(jsonString, indent = 2) {
  if (!jsonString || typeof jsonString !== 'string') {
    throw new Error('输入必须是字符串');
  }

  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, indent);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('JSON 格式错误');
    }
    throw error;
  }
}

/**
 * 压缩 JSON 字符串（移除空白字符）
 * @param {string} jsonString - JSON 字符串
 * @returns {string} 压缩后的 JSON 字符串
 */
function minifyJson(jsonString) {
  if (!jsonString || typeof jsonString !== 'string') {
    throw new Error('输入必须是字符串');
  }

  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('JSON 格式错误');
    }
    throw error;
  }
}

/**
 * 验证 JSON 格式
 * @param {string} jsonString - JSON 字符串
 * @returns {boolean} 是否为有效 JSON
 */
function isValidJson(jsonString) {
  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取 JSON 统计信息
 * @param {string} jsonString - JSON 字符串
 * @returns {object} JSON 统计信息
 */
function getJsonStats(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    return {
      isValid: true,
      size: jsonString.length,
      lines: jsonString.split('\n').length,
      keys: Object.keys(parsed).length,
      depth: getJsonDepth(parsed)
    };
  } catch {
    return {
      isValid: false,
      size: jsonString.length,
      lines: jsonString.split('\n').length,
      keys: 0,
      depth: 0
    };
  }
}

/**
 * 获取 JSON 对象的深度
 * @param {object} obj - JSON 对象
 * @returns {number} 深度
 */
function getJsonDepth(obj) {
  if (obj === null || typeof obj !== 'object') {
    return 1;
  }

  let maxDepth = 1;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const depth = getJsonDepth(obj[key]);
      maxDepth = Math.max(maxDepth, depth + 1);
    }
  }
  return maxDepth;
}

module.exports = {
  formatJson,
  minifyJson,
  isValidJson,
  getJsonStats,
  getJsonDepth
};