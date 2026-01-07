'use client';

import { useState, useCallback, useMemo } from 'react';

interface ColorValues {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
}

export function ColorConverter() {
  const [activeInput, setActiveInput] = useState<'hex' | 'rgb' | 'hsl'>('hex');
  const [colorValues, setColorValues] = useState<ColorValues>({
    hex: '#3b82f6',
    rgb: { r: 59, g: 130, b: 246 },
    hsl: { h: 217, s: 91, l: 60 }
  });
  const [error, setError] = useState('');

  // HEX 转 RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // RGB 转 HEX
  const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  };

  // RGB 转 HSL
  const rgbToHsl = (r: number, g: number, b: number) => {
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
  };

  // HSL 转 RGB
  const hslToRgb = (h: number, s: number, l: number) => {
    h /= 360;
    s /= 100;
    l /= 100;

    const hue2rgb = (p: number, q: number, t: number) => {
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
  };

  // 更新颜色值
  const updateColor = useCallback((type: 'hex' | 'rgb' | 'hsl', value: any) => {
    setError('');
    setActiveInput(type);

    try {
      let newRgb: { r: number; g: number; b: number };
      let newHex: string;
      let newHsl: { h: number; s: number; l: number };

      if (type === 'hex') {
        const hex = value.startsWith('#') ? value : `#${value}`;
        const rgb = hexToRgb(hex);
        if (!rgb) {
          setError('无效的 HEX 颜色格式');
          return;
        }
        newRgb = rgb;
        newHex = hex;
        newHsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      } else if (type === 'rgb') {
        const { r, g, b } = value;
        if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
          setError('RGB 值必须在 0-255 之间');
          return;
        }
        newRgb = { r, g, b };
        newHex = rgbToHex(r, g, b);
        newHsl = rgbToHsl(r, g, b);
      } else {
        const { h, s, l } = value;
        if (h < 0 || h > 360 || s < 0 || s > 100 || l < 0 || l > 100) {
          setError('HSL 值超出范围：H(0-360), S(0-100), L(0-100)');
          return;
        }
        newRgb = hslToRgb(h, s, l);
        newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
        newHsl = { h, s, l };
      }

      setColorValues({
        hex: newHex.toLowerCase(),
        rgb: newRgb,
        hsl: newHsl
      });
    } catch (err) {
      setError('颜色转换失败');
    }
  }, []);

  // 获取对比色
  const getContrastColor = useCallback((hex: string) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return '#000000';
    
    // 计算相对亮度
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }, []);

  // 预设颜色
  const presetColors = [
    { name: '纯红', hex: '#ff0000' },
    { name: '纯绿', hex: '#00ff00' },
    { name: '纯蓝', hex: '#0000ff' },
    { name: '黄色', hex: '#ffff00' },
    { name: '青色', hex: '#00ffff' },
    { name: '紫色', hex: '#ff00ff' },
    { name: '橙色', hex: '#ffa500' },
    { name: '粉色', hex: '#ffc0cb' },
    { name: '棕色', hex: '#8b4513' },
    { name: '灰色', hex: '#808080' },
    { name: '黑色', hex: '#000000' },
    { name: '白色', hex: '#ffffff' }
  ];

  // 颜色预览
  const colorPreview = useMemo(() => ({
    backgroundColor: colorValues.hex,
    color: getContrastColor(colorValues.hex)
  }), [colorValues.hex, getContrastColor]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('已复制到剪贴板');
    } catch (err) {
      alert('复制失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* 颜色预览 */}
      <div className="text-center">
        <div 
          className="w-full h-32 rounded-lg flex items-center justify-center text-2xl font-bold mb-4"
          style={colorPreview}
        >
          颜色预览
        </div>
        <p className="text-sm text-gray-600">
          当前颜色: {colorValues.hex.toUpperCase()}
        </p>
      </div>

      {/* 预设颜色 */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">预设颜色</h3>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
          {presetColors.map((preset) => (
            <button
              key={preset.hex}
              onClick={() => updateColor('hex', preset.hex)}
              className="group relative"
              title={preset.name}
            >
              <div 
                className="w-full h-12 rounded-lg border-2 border-gray-300 group-hover:border-blue-500 transition-colors"
                style={{ backgroundColor: preset.hex }}
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div 
                  className="text-xs font-medium px-2 py-1 rounded"
                  style={{ color: getContrastColor(preset.hex) }}
                >
                  {preset.name}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 颜色输入 */}
      <div className="space-y-6">
        {/* HEX 输入 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            HEX 颜色值
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={colorValues.hex}
              onChange={(e) => updateColor('hex', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="#3b82f6"
            />
            <button
              onClick={() => copyToClipboard(colorValues.hex)}
              className="btn-secondary"
            >
              复制
            </button>
          </div>
        </div>

        {/* RGB 输入 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            RGB 颜色值
          </label>
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">R (0-255)</label>
              <input
                type="number"
                min="0"
                max="255"
                value={colorValues.rgb.r}
                onChange={(e) => updateColor('rgb', { 
                  ...colorValues.rgb, 
                  r: parseInt(e.target.value) || 0 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">G (0-255)</label>
              <input
                type="number"
                min="0"
                max="255"
                value={colorValues.rgb.g}
                onChange={(e) => updateColor('rgb', { 
                  ...colorValues.rgb, 
                  g: parseInt(e.target.value) || 0 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">B (0-255)</label>
              <input
                type="number"
                min="0"
                max="255"
                value={colorValues.rgb.b}
                onChange={(e) => updateColor('rgb', { 
                  ...colorValues.rgb, 
                  b: parseInt(e.target.value) || 0 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => copyToClipboard(`rgb(${colorValues.rgb.r}, ${colorValues.rgb.g}, ${colorValues.rgb.b})`)}
                className="btn-secondary w-full"
              >
                复制 RGB
              </button>
            </div>
          </div>
        </div>

        {/* HSL 输入 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            HSL 颜色值
          </label>
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">H (0-360)</label>
              <input
                type="number"
                min="0"
                max="360"
                value={colorValues.hsl.h}
                onChange={(e) => updateColor('hsl', { 
                  ...colorValues.hsl, 
                  h: parseInt(e.target.value) || 0 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">S (0-100%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={colorValues.hsl.s}
                onChange={(e) => updateColor('hsl', { 
                  ...colorValues.hsl, 
                  s: parseInt(e.target.value) || 0 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">L (0-100%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={colorValues.hsl.l}
                onChange={(e) => updateColor('hsl', { 
                  ...colorValues.hsl, 
                  l: parseInt(e.target.value) || 0 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => copyToClipboard(`hsl(${colorValues.hsl.h}, ${colorValues.hsl.s}%, ${colorValues.hsl.l}%)`)}
                className="btn-secondary w-full"
              >
                复制 HSL
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* 颜色信息 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">颜色信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border">
            <h4 className="font-medium text-gray-900 mb-2">HEX</h4>
            <div className="font-mono text-lg text-blue-600">{colorValues.hex.toUpperCase()}</div>
            <p className="text-sm text-gray-600 mt-1">十六进制表示法</p>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <h4 className="font-medium text-gray-900 mb-2">RGB</h4>
            <div className="font-mono text-lg text-green-600">
              rgb({colorValues.rgb.r}, {colorValues.rgb.g}, {colorValues.rgb.b})
            </div>
            <p className="text-sm text-gray-600 mt-1">红绿蓝色彩模式</p>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <h4 className="font-medium text-gray-900 mb-2">HSL</h4>
            <div className="font-mono text-lg text-purple-600">
              hsl({colorValues.hsl.h}, {colorValues.hsl.s}%, {colorValues.hsl.l}%)
            </div>
            <p className="text-sm text-gray-600 mt-1">色相饱和度亮度</p>
          </div>
        </div>
      </div>

      {/* 颜色渐变 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">颜色渐变</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">亮度变化</label>
            <div className="flex items-center space-x-2">
              <div 
                className="w-8 h-8 rounded border"
                style={{ backgroundColor: rgbToHex(...Object.values(hslToRgb(colorValues.hsl.h, colorValues.hsl.s, Math.max(0, colorValues.hsl.l - 20))) }}
              />
              <div 
                className="w-8 h-8 rounded border"
                style={{ backgroundColor: colorValues.hex }}
              />
              <div 
                className="w-8 h-8 rounded border"
                style={{ backgroundColor: rgbToHex(...Object.values(hslToRgb(colorValues.hsl.h, colorValues.hsl.s, Math.min(100, colorValues.hsl.l + 20))) }}
              />
              <span className="text-sm text-gray-600">暗 → 亮</span>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">饱和度变化</label>
            <div className="flex items-center space-x-2">
              <div 
                className="w-8 h-8 rounded border"
                style={{ backgroundColor: rgbToHex(...Object.values(hslToRgb(colorValues.hsl.h, 0, colorValues.hsl.l))) }}
              />
              <div 
                className="w-8 h-8 rounded border"
                style={{ backgroundColor: colorValues.hex }}
              />
              <div 
                className="w-8 h-8 rounded border"
                style={{ backgroundColor: rgbToHex(...Object.values(hslToRgb(colorValues.hsl.h, 100, colorValues.hsl.l))) }}
              />
              <span className="text-sm text-gray-600">灰 → 鲜艳</span>
            </div>
          </div>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">使用说明</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 支持三种颜色格式互相转换：HEX、RGB、HSL</li>
          <li>• 点击预设颜色快速选择常用颜色</li>
          <li>• 修改任一格式的值，其他格式会自动更新</li>
          <li>• 一键复制各种格式的颜色值</li>
          <li>• 适合前端设计师和开发者使用</li>
        </ul>
      </div>
    </div>
  );
}