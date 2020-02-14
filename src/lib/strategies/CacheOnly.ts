/**
 * Get value from cache only
 * @see https://developers.google.com/web/tools/workbox/modules/workbox-strategies#cache_only
 * @param cacheStore cache store
 * @param key cache key
 */
export default async function CacheOnly (cacheStore: StrategicCache.Store, key: string) {
  return cacheStore.get(key)
}
