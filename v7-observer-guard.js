(() => {
'use strict';
const Native = window.MutationObserver;
if (!Native || window.__AS_V7_OBSERVER_GUARD__) return;
window.__AS_V7_OBSERVER_GUARD__ = true;
window.__AS_PATCH_OBSERVERS__ = window.__AS_PATCH_OBSERVERS__ || [];
class GuardedMutationObserver {
  constructor(callback) {
    this.callback = callback;
    this.target = null;
    this.options = null;
    this.running = false;
    this.native = new Native((records) => {
      if (this.running || !this.target) return;
      this.running = true;
      const target = this.target;
      const options = this.options;
      this.native.disconnect();
      try {
        this.callback(records, this);
      } finally {
        requestAnimationFrame(() => {
          if (this.target === target && this.options === options) {
            this.native.observe(target, options);
          }
          this.running = false;
        });
      }
    });
    window.__AS_PATCH_OBSERVERS__.push(this);
  }
  observe(target, options) {
    this.target = target;
    this.options = options;
    this.native.observe(target, options);
  }
  disconnect() {
    this.target = null;
    this.options = null;
    this.native.disconnect();
  }
  takeRecords() { return this.native.takeRecords(); }
}
window.MutationObserver = GuardedMutationObserver;
setTimeout(() => { window.MutationObserver = Native; }, 0);
})();