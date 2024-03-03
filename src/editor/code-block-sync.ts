interface CodeBlockSyncInfo {
  source: string
  lineStart: number
  lineEnd: number
}

export class CodeBlockSync {
  private listeners: Set<() => void> = new Set()

  constructor(private info: CodeBlockSyncInfo) {}

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  notify(info: Partial<CodeBlockSyncInfo>) {
    this.info = { ...this.info, ...info }
    this.listeners.forEach(listener => listener())
  }

  getInfo() {
    return this.info
  }
}
