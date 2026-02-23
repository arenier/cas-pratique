import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, Unique } from 'typeorm';

import { ACTION_STATES, type ActionState } from '@repo/backend/actions';

import { ActionPlanEntity } from './action-plan.entity';
import { OrganizationEntity } from './organization.entity';

@Unique(['organizationId', 'id'])
@Index(['organizationId', 'id'])
@Index(['organizationId', 'actionPlanId'])
@Entity({ name: 'actions' })
export class ActionEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'organization_id' })
  organizationId!: string;

  @Column({ type: 'uuid', name: 'action_plan_id' })
  actionPlanId!: string;

  @Column({ type: 'uuid', name: 'created_by_user_id' })
  createdByUserId!: string;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'enum', enum: ACTION_STATES, enumName: 'action_state_enum' })
  state!: ActionState;

  @Column({ type: 'int' })
  version!: number;

  @Column({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => OrganizationEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organization_id' })
  organization?: OrganizationEntity;

  @ManyToOne(() => ActionPlanEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    { name: 'action_plan_id', referencedColumnName: 'id' },
    { name: 'organization_id', referencedColumnName: 'organizationId' },
  ])
  actionPlan?: ActionPlanEntity;
}
