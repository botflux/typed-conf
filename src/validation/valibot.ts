import type {Validator} from "./validator.js";
import * as v from "valibot"
import {type BaseIssue, undefined} from "valibot"
import {BaseVisitor} from "../visitor/base-visitor.js";
import type {StringSchema} from "../schemes/string.js";
import type {BooleanSchema} from "../schemes/boolean.js";
import type {IntegerSchema} from "../schemes/integer.js";
import type {FloatSchema} from "../schemes/float.js";
import type {SecretSchema} from "../schemes/secret.js";
import type {ObjectSchema, ObjectSpec} from "../schemes/object.js";
import type {RefSchema} from "../schemes/ref.js";

class SchemaBuilder extends BaseVisitor<v.BaseSchema<unknown, unknown, BaseIssue<unknown>>> {
  build(schema: ObjectSchema<ObjectSpec>): v.BaseSchema<unknown, unknown, BaseIssue<unknown>> {
    return this.visitObject(schema)
  }

  visitString(schema: StringSchema): v.BaseSchema<unknown, unknown, BaseIssue<unknown>> {
    return v.string()
  }

  visitInteger(schema: IntegerSchema): v.BaseSchema<unknown, unknown, BaseIssue<unknown>> {
    return v.pipe(v.number(), v.integer())
  }

  visitFloat(schema: FloatSchema): v.BaseSchema<unknown, unknown, BaseIssue<unknown>> {
    return v.number()
  }

  visitBoolean(schema: BooleanSchema): v.BaseSchema<unknown, unknown, BaseIssue<unknown>> {
    return v.boolean()
  }

  visitRef(schema: RefSchema<unknown>): v.BaseSchema<unknown, unknown, BaseIssue<unknown>> {
    return this.visit(schema.targetSchema.schema)
  }

  visitObject(schema: ObjectSchema<ObjectSpec>): v.BaseSchema<unknown, unknown, BaseIssue<unknown>> {
    const props = Object.entries(schema.spec)
      .map(([key, value]) => [ key, this.visit(value.schema) ] as const)

    return v.object(Object.fromEntries(props))
  }

  visitSecret(schema: SecretSchema): v.BaseSchema<unknown, unknown, BaseIssue<unknown>> {
    if (schema.optional) {
      return v.pipe(v.optional(v.string()), v.undefined())
    }

    return v.string()
  }
}

export class ValibotValidator implements Validator {
  builder = new SchemaBuilder()

  validate(schema: ObjectSchema<ObjectSpec>, object: unknown): unknown {
    const valibotSchema = this.builder.build(schema)
    try {
      return v.parse(valibotSchema, object)
    } catch (e: unknown) {
      throw e
    }
  }
}