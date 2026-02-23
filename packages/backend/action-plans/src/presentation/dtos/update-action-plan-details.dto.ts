import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for updating action plan details.
 */
export class UpdateActionPlanDetailsDto {
  /** Updated title. */
  @IsString()
  @IsNotEmpty()
  title!: string;

  /** Updated description. */
  @IsString()
  @IsNotEmpty()
  description!: string;
}
