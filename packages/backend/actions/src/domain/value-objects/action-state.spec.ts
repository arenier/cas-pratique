import { describe, expect, it } from 'vitest';

import { InvalidActionStatus } from '../errors/invalid-action-status';
import { isActionState, parseActionState } from './action-state';

describe('ActionState', () => {
  it('accepts valid states', () => {
    expect(isActionState('TODO')).toBe(true);
    expect(isActionState('IN_PROGRESS')).toBe(true);
    expect(isActionState('TO_VALIDATE')).toBe(true);
    expect(isActionState('DONE')).toBe(true);
    expect(isActionState('DELETED')).toBe(true);
  });

  it('rejects invalid states', () => {
    expect(isActionState('INVALID')).toBe(false);
  });

  it('parses valid states', () => {
    expect(parseActionState('TODO')).toBe('TODO');
  });

  it('throws on unknown states', () => {
    expect(() => parseActionState('UNKNOWN')).toThrow(InvalidActionStatus);
  });
});
