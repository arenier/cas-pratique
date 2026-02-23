import { IsEmail, IsIn, IsNotEmpty, IsString } from 'class-validator';

import { ROLES } from '@repo/backend/kernel';

/**
 * DTO for inviting a user to an organization.
 */
export class InviteUserDto {
  /** Invited user identifier. */
  @IsString()
  @IsNotEmpty()
  userId!: string;

  /** Invited user email address. */
  @IsEmail()
  email!: string;

  /** Role to assign to the invited user. */
  @IsIn(ROLES)
  role!: (typeof ROLES)[number];
}
