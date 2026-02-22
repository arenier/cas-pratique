import { ActionPlan } from '../aggregates/action-plan';

export interface ActionPlanRepository {
  /**
   * Fetch an action plan by organization and action plan identifiers.
   * @param params Lookup parameters.
   * @param params.organizationId Organization identifier.
   * @param params.actionPlanId Action plan identifier.
   * @returns The matching action plan or null when missing.
   * @throws {Error} If the repository cannot read the action plan.
   */
  getById(params: { organizationId: string; actionPlanId: string }): Promise<ActionPlan | null>;

  /**
   * Persist an action plan aggregate.
   * @param actionPlan Action plan to persist.
   * @returns void
   * @throws {Error} If the repository cannot save the action plan.
   */
  save(actionPlan: ActionPlan): Promise<void>;
}
