import { randomUUID } from 'node:crypto';

import type { TransactionRunner } from '@repo/backend/shared';

import { Organization } from '../../domain/aggregates/organization';
import type { OrganizationRepository } from '../../domain/ports/organization-repository';
import type { CreateAccountCommand } from '../commands/create-account.command';
import { OrganizationAlreadyExists } from '../errors/organization-already-exists';
import type { CreateAccountResult } from '../results/create-account.result';

export class CreateAccountUseCase {
  /**
   * Create a new CreateAccountUseCase.
   * @param organizationRepository Repository for organizations.
   * @param transactionRunner Transaction runner.
   * @param generateOrganizationId Identifier generator.
   * @returns CreateAccountUseCase instance.
   * @throws {Error} Never thrown in the current implementation.
   */
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly transactionRunner: TransactionRunner,
    private readonly generateOrganizationId: () => string = () => randomUUID(),
  ) {}

  /**
   * Create a new organization account with an initial admin.
   * @param command Create account command.
   * @returns CreateAccountResult with identifiers.
   * @throws {OrganizationAlreadyExists} If the organization already exists.
   */
  async execute(command: CreateAccountCommand): Promise<CreateAccountResult> {
    const organizationId = this.resolveOrganizationId(command);

    return this.transactionRunner.runInTransaction(async () => {
      if (command.organizationId) {
        await this.assertOrganizationDoesNotExist(command.organizationId);
      }

      const organization = Organization.create({
        id: organizationId,
        name: command.organizationName,
        adminUser: {
          userId: command.adminUserId,
          email: command.adminEmail,
        },
      });

      await this.organizationRepository.save(organization);

      return {
        organizationId,
        adminUserId: command.adminUserId,
      };
    });
  }

  /**
   * Resolve the organization identifier for the command.
   * @param command Create account command.
   * @returns Organization identifier.
   * @throws {Error} Never thrown in the current implementation.
   */
  private resolveOrganizationId(command: CreateAccountCommand): string {
    return command.organizationId ?? this.generateOrganizationId();
  }

  /**
   * Ensure the organization does not already exist.
   * @param organizationId Organization identifier.
   * @returns void
   * @throws {OrganizationAlreadyExists} If the organization already exists.
   */
  private async assertOrganizationDoesNotExist(organizationId: string): Promise<void> {
    const existing = await this.organizationRepository.getById({ organizationId });

    if (existing) {
      throw new OrganizationAlreadyExists(organizationId);
    }
  }
}
