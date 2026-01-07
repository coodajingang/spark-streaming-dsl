// 正则表达式测试逻辑

/**
 * 测试正则表达式
 * @param {string} pattern - 正则表达式模式
 * @param {string} text - 测试文本
 * @param {string} flags - 正则标志
 * @returns {object} 测试结果
 */
function testRegex(pattern, text, flags = '') {
  if (typeof pattern !== 'string' || typeof text !== 'string') {
    throw new Error('模式和文本必须是字符串');
  }

  try {
    // 验证正则表达式
    let regex;
    try {
      regex = new RegExp(pattern, flags);
    } catch (regexError) {
      throw new Error(`正则表达式语法错误：${regexError.message}`);
    }

    const results = [];
    let match;
    let matchCount = 0;

    if (flags.includes('g')) {
      // 全局匹配
      while ((match = regex.exec(text)) !== null && matchCount < 1000) {
        results.push({
          index: matchCount,
          match: match[0],
          groups: match,
          position: match.index
        });
        matchCount++;
        
        // 防止无限循环
        if (match[0] === '') {
          regex.lastIndex++;
        }
      }
    } else {
      // 单次匹配
      match = regex.exec(text);
      if (match) {
        results.push({
          index: 0,
          match: match[0],
          groups: match,
          position: match.index
        });
      }
    }

    return {
      matches: results.map(r => r.match),
      results,
      totalMatches: results.length,
      isValid: true,
      error: null
    };
  } catch (err) {
    return {
      matches: [],
      results: [],
      totalMatches: 0,
      isValid: false,
      error: err.message
    };
  }
}

/**
 * 高亮匹配文本
 * @param {string} text - 原始文本
 * @param {Array} matches - 匹配结果数组
 * @returns {string} 高亮后的HTML字符串
 */
function highlightMatches(text, matches) {
  if (typeof text !== 'string' || !Array.isArray(matches)) {
    return text;
  }

  if (matches.length === 0) {
    return text;
  }

  let highlighted = '';
  let lastIndex = 0;
  
  matches.forEach((result, index) => {
    // 添加匹配前的文本
    highlighted += text.slice(lastIndex, result.position);
    // 添加高亮的匹配文本
    highlighted += `<mark class="bg-yellow-200 px-1 rounded">${result.match}</mark>`;
    lastIndex = result.position + result.match.length;
  });
  
  // 添加剩余文本
  highlighted += text.slice(lastIndex);
  return highlighted;
}

/**
 * 验证正则表达式语法
 * @param {string} pattern - 正则表达式模式
 * @param {string} flags - 正则标志
 * @returns {object} 验证结果
 */
function validateRegex(pattern, flags = '') {
  try {
    new RegExp(pattern, flags);
    return {
      isValid: true,
      error: null
    };
  } catch (err) {
    return {
      isValid: false,
      error: err.message
    };
  }
}

/**
 * 获取常用正则表达式模板
 * @returns {object} 常用模板
 */
function getCommonPatterns() {
  return {
    '邮箱地址': {
      pattern: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b',
      flags: 'gi',
      description: '匹配标准邮箱格式'
    },
    '手机号码': {
      pattern: '^1[3-9]\\d{9}$',
      flags: '',
      description: '匹配中国大陆手机号码'
    },
    '身份证号': {
      pattern: '^[1-9]\\d{5}(18|19|([23]\\d))\\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\\d{3}[0-9Xx]$',
      flags: '',
      description: '匹配中国大陆身份证号码'
    },
    'URL地址': {
      pattern: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)',
      flags: 'gi',
      description: '匹配HTTP/HTTPS URL'
    },
    'IP地址': {
      pattern: '^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$',
      flags: '',
      description: '匹配IPv4地址'
    },
    '日期格式': {
      pattern: '^\\d{4}-\\d{2}-\\d{2}$',
      flags: '',
      description: '匹配YYYY-MM-DD格式日期'
    },
    '时间格式': {
      pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$',
      flags: '',
      description: '匹配HH:mm或HH:mm:ss格式时间'
    },
    '中文字符': {
      pattern: '[一-鿿]',
      flags: 'u',
      description: '匹配中文字符'
    },
    '数字': {
      pattern: '\\d+',
      flags: 'g',
      description: '匹配一个或多个数字'
    },
    '空白字符': {
      pattern: '\\s+',
      flags: 'g',
      description: '匹配一个或多个空白字符'
    }
  };
}

/**
 * 生成不同语言的正则表达式代码
 * @param {string} pattern - 正则表达式模式
 * @param {string} flags - 正则标志
 * @param {string} language - 目标语言
 * @returns {string} 代码字符串
 */
function generateCode(pattern, flags, language = 'javascript') {
  const escapeText = (text) => {
    if (language === 'javascript') {
      return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    }
    return text;
  };

  switch (language) {
    case 'javascript':
      return `// JavaScript
const regex = /${pattern}/${flags};
const matches = text.match(regex);
if (matches) {
  console.log('找到匹配:', matches);
}`;

    case 'python':
      return `# Python
import re
pattern = r"${escapeText(pattern)}"
flags = ${flags ? `re.${flags.split('').map(f => {
  const flagMap = { i: 'IGNORECASE', g: '0', m: 'MULTILINE', s: 'DOTALL', u: 'UNICODE', y: '0' };
  return flagMap[f] || '0';
}).filter(f => f !== '0').join(' | re.') || '0'}` : '0'}
matches = re.findall(pattern, text${flags ? `, flags=${flags}` : ''})
print(f"找到匹配: {matches}")`;

    case 'go':
      return `// Go
package main

import (
  "fmt"
  "regexp"
)

func main() {
  pattern := "${escapeText(pattern)}"
  flags := "${flags}"
  
  r := regexp.MustCompile(pattern)
  matches := r.FindAllString(text, -1)
  fmt.Printf("找到匹配: %v\\n", matches)
}`;

    default:
      return '// 不支持的语言';
  }
}

/**
 * 计算匹配统计信息
 * @param {Array} results - 匹配结果数组
 * @returns {object} 统计信息
 */
function getMatchStats(results) {
  if (!Array.isArray(results) || results.length === 0) {
    return {
      totalMatches: 0,
      averageLength: 0,
      shortestMatch: null,
      longestMatch: null,
      uniqueMatches: 0
    };
  }

  const matches = results.map(r => r.match);
  const uniqueMatches = [...new Set(matches)];
  const lengths = matches.map(m => m.length);

  return {
    totalMatches: matches.length,
    averageLength: lengths.reduce((sum, len) => sum + len, 0) / lengths.length,
    shortestMatch: Math.min(...lengths),
    longestMatch: Math.max(...lengths),
    uniqueMatches: uniqueMatches.length
  };
}

module.exports = {
  testRegex,
  highlightMatches,
  validateRegex,
  getCommonPatterns,
  generateCode,
  getMatchStats
};