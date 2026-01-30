/**
 * Request Cache Utility with In-Flight Request Deduplication
 * Prevents duplicate API requests by sharing promises for in-flight requests
 * Useful for React StrictMode double-invocation in development
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class RequestCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private inFlightRequests: Map<string, Promise<any>> = new Map();
  private readonly TTL = 1000; // 1 second cache

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cached data
   */
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Get in-flight request promise
   */
  getInFlight<T>(key: string): Promise<T> | null {
    return this.inFlightRequests.get(key) || null;
  }

  /**
   * Set in-flight request promise
   */
  setInFlight<T>(key: string, promise: Promise<T>): void {
    this.inFlightRequests.set(key, promise);
  }

  /**
   * Clear in-flight request
   */
  clearInFlight(key: string): void {
    this.inFlightRequests.delete(key);
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
    this.inFlightRequests.clear();
  }

  /**
   * Clear specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
    this.inFlightRequests.delete(key);
  }
}

export const requestCache = new RequestCache();

/**
 * Wrap an async function with caching and in-flight request deduplication
 * This ensures that if multiple components request the same data simultaneously,
 * only one network request is made and all callers receive the same promise.
 */
export function withCache<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  // Check for cached data first
  const cached = requestCache.get<T>(key);
  if (cached !== null) {
    console.log(`🎯 Cache hit for: ${key}`);
    return Promise.resolve(cached);
  }

  // Check for in-flight request
  const inFlight = requestCache.getInFlight<T>(key);
  if (inFlight) {
    console.log(`⏳ Using in-flight request for: ${key}`);
    return inFlight;
  }

  // Make new request
  console.log(`📡 Fetching: ${key}`);
  const promise = fn()
    .then((data) => {
      requestCache.set(key, data);
      requestCache.clearInFlight(key);
      return data;
    })
    .catch((error) => {
      requestCache.clearInFlight(key);
      throw error;
    });

  requestCache.setInFlight(key, promise);
  return promise;
}
