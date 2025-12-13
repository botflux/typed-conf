export type Success<T> = readonly [result: T, error: undefined]
export type Failure = readonly [result: undefined, error: { err: unknown }]

export async function inlineCatch<T>(promise: Promise<T>): Promise<Success<T> | Failure> {
  return promise.then(result => [result, undefined] as const).catch(err => [undefined, {err}] as const)
}