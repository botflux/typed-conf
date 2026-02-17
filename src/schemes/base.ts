import { type TSchema } from 'typebox'

export type BaseSchema<T> = {
  type: T
  schema: TSchema
}