export class UnauthorizedActionPlanUpdate extends Error {
  constructor(role: string) {
    super(`Role ${role} is not allowed to update this action plan.`);
    this.name = 'UnauthorizedActionPlanUpdate';
  }
}
