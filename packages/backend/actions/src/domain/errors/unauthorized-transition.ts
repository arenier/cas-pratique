export class UnauthorizedTransition extends Error {
  constructor(role: string) {
    super(`Role ${role} is not allowed to perform this transition.`);
    this.name = 'UnauthorizedTransition';
  }
}
