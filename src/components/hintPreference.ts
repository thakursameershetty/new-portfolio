// Whether the visitor wants the case studies' how-to hints: "on" or "off" once they've said
// so with the hints key, kept for good; null until then (the hints show until the set is
// first used). Read through useSyncExternalStore, so every open view agrees and the server
// render (null) never mismatches.
export type HintPreference = "on" | "off" | null;

const key = "case-hints";
const changed = "case-hints-change";

export function readHintPreference(): HintPreference {
  try {
    const value = window.localStorage.getItem(key);
    return value === "on" || value === "off" ? value : null;
  } catch {
    return null;
  }
}

export function writeHintPreference(value: "on" | "off") {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage blocked (private mode): the choice still holds in this page.
    memory = value;
  }
  window.dispatchEvent(new Event(changed));
}

// The fallback when storage is blocked.
let memory: HintPreference = null;

export function readHintPreferenceOrMemory(): HintPreference {
  return readHintPreference() ?? memory;
}

export function subscribeHintPreference(listener: () => void) {
  window.addEventListener(changed, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(changed, listener);
    window.removeEventListener("storage", listener);
  };
}
