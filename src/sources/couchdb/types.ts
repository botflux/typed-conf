export type AnyDoc = Record<string, unknown>
export type InjectOpts = undefined
export type LoadSingleOpts = Record<string, unknown>
export type LoadViewOpts = {
  designDocument: string
  viewName: string
}
export type LoadOpts = {
  url: string
  collection: string
  documentId: string
  view?: LoadViewOpts
}