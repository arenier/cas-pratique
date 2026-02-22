export class InvalidRoleAssignment extends Error {
  constructor(role: string) {
    super(`Invalid role assignment: ${role}.`);
    this.name = 'InvalidRoleAssignment';
  }
}
