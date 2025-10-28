import { useEffect } from "react";

type HotkeyCallback = (event: KeyboardEvent) => void;

interface HotkeyOptions {
  preventDefault?: boolean;
}

export function useHotkeys(
  keys: string | string[],
  callback: HotkeyCallback,
  options: HotkeyOptions = {}
) {
  useEffect(() => {
    const { preventDefault = true } = options;
    const hotkeyList = Array.isArray(keys) ? keys : [keys];

    const normalize = (str: string) =>
      str
        .toLowerCase()
        .replace(/\s+/g, "")
        .split("+")
        .sort()
        .join("+");

    const matchHotkey = (event: KeyboardEvent, hotkey: string) => {
      const parts = hotkey.split("+");
      const pressed = [];

      if (event.ctrlKey) pressed.push("ctrl");
      if (event.shiftKey) pressed.push("shift");
      if (event.altKey) pressed.push("alt");
      if (event.metaKey) pressed.push("meta");

      if (/^[a-z0-9]$/i.test(event.key)) {
        pressed.push(event.key.toLowerCase());
      } else {
        pressed.push(event.key.toLowerCase());
      }

      return normalize(pressed.join("+")) === normalize(hotkey);
    };

    const handler = (event: KeyboardEvent) => {
      for (const hotkey of hotkeyList) {
        if (matchHotkey(event, hotkey)) {
          if (preventDefault) event.preventDefault();
          callback(event);
          break;
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [keys, callback, options]);
}
