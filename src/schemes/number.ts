import type {BaseSchema} from "./base.js";
import { Number } from 'typebox'

export type NumberSchema = BaseSchema<number>

export function number(): NumberSchema {
  return {
    type: 0,
    schema: Number()
  }
}