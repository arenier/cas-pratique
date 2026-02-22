import type { Organization } from '../aggregates/organization';

export interface OrganizationRepository {
  /**
   * Fetch an organization by identifier.
   * @param params Lookup parameters.
   * @param params.organizationId Organization identifier.
   * @returns The matching organization or null when missing.
   * @throws {Error} If the repository cannot read the organization.
   */
  getById(params: { organizationId: string }): Promise<Organization | null>;

  /**
   * Persist an organization aggregate.
   * @param organization Organization to persist.
   * @returns void
   * @throws {Error} If the repository cannot save the organization.
   */
  save(organization: Organization): Promise<void>;
}
