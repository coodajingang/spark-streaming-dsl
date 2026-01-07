// 颜色转换逻辑

/**
 * HEX 转 RGB
 * @param {string} hex - HEX 颜色值
 * @returns {object|null} RGB 对象 {r, g, b} 或 null
 */
function hexToRgb(hex) {
  if (typeof hex !== 'string') {
    return null;
  }

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * RGB 转 HEX
 * @param {number} r - 红色值 (0-255)
 * @param {number} g - 绿色值 (0-255)
 * @param {number} b - 蓝色值 (0-255)
 * @returns {string} HEX 颜色值
 */
function rgbToHex(r, g, b) {
  // 验证输入范围
  if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
    throw new Error('RGB 值必须在 0-255 之间');
  }

  return "#" + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("").toLowerCase();
}

/**
 * RGB 转 HSL
 * @param {number} r - 红色值 (0-255)
 * @param {number} g - 绿色值 (0-255)
 * @param {number} b - 蓝色值 (0-255)
 * @returns {object} HSL 对象 {h, s, l}
 */
function rgbToHsl(r, g, b) {
  // 标准化到 0-1 范围
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * HSL 转 RGB
 * @param {number} h - 色相 (0-360)
 * @param {number} s - 饱和度 (0-100)
 * @param {number} l - 亮度 (0-100)
 * @returns {object} RGB 对象 {r, g, b}
 */
function hslToRgb(h, s, l) {
  // 验证输入范围
  if (h < 0 || h > 360 || s < 0 || s > 100 || l < 0 || l > 100) {
    throw new Error('HSL 值超出范围：H(0-360), S(0-100), L(0-100)');
  }

  h /= 360;
  s /= 100;
  l /= 100;

  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

/**
 * HEX 转 HSL
 * @param {string} hex - HEX 颜色值
 * @returns {object|null} HSL 对象或 null
 */
function hexToHsl(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return rgbToHsl(rgb.r, rgb.g, rgb.b);
}

/**
 * HSL 转 HEX
 * @param {number} h - 色相 (0-360)
 * @param {number} s - 饱和度 (0-100)
 * @param {number} l - 亮度 (0-100)
 * @returns {string} HEX 颜色值
 */
function hslToHex(h, s, l) {
  const rgb = hslToRgb(h, s, l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

/**
 * 获取颜色名称（常用颜色）
 * @param {string} hex - HEX 颜色值
 * @returns {string} 颜色名称
 */
function getColorName(hex) {
  const colorNames = {
    '#ff0000': '纯红',
    '#00ff00': '纯绿',
    '#0000ff': '纯蓝',
    '#ffff00': '黄色',
    '#00ffff': '青色',
    '#ff00ff': '紫色',
    '#ffa500': '橙色',
    '#ffc0cb': '粉色',
    '#8b4513': '棕色',
    '#808080': '灰色',
    '#000000': '黑色',
    '#ffffff': '白色'
  };
  
  return colorNames[hex.toLowerCase()] || '未知颜色';
}

/**
 * 计算对比色
 * @param {string} hex - HEX 颜色值
 * @returns {string} 对比色 HEX 值
 */
function getContrastColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000000';
  
  // 计算相对亮度
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * 验证 HEX 颜色格式
 * @param {string} hex - HEX 颜色值
 * @returns {boolean} 是否为有效 HEX 格式
 */
function isValidHex(hex) {
  return /^#?[0-9A-Fa-f]{6}$/.test(hex);
}

module.exports = {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  hexToHsl,
  hslToHex,
  getColorName,
  getContrastColor,
  isValidHex
};