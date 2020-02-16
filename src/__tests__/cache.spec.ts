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
      create: jest.fn()
    }
    let cacheOption: StrategicCache.CacheOptions = {
      store: mockStore,
      fallbackStore: 'memory',
      maxAgeSeconds: 60,
      maxEntries: 3
    }
    testCache = new Cache(cacheOption)
    expect(mockStore.create).toHaveBeenCalledWith(cacheOption)

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
    const fetchErrorFunction = jest.fn()
    const getOptions: StrategicCache.GetOptions = {
      strategy: 'StaleWhileRevalidate',
      fetchFunction,
      fetchErrorFunction
    }
    const result = await testCache.get('key', getOptions)
    expect(result).toBe(swrResult)
    expect(strategies.StaleWhileRevalidate).toHaveBeenCalledWith(testCache.store, 'key', fetchFunction, fetchErrorFunction)
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
    expect(strategies.CacheFirst).toHaveBeenCalledWith(testCache.store, 'key', fetchFunction)
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
    expect(strategies.FetchFirst).toHaveBeenCalledWith(testCache.store, 'key', fetchFunction)
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

  it('.get calls CacheOnly by default', async () => {
    const testCache = new Cache()
    const result = await testCache.get('key')
    expect(result).toBe(cacheOnlyResult)
    expect(strategies.CacheOnly).toHaveBeenCalledWith(testCache.store, 'key')
  })

  it('.get calls CacheOnly if specified', async () => {
    const testCache = new Cache()
    const getOptions: StrategicCache.GetOptions = {
      strategy: 'CacheOnly'
    }
    const result = await testCache.get('key', getOptions)
    expect(result).toBe(cacheOnlyResult)
    expect(strategies.CacheOnly).toHaveBeenCalledWith(testCache.store, 'key')
  })
})
