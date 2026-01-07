// 工具逻辑单元测试
// 测试核心工具函数的正确性

// 导入工具逻辑模块
const jsonLogic = require('../tools/jsonLogic');
const base64Logic = require('../tools/base64Logic');
const urlLogic = require('../tools/urlLogic');
const colorLogic = require('../tools/colorLogic');
const timestampLogic = require('../tools/timestampLogic');
const fbaLogic = require('../tools/fbaLogic');
const cogsLogic = require('../tools/cogsLogic');
const jwtLogic = require('../tools/jwtLogic');
const regexLogic = require('../tools/regexLogic');

// JSON 格式化逻辑测试
describe('JSON Formatter Logic', () => {
  test('should format valid JSON correctly', () => {
    const input = '{"name":"test","age":30}';
    const expected = '{\n  "name": "test",\n  "age": 30\n}';
    
    const result = jsonLogic.formatJson(input, 2);
    expect(result).toBe(expected);
  });

  test('should handle empty JSON', () => {
    const input = '{}';
    const expected = '{}';
    
    const result = jsonLogic.formatJson(input, 2);
    expect(result).toBe(expected);
  });

  test('should throw error for invalid JSON', () => {
    const input = '{invalid json}';
    
    expect(() => jsonLogic.formatJson(input, 2)).toThrow();
  });

  test('should minify JSON correctly', () => {
    const input = '{ "name": "test", "age": 30 }';
    const expected = '{"name":"test","age":30}';
    
    const result = jsonLogic.minifyJson(input);
    expect(result).toBe(expected);
  });
});

// Base64 编解码逻辑测试
describe('Base64 Encoder Logic', () => {
  test('should encode Chinese text correctly', () => {
    const input = '你好，世界！';
    const result = base64Logic.encodeBase64(input);
    expect(result).toBeTruthy();
    expect(base64Logic.decodeBase64(result)).toBe(input);
  });

  test('should encode English text correctly', () => {
    const input = 'Hello, World!';
    const result = base64Logic.encodeBase64(input);
    expect(result).toBe('SGVsbG8sIFdvcmxkIQ==');
  });

  test('should decode valid Base64 correctly', () => {
    const input = 'SGVsbG8gV29ybGQh';
    const expected = 'Hello World!';
    const result = base64Logic.decodeBase64(input);
    expect(result).toBe(expected);
  });

  test('should throw error for invalid Base64', () => {
    const input = 'invalid-base64!!!';
    expect(() => base64Logic.decodeBase64(input)).toThrow();
  });
});

// URL 编解码逻辑测试
describe('URL Encoder Logic', () => {
  test('should encode Chinese text correctly', () => {
    const input = '你好，世界！';
    const result = urlLogic.encodeUrl(input);
    expect(result).toContain('%E4%BD%A0%E5%A5%BD');
  });

  test('should encode special characters correctly', () => {
    const input = 'a=b&c=d?e=f';
    const result = urlLogic.encodeUrl(input);
    expect(result).toContain('%3D');
  });

  test('should decode URL encoded text correctly', () => {
    const input = 'Hello%20World%21';
    const expected = 'Hello World!';
    const result = urlLogic.decodeUrl(input);
    expect(result).toBe(expected);
  });

  test('should handle empty string', () => {
    const input = '';
    expect(urlLogic.encodeUrl(input)).toBe('');
    expect(urlLogic.decodeUrl(input)).toBe('');
  });
});

// 颜色转换逻辑测试
describe('Color Converter Logic', () => {
  test('should convert hex to RGB correctly', () => {
    const hex = '#3b82f6';
    const expected = { r: 59, g: 130, b: 246 };
    const result = colorLogic.hexToRgb(hex);
    expect(result).toEqual(expected);
  });

  test('should convert RGB to hex correctly', () => {
    const rgb = { r: 255, g: 0, b: 0 };
    const expected = '#ff0000';
    const result = colorLogic.rgbToHex(rgb.r, rgb.g, rgb.b);
    expect(result).toBe(expected);
  });

  test('should convert RGB to HSL correctly', () => {
    const rgb = { r: 255, g: 0, b: 0 };
    const result = colorLogic.rgbToHsl(rgb.r, rgb.g, rgb.b);
    expect(result).toEqual({ h: 0, s: 100, l: 50 });
  });

  test('should convert HSL to RGB correctly', () => {
    const hsl = { h: 120, s: 100, l: 50 };
    const result = colorLogic.hslToRgb(hsl.h, hsl.s, hsl.l);
    expect(result).toEqual({ r: 0, g: 255, b: 0 });
  });

  test('should handle round-trip conversion', () => {
    const originalHex = '#ff6b6b';
    const rgb = colorLogic.hexToRgb(originalHex);
    const convertedHex = colorLogic.rgbToHex(rgb.r, rgb.g, rgb.b);
    expect(convertedHex.toLowerCase()).toBe(originalHex.toLowerCase());
  });
});

