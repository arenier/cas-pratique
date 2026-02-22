export class UnauthorizedActionPlanCreation extends Error {
  constructor(role: string) {
    super(`Role ${role} is not allowed to create an action plan.`);
    this.name = 'UnauthorizedActionPlanCreation';
  }
}
