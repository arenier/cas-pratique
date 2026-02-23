import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * DTO for creating a new organization account.
 */
export class CreateAccountDto {
  /** Organization display name. */
  @IsString()
  @IsNotEmpty()
  organizationName!: string;

  /** Admin user email address. */
  @IsEmail()
  adminEmail!: string;

  /** Optional admin user identifier override. */
  @IsString()
  @IsOptional()
  adminUserId?: string;
}
