export function getElectronAPI() {
  return (require('electron') as any).remote as Electron.RemoteMainInterface
}
