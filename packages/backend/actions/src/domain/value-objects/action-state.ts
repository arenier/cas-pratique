import { InvalidActionStatus } from '../errors/invalid-action-status';

export const ACTION_STATES = ['TODO', 'IN_PROGRESS', 'TO_VALIDATE', 'DONE', 'DELETED'] as const;

export type ActionState = (typeof ACTION_STATES)[number];

/**
 * Guard for ActionState values.
 * @param value Candidate value.
 * @returns True when the value is a valid ActionState.
 */
export const isActionState = (value: string): value is ActionState =>
  ACTION_STATES.includes(value as ActionState);

/**
 * Parse and validate an ActionState.
 * @param value Candidate value.
 * @returns The validated ActionState.
 * @throws {InvalidActionStatus} If the value is not a known ActionState.
 */
export const parseActionState = (value: string): ActionState => {
  if (!isActionState(value)) {
    throw new InvalidActionStatus(value);
  }

  return value;
};
