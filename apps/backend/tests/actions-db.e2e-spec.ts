import 'reflect-metadata';

import { randomUUID } from 'node:crypto';

import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AuthGuard, DomainExceptionFilter, RolesGuard, TenancyGuard } from '@repo/backend/shared';

import { AppModule } from '../src/app/app.module';

const authHeaders = (params: { userId: string; orgId: string; role?: string }) => ({
  'x-user-id': params.userId,
  'x-org-id': params.orgId,
  'x-role': params.role ?? 'ADMIN',
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

const createAccount = async (
  app: INestApplication,
  params: { orgId: string; adminUserId: string },
) => {
  const response = await request(app.getHttpServer())
    .post('/api/accounts')
    .set(authHeaders({ orgId: params.orgId, userId: params.adminUserId }))
    .send({
      organizationName: 'Qualineo',
      adminEmail: 'admin@qualineo.test',
      adminUserId: params.adminUserId,
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
    const orgHeaderId = randomUUID();
    const adminUserId = randomUUID();
    const organizationId = await createAccount(context.app, {
      orgId: orgHeaderId,
      adminUserId,
    });
    const adminHeaders = authHeaders({
      orgId: organizationId,
      userId: adminUserId,
      role: 'ADMIN',
    });
    const managerHeaders = authHeaders({
      orgId: organizationId,
      userId: randomUUID(),
      role: 'MANAGER',
    });

    const actionPlanResponse = await request(context.app.getHttpServer())
      .post('/api/action-plans')
      .set(adminHeaders)
      .send({
        title: 'Plan',
        description: 'Plan description',
      })
      .expect(201);

    const actionPlanId = actionPlanResponse.body.actionPlanId as string;

    const actionResponse = await request(context.app.getHttpServer())
      .post('/api/actions')
      .set(managerHeaders)
      .send({
        actionPlanId,
        title: 'Action',
        description: 'Action description',
      })
      .expect(201);

    const actionId = actionResponse.body.actionId as string;

    await request(context.app.getHttpServer())
      .post(`/api/actions/${actionId}/start`)
      .set(managerHeaders)
      .send({ expectedVersion: 1 })
      .expect(200)
      .expect((res) => {
        expect(res.body.state).toBe('IN_PROGRESS');
        expect(res.body.version).toBe(2);
      });
  });

  it('rejects concurrency conflicts', async () => {
    const orgHeaderId = randomUUID();
    const adminUserId = randomUUID();
    const organizationId = await createAccount(context.app, {
      orgId: orgHeaderId,
      adminUserId,
    });
    const adminHeaders = authHeaders({
      orgId: organizationId,
      userId: adminUserId,
      role: 'ADMIN',
    });

    const actionPlanResponse = await request(context.app.getHttpServer())
      .post('/api/action-plans')
      .set(adminHeaders)
      .send({
        title: 'Plan',
        description: 'Plan description',
      })
      .expect(201);

    const actionPlanId = actionPlanResponse.body.actionPlanId as string;

    const actionResponse = await request(context.app.getHttpServer())
      .post('/api/actions')
      .set(adminHeaders)
      .send({
        actionPlanId,
        title: 'Action',
        description: 'Action description',
      })
      .expect(201);

    const actionId = actionResponse.body.actionId as string;

    await context.dataSource.query(
      'UPDATE actions SET version = 2 WHERE id = $1 AND organization_id = $2',
      [actionId, organizationId],
    );

    await request(context.app.getHttpServer())
      .post(`/api/actions/${actionId}/start`)
      .set(authHeaders({ orgId: organizationId, userId: randomUUID(), role: 'MANAGER' }))
      .send({ expectedVersion: 1 })
      .expect(409)
      .expect((res) => {
        expect(res.body.error).toBe('ConcurrencyConflict');
      });
  });

  it('isolates tenants', async () => {
    const orgHeaderId = randomUUID();
    const adminUserId = randomUUID();
    const organizationId = await createAccount(context.app, {
      orgId: orgHeaderId,
      adminUserId,
    });
    const adminHeaders = authHeaders({
      orgId: organizationId,
      userId: adminUserId,
      role: 'ADMIN',
    });

    const actionPlanResponse = await request(context.app.getHttpServer())
      .post('/api/action-plans')
      .set(adminHeaders)
      .send({
        title: 'Plan',
        description: 'Plan description',
      })
      .expect(201);

    const actionPlanId = actionPlanResponse.body.actionPlanId as string;

    const actionResponse = await request(context.app.getHttpServer())
      .post('/api/actions')
      .set(adminHeaders)
      .send({
        actionPlanId,
        title: 'Action',
        description: 'Action description',
      })
      .expect(201);

    const actionId = actionResponse.body.actionId as string;

    await request(context.app.getHttpServer())
      .post(`/api/actions/${actionId}/start`)
      .set(authHeaders({ orgId: randomUUID(), userId: randomUUID(), role: 'MANAGER' }))
      .send({ expectedVersion: 1 })
      .expect(404)
      .expect((res) => {
        expect(res.body.error).toBe('ActionNotFound');
      });
  });
});
