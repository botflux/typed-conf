import type {Validator} from "./validator.js";
import type {Visitor} from "../visitor/visitor.js";
import * as v from "valibot"
import * as t from "../schemes.js"
import {type BaseIssue, isValiError, type ValiError} from "valibot";
import {BaseVisitor} from "../visitor/base-visitor.js";
import type {ConfigWithMetadata} from "../sources/source.js";
import {getSourceMetadata} from "../sources/metadata-utils.js";
import {flatten} from "../schemes.js";

class SchemaBuilder extends BaseVisitor<v.BaseSchema<unknown, unknown, BaseIssue<unknown>>> {
  build(schema: t.ObjectSchema<t.ObjectSpec>): v.BaseSchema<unknown, unknown, BaseIssue<unknown>> {
    return this.visitObject(schema)
  }

  visitString(schema: t.StringSchema): v.BaseSchema<unknown, unknown, BaseIssue<unknown>> {
    return v.string()
  }

  visitInteger(schema: t.IntegerSchema): v.BaseSchema<unknown, unknown, BaseIssue<unknown>> {
    return v.pipe(v.number(), v.integer())
  }

  visitFloat(schema: t.FloatSchema): v.BaseSchema<unknown, unknown, BaseIssue<unknown>> {
    return v.number()
  }

  visitBoolean(schema: t.BooleanSchema): v.BaseSchema<unknown, unknown, BaseIssue<unknown>> {
    return v.boolean()
  }

  visitObject(schema: t.ObjectSchema<t.ObjectSpec>): v.BaseSchema<unknown, unknown, BaseIssue<unknown>> {
    const props = Object.entries(schema.spec)
      .map(([key, value]) => [ key, this.visit(value.schema) ] as const)

    return v.object(Object.fromEntries(props))
  }

  visitSecret(schema: t.SecretSchema): v.BaseSchema<unknown, unknown, BaseIssue<unknown>> {
    if (schema.optional) {
      return v.optional(v.string())
    }

    return v.string()
  }
}

export class ValibotValidator implements Validator {
  builder = new SchemaBuilder()

  validate(schema: t.ObjectSchema<t.ObjectSpec>, object: unknown, metadata?: ConfigWithMetadata): unknown {
    const valibotSchema = this.builder.build(schema)
    try {
      return v.parse(valibotSchema, object)
    } catch (e: unknown) {
      if (isValiError(e) && metadata) {
        throw this.#enhanceError(e, metadata, schema)
      }
      throw e
    }
  }

  #enhanceError(error: ValiError<any>, metadata: ConfigWithMetadata, schema: t.ObjectSchema<t.ObjectSpec>): Error {
    const issues = error.issues
    if (issues.length === 0) {
      return error
    }

    const firstIssue = issues[0]
    const path = firstIssue.path?.map((p: any) => p.key).filter((k: any) => typeof k === "string") || []
    
    const sourceMetadata = getSourceMetadata(metadata, path)
    if (!sourceMetadata) {
      return error
    }

    const fieldName = sourceMetadata.originalNameInSource
    const sourceName = sourceMetadata.source
    let receivedValue = firstIssue.received
    if (typeof receivedValue === "string") {
      // Strip surrounding quotes if they exist
      receivedValue = receivedValue.replace(/^"(.*)"$/, '$1')
    }
    const expectedType = this.#getExpectedType(firstIssue, issues, schema, path)

    const enhancedMessage = `Expected '${fieldName}' (${sourceName}) to be ${expectedType}, got '${receivedValue}'`
    
    return new Error(enhancedMessage)
  }

  #getExpectedType(issue: BaseIssue<unknown>, allIssues: BaseIssue<unknown>[], schema: t.ObjectSchema<t.ObjectSpec>, path: string[]): string {
    // Look up the actual schema type for this field
    const entries = flatten(schema)
    const entry = entries.find(e => e.key.join(".") === path.join("."))
    
    if (entry && "type" in entry.value) {
      const schemaType = (entry.value as any).type
      if (schemaType === "integer") {
        return "an integer"
      }
      if (schemaType === "float") {
        return "a number"
      }
      if (schemaType === "string") {
        return "a string"
      }
      if (schemaType === "boolean") {
        return "a boolean"
      }
    }
    
    // Fallback to issue-based detection
    const hasIntegerIssue = allIssues.some(i => i.message?.includes("integer") || i.type === "integer")
    if (hasIntegerIssue) {
      return "an integer"
    }
    
    if (issue.message?.includes("integer")) {
      return "an integer"
    }
    
    switch (issue.type) {
      case "string":
        return "a string"
      case "number":
        return "a number"
      case "integer":
        return "an integer"
      case "boolean":
        return "a boolean"
      default:
        return issue.expected || "a valid value"
    }
  }
}