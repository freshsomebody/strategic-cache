export const cachedValue = 'cachedValue'
export const fetchedValue = 'fetchedValue'

export default function storeFactory (override: Object = {}): StrategicCache.Store {
  const defaultStore: StrategicCache.Store = {
    get: jest.fn(() => cachedValue),
    set: jest.fn(),
    keys: jest.fn(() => []),
    delete: jest.fn(),
    flush: jest.fn()
  }
  return { ...defaultStore, ...override }
}
