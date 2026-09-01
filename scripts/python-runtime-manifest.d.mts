export type PythonRuntimeAsset = Readonly<{
  archive: string;
  sha256: string;
  url: string;
}>;

export const PYTHON_RUNTIME: Readonly<{
  pythonVersion: string;
  releaseTag: string;
  assets: Readonly<Record<string, PythonRuntimeAsset>>;
}>;

export function runtimeAssetFor(platform: string, arch: string): PythonRuntimeAsset;
export function pythonExecutableRelativePath(platform: string): string;
export function validateRuntimeAssetRedirect(rawUrl: string): string;
