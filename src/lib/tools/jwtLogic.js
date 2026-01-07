// JWT 解码逻辑

/**
 * 解码 JWT Token
 * @param {string} jwtToken - JWT Token 字符串
 * @returns {object} 解码结果
 */
function decodeJwt(jwtToken) {
  if (typeof jwtToken !== 'string') {
    throw new Error('JWT Token 必须是字符串');
  }

  try {
    // JWT 格式验证
    const parts = jwtToken.trim().split('.');
    if (parts.length !== 3) {
      throw new Error('JWT 格式不正确');
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    const errors = [];

    // 解码 Header
    let header;
    try {
      const paddedHeader = headerB64 + '='.repeat((4 - headerB64.length % 4) % 4);
      const decodedHeader = atob(paddedHeader.replace(/-/g, '+').replace(/_/g, '/'));
      header = JSON.parse(decodedHeader);
    } catch (err) {
      errors.push('Header 解码失败');
      header = null;
    }

    // 解码 Payload
    let payload;
    try {
      const paddedPayload = payloadB64 + '='.repeat((4 - payloadB64.length % 4) % 4);
      const decodedPayload = atob(paddedPayload.replace(/-/g, '+').replace(/_/g, '/'));
      payload = JSON.parse(decodedPayload);
    } catch (err) {
      errors.push('Payload 解码失败');
      payload = null;
    }

    // 处理 Signature（保持原始格式）
    const signature = signatureB64;

    // 检查过期时间
    if (payload && payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (now > payload.exp) {
        errors.push('Token 已过期');
      } else {
        const timeLeft = payload.exp - now;
        const hoursLeft = Math.floor(timeLeft / 3600);
        const minutesLeft = Math.floor((timeLeft % 3600) / 60);
        if (hoursLeft > 0) {
          errors.push(`Token 还有 ${hoursLeft} 小时 ${minutesLeft} 分钟过期`);
        } else if (minutesLeft > 0) {
          errors.push(`Token 还有 ${minutesLeft} 分钟过期`);
        } else {
          errors.push('Token 即将过期');
        }
      }
    }

    // 检查未生效时间
    if (payload && payload.nbf) {
      const now = Math.floor(Date.now() / 1000);
      if (now < payload.nbf) {
        errors.push('Token 尚未生效');
      }
    }

    const decodedResult = {
      header,
      payload,
      signature,
      isValid: errors.filter(e => e.includes('失败')).length === 0,
      errors: errors.filter(e => !e.includes('失败') && !e.includes('过期'))
    };

    return decodedResult;
  } catch (err) {
    throw new Error('JWT 解析失败: ' + err.message);
  }
}

/**
 * 验证 JWT 格式
 * @param {string} jwtToken - JWT Token 字符串
 * @returns {boolean} 是否为有效 JWT 格式
 */
function isValidJwtFormat(jwtToken) {
  try {
    if (typeof jwtToken !== 'string') return false;
    
    const parts = jwtToken.trim().split('.');
    if (parts.length !== 3) return false;

    // 检查每段是否为有效的 Base64
    return parts.every(part => {
      try {
        const padded = part + '='.repeat((4 - part.length % 4) % 4);
        atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
        return true;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

/**
 * 获取 JWT 头部信息
 * @param {string} jwtToken - JWT Token 字符串
 * @returns {object|null} JWT 头部信息
 */
function getJwtHeader(jwtToken) {
  try {
    const parts = jwtToken.trim().split('.');
    if (parts.length !== 3) return null;

    const [headerB64] = parts;
    const paddedHeader = headerB64 + '='.repeat((4 - headerB64.length % 4) % 4);
    const decodedHeader = atob(paddedHeader.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodedHeader);
  } catch {
    return null;
  }
}

/**
 * 获取 JWT Payload 信息
 * @param {string} jwtToken - JWT Token 字符串
 * @returns {object|null} JWT Payload 信息
 */
function getJwtPayload(jwtToken) {
  try {
    const parts = jwtToken.trim().split('.');
    if (parts.length !== 3) return null;

    const [, payloadB64] = parts;
    const paddedPayload = payloadB64 + '='.repeat((4 - payloadB64.length % 4) % 4);
    const decodedPayload = atob(paddedPayload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodedPayload);
  } catch {
    return null;
  }
}

/**
 * 检查 JWT 是否已过期
 * @param {string} jwtToken - JWT Token 字符串
 * @returns {boolean|null} 是否已过期，null表示无法确定
 */
function isJwtExpired(jwtToken) {
  try {
    const payload = getJwtPayload(jwtToken);
    if (!payload || !payload.exp) return null;

    const now = Math.floor(Date.now() / 1000);
    return now > payload.exp;
  } catch {
    return null;
  }
}

/**
 * 获取 JWT 剩余有效时间
 * @param {string} jwtToken - JWT Token 字符串
 * @returns {object|null} 剩余时间信息
 */
function getJwtTimeRemaining(jwtToken) {
  try {
    const payload = getJwtPayload(jwtToken);
    if (!payload || !payload.exp) return null;

    const now = Math.floor(Date.now() / 1000);
    const timeLeft = payload.exp - now;

    if (timeLeft <= 0) {
      return {
        isExpired: true,
        secondsLeft: 0,
        formatted: '已过期'
      };
    }

    const days = Math.floor(timeLeft / (24 * 3600));
    const hours = Math.floor((timeLeft % (24 * 3600)) / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;

    let formatted;
    if (days > 0) {
      formatted = `${days}天${hours}小时`;
    } else if (hours > 0) {
      formatted = `${hours}小时${minutes}分钟`;
    } else if (minutes > 0) {
      formatted = `${minutes}分钟`;
    } else {
      formatted = `${seconds}秒`;
    }

    return {
      isExpired: false,
      secondsLeft: timeLeft,
      days,
      hours,
      minutes,
      seconds,
      formatted
    };
  } catch {
    return null;
  }
}

/**
 * 解析 JWT Claims
 * @param {string} jwtToken - JWT Token 字符串
 * @returns {object} Claims 解析结果
 */
function parseJwtClaims(jwtToken) {
  try {
    const payload = getJwtPayload(jwtToken);
    if (!payload) return {};

    const claims = {};

    // 标准 JWT claims
    const standardClaims = [
      { key: 'iss', label: 'Issuer', description: '发行者' },
      { key: 'sub', label: 'Subject', description: '主题' },
      { key: 'aud', label: 'Audience', description: '受众' },
      { key: 'exp', label: 'Expiration Time', description: '过期时间' },
      { key: 'nbf', label: 'Not Before', description: '生效时间' },
      { key: 'iat', label: 'Issued At', description: '签发时间' },
      { key: 'jti', label: 'JWT ID', description: 'JWT 唯一标识符' },
    ];

    standardClaims.forEach(({ key, label, description }) => {
      if (payload[key] !== undefined) {
        let value = payload[key];
        let displayValue = value;

        if (key === 'exp' || key === 'nbf' || key === 'iat') {
          const date = new Date(value * 1000);
          displayValue = {
            timestamp: value,
            date: date.toISOString(),
            formatted: date.toLocaleString('zh-CN')
          };
        }

        claims[key] = {
          label,
          description,
          value: displayValue,
          type: typeof value
        };
      }
    });

    // 自定义 Claims
    Object.keys(payload).forEach(key => {
      if (!standardClaims.some(claim => claim.key === key)) {
        claims[key] = {
          label: key,
          description: '自定义声明',
          value: payload[key],
          type: typeof payload[key]
        };
      }
    });

    return claims;
  } catch {
    return {};
  }
}

module.exports = {
  decodeJwt,
  isValidJwtFormat,
  getJwtHeader,
  getJwtPayload,
  isJwtExpired,
  getJwtTimeRemaining,
  parseJwtClaims
};