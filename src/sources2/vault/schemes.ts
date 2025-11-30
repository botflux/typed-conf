import {object} from "../../schemes2/object.js";
import {string} from "../../schemes2/string.js";
import {fatUnion} from "../../schemes2/fat-union.js";
import type {BaseSchema} from "../../schemes2/base.js";
import {boolean} from "../../schemes2/boolean.js";
import {integer} from "../../schemes2/integer.js";

export const kVault = Symbol('kVault')

export const vaultConfig = object({
  endpoint: string(),
  auth: fatUnion({
    token: string()
  })
}, {
  metadata: {
    [kVault]: true
  }
})

export function isVaultConfig(schema: BaseSchema<unknown>): schema is typeof vaultConfig {
  if (!('type' in schema) || schema.type !== 'object') {
    return false
  }

  return 'metadata' in schema
    && typeof schema.metadata === "object" && schema.metadata !== null
    && kVault in schema.metadata && schema.metadata[kVault] === true
}

export const vaultReadResponseSchema = object({
  request_id: string(),
  lease_id: string(),
  renewable: boolean(),
  lease_duration: integer(),
  data: object({}, {additionalProperties: true}),
  mount_type: string()
}, {additionalProperties: true})