import Cache from '../cache'
import * as strategies from '../lib/strategies'

const swrResult = 'swrResult'
const cacheFirstResult = 'cacheFirstResult'
const fetchFirstResult = 'fetchFirstResult'
const fetchOnlyResult = 'fetchOnlyResult'
const cacheOnlyResult = 'cacheOnlyResult'
jest.mock('../lib/strategies', () => {
  return {
    StaleWhileRevalidate: jest.fn(() => Promise.resolve(swrResult)),
    CacheFirst: jest.fn(() => Promise.resolve(cacheFirstResult)),
    FetchFirst: jest.fn(() => Promise.resolve(fetchFirstResult)),
    FetchOnly: jest.fn(() => Promise.resolve(fetchOnlyResult)),
    CacheOnly: jest.fn(() => Promise.resolve(cacheOnlyResult))
  }
})

describe('~/cache.ts', () => {
  it('creates store correctly in constructor', () => {
    // Create by default
    let testCache = new Cache()
    expect(testCache.store).toBeDefined()

    // Create with given options
    const mockStore = {
      get: () => 1,
      set: () => undefined
    }
    let cacheOption: StrategicCache.CacheOptions = {
      store: mockStore,
      fallbackStore: 'memory',
      maxAgeSeconds: 60,
      maxEntries: 3
    }
    testCache = new Cache(cacheOption)
    expect(testCache.store).toEqual(mockStore)

    // Throw error if giving non-support stategy and disabling fallbackStore
    cacheOption = {
      store: 'non-support', // This may cause IDE reporting errors
      fallbackStore: false,
      maxAgeSeconds: 60,
      maxEntries: 3
    }
    expect(() => {
      testCache = new Cache(cacheOption)
    }).toThrow()
  })

  it('.get calls StaleWhileRevalidate if specified', async () => {
    const testCache = new Cache()
    const fetchFunction = jest.fn()
    const fetchErrorHandler = jest.fn()
    const getOptions: StrategicCache.GetOptions = {
      strategy: 'StaleWhileRevalidate',
      fetchFunction,
      fetchErrorHandler
    }
    const result = await testCache.get('key', getOptions)
    expect(result).toBe(swrResult)
    expect(strategies.StaleWhileRevalidate).toHaveBeenCalledWith(testCache, 'key', fetchFunction, fetchErrorHandler)
  })

  it('.get calls CacheFirst if specified', async () => {
    const testCache = new Cache()
    const fetchFunction = jest.fn()
    const getOptions: StrategicCache.GetOptions = {
      strategy: 'CacheFirst',
      fetchFunction
    }
    const result = await testCache.get('key', getOptions)
    expect(result).toBe(cacheFirstResult)
    expect(strategies.CacheFirst).toHaveBeenCalledWith(testCache, 'key', fetchFunction)
  })

  it('.get calls FetchFirst if specified', async () => {
    const testCache = new Cache()
    const fetchFunction = jest.fn()
    const getOptions: StrategicCache.GetOptions = {
      strategy: 'FetchFirst',
      fetchFunction
    }
    const result = await testCache.get('key', getOptions)
    expect(result).toBe(fetchFirstResult)
    expect(strategies.FetchFirst).toHaveBeenCalledWith(testCache, 'key', fetchFunction)
  })

  it('.get calls FetchOnly if specified', async () => {
    const testCache = new Cache()
    const fetchFunction = jest.fn()
    const getOptions: StrategicCache.GetOptions = {
      strategy: 'FetchOnly',
      fetchFunction
    }
    const result = await testCache.get('key', getOptions)
    expect(result).toBe(fetchOnlyResult)
    expect(strategies.FetchOnly).toHaveBeenCalledWith(fetchFunction)
  })

  it('.get calls store.get by default and when specifing CacheOnly', async () => {
    const mockStore = {
      get: jest.fn(() => cacheOnlyResult),
      set: () => undefined
    }
    const testCache = new Cache({
      store: mockStore
    })
    let result = await testCache.get('key')
    expect(result).toBe(cacheOnlyResult)

    const getOptions: StrategicCache.GetOptions = {
      strategy: 'CacheOnly'
    }
    result = await testCache.get('key', getOptions)
    expect(result).toBe(cacheOnlyResult)
    expect(testCache.store.get).toHaveBeenCalledWith('key')
    expect(testCache.store.get).toHaveBeenCalledTimes(2)
  })

  it('calls mapped store methods if storeMethodMapper is set', async () => {
    const mockStore = {
      mget: jest.fn(() => cacheOnlyResult),
      mset: jest.fn(),
      mkeys: jest.fn(() => ['key1', 'key2']),
      mdel: jest.fn(),
      mflush: jest.fn()
    }
    const testCache = new Cache({
      store: mockStore,
      storeMethodMapper: {
        get: 'mget',
        set: 'mset',
        keys: 'mkeys',
        delete: 'mdel',
        flush: 'mflush'
      }
    })

    // get mapping
    const result = await testCache.get('key')
    expect(result).toBe(cacheOnlyResult)
    expect(mockStore.mget).toHaveBeenCalledWith('key')

    // set mapping
    await testCache.set('key', 'value')
    expect(mockStore.mset).toHaveBeenCalledWith('key', 'value')

    // keys mapping
    const keys = await testCache.keys()
    expect(keys).toEqual(['key1', 'key2'])
    expect(mockStore.mkeys).toHaveBeenCalled()

    // delete mapping
    await testCache.delete('key')
    expect(mockStore.mdel).toHaveBeenCalledWith('key')

    // flush mapping
    await testCache.flush()
    expect(mockStore.mflush).toHaveBeenCalled()
  })

  it('.set checks whether the given value is cacheable', () => {
    // Default
    let testCache = new Cache()
    expect(() => {
      testCache.set('k', 'string')
    }).not.toThrow()
    expect(() => {
      testCache.set('k', 1)
    }).not.toThrow()
    // expect(() => {
    //   testCache.set('k', BigInt(9007199254740991))
    // }).not.toThrow()
    expect(() => {
      testCache.set('k', true)
    }).not.toThrow()
    expect(() => {
      testCache.set('k', { a: 1 })
    }).not.toThrow()
    // expect(() => {
    //   testCache.set('k', Symbol('test'))
    // }).not.toThrow()
    expect(() => {
      testCache.set('k')
    }).toThrow()
    expect(() => {
      testCache.set('k', () => 1)
    }).toThrow()

    // Only type string is cacheable
    const cacheableTypes = ['string']
    testCache = new Cache({
      cacheable: cacheableTypes
    })
    expect(() => {
      testCache.set('k', 'string')
    }).not.toThrow()
    expect(() => {
      testCache.set('k', 1)
    }).toThrow()
    // expect(() => {
    //   testCache.set('k', BigInt(9007199254740991))
    // }).toThrow()
    expect(() => {
      testCache.set('k', true)
    }).toThrow()
    expect(() => {
      testCache.set('k', { a: 1 })
    }).toThrow()
    // expect(() => {
    //   testCache.set('k', Symbol('test'))
    // }).toThrow()
    expect(() => {
      testCache.set('k')
    }).toThrow()
    expect(() => {
      testCache.set('k', () => 1)
    }).toThrow()

    // Cacheable function checks
    const cacheableFunc = jest.fn((value: any) => (value === 1))
    testCache = new Cache({
      cacheable: cacheableFunc
    })
    expect(() => {
      testCache.set('k', 1)
    }).not.toThrow()
    expect(() => {
      testCache.set('k', true)
    }).toThrow()
    expect(cacheableFunc).toHaveBeenCalledTimes(2)
  })
})
