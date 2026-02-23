import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { ACTION_PLAN_REPOSITORY } from '@repo/backend/action-plans';
import { ACTION_REPOSITORY, ActionsModule, TRANSACTION_RUNNER } from '@repo/backend/actions';
import {
  AuthGuard,
  DomainExceptionFilter,
  RolesGuard,
  SharedModule,
  TenancyGuard,
} from '@repo/backend/shared';
import { createInMemoryTestContext, givenAction, givenActionPlan } from '@repo/backend/testing';

const authHeaders = (overrides?: { userId?: string; orgId?: string; role?: string }) => ({
  'x-user-id': overrides?.userId ?? 'admin-1',
  'x-org-id': overrides?.orgId ?? 'org-1',
  'x-role': overrides?.role ?? 'ADMIN',
});

type TestApp = {
  app: INestApplication;
  actionRepository: ReturnType<typeof createInMemoryTestContext>['actionRepository'];
  actionPlanRepository: ReturnType<typeof createInMemoryTestContext>['actionPlanRepository'];
};

const createApp = async (): Promise<TestApp> => {
  const context = createInMemoryTestContext();

  const moduleRef = await Test.createTestingModule({
    imports: [
      SharedModule,
      ActionsModule.register({
        actionRepositoryProvider: {
          provide: ACTION_REPOSITORY,
          useValue: context.actionRepository,
        },
        actionPlanRepositoryProvider: {
          provide: ACTION_PLAN_REPOSITORY,
          useValue: context.actionPlanRepository,
        },
        transactionRunnerProvider: {
          provide: TRANSACTION_RUNNER,
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
    actionRepository: context.actionRepository,
    actionPlanRepository: context.actionPlanRepository,
  };
};

describe('Actions (e2e)', () => {
  it('creates an action', async () => {
    const { app, actionPlanRepository } = await createApp();

    await actionPlanRepository.save(
      givenActionPlan({ organizationId: 'org-1', actionPlanId: 'plan-1' }),
    );

    await request(app.getHttpServer())
      .post('/api/actions')
      .set(authHeaders())
      .send({
        actionPlanId: 'plan-1',
        title: 'Launch',
        description: 'Launch description',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.actionId).toBeTruthy();
        expect(res.body.state).toBe('TODO');
        expect(res.body.version).toBe(1);
        expect(res.body.updatedAt).toBeTruthy();
      });

    await app.close();
  });

  it('starts an action', async () => {
    const { app, actionRepository } = await createApp();

    await actionRepository.save(givenAction({ organizationId: 'org-1', actionId: 'action-1' }));

    await request(app.getHttpServer())
      .post('/api/actions/action-1/start')
      .set(authHeaders({ role: 'MANAGER' }))
      .send({ expectedVersion: 1 })
      .expect(200)
      .expect((res) => {
        expect(res.body.actionId).toBe('action-1');
        expect(res.body.state).toBe('IN_PROGRESS');
        expect(res.body.version).toBe(2);
        expect(res.body.updatedAt).toBeTruthy();
      });

    await app.close();
  });

  it('rejects forbidden roles', async () => {
    const { app, actionRepository } = await createApp();

    await actionRepository.save(givenAction({ organizationId: 'org-1', actionId: 'action-1' }));

    await request(app.getHttpServer())
      .post('/api/actions/action-1/start')
      .set(authHeaders({ role: 'USER' }))
      .send({ expectedVersion: 1 })
      .expect(403)
      .expect((res) => {
        expect(res.body.statusCode).toBe(403);
      });

    await app.close();
  });

  it('rejects concurrency conflicts', async () => {
    const { app, actionRepository } = await createApp();

    await actionRepository.save(givenAction({ organizationId: 'org-1', actionId: 'action-1' }));

    await request(app.getHttpServer())
      .post('/api/actions/action-1/start')
      .set(authHeaders({ role: 'MANAGER' }))
      .send({ expectedVersion: 2 })
      .expect(409)
      .expect((res) => {
        expect(res.body.error).toBe('ConcurrencyConflict');
      });

    await app.close();
  });

  it('isolates tenants', async () => {
    const { app, actionRepository } = await createApp();

    await actionRepository.save(givenAction({ organizationId: 'org-a', actionId: 'action-1' }));

    await request(app.getHttpServer())
      .post('/api/actions/action-1/start')
      .set(authHeaders({ orgId: 'org-b', role: 'MANAGER' }))
      .send({ expectedVersion: 1 })
      .expect(404)
      .expect((res) => {
        expect(res.body.error).toBe('ActionNotFound');
      });

    await app.close();
  });

  it('deletes an action', async () => {
    const { app, actionRepository } = await createApp();

    await actionRepository.save(givenAction({ organizationId: 'org-1', actionId: 'action-1' }));

    await request(app.getHttpServer())
      .delete('/api/actions/action-1')
      .query({ expectedVersion: 1 })
      .set(authHeaders({ role: 'ADMIN' }))
      .expect(200)
      .expect((res) => {
        expect(res.body.actionId).toBe('action-1');
        expect(res.body.state).toBe('DELETED');
        expect(res.body.version).toBe(2);
        expect(res.body.updatedAt).toBeTruthy();
      });

    await app.close();
  });
});
