// Browser polyfill for @tanstack/start-storage-context
// AsyncLocalStorage doesn't exist in browser - use a simple global context instead

let currentContext: unknown = undefined;

export async function runWithStartContext<T>(context: unknown, fn: () => Promise<T>): Promise<T> {
  const prev = currentContext;
  currentContext = context;
  try {
    return await fn();
  } finally {
    currentContext = prev;
  }
}

export function getStartContext(opts?: { strict?: boolean }): unknown {
  return currentContext;
}
