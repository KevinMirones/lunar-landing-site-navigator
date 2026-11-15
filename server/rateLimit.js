// Sliding-window rate limiter, kept in memory. Enough for one small server;
// it is here to stop a public deployment being used to hammer NASA/JPL Horizons.

export function createRateLimiter({ limit, windowMs, now = Date.now }) {
  /** client key -> timestamps of its requests inside the window, oldest first */
  const hits = new Map();

  const prune = (t) => {
    for (const [key, times] of hits) {
      while (times.length && t - times[0] >= windowMs) times.shift();
      if (!times.length) hits.delete(key);
    }
  };

  return {
    /** Records a request. `allowed` is false once the client is over the limit. */
    take(key) {
      const t = now();
      prune(t);
      const times = hits.get(key) ?? [];
      if (times.length >= limit) {
        return { allowed: false, retryAfterSec: Math.ceil((times[0] + windowMs - t) / 1000) };
      }
      times.push(t);
      hits.set(key, times);
      return { allowed: true, retryAfterSec: 0 };
    },
    size: () => hits.size,
  };
}

/** Express middleware around a limiter, keyed by client address. */
export function rateLimit(limiter, message) {
  return (req, res, next) => {
    const { allowed, retryAfterSec } = limiter.take(req.ip);
    if (allowed) return next();
    res.set('Retry-After', String(retryAfterSec)).status(429).json({ error: message });
  };
}
