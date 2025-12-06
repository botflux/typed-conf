import {object} from "../../schemes/object.js";
import {string} from "../../schemes/string.js";
import {fatUnion} from "../../schemes/fat-union.js";
import type {BaseSchema} from "../../schemes/base.js";
import {boolean} from "../../schemes/boolean.js";
import {integer} from "../../schemes/integer.js";

export const kVault = Symbol('kVault')

export const vaultConfig = object({
  endpoint: string(),
  auth: fatUnion({
    token: string(),
    userpass: object({
      username: string(),
      password: string(),
    }),
    kubernetes: object({
      role: string(),
      jwt: string(),
    })
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

export const vaultAuthResponseSchema = object({
  auth: object({
    client_token: string(),
  }, {
    additionalProperties: true,
  })
}, {
  additionalProperties: true,
})