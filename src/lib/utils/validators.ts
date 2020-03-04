export function cacheOptionValidator (overrideOptions: StrategicCache.CacheOptions = {}): StrategicCache.CacheOptions {
  const acceptableTypes: StrategicCache.CacheableTypes = ['number', 'bigint', 'string', 'boolean', 'object', 'symbol']

  const defaultOptions: StrategicCache.CacheOptions = {
    store: 'memory',
    fallbackStore: 'memory',
    maxAgeSeconds: 0,
    maxEntries: 0,
    storeMethodMapper: {
      get: 'get',
      keys: 'keys',
      set: 'set',
      delete: 'delete',
      flush: 'flush'
    },
    cacheable: acceptableTypes
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
      // storeErrorMsg = (!!store.get && !!store.set) ? '' : "'get' and 'set' methods are necessary for a store"
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

  // Verify storeMethodMapper
  const { storeMethodMapper: defaultMapper } = defaultOptions
  const { storeMethodMapper: overridingMapper } = options
  if (typeof overridingMapper !== 'object') {
    options.storeMethodMapper = { ...defaultMapper }
  } else {
    // Deep merge storeMethodMapper
    options.storeMethodMapper = { ...defaultMapper, ...overridingMapper }
  }

  // Verify cacheable
  const { cacheable } = options
  try {
    if (Array.isArray(cacheable)) {
      // Verify the elements in the array
      options.cacheable = cacheable.filter(cacheableTypes => acceptableTypes.includes(cacheableTypes))
      if (options.cacheable.length === 0) {
        throw new TypeError('1')
      }
    } else if (typeof cacheable !== 'function') {
      throw new TypeError('2')
    }
  } catch (error) {
    switch (error.message) {
      case '1':
        console.warn(`cacheable should contain at least one valid type (${acceptableTypes.join(' | ')})`)
        break
      case '2':
        console.warn(`cacheable doesn't support type '${typeof cacheable}'.`)
        break
      default:
        console.warn(error.message)
    }
    console.warn("Fall back to ['number', 'string', 'boolean', 'object']")
    options.cacheable = acceptableTypes
  }

  return options
}
