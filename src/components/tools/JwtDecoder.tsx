'use client';

import { useState, useCallback } from 'react';

interface JwtPart {
  header: any;
  payload: any;
  signature: string;
}

interface DecodedJwt extends JwtPart {
  isValid: boolean;
  errors: string[];
}

export function JwtDecoder() {
  const [token, setToken] = useState('');
  const [decoded, setDecoded] = useState<DecodedJwt | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'header' | 'payload' | 'signature'>('header');

  const decodeJwt = useCallback(async (jwtToken: string) => {
    setError('');
    setDecoded(null);

    if (!jwtToken.trim()) {
      setError('请输入 JWT Token');
      return;
    }

    try {
      // JWT 格式验证
      const parts = jwtToken.trim().split('.');
      if (parts.length !== 3) {
        setError('JWT 格式不正确，应包含 header.payload.signature 三段');
        return;
      }

      const [headerB64, payloadB64, signatureB64] = parts;
      const errors: string[] = [];

      // 解码 Header
      let header: any;
      try {
        // 添加必要的 padding
        const paddedHeader = headerB64 + '='.repeat((4 - headerB64.length % 4) % 4);
        const decodedHeader = atob(paddedHeader.replace(/-/g, '+').replace(/_/g, '/'));
        header = JSON.parse(decodedHeader);
      } catch (err) {
        errors.push('Header 解码失败');
        header = null;
      }

      // 解码 Payload
      let payload: any;
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

      const decodedResult: DecodedJwt = {
        header,
        payload,
        signature,
        isValid: errors.filter(e => e.includes('失败')).length === 0,
        errors: errors.filter(e => !e.includes('失败') && !e.includes('过期'))
      };

      setDecoded(decodedResult);
    } catch (err) {
      setError('JWT 解析失败，请检查 Token 格式');
    }
  }, []);

  const formatJson = (obj: any) => {
    if (!obj) return '{}';
    return JSON.stringify(obj, null, 2);
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return '';
    return new Date(timestamp * 1000).toLocaleString('zh-CN');
  };

  const getTimeUntilExpiry = (exp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = exp - now;
    
    if (diff <= 0) return '已过期';
    
    const days = Math.floor(diff / (24 * 3600));
    const hours = Math.floor((diff % (24 * 3600)) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    
    if (days > 0) return `${days}天${hours}小时`;
    if (hours > 0) return `${hours}小时${minutes}分钟`;
    return `${minutes}分钟`;
  };

  const renderJsonContent = (obj: any) => {
    if (!obj) return '{}';
    
    return formatJson(obj).split('\n').map((line, index) => {
      const isKey = line.includes('"') && line.includes(':');
      const isString = line.includes('"') && !line.includes(':');
      
      let className = 'text-gray-900';
      if (line.trim().startsWith('{') || line.trim().startsWith('}')) {
        className = 'text-gray-700 font-semibold';
      } else if (isKey) {
        className = 'text-blue-600';
      } else if (isString) {
        className = 'text-green-600';
      } else if (!isKey && !isString && line.trim()) {
        className = 'text-orange-600';
      }
      
      return (
        <div key={index} className={className}>
          {line}
        </div>
      );
    });
  };

  const getClaimsInfo = () => {
    if (!decoded?.payload) return [];
    
    const claims = [];
    
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
      if (decoded.payload[key] !== undefined) {
        let value = decoded.payload[key];
        let displayValue = value;
        
        if (key === 'exp' || key === 'nbf' || key === 'iat') {
          displayValue = `${formatDate(value)} (${getTimeUntilExpiry(value)})`;
        }
        
        claims.push({
          key,
          label,
          description,
          value: displayValue,
          type: typeof value
        });
      }
    });
    
    return claims;
  };

  return (
    <div className="space-y-6">
      {/* 输入区域 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            JWT Token
          </label>
          <button
            onClick={() => {
              const example = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
              setToken(example);
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            示例
          </button>
        </div>
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="在此粘贴 JWT Token..."
          className="textarea w-full"
          rows={3}
        />
      </div>

      {/* 操作按钮 */}
      <div className="flex space-x-4">
        <button
          onClick={() => decodeJwt(token)}
          className="btn-primary flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>解码 Token</span>
        </button>
        <button
          onClick={() => {
            setToken('');
            setDecoded(null);
            setError('');
          }}
          className="btn-secondary"
        >
          清空
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* 解码结果 */}
      {decoded && (
        <div className="space-y-6">
          {/* 状态概览 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${decoded.isValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div>
                  <h4 className="font-semibold text-gray-900">格式状态</h4>
                  <p className="text-sm text-gray-600">
                    {decoded.isValid ? '格式正确' : '格式错误'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Token 状态</h4>
              {decoded.payload?.exp && (
                <p className="text-sm text-gray-600">
                  {decoded.errors.length > 0 ? decoded.errors[0] : 'Token 有效'}
                </p>
              )}
            </div>
            
            <div className="bg-white rounded-lg border p-4">
              <h4 className="font-semibold text-gray-900 mb-2">算法信息</h4>
              <p className="text-sm text-gray-600">
                {decoded.header?.alg || '未知'} / {decoded.header?.typ || '未知'}
              </p>
            </div>
          </div>

          {/* JWT Claims 信息 */}
          {decoded.payload && getClaimsInfo().length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">标准 JWT Claims</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {getClaimsInfo().map((claim) => (
                  <div key={claim.key} className="bg-white rounded p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-gray-900 text-sm">{claim.label}</span>
                      <span className="text-xs text-gray-500">{claim.type}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{claim.description}</p>
                    <p className="text-sm text-gray-800 break-all">{String(claim.value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* JWT 内容标签页 */}
          <div className="bg-white rounded-lg border">
            <div className="border-b border-gray-200">
              <nav className="flex">
                {[
                  { key: 'header', label: 'Header', icon: '📄' },
                  { key: 'payload', label: 'Payload', icon: '📦' },
                  { key: 'signature', label: 'Signature', icon: '🔐' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
            
            <div className="p-6">
              {activeTab === 'header' && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Header</h4>
                  <div className="bg-gray-100 rounded p-4 font-mono text-sm max-h-64 overflow-y-auto">
                    {renderJsonContent(decoded.header)}
                  </div>
                </div>
              )}
              
              {activeTab === 'payload' && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Payload</h4>
                  <div className="bg-gray-100 rounded p-4 font-mono text-sm max-h-64 overflow-y-auto">
                    {renderJsonContent(decoded.payload)}
                  </div>
                </div>
              )}
              
              {activeTab === 'signature' && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Signature</h4>
                  <div className="bg-gray-100 rounded p-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Signature 用于验证 Token 的完整性。此工具不验证签名，仅解码内容。
                    </p>
                    <code className="block text-sm break-all text-gray-800">
                      {decoded.signature}
                    </code>
                    <p className="text-xs text-gray-500 mt-2">
                      长度: {decoded.signature.length} 字符
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 安全提示 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              安全提示
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>本工具仅在浏览器本地解析 Token，不会上传到服务器</li>
                <li>请勿在生产环境中使用此工具处理敏感 Token</li>
                <li>此工具不验证 Token 的签名，仅解码 Base64 内容</li>
                <li>处理完成后请及时清除浏览器缓存</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">使用说明</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• JWT Token 由三部分组成：Header.Payload.Signature</li>
          <li>• Header 包含算法和 Token 类型信息</li>
          <li>• Payload 包含声明和用户信息</li>
          <li>• Signature 用于验证 Token 的完整性</li>
          <li>• 此工具仅解码内容，不验证签名</li>
        </ul>
      </div>
    </div>
  );
}