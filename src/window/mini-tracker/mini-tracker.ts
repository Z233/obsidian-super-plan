import type { BrowserWindow } from 'electron'
import { debounce } from 'obsidian'
import { UserDataKey, type DataStore, type MiniTrackerData, type Position } from 'src/store'
import type { PlanTracker } from 'src/tracker/plan-tracker'
import type { Maybe } from 'src/types'
import { getElectronAPI } from 'src/window/utils'

export class MiniTracker {
  private win: Maybe<BrowserWindow> = null
  private static instance: Maybe<MiniTracker> = null

  private constructor(private store: DataStore, private tracker: PlanTracker) {}

  static new(store: DataStore, tracker: PlanTracker) {
    if (MiniTracker.instance) return MiniTracker.instance
    return (MiniTracker.instance = new MiniTracker(store, tracker))
  }

  static clean() {
    if (!MiniTracker.instance) return
    const instance = MiniTracker.instance
    instance.close()
    MiniTracker.instance = null
  }

  close() {
    if (this.isOpen) this.win?.close()
    this.win?.removeAllListeners()
  }

  get isOpen() {
    return !this.win?.isDestroyed() && this.win?.isVisible()
  }

  async open() {
    const { BrowserWindow, MessageChannelMain } = getElectronAPI()

    const data = await this.loadData()
    const position: Position | null = data ? data.position : null

    this.win = new BrowserWindow({
      frame: false,
      alwaysOnTop: true,
      width: 180,
      height: 60,
      hasShadow: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
      x: position?.x,
      y: position?.y,
      focusable: false,
      resizable: false,
    })

    if (__DEV__) {
      this.win.loadURL(import.meta.env.VITE_DEV_SERVER_URL + 'window/mini-tracker/index.html')
      // this.win.webContents.openDevTools()
    } else {
      this.win.loadFile('./window/mini-tracker.html')
    }

    this.tracker.addObserver({
      update: (ongoing) => {
        this.win!.webContents.send('update', ongoing)
      },
    })

    this.win.on('move', debounce(this.handleWindowMove, 500).bind(this))
  }

  private handleWindowMove() {
    if (!this.win) return
    const { x, y } = this.win.getBounds()
    this.saveData({
      position: {
        x,
        y,
      },
    })
  }

  private async saveData(data: Partial<MiniTrackerData>) {
    const userData = await this.store.get(UserDataKey)
    const miniTrackerData: MiniTrackerData = userData['miniTracker']
    this.store.set(UserDataKey, {
      ...userData,
      miniTracker: Object.assign(miniTrackerData, data),
    })
  }

  private async loadData() {
    const userData = await this.store.get(UserDataKey)
    return userData['miniTracker']
  }
}
