import { cacheOptionValidator } from '../validators'

describe('~/lib/utils/validators.ts', () => {
  test('cacheOptionValidator verifies store correctly', () => {
    // Returns default store
    let verifiedOptions = cacheOptionValidator()
    expect(verifiedOptions.store).toBe('memory')

    // Use fallback store if store is invalid
    verifiedOptions = cacheOptionValidator({
      store: 'non-support'
    })
    expect(verifiedOptions.store).toBe(verifiedOptions.fallbackStore)

    // Throw error if receiving invalid store and fallbackStore is disabled
    expect(() => {
      cacheOptionValidator({
        store: 'non-support',
        fallbackStore: false
      })
    }).toThrow()
  })

  test('cacheOptionValidator verifies maxAgeSeconds correctly', () => {
    // Returns 0 if no option is given
    let verifiedOptions = cacheOptionValidator()
    expect(verifiedOptions.maxAgeSeconds).toBe(0)

    // Return 0 if the given maxAgeSeconds is invalid
    verifiedOptions = cacheOptionValidator({
      maxAgeSeconds: -1
    })
    expect(verifiedOptions.maxAgeSeconds).toBe(0)

    verifiedOptions = cacheOptionValidator({
      maxAgeSeconds: 'string' // This may cause IDE reporting errors
    })
    expect(verifiedOptions.maxAgeSeconds).toBe(0)
  })

  test('cacheOptionValidator verifies maxEntries correctly', () => {
    // Returns 0 if no option is given
    let verifiedOptions = cacheOptionValidator()
    expect(verifiedOptions.maxEntries).toBe(0)

    // Return 0 if the given maxEntries is invalid
    verifiedOptions = cacheOptionValidator({
      maxEntries: -1
    })
    expect(verifiedOptions.maxEntries).toBe(0)

    verifiedOptions = cacheOptionValidator({
      maxEntries: 'string' // This may cause IDE reporting errors
    })
    expect(verifiedOptions.maxEntries).toBe(0)
  })

  test('cacheOptionValidator verifies storeMethodMapper correctly', () => {
    const defaultMapper = {
      get: 'get',
      keys: 'keys',
      set: 'set',
      delete: 'delete',
      flush: 'flush'
    }
    // Returns {} if no option is given
    let verifiedOptions = cacheOptionValidator()
    expect(verifiedOptions.storeMethodMapper).toEqual(defaultMapper)

    // Return given merged storeMethodMapper if storeMethodMapper is set in options
    const overridingMapper = {
      keys: 'key',
      delete: 'del'
    }
    verifiedOptions = cacheOptionValidator({
      storeMethodMapper: overridingMapper
    })
    expect(verifiedOptions.storeMethodMapper).toEqual({ ...defaultMapper, ...overridingMapper })

    // Set to default storeMethodMapper if the given one is invalid
    verifiedOptions = cacheOptionValidator({
      storeMethodMapper: 'string'
    })
    expect(verifiedOptions.storeMethodMapper).toEqual(defaultMapper)
  })

  test('cacheOptionValidator verifies cacheable correctly', () => {
    const defaultCacheable = ['number', 'bigint', 'string', 'boolean', 'object', 'symbol']
    // Return ['number', 'bigint', 'string', 'boolean', 'object', 'symbol'] in default
    let verifiedOptions = cacheOptionValidator()
    expect(verifiedOptions.cacheable).toEqual(defaultCacheable)

    // Return overrided cacheable if given
    const overridingCacheableTypes = ['string', 'boolean']
    verifiedOptions = cacheOptionValidator({
      cacheable: overridingCacheableTypes
    })
    expect(verifiedOptions.cacheable).toEqual(overridingCacheableTypes)

    const overridingCacheableFunc = () => true
    verifiedOptions = cacheOptionValidator({
      cacheable: overridingCacheableFunc
    })
    expect(verifiedOptions.cacheable).toEqual(overridingCacheableFunc)

    // Set to default if the given option is invalid
    let invalidCacheableTypes: string[] | string = ['type1', 'type2']
    verifiedOptions = cacheOptionValidator({
      cacheable: invalidCacheableTypes
    })
    expect(verifiedOptions.cacheable).toEqual(defaultCacheable)

    invalidCacheableTypes = 'stringInput'
    verifiedOptions = cacheOptionValidator({
      cacheable: invalidCacheableTypes
    })
    expect(verifiedOptions.cacheable).toEqual(defaultCacheable)
  })
})
