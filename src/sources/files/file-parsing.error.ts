export class FileParsingError extends Error {
  constructor(filename: string, expectedFormat: string, opts?: ErrorOptions) {
    super(`Cannot parse '${filename}' as it not a valid ${expectedFormat}. Take a look at the error cause.`, opts);
  }
}