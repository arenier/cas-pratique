import { Injectable } from '@nestjs/common';
import type { DataSource } from 'typeorm';

import type { OrganizationRepository } from '@repo/backend/organizations';
import { Organization } from '@repo/backend/organizations';

import { OrganizationEntity } from '../entities/organization.entity';
import { UserEntity } from '../entities/user.entity';
import { resolveEntityManager } from '../transaction/typeorm-transaction-runner';

const toMembership = (user: UserEntity) => ({
  userId: user.id,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
});

@Injectable()
export class TypeOrmOrganizationRepository implements OrganizationRepository {
  /**
   * Create a new TypeOrmOrganizationRepository.
   * @param dataSource DataSource for database access.
   */
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Fetch an organization by identifier.
   * @param params Lookup parameters.
   * @param params.organizationId Organization identifier.
   * @returns The matching organization or null when missing.
   */
  async getById(params: { organizationId: string }): Promise<Organization | null> {
    const manager = resolveEntityManager(this.dataSource);
    const repository = manager.getRepository(OrganizationEntity);

    const entity = await repository.findOne({
      where: { id: params.organizationId },
      relations: { users: true },
    });

    if (!entity) {
      return null;
    }

    const memberships = (entity.users ?? []).map(toMembership);

    return Organization.rehydrate({
      id: entity.id,
      name: entity.name,
      memberships,
    });
  }

  /**
   * Persist an organization aggregate.
   * @param organization Organization to persist.
   */
  async save(organization: Organization): Promise<void> {
    const manager = resolveEntityManager(this.dataSource);
    const organizationRepository = manager.getRepository(OrganizationEntity);
    const userRepository = manager.getRepository(UserEntity);
    const now = new Date();

    const existingOrganization = await organizationRepository.findOne({
      where: { id: organization.id },
    });

    if (existingOrganization) {
      await organizationRepository.update(
        { id: organization.id },
        { name: organization.name, updatedAt: now },
      );
    } else {
      await organizationRepository.insert({
        id: organization.id,
        name: organization.name,
        createdAt: now,
        updatedAt: now,
      });
    }

    const memberships = organization.listMemberships();

    for (const membership of memberships) {
      const existingUser = await userRepository.findOne({
        where: { id: membership.userId, organizationId: organization.id },
      });

      if (existingUser) {
        await userRepository.update(
          { id: membership.userId, organizationId: organization.id },
          {
            email: membership.email,
            role: membership.role,
            isActive: membership.isActive,
            updatedAt: now,
          },
        );
      } else {
        await userRepository.insert({
          id: membership.userId,
          organizationId: organization.id,
          email: membership.email,
          role: membership.role,
          isActive: membership.isActive,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }
}
