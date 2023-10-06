interface CodeBlockSyncInfo {
  source: string
  lineStart: number
  lineEnd: number
}

export class CodeBlockSync {
  private _listeners: Set<() => void> = new Set()
  private _info: CodeBlockSyncInfo = {
    source: '',
    lineStart: -1,
    lineEnd: -1,
  }

  constructor() {}

  subscribe(listener: () => void) {
    this._listeners.add(listener)
    return () => {
      this._listeners.delete(listener)
    }
  }

  notify(info: Partial<CodeBlockSyncInfo>) {
    this._info = { ...this._info, ...info }
    this._listeners.forEach(listener => listener())
  }

  getInfo() {
    return this._info
  }
}
