export class UserNotInOrganization extends Error {
  constructor(userId: string) {
    super(`User ${userId} is not a member of the organization.`);
    this.name = 'UserNotInOrganization';
  }
}
