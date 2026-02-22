import { describe, expect, it } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthenticatedRequest } from './auth-user';
import { ExecutionContext } from '@nestjs/common';

const createContext = (request: AuthenticatedRequest): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  }) as ExecutionContext;

describe('AuthGuard', () => {
  it('attaches authUser from headers', () => {
    const guard = new AuthGuard();
    const request = {
      headers: {
        'x-user-id': 'user-1',
        'x-org-id': 'org-1',
        'x-role': 'ADMIN',
      },
    } as any as AuthenticatedRequest;

    const result = guard.canActivate(createContext(request));

    expect(result).toBe(true);
    expect(request.authUser).toEqual({
      userId: 'user-1',
      organizationId: 'org-1',
      role: 'ADMIN',
    });
  });

  it('rejects missing headers', () => {
    const guard = new AuthGuard();
    const request = { headers: {} } as AuthenticatedRequest;

    expect(() => guard.canActivate(createContext(request))).toThrow(
      UnauthorizedException
    );
  });

  it('rejects invalid role header', () => {
    const guard = new AuthGuard();
    const request = {
      headers: {
        'x-user-id': 'user-1',
        'x-org-id': 'org-1',
        'x-role': 'OWNER',
      },
    } as any as AuthenticatedRequest;

    expect(() => guard.canActivate(createContext(request))).toThrow(
      UnauthorizedException
    );
  });
});
