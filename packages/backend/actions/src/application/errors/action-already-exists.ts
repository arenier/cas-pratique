/**
 * Error raised when an action already exists.
 */
export class ActionAlreadyExists extends Error {
  /**
   * Create a new ActionAlreadyExists error.
   * @param actionId Action identifier already in use.
   * @param organizationId Organization identifier.
   * @returns ActionAlreadyExists instance.
   * @throws {Error} Never thrown in the current implementation.
   */
  constructor(actionId: string, organizationId: string) {
    super(`Action with id "${actionId}" already exists in organization "${organizationId}".`);
    this.name = 'ActionAlreadyExists';
  }
}
