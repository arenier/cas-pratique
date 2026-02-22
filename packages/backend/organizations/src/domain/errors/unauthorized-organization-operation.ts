export class UnauthorizedOrganizationOperation extends Error {
  constructor(role: string) {
    super(`Role ${role} is not authorized to perform this operation.`);
    this.name = 'UnauthorizedOrganizationOperation';
  }
}
