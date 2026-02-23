import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  ACTION_PLAN_REPOSITORY,
  ACTION_PLAN_TRANSACTION_RUNNER,
  ActionPlansModule,
  InMemoryActionPlanRepository,
} from '@repo/backend/action-plans';
import {
  ACTION_REPOSITORY,
  ActionsModule,
  InMemoryActionRepository,
  TRANSACTION_RUNNER,
} from '@repo/backend/actions';
import {
  InMemoryOrganizationRepository,
  ORGANIZATION_REPOSITORY,
  ORGANIZATION_TRANSACTION_RUNNER,
  OrganizationsModule,
} from '@repo/backend/organizations';
import { InMemoryTransactionRunner, SharedModule } from '@repo/backend/shared';

const organizationRepository = new InMemoryOrganizationRepository();
const actionPlanRepository = new InMemoryActionPlanRepository();
const actionRepository = new InMemoryActionRepository();
const transactionRunner = new InMemoryTransactionRunner();

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `${__dirname}/../.env`,
      isGlobal: true,
    }),
    // Kept for later persistence stage; not used by the current in-memory wiring.
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST', 'localhost'),
        port: configService.get<number>('DATABASE_PORT', 5432),
        username: configService.get<string>('DATABASE_USER', 'postgres'),
        password: configService.get<string>('DATABASE_PASSWORD', 'postgres'),
        database: configService.get<string>('DATABASE_NAME', 'cas_pratique'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    ActionsModule.register({
      actionRepositoryProvider: { provide: ACTION_REPOSITORY, useValue: actionRepository },
      actionPlanRepositoryProvider: {
        provide: ACTION_PLAN_REPOSITORY,
        useValue: actionPlanRepository,
      },
      transactionRunnerProvider: {
        provide: TRANSACTION_RUNNER,
        useValue: transactionRunner,
      },
    }),
    OrganizationsModule.register({
      organizationRepositoryProvider: {
        provide: ORGANIZATION_REPOSITORY,
        useValue: organizationRepository,
      },
      transactionRunnerProvider: {
        provide: ORGANIZATION_TRANSACTION_RUNNER,
        useValue: transactionRunner,
      },
    }),
    ActionPlansModule.register({
      actionPlanRepositoryProvider: {
        provide: ACTION_PLAN_REPOSITORY,
        useValue: actionPlanRepository,
      },
      transactionRunnerProvider: {
        provide: ACTION_PLAN_TRANSACTION_RUNNER,
        useValue: transactionRunner,
      },
    }),
    SharedModule,
  ],
})
export class AppModule {}
