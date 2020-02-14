/**
 * Response with cache as quickly as possible if available, falling back to fetchFunction if it's not cached.
 * @see https://developers.google.com/web/tools/workbox/modules/workbox-strategies#cache_first_cache_falling_back_to_network
 * @param cacheStore cache store
 * @param key cache key
 * @param fetchFunction fetching function for cache miss fallback
 */
export default async function CacheFirst (cacheStore: StrategicCache.Store, key: string, fetchFunction: Function) {
  let cacheValue = await cacheStore.get(key)

  // If cache miss => fallback to fetchFunction
  if (cacheValue === undefined) {
    cacheValue = await fetchFunction()
    await cacheStore.set(key, cacheValue)
  }

  return cacheValue
}
