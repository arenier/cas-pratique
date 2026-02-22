import { Action } from '../aggregates/action';

export interface ActionRepository {
  /**
   * Fetch an action by organization and action identifiers.
   * @param params Lookup parameters.
   * @param params.organizationId Organization identifier.
   * @param params.actionId Action identifier.
   * @returns The matching action or null when missing.
   * @throws {Error} If the repository cannot read the action.
   */
  getById(params: { organizationId: string; actionId: string }): Promise<Action | null>;

  /**
   * Persist an action aggregate.
   * @param action Action to persist.
   * @returns void
   * @throws {Error} If the repository cannot save the action.
   */
  save(action: Action): Promise<void>;
}
