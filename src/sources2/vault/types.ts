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
