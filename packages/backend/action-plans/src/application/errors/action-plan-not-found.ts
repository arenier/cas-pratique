/**
 * Error raised when an action plan cannot be found.
 */
export class ActionPlanNotFound extends Error {
  /**
   * Create a new ActionPlanNotFound error.
   * @param actionPlanId Missing action plan identifier.
   * @param organizationId Organization identifier.
   * @returns ActionPlanNotFound instance.
   * @throws {Error} Never thrown in the current implementation.
   */
  constructor(actionPlanId: string, organizationId: string) {
    super(`Action plan with id "${actionPlanId}" was not found in organization "${organizationId}".`);
    this.name = 'ActionPlanNotFound';
  }
}
