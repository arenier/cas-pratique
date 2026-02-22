import { describe, expect, it } from 'vitest';

import { isAdmin, isRole } from '@repo/backend/kernel';

import { InvalidRoleAssignment } from '../errors/invalid-role-assignment';
import { parseRole } from './role';

describe('Role', () => {
  it('accepts valid roles', () => {
    expect(isRole('USER')).toBe(true);
    expect(isRole('MANAGER')).toBe(true);
    expect(isRole('ADMIN')).toBe(true);
  });

  it('rejects invalid roles', () => {
    expect(isRole('OWNER')).toBe(false);
  });

  it('parses valid roles', () => {
    expect(parseRole('ADMIN')).toBe('ADMIN');
  });

  it('throws on invalid roles', () => {
    expect(() => parseRole('OWNER')).toThrow(InvalidRoleAssignment);
  });

  it('checks admin role', () => {
    expect(isAdmin('ADMIN')).toBe(true);
    expect(isAdmin('MANAGER')).toBe(false);
  });
});
