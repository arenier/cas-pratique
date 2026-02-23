import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

type DtoClass<T> = new () => T;

/**
 * Validate a DTO payload and return the typed instance.
 * @param dtoClass DTO constructor.
 * @param payload Incoming payload.
 * @returns Validated DTO instance.
 * @throws {BadRequestException} When validation fails.
 */
export const validateDto = <T>(dtoClass: DtoClass<T>, payload: unknown): T => {
  const instance = plainToInstance(dtoClass, payload, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(instance as object, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  if (errors.length > 0) {
    throw new BadRequestException(errors);
  }

  return instance;
};
