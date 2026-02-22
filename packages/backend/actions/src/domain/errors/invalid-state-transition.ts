export class InvalidStateTransition extends Error {
  constructor(currentState: string, nextState: string) {
    super(`Invalid state transition from ${currentState} to ${nextState}.`);
    this.name = 'InvalidStateTransition';
  }
}
