import {AjvValidator} from "./validator.js";
import {type BaseSchema, kType} from "../schemes2/base.js";
import {getValueAtPath} from "../utils.js";

export function getTypeSafeValueAtPathFactory(validator: AjvValidator) {
  return function getTypeSafeValueAtPath<Schema extends BaseSchema<unknown>>(
    obj: Record<string | symbol, unknown>,
    path: string[],
    schema: Schema
  ): Schema[typeof kType] {
    const value = getValueAtPath(obj, path)

    validator.validate(schema, () => schema.jsonSchema, value)
    return value
  }
}