// Base64 编解码逻辑

/**
 * Base64 编码
 * @param {string} text - 要编码的文本
 * @returns {string} Base64 编码结果
 */
function encodeBase64(text) {
  if (typeof text !== 'string') {
    throw new Error('输入必须是字符串');
  }

  try {
    // 处理 Unicode 字符
    return btoa(unescape(encodeURIComponent(text)));
  } catch (error) {
    throw new Error('Base64 编码失败: ' + error.message);
  }
}

/**
 * Base64 解码
 * @param {string} base64String - Base64 字符串
 * @returns {string} 解码后的文本
 */
function decodeBase64(base64String) {
  if (typeof base64String !== 'string') {
    throw new Error('输入必须是字符串');
  }

  try {
    // 清理输入（移除空白字符）
    const cleaned = base64String.replace(/\s+/g, '');
    
    // 验证 Base64 格式
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(cleaned)) {
      throw new Error('Base64 格式不正确');
    }

    // 添加必要的 padding
    const padded = cleaned + '='.repeat((4 - cleaned.length % 4) % 4);
    
    // 解码
    const decoded = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
    return decodeURIComponent(escape(decoded));
  } catch (error) {
    throw new Error('Base64 解码失败: ' + error.message);
  }
}

/**
 * 验证 Base64 格式
 * @param {string} base64String - Base64 字符串
 * @returns {boolean} 是否为有效 Base64
 */
function isValidBase64(base64String) {
  try {
    // 清理输入
    const cleaned = base64String.replace(/\s+/g, '');
    
    // 验证字符集
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(cleaned)) {
      return false;
    }

    // 验证长度（必须是 4 的倍数）
    if (cleaned.length % 4 !== 0) {
      return false;
    }

    // 尝试解码
    const padded = cleaned + '='.repeat((4 - cleaned.length % 4) % 4);
    atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取 Base64 信息
 * @param {string} base64String - Base64 字符串
 * @returns {object} Base64 信息
 */
function getBase64Info(base64String) {
  const cleaned = base64String.replace(/\s+/g, '');
  
  return {
    originalLength: base64String.length,
    cleanedLength: cleaned.length,
    hasPadding: cleaned.includes('='),
    paddingLength: (cleaned.match(/=/g) || []).length,
    isValid: isValidBase64(base64String),
    estimatedOriginalSize: Math.ceil(cleaned.length * 3 / 4)
  };
}

module.exports = {
  encodeBase64,
  decodeBase64,
  isValidBase64,
  getBase64Info
};