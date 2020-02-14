import StaleWhileRevalidate from '../StaleWhileRevalidate'
import flushPromises from 'flush-promises'

describe('~/lib/strategies/strategies.ts', () => {
  const cachedValue = 'cachedValue'
  const fetchedValue = 'fetchedValue'
  function storeFactory (override: Object = {}): StrategicCache.Store {
    const defaultStore: StrategicCache.Store = {
      get: jest.fn(() => cachedValue),
      set: jest.fn(),
      keys: jest.fn(() => []),
      delete: jest.fn(),
      flush: jest.fn()
    }
    return { ...defaultStore, ...override }
  }

  it('returns cached value if cache hit. Then set cache', async () => {
    const store = storeFactory()
    const mockFetchFunction = jest.fn(() => Promise.resolve(fetchedValue))

    const result = await StaleWhileRevalidate(store, 'key', mockFetchFunction)
    expect(result).toBe(cachedValue)
    await flushPromises()
    expect(store.set).toHaveBeenCalledWith('key', fetchedValue)
  })

  it('sets cache with fetched value and returns if cache miss', async () => {
    const store = storeFactory({ get: jest.fn(() => undefined) })
    const mockFetchFunction = jest.fn(() => Promise.resolve(fetchedValue))

    const result = await StaleWhileRevalidate(store, 'key', mockFetchFunction)
    expect(result).toBe(fetchedValue)
    expect(store.set).toHaveBeenCalledWith('key', fetchedValue)
  })

  it('calls fetchErrorHandler if an error occur when fetching', async () => {
    const store = storeFactory()
    const mockFetchFunction = jest.fn(() => Promise.reject('error'))
    const mockFetchErrorFunction = jest.fn()

    const result = await StaleWhileRevalidate(store, 'key', mockFetchFunction, mockFetchErrorFunction)
    await flushPromises()
    expect(mockFetchErrorFunction).toHaveBeenCalledWith('error')
  })
})
