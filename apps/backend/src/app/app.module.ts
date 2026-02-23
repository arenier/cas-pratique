import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  ACTION_PLAN_REPOSITORY,
  ACTION_PLAN_TRANSACTION_RUNNER,
  ActionPlansModule,
} from '@repo/backend/action-plans';
import {
  ACTION_REPOSITORY,
  ActionsModule,
  TRANSACTION_RUNNER,
} from '@repo/backend/actions';
import {
  ORGANIZATION_REPOSITORY,
  ORGANIZATION_TRANSACTION_RUNNER,
  OrganizationsModule,
} from '@repo/backend/organizations';
import { SharedModule } from '@repo/backend/shared';
import {
  TypeOrmActionPlanRepository,
  TypeOrmActionRepository,
  TypeOrmOrganizationRepository,
  TypeOrmTransactionRunner,
  createTypeOrmOptions,
} from '@repo/backend/persistence';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `${__dirname}/../.env`,
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => createTypeOrmOptions(configService),
    }),
    ActionsModule.register({
      actionRepositoryProvider: { provide: ACTION_REPOSITORY, useClass: TypeOrmActionRepository },
      actionPlanRepositoryProvider: {
        provide: ACTION_PLAN_REPOSITORY,
        useClass: TypeOrmActionPlanRepository,
      },
      transactionRunnerProvider: {
        provide: TRANSACTION_RUNNER,
        useClass: TypeOrmTransactionRunner,
      },
    }),
    OrganizationsModule.register({
      organizationRepositoryProvider: {
        provide: ORGANIZATION_REPOSITORY,
        useClass: TypeOrmOrganizationRepository,
      },
      transactionRunnerProvider: {
        provide: ORGANIZATION_TRANSACTION_RUNNER,
        useClass: TypeOrmTransactionRunner,
      },
    }),
    ActionPlansModule.register({
      actionPlanRepositoryProvider: {
        provide: ACTION_PLAN_REPOSITORY,
        useClass: TypeOrmActionPlanRepository,
      },
      transactionRunnerProvider: {
        provide: ACTION_PLAN_TRANSACTION_RUNNER,
        useClass: TypeOrmTransactionRunner,
      },
    }),
    SharedModule,
  ],
})
export class AppModule {}
