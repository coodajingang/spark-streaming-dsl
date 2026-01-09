import { getLogger } from './utils/logger.js';

const logger = getLogger('ElementDetector');

const STYLE_ID = 'ext-element-detector-style';
const BTN_CLASS = 'ext-debug-btn';
const MARK_ATTR = 'data-ext-debugged';

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .${BTN_CLASS} {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 6px;
      padding: 2px 6px;
      border: 1px solid #1a73e8;
      background: #1a73e8;
      color: #fff;
      font-size: 12px;
      border-radius: 4px;
      cursor: pointer;
      user-select: none;
      line-height: 1.2;
    }
    .${BTN_CLASS}:hover { opacity: 0.9; }
  `;
  document.documentElement.appendChild(style);
}

function uniqueElementsFromSelectors(selectors) {
  const set = new Set();
  for (const sel of selectors) {
    try {
      document.querySelectorAll(sel).forEach((el) => set.add(el));
    } catch (e) {
      void logger.warn('选择器无效，跳过', { selector: sel, error: String(e) });
    }
  }
  return [...set];
}

export class ElementDetector {
  constructor({ selectors = [], onDebugClick } = {}) {
    this.selectors = selectors;
    this.onDebugClick = onDebugClick;
    this.observer = null;
  }

  setSelectors(selectors) {
    this.selectors = selectors;
  }

  start() {
    injectStyles();
    void logger.info('检测开始', { selectors: this.selectors });

    const matched = uniqueElementsFromSelectors(this.selectors);
    void logger.debug('匹配的元素', { count: matched.length });

    let added = 0;
    for (const el of matched) {
      if (this._ensureButton(el)) added += 1;
    }

    void logger.info('按钮添加成功', { added });
    this._startObserver();

    return { matchedCount: matched.length, addedCount: added };
  }

  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  _ensureButton(el) {
    if (!(el instanceof Element)) return false;
    if (el.getAttribute(MARK_ATTR) === '1') return false;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = BTN_CLASS;
    btn.textContent = '调试';

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        this.onDebugClick?.(el);
      } catch (err) {
        void logger.error('调试按钮点击处理失败', { error: String(err) });
      }
    });

    el.setAttribute(MARK_ATTR, '1');
    el.appendChild(btn);
    return true;
  }

  _startObserver() {
    if (this.observer) return;

    this.observer = new MutationObserver((mutations) => {
      let newCount = 0;

      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element)) continue;

          for (const sel of this.selectors) {
            try {
              if (node.matches(sel)) {
                if (this._ensureButton(node)) newCount += 1;
              }
              node.querySelectorAll(sel).forEach((child) => {
                if (this._ensureButton(child)) newCount += 1;
              });
            } catch {
              // ignore invalid selectors, already logged at start
            }
          }
        }
      }

      if (newCount > 0) {
        void logger.debug('新增元素检测', { added: newCount });
      }
    });

    this.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    void logger.info('观察器启动');
  }
}

export default ElementDetector;
