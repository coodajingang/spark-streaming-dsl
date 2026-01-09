(async () => {
  const loggerMod = await import(chrome.runtime.getURL('src/utils/logger.js'));
  const configMod = await import(chrome.runtime.getURL('src/utils/config.js'));
  const elementMod = await import(chrome.runtime.getURL('src/element-detector.js'));
  const interceptorMod = await import(chrome.runtime.getURL('src/request-interceptor.js'));

  const logManager = loggerMod.default;
  const logger = loggerMod.getLogger('ContentScript');

  const { loadConfig } = configMod;
  const { ElementDetector } = elementMod;
  const { RequestInterceptor } = interceptorMod;

  let detector;
  let interceptor;

  function urlMatchesTarget(url, pattern) {
    if (!pattern || typeof pattern !== 'string') return true;
    if (!pattern.includes('://')) return true;

    try {
      const [scheme, rest] = pattern.split('://');
      const [hostPattern, ...pathParts] = rest.split('/');
      const pathPattern = `/${pathParts.join('/')}`;

      const u = new URL(url);

      if (scheme !== '*' && u.protocol !== `${scheme}:`) return false;

      const host = u.host;
      if (hostPattern === '*') {
        // ok
      } else if (hostPattern.startsWith('*.')) {
        const suffix = hostPattern.slice(1);
        if (!host.endsWith(suffix)) return false;
      } else if (host !== hostPattern) {
        return false;
      }

      const pathRegex = new RegExp(
        '^' +
          pathPattern
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            .replace(/\\\*/g, '.*') +
          '$',
      );

      return pathRegex.test(u.pathname + u.search);
    } catch {
      return true;
    }
  }

  async function applyConfigToLogger(config) {
    try {
      logManager.setLogLevel(config.logLevel);
      logManager.enableConsole(config.logToConsole);
      logManager.enableStorage(config.logToStorage);
      logManager.setMaxLogCount(config.maxLogCount);
    } catch {
      // ignore
    }
  }

  async function init() {
    void logger.info('Content Script 已加载');

    try {
      const config = await loadConfig();
      await applyConfigToLogger(config);

      if (!urlMatchesTarget(window.location.href, config.targetUrl)) {
        void logger.debug('当前页面不匹配 targetUrl，跳过初始化', {
          url: window.location.href,
          targetUrl: config.targetUrl,
        });
        return;
      }

      void logger.info('页面加载完成，开始扫描');

      detector = new ElementDetector({
        selectors: config.selectors,
        onDebugClick: async () => {
          try {
            await chrome.runtime.sendMessage({ type: 'openSidePanel' });
          } catch (err) {
            void logger.error('打开 Side Panel 失败', { error: String(err) });
          }
        },
      });

      const stats = detector.start();
      void logger.info('检测到 N 个匹配元素', { count: stats?.matchedCount ?? 0 });
      void logger.info('为元素添加调试按钮', { added: stats?.addedCount ?? 0 });

      void logger.info('监听 DOM 变化');

      interceptor = new RequestInterceptor({ interceptUrls: config.interceptUrls });
      await interceptor.start();
    } catch (err) {
      void logger.error('Content Script 初始化失败', { error: String(err) });
    }
  }

  async function reloadWithConfig() {
    try {
      const config = await loadConfig({ forceReload: true });
      await applyConfigToLogger(config);

      detector?.stop();
      interceptor?.stop();

      detector = new ElementDetector({
        selectors: config.selectors,
        onDebugClick: async () => {
          try {
            await chrome.runtime.sendMessage({ type: 'openSidePanel' });
          } catch (err) {
            void logger.error('打开 Side Panel 失败', { error: String(err) });
          }
        },
      });

      const stats = detector.start();
      void logger.info('检测到 N 个匹配元素', { count: stats?.matchedCount ?? 0 });
      void logger.info('为元素添加调试按钮', { added: stats?.addedCount ?? 0 });

      interceptor = new RequestInterceptor({ interceptUrls: config.interceptUrls });
      await interceptor.start();

      void logger.info('配置已更新并重新初始化', {
        selectors: config.selectors,
        interceptUrls: config.interceptUrls,
        logLevel: config.logLevel,
      });
    } catch (err) {
      void logger.error('配置更新后重新初始化失败', { error: String(err) });
    }
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === 'configUpdated') {
      void reloadWithConfig();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => void init());
  } else {
    void init();
  }
})();
