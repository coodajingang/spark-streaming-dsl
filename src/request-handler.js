import { getLogger } from './utils/logger.js';
import { loadConfig } from './utils/config.js';

const logger = getLogger('RequestHandler');

async function getKeys() {
  const config = await loadConfig();
  return config.storageKeys;
}

async function getFromStorage(key, fallback) {
  const result = await chrome.storage.local.get(key);
  return typeof result[key] === 'undefined' ? fallback : result[key];
}

async function setToStorage(key, value) {
  await chrome.storage.local.set({ [key]: value });
}

export async function storeInterceptedRequest(payload) {
  const keys = await getKeys();

  void logger.info('存储拦截请求', {
    url: payload?.request?.url,
    method: payload?.request?.method,
  });

  await setToStorage(keys.LATEST_REQUEST, payload);

  const history = await getFromStorage(keys.REQUEST_HISTORY, []);
  const list = Array.isArray(history) ? history : [];
  list.push(payload);

  const trimmed = list.slice(-200);
  await setToStorage(keys.REQUEST_HISTORY, trimmed);

  return { latest: payload, history: trimmed };
}

export async function getLatestInterceptedRequest() {
  const keys = await getKeys();
  void logger.info('从存储读取数据', { key: keys.LATEST_REQUEST });
  return getFromStorage(keys.LATEST_REQUEST, null);
}

export async function getRequestHistory() {
  const keys = await getKeys();
  void logger.info('从存储读取数据', { key: keys.REQUEST_HISTORY });
  const v = await getFromStorage(keys.REQUEST_HISTORY, []);
  return Array.isArray(v) ? v : [];
}

export async function clearRequestHistory() {
  const keys = await getKeys();
  void logger.info('清除历史记录');
  await chrome.storage.local.remove([keys.LATEST_REQUEST, keys.REQUEST_HISTORY]);
  return true;
}

export async function storeLastSentRequest(request) {
  const keys = await getKeys();
  await setToStorage(keys.LAST_SENT_REQUEST, request);
}

export async function getLastSentRequest() {
  const keys = await getKeys();
  return getFromStorage(keys.LAST_SENT_REQUEST, null);
}

export default {
  storeInterceptedRequest,
  getLatestInterceptedRequest,
  getRequestHistory,
  clearRequestHistory,
  storeLastSentRequest,
  getLastSentRequest,
};
