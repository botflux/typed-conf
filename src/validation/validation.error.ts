export class ValidationError extends Error {
  name = ValidationError.name

  constructor(message: string) {
    super(message);
  }
}