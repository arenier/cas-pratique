import type { Request } from 'express';
import { Role } from '@backend/kernel';

export interface AuthUser {
  userId: string;
  organizationId: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  authUser?: AuthUser;
}
