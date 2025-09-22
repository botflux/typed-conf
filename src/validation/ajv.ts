import type { JSONSchema } from "json-schema-to-typescript";
import type {SchemaValidator} from "./validator.js";
import {Ajv, type ErrorObject, type Schema} from "ajv";
import {getValueAtPath} from "../utils.js";

export class AjvSchemaValidator implements SchemaValidator {
  #ajv = new Ajv()

  validate(schema: JSONSchema, toValidate: unknown, name: string): void {
    const isValid = this.#ajv.compile(schema as Schema)

    if (!isValid(toValidate)) {
      throw new Error(this.#formatError(isValid.errors ?? [], toValidate, name))
    }
  }

  #formatError(errorObjects: ErrorObject[], toValidate: unknown, name: string) {
    return errorObjects.map(error => {
      const path = error.instancePath.replace(/^\//, ".").substring(1)
      return `${path} (${name}) ${error.message}, got '${getValueAtPath(toValidate as Record<string, unknown>, path.split("."))}'`
    }).join(", ")
  }
}