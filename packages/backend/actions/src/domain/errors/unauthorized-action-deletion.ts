export class UnauthorizedActionDeletion extends Error {
  constructor(role: string) {
    super(`Role ${role} is not allowed to delete this action.`);
    this.name = 'UnauthorizedActionDeletion';
  }
}
