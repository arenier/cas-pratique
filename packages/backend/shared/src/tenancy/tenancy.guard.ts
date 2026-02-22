import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import type { AuthenticatedRequest } from '../auth/auth-user';

@Injectable()
export class TenancyGuard implements CanActivate {
  /**
   * Ensure the request is scoped to an organization.
   * @param context Execution context.
   * @returns True when organization scope exists.
   * @throws {UnauthorizedException} If organization scope is missing.
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.authUser?.organizationId) {
      throw new UnauthorizedException('Missing organization scope.');
    }

    return true;
  }
}
