/**
 * Response with cache as quickly as possible if available, falling back to fetchFunction if it's not cached.
 * @see https://developers.google.com/web/tools/workbox/modules/workbox-strategies#cache_first_cache_falling_back_to_network
 * @param cacheInterface caller cache class
 * @param key cache key
 * @param fetchFunction fetching function for cache miss fallback
 */
export default async function CacheFirst (cacheInterface: StrategicCache.Cache, key: string, fetchFunction: Function) {
  let cacheValue = await cacheInterface.get(key)

  // If cache miss => fallback to fetchFunction
  if (cacheValue === undefined) {
    cacheValue = await fetchFunction()
    await cacheInterface.set(key, cacheValue)
  }

  return cacheValue
}
