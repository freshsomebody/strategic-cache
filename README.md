# Strategic Cache (Developing)
`strategic-cache` is a cache module that equips various [Workbox-like cache strategies](https://developers.google.com/web/tools/workbox/modules/workbox-strategies) to allow you to determine how and when to response and/or update cache data easily. Besides, its cache implementation is separated from the application interface, which means you can use any cache store you want, as long as it fits with the interface.

## Installation
```shell
npm install strategic-cache
```

## Basic usage
Here just shows the most basic usage (without giving any options) of strategic-cache. More details are introduced in the next section.
```javascript
// via ES6 ↓
import StrategicCache from 'strategic-cache'
// or via commonJS ↓
// const StrategicCache = require('strategic-cache').default

// Create a default StrategicCache
const strategicCache = new strategicCache()

// Set data to the cache
strategicCache.set('cacheKey', 'cacheValue')

// Get data from the cache by strategy 'CacheOnly'
const data = strategicCache.get('cacheKey')
console.log(data) // log 'cacheValue'

// Get all cache keys
const keys = strategicCache.keys()
console.log(keys) // log ['cacheKey']

// Delete a datum in the cache
strategicCache.delete('cacheKey')

// Delete all data in the cache
strategicCache.flush()
```

## API
### Create the cache
Once you import (or require) strategic-cache
via ES6
```javascript
import StrategicCache from 'strategic-cache'
```
or via commonJS 
```javascript
const StrategicCache = require('strategic-cache').default
```
You can create your strategicCache by:
```javascript
const strategicCache = new StrategicCache(cacheOptions?)
```
The optional `cacheOptions` contains following properties:
```javascript
cacheOptions = {
  store?: 'memory' | Object,
  fallbackStore?: 'memory' | false,
  maxAgeSeconds?: number,
  maxEntries?: number
}
```
#### cacheOptions.store: 'memory' | Object
The store you expect strategic-cache to use. It is `'memory'` in default which means to use the build-in memory store.

You can also pass your own store object which should be at least implemented .get and .set methods. For example:
```javascript
// myStore.js
export default class MyStore {
  store
  maxAgeSeconds
  maxEntries

  constructor (options) {
    store = {}
    maxAgeSeconds = options.maxAgeSeconds || 0
    maxEntries = options.maxEntries || 0
  }

  get () { /* Your 'get' implementation */ }
  set () { /* Your 'set' implementation */ }
  // Preferably, also implement 'keys', 'delete' and 'flush' methods
  keys () { /* Your 'keys' implementation */ }
  delete () { /* Your 'delete' implementation */ }
  flush () { /* Your 'flush' implementation */ }
}
```
Then pass it to the strategic-cache in your program:
```javascript
import StrategicCache from 'strategic-cache'
import MyStore from 'MyStore'

const myCache = new StrategicCache({
  store: new MyStore({
    maxAgeSeconds: 60,
    maxEntries: 40
  })
})
```

#### cacheOptions.fallbackStore: 'memory' | false
When cacheOptions.store is invalid, strategic-cache will try to create the cache with the fallbackStore. It is `'memory'` in default which means to use build-in memory store as the fallbackStore.

If you set cacheOptions.fallbackStore to false, strategic-cache will throw error immediately when it fails to create the cache with the given cacheOptions.store.
```javascript
const strategicCache = new StrategicCache({
  store: 'invalid store',
  fallbackStore: false
})
// Throw TypeError
```

#### cacheOptions.maxAgeSeconds: number
The maximum age of a cache entry in seconds. It is `0` in default which means maxAgeSeconds disabled.
```javascript
const strategicCache = new StrategicCache({
  maxAgeSeconds: 60 * 60 * 24 // 1 day
})
```

#### cacheOptions.maxEntries: number
The maximum etnries allowed in the cache. It is `0` in default which means maxEntries disabled
```javascript
const strategicCache = new StrategicCache({
  maxEntries: 40
})
```

### Retrieve data
You can use `.get` method to perform various retrieval strategies. strategic-cache provides an easy way for you to wrap you own data fetching function within `getOptions.fetchFunction` and decide when the cache should be updated by `getOptions.strategy`.
```javascript
strategicCache.get(cacheKey: string, getOptions?: Object)
```
- cacheKey: string - the key of the cache you would like to get
- getOptions: Object - set of options for `.get` method
```javascript
getOptions = {
  strategy?: 'StaleWhileRevalidate' | 'CacheFirst' | 'FetchFirst' | 'FetchOnly' | 'CacheOnly',
  fetchFunction?: Function,
  fetchErrorFunction?: Function
}
```

#### getOptions.strategy: 'StaleWhileRevalidate' | 'CacheFirst' | 'FetchFirst' | 'FetchOnly' | 'CacheOnly'
The cache strategy you want to perform when retrieving data, and it accepts either **'StaleWhileRevalidate', 'CacheFirst', 'FetchFirst', 'FetchOnly'** or **'CacheOnly'**. If nothing is assigned, it will use 'CacheOnly' by default.

The strategy mechanisms are implemented based on [Workbox strategis](https://developers.google.com/web/tools/workbox/modules/workbox-strategies). [Workbox docs](https://developers.google.com/web/tools/workbox/modules/workbox-strategies) has elegant graphs and introductions of each strategy. We recommend you to read that together with this section.

- `StaleWhileRevalidate` (map to [Workbox StaleWhileRevalidate](https://developers.google.com/web/tools/workbox/modules/workbox-strategies#stale-while-revalidate))
```javascript
strategicCache.get('cacheKey', {
  strategy: 'StaleWhileRevalidate',
  fetchFunction: () => 'fetchedValue',
  fetchErrorFunction: (error) => console.log(error)
})
```
Response with the cached data as quickly as possible if it is a cache hit. Otherwise, it falls back to response with the returns of `getOptions.fetchFunction`. Whether it's a cache hit or miss, `StaleWhileRevalidate` will update the cache with the returns of fetchFunction.
> **NOTE:** `StaleWhileRevalidate` **MUST** work with `getOptions.fetchFunction` and **optionally** works with `getOptions.fetchErrorFunction`

- `CacheFirst` (map to [Workbox CacheFirst](https://developers.google.com/web/tools/workbox/modules/workbox-strategies#cache_first_cache_falling_back_to_network))
```javascript
strategicCache.get('cacheKey', {
  strategy: 'CacheFirst',
  fetchFunction: () => 'fetchedValue'
})
```
Reponse with the cached data if it is a cache hit, `getOptions.fetchFunction` will not be used at all. Otherwise, if the data is not cached, CacheFirst will update the cache by the returns of fetchFunction and response with it.

- `FetchFirst` (map to [Workbox NetworkFirst](https://developers.google.com/web/tools/workbox/modules/workbox-strategies#network_first_network_falling_back_to_cache))
```javascript
strategicCache.get('cacheKey', {
  strategy: 'FetchFirst',
  fetchFunction: () => 'fetchedValue'
})
```
Reponse with the returns of `getOptions.fetchFunction` and update the cache data with it. Cache data will only be used if the fetchFunction is unavailable or fails to execute.

- `FetchOnly` (map to [Workbox NetworkOnly](https://developers.google.com/web/tools/workbox/modules/workbox-strategies#network_only))
```javascript
strategicCache.get('cacheKey', {
  strategy: 'FetchOnly',
  fetchFunction: () => 'fetchedValue'
})
```
Reponse only with the returns of `getOptions.fetchFunction`. Cache data will **never** be used.

- `CacheOnly` (map to [Workbox CacheOnly](https://developers.google.com/web/tools/workbox/modules/workbox-strategies#cache_only))
```javascript
strategicCache.get('cacheKey', {
  strategy: 'CacheOnly'
})
```
Response only with the cached data. Note that `getOptions.fetchFunction` is not needed for this strategy since it will never be used.

... Document constructing ...
