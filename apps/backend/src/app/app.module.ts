import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  ACTION_REPOSITORY,
  ActionsModule,
  InMemoryActionRepository,
  TRANSACTION_RUNNER,
} from '@repo/backend/actions';
import { InMemoryTransactionRunner, SharedModule } from '@repo/backend/shared';

import { AppController } from './app.controller';
import { AppService } from './app.service';

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
      actionRepositoryProvider: { provide: ACTION_REPOSITORY, useClass: InMemoryActionRepository },
      transactionRunnerProvider: {
        provide: TRANSACTION_RUNNER,
        useClass: InMemoryTransactionRunner,
      },
    }),
    SharedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
