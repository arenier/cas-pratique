export class LastAdminInvariantViolation extends Error {
  constructor() {
    super('An organization must have at least one active admin.');
    this.name = 'LastAdminInvariantViolation';
  }
}
