import type { BrowserWindow } from 'electron'
import { debounce, normalizePath } from 'obsidian'
import { UserDataKey, type DataStore, type MiniTrackerData, type Position } from 'src/store'
import type { PlanTracker } from 'src/tracker/plan-tracker'
import type { Maybe } from 'src/types'
import { getElectronAPI } from 'src/window/utils'

const defaultMiniTrackerData: MiniTrackerData = {
  position: {},
}

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

  async open(windowFolderPath: string) {
    const electronAPI = getElectronAPI()
    const { BrowserWindow } = electronAPI

    const position = await this.loadPosition()

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
      skipTaskbar: true,
    })

    if (__DEV__) {
      this.win.loadURL(import.meta.env.VITE_DEV_SERVER_URL + 'window/mini-tracker/index.html')
    } else {
      const filePath = normalizePath(`${windowFolderPath}/mini-tracker/index.html`)

      const fs = require('node:fs/promises')
      const buffer = await fs.readFile(filePath)
      const content = buffer.toString('utf8')

      this.win.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(content)}`)
    }

    this.tracker.addObserver({
      update: (ongoing) => {
        this.win!.webContents.send('update', ongoing)
      },
    })

    this.win.on('move', debounce(this.handleWindowMove, 500).bind(this))

    window.addEventListener('pagehide', (e) => {
      MiniTracker.clean()
    })
  }

  private handleWindowMove() {
    if (!this.win) return
    const { x, y } = this.win.getBounds()
    this.savePosition({ x, y })
  }

  private async saveData(data: Partial<MiniTrackerData>) {
    const userData = await this.store.get(UserDataKey)
    const miniTrackerData = userData?.['miniTracker']
    this.store.set(UserDataKey, {
      ...userData,
      miniTracker: Object.assign({}, miniTrackerData, data),
    })
  }

  private async loadData() {
    let loadedUserData = await this.store.get(UserDataKey)
    if (!loadedUserData) {
      loadedUserData = {
        miniTracker: defaultMiniTrackerData,
      }

      await this.store.set(UserDataKey, loadedUserData)
    }

    const data = loadedUserData?.miniTracker ?? defaultMiniTrackerData
    return data
  }

  private async loadPosition() {
    const data = await this.loadData()
    const { screen } = getElectronAPI()
    const primaryDisplayId = screen.getPrimaryDisplay().id

    return data.position?.[primaryDisplayId]
  }

  private async savePosition(pos: Position) {
    const data = await this.loadData()
    const { screen } = getElectronAPI()
    const primaryDisplayId = screen.getPrimaryDisplay().id

    this.saveData({
      position: {
        ...data.position,
        [primaryDisplayId]: pos,
      },
    })
  }
}
