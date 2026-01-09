import logManager, { getLogger } from '../utils/logger.js';
import {
  loadConfig,
  saveConfig,
  resetConfig,
  exportConfig as exportConfigData,
} from '../utils/config.js';
import { sendRequest } from './api-sender.js';

const logger = getLogger('SidePanel');

function $(id) {
  return document.getElementById(id);
}

function downloadText(filename, content, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toLines(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatJson(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function setStatus(text) {
  const el = $('config-status');
  if (!el) return;
  el.textContent = text;
}

function setActiveTab(tab) {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  $('request-section').style.display = tab === 'request' ? 'block' : 'none';
  $('config-section').style.display = tab === 'config' ? 'block' : 'none';
  $('logs-section').style.display = tab === 'logs' ? 'block' : 'none';

  void logger.info('用户操作', { action: 'switchTab', tab });

  if (tab === 'logs') void refreshLogs();
  if (tab === 'request') void refreshRequests();
  if (tab === 'config') void loadConfigToForm();
}

async function applyConfigToLogger(config) {
  logManager.setLogLevel(config.logLevel);
  logManager.enableConsole(config.logToConsole);
  logManager.enableStorage(config.logToStorage);
  logManager.setMaxLogCount(config.maxLogCount);
}

async function refreshRequests() {
  try {
    void logger.info('加载拦截数据');

    const res = await chrome.runtime.sendMessage({ type: 'getLatestRequest' });
    const latest = res?.latest;

    $('latest-request').textContent = latest ? formatJson(latest) : '暂无数据';
  } catch (err) {
    $('latest-request').textContent = `加载失败：${String(err)}`;
    void logger.error('加载拦截数据失败', { error: String(err) });
  }
}

async function send(method) {
  const url = $('request-url-input').value.trim();
  const body = $('request-body-input').value;

  void logger.info('用户操作', { action: 'sendRequest', method, url });
  void logger.info('发送请求', { url, method });

  $('send-result').textContent = '发送中...';

  try {
    const result = await sendRequest({ url, method, body });
    $('send-result').textContent = formatJson(result);
    void logger.info('请求成功', { url, status: result.status, via: result.via });
  } catch (err) {
    $('send-result').textContent = `请求失败：${String(err)}`;
    void logger.error('请求失败', { error: String(err), url, method });
  }
}

async function loadConfigToForm() {
  try {
    const config = await loadConfig();
    await applyConfigToLogger(config);

    $('selectors-input').value = (config.selectors || []).join('\n');
    $('intercept-urls-input').value = (config.interceptUrls || []).join('\n');
    $('log-level-select').value = config.logLevel || 'INFO';

    setStatus('');
  } catch (err) {
    setStatus(`配置加载失败：${String(err)}`);
    void logger.error('配置加载失败', { error: String(err) });
  }
}

async function saveConfigFromForm() {
  try {
    const selectors = toLines($('selectors-input').value);
    const interceptUrls = toLines($('intercept-urls-input').value);
    const logLevel = $('log-level-select').value;

    void logger.info('用户操作', { action: 'saveConfig' });

    await saveConfig('selectors', selectors);
    await saveConfig('interceptUrls', interceptUrls);
    const config = await saveConfig('logLevel', logLevel);

    await applyConfigToLogger(config);

    await chrome.runtime.sendMessage({ type: 'configUpdated' });

    setStatus('配置已保存并生效');
    void logger.info('配置保存成功', { selectorsCount: selectors.length, urlCount: interceptUrls.length, logLevel });
  } catch (err) {
    setStatus(`保存失败：${String(err)}`);
    void logger.error('保存配置失败', { error: String(err) });
  }
}

async function resetConfigFromForm() {
  try {
    void logger.info('用户操作', { action: 'resetConfig' });
    const config = await resetConfig();
    await applyConfigToLogger(config);
    await chrome.runtime.sendMessage({ type: 'configUpdated' });
    await loadConfigToForm();
    setStatus('已恢复默认配置');
  } catch (err) {
    setStatus(`恢复默认失败：${String(err)}`);
    void logger.error('恢复默认配置失败', { error: String(err) });
  }
}

async function exportConfig() {
  try {
    void logger.info('用户操作', { action: 'exportConfig' });
    const config = await exportConfigData();
    downloadText('config.json', JSON.stringify(config, null, 2), 'application/json');
    setStatus('配置已导出');
  } catch (err) {
    setStatus(`导出失败：${String(err)}`);
    void logger.error('导出配置失败', { error: String(err) });
  }
}

async function refreshLogs() {
  await logManager.ready;
  await logManager.reload();

  const level = $('log-filter-select').value;
  const logs = level ? logManager.getLogs({ level }) : logManager.getLogs();

  $('logs-content').textContent =
    logs.length === 0
      ? '暂无日志'
      : logs
          .map((l) => {
            const head = `[${l.timestamp}] [${l.level}] [${l.module}] ${l.message}`;
            if (typeof l.data === 'undefined') return head;
            return `${head}\n数据：${JSON.stringify(l.data)}`;
          })
          .join('\n\n');
}

async function exportLogs() {
  await logManager.ready;
  await logManager.reload();

  const level = $('log-filter-select').value;
  const content = level
    ? logManager.exportLogs('json', { level })
    : logManager.exportLogs('json');

  const name = level ? `logs-${level}.json` : 'logs.json';
  downloadText(name, content, 'application/json');
}

async function clearLogs() {
  void logger.info('用户操作', { action: 'clearLogs' });
  await logManager.clearLogs();
  await refreshLogs();
  setStatus('日志已清除');
}

async function clearHistory() {
  void logger.info('用户操作', { action: 'clearRequestHistory' });
  await chrome.runtime.sendMessage({ type: 'clearRequestHistory' });
  await refreshRequests();
}

function bindEvents() {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => setActiveTab(btn.dataset.tab));
  });

  $('refresh-requests-btn').addEventListener('click', () => void refreshRequests());
  $('clear-history-btn').addEventListener('click', () => void clearHistory());

  $('request-url-input').addEventListener('change', (e) => {
    void logger.debug('用户操作', { action: 'changeInput', field: 'requestUrl', value: e.target.value });
  });
  $('request-body-input').addEventListener('change', () => {
    void logger.debug('用户操作', { action: 'changeInput', field: 'requestBody' });
  });

  $('send-get-btn').addEventListener('click', () => void send('GET'));
  $('send-post-btn').addEventListener('click', () => void send('POST'));

  $('selectors-input').addEventListener('change', () => {
    void logger.debug('用户操作', { action: 'changeInput', field: 'selectors' });
  });
  $('intercept-urls-input').addEventListener('change', () => {
    void logger.debug('用户操作', { action: 'changeInput', field: 'interceptUrls' });
  });
  $('log-level-select').addEventListener('change', (e) => {
    void logger.debug('用户操作', { action: 'changeInput', field: 'logLevel', value: e.target.value });
  });

  $('save-config-btn').addEventListener('click', () => void saveConfigFromForm());
  $('reset-config-btn').addEventListener('click', () => void resetConfigFromForm());
  $('export-config-btn').addEventListener('click', () => void exportConfig());
  $('clear-logs-btn').addEventListener('click', () => void clearLogs());

  $('refresh-logs-btn').addEventListener('click', () => void refreshLogs());
  $('export-logs-btn').addEventListener('click', () => void exportLogs());
  $('log-filter-select').addEventListener('change', () => void refreshLogs());
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'interceptedRequestUpdated') {
    void logger.debug('接收消息类型', { type: message.type });
    void refreshRequests();
  }
});

(async () => {
  void logger.info('Side Panel 加载');
  bindEvents();
  await loadConfigToForm();
  await refreshRequests();
  await refreshLogs();
})();
