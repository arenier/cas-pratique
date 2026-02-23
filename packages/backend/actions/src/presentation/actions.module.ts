import { type DynamicModule, Module, type Provider } from '@nestjs/common';

import type { ActionPlanRepository } from '@repo/backend/action-plans';
import { ACTION_PLAN_REPOSITORY } from '@repo/backend/action-plans';
import type { TransactionRunner } from '@repo/backend/shared';

import { CompleteActionUseCase } from '../application/use-cases/complete-action.use-case';
import { CreateActionUseCase } from '../application/use-cases/create-action.use-case';
import { DeleteActionUseCase } from '../application/use-cases/delete-action.use-case';
import { RequestValidationActionUseCase } from '../application/use-cases/request-validation-action.use-case';
import { StartActionUseCase } from '../application/use-cases/start-action.use-case';
import type { ActionRepository } from '../domain/ports/action-repository';
import { ActionsController } from './actions.controller';
import { ACTION_REPOSITORY, TRANSACTION_RUNNER } from './actions.tokens';

const createActionUseCaseProvider: Provider = {
  provide: CreateActionUseCase,
  useFactory: (
    actionRepository: ActionRepository,
    actionPlanRepository: ActionPlanRepository,
    transactionRunner: TransactionRunner,
  ) => new CreateActionUseCase(actionRepository, actionPlanRepository, transactionRunner),
  inject: [ACTION_REPOSITORY, ACTION_PLAN_REPOSITORY, TRANSACTION_RUNNER],
};

const startActionUseCaseProvider: Provider = {
  provide: StartActionUseCase,
  useFactory: (actionRepository: ActionRepository, transactionRunner: TransactionRunner) =>
    new StartActionUseCase(actionRepository, transactionRunner),
  inject: [ACTION_REPOSITORY, TRANSACTION_RUNNER],
};

const requestValidationActionUseCaseProvider: Provider = {
  provide: RequestValidationActionUseCase,
  useFactory: (actionRepository: ActionRepository, transactionRunner: TransactionRunner) =>
    new RequestValidationActionUseCase(actionRepository, transactionRunner),
  inject: [ACTION_REPOSITORY, TRANSACTION_RUNNER],
};

const completeActionUseCaseProvider: Provider = {
  provide: CompleteActionUseCase,
  useFactory: (actionRepository: ActionRepository, transactionRunner: TransactionRunner) =>
    new CompleteActionUseCase(actionRepository, transactionRunner),
  inject: [ACTION_REPOSITORY, TRANSACTION_RUNNER],
};

const deleteActionUseCaseProvider: Provider = {
  provide: DeleteActionUseCase,
  useFactory: (actionRepository: ActionRepository, transactionRunner: TransactionRunner) =>
    new DeleteActionUseCase(actionRepository, transactionRunner),
  inject: [ACTION_REPOSITORY, TRANSACTION_RUNNER],
};

export type ActionsModuleOptions = {
  actionRepositoryProvider: Provider;
  actionPlanRepositoryProvider: Provider;
  transactionRunnerProvider: Provider;
};

@Module({
  controllers: [ActionsController],
  providers: [
    createActionUseCaseProvider,
    startActionUseCaseProvider,
    requestValidationActionUseCaseProvider,
    completeActionUseCaseProvider,
    deleteActionUseCaseProvider,
  ],
})
export class ActionsModule {
  /**
   * Register ActionsModule with infrastructure providers.
   * @param options Repository and transaction runner providers.
   * @returns Dynamic module definition.
   * @throws {Error} Never thrown in the current implementation.
   */
  static register(options: ActionsModuleOptions): DynamicModule {
    return {
      module: ActionsModule,
      providers: [
        options.actionRepositoryProvider,
        options.actionPlanRepositoryProvider,
        options.transactionRunnerProvider,
      ],
      exports: [ACTION_REPOSITORY, TRANSACTION_RUNNER],
    };
  }
}
