export function cacheOptionValidator (overrideOptions: StrategicCache.CacheOptions = {}): StrategicCache.CacheOptions {
  const defaultOptions: StrategicCache.CacheOptions = {
    store: 'memory',
    fallbackStore: 'memory',
    maxAgeSeconds: 0,
    maxEntries: 0
  }
  const options = { ...defaultOptions, ...overrideOptions }

  // Verify store
  const { store } = options
  const buildinStores = ['memory']
  let storeErrorMsg = ''
  switch (typeof store) {
    case 'string':
      storeErrorMsg = buildinStores.includes(store) ? '' : `${store} is not a supported store.`
      break
    case 'object':
      storeErrorMsg = (!!store.get && !!store.set) ? '' : "'get' and 'set' methods are necessary for a store"
      break
    default:
      storeErrorMsg = `${typeof store}' is not a supported store type.`
  }
  // If there is an error occurred in creating store
  if (storeErrorMsg !== '') {
    const { fallbackStore } = options
    // If fallbackStore is disabled => throw Error
    if (!fallbackStore) {
      throw new TypeError(storeErrorMsg)
    }
    // Else => use fallbackStore
    console.warn(storeErrorMsg)
    console.warn(`Fall back to use '${fallbackStore}' store`)
    options.store = fallbackStore
  }

  // Verify ttlSeconds
  const { maxAgeSeconds } = options
  if (typeof maxAgeSeconds !== 'number' || maxAgeSeconds < 0) {
    options.maxAgeSeconds = 0
  }

  // Verify maxEntries
  const { maxEntries } = options
  if (typeof maxEntries !== 'number' || maxEntries < 0) {
    options.maxEntries = 0
  }

  return options
}
