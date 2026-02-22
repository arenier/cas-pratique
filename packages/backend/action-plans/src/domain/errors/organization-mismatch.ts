export class OrganizationMismatch extends Error {
  constructor(expectedOrganizationId: string, receivedOrganizationId: string) {
    super(
      `Organization mismatch: expected ${expectedOrganizationId}, received ${receivedOrganizationId}.`,
    );
    this.name = 'OrganizationMismatch';
  }
}
