import { Module } from '@nestjs/common';
import { AuthGuard } from './auth/auth.guard';
import { TenancyGuard } from './tenancy/tenancy.guard';
import { RolesGuard } from './rbac/roles.guard';
import { DomainExceptionFilter } from './errors/domain-exception.filter';

@Module({
  providers: [AuthGuard, TenancyGuard, RolesGuard, DomainExceptionFilter],
  exports: [AuthGuard, TenancyGuard, RolesGuard, DomainExceptionFilter],
})
/**
 * Shared infrastructure module exposing guards and filters.
 */
export class SharedModule {}
