import { randomUUID } from 'node:crypto';

import {
  Body,
  Controller,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';

import { Roles, type AuthenticatedRequest, validateDto } from '@repo/backend/shared';

import { CreateActionPlanUseCase } from '../application/use-cases/create-action-plan.use-case';
import { UpdateActionPlanDetailsUseCase } from '../application/use-cases/update-action-plan-details.use-case';
import { CreateActionPlanDto } from './dtos/create-action-plan.dto';
import { UpdateActionPlanDetailsDto } from './dtos/update-action-plan-details.dto';

export type CreateActionPlanResponse = {
  actionPlanId: string;
  organizationId: string;
};

export type UpdateActionPlanResponse = {
  actionPlanId: string;
};

@Controller('action-plans')
export class ActionPlansController {
  /**
   * Create a new ActionPlansController.
   * @param createActionPlanUseCase Create action plan use-case.
   * @param updateActionPlanDetailsUseCase Update action plan use-case.
   */
  constructor(
    @Inject(CreateActionPlanUseCase)
    private readonly createActionPlanUseCase: CreateActionPlanUseCase,
    @Inject(UpdateActionPlanDetailsUseCase)
    private readonly updateActionPlanDetailsUseCase: UpdateActionPlanDetailsUseCase,
  ) {}

  /**
   * Create a new action plan.
   * @param request Authenticated request.
   * @param body Action plan payload.
   * @returns Create action plan response.
   * @throws {UnauthorizedException} If authentication context is missing.
   * @throws {UnauthorizedActionPlanCreation} If the role is not allowed.
   * @throws {ActionPlanAlreadyExists} If the action plan already exists.
   */
  @Post()
  @Roles('ADMIN')
  @HttpCode(201)
  async createActionPlan(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateActionPlanDto,
  ): Promise<CreateActionPlanResponse> {
    const authUser = this.requireAuthUser(request);
    const payload = validateDto(CreateActionPlanDto, body);
    const actionPlanId = payload.actionPlanId ?? randomUUID();

    const result = await this.createActionPlanUseCase.execute({
      actionPlanId,
      organizationId: authUser.organizationId,
      actorRole: authUser.role,
      createdByUserId: authUser.userId,
      title: payload.title,
      description: payload.description,
    });

    return result;
  }

  /**
   * Update an action plan's details.
   * @param request Authenticated request.
   * @param actionPlanId Action plan identifier.
   * @param body Update payload.
   * @returns Update action plan response.
   * @throws {UnauthorizedException} If authentication context is missing.
   * @throws {UnauthorizedActionPlanUpdate} If the role is not allowed.
   * @throws {ActionPlanNotFound} If the action plan does not exist.
   */
  @Patch(':actionPlanId')
  @Roles('ADMIN', 'MANAGER')
  @HttpCode(200)
  async updateActionPlanDetails(
    @Req() request: AuthenticatedRequest,
    @Param('actionPlanId') actionPlanId: string,
    @Body() body: UpdateActionPlanDetailsDto,
  ): Promise<UpdateActionPlanResponse> {
    const authUser = this.requireAuthUser(request);
    const payload = validateDto(UpdateActionPlanDetailsDto, body);

    const result = await this.updateActionPlanDetailsUseCase.execute({
      organizationId: authUser.organizationId,
      actorRole: authUser.role,
      actionPlanId,
      title: payload.title,
      description: payload.description,
    });

    return result;
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
}
