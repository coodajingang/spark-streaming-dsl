// URL 编解码逻辑

/**
 * URL 编码
 * @param {string} text - 要编码的文本
 * @returns {string} URL 编码结果
 */
function encodeUrl(text) {
  if (typeof text !== 'string') {
    throw new Error('输入必须是字符串');
  }

  try {
    return encodeURIComponent(text);
  } catch (error) {
    throw new Error('URL 编码失败: ' + error.message);
  }
}

/**
 * URL 解码
 * @param {string} urlString - URL 编码字符串
 * @returns {string} 解码后的文本
 */
function decodeUrl(urlString) {
  if (typeof urlString !== 'string') {
    throw new Error('输入必须是字符串');
  }

  try {
    return decodeURIComponent(urlString);
  } catch (error) {
    throw new Error('URL 解码失败: ' + error.message);
  }
}

/**
 * 验证 URL 编码格式
 * @param {string} urlString - URL 编码字符串
 * @returns {boolean} 是否为有效 URL 编码
 */
function isValidUrlEncoding(urlString) {
  try {
    // 尝试解码
    const decoded = decodeURIComponent(urlString);
    // 验证编码和解码的一致性
    return encodeURIComponent(decoded) === urlString;
  } catch {
    return false;
  }
}

/**
 * 获取 URL 编码信息
 * @param {string} originalText - 原始文本
 * @param {string} encodedText - 编码文本
 * @returns {object} URL 编码信息
 */
function getUrlEncodingInfo(originalText, encodedText) {
  return {
    originalLength: originalText.length,
    encodedLength: encodedText.length,
    compressionRatio: encodedText.length / originalText.length,
    isValid: isValidUrlEncoding(encodedText),
    encodedText
  };
}

/**
 * 批量处理 URL 参数
 * @param {string} urlString - URL 字符串
 * @returns {object} 解析后的 URL 参数
 */
function parseUrlParams(urlString) {
  const params = {};
  
  try {
    const url = new URL(urlString);
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  } catch (error) {
    throw new Error('URL 解析失败: ' + error.message);
  }
}

/**
 * 构建带参数的 URL
 * @param {string} baseUrl - 基础 URL
 * @param {object} params - 参数对象
 * @returns {string} 完整的 URL
 */
function buildUrlWithParams(baseUrl, params) {
  try {
    const url = new URL(baseUrl);
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, String(params[key]));
      }
    });
    
    return url.toString();
  } catch (error) {
    throw new Error('URL 构建失败: ' + error.message);
  }
}

module.exports = {
  encodeUrl,
  decodeUrl,
  isValidUrlEncoding,
  getUrlEncodingInfo,
  parseUrlParams,
  buildUrlWithParams
};