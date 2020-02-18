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
})
