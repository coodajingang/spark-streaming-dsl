import { getLogger } from './utils/logger.js';
import { loadConfig } from './utils/config.js';

const logger = getLogger('RequestInterceptor');

const POST_MESSAGE_SOURCE = 'EXT_REQUEST_INTERCEPTOR';

function toRegexFromWildcard(pattern) {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped.replace(/\\\*/g, '.*')}$`);
}

function truncateString(str, maxLen = 2000) {
  const s = typeof str === 'string' ? str : String(str ?? '');
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen)}...[truncated ${s.length - maxLen}]`;
}

function serializeHeaders(headers) {
  const out = {};
  try {
    if (headers instanceof Headers) {
      headers.forEach((v, k) => {
        out[k] = v;
      });
      return out;
    }

    if (Array.isArray(headers)) {
      for (const [k, v] of headers) out[k] = v;
      return out;
    }

    if (headers && typeof headers === 'object') return { ...headers };
  } catch {
    // ignore
  }
  return out;
}

function buildInjectedScript(interceptUrls) {
  const patterns = (interceptUrls || []).filter(Boolean);

  return `(() => {
    const SOURCE = ${JSON.stringify(POST_MESSAGE_SOURCE)};
    const GLOBAL_KEY = '__EXT_REQUEST_INTERCEPTOR__';
    const PATTERNS = ${JSON.stringify(patterns)};

    function toRegex(pattern) {
      const escaped = pattern.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
      return new RegExp('^' + escaped.replace(/\\\\\*/g, '.*') + '$');
    }

    function compile(patterns) {
      const clean = (patterns || []).filter(Boolean);
      const fixed = clean.filter((p) => !String(p).includes('*'));
      const wildcardRegexes = clean
        .filter((p) => String(p).includes('*'))
        .map((p) => toRegex(String(p)));
      return { fixed, wildcardRegexes };
    }

    function headersToObject(headers) {
      const out = {};
      if (!headers) return out;
      try {
        if (headers instanceof Headers) {
          headers.forEach((v, k) => (out[k] = v));
          return out;
        }
      } catch {}
      try {
        if (Array.isArray(headers)) {
          for (const [k, v] of headers) out[k] = v;
          return out;
        }
      } catch {}
      try {
        if (typeof headers === 'object') return { ...headers };
      } catch {}
      return out;
    }

    function post(payload) {
      window.postMessage({ source: SOURCE, type: 'INTERCEPTED', payload }, '*');
    }

    const api = window[GLOBAL_KEY] || {};

    api.setPatterns = function(patterns) {
      api._state = compile(patterns);
    };

    api.matches = function(url) {
      if (!api._state) api._state = compile([]);
      const u = String(url);
      if (api._state.fixed.includes(u)) return true;
      return api._state.wildcardRegexes.some((r) => r.test(u));
    };

    api.setPatterns(PATTERNS);
    window[GLOBAL_KEY] = api;

    if (api._installed) return;
    api._installed = true;

    let idSeq = 1;

    // Fetch
    const originalFetch = window.fetch;
    if (typeof originalFetch === 'function') {
      window.fetch = async function(input, init) {
        const requestId = String(idSeq++);

        try {
          const reqUrl = typeof input === 'string' ? input : input?.url;
          if (!reqUrl || !api.matches(reqUrl)) {
            return originalFetch.apply(this, arguments);
          }

          const method = (init?.method || (typeof input !== 'string' ? input?.method : 'GET') || 'GET').toUpperCase();
          const reqHeaders = headersToObject(init?.headers || (typeof input !== 'string' ? input?.headers : undefined));

          const startedAt = Date.now();
          const res = await originalFetch.apply(this, arguments);

          const clone = res.clone();
          let text = '';
          try {
            text = await clone.text();
          } catch {
            text = '';
          }

          const payload = {
            requestId,
            timestamp: new Date().toISOString(),
            request: {
              url: reqUrl,
              method,
              headers: reqHeaders,
              body: init?.body,
            },
            response: {
              status: res.status,
              statusText: res.statusText,
              headers: headersToObject(res.headers),
              bodySize: text.length,
              bodySnippet: text.slice(0, 2000),
              durationMs: Date.now() - startedAt,
            },
          };

          post(payload);
          return res;
        } catch {
          return originalFetch.apply(this, arguments);
        }
      };
    }

    // XHR
    const OriginalXHR = window.XMLHttpRequest;
    if (OriginalXHR) {
      function PatchedXHR() {
        const xhr = new OriginalXHR();

        let requestInfo = null;
        const originalOpen = xhr.open;
        const originalSend = xhr.send;
        const originalSetHeader = xhr.setRequestHeader;

        xhr.open = function(method, url) {
          try {
            const normalizedUrl = String(url);
            if (api.matches(normalizedUrl)) {
              requestInfo = {
                requestId: String(idSeq++),
                timestamp: new Date().toISOString(),
                request: {
                  url: normalizedUrl,
                  method: String(method || 'GET').toUpperCase(),
                  headers: {},
                  body: undefined,
                },
                startedAt: Date.now(),
              };
            }
          } catch {}

          return originalOpen.apply(xhr, arguments);
        };

        xhr.setRequestHeader = function(key, value) {
          try {
            if (requestInfo) requestInfo.request.headers[String(key).toLowerCase()] = String(value);
          } catch {}
          return originalSetHeader.apply(xhr, arguments);
        };

        xhr.send = function(body) {
          try {
            if (requestInfo) requestInfo.request.body = body;
          } catch {}

          xhr.addEventListener('loadend', () => {
            try {
              if (!requestInfo) return;
              const text = typeof xhr.responseText === 'string' ? xhr.responseText : '';

              const payload = {
                requestId: requestInfo.requestId,
                timestamp: requestInfo.timestamp,
                request: requestInfo.request,
                response: {
                  status: xhr.status,
                  statusText: xhr.statusText,
                  headers: {},
                  bodySize: text.length,
                  bodySnippet: text.slice(0, 2000),
                  durationMs: Date.now() - requestInfo.startedAt,
                },
              };

              post(payload);
            } catch {}
          });

          return originalSend.apply(xhr, arguments);
        };

        return xhr;
      }

      window.XMLHttpRequest = PatchedXHR;
    }
  })();`;
}

