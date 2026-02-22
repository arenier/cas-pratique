import type { TransactionRunner } from '@repo/backend/shared';

import type { OrganizationRepository } from '../../domain/ports/organization-repository';
import type { InviteUserCommand } from '../commands/invite-user.command';
import { OrganizationNotFound } from '../errors/organization-not-found';
import type { InviteUserResult } from '../results/invite-user.result';

export class InviteUserUseCase {
  /**
   * Create a new InviteUserUseCase.
   * @param organizationRepository Repository for organizations.
   * @param transactionRunner Transaction runner.
   * @returns InviteUserUseCase instance.
   * @throws {Error} Never thrown in the current implementation.
   */
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly transactionRunner: TransactionRunner,
  ) {}

  /**
   * Invite a user into an organization with a role.
   * @param command Invite user command.
   * @returns InviteUserResult with identifiers.
   * @throws {OrganizationNotFound} If the organization does not exist.
   */
  async execute(command: InviteUserCommand): Promise<InviteUserResult> {
    return this.transactionRunner.runInTransaction(async () => {
      const organization = await this.organizationRepository.getById({
        organizationId: command.organizationId,
      });

      if (!organization) {
        throw new OrganizationNotFound(command.organizationId);
      }

      organization.inviteUser({
        actorRole: command.actorRole,
        userId: command.userId,
        email: command.email,
        role: command.role,
      });

      await this.organizationRepository.save(organization);

      return {
        organizationId: command.organizationId,
        userId: command.userId,
        role: command.role,
      };
    });
  }
}
