import {kOrigin} from "./merge.js";

export function setOrigin(obj: Record<string | symbol, unknown>, origin: string) {
  const originMap: Record<string, string | string[]> = {}

  for (const field in obj) {
    if (field as string | symbol === kOrigin) continue

    const value = obj[field] as unknown

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      setOrigin(value as Record<string | symbol, unknown>, origin)
      continue
    }

    if (value !== null && Array.isArray(value)) {
      originMap[field] = new Array(value.length).fill(origin)
      continue
    }

    originMap[field] = origin
  }

  if (!(kOrigin in obj)) {
    return Object.defineProperty(obj, kOrigin, {
      value: originMap,
      enumerable: true,
      writable: true,
    })
  }

  obj[kOrigin] = originMap
  return obj
}

export function getOrigin(obj: Record<string | symbol, unknown>) {
  return obj[kOrigin] as Record<string, string> ?? {}
}