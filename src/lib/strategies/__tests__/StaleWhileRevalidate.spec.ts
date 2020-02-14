import StaleWhileRevalidate from '../StaleWhileRevalidate'
import flushPromises from 'flush-promises'
import storeFactory, { cachedValue, fetchedValue } from './mocks/storeFactory'

describe('~/lib/strategies/strategies.ts', () => {
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
