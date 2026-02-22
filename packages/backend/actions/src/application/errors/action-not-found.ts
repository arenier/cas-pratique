/**
 * Error raised when an action cannot be found.
 */
export class ActionNotFound extends Error {
  /**
   * Create a new ActionNotFound error.
   * @param actionId Missing action identifier.
   * @param organizationId Organization identifier.
   * @returns ActionNotFound instance.
   * @throws {Error} Never thrown in the current implementation.
   */
  constructor(actionId: string, organizationId: string) {
    super(`Action with id "${actionId}" was not found in organization "${organizationId}".`);
    this.name = 'ActionNotFound';
  }
}
