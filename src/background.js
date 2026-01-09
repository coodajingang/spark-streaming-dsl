import logManager, { getLogger } from './utils/logger.js';
import { loadConfig } from './utils/config.js';
import {
  storeInterceptedRequest,
  getLatestInterceptedRequest,
  getRequestHistory,
  clearRequestHistory,
  storeLastSentRequest,
} from './request-handler.js';

const logger = getLogger('Background');

(async () => {
  try {
    const config = await loadConfig();
    logManager.setLogLevel(config.logLevel);
    logManager.enableConsole(config.logToConsole);
    logManager.enableStorage(config.logToStorage);
    logManager.setMaxLogCount(config.maxLogCount);
  } catch {
    // ignore
  }
})();

void logger.info('Service Worker 已启动');

async function openSidePanelForSender(sender) {
  const tabId = sender?.tab?.id;
  if (typeof tabId === 'number') {
    await chrome.sidePanel.open({ tabId });
    return;
  }

  const [active] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (active?.id) {
    await chrome.sidePanel.open({ tabId: active.id });
  }
}

async function proxyFetch({ url, method = 'GET', headers = {}, body } = {}) {
  const startedAt = Date.now();

  const res = await fetch(url, {
    method,
    headers,
    body: ['GET', 'HEAD'].includes(method?.toUpperCase?.() || 'GET') ? undefined : body,
  });

  const text = await res.text();
  const resHeaders = {};
  try {
    res.headers.forEach((v, k) => {
      resHeaders[k] = v;
    });
  } catch {
    // ignore
  }

  return {
    ok: res.ok,
    status: res.status,
    statusText: res.statusText,
    headers: resHeaders,
    body: text,
    bodySize: text.length,
    durationMs: Date.now() - startedAt,
  };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  void logger.debug('接收消息类型', { type: message?.type });

  (async () => {
    try {
      switch (message?.type) {
        case 'openSidePanel': {
          void logger.info('Side Panel 打开请求');
          await openSidePanelForSender(sender);
          sendResponse({ ok: true });
          return;
        }

        case 'interceptedRequest': {
          const payload = message.payload;
          await storeInterceptedRequest(payload);
          void logger.info('拦截数据已存储', {
            url: payload?.request?.url,
            status: payload?.response?.status,
          });

          try {
            await chrome.runtime.sendMessage({
              type: 'interceptedRequestUpdated',
              payload,
            });
            void logger.debug('通知 Side Panel 更新数据');
          } catch {
            // Side Panel might not be open.
          }

          sendResponse({ ok: true });
          return;
        }

        case 'getLatestRequest': {
          const latest = await getLatestInterceptedRequest();
          sendResponse({ ok: true, latest });
          return;
        }

        case 'getRequestHistory': {
          const history = await getRequestHistory();
          sendResponse({ ok: true, history });
          return;
        }

        case 'clearRequestHistory': {
          await clearRequestHistory();
          sendResponse({ ok: true });
          return;
        }

        case 'proxyRequest': {
          void logger.info('代理发送请求', {
            url: message?.payload?.url,
            method: message?.payload?.method,
          });

          const result = await proxyFetch(message.payload);
          await storeLastSentRequest({
            url: message?.payload?.url,
            method: message?.payload?.method,
            at: new Date().toISOString(),
          });

          sendResponse({ ok: true, result });
          return;
        }

        case 'configUpdated': {
          void logger.info('收到配置更新请求');

          const tabs = await chrome.tabs.query({});
          await Promise.all(
            tabs
              .filter((t) => typeof t.id === 'number')
              .map((t) =>
                chrome.tabs
                  .sendMessage(t.id, { type: 'configUpdated' })
                  .catch(() => undefined),
              ),
          );

          sendResponse({ ok: true });
          return;
        }

        default: {
          sendResponse({ ok: false, error: 'Unknown message type' });
        }
      }
    } catch (err) {
      void logger.error('消息处理失败', { error: String(err), message });
      sendResponse({ ok: false, error: String(err) });
    }
  })();

  return true;
});
