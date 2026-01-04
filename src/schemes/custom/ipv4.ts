import {type BaseSchema, kType} from "../base.js";
import type {Alias} from "../../alias.js";
import {String} from "@sinclair/typebox";

export type IpV4Schema = BaseSchema<string> & {
  type: 'ipv4',
}

function coerce(value: unknown) {
  return value
}

export type IpV4SchemaOpts = {
  aliases?: Alias[]
  defaultValue?: string
  deprecated?: boolean
}

export function ipv4(opts: IpV4SchemaOpts = {}): IpV4Schema {
  const {aliases = [], defaultValue, deprecated = false} = opts

  return {
    type: 'ipv4',
    jsonSchema: {
      type: 'string',
      format: 'ipv4',
      ...deprecated && { deprecated: true }
    },
    aliases,
    deprecated,
    [kType]: '',
    coerce,
    ...defaultValue !== undefined && {defaultValue},
    validationSchema: String({
      format: 'ipv4'
    })
  }
}