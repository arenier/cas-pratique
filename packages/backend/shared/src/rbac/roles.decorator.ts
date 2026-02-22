import { SetMetadata } from '@nestjs/common';

import type { Role } from '@repo/backend/kernel';

export const ROLES_KEY = 'roles';

/**
 * Declare required roles for a handler or controller.
 * @param roles Allowed roles.
 * @returns Decorator to set roles metadata.
 */
export const Roles = (...roles: Role[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
