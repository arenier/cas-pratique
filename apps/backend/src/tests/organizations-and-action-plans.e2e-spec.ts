import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import {
  ActionPlansModule,
  ACTION_PLAN_REPOSITORY,
  ACTION_PLAN_TRANSACTION_RUNNER,
} from '@repo/backend/action-plans';
import {
  OrganizationsModule,
  ORGANIZATION_REPOSITORY,
  ORGANIZATION_TRANSACTION_RUNNER,
} from '@repo/backend/organizations';
import {
  AuthGuard,
  DomainExceptionFilter,
  RolesGuard,
  TenancyGuard,
} from '@repo/backend/shared';
import { SharedModule } from '@repo/backend/shared';
import {
  createInMemoryTestContext,
  givenActionPlan,
  givenOrganizationWithAdmin,
} from '@repo/backend/testing';

const authHeaders = (overrides?: { userId?: string; orgId?: string; role?: string }) => ({
  'x-user-id': overrides?.userId ?? 'admin-1',
  'x-org-id': overrides?.orgId ?? 'org-1',
  'x-role': overrides?.role ?? 'ADMIN',
});

type TestApp = {
  app: INestApplication;
  organizationRepository: ReturnType<typeof createInMemoryTestContext>['organizationRepository'];
  actionPlanRepository: ReturnType<typeof createInMemoryTestContext>['actionPlanRepository'];
};

const createApp = async (): Promise<TestApp> => {
  const context = createInMemoryTestContext();

  const moduleRef = await Test.createTestingModule({
    imports: [
      SharedModule,
      OrganizationsModule.register({
        organizationRepositoryProvider: {
          provide: ORGANIZATION_REPOSITORY,
          useValue: context.organizationRepository,
        },
        transactionRunnerProvider: {
          provide: ORGANIZATION_TRANSACTION_RUNNER,
          useValue: context.transactionRunner,
        },
      }),
      ActionPlansModule.register({
        actionPlanRepositoryProvider: {
          provide: ACTION_PLAN_REPOSITORY,
          useValue: context.actionPlanRepository,
        },
        transactionRunnerProvider: {
          provide: ACTION_PLAN_TRANSACTION_RUNNER,
          useValue: context.transactionRunner,
        },
      }),
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalGuards(app.get(AuthGuard), app.get(TenancyGuard), app.get(RolesGuard));
  app.useGlobalFilters(app.get(DomainExceptionFilter));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();

  return {
    app,
    organizationRepository: context.organizationRepository,
    actionPlanRepository: context.actionPlanRepository,
  };
};

describe('Organizations & Action plans (e2e)', () => {
  it('creates an account', async () => {
    const { app } = await createApp();

    await request(app.getHttpServer())
      .post('/api/accounts')
      .set(authHeaders())
      .send({
        organizationName: 'Qualineo',
        adminEmail: 'admin@qualineo.test',
        adminUserId: 'admin-1',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.organizationId).toBeTruthy();
        expect(res.body.adminUserId).toBe('admin-1');
      });

    await app.close();
  });

  it('invites a user', async () => {
    const { app, organizationRepository } = await createApp();

    await organizationRepository.save(
      givenOrganizationWithAdmin({ organizationId: 'org-1', adminUserId: 'admin-1' }),
    );

    await request(app.getHttpServer())
      .post('/api/users/invite')
      .set(authHeaders({ role: 'ADMIN' }))
      .send({
        userId: 'user-2',
        email: 'user2@qualineo.test',
        role: 'USER',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.userId).toBe('user-2');
        expect(res.body.organizationId).toBe('org-1');
      });

    await app.close();
  });

  it('rejects invite when role is forbidden', async () => {
    const { app, organizationRepository } = await createApp();

    await organizationRepository.save(
      givenOrganizationWithAdmin({ organizationId: 'org-1', adminUserId: 'admin-1' }),
    );

    await request(app.getHttpServer())
      .post('/api/users/invite')
      .set(authHeaders({ role: 'MANAGER' }))
      .send({
        userId: 'user-2',
        email: 'user2@qualineo.test',
        role: 'USER',
      })
      .expect(403);

    await app.close();
  });

  it('creates an action plan', async () => {
    const { app } = await createApp();

    await request(app.getHttpServer())
      .post('/api/action-plans')
      .set(authHeaders({ role: 'ADMIN' }))
      .send({
        title: 'Plan',
        description: 'Plan description',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.actionPlanId).toBeTruthy();
        expect(res.body.organizationId).toBe('org-1');
      });

    await app.close();
  });

  it('rejects update action plan when role is forbidden', async () => {
    const { app, actionPlanRepository } = await createApp();

    await actionPlanRepository.save(
      givenActionPlan({ actionPlanId: 'plan-1', organizationId: 'org-1', createdByUserId: 'admin-1' }),
    );

    await request(app.getHttpServer())
      .patch('/api/action-plans/plan-1')
      .set(authHeaders({ role: 'USER' }))
      .send({
        title: 'Updated',
        description: 'Updated description',
      })
      .expect(403);

    await app.close();
  });

  it('returns not found for missing action plan', async () => {
    const { app } = await createApp();

    await request(app.getHttpServer())
      .patch('/api/action-plans/missing-plan')
      .set(authHeaders({ role: 'ADMIN' }))
      .send({
        title: 'Updated',
        description: 'Updated description',
      })
      .expect(404);

    await app.close();
  });
});
