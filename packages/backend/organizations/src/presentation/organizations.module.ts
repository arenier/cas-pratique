import { Module, type DynamicModule, type Provider } from '@nestjs/common';

import type { TransactionRunner } from '@repo/backend/shared';

import type { OrganizationRepository } from '../domain/ports/organization-repository';
import { CreateAccountUseCase } from '../application/use-cases/create-account.use-case';
import { InviteUserUseCase } from '../application/use-cases/invite-user.use-case';
import { OrganizationsController } from './organizations.controller';
import { ORGANIZATION_REPOSITORY, ORGANIZATION_TRANSACTION_RUNNER } from './organizations.tokens';

const createAccountUseCaseProvider: Provider = {
  provide: CreateAccountUseCase,
  useFactory: (organizationRepository: OrganizationRepository, transactionRunner: TransactionRunner) =>
    new CreateAccountUseCase(organizationRepository, transactionRunner),
  inject: [ORGANIZATION_REPOSITORY, ORGANIZATION_TRANSACTION_RUNNER],
};

const inviteUserUseCaseProvider: Provider = {
  provide: InviteUserUseCase,
  useFactory: (organizationRepository: OrganizationRepository, transactionRunner: TransactionRunner) =>
    new InviteUserUseCase(organizationRepository, transactionRunner),
  inject: [ORGANIZATION_REPOSITORY, ORGANIZATION_TRANSACTION_RUNNER],
};

export type OrganizationsModuleOptions = {
  organizationRepositoryProvider: Provider;
  transactionRunnerProvider: Provider;
};

@Module({
  controllers: [OrganizationsController],
  providers: [createAccountUseCaseProvider, inviteUserUseCaseProvider],
})
export class OrganizationsModule {
  /**
   * Register OrganizationsModule with infrastructure providers.
   * @param options Repository and transaction runner providers.
   * @returns Dynamic module definition.
   * @throws {Error} Never thrown in the current implementation.
   */
  static register(options: OrganizationsModuleOptions): DynamicModule {
    return {
      module: OrganizationsModule,
      providers: [options.organizationRepositoryProvider, options.transactionRunnerProvider],
      exports: [ORGANIZATION_REPOSITORY, ORGANIZATION_TRANSACTION_RUNNER],
    };
  }
}
