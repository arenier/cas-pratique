import { ActionPlan, type ActionPlanProps } from '../../domain/aggregates/action-plan';
import type { ActionPlanRepository } from '../../domain/ports/action-plan-repository';

/**
 * Clone a Date instance to avoid shared mutable references.
 * @param value Date to clone.
 * @returns A new Date instance.
 * @throws {Error} Never thrown in the current implementation.
 */
const cloneDate = (value: Date): Date => new Date(value.getTime());

/**
 * Convert an ActionPlan aggregate into a serializable snapshot.
 * @param actionPlan Action plan aggregate.
 * @returns Snapshot of action plan properties.
 * @throws {Error} Never thrown in the current implementation.
 */
const toSnapshot = (actionPlan: ActionPlan): ActionPlanProps => ({
  id: actionPlan.id,
  organizationId: actionPlan.organizationId,
  createdByUserId: actionPlan.createdByUserId,
  title: actionPlan.title,
  description: actionPlan.description,
  createdAt: cloneDate(actionPlan.createdAt),
  updatedAt: cloneDate(actionPlan.updatedAt),
});

/**
 * Rehydrate an ActionPlan aggregate from a snapshot.
 * @param snapshot Snapshot to restore from.
 * @returns Rehydrated ActionPlan aggregate.
 * @throws {Error} Never thrown in the current implementation.
 */
const fromSnapshot = (snapshot: ActionPlanProps): ActionPlan =>
  ActionPlan.rehydrate({
    ...snapshot,
    createdAt: cloneDate(snapshot.createdAt),
    updatedAt: cloneDate(snapshot.updatedAt),
  });

export class InMemoryActionPlanRepository implements ActionPlanRepository {
  private readonly store = new Map<string, Map<string, ActionPlanProps>>();

  /**
   * Fetch an action plan by organization and action plan identifiers.
   * @param params Lookup parameters.
   * @param params.organizationId Organization identifier.
   * @param params.actionPlanId Action plan identifier.
   * @returns The matching action plan or null when missing.
   * @throws {Error} Never thrown in the current implementation.
   */
  async getById(params: {
    organizationId: string;
    actionPlanId: string;
  }): Promise<ActionPlan | null> {
    const orgStore = this.store.get(params.organizationId);

    if (!orgStore) {
      return null;
    }

    const snapshot = orgStore.get(params.actionPlanId);

    return snapshot ? fromSnapshot(snapshot) : null;
  }

  /**
   * Persist an action plan snapshot in memory.
   * @param actionPlan Action plan aggregate.
   * @returns void
   * @throws {Error} Never thrown in the current implementation.
   */
  async save(actionPlan: ActionPlan): Promise<void> {
    const snapshot = toSnapshot(actionPlan);
    const orgStore = this.store.get(snapshot.organizationId) ?? new Map();

    orgStore.set(snapshot.id, snapshot);
    this.store.set(snapshot.organizationId, orgStore);
  }
}
