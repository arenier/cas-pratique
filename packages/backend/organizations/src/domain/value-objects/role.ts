import { InvalidRoleAssignment } from '../errors/invalid-role-assignment';
import { Role, isRole } from '@backend/kernel';

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
