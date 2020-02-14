/**
 * Response with cache as quickly as possible if available, falling back to fetchFunction if it's not cached. Then update the cache by the return of fetchFunction
 * @see https://developers.google.com/web/tools/workbox/modules/workbox-strategies#stale-while-revalidate
 * @param cacheStore cache store
 * @param key cache key
 * @param fetchFunction fetching function for cache miss fallback and updating cache
 * @param fetchErrorHandler function for handling fetch error
 */
export default async function StaleWhileRevalidate (cacheStore: StrategicCache.Store, key: string, fetchFunction: Function, fetchErrorHandler?: Function) {
  let cacheValue = await cacheStore.get(key)
  const networkFunctionPromise = async () => fetchFunction()

  // If cache hit => don't wait for revalidation
  if (cacheValue !== undefined) {
    networkFunctionPromise()
      .then(RevalidatedValue => cacheStore.set(key, RevalidatedValue))
      .catch(error => {
        if (fetchErrorHandler) {
          fetchErrorHandler(error)
        } else {
          console.log('Failed to revalidate the cache: ', error)
        }
      })
  } else {
    // If cache miss => wait for revalidation
    try {
      cacheValue = await networkFunctionPromise()
      cacheStore.set(key, cacheValue)
    } catch (error) {
      if (fetchErrorHandler) {
        fetchErrorHandler(error)
      } else {
        console.log('Failed to revalidate the cache: ', error)
      }
    }
  }
  return cacheValue
}
