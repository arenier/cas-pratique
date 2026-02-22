export const ROLES = ['USER', 'MANAGER', 'ADMIN'] as const;

export type Role = (typeof ROLES)[number];

/**
 * Guard for Role values.
 * @param value Candidate value.
 * @returns True when the value is a valid Role.
 */
export const isRole = (value: string): value is Role =>
  ROLES.includes(value as Role);

/**
 * Check whether the role is ADMIN.
 * @param role Role to check.
 * @returns True when the role is ADMIN.
 */
export const isAdmin = (role: Role): boolean => role === 'ADMIN';

/**
 * Check whether the role is MANAGER or ADMIN.
 * @param role Role to check.
 * @returns True when the role is MANAGER or ADMIN.
 */
export const isManagerOrAdmin = (role: Role): boolean =>
  role === 'MANAGER' || role === 'ADMIN';
