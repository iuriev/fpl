let shuttingDown = false;

export function requestShutdown(): void {
  shuttingDown = true;
}

export function isShuttingDown(): boolean {
  return shuttingDown;
}

export function resetShutdownStateForTests(): void {
  shuttingDown = false;
}
