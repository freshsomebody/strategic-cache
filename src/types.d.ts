/* eslint @typescript-eslint/no-unused-vars: 0 */

declare namespace StrategicCache {
  interface CacheOptions {
    store?: BuildinStore | { create: (options: CacheOptions) => Store },
    fallbackStore?: BuildinStore | false
    maxAgeSeconds?: number
    maxEntries?: number
  }

  interface GetOptions {
    strategy?: CacheStrategie,
    fetchFunction?: Function,
    fetchErrorFunction?: Function
  }

  /**
   * @todo Find out why ts-jest throws error if using enum
   */
  type BuildinStore = 'memory'
  /*const enum BuildinStoresEnum {
    Memory = 'memory'
  }*/

  /**
   * @todo Find out why ts-jest throws error if using enum
   */
  type CacheStrategie = 'StaleWhileRevalidate' | 'CacheFirst' | 'FetchFirst' | 'FetchOnly' | 'CacheOnly'
  /*enum CacheStrategiesEnum {
    StaleWhileRevalidate,
    CacheFirst,
    FetchFirst,
    FetchOnly,
    CacheOnly
  }*/

  // The minimum requirements of a Store
  interface Store {
    // Get the entry value of the given key
    get(key: string): unknown | undefined | Promise<unknown | undefined>
    // Get all entry keys in a store
    keys(): string[] | Promise<string[]>
    // Set an entry for the given key
    set(key: string, value: unknown): void | Promise<void>
    // Delete the entry of the given key
    delete(key: string): void | Promise<void>
    // Flush all the entry from a store
    flush(): void | Promise<void>
  }

  interface Cache extends Store {
    // Get the entry value of the given key
    get(key: string, options?: GetOptions): Promise<unknown | undefined>
    // Get all entry keys in the cache
    keys(): string[] | Promise<string[]>
    // Set an entry for the given key
    set(key: string, value: unknown): void | Promise<void>
    // Delete the entry of the given key
    delete(key: string): void | Promise<void>
    // Flush all the entry from a store
    flush(): void | Promise<void>
  }
}
