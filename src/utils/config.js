const DEFAULT_CONFIG = {
  targetUrl: 'http://example.com/*',

  selectors: ['li', '.list-item', '[data-item]'],

  interceptUrls: ['https://jsonplaceholder.typicode.com/posts/1'],

  logLevel: 'INFO',
  logToConsole: true,
  logToStorage: true,
  maxLogCount: 1000,

  storageKeys: {
    CONFIG: 'ext_config',
    LATEST_REQUEST: 'latest_intercepted_request',
    REQUEST_HISTORY: 'request_history',
    LAST_SENT_REQUEST: 'last_sent_request',
    LOGS: 'extension_logs',
  },
};

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function deepMerge(base, patch) {
  if (!patch || typeof patch !== 'object') return base;
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (Array.isArray(v)) {
      out[k] = [...v];
      continue;
    }
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = deepMerge(out[k] && typeof out[k] === 'object' ? out[k] : {}, v);
      continue;
    }
    out[k] = v;
  }
  return out;
}

function canUseLocalStorage() {
  try {
    return (
      typeof localStorage !== 'undefined' &&
      typeof location !== 'undefined' &&
      location.protocol === 'chrome-extension:'
    );
  } catch {
    return false;
  }
}

async function chromeStorageGet(key) {
  const storage = globalThis.chrome?.storage?.local;
  if (!storage) return undefined;
  const result = await storage.get(key);
  return result[key];
}

async function chromeStorageSet(key, value) {
  const storage = globalThis.chrome?.storage?.local;
  if (!storage) return;
  await storage.set({ [key]: value });
}

async function chromeStorageRemove(key) {
  const storage = globalThis.chrome?.storage?.local;
  if (!storage) return;
  await storage.remove(key);
}

function normalizeLines(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((s) => String(s).trim())
      .filter(Boolean);
  }
  return String(value)
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function isValidLogLevel(level) {
  return ['DEBUG', 'INFO', 'WARN', 'ERROR'].includes(level);
}

function isValidUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidMatchPattern(pattern) {
  if (typeof pattern !== 'string' || !pattern.includes('://')) return false;
  const [scheme, rest] = pattern.split('://');
  if (!['http', 'https', '*'].includes(scheme)) return false;
  if (!rest.includes('/')) return false;
  const [host] = rest.split('/');
  if (!host) return false;
  if (host !== '*' && !/^(\*\.)?[^*]+$/.test(host)) return false;
  return true;
}

function validateSelectors(selectors) {
  const list = normalizeLines(selectors);
  if (typeof document === 'undefined') return list;

  return list.filter((sel) => {
    try {
      document.querySelector(sel);
      return true;
    } catch {
      return false;
    }
  });
}

function validateConfig(config) {
  const validated = deepClone(config);

  if (!isValidMatchPattern(validated.targetUrl)) {
    validated.targetUrl = DEFAULT_CONFIG.targetUrl;
  }

  validated.selectors = validateSelectors(validated.selectors);

  validated.interceptUrls = normalizeLines(validated.interceptUrls).filter((u) => {
    if (u.includes('*')) return true;
    return isValidUrl(u);
  });

  if (!isValidLogLevel(validated.logLevel)) {
    validated.logLevel = DEFAULT_CONFIG.logLevel;
  }

  validated.logToConsole = Boolean(validated.logToConsole);
  validated.logToStorage = Boolean(validated.logToStorage);

  const max = Number(validated.maxLogCount);
  validated.maxLogCount = Number.isFinite(max) && max > 0 ? Math.floor(max) : 1000;

  validated.storageKeys = deepMerge(DEFAULT_CONFIG.storageKeys, validated.storageKeys);

  return validated;
}

let _cachedConfig;
let _loadPromise;

export function getDefaultConfig() {
  return deepClone(DEFAULT_CONFIG);
}

export async function loadConfig({ forceReload = false } = {}) {
  if (_cachedConfig && !forceReload) return _cachedConfig;
  if (_loadPromise) return _loadPromise;

  _loadPromise = (async () => {
    const base = getDefaultConfig();

    const manifestConfig = (() => {
      try {
        const manifest = globalThis.chrome?.runtime?.getManifest?.();
        return manifest?.config || manifest?.ext_config || undefined;
      } catch {
        return undefined;
      }
    })();

    let stored;
    const configKey = base.storageKeys.CONFIG;

    if (canUseLocalStorage()) {
      try {
        const raw = localStorage.getItem(configKey);
        stored = raw ? JSON.parse(raw) : undefined;
      } catch {
        stored = undefined;
      }
    }

    if (!stored) {
      try {
        stored = await chromeStorageGet(configKey);
      } catch {
        stored = undefined;
      }
    }

    let merged = deepMerge(base, manifestConfig);
    merged = deepMerge(merged, stored);

    _cachedConfig = validateConfig(merged);

    if (canUseLocalStorage()) {
      try {
        localStorage.setItem(configKey, JSON.stringify(_cachedConfig));
      } catch {
        // ignore
      }
    }

    try {
      await chromeStorageSet(configKey, _cachedConfig);
    } catch {
      // ignore
    }

    _loadPromise = undefined;
    return _cachedConfig;
  })();

  return _loadPromise;
}

export async function saveConfig(key, value) {
  const current = await loadConfig({ forceReload: false });
  const next = validateConfig({ ...current, [key]: value });

  const configKey = next.storageKeys.CONFIG;

  if (canUseLocalStorage()) {
    try {
      localStorage.setItem(configKey, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  try {
    await chromeStorageSet(configKey, next);
  } catch {
    // ignore
  }

  _cachedConfig = next;
  return next;
}

export async function resetConfig() {
  const base = getDefaultConfig();
  const configKey = base.storageKeys.CONFIG;

  if (canUseLocalStorage()) {
    try {
      localStorage.setItem(configKey, JSON.stringify(base));
    } catch {
      // ignore
    }
  }

  try {
    await chromeStorageSet(configKey, base);
  } catch {
    // ignore
  }

  _cachedConfig = validateConfig(base);
  return _cachedConfig;
}

export async function getSelectors() {
  const config = await loadConfig();
  return config.selectors;
}

export async function setSelectors(arrayOrLines) {
  return saveConfig('selectors', validateSelectors(arrayOrLines));
}

export async function getInterceptUrls() {
  const config = await loadConfig();
  return config.interceptUrls;
}

export async function setInterceptUrls(arrayOrLines) {
  return saveConfig('interceptUrls', normalizeLines(arrayOrLines));
}

export async function exportConfig() {
  return loadConfig();
}

export async function importConfig(configStr) {
  let parsed;
  try {
    parsed = typeof configStr === 'string' ? JSON.parse(configStr) : configStr;
  } catch {
    throw new Error('配置导入失败：JSON 格式无效');
  }

  const base = await loadConfig();
  const next = validateConfig(deepMerge(base, parsed));
  const configKey = next.storageKeys.CONFIG;

  if (canUseLocalStorage()) {
    try {
      localStorage.setItem(configKey, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  try {
    await chromeStorageSet(configKey, next);
  } catch {
    // ignore
  }

  _cachedConfig = next;
  return next;
}

export default {
  DEFAULT_CONFIG,
  getDefaultConfig,
  loadConfig,
  saveConfig,
  resetConfig,
  getSelectors,
  setSelectors,
  getInterceptUrls,
  setInterceptUrls,
  exportConfig,
  importConfig,
};
