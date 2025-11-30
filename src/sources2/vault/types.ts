import vault from "node-vault";

export type SecretMetadata = {
  created_time: string
  custom_metadata: unknown
  deletion_time: "" | (string & {})
  destroyed: boolean
  version: number
}

export type VaultSecret = {
  data: Record<string, unknown>
  metadata: SecretMetadata
}

export type VaultResponse = {
  auth: unknown
  data: VaultSecret
  lease_duration: number
  lease_id: "" | (string & {})
  mount_type: string
  renewable: boolean
  request_id: string
  warnings: unknown
  wrap_info: unknown
}

export type VaultOpts = {
  configKey?: string
}

export type InjectOpts = {
  createVaultClient?: typeof vault
}

export type Params = {
  path: string
}

export type StaticNormalizedVaultSecret = {
  type: 'static'
  data: unknown
  mountType: string
  requestId: string
}

export type DynamicNormalizedVaultSecret = {
  type: 'dynamic',
  data: unknown
  mountType: string
  requestId: string
  leaseId: string
  leaseDuration: number
  renewable: boolean
}

export type NormalizedVaultSecret = StaticNormalizedVaultSecret | DynamicNormalizedVaultSecret