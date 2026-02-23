import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

const BAD_REQUEST_ERRORS = new Set([
  'InvalidRoleAssignment',
  'InvalidStateTransition',
  'OrganizationMismatch',
  'InvalidActionStatus',
]);

// import { InvalidRoleAssignment } from '@repo/backend/organizations';

// const BAD_REQUEST_ERRORS2 = new Set([InvalidRoleAssignment]);

const CONFLICT_ERRORS = new Set([
  'ConcurrencyConflict',
  'LastAdminInvariantViolation',
  'ActionAlreadyExists',
  'ActionPlanAlreadyExists',
  'OrganizationAlreadyExists',
]);

const NOT_FOUND_ERRORS = new Set([
  'ActionNotFound',
  'ActionPlanNotFound',
  'OrganizationNotFound',
]);

@Catch(Error)
export class DomainExceptionFilter implements ExceptionFilter {
  /**
   * Map domain errors to HTTP responses.
   * @param exception Thrown error.
   * @param host Arguments host.
   */
  catch(exception: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      response.status(status).json(payload);
      return;
    }

    const status = this.mapStatus(exception);

    response.status(status).json({
      statusCode: status,
      error: exception.name,
      message: exception.message,
    });
  }

  /**
   * Resolve the HTTP status for a given error.
   * @param exception Thrown error.
   * @returns HTTP status code.
   */
  private mapStatus(exception: Error): number {
    if (BAD_REQUEST_ERRORS.has(exception.name)) {
      return HttpStatus.BAD_REQUEST;
    }

    if (exception.name.startsWith('Unauthorized')) {
      return HttpStatus.FORBIDDEN;
    }

    if (CONFLICT_ERRORS.has(exception.name)) {
      return HttpStatus.CONFLICT;
    }

    if (NOT_FOUND_ERRORS.has(exception.name)) {
      return HttpStatus.NOT_FOUND;
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
