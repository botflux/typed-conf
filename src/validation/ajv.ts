import type { JSONSchema } from "json-schema-to-typescript";
import type {SchemaValidator} from "./validator.js";
import {Ajv, type ErrorObject, type Schema} from "ajv";
import {getValueAtPath} from "../utils.js";
import {ValidationError} from "./validation.error.js";

export function formatError(errorObjects: ErrorObject[], toValidate: unknown, name: string) {
  return errorObjects.map(error => {
    const path = error.instancePath.replace(/^\//, ".").substring(1)

    const value = path === ""
      ? toValidate
      : getValueAtPath(toValidate as Record<string, unknown>, error.instancePath.substring(1).split('/'))

    const stringifiedValue = typeof value === "object"
      ? JSON.stringify(value)
      : value

    return path === ''
      ? `${name} ${error.message}, got '${stringifiedValue}'`
      : `${path} (${name}) ${error.message}, got '${stringifiedValue}'`
  }).join(", ")
}

export class AjvSchemaValidator implements SchemaValidator {
  #ajv = new Ajv({ coerceTypes: true, removeAdditional: "all" })

  validate(schema: JSONSchema, toValidate: unknown, name: string): void {
    const isValid = this.#ajv.compile(schema as Schema)

    if (!isValid(toValidate)) {
      throw new ValidationError(formatError(isValid.errors ?? [], toValidate, name))
    }
  }
}