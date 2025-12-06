
export type MergeUnionTypes<T> = (T extends any ? (x: T) => any : never) extends
  (x: infer R) => any ? R : never;

export type ExtractItemFromArray<T> = T extends Array<infer U> ? U : never

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};