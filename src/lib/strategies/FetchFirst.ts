/**
 * Response with fetchFunction if available, falling back to cache data if fetchFunction fails
 * @see https://developers.google.com/web/tools/workbox/modules/workbox-strategies#network_first_network_falling_back_to_cache
 * @param cacheStore cache store
 * @param key cache key
 * @param fetchFunction function for fetching value
 */
export default async function FetchFirst (cacheStore: StrategicCache.Store, key: string, fetchFunction: Function) {
  try {
    const cacheValue = await fetchFunction()
    await cacheStore.set(key, cacheValue)
    return cacheValue
  } catch (error) {
    return cacheStore.get(key)
  }
}
