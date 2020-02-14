import FetchOnly from '../FetchOnly'
import { fetchedValue } from './mocks/storeFactory'

describe('~/lib/strategies/FetchOnly.ts', () => {
  it('returns fetched value', async () => {
    const mockFetchFunction = jest.fn(() => Promise.resolve(fetchedValue))
    const result = await FetchOnly(mockFetchFunction)
    expect(result).toBe(fetchedValue)
  })
})
