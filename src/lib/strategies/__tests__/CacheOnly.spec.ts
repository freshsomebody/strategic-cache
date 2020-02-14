import CacheOnly from '../CacheOnly'
import storeFactory, { cachedValue } from './mocks/storeFactory'

describe('~/lib/strategies/CacheOnly.ts', () => {
  it('returns cached value', async () => {
    const store = storeFactory()
    const result = await CacheOnly(store, 'key')
    expect(result).toBe(cachedValue)
  })
})
