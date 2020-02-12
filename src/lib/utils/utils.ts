export function cacheOptionValidator (overrideOptions: StrategicCache.CacheOptions = {}): StrategicCache.CacheOptions {
  const defaultOptions: StrategicCache.CacheOptions = {
    maxAgeSeconds: 0,
    maxEntries: 0
  }

  const options = { ...defaultOptions, ...overrideOptions }
  // Verify ttlSeconds
  const { maxAgeSeconds } = options
  if (typeof maxAgeSeconds !== 'number' || maxAgeSeconds < 0) {
    options.maxAgeSeconds = 0
  }

  // Verify maxEntries
  const { maxEntries } = options
  if (typeof maxEntries !== 'number' || maxEntries < 0) {
    options.maxEntries = 0
  }

  return options
}
