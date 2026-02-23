import type { ActionState } from '../../domain/value-objects/action-state';

/**
 * Snapshot of an action after a state change.
 */
export type ActionSnapshotResult = {
  /** Action identifier. */
  actionId: string;
  /** Current action state. */
  state: ActionState;
  /** Current optimistic lock version. */
  version: number;
  /** Last update timestamp. */
  updatedAt: Date;
};
