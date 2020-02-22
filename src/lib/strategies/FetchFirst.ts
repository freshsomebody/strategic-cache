/**
 * Response with fetchFunction if available, falling back to cache data if fetchFunction fails
 * @see https://developers.google.com/web/tools/workbox/modules/workbox-strategies#network_first_network_falling_back_to_cache
 * @param cacheInterface cache to be operated
 * @param key cache key
 * @param fetchFunction function for fetching value
 */
export default async function FetchFirst (cacheInterface: StrategicCache.Cache, key: string, fetchFunction: Function) {
  try {
    const cacheValue = await fetchFunction()
    await cacheInterface.set(key, cacheValue)
    return cacheValue
  } catch (error) {
    return cacheInterface.get(key)
  }
}
