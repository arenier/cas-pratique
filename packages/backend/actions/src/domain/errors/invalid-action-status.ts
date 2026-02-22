export class InvalidActionStatus extends Error {
  constructor(value: string) {
    super(`Invalid action status: ${value}`);
    this.name = 'InvalidActionStatus';
  }
}
