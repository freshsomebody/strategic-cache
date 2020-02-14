import CacheFirst from '../CacheFirst'
import storeFactory, { cachedValue, fetchedValue } from './mocks/storeFactory'

describe('~/lib/strategies/CacheFirst.ts', () => {
  it('returns cached value if cache hits', async () => {
    const store = storeFactory()
    const mockFetchFunction = jest.fn(() => Promise.resolve(fetchedValue))

    const result = await CacheFirst(store, 'key', mockFetchFunction)
    expect(result).toBe(cachedValue)
    expect(mockFetchFunction).not.toHaveBeenCalled()
  })

  it('returns fetched value if cache misses and updates cache by fetched value', async () => {
    const store = storeFactory({ get: jest.fn(() => undefined) })
    const mockFetchFunction = jest.fn(() => Promise.resolve(fetchedValue))

    const result = await CacheFirst(store, 'key', mockFetchFunction)
    expect(result).toBe(fetchedValue)
    expect(mockFetchFunction).toHaveBeenCalled()
    expect(store.set).toHaveBeenCalledWith('key', fetchedValue)
  })
})
