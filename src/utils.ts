export function setValueAtPath(o: Record<string, unknown>, path: string[], value: unknown): void {
  const intermediate = path.slice(0, -1)
  const last = path.at(-1)

  if (last === undefined) {
    throw new Error("Path must at least contain one element")
  }

  let tmp = o

  for (const chunk of intermediate) {
    if (tmp[chunk] === undefined) {
      tmp[chunk] = {}
    }

    if (typeof tmp[chunk] !== "object") {
      throw new Error(`Cannot set value at path '${path.join(".")}' because the intermediate value is not an object ${chunk}`)
    }

    tmp = tmp[chunk] as Record<string, unknown>
  }

  Object.defineProperty(tmp, last, {
    value,
    enumerable: true,
    writable: true,
    configurable: true,
  })
}