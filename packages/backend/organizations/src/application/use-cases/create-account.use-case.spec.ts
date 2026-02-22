import { describe, expect, it, vi } from 'vitest';

import { InMemoryOrganizationRepository } from '../../infrastructure/in-memory/in-memory-organization-repository';
import { InMemoryTransactionRunner } from '@repo/backend/shared';
import { Organization } from '../../domain/aggregates/organization';
import { OrganizationAlreadyExists } from '../errors/organization-already-exists';
import { CreateAccountUseCase } from './create-account.use-case';

describe('CreateAccountUseCase', () => {
  it('creates an organization with one active admin', async () => {
    const organizationRepository = new InMemoryOrganizationRepository();
    const transactionRunner = new InMemoryTransactionRunner();
    const useCase = new CreateAccountUseCase(organizationRepository, transactionRunner);

    const result = await useCase.execute({
      organizationName: 'Qualineo',
      adminEmail: 'admin@qualineo.test',
      adminUserId: 'admin-1',
      organizationId: 'org-1',
    });

    const saved = await organizationRepository.getById({ organizationId: 'org-1' });

    expect(saved).not.toBeNull();
    expect(result).toEqual({ organizationId: 'org-1', adminUserId: 'admin-1' });

    const memberships = saved?.listMemberships() ?? [];
    expect(memberships).toHaveLength(1);
    expect(memberships[0]?.userId).toBe('admin-1');
    expect(memberships[0]?.email).toBe('admin@qualineo.test');
    expect(memberships[0]?.role).toBe('ADMIN');
    expect(memberships[0]?.isActive).toBe(true);
  });

  it('wraps execution in a transaction', async () => {
    const organizationRepository = new InMemoryOrganizationRepository();
    const runInTransaction = vi.fn(async (fn: () => Promise<unknown>) => fn());
    const transactionRunner = { runInTransaction };
    const useCase = new CreateAccountUseCase(organizationRepository, transactionRunner);

    await useCase.execute({
      organizationName: 'Qualineo',
      adminEmail: 'admin@qualineo.test',
      adminUserId: 'admin-1',
      organizationId: 'org-1',
    });

    expect(runInTransaction).toHaveBeenCalledTimes(1);
  });

  it('throws when organization already exists', async () => {
    const organizationRepository = new InMemoryOrganizationRepository();
    const transactionRunner = new InMemoryTransactionRunner();
    const useCase = new CreateAccountUseCase(organizationRepository, transactionRunner);

    await organizationRepository.save(
      Organization.create({
        id: 'org-1',
        name: 'Existing',
        adminUser: { userId: 'admin-1', email: 'admin@qualineo.test' },
      })
    );

    await expect(
      useCase.execute({
        organizationName: 'Qualineo',
        adminEmail: 'admin@qualineo.test',
        adminUserId: 'admin-1',
        organizationId: 'org-1',
      })
    ).rejects.toBeInstanceOf(OrganizationAlreadyExists);
  });
});
