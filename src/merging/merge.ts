export const kOrigin = Symbol('origin')

/**
 * Merge two objects recursively.
 * The first param is mutated, and the second is not.
 *
 * Arrays are merged, but not their nested items.
 *
 * Also, this function merges a symbol property `kOrigin`.
 *
 * @param a
 * @param b
 */
export function merge(a: Record<string | symbol, unknown>, b: Record<string | symbol, unknown>): Record<string | symbol, unknown> {
  const keys = [ ...Object.keys(b), kOrigin ]

  for (const key of keys) {
    // this case is a but special
    // If you look the top of the function, you'll see that we
    // iterate over the keys, but also over kOrigin.
    // But we don't need to loop over kOrigin while visiting the kOrigin value.
    // Using this condition, we avoid the following result `{ Symbol(origin): { Symbol(origin): undefined } }`
    if (!(key in a) && !(key in b)) continue

    if (!(key in a) || a[key] === undefined) {
      a[key] = b[key]
    }

    if (typeof a[key] === 'object' && typeof b[key] === 'object' && !Array.isArray(a[key]) && !Array.isArray(b[key])) {
      merge(a[key] as Record<string, unknown>, b[key] as Record<string, unknown>)
    }

    if (Array.isArray(a[key]) && Array.isArray(b[key])) {
      a[key] = [...a[key], ...b[key]]
    }
  }

  return a
}