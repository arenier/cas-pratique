import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { Role } from '@repo/backend/kernel';

import type { AuthenticatedRequest } from '../auth/auth-user';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * Enforce role requirements declared via @Roles.
   * @param context Execution context.
   * @returns True when the role is authorized.
   * @throws {UnauthorizedException} If auth context is missing.
   * @throws {ForbiddenException} If role is insufficient.
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const role = request.authUser?.role;

    if (!role) {
      throw new UnauthorizedException('Missing authentication context.');
    }

    if (!requiredRoles.includes(role)) {
      throw new ForbiddenException('Insufficient role.');
    }

    return true;
  }
}
