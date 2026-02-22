import { InvalidRoleAssignment } from '../errors/invalid-role-assignment';

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
 * Parse and validate a Role.
 * @param value Candidate value.
 * @returns The validated Role.
 * @throws {InvalidRoleAssignment} If the value is not a known Role.
 */
export const parseRole = (value: string): Role => {
  if (!isRole(value)) {
    throw new InvalidRoleAssignment(value);
  }

  return value;
};

/**
 * Check whether the role is ADMIN.
 * @param role Role to check.
 * @returns True when the role is ADMIN.
 */
export const isAdmin = (role: Role): boolean => role === 'ADMIN';
