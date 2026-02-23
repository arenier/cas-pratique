import {
  Body,
  Controller,
  HttpCode,
  Inject,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';

import { Roles, type AuthenticatedRequest, validateDto } from '@repo/backend/shared';

import { CreateAccountUseCase } from '../application/use-cases/create-account.use-case';
import { InviteUserUseCase } from '../application/use-cases/invite-user.use-case';
import { CreateAccountDto } from './dtos/create-account.dto';
import { InviteUserDto } from './dtos/invite-user.dto';

export type CreateAccountResponse = {
  organizationId: string;
  adminUserId: string;
};

export type InviteUserResponse = {
  organizationId: string;
  userId: string;
  role: string;
};

@Controller()
export class OrganizationsController {
  /**
   * Create a new OrganizationsController.
   * @param createAccountUseCase Create account use-case.
   * @param inviteUserUseCase Invite user use-case.
   */
  constructor(
    @Inject(CreateAccountUseCase)
    private readonly createAccountUseCase: CreateAccountUseCase,
    @Inject(InviteUserUseCase)
    private readonly inviteUserUseCase: InviteUserUseCase,
  ) {}

  /**
   * Create a new organization account.
   * @param request Authenticated request.
   * @param body Account creation payload.
   * @returns Create account response.
   * @throws {UnauthorizedException} If admin user context is missing.
   * @throws {OrganizationAlreadyExists} If the organization already exists.
   */
  @Post('accounts')
  @HttpCode(201)
  async createAccount(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateAccountDto,
  ): Promise<CreateAccountResponse> {
    const payload = validateDto(CreateAccountDto, body);
    const adminUserId = this.resolveAdminUserId(request, payload);

    return this.createAccountUseCase.execute({
      organizationName: payload.organizationName,
      adminEmail: payload.adminEmail,
      adminUserId,
    });
  }

  /**
   * Invite a user into the current organization.
   * @param request Authenticated request.
   * @param body Invite payload.
   * @returns Invite user response.
   * @throws {UnauthorizedException} If authentication context is missing.
   * @throws {OrganizationNotFound} If the organization does not exist.
   * @throws {UnauthorizedOrganizationOperation} If actor role is not allowed.
   * @throws {InvalidRoleAssignment} If role assignment is invalid.
   */
  @Post('users/invite')
  @Roles('ADMIN')
  @HttpCode(201)
  async inviteUser(
    @Req() request: AuthenticatedRequest,
    @Body() body: InviteUserDto,
  ): Promise<InviteUserResponse> {
    const authUser = this.requireAuthUser(request);
    const payload = validateDto(InviteUserDto, body);

    return this.inviteUserUseCase.execute({
      organizationId: authUser.organizationId,
      actorRole: authUser.role,
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });
  }

  /**
   * Resolve the admin user identifier for account creation.
   * @param request Authenticated request.
   * @param body Account payload.
   * @returns Admin user identifier.
   * @throws {UnauthorizedException} If no admin user identifier is available.
   */
  private resolveAdminUserId(request: AuthenticatedRequest, body: CreateAccountDto): string {
    if (body.adminUserId) {
      return body.adminUserId;
    }

    if (request.authUser?.userId) {
      return request.authUser.userId;
    }

    throw new UnauthorizedException('Missing admin user context.');
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
