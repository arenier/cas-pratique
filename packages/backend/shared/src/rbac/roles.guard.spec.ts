import 'reflect-metadata';

import { describe, expect, it } from 'vitest';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { AuthenticatedRequest } from '../auth/auth-user';
import { ROLES_KEY } from './roles.decorator';

const createContext = (request: AuthenticatedRequest, handler: unknown, clazz: unknown): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => handler,
    getClass: () => clazz,
  }) as ExecutionContext;

describe('RolesGuard', () => {
  it('allows when no roles metadata is set', () => {
    const guard = new RolesGuard(new Reflector());
    const request = { authUser: { userId: 'u', organizationId: 'o', role: 'USER' } } as AuthenticatedRequest;
    const handler = () => undefined;
    const clazz = class {};

    expect(guard.canActivate(createContext(request, handler, clazz))).toBe(true);
  });

  it('rejects when auth context is missing', () => {
    const guard = new RolesGuard(new Reflector());
    const handler = () => undefined;
    const clazz = class {};
    Reflect.defineMetadata(ROLES_KEY, ['ADMIN'], handler);

    expect(() => guard.canActivate(createContext({} as AuthenticatedRequest, handler, clazz))).toThrow(
      UnauthorizedException
    );
  });

  it('rejects when role is insufficient', () => {
    const guard = new RolesGuard(new Reflector());
    const handler = () => undefined;
    const clazz = class {};
    Reflect.defineMetadata(ROLES_KEY, ['ADMIN'], handler);

    const request = { authUser: { userId: 'u', organizationId: 'o', role: 'USER' } } as AuthenticatedRequest;

    expect(() => guard.canActivate(createContext(request, handler, clazz))).toThrow(ForbiddenException);
  });

  it('allows when role is authorized', () => {
    const guard = new RolesGuard(new Reflector());
    const handler = () => undefined;
    const clazz = class {};
    Reflect.defineMetadata(ROLES_KEY, ['ADMIN', 'MANAGER'], handler);

    const request = { authUser: { userId: 'u', organizationId: 'o', role: 'MANAGER' } } as AuthenticatedRequest;

    expect(guard.canActivate(createContext(request, handler, clazz))).toBe(true);
  });
});