function saveToPageLocalStorage(keys, payload) {
  try {
    const latestKey = keys?.LATEST_REQUEST || 'latest_intercepted_request';
    const historyKey = keys?.REQUEST_HISTORY || 'request_history';

    localStorage.setItem(latestKey, JSON.stringify(payload));

    const raw = localStorage.getItem(historyKey);
    const list = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(list) ? list : [];
    next.push(payload);

    const trimmed = next.slice(-200);
    localStorage.setItem(historyKey, JSON.stringify(trimmed));

    void logger.info('数据保存到 localStorage', {
      latestKey,
      historyKey,
      count: trimmed.length,
    });
  } catch (e) {
    void logger.warn('保存到 localStorage 失败', { error: String(e) });
  }
}

export class RequestInterceptor {
  constructor({ interceptUrls = [] } = {}) {
    this.interceptUrls = interceptUrls;
    this._listener = null;
  }

  setInterceptUrls(interceptUrls) {
    this.interceptUrls = interceptUrls;
    if (this._listener) {
      this._inject();
    }
  }

  _inject() {
    const el = document.createElement('script');
    el.textContent = buildInjectedScript(this.interceptUrls);
    (document.head || document.documentElement).appendChild(el);
    el.remove();
  }

  async start() {
    void logger.info('请求拦截启动', { interceptUrls: this.interceptUrls });

    this._inject();

    if (this._listener) return;

    const config = await loadConfig();

    this._listener = async (event) => {
      if (event.source !== window) return;
      const data = event.data;
      if (!data || data.source !== POST_MESSAGE_SOURCE || data.type !== 'INTERCEPTED') return;

      const payload = data.payload;
      if (!payload?.request?.url) return;

      const url = String(payload.request.url);
      const patterns = this.interceptUrls || [];
      const shouldKeep = patterns.some((p) => {
        if (!p) return false;
        if (p.includes('*')) return toRegexFromWildcard(p).test(url);
        return url === p;
      });

      if (!shouldKeep) return;

      void logger.info('捕获请求', {
        url: payload.request.url,
        method: payload.request.method,
        headers: serializeHeaders(payload.request.headers),
      });

      void logger.info('捕获响应', {
        url: payload.request.url,
        status: payload.response?.status,
        headers: serializeHeaders(payload.response?.headers),
        bodySize: payload.response?.bodySize,
        bodySnippet: truncateString(payload.response?.bodySnippet, 300),
      });

      saveToPageLocalStorage(config.storageKeys, payload);

      try {
        await chrome.runtime.sendMessage({
          type: 'interceptedRequest',
          payload,
        });
        void logger.info('向 Service Worker 发送消息', { type: 'interceptedRequest' });
      } catch (err) {
        void logger.error('向 Service Worker 发送消息失败', { error: String(err) });
      }
    };

    window.addEventListener('message', this._listener);
  }

  stop() {
    if (!this._listener) return;
    window.removeEventListener('message', this._listener);
    this._listener = null;
  }
}

export default RequestInterceptor;
