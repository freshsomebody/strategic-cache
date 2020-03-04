# Strategic Cache
[![Build Status](https://travis-ci.com/freshsomebody/strategic-cache.svg?branch=master)](https://travis-ci.com/freshsomebody/strategic-cache)

`strategic-cache` is a cache module that equips various [Workbox-like cache strategies](https://developers.google.com/web/tools/workbox/modules/workbox-strategies) to allow you to determine how and when to response and/or update cache data easily. Additionally, its cache implementation is separated from the application interface, which means you can use any cache store you want, as long as it fits with the interface.

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
strategicCache.get('cacheKey').then(data => console.log(data)) // Log 'cacheValue'

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

You can also pass your own store object which should be at least implemented `.get` and `.set` methods. For example:
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
Note that here we directly pass the `maxAgeSeconds` and `maxEntries` to MyStore because strategic-cache cannot know what parameters your store needs.

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

#### cacheOptions.storeMethodMapper: object
If method names of the cache store you are using are not completely the same with strategic-cache's. You can declare in `cacheOptions.storeMethodMapper` to tell strategic-cache how to map them.

By default, `cacheOptions.storeMethodMapper` maps methods as below:
```javascript
{
  get: 'get',
  keys: 'keys',
  set: 'set',
  delete: 'delete',
  flush: 'flush'
}
```
If your cache store, for example, uses `del` instead of `delete` to delete a key. You can declare this difference in `cacheOptions.storeMethodMapper` like:
```javascript
const strategicCache = new StrategicCache({
  store: YOUR_CACHE_STORE,
  storeMethodMapper: {
    delete: 'del'
  }
})
```
strategic-cache will still expose `delete` but actually calls `del` of your cache store to delete the key.
```javascript
strategicCache.delete('cacheKey') // Actually calling YOUR_CACHE_STORE.del('cacheKey')
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

#### cacheOptions.cacheable: string[] | Function
Limits what kinds of values can be set into the cache. You can pass an array with all the cacheable types or a function which checks whether the given value is cacheable. By default, strategic-cache caches everything except types `undefined` and `function`.

By using an array, you can pass the cacheable types in strings of [JavaScript typeof returns](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof#Description) to the array. For example, if you want to cache `string` and `boolean` types of values only, you can set `cacheOptions.cacheable` as:
```javascript
const strategicCache = new StrategicCache({
  cacheable: ['string', 'boolean']
})
```
> **NOTE**: Types `undefined` and `function` will never be cacheable even if you set `cacheOptions.cacheable` with `['undefined', 'function']`

You can also pass a function to define what values are cacheable. strategic-cache will cache a value if the function returns `true`. For example, if you want to cache positive numeric values only, you can set `cacheOptions.cacheable` as:
```javascript
const strategicCache = new StrategicCache({
  cacheable: (value) => {
    return (typeof value === 'number' && value > 0)
  }
})
```

Note that `cacheOptions.cacheable` affects not only the `.set` methods but also the [`get-strategies`](#getoptionsstrategy-stalewhilerevalidate--cachefirst--fetchfirst--fetchonly--cacheonly) which update the cache store. For example:
```javascript
const strategicCache = new StrategicCache({
  cacheable: ['string', 'boolean']
})

strategicCache.set('k1', 'I am a string') // cache sucessfully
strategicCache.set('k2', false) // cache sucessfully
strategicCache.set('k3', 1) // Throw TypeError: 'number' is not a cacheable type

strategicCache.get('k4', {
  strategy: 'FetchFirst',
  fetchFunction: () => 1
})
  .then(cacheData => console.log(cacheData)) // Will fail to resolve
  .catch(error => console.log(error)) // Log TypeError: 'number' is not a cacheable type

```

### Retrieve data
You can use `.get` method to perform various retrieval strategies. strategic-cache provides an easy way for you to wrap you own data fetching function within `getOptions.fetchFunction` and decide when the cache should be updated by `getOptions.strategy`.
```javascript
strategicCache.get(cacheKey: string, getOptions?: Object): Promise<any>
```
Inputs:
- `cacheKey`: string - the key of the cache you would like to get
- `getOptions`: Object - set of options for `.get` method

Returns: **Promise<any>**

> **NOTE**: `.get` method will always return **Promise** no matter what store or strategy you use.

```javascript
getOptions = {
  strategy?: 'StaleWhileRevalidate' | 'CacheFirst' | 'FetchFirst' | 'FetchOnly' | 'CacheOnly',
  fetchFunction?: Function,
  fetchErrorHandler?: Function
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
  fetchErrorHandler: (error) => console.log(error)
})
```
Response with the cached data as quickly as possible if it is a cache hit. Otherwise, it falls back to response with the returns of `getOptions.fetchFunction`. Whether it's a cache hit or miss, `StaleWhileRevalidate` will update the cache with the returns of fetchFunction.
> **NOTE:** `StaleWhileRevalidate` **MUST** work with `getOptions.fetchFunction` and **optionally** works with `getOptions.fetchErrorHandler`

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

#### getOptions.fetchFunction: Function
Your custom function you want strategic-cache to use to update cache or as a fallback. Depending on different strategies you set in [`getOptions.strategy`](#getoptionsstrategy-stalewhilerevalidate--cachefirst--fetchfirst--fetchonly--cacheonly), it will be executed in different conditions.

fetchFunction should return a value since it will be treated as the response of `.get` method or used to update the cache. Otherwise, your cache will always be set to `undefined` and so as the `.get` responses.

Here is an example of forgetting to return
```javascript
async function badFetchFunction () {
  const user = await UserModel.get()
  // Without returning the data
}

// What will happen
let cacheValue1
strategicCache.get('cacheKey1', {
  strategy: 'StaleWhileRevalidate',
  fetchFunction: badFetchFunction
}).then(value => cacheValue1 = value)
// value of cacheKey1 will always be set to undefined

let cacheValue2
strategicCache.get('cacheKey2', {
  strategy: 'NetworkFirst',
  fetchFunction: badFetchFunction
}).then(value => cacheValue2 = value)
// cacheValue2 will always be undefined if badFetchFunction resolves

let fetchedValue
strategicCache.get('cacheKey3', {
  strategy: 'NetworkOnly',
  fetchFunction: badFetchFunction
}).then(value => fetchedValue = value)
// fetchedValue will always be undefined

```
To fix that, remember to return the data in your fetchFunction
```javascript
async function correctFetchFunction () {
  const user = await UserModel.get()
  return user // <- remember to return
}
```

You can also write your fetching logics in an anonymous function, like:
```javascript
const cacheValue1 = strategicCache.get(`usermodel_findname-${id}`, {
  strategy: 'StaleWhileRevalidate',
  fetchFunction: async () => {
    const user = await UserModel.find(id)
    return user.name // <- Remember to return
  }
})
```

#### getOptions.fetchErrorHandler: Function
When using strategy `StaleWhileRevalidate`, `.get` will return cached data immediately if it's a cache hit. As the result, you cannot simply use try/catch the error of your fetchFunction.

It may sometimes be fine to ignore the error of the fetchFunction, but if you want to deal with that, you can assign your handler function to `getOptions.fetchErrorHandler`. It will receive an an Error object if there is an error occured in the fetchFucntion.
```javascript
const cacheValue1 = strategicCache.get('cacheKey', {
  strategy: 'StaleWhileRevalidate',
  fetchFunction: async () => Promise.reject(new Error('Something wrong!')),
  fetchErrorHandler: (error) => console.error(error.message)
})
// Log 'Something wrong!'
```

### Set data
Use `.set` method
```javascript
strategicCache.set(key: string, value: any)
```
- `key`: string - the key to be set
- `value`: the value to be set

### Get all the keys in the cache
Use `.keys` method
```javascript
strategicCache.set('k1', 'v1')
strategicCache.set('k2', 'v2')

console.log(strategicCache.keys()) // ['k1', 'k2']
```

### Delete a key from the cache
Use `.delete` method
```javascript
strategicCache.delete(key: string)
```
- `key`: string - the key to be deleted

### Delete all data in the cache
Use `.flush` method
```javascript
strategicCache.flush()
```
