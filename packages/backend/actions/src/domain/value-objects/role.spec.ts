import { describe, expect, it } from 'vitest';

import { isAdmin, isManagerOrAdmin, isRole } from '@repo/backend/kernel';

describe('Role', () => {
  it('accepts valid roles', () => {
    expect(isRole('USER')).toBe(true);
    expect(isRole('MANAGER')).toBe(true);
    expect(isRole('ADMIN')).toBe(true);
  });

  it('rejects invalid roles', () => {
    expect(isRole('ROOT')).toBe(false);
  });

  it('checks admin role', () => {
    expect(isAdmin('ADMIN')).toBe(true);
    expect(isAdmin('MANAGER')).toBe(false);
  });

  it('checks manager or admin role', () => {
    expect(isManagerOrAdmin('MANAGER')).toBe(true);
    expect(isManagerOrAdmin('ADMIN')).toBe(true);
    expect(isManagerOrAdmin('USER')).toBe(false);
  });
});
