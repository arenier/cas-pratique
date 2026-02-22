import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Inject,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';

import { type AuthenticatedRequest, Roles } from '@repo/backend/shared';

import { ActionNotFound } from '../application/errors/action-not-found';
import type { CompleteActionUseCase } from '../application/use-cases/complete-action.use-case';
import type { DeleteActionUseCase } from '../application/use-cases/delete-action.use-case';
import type { RequestValidationActionUseCase } from '../application/use-cases/request-validation-action.use-case';
import type { StartActionUseCase } from '../application/use-cases/start-action.use-case';
import type { Action } from '../domain/aggregates/action';
import type { ActionRepository } from '../domain/ports/action-repository';
import { ACTION_REPOSITORY } from './actions.tokens';
import type { ActionTransitionDto } from './dtos/action-transition.dto';

export type ActionTransitionResponse = {
  actionId: string;
  state: string;
  version: number;
  updatedAt: string;
};

@Controller('actions')
export class ActionsController {
  /**
   * Create a new ActionsController.
   * @param startActionUseCase Start action use-case.
   * @param requestValidationActionUseCase Request validation use-case.
   * @param completeActionUseCase Complete action use-case.
   * @param deleteActionUseCase Delete action use-case.
   * @param actionRepository Action repository for response data.
   */
  constructor(
    private readonly startActionUseCase: StartActionUseCase,
    private readonly requestValidationActionUseCase: RequestValidationActionUseCase,
    private readonly completeActionUseCase: CompleteActionUseCase,
    private readonly deleteActionUseCase: DeleteActionUseCase,
    @Inject(ACTION_REPOSITORY) private readonly actionRepository: ActionRepository,
  ) {}

  /**
   * Start an action workflow.
   * @param request Authenticated request.
   * @param actionId Action identifier.
   * @param body Transition payload with expected version.
   * @returns Action transition response.
   * @throws {UnauthorizedException} If authentication context is missing.
   * @throws {ActionNotFound} If the action does not exist.
   * @throws {UnauthorizedTransition} If the role is not allowed.
   * @throws {InvalidStateTransition} If the action state is invalid.
   * @throws {ConcurrencyConflict} If optimistic locking fails.
   */
  @Post(':actionId/start')
  @Roles('ADMIN', 'MANAGER')
  @HttpCode(200)
  async start(
    @Req() request: AuthenticatedRequest,
    @Param('actionId') actionId: string,
    @Body() body: ActionTransitionDto,
  ): Promise<ActionTransitionResponse> {
    const authUser = this.requireAuthUser(request);

    await this.startActionUseCase.execute({
      organizationId: authUser.organizationId,
      actorRole: authUser.role,
      actionId,
      expectedVersion: body.expectedVersion,
    });

    const action = await this.loadAction(authUser.organizationId, actionId);

    return this.toResponse(action);
  }

  /**
   * Request validation for an action.
   * @param request Authenticated request.
   * @param actionId Action identifier.
   * @param body Transition payload with expected version.
   * @returns Action transition response.
   * @throws {UnauthorizedException} If authentication context is missing.
   * @throws {ActionNotFound} If the action does not exist.
   * @throws {UnauthorizedTransition} If the role is not allowed.
   * @throws {InvalidStateTransition} If the action state is invalid.
   * @throws {ConcurrencyConflict} If optimistic locking fails.
   */
  @Post(':actionId/request-validation')
  @Roles('ADMIN', 'MANAGER')
  @HttpCode(200)
  async requestValidation(
    @Req() request: AuthenticatedRequest,
    @Param('actionId') actionId: string,
    @Body() body: ActionTransitionDto,
  ): Promise<ActionTransitionResponse> {
    const authUser = this.requireAuthUser(request);

    await this.requestValidationActionUseCase.execute({
      organizationId: authUser.organizationId,
      actorRole: authUser.role,
      actionId,
      expectedVersion: body.expectedVersion,
    });

    const action = await this.loadAction(authUser.organizationId, actionId);

    return this.toResponse(action);
  }

  /**
   * Complete an action.
   * @param request Authenticated request.
   * @param actionId Action identifier.
   * @param body Transition payload with expected version.
   * @returns Action transition response.
   * @throws {UnauthorizedException} If authentication context is missing.
   * @throws {ActionNotFound} If the action does not exist.
   * @throws {UnauthorizedTransition} If the role is not allowed.
   * @throws {InvalidStateTransition} If the action state is invalid.
   * @throws {ConcurrencyConflict} If optimistic locking fails.
   */
  @Post(':actionId/complete')
  @Roles('ADMIN')
  @HttpCode(200)
  async complete(
    @Req() request: AuthenticatedRequest,
    @Param('actionId') actionId: string,
    @Body() body: ActionTransitionDto,
  ): Promise<ActionTransitionResponse> {
    const authUser = this.requireAuthUser(request);

    await this.completeActionUseCase.execute({
      organizationId: authUser.organizationId,
      actorRole: authUser.role,
      actionId,
      expectedVersion: body.expectedVersion,
    });

    const action = await this.loadAction(authUser.organizationId, actionId);

    return this.toResponse(action);
  }

  /**
   * Delete an action.
   * @param request Authenticated request.
   * @param actionId Action identifier.
   * @param body Transition payload with expected version.
   * @returns Action transition response.
   * @throws {UnauthorizedException} If authentication context is missing.
   * @throws {ActionNotFound} If the action does not exist.
   * @throws {UnauthorizedActionDeletion} If the role is not allowed.
   * @throws {InvalidStateTransition} If the action state is invalid.
   * @throws {ConcurrencyConflict} If optimistic locking fails.
   */
  @Delete(':actionId')
  @Roles('ADMIN')
  @HttpCode(200)
  async delete(
    @Req() request: AuthenticatedRequest,
    @Param('actionId') actionId: string,
    @Body() body: ActionTransitionDto,
  ): Promise<ActionTransitionResponse> {
    const authUser = this.requireAuthUser(request);

    await this.deleteActionUseCase.execute({
      organizationId: authUser.organizationId,
      actorRole: authUser.role,
      actionId,
      expectedVersion: body.expectedVersion,
    });

    const action = await this.loadAction(authUser.organizationId, actionId);

    return this.toResponse(action);
  }

  /**
   * Ensure the authenticated user is attached to the request.
   * @param request Authenticated request.
   * @returns Authenticated user payload.
   * @throws {UnauthorizedException} If the request is missing an auth user.
   */
  private requireAuthUser(request: AuthenticatedRequest) {
    if (!request.authUser) {
      throw new UnauthorizedException('Missing authenticated user.');
    }

    return request.authUser;
  }

  /**
   * Load an action or throw if missing.
   * @param organizationId Organization identifier.
   * @param actionId Action identifier.
   * @returns Action aggregate.
   * @throws {ActionNotFound} If the action does not exist.
   */
  private async loadAction(organizationId: string, actionId: string): Promise<Action> {
    const action = await this.actionRepository.getById({ organizationId, actionId });

    if (!action) {
      throw new ActionNotFound(actionId, organizationId);
    }

    return action;
  }

  /**
   * Build a response payload from an action aggregate.
   * @param action Action aggregate.
   * @returns Action transition response.
   */
  private toResponse(action: Action): ActionTransitionResponse {
    return {
      actionId: action.id,
      state: action.state,
      version: action.version,
      updatedAt: action.updatedAt.toISOString(),
    };
  }
}
