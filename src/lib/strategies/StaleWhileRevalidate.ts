/**
 * Response with cache as quickly as possible if available, falling back to fetchFunction if it's not cached. Then update the cache by the return of fetchFunction
 * @see https://developers.google.com/web/tools/workbox/modules/workbox-strategies#stale-while-revalidate
 * @param cacheInterface cache to be operated
 * @param key cache key
 * @param fetchFunction fetching function for cache miss fallback and updating cache
 * @param fetchErrorHandler function for handling fetch error
 */
export default async function StaleWhileRevalidate (cacheInterface: StrategicCache.Cache, key: string, fetchFunction: Function, fetchErrorHandler?: Function) {
  if (typeof fetchFunction !== 'function') {
    throw new TypeError("'fetchFunction' is not a function.")
  }

  let cacheValue = await cacheInterface.get(key)

  if (!cacheInterface._strategicCacheFetching) {
    cacheInterface._strategicCacheFetching = {}
  }

  // If cache hit => don't wait for revalidation
  if (cacheValue !== undefined) {
    fetchPromiseWrapper(cacheInterface, key, fetchFunction, fetchErrorHandler)
  } else {
    // If cache miss => wait for revalidation
    cacheValue = await fetchPromiseWrapper(cacheInterface, key, fetchFunction, fetchErrorHandler)
  }
  return cacheValue
}

/**
 * Wrap the fetchFunction in an async function
 * @param cacheInterface cache to be operated
 * @param key cache key
 * @param fetchFunction fetching function for cache miss fallback and updating cache
 * @param fetchErrorHandler function for handling fetch error
 */
async function fetchPromiseWrapper (cacheInterface: StrategicCache.Store, key: string, fetchFunction: Function, fetchErrorHandler?: Function) {
  if (cacheInterface._strategicCacheFetching[key]) {
    return
  }

  try {
    cacheInterface._strategicCacheFetching[key] = true
    const fetchedResult = await fetchFunction()
    await cacheInterface.set(key, fetchedResult)
    delete cacheInterface._strategicCacheFetching[key]
    return fetchedResult
  } catch (error) {
    if (fetchErrorHandler) {
      fetchErrorHandler(error)
    }
    delete cacheInterface._strategicCacheFetching[key]
  }
}
