import type {Validator} from "./validator.js";
import type {Visitor} from "../visitor/visitor.js";
import * as v from "valibot"
import * as t from "../schemes.js"
import type {BaseIssue} from "valibot";
import {BaseVisitor} from "../visitor/base-visitor.js";

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

  validate(schema: t.ObjectSchema<t.ObjectSpec>, object: unknown): unknown {
    const valibotSchema = this.builder.build(schema)
    return v.parse(valibotSchema, object)
  }
}