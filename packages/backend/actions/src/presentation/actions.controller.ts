import { randomUUID } from 'node:crypto';

import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';

import { type AuthenticatedRequest, Roles } from '@repo/backend/shared';

import { CompleteActionUseCase } from '../application/use-cases/complete-action.use-case';
import { CreateActionUseCase } from '../application/use-cases/create-action.use-case';
import { DeleteActionUseCase } from '../application/use-cases/delete-action.use-case';
import { RequestValidationActionUseCase } from '../application/use-cases/request-validation-action.use-case';
import { StartActionUseCase } from '../application/use-cases/start-action.use-case';
import { ActionTransitionDto } from './dtos/action-transition.dto';
import { CreateActionDto } from './dtos/create-action.dto';

export type ActionResponse = {
  actionId: string;
  state: string;
  version: number;
  updatedAt: string;
};

@Controller('actions')
export class ActionsController {
  /**
   * Create a new ActionsController.
   * @param createActionUseCase Create action use-case.
   * @param startActionUseCase Start action use-case.
   * @param requestValidationActionUseCase Request validation use-case.
   * @param completeActionUseCase Complete action use-case.
   * @param deleteActionUseCase Delete action use-case.
   */
  constructor(
    private readonly createActionUseCase: CreateActionUseCase,
    private readonly startActionUseCase: StartActionUseCase,
    private readonly requestValidationActionUseCase: RequestValidationActionUseCase,
    private readonly completeActionUseCase: CompleteActionUseCase,
    private readonly deleteActionUseCase: DeleteActionUseCase,
  ) {}

  /**
   * Create a new action.
   * @param request Authenticated request.
   * @param body Action creation payload.
   * @returns Action response.
   * @throws {UnauthorizedException} If authentication context is missing.
   * @throws {ActionPlanNotFound} If the action plan does not exist.
   * @throws {ActionAlreadyExists} If the action already exists.
   */
  @Post()
  @Roles('ADMIN', 'MANAGER')
  @HttpCode(201)
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateActionDto,
  ): Promise<ActionResponse> {
    const authUser = this.requireAuthUser(request);
    const actionId = body.actionId ?? randomUUID();

    const result = await this.createActionUseCase.execute({
      organizationId: authUser.organizationId,
      actorRole: authUser.role,
      actionId,
      actionPlanId: body.actionPlanId,
      createdByUserId: authUser.userId,
      title: body.title,
      description: body.description,
    });

    return this.toResponse(result);
  }

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
  ): Promise<ActionResponse> {
    const authUser = this.requireAuthUser(request);

    const result = await this.startActionUseCase.execute({
      organizationId: authUser.organizationId,
      actorRole: authUser.role,
      actionId,
      expectedVersion: body.expectedVersion,
    });

    return this.toResponse(result);
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
  ): Promise<ActionResponse> {
    const authUser = this.requireAuthUser(request);

    const result = await this.requestValidationActionUseCase.execute({
      organizationId: authUser.organizationId,
      actorRole: authUser.role,
      actionId,
      expectedVersion: body.expectedVersion,
    });

    return this.toResponse(result);
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
  ): Promise<ActionResponse> {
    const authUser = this.requireAuthUser(request);

    const result = await this.completeActionUseCase.execute({
      organizationId: authUser.organizationId,
      actorRole: authUser.role,
      actionId,
      expectedVersion: body.expectedVersion,
    });

    return this.toResponse(result);
  }

  /**
   * Delete an action.
   * @param request Authenticated request.
   * @param actionId Action identifier.
   * @param query Transition payload with expected version.
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
    @Query() query: ActionTransitionDto,
  ): Promise<ActionResponse> {
    const authUser = this.requireAuthUser(request);

    const result = await this.deleteActionUseCase.execute({
      organizationId: authUser.organizationId,
      actorRole: authUser.role,
      actionId,
      expectedVersion: query.expectedVersion,
    });

    return this.toResponse(result);
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
   * Build a response payload from an action aggregate.
   * @param snapshot Action snapshot.
   * @returns Action response payload.
   */
  private toResponse(snapshot: ActionSnapshot): ActionResponse {
    return {
      actionId: snapshot.actionId,
      state: snapshot.state,
      version: snapshot.version,
      updatedAt: snapshot.updatedAt.toISOString(),
    };
  }
}

type ActionSnapshot = {
  actionId: string;
  state: string;
  version: number;
  updatedAt: Date;
};
