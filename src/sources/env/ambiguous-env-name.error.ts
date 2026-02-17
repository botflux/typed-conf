export class AmbiguousEnvNameError extends Error {
  constructor(envName: string, firstEntryPath: string, secondEntryPath: string) {
    super(`Two envs were found with the same name "${envName}". First entry: "${firstEntryPath}". Second entry: "${secondEntryPath}".`)
    this.name = AmbiguousEnvNameError.name
  }
}