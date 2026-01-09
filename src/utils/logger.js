const LEVELS = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
};

const LEVEL_COLORS = {
  DEBUG: '#9aa0a6',
  INFO: '#1a73e8',
  WARN: '#f9ab00',
  ERROR: '#d93025',
};

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatTimestamp(date) {
  const yyyy = date.getFullYear();
  const mm = pad2(date.getMonth() + 1);
  const dd = pad2(date.getDate());
  const hh = pad2(date.getHours());
  const mi = pad2(date.getMinutes());
  const ss = pad2(date.getSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
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

function isSensitiveKey(key) {
  return /(authorization|token|cookie|password|secret|api[-_]?key)/i.test(String(key));
}

function sanitize(value, seen = new WeakSet()) {
  if (value == null) return value;

  if (typeof value === 'string') {
    if (/^bearer\s+\S+/i.test(value)) return 'Bearer ***';
    return value;
  }

  if (typeof value !== 'object') return value;

  if (seen.has(value)) return '[Circular]';
  seen.add(value);

  if (Array.isArray(value)) return value.map((v) => sanitize(v, seen));

  const out = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = isSensitiveKey(k) ? '***' : sanitize(v, seen);
  }
  return out;
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

class LogManager {
  constructor({ storageKey = 'extension_logs', maxLogCount = 1000 } = {}) {
    this.storageKey = storageKey;
    this.maxLogCount = maxLogCount;

    this.level = 'INFO';
    this.consoleEnabled = true;
    this.storageEnabled = true;

    this.logs = [];
    this._ready = this._loadFromStorage();
  }

  get ready() {
    return this._ready;
  }

  async _loadFromStorage() {
    let localLogs;
    let chromeLogs;

    if (canUseLocalStorage()) {
      try {
        const raw = localStorage.getItem(this.storageKey);
        localLogs = raw ? JSON.parse(raw) : undefined;
      } catch {
        localLogs = undefined;
      }
    }

    try {
      chromeLogs = await chromeStorageGet(this.storageKey);
    } catch {
      chromeLogs = undefined;
    }

    const candidates = [];
    if (Array.isArray(chromeLogs)) candidates.push(chromeLogs);
    if (Array.isArray(localLogs)) candidates.push(localLogs);

    const best = candidates.sort((a, b) => b.length - a.length)[0];
    if (Array.isArray(best)) {
      this.logs = best.slice(-this.maxLogCount);

      if (canUseLocalStorage() && Array.isArray(chromeLogs) && best === chromeLogs) {
        try {
          localStorage.setItem(this.storageKey, JSON.stringify(this.logs));
        } catch {
          // ignore
        }
      }
    }
  }

  _shouldLog(level) {
    const threshold = LEVELS[this.level] ?? LEVELS.INFO;
    const current = LEVELS[level] ?? LEVELS.INFO;
    return current >= threshold;
  }

  _push(entry) {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogCount) {
      this.logs = this.logs.slice(-this.maxLogCount);
    }
  }

  async _persist() {
    if (!this.storageEnabled) return;

    const snapshot = this.logs.slice(-this.maxLogCount);

    if (canUseLocalStorage()) {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(snapshot));
      } catch {
        // ignore quota errors
      }
    }

    try {
      await chromeStorageSet(this.storageKey, snapshot);
    } catch {
      // ignore
    }
  }

  _printToConsole(entry) {
    if (!this.consoleEnabled) return;

    const style = `color:${LEVEL_COLORS[entry.level] || '#444'}; font-weight:600;`;
    const line = `[${entry.timestamp}] [${entry.level}] [${entry.module}] ${entry.message}`;

    const fn =
      entry.level === 'ERROR'
        ? console.error
        : entry.level === 'WARN'
          ? console.warn
          : entry.level === 'INFO'
            ? console.info
            : console.debug;

    fn.call(console, `%c${line}`, style);
    if (typeof entry.data !== 'undefined') {
      fn.call(console, `%c数据：`, style, entry.data);
    }
  }

  async _log(level, module, message, data) {
    if (!this._shouldLog(level)) return;

    const entry = {
      timestamp: formatTimestamp(new Date()),
      level,
      module: module || 'App',
      message: String(message ?? ''),
      data: typeof data === 'undefined' ? undefined : sanitize(data),
    };

    this._push(entry);
    this._printToConsole(entry);
    await this._persist();
  }

  debug(message, data, module = 'App') {
    return this._log('DEBUG', module, message, data);
  }

  info(message, data, module = 'App') {
    return this._log('INFO', module, message, data);
  }

  warn(message, data, module = 'App') {
    return this._log('WARN', module, message, data);
  }

  error(message, data, module = 'App') {
    return this._log('ERROR', module, message, data);
  }

  getLogs(filter = {}) {
    const normalizedFilter =
      typeof filter === 'string' ? { level: filter } : filter || {};

    const { level, module, search } = normalizedFilter;
    return this.logs.filter((l) => {
      if (level && l.level !== level) return false;
      if (module && l.module !== module) return false;
      if (search) {
        const text = `${l.message} ${JSON.stringify(l.data ?? '')}`;
        if (!text.toLowerCase().includes(String(search).toLowerCase())) return false;
      }
      return true;
    });
  }

  async clearLogs() {
    this.logs = [];

    if (canUseLocalStorage()) {
      try {
        localStorage.removeItem(this.storageKey);
      } catch {
        // ignore
      }
    }

    try {
      await chromeStorageRemove(this.storageKey);
    } catch {
      // ignore
    }
  }

  setLogLevel(level) {
    if (!LEVELS[level]) return;
    this.level = level;
  }

  enableConsole(bool) {
    this.consoleEnabled = Boolean(bool);
  }

  enableStorage(bool) {
    this.storageEnabled = Boolean(bool);
  }

  setMaxLogCount(count) {
    const n = Number(count);
    if (!Number.isFinite(n) || n <= 0) return;
    this.maxLogCount = Math.floor(n);
    if (this.logs.length > this.maxLogCount) {
      this.logs = this.logs.slice(-this.maxLogCount);
      void this._persist();
    }
  }

  exportLogs(format = 'json', filter = {}) {
    const logs = this.getLogs(filter);

    if (format === 'text') {
      return logs
        .map((l) => {
          const head = `[${l.timestamp}] [${l.level}] [${l.module}] ${l.message}`;
          if (typeof l.data === 'undefined') return head;
          return `${head}\n数据：${JSON.stringify(l.data)}`;
        })
        .join('\n');
    }

    return JSON.stringify(logs, null, 2);
  }

  getModuleLogger(module) {
    return {
      debug: (message, data) => this.debug(message, data, module),
      info: (message, data) => this.info(message, data, module),
      warn: (message, data) => this.warn(message, data, module),
      error: (message, data) => this.error(message, data, module),

      getLogs: (filter) => this.getLogs({ ...(filter || {}), module }),
      clearLogs: () => this.clearLogs(),

      setLogLevel: (level) => this.setLogLevel(level),
      enableConsole: (bool) => this.enableConsole(bool),
      enableStorage: (bool) => this.enableStorage(bool),
      setMaxLogCount: (count) => this.setMaxLogCount(count),
      exportLogs: (format, filter) =>
        this.exportLogs(format, { ...(filter || {}), module }),

      ready: this.ready,
    };
  }
}

const logManager = new LogManager();

export { LEVELS, LogManager };
export const getLogger = (moduleName) => logManager.getModuleLogger(moduleName);
export default logManager;
