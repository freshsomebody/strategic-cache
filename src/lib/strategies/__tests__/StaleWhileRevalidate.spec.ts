import StaleWhileRevalidate from '../StaleWhileRevalidate'
import flushPromises from 'flush-promises'
import storeFactory, { cachedValue, fetchedValue } from './mocks/storeFactory'

describe('~/lib/strategies/StaleWhileRevalidate.ts', () => {
  it('throws error if fetchFunction is invalid', async () => {
    const store = storeFactory()

    await expect(StaleWhileRevalidate(store, 'key')).rejects.toThrow()
    await expect(StaleWhileRevalidate(store, 'key', 'not a function')).rejects.toThrow()
  })

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
    // Test cache hit
    let store = storeFactory()
    const error = new Error('error')
    const mockFetchFunction = jest.fn(() => Promise.reject(error))
    const mockFetchErrorHandler1 = jest.fn()

    let result = await StaleWhileRevalidate(store, 'key', mockFetchFunction, mockFetchErrorHandler1)
    await flushPromises()
    expect(result).toBe(cachedValue)
    expect(mockFetchErrorHandler1).toHaveBeenCalledWith(error)

    // Test cache miss
    store = storeFactory({ get: jest.fn(() => undefined) })
    const mockFetchErrorHandler2 = jest.fn()

    result = await StaleWhileRevalidate(store, 'key', mockFetchFunction, mockFetchErrorHandler2)
    await flushPromises()
    expect(result).toBeUndefined()
    expect(mockFetchErrorHandler2).toHaveBeenCalledWith(error)
  })
})
