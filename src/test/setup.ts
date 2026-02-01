import "@testing-library/jest-dom";

// Some environments provide a partial localStorage implementation. For tests we
// want deterministic get/set behavior.
if (typeof window !== "undefined") {
  let maybeStorage: Storage | null = null;

  try {
    maybeStorage = window.localStorage;
  } catch {
    maybeStorage = null;
  }

  if (
    !maybeStorage ||
    typeof maybeStorage.getItem !== "function" ||
    typeof maybeStorage.setItem !== "function" ||
    typeof maybeStorage.removeItem !== "function"
  ) {
    const store = new Map<string, string>();

    const shim = {
      get length() {
        return store.size;
      },
      clear() {
        store.clear();
      },
      getItem(key: string) {
        return store.has(key) ? (store.get(key) ?? null) : null;
      },
      key(index: number) {
        return Array.from(store.keys())[index] ?? null;
      },
      removeItem(key: string) {
        store.delete(key);
      },
      setItem(key: string, value: string) {
        store.set(key, String(value));
      }
    };

    try {
      Object.defineProperty(window, "localStorage", {
        value: shim,
        configurable: true
      });
    } catch {
      // ignore if environment disallows redefining localStorage
    }
  }
}
