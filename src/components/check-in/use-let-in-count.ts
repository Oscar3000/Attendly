"use client";

import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function read(key: string): number {
  try {
    return Number(sessionStorage.getItem(key)) || 0;
  } catch {
    return 0; // Storage can be blocked; the scanner works without the count
  }
}

/**
 * How many people this device has let in during this browser session. It's kept in the browser
 * because door helpers get no event data from the server (T-507), so it's not the event's total
 */
export function useLetInCount(key: string): [number, (people: number) => void] {
  const count = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => 0,
  );

  const add = (people: number) => {
    try {
      sessionStorage.setItem(key, String(read(key) + people));
    } catch {
      return;
    }
    listeners.forEach((listener) => listener());
  };

  return [count, add];
}
