/**
 * Response with cache as quickly as possible if available, falling back to fetchFunction if it's not cached. Then update the cache by the return of fetchFunction
 * @see https://developers.google.com/web/tools/workbox/modules/workbox-strategies#stale-while-revalidate
 * @param cacheStore cache store
 * @param key cache key
 * @param fetchFunction fetching function for cache miss fallback and updating cache
 * @param fetchErrorHandler function for handling fetch error
 */
export default async function StaleWhileRevalidate (cacheStore: StrategicCache.Store, key: string, fetchFunction: Function, fetchErrorHandler?: Function) {
  if (typeof fetchFunction !== 'function') {
    throw new TypeError("'fetchFunction' is not a function.")
  }

  let cacheValue = await cacheStore.get(key)

  // If cache hit => don't wait for revalidation
  if (cacheValue !== undefined) {
    fetchPromiseWrapper(cacheStore, key, fetchFunction, fetchErrorHandler)
  } else {
    // If cache miss => wait for revalidation
    cacheValue = await fetchPromiseWrapper(cacheStore, key, fetchFunction, fetchErrorHandler)
  }
  return cacheValue
}

/**
 * Wrap the fetchFunction in an async function
 * @param cacheStore cache store
 * @param key cache key
 * @param fetchFunction fetching function for cache miss fallback and updating cache
 * @param fetchErrorHandler function for handling fetch error
 */
async function fetchPromiseWrapper (cacheStore: StrategicCache.Store, key: string, fetchFunction: Function, fetchErrorHandler?: Function) {
  try {
    const fetchedResult = await fetchFunction()
    await cacheStore.set(key, fetchedResult)
    return fetchedResult
  } catch (error) {
    if (fetchErrorHandler) {
      fetchErrorHandler(error)
    }
  }
}
