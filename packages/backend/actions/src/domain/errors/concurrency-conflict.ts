export class ConcurrencyConflict extends Error {
  constructor(expectedVersion: number, currentVersion: number) {
    super(
      `Concurrency conflict: expected version ${expectedVersion}, current version is ${currentVersion}.`,
    );
    this.name = 'ConcurrencyConflict';
  }
}
