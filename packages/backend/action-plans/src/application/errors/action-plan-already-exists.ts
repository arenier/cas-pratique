/**
 * Error raised when an action plan already exists.
 */
export class ActionPlanAlreadyExists extends Error {
  /**
   * Create a new ActionPlanAlreadyExists error.
   * @param actionPlanId Action plan identifier already in use.
   * @param organizationId Organization identifier.
   * @returns ActionPlanAlreadyExists instance.
   * @throws {Error} Never thrown in the current implementation.
   */
  constructor(actionPlanId: string, organizationId: string) {
    super(`Action plan with id "${actionPlanId}" already exists in organization "${organizationId}".`);
    this.name = 'ActionPlanAlreadyExists';
  }
}