// 时间戳转换逻辑测试
describe('Timestamp Converter Logic', () => {
  test('should convert timestamp to date correctly', () => {
    const timestamp = 1609459200; // 2021-01-01 00:00:00 UTC
    const result = timestampLogic.timestampToDate(timestamp, 'seconds');
    expect(result.getUTCFullYear()).toBe(2021);
    expect(result.getUTCMonth()).toBe(0); // January is 0
    expect(result.getUTCDate()).toBe(1);
  });

  test('should convert milliseconds timestamp correctly', () => {
    const timestamp = 1609459200000; // 2021-01-01 00:00:00 UTC
    const result = timestampLogic.timestampToDate(timestamp, 'milliseconds');
    expect(result.getUTCFullYear()).toBe(2021);
    expect(result.getUTCMonth()).toBe(0);
    expect(result.getUTCDate()).toBe(1);
  });

  test('should convert date to timestamp correctly', () => {
    const date = new Date('2021-01-01T00:00:00Z');
    const result = timestampLogic.dateToTimestamp(date, 'seconds');
    expect(result).toBe(1609459200);
  });

  test('should handle current timestamp', () => {
    const now = new Date();
    const timestamp = timestampLogic.dateToTimestamp(now, 'seconds');
    const convertedBack = timestampLogic.timestampToDate(timestamp, 'seconds');
    // Allow for small time difference due to processing
    expect(Math.abs(now.getTime() - convertedBack.getTime())).toBeLessThan(1000);
  });
});

// FBA 计算逻辑测试
describe('FBA Calculator Logic', () => {
  test('should calculate profit correctly', () => {
    const inputs = {
      sellingPrice: 29.99,
      purchaseCost: 8.50,
      amazonCommission: 15,
      fbaFee: 3.45,
      shippingCost: 2.10,
      otherCost: 0.50
    };

    const result = fbaLogic.calculateFbaProfit(inputs);
    expect(result.profit).toBeCloseTo(10.94, 2); // 修复精度问题
    expect(result.profitMargin).toBeCloseTo(36.48, 2); // 修复精度问题
    expect(result.revenue).toBe(29.99);
  });

  test('should handle loss scenario', () => {
    const inputs = {
      sellingPrice: 10.00,
      purchaseCost: 8.00,
      amazonCommission: 20,
      fbaFee: 5.00,
      shippingCost: 3.00,
      otherCost: 1.00
    };

    const result = fbaLogic.calculateFbaProfit(inputs);
    // 预期损失：销售收入10 - 成本(8+2+5+3+1) = -9
    expect(result.profit).toBe(-9.00); // 修复期望值
    expect(result.profitMargin).toBe(-90); // 修复期望值
  });

  test('should validate inputs', () => {
    const inputs = {
      sellingPrice: -10, // Invalid negative price
      purchaseCost: 8.00,
      amazonCommission: 15,
      fbaFee: 3.45,
      shippingCost: 2.10,
      otherCost: 0.50
    };

    expect(() => fbaLogic.calculateFbaProfit(inputs)).toThrow('售价必须大于0');
  });
});

// COGS 计算逻辑测试
describe('COGS Calculator Logic', () => {
  test('should calculate COGS correctly', () => {
    const inputs = {
      beginningInventory: 15000,
      purchases: 25000,
      endingInventory: 12000
    };

    const result = cogsLogic.calculateCogs(inputs);
    expect(result.cogs).toBe(28000);
    expect(result.breakdown).toHaveLength(3);
  });

  test('should handle zero inventory scenario', () => {
    const inputs = {
      beginningInventory: 0,
      purchases: 10000,
      endingInventory: 0
    };

    const result = cogsLogic.calculateCogs(inputs);
    expect(result.cogs).toBe(10000);
  });

  test('should validate inputs', () => {
    const inputs = {
      beginningInventory: -1000, // Invalid negative
      purchases: 25000,
      endingInventory: 12000
    };

    expect(() => cogsLogic.calculateCogs(inputs)).toThrow('所有数值必须大于等于0');
  });
});

// JWT 解码逻辑测试
describe('JWT Decoder Logic', () => {
  test('should decode valid JWT correctly', () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    
    const result = jwtLogic.decodeJwt(token);
    expect(result.isValid).toBe(true);
    expect(result.header.alg).toBe('HS256');
    expect(result.header.typ).toBe('JWT');
    expect(result.payload.sub).toBe('1234567890');
    expect(result.payload.name).toBe('John Doe');
  });

  test('should handle invalid JWT format', () => {
    const token = 'invalid.format'; // 只有两个部分，应该抛出错误
    
    expect(() => jwtLogic.decodeJwt(token)).toThrow();
  });

  test('should validate JWT format', () => {
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const invalidToken = 'invalid.token.format';
    
    expect(jwtLogic.isValidJwtFormat(validToken)).toBe(true);
    expect(jwtLogic.isValidJwtFormat(invalidToken)).toBe(false);
  });
});

// 正则表达式测试逻辑
describe('Regex Tester Logic', () => {
  test('should find email matches correctly', () => {
    const pattern = '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b';
    const text = 'Contact us at user@example.com or admin@test.org';
    const flags = 'g';
    
    const result = regexLogic.testRegex(pattern, text, flags);
    expect(result.matches).toHaveLength(2);
    expect(result.matches[0]).toBe('user@example.com');
    expect(result.matches[1]).toBe('admin@test.org');
  });

  test('should handle regex syntax errors', () => {
    const pattern = '[invalid-regex';
    const text = 'test string';
    const flags = '';
    
    const result = regexLogic.testRegex(pattern, text, flags);
    expect(result.isValid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  test('should highlight matches correctly', () => {
    const text = 'The email is user@example.com for contact';
    const matches = [{ index: 0, match: 'user@example.com', position: 16 }];
    
    const result = regexLogic.highlightMatches(text, matches);
    expect(result).toContain('<mark');
    expect(result).toContain('user@example.com');
  });

  test('should handle no matches scenario', () => {
    const pattern = 'xyz123';
    const text = 'abc def ghi';
    const flags = '';
    
    const result = regexLogic.testRegex(pattern, text, flags);
    expect(result.matches).toHaveLength(0);
  });
});

module.exports = {
  // 导出测试函数供 Jest 使用
};