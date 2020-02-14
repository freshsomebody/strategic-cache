/**
 * Get value from fetchFunction only
 * @see https://developers.google.com/web/tools/workbox/modules/workbox-strategies#network_only
 * @param fetchFunction  function for fetching value
 */
export default async function FetchOnly (fetchFunction: Function) {
  return fetchFunction()
}
