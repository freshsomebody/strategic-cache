import { cacheOptionValidator } from './lib/utils/validators'
import { StaleWhileRevalidate, CacheFirst, FetchFirst, FetchOnly } from './lib/strategies'

export default class Cache implements StrategicCache.Cache {
  store: StrategicCache.Store
  storeMethodMapper: StrategicCache.StoreMethodMapper

  constructor (overrideOptions: StrategicCache.CacheOptions = {}) {
    const options = cacheOptionValidator(overrideOptions)

    // Set store
    const { store } = options
    if (typeof store === 'object') {
      this.store = store
    } else {
      let StoreModule = require(`./lib/stores/${store || 'memory'}`)
      StoreModule = StoreModule.default ? StoreModule.default : StoreModule
      this.store = new StoreModule(options)
    }

    // Set storeMethodMapper
    this.storeMethodMapper = options.storeMethodMapper
  }

  async get (key: string, overrideOptions: StrategicCache.GetOptions = {}) {
    const defaultOptions: StrategicCache.GetOptions = {
      strategy: 'CacheOnly',
      fetchFunction: null,
      fetchErrorHandler: null
    }
    const options = { ...defaultOptions, ...overrideOptions }

    const self = this
    const { strategy, fetchFunction } = options
    switch (strategy) {
      case 'StaleWhileRevalidate':
        return StaleWhileRevalidate(self, key, fetchFunction, options.fetchErrorHandler)
      case 'CacheFirst':
        return CacheFirst(self, key, fetchFunction)
      case 'FetchFirst':
        return FetchFirst(self, key, fetchFunction)
      case 'FetchOnly':
        return FetchOnly(fetchFunction)
      case 'CacheOnly':
        return this.store[this.storeMethodMapper.get](key)
      default:
        throw new TypeError(`${strategy} is not a supported strategy`)
    }
  }

  keys (...args: unknown[]) {
    return this.store[this.storeMethodMapper.keys](...args)
  }

  set (key: string, value: unknown) {
    return this.store[this.storeMethodMapper.set](key, value)
  }

  delete (...args: unknown[]) {
    return this.store[this.storeMethodMapper.delete](...args)
  }

  flush (...args: unknown[]) {
    return this.store[this.storeMethodMapper.flush](...args)
  }
}
