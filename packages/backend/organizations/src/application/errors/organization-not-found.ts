/**
 * Error raised when an organization cannot be found.
 */
export class OrganizationNotFound extends Error {
  /**
   * Create a new OrganizationNotFound error.
   * @param organizationId Missing organization identifier.
   * @returns OrganizationNotFound instance.
   * @throws {Error} Never thrown in the current implementation.
   */
  constructor(organizationId: string) {
    super(`Organization with id "${organizationId}" was not found.`);
    this.name = 'OrganizationNotFound';
  }
}
