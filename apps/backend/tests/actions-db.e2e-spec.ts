import 'reflect-metadata';

import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { beforeAll, beforeEach, afterAll, describe, expect, it } from 'vitest';

import { AuthGuard, DomainExceptionFilter, RolesGuard, TenancyGuard } from '@repo/backend/shared';

import { AppModule } from '../src/app/app.module';

const authHeaders = (overrides?: { userId?: string; orgId?: string; role?: string }) => ({
  'x-user-id': overrides?.userId ?? 'admin-1',
  'x-org-id': overrides?.orgId ?? 'org-1',
  'x-role': overrides?.role ?? 'ADMIN',
});

type TestContext = {
  app: INestApplication;
  dataSource: DataSource;
};

const resetDatabase = async (dataSource: DataSource) => {
  await dataSource.query(
    'TRUNCATE TABLE actions, action_plans, users, organizations RESTART IDENTITY CASCADE',
  );
};

const createAccount = async (app: INestApplication, overrides?: { orgId?: string }) => {
  const response = await request(app.getHttpServer())
    .post('/api/accounts')
    .set(authHeaders({ orgId: overrides?.orgId ?? 'org-1' }))
    .send({
      organizationName: 'Qualineo',
      adminEmail: 'admin@qualineo.test',
      adminUserId: 'admin-1',
    })
    .expect(201);

  return response.body.organizationId as string;
};

const bootstrapApp = async (): Promise<TestContext> => {
  process.env['DATABASE_HOST'] = process.env['DATABASE_HOST'] ?? 'localhost';
  process.env['DATABASE_PORT'] = process.env['DATABASE_PORT'] ?? '5432';
  process.env['DATABASE_USER'] = process.env['DATABASE_USER'] ?? 'postgres';
  process.env['DATABASE_PASSWORD'] = process.env['DATABASE_PASSWORD'] ?? 'postgres';
  process.env['DATABASE_NAME'] = process.env['DATABASE_NAME'] ?? 'cas_pratique';
  process.env['TYPEORM_MIGRATIONS_RUN'] = 'true';

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalGuards(app.get(AuthGuard), app.get(TenancyGuard), app.get(RolesGuard));
  app.useGlobalFilters(new DomainExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();

  const dataSource = app.get(DataSource);
  await dataSource.runMigrations();

  return { app, dataSource };
};

describe('Actions (db e2e)', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await bootstrapApp();
  }, 30000);

  beforeEach(async () => {
    if (context) {
      await resetDatabase(context.dataSource);
    }
  });

  afterAll(async () => {
    if (!context) {
      return;
    }

    await context.dataSource.destroy();
    await context.app.close();
  });

  it('creates an action plan and action, then starts the action', async () => {
    await createAccount(context.app);

    const actionPlanResponse = await request(context.app.getHttpServer())
      .post('/api/action-plans')
      .set(authHeaders({ role: 'ADMIN' }))
      .send({
        title: 'Plan',
        description: 'Plan description',
      })
      .expect(201);

    const actionPlanId = actionPlanResponse.body.actionPlanId as string;

    const actionResponse = await request(context.app.getHttpServer())
      .post('/api/actions')
      .set(authHeaders({ role: 'MANAGER' }))
      .send({
        actionPlanId,
        title: 'Action',
        description: 'Action description',
      })
      .expect(201);

    const actionId = actionResponse.body.actionId as string;

    await request(context.app.getHttpServer())
      .post(`/api/actions/${actionId}/start`)
      .set(authHeaders({ role: 'MANAGER' }))
      .send({ expectedVersion: 1 })
      .expect(200)
      .expect((res) => {
        expect(res.body.state).toBe('IN_PROGRESS');
        expect(res.body.version).toBe(2);
      });
  });

  it('rejects concurrency conflicts', async () => {
    await createAccount(context.app);

    const actionPlanResponse = await request(context.app.getHttpServer())
      .post('/api/action-plans')
      .set(authHeaders({ role: 'ADMIN' }))
      .send({
        title: 'Plan',
        description: 'Plan description',
      })
      .expect(201);

    const actionPlanId = actionPlanResponse.body.actionPlanId as string;

    const actionResponse = await request(context.app.getHttpServer())
      .post('/api/actions')
      .set(authHeaders({ role: 'ADMIN' }))
      .send({
        actionPlanId,
        title: 'Action',
        description: 'Action description',
      })
      .expect(201);

    const actionId = actionResponse.body.actionId as string;

    await context.dataSource.query(
      'UPDATE actions SET version = 2 WHERE id = $1 AND organization_id = $2',
      [actionId, 'org-1'],
    );

    await request(context.app.getHttpServer())
      .post(`/api/actions/${actionId}/start`)
      .set(authHeaders({ role: 'MANAGER' }))
      .send({ expectedVersion: 1 })
      .expect(409)
      .expect((res) => {
        expect(res.body.error).toBe('ConcurrencyConflict');
      });
  });

  it('isolates tenants', async () => {
    await createAccount(context.app);

    const actionPlanResponse = await request(context.app.getHttpServer())
      .post('/api/action-plans')
      .set(authHeaders({ role: 'ADMIN' }))
      .send({
        title: 'Plan',
        description: 'Plan description',
      })
      .expect(201);

    const actionPlanId = actionPlanResponse.body.actionPlanId as string;

    const actionResponse = await request(context.app.getHttpServer())
      .post('/api/actions')
      .set(authHeaders({ role: 'ADMIN' }))
      .send({
        actionPlanId,
        title: 'Action',
        description: 'Action description',
      })
      .expect(201);

    const actionId = actionResponse.body.actionId as string;

    await request(context.app.getHttpServer())
      .post(`/api/actions/${actionId}/start`)
      .set(authHeaders({ orgId: 'org-2', role: 'MANAGER' }))
      .send({ expectedVersion: 1 })
      .expect(404)
      .expect((res) => {
        expect(res.body.error).toBe('ActionNotFound');
      });
  });
});
