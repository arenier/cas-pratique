import { describe, expect, it } from 'vitest';

import { InMemoryTransactionRunner } from '@repo/backend/shared';

import { Organization } from '../../domain/aggregates/organization';
import { UnauthorizedOrganizationOperation } from '../../domain/errors/unauthorized-organization-operation';
import { InMemoryOrganizationRepository } from '../../infrastructure/in-memory/in-memory-organization-repository';
import { OrganizationNotFound } from '../errors/organization-not-found';
import { InviteUserUseCase } from './invite-user.use-case';

describe('InviteUserUseCase', () => {
  it('invites a user with a role', async () => {
    const organizationRepository = new InMemoryOrganizationRepository();
    const transactionRunner = new InMemoryTransactionRunner();
    const useCase = new InviteUserUseCase(organizationRepository, transactionRunner);

    await organizationRepository.save(
      Organization.create({
        id: 'org-1',
        name: 'Qualineo',
        adminUser: {
          userId: 'admin-1',
          email: 'admin@qualineo.test',
        },
      })
    );

    const result = await useCase.execute({
      organizationId: 'org-1',
      actorRole: 'ADMIN',
      userId: 'manager-1',
      email: 'manager@qualineo.test',
      role: 'MANAGER',
    });

    const saved = await organizationRepository.getById({ organizationId: 'org-1' });
    const membership = saved?.listMemberships().find((item) => item.userId === 'manager-1');

    expect(result).toEqual({
      organizationId: 'org-1',
      userId: 'manager-1',
      role: 'MANAGER',
    });
    expect(membership).toBeDefined();
    expect(membership?.email).toBe('manager@qualineo.test');
    expect(membership?.role).toBe('MANAGER');
    expect(membership?.isActive).toBe(true);
  });

  it('rejects non-admin actors', async () => {
    const organizationRepository = new InMemoryOrganizationRepository();
    const transactionRunner = new InMemoryTransactionRunner();
    const useCase = new InviteUserUseCase(organizationRepository, transactionRunner);

    await organizationRepository.save(
      Organization.create({
        id: 'org-1',
        name: 'Qualineo',
        adminUser: {
          userId: 'admin-1',
          email: 'admin@qualineo.test',
        },
      })
    );

    await expect(
      useCase.execute({
        organizationId: 'org-1',
        actorRole: 'MANAGER',
        userId: 'user-1',
        email: 'user@qualineo.test',
        role: 'USER',
      })
    ).rejects.toBeInstanceOf(UnauthorizedOrganizationOperation);
  });

  it('throws when organization is not found', async () => {
    const organizationRepository = new InMemoryOrganizationRepository();
    const transactionRunner = new InMemoryTransactionRunner();
    const useCase = new InviteUserUseCase(organizationRepository, transactionRunner);

    await expect(
      useCase.execute({
        organizationId: 'org-missing',
        actorRole: 'ADMIN',
        userId: 'user-1',
        email: 'user@qualineo.test',
        role: 'USER',
      })
    ).rejects.toBeInstanceOf(OrganizationNotFound);
  });

  it('does not leak across organizations', async () => {
    const organizationRepository = new InMemoryOrganizationRepository();
    const transactionRunner = new InMemoryTransactionRunner();
    const useCase = new InviteUserUseCase(organizationRepository, transactionRunner);

    await organizationRepository.save(
      Organization.create({
        id: 'org-a',
        name: 'Qualineo',
        adminUser: {
          userId: 'admin-1',
          email: 'admin@qualineo.test',
        },
      })
    );

    await expect(
      useCase.execute({
        organizationId: 'org-b',
        actorRole: 'ADMIN',
        userId: 'user-1',
        email: 'user@qualineo.test',
        role: 'USER',
      })
    ).rejects.toBeInstanceOf(OrganizationNotFound);
  });
});
