import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * DTO for creating an action.
 */
export class CreateActionDto {
  /** Optional action identifier override. */
  @IsString()
  @IsOptional()
  actionId?: string;

  /** Action plan identifier. */
  @IsString()
  @IsNotEmpty()
  actionPlanId!: string;

  /** Action title. */
  @IsString()
  @IsNotEmpty()
  title!: string;

  /** Action description. */
  @IsString()
  @IsNotEmpty()
  description!: string;
}
