import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * DTO for creating an action plan.
 */
export class CreateActionPlanDto {
  /** Action plan title. */
  @IsString()
  @IsNotEmpty()
  title!: string;

  /** Action plan description. */
  @IsString()
  @IsNotEmpty()
  description!: string;

  /** Optional action plan identifier override. */
  @IsString()
  @IsOptional()
  actionPlanId?: string;
}
