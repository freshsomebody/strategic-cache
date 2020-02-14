import FetchFirst from '../FetchFirst'
import storeFactory, { cachedValue, fetchedValue } from './mocks/storeFactory'

describe('~/lib/strategies/FetchFirst.ts', () => {
  it('returns fetched value if available', async () => {
    const store = storeFactory()
    const mockFetchFunction = jest.fn(() => Promise.resolve(fetchedValue))

    const result = await FetchFirst(store, 'key', mockFetchFunction)
    expect(result).toBe(fetchedValue)
    expect(store.set).toHaveBeenCalledWith('key', fetchedValue)
  })

  it('returns cached value if it fails to fetch', async () => {
    const store = storeFactory()
    const error = new Error('error')
    const mockFetchFunction = jest.fn(() => Promise.reject(error))

    const result = await FetchFirst(store, 'key', mockFetchFunction)
    expect(result).toBe(cachedValue)
  })
})
