import { ConcurrencyConflict } from '../errors/concurrency-conflict';
import { InvalidStateTransition } from '../errors/invalid-state-transition';
import { UnauthorizedActionDeletion } from '../errors/unauthorized-action-deletion';
import { UnauthorizedTransition } from '../errors/unauthorized-transition';
import { ActionState, parseActionState } from '../value-objects/action-state';
import { Role, isAdmin, isManagerOrAdmin } from '@backend/kernel';

export type ActionCreateParams = {
  id: string;
  organizationId: string;
  actionPlanId: string;
  createdByUserId: string;
  title: string;
  description: string;
};

export type ActionProps = ActionCreateParams & {
  state: ActionState;
  version: number;
  createdAt: Date;
  updatedAt: Date;
};

export class Action {
  public readonly id: string;
  public readonly organizationId: string;
  public readonly actionPlanId: string;
  public readonly createdByUserId: string;
  public title: string;
  public description: string;
  public state: ActionState;
  public version: number;
  public readonly createdAt: Date;
  public updatedAt: Date;

  private constructor(props: ActionProps) {
    this.id = props.id;
    this.organizationId = props.organizationId;
    this.actionPlanId = props.actionPlanId;
    this.createdByUserId = props.createdByUserId;
    this.title = props.title;
    this.description = props.description;
    this.state = parseActionState(props.state);
    this.version = props.version;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Create a new Action aggregate in the initial TODO state.
   * @param params Initial action fields.
   * @returns A new Action instance.
   */
  static create(params: ActionCreateParams): Action {
    const now = new Date();

    return new Action({
      ...params,
      state: 'TODO',
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute an Action from persisted properties.
   * @param props Full action properties.
   * @returns A rehydrated Action instance.
   * @throws {InvalidActionStatus} If the stored state is unknown.
   */
  static rehydrate(props: ActionProps): Action {
    return new Action(props);
  }

  /**
   * Move the action from TODO to IN_PROGRESS.
   * @param params Role and expected version for optimistic locking.
   * @param params.role Role of the caller.
   * @param params.expectedVersion Expected current version.
   * @returns void
   * @throws {UnauthorizedTransition} If role is not MANAGER or ADMIN.
   * @throws {InvalidStateTransition} If current state is not TODO.
   * @throws {ConcurrencyConflict} If expected version does not match.
   */
  start(params: { role: Role; expectedVersion: number }): void {
    this.assertRoleForWorkflow(params.role);
    this.assertStateTransition('IN_PROGRESS', ['TODO']);
    this.applyTransition('IN_PROGRESS', params.expectedVersion);
  }

  /**
   * Move the action from IN_PROGRESS to TO_VALIDATE.
   * @param params Role and expected version for optimistic locking.
   * @param params.role Role of the caller.
   * @param params.expectedVersion Expected current version.
   * @returns void
   * @throws {UnauthorizedTransition} If role is not MANAGER or ADMIN.
   * @throws {InvalidStateTransition} If current state is not IN_PROGRESS.
   * @throws {ConcurrencyConflict} If expected version does not match.
   */
  requestValidation(params: { role: Role; expectedVersion: number }): void {
    this.assertRoleForWorkflow(params.role);
    this.assertStateTransition('TO_VALIDATE', ['IN_PROGRESS']);
    this.applyTransition('TO_VALIDATE', params.expectedVersion);
  }

  /**
   * Move the action from TO_VALIDATE to DONE.
   * @param params Role and expected version for optimistic locking.
   * @param params.role Role of the caller.
   * @param params.expectedVersion Expected current version.
   * @returns void
   * @throws {UnauthorizedTransition} If role is not ADMIN.
   * @throws {InvalidStateTransition} If current state is not TO_VALIDATE.
   * @throws {ConcurrencyConflict} If expected version does not match.
   */
  complete(params: { role: Role; expectedVersion: number }): void {
    this.assertRoleForCompletion(params.role);
    this.assertStateTransition('DONE', ['TO_VALIDATE']);
    this.applyTransition('DONE', params.expectedVersion);
  }

  /**
   * Move the action to DELETED from any non-deleted state.
   * @param params Role and expected version for optimistic locking.
   * @param params.role Role of the caller.
   * @param params.expectedVersion Expected current version.
   * @returns void
   * @throws {UnauthorizedActionDeletion} If role is not ADMIN.
   * @throws {InvalidStateTransition} If current state is already DELETED.
   * @throws {ConcurrencyConflict} If expected version does not match.
   */
  delete(params: { role: Role; expectedVersion: number }): void {
    this.assertRoleForDeletion(params.role);
    this.assertStateTransition('DELETED', [
      'TODO',
      'IN_PROGRESS',
      'TO_VALIDATE',
      'DONE',
    ]);
    this.applyTransition('DELETED', params.expectedVersion);
  }

  /**
   * Ensure the caller can perform workflow transitions (MANAGER or ADMIN).
   * @param role Role of the caller.
   * @returns void
   * @throws {UnauthorizedTransition} If role is not MANAGER or ADMIN.
   */
  private assertRoleForWorkflow(role: Role): void {
    if (!isManagerOrAdmin(role)) {
      throw new UnauthorizedTransition(role);
    }
  }

  /**
   * Ensure the caller can complete the action (ADMIN only).
   * @param role Role of the caller.
   * @returns void
   * @throws {UnauthorizedTransition} If role is not ADMIN.
   */
  private assertRoleForCompletion(role: Role): void {
    if (!isAdmin(role)) {
      throw new UnauthorizedTransition(role);
    }
  }

  /**
   * Ensure the caller can delete the action (ADMIN only).
   * @param role Role of the caller.
   * @returns void
   * @throws {UnauthorizedActionDeletion} If role is not ADMIN.
   */
  private assertRoleForDeletion(role: Role): void {
    if (!isAdmin(role)) {
      throw new UnauthorizedActionDeletion(role);
    }
  }

  /**
   * Ensure the current state allows transition to the next state.
   * @param nextState Target state.
   * @param allowedFrom Allowed source states.
   * @returns void
   * @throws {InvalidStateTransition} If current state is not allowed.
   */
  private assertStateTransition(nextState: ActionState, allowedFrom: ActionState[]): void {
    if (!allowedFrom.includes(this.state)) {
      throw new InvalidStateTransition(this.state, nextState);
    }
  }

  /**
   * Ensure the expected version matches the current version.
   * @param expectedVersion Expected current version.
   * @returns void
   * @throws {ConcurrencyConflict} If expected version does not match.
   */
  private assertOptimisticLock(expectedVersion: number): void {
    if (expectedVersion !== this.version) {
      throw new ConcurrencyConflict(expectedVersion, this.version);
    }
  }

  /**
   * Apply a state transition with optimistic locking.
   * @param nextState Target state.
   * @param expectedVersion Expected current version.
   * @returns void
   * @throws {ConcurrencyConflict} If expected version does not match.
   */
  private applyTransition(nextState: ActionState, expectedVersion: number): void {
    this.assertOptimisticLock(expectedVersion);
    this.state = nextState;
    this.version += 1;
    this.updatedAt = new Date();
  }
}
