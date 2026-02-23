import { Module, type DynamicModule, type Provider } from '@nestjs/common';

import type { TransactionRunner } from '@repo/backend/shared';

import type { ActionPlanRepository } from '../domain/ports/action-plan-repository';
import { CreateActionPlanUseCase } from '../application/use-cases/create-action-plan.use-case';
import { UpdateActionPlanDetailsUseCase } from '../application/use-cases/update-action-plan-details.use-case';
import { ActionPlansController } from './action-plans.controller';
import { ACTION_PLAN_REPOSITORY, ACTION_PLAN_TRANSACTION_RUNNER } from './action-plans.tokens';

const createActionPlanUseCaseProvider: Provider = {
  provide: CreateActionPlanUseCase,
  useFactory: (actionPlanRepository: ActionPlanRepository, transactionRunner: TransactionRunner) =>
    new CreateActionPlanUseCase(actionPlanRepository, transactionRunner),
  inject: [ACTION_PLAN_REPOSITORY, ACTION_PLAN_TRANSACTION_RUNNER],
};

const updateActionPlanDetailsUseCaseProvider: Provider = {
  provide: UpdateActionPlanDetailsUseCase,
  useFactory: (actionPlanRepository: ActionPlanRepository, transactionRunner: TransactionRunner) =>
    new UpdateActionPlanDetailsUseCase(actionPlanRepository, transactionRunner),
  inject: [ACTION_PLAN_REPOSITORY, ACTION_PLAN_TRANSACTION_RUNNER],
};

export type ActionPlansModuleOptions = {
  actionPlanRepositoryProvider: Provider;
  transactionRunnerProvider: Provider;
};

@Module({
  controllers: [ActionPlansController],
  providers: [createActionPlanUseCaseProvider, updateActionPlanDetailsUseCaseProvider],
})
export class ActionPlansModule {
  /**
   * Register ActionPlansModule with infrastructure providers.
   * @param options Repository and transaction runner providers.
   * @returns Dynamic module definition.
   * @throws {Error} Never thrown in the current implementation.
   */
  static register(options: ActionPlansModuleOptions): DynamicModule {
    return {
      module: ActionPlansModule,
      providers: [options.actionPlanRepositoryProvider, options.transactionRunnerProvider],
      exports: [ACTION_PLAN_REPOSITORY, ACTION_PLAN_TRANSACTION_RUNNER],
    };
  }
}
