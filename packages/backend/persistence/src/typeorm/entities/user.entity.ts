import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { ROLES } from '@repo/backend/kernel';
import type { OrganizationMembership } from '@repo/backend/organizations';

import { OrganizationEntity } from './organization.entity';

@Index(['organizationId', 'id'])
@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'organization_id' })
  organizationId!: string;

  @Column({ type: 'text' })
  email!: string;

  @Column({ type: 'enum', enum: ROLES, enumName: 'role_enum' })
  role!: OrganizationMembership['role'];

  @Column({ type: 'boolean', name: 'is_active' })
  isActive!: boolean;

  @Column({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(
    () => OrganizationEntity,
    (organization) => organization.users,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'organization_id' })
  organization?: OrganizationEntity;
}
