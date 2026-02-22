import { IsInt, Min } from 'class-validator';

/**
 * DTO for action transitions requiring optimistic locking.
 */
export class ActionTransitionDto {
  /** Expected current version for optimistic locking. */
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}
