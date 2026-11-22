const STORAGE_KEY = 'coffee-app:order-subscriptions';
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 6;

let attempts: number[] = [];
let cooldownUntil = 0;

try {
  const saved: { attempts?: unknown; cooldownUntil?: unknown } | null = JSON.parse(
    sessionStorage.getItem(STORAGE_KEY) ?? 'null',
  );
  if (Array.isArray(saved?.attempts)) attempts = saved.attempts.filter(Number.isFinite);
  if (typeof saved?.cooldownUntil === 'number' && Number.isFinite(saved.cooldownUntil)) {
    cooldownUntil = saved.cooldownUntil;
  }
} catch {
  // Keep the limit in memory when browser storage is unavailable.
}

function saveLimit() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ attempts, cooldownUntil }));
  } catch {
    // The in-memory limit still applies for this tab.
  }
}

export function getSubscriptionDelay() {
  const now = Date.now();
  attempts = attempts.filter((attempt) => attempt > now - WINDOW_MS);
  const [oldest] = attempts;
  const windowEnds =
    oldest !== undefined && attempts.length >= MAX_ATTEMPTS ? oldest + WINDOW_MS : 0;
  return Math.max(0, windowEnds - now, cooldownUntil - now);
}

export function recordSubscriptionAttempt() {
  attempts.push(Date.now());
  saveLimit();
}

export function delaySubscriptions() {
  cooldownUntil = Date.now() + WINDOW_MS;
  saveLimit();
}
