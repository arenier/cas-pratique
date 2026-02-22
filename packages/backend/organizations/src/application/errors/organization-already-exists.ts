/**
 * Error raised when attempting to create an organization that already exists.
 */
export class OrganizationAlreadyExists extends Error {
  /**
   * Create a new OrganizationAlreadyExists error.
   * @param organizationId Organization identifier already in use.
   * @returns OrganizationAlreadyExists instance.
   * @throws {Error} Never thrown in the current implementation.
   */
  constructor(organizationId: string) {
    super(`Organization with id "${organizationId}" already exists.`);
    this.name = 'OrganizationAlreadyExists';
  }
}
