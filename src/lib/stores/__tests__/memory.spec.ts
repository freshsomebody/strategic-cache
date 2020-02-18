import MemoryStore from '../memory'

describe('~/lib/stores/memory.ts', () => {
  it('constructor sets states correctly', () => {
    // Default
    let testStore = new MemoryStore()
    expect(testStore.store).toMatchObject({})
    expect(testStore.maxAgeSeconds).toBe(0)
    expect(testStore.maxEntries).toBe(0)
    expect(testStore.head).toBe(null)
    expect(testStore.tail).toBe(null)

    // Valid parameters
    const options: StrategicCache.CacheOptions = {
      maxAgeSeconds: 1,
      maxEntries: 2
    }
    testStore = new MemoryStore(options)
    expect(testStore.maxAgeSeconds).toBe(1)
    expect(testStore.maxEntries).toBe(2)
  })

  it('.set method sets store correctly', () => {
    const testStore = new MemoryStore()
    // add the first entry
    testStore.set('k1', 'v1')
    expect(testStore.store.k1).toBeDefined()
    expect(testStore.store.k1.value).toBe('v1')
    expect(testStore.head).toBe('k1')
    expect(testStore.tail).toBe('k1')

    // Add the second entry
    testStore.set('k2', 'v2')
    expect(testStore.store.k2).toBeDefined()
    expect(testStore.store.k2.value).toBe('v2')
    expect(testStore.head).toBe('k2')
    expect(testStore.tail).toBe('k1')

    // Prevent setting an entry to undefined
    testStore.set('k2')
    expect(testStore.store.k2.value).toBe('v2')
    testStore.set('k2', undefined)
    expect(testStore.store.k2.value).toBe('v2')
  })

  it('.set method deletes expired and LRU entries', () => {
    // Test deleting expired entries
    let options: StrategicCache.CacheOptions = {
      maxAgeSeconds: 60
    }
    let testStore = new MemoryStore(options)
    // Add dummy data
    testStore.set('k1', 'v1')
    testStore.set('k2', 'v2')
    testStore.set('k3', 'v3')
    // Make k1 and k2 expired
    const expiredTimestamp = Date.now() - 120 * 1000
    testStore.store.k1.lastUpdatedAt = expiredTimestamp
    testStore.store.k2.lastUpdatedAt = expiredTimestamp

    testStore.set('k4', 'v4')

    expect(testStore.store.k1).toBeUndefined()
    expect(testStore.store.k2).toBeUndefined()
    expect(testStore.head).toBe('k4')
    expect(testStore.tail).toBe('k3')

    // Test deleting LRU entry
    options = {
      maxEntries: 2
    }
    testStore = new MemoryStore(options)
    testStore.set('k1', 'v1')
    testStore.set('k2', 'v2')
    testStore.set('k3', 'v3')

    expect(testStore.store.k1).toBeUndefined()
    expect(testStore.head).toBe('k3')
    expect(testStore.tail).toBe('k2')
  })

  it('.get method returns correctly', () => {
    let testStore = new MemoryStore()
    // Cache miss
    expect(testStore.get('k1')).toBe(undefined)
    // Cache hit
    testStore.set('k1', 'v1')
    expect(testStore.get('k1')).toBe('v1')

    // Test cache miss on expired entries
    const options: StrategicCache.CacheOptions = {
      maxAgeSeconds: 60
    }
    testStore = new MemoryStore(options)
    testStore.set('k1', 'v1')
    // Make k1 expired
    testStore.store.k1.lastUpdatedAt = Date.now() - 120 * 1000
    expect(testStore.get('k1')).toBe(undefined)
  })

  it('.get method moves entry to head', () => {
    const testStore = new MemoryStore()
    // Add dummy data
    testStore.set('k1', 'v1')
    testStore.set('k2', 'v2')
    testStore.set('k3', 'v3')
    expect(testStore.head).toBe('k3')
    expect(testStore.tail).toBe('k1')

    testStore.get('k1')
    expect(testStore.head).toBe('k1')
    expect(testStore.tail).toBe('k2')

    testStore.get('k2')
    expect(testStore.head).toBe('k2')
    expect(testStore.tail).toBe('k3')
  })

  it('.keys method returns all entries keys', () => {
    const testStore = new MemoryStore()
    // Add dummy data
    testStore.set('k1', 'v1')
    testStore.set('k2', 'v2')
    testStore.set('k3', 'v3')

    expect(testStore.keys()).toEqual(['k1', 'k2', 'k3'])
  })

  it('.delete method deletes the entry of given key', () => {
    const testStore = new MemoryStore()
    // Add dummy data
    // head -> k3 <-> k2 <-> k1 <- tail
    testStore.set('k1', 'v1')
    testStore.set('k2', 'v2')
    testStore.set('k3', 'v3')

    // Test deleting an entry in the middle
    testStore.delete('k2')
    // expect: head -> k3 <-> k1 <- tail
    expect(testStore.store.k2).toBeUndefined()
    expect(testStore.store.k3.next).toBe('k1')
    expect(testStore.store.k1.prev).toBe('k3')

    // Test deleting the head entry
    testStore.set('k2', 'v2')
    // head -> k2 <-> k3 <-> k1 <- tail
    testStore.delete('k2')
    // expect: head -> k3 <-> k1 <- tail
    expect(testStore.head).toBe('k3')
    expect(testStore.store.k3.next).toBe('k1')
    expect(testStore.store.k3.prev).toBeNull()
    expect(testStore.store.k1.prev).toBe('k3')

    // Test deleting the tail entry
    testStore.delete('k1')
    // expect: head -> k3 <- tail
    expect(testStore.store.k1).toBeUndefined()
    expect(testStore.store.k3.next).toBeNull()
    expect(testStore.tail).toBe('k3')

    // Test deleting the only entry
    testStore.delete('k3')
    expect(testStore.store.k3).toBeUndefined()
    expect(testStore.head).toBeNull()
    expect(testStore.tail).toBeNull()
  })

  it('.flush method deletes all entries and resets head, tail', () => {
    const testStore = new MemoryStore()
    // Add dummy data
    testStore.set('k1', 'v1')
    testStore.set('k2', 'v2')
    testStore.set('k3', 'v3')

    testStore.flush()
    expect(testStore.store.k1).toBeUndefined()
    expect(testStore.store.k2).toBeUndefined()
    expect(testStore.store.k3).toBeUndefined()
    expect(testStore.head).toBeNull()
    expect(testStore.tail).toBeNull()
  })
})
