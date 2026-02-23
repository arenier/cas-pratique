import type { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { ActionEntity } from './entities/action.entity';
import { ActionPlanEntity } from './entities/action-plan.entity';
import { OrganizationEntity } from './entities/organization.entity';
import { UserEntity } from './entities/user.entity';
import { InitialSchema20260223043000 } from './migrations/20260223043000-initial-schema';

const resolveMigrations = () => [InitialSchema20260223043000];

const resolveEntities = () => [OrganizationEntity, UserEntity, ActionPlanEntity, ActionEntity];

type ConfigReader = {
  get<T>(key: string, defaultValue?: T): T | undefined;
};

const resolveBaseOptions = (
  config: ConfigReader,
): Omit<TypeOrmModuleOptions, 'type' | 'database'> & {
  database: string;
  host: string;
  port: number;
  username: string;
  password: string;
} => ({
  host: config.get<string>('DATABASE_HOST', 'localhost') ?? 'localhost',
  port: config.get<number>('DATABASE_PORT', 5432) ?? 5432,
  username: config.get<string>('DATABASE_USER', 'postgres') ?? 'postgres',
  password: config.get<string>('DATABASE_PASSWORD', 'postgres') ?? 'postgres',
  database: config.get<string>('DATABASE_NAME', 'cas_pratique') ?? 'cas_pratique',
  entities: resolveEntities(),
  migrations: resolveMigrations(),
  synchronize: false,
  migrationsRun: (config.get<string>('TYPEORM_MIGRATIONS_RUN', 'false') ?? 'false') === 'true',
});

/**
 * Build TypeORM module options using the Nest config service.
 * @param configService Config service providing database settings.
 * @returns TypeORM module options.
 */
export const createTypeOrmOptions = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  ...resolveBaseOptions(configService),
});

const envConfig = {
  get<T>(key: string, defaultValue?: T): T | undefined {
    const value = process.env[key];
    if (value === undefined) {
      return defaultValue as T;
    }

    if (typeof defaultValue === 'number') {
      return Number(value) as T;
    }

    if (typeof defaultValue === 'boolean') {
      return (value === 'true') as T;
    }

    return value as T;
  },
};

/**
 * DataSource instance for migrations and CLI usage.
 */
export const appDataSource = new DataSource({
  type: 'postgres',
  ...resolveBaseOptions(envConfig),
});

export default appDataSource;
