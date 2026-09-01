type StartupBoundaryDependencies = {
  showError(message: string): void;
  quit(): void;
};

export function createStartupBoundary({ showError, quit }: StartupBoundaryDependencies) {
  return async function runStartupTask(task: Promise<unknown>): Promise<void> {
    try {
      await task;
    } catch (reason) {
      showError(reason instanceof Error ? reason.message : String(reason));
      quit();
    }
  };
}
