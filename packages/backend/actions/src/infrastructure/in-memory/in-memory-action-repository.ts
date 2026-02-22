import { Action, type ActionProps } from '../../domain/aggregates/action';
import type { ActionRepository } from '../../domain/ports/action-repository';

/**
 * Clone a Date instance to avoid shared mutable references.
 * @param value Date to clone.
 * @returns A new Date instance.
 * @throws {Error} Never thrown in the current implementation.
 */
const cloneDate = (value: Date): Date => new Date(value.getTime());

/**
 * Convert an Action aggregate into a serializable snapshot.
 * @param action Action aggregate.
 * @returns Snapshot of action properties.
 * @throws {Error} Never thrown in the current implementation.
 */
const toSnapshot = (action: Action): ActionProps => ({
  id: action.id,
  organizationId: action.organizationId,
  actionPlanId: action.actionPlanId,
  createdByUserId: action.createdByUserId,
  title: action.title,
  description: action.description,
  state: action.state,
  version: action.version,
  createdAt: cloneDate(action.createdAt),
  updatedAt: cloneDate(action.updatedAt),
});

/**
 * Rehydrate an Action aggregate from a snapshot.
 * @param snapshot Snapshot to restore from.
 * @returns Rehydrated Action aggregate.
 * @throws {Error} Never thrown in the current implementation.
 */
const fromSnapshot = (snapshot: ActionProps): Action =>
  Action.rehydrate({
    ...snapshot,
    createdAt: cloneDate(snapshot.createdAt),
    updatedAt: cloneDate(snapshot.updatedAt),
  });

export class InMemoryActionRepository implements ActionRepository {
  private readonly store = new Map<string, Map<string, ActionProps>>();

  /**
   * Fetch an action by organization and action identifiers.
   * @param params Lookup parameters.
   * @param params.organizationId Organization identifier.
   * @param params.actionId Action identifier.
   * @returns The matching action or null when missing.
   * @throws {Error} Never thrown in the current implementation.
   */
  async getById(params: { organizationId: string; actionId: string }): Promise<Action | null> {
    const orgStore = this.store.get(params.organizationId);

    if (!orgStore) {
      return null;
    }

    const snapshot = orgStore.get(params.actionId);

    return snapshot ? fromSnapshot(snapshot) : null;
  }

  /**
   * Persist an action snapshot in memory.
   * @param action Action aggregate.
   * @returns void
   * @throws {Error} Never thrown in the current implementation.
   */
  async save(action: Action): Promise<void> {
    const snapshot = toSnapshot(action);
    const orgStore = this.store.get(snapshot.organizationId) ?? new Map();

    orgStore.set(snapshot.id, snapshot);
    this.store.set(snapshot.organizationId, orgStore);
  }
}
