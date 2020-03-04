import { cacheOptionValidator } from './lib/utils/validators'
import { StaleWhileRevalidate, CacheFirst, FetchFirst, FetchOnly } from './lib/strategies'

export default class Cache implements StrategicCache.Cache {
  store: StrategicCache.Store
  storeMethodMapper: StrategicCache.StoreMethodMapper
  cacheable: StrategicCache.CacheableTypes | StrategicCache.CacheableFunction

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

    this.storeMethodMapper = options.storeMethodMapper
    this.cacheable = options.cacheable
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
    const { cacheable } = this
    const valueType = typeof value
    // Types undefined and function are not cacheable
    if (valueType === 'undefined' || valueType === 'function') {
      throw new TypeError(`'${valueType}' is not a cacheable type.`)
    }

    /**
     * Arguable TypeScript error when using cacheable.includes(valueType)
     * @see https://github.com/microsoft/TypeScript/issues/26255
     * @todo keep track of the issue
     */
    if (Array.isArray(cacheable) && !(cacheable as string[]).includes(valueType)) {
      throw new TypeError(`'${valueType}' is not a cacheable type.`)
    } else if (typeof cacheable === 'function' && !cacheable(value)) {
      throw new TypeError(`'${value}' is not a cacheable value.`)
    }
    return this.store[this.storeMethodMapper.set](key, value)
  }

  delete (...args: unknown[]) {
    return this.store[this.storeMethodMapper.delete](...args)
  }

  flush (...args: unknown[]) {
    return this.store[this.storeMethodMapper.flush](...args)
  }
}
