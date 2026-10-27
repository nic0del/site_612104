export function memoryStorage() {
  const entries = new Map();
  return {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
    removeItem: key => entries.delete(key),
    clear: () => entries.clear()
  };
}
export function installStorage() {
  globalThis.localStorage = memoryStorage();
  globalThis.sessionStorage = memoryStorage();
}

export function installDOM() {
  class Element {
    constructor(id = "") {
      this.id = id;
      this.children = [];
      this.style = {};
      this.textContent = "";
      this.listeners = {};
      this.value = "";
      this.paused = true;
      this.ended = false;
      this.currentTime = 0;
      this.volume = 0.4;
      const classes = new Set();
      this.classList = {
        add: (...names) => names.forEach(n => classes.add(n)),
        remove: (...names) => names.forEach(n => classes.delete(n)),
        contains: n => classes.has(n),
        toggle: (n, on) => (on ? classes.add(n) : classes.delete(n))
      };
    }
    set innerHTML(value) { this.children = []; this.textContent = value; }
    get innerHTML() { return this.textContent; }
    appendChild(child) { this.children.push(child); }
    addEventListener(event, handler) { this.listeners[event] = handler; }
    async click() { return this.listeners.click?.({ target: this }); }
    play() { this.paused = false; return Promise.resolve(); }
    pause() { this.paused = true; }
  }
  const ids = new Map();
  const get = id => {
    if (!ids.has(id)) ids.set(id, new Element(id));
    return ids.get(id);
  };
  for (const id of ["screen-scene1", "screen-gate", "screen-menu"]) get(id);
  globalThis.document = {
    hidden: false,
    body: new Element(),
    getElementById: get,
    createElement: () => new Element(),
    addEventListener() {},
    querySelectorAll: selector => selector === ".screen"
      ? [...ids.values()].filter(el => el.id.startsWith("screen-")) : []
  };
  return { get };
}

// Advance browser timers as microtasks, preserving cancellation and async order.
export function fastClock() {
  const nativeSet = globalThis.setTimeout, nativeClear = globalThis.clearTimeout;
  let next = 0;
  const jobs = new Map();
  globalThis.setTimeout = fn => {
    const id = ++next;
    jobs.set(id, fn);
    queueMicrotask(() => {
      if (!jobs.has(id)) return;
      jobs.delete(id);
      fn();
    });
    return id;
  };
  globalThis.clearTimeout = id => jobs.delete(id);
  return () => { globalThis.setTimeout = nativeSet; globalThis.clearTimeout = nativeClear; };
}
