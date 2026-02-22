import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import type { AuthenticatedRequest } from '../auth/auth-user';
import { TenancyGuard } from './tenancy.guard';

const createContext = (request: AuthenticatedRequest): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  }) as ExecutionContext;

describe('TenancyGuard', () => {
  it('allows when organization scope exists', () => {
    const guard = new TenancyGuard();
    const request = {
      authUser: {
        userId: 'user-1',
        organizationId: 'org-1',
        role: 'ADMIN',
      },
    } as AuthenticatedRequest;

    expect(guard.canActivate(createContext(request))).toBe(true);
  });

  it('rejects when organization scope is missing', () => {
    const guard = new TenancyGuard();
    const request = { authUser: undefined } as AuthenticatedRequest;

    expect(() => guard.canActivate(createContext(request))).toThrow(UnauthorizedException);
  });
});
