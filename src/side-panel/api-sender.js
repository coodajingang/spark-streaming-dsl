import { getLogger } from '../utils/logger.js';

const logger = getLogger('ApiSender');

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function summarize(data) {
  if (data == null) return { type: 'empty' };
  if (typeof data === 'string') return { type: 'string', length: data.length };
  if (Array.isArray(data)) return { type: 'array', length: data.length };
  if (typeof data === 'object') return { type: 'object', keys: Object.keys(data).slice(0, 20) };
  return { type: typeof data };
}

async function directFetch({ url, method, body }) {
  const startedAt = Date.now();

  const headers = {};
  let payloadBody = body;

  if (method === 'POST' && typeof body === 'string' && body.trim()) {
    headers['content-type'] = 'application/json';
    payloadBody = body;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: method === 'POST' ? payloadBody : undefined,
  });

  const text = await res.text();

  return {
    ok: res.ok,
    status: res.status,
    statusText: res.statusText,
    bodyText: text,
    bodySize: text.length,
    durationMs: Date.now() - startedAt,
  };
}

async function proxyFetch({ url, method, body }) {
  const response = await chrome.runtime.sendMessage({
    type: 'proxyRequest',
    payload: {
      url,
      method,
      headers: method === 'POST' ? { 'content-type': 'application/json' } : {},
      body: method === 'POST' ? body : undefined,
    },
  });

  if (!response?.ok) {
    throw new Error(response?.error || 'proxyRequest failed');
  }

  return {
    ok: response.result.ok,
    status: response.result.status,
    statusText: response.result.statusText,
    bodyText: response.result.body,
    bodySize: response.result.bodySize,
    durationMs: response.result.durationMs,
    via: 'service-worker',
  };
}

export async function sendRequest({ url, method = 'GET', body = '' } = {}) {
  const upperMethod = String(method).toUpperCase();

  void logger.info(`发送 ${upperMethod} 请求`, { url });

  try {
    void logger.debug('请求开始', { url, method: upperMethod });
    const result = await directFetch({ url, method: upperMethod, body });

    const json = tryParseJson(result.bodyText);
    const data = json ?? result.bodyText;

    void logger.info('响应接收', {
      url,
      status: result.status,
      bodySize: result.bodySize,
      summary: summarize(data),
    });

    return { ...result, data, via: 'direct' };
  } catch (err) {
    void logger.warn('直接发送失败，尝试 Service Worker 代理', { error: String(err) });

    try {
      const result = await proxyFetch({ url, method: upperMethod, body });
      const json = tryParseJson(result.bodyText);
      const data = json ?? result.bodyText;

      void logger.info('响应接收（代理）', {
        url,
        status: result.status,
        bodySize: result.bodySize,
        summary: summarize(data),
      });

      return { ...result, data };
    } catch (proxyErr) {
      void logger.error('请求失败', { error: String(proxyErr) });
      throw proxyErr;
    }
  }
}

export const sendGet = (url) => sendRequest({ url, method: 'GET' });
export const sendPost = (url, body) => sendRequest({ url, method: 'POST', body });

export default { sendRequest, sendGet, sendPost };
