import { type ArgumentsHost, BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { DomainExceptionFilter } from './domain-exception.filter';

const createHost = () => {
  const response = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
    }),
  } as ArgumentsHost;

  return { host, response };
};

describe('DomainExceptionFilter', () => {
  it('passes through HttpException responses', () => {
    const filter = new DomainExceptionFilter();
    const { host, response } = createHost();
    const exception = new BadRequestException('bad');

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalled();
  });

  it('maps bad request domain errors to 400', () => {
    const filter = new DomainExceptionFilter();
    const { host, response } = createHost();
    const error = new Error('invalid');
    error.name = 'InvalidStateTransition';

    filter.catch(error, host);

    expect(response.status).toHaveBeenCalledWith(400);
  });

  it('maps unauthorized domain errors to 403', () => {
    const filter = new DomainExceptionFilter();
    const { host, response } = createHost();
    const error = new Error('nope');
    error.name = 'UnauthorizedActionPlanUpdate';

    filter.catch(error, host);

    expect(response.status).toHaveBeenCalledWith(403);
  });

  it('maps conflict domain errors to 409', () => {
    const filter = new DomainExceptionFilter();
    const { host, response } = createHost();
    const error = new Error('conflict');
    error.name = 'ConcurrencyConflict';

    filter.catch(error, host);

    expect(response.status).toHaveBeenCalledWith(409);
  });

  it('maps unknown errors to 500', () => {
    const filter = new DomainExceptionFilter();
    const { host, response } = createHost();
    const error = new Error('boom');
    error.name = 'SomeOtherError';

    filter.catch(error, host);

    expect(response.status).toHaveBeenCalledWith(500);
  });
});
