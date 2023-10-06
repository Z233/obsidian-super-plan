export function getElectronAPI() {
  // eslint-disable-next-line ts/no-var-requires, ts/no-require-imports
  return (require('electron') as any).remote as Electron.RemoteMainInterface
}
