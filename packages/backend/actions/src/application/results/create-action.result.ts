import type { ActionSnapshotResult } from './action-snapshot.result';

/**
 * Result returned after creating an action.
 */
export type CreateActionResult = ActionSnapshotResult & {
  /** Action plan identifier. */
  actionPlanId: string;
};
