interface StoreNode {
  value: unknown,
  lastUpdatedAt: number,
  next: string | null,
  prev: string | null
}

export default class MemoryStore implements StrategicCache.Store {
  store: {
    [key: string]: StoreNode
  }

  maxAgeSeconds: number
  maxEntries: number
  head: string | null
  tail: string | null

  constructor (options: StrategicCache.CacheOptions = {}) {
    this.store = {}
    this.maxAgeSeconds = options.maxAgeSeconds || 0
    this.maxEntries = options.maxEntries || 0

    this.head = null
    this.tail = null
  }

  /**
   * Get the entry value of the given key
   * @param key key of the entry to be got
   * @returns cached value if cache hits; undefined if cache misses
   */
  get (key: string): unknown | undefined {
    if (!this.store[key] || this.isExpired(key) || this.store[key].value === undefined) {
      this.delete(key)
      return undefined
    }
    const { value } = this.store[key]
    // Move this entry to the head
    this.prepend(key, value)
    return value
  }

  /**
   * Return the entry keys in the cache
   */
  keys (): string[] {
    return Object.keys(this.store)
  }

  /**
   * Set the entry value of the given key
   * @param key key of the entry
   * @param value entry value to be set
   */
  set (key: string, value: unknown) {
    if (value === undefined) {
      return
    }

    if (this.maxAgeSeconds > 0 || this.maxEntries > 0) {
      this.deleteStaleEntries()
    }

    this.prepend(key, value)
  }

  /**
   * Prepend an entry to the head of store
   * @param key key of the entry to be prepend to head
   * @param value entry value to be set
   */
  prepend (key: string, value: unknown): Promise<void> {
    // If the key is the head entry already
    // => Set value and lastUpdatedAt
    if (this.head === key) {
      this.store[key].value = value
      this.store[key].lastUpdatedAt = Date.now()
      return
    }

    // Delete the key if exists
    this.delete(key)

    // Set store for the given key
    this.store[key] = {
      value,
      lastUpdatedAt: Date.now(),
      next: null,
      prev: null
    }

    /**
     * If the head entry exists, relink
     * From: head => oldHeadEntry
     * To: head => newEntry <=> oldHeadEntry
     */
    const { head } = this
    if (head !== null) {
      this.store[head].prev = key
      this.store[key].next = head
    }
    this.head = key

    // If the tail entry doesn't exist
    // => Set the given key as the tail entry
    if (this.tail === null) {
      this.tail = key
    }
  }

  /**
   * Delete the entry of the given key
   * @param key key of the entry to be deleted
   */
  delete (key: string): Promise<void> {
    if (!this.store[key]) {
      return
    }

    const { next, prev } = this.store[key]
    /**
     * If prevEntry exists
     * => Link prevEntry.next to nextEntry
     * From: prevEntry <=> entryToDelete <=> nextEntry
     * To: prevEntry.next => nextEntry
     */
    if (prev !== null) {
      this.store[prev].next = next
    } else {
      /**
       * Else
       * => Link head to nextEntry
       * From: head => entryToDelete <=> nextEntry
       * To: head => nextEntry
       */
      this.head = next
    }

    /**
     * If nextEntry exists
     * => Link nextEntry.prev to prevEntry
     * From: prevEntry <=> entryToDelete <=> nextEntry
     * To: prevEntry <= nextEntry.prev
     */
    if (next !== null) {
      this.store[next].prev = prev
    } else {
      /**
       * Else
       * => Link tail to prevEntry
       * From: prevEntry <=> entryToDelete <= tail
       * To: prevEntry <= tail
       */
      this.tail = prev
    }

    // Delete the entry from store
    delete this.store[key]
  }

  /**
   * Delete all entries in the cache
   */
  flush () {
    this.keys().forEach(key => delete this.store[key])
    this.head = null
    this.tail = null
  }

  /**
   * Delete expired and LRU entries
   */
  deleteStaleEntries () {
    if (this.maxAgeSeconds && this.maxAgeSeconds > 0) {
      let cursor = this.tail
      while (cursor !== null && this.isExpired(cursor)) {
        const prevCursor = this.store[cursor].prev
        this.delete(cursor)
        cursor = prevCursor
      }
    }

    if (this.maxEntries &&
      this.maxEntries > 0 &&
      this.keys().length >= this.maxEntries
    ) {
      this.delete(this.tail)
    }
  }

  /**
   * Check whether an entry is expired
   * @param key key of entry to be checked
   */
  isExpired (key: string): boolean {
    if (!this.maxAgeSeconds || this.maxAgeSeconds <= 0) {
      return false
    }
    return this.store[key].lastUpdatedAt < (Date.now() - this.maxAgeSeconds * 1000)
  }
}
