import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticatedRequest } from './auth-user';
import { isRole } from '@backend/kernel';

@Injectable()
export class AuthGuard implements CanActivate {
  /**
   * Attach AuthUser to request from mock headers.
   * @param context Execution context.
   * @returns True when authentication headers are valid.
   * @throws {UnauthorizedException} If headers are missing or invalid.
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const userId = this.getHeader(request, 'x-user-id');
    const organizationId = this.getHeader(request, 'x-org-id');
    const roleHeader = this.getHeader(request, 'x-role');

    if (!userId || !organizationId || !roleHeader) {
      throw new UnauthorizedException('Missing authentication headers.');
    }

    if (!isRole(roleHeader)) {
      throw new UnauthorizedException('Invalid role header.');
    }

    request.authUser = {
      userId,
      organizationId,
      role: roleHeader,
    };

    return true;
  }

  /**
   * Read a single-valued header.
   * @param request Express request.
   * @param headerName Header key.
   * @returns Header value or undefined.
   */
  private getHeader(request: AuthenticatedRequest, headerName: string): string | undefined {
    const value = request.headers[headerName];

    if (Array.isArray(value)) {
      return value[0];
    }

    return value;
  }
}
