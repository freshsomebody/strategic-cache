import { cacheOptionValidator } from './lib/utils/validators'
import { StaleWhileRevalidate, CacheFirst, FetchFirst, FetchOnly, CacheOnly } from './lib/strategies'

export default class Cache implements StrategicCache.Cache {
  store: StrategicCache.Store

  constructor (overrideOptions: StrategicCache.CacheOptions = {}) {
    const options = cacheOptionValidator(overrideOptions)

    const { store } = options
    if (typeof store === 'object') {
      this.store = store.create(options)
    } else {
      const storeModule = require(`./lib/stores/${store || 'memory'}`)
      this.store = storeModule.create ? storeModule.create(options) : storeModule.default.create(options)
    }
  }

  async get (key: string, overrideOptions: StrategicCache.GetOptions = {}) {
    const defaultOptions: StrategicCache.GetOptions = {
      strategy: 'CacheOnly',
      fetchFunction: null,
      fetchErrorFunction: null
    }
    const options = { ...defaultOptions, ...overrideOptions }

    const { strategy, fetchFunction } = options
    switch (strategy) {
      case 'StaleWhileRevalidate':
        return StaleWhileRevalidate(this.store, key, fetchFunction, options.fetchErrorFunction)
      case 'CacheFirst':
        return CacheFirst(this.store, key, fetchFunction)
      case 'FetchFirst':
        return FetchFirst(this.store, key, fetchFunction)
      case 'FetchOnly':
        return FetchOnly(fetchFunction)
      case 'CacheOnly':
        return CacheOnly(this.store, key)
      default:
        throw new TypeError(`${strategy} is not a supported strategy`)
    }
  }

  keys () {
    return this.store.keys()
  }

  set (key: string, value: unknown) {
    return this.store.set(key, value)
  }

  delete (key: string) {
    return this.store.delete(key)
  }

  flush () {
    return this.store.flush()
  }
}
