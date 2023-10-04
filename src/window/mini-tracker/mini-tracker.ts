import type { BrowserWindow } from 'electron'
import { debounce, normalizePath } from 'obsidian'
import { UserDataKey, type DataStore, type MiniTrackerData, type Position } from 'src/store'
import type { Observer, PlanTracker } from 'src/tracker/plan-tracker'
import type { Maybe } from 'src/types'
import { getElectronAPI } from 'src/window/utils'

const SNAPPING_DISTANCE = 24
const SNAPPING_VISIBLE_EDGE = 16

const Size = {
  WIDTH: 180,
  HEIGHT: 60,
}

const defaultMiniTrackerData: MiniTrackerData = {
  position: {},
}

export class MiniTracker {
  private win: Maybe<BrowserWindow> = null
  private static instance: Maybe<MiniTracker> = null

  private onCloseCallbacks: (() => void)[] = []

  private isSnapping = false

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

  onClose(callback: () => void) {
    this.onCloseCallbacks.push(callback)
  }

  close() {
    if (this.isOpen) {
      this.win?.close()
    }

    this.onCloseCallbacks.forEach((cb) => cb())

    this.tracker.removeObserver(this.trackerObserver)
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
      width: Size.WIDTH,
      height: Size.HEIGHT,
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
      // Enable DevTools
      this.win.webContents.openDevTools()
      this.win.webContents.executeJavaScript(
        'console.log("%c====== MiniTracker DevTools ======", "color: red; font-size: 20px;")'
      )
    } else {
      this.win.loadURL(`data:text/html;charset=UTF-8,__MINI_TRACKER_HTML__`)
    }

    this.tracker.addObserver(this.trackerObserver)

    this.win.on('moved', this.handleWindowMove.bind(this))
    this.win.on('close', this.close.bind(this))

    // Close Mini Tracker when Obsidian main window close
    window.addEventListener('pagehide', (e) => {
      MiniTracker.clean()
    })
  }

  private trackerObserver: Observer = {
    update: (ongoing) => {
      this.win!.webContents.send('update', ongoing)
    },
  }

  private async handleWindowMove() {
    if (!this.win) return

    const { x, y, width } = this.win.getBounds()

    this.savePosition({ x, y })

    // #region ==================== Snapping ====================

    const { screen } = getElectronAPI()
    const display = screen.getDisplayMatching(this.win.getBounds())
    const { width: screenWidth } = display.bounds

    let snapped: 'l' | 'r' | null = null

    const snapToRight = () => this.win!.setPosition(screenWidth - SNAPPING_VISIBLE_EDGE, y, true)
    const snapToLeft = () => this.win!.setPosition(SNAPPING_VISIBLE_EDGE - Size.WIDTH, y, true)
    const makeAppRegionChangesWork = () => {
      this.win!.setBounds({ width: width + 1 })
      this.win!.setBounds({ width })
    }

    // Right
    if (x >= screenWidth - Size.WIDTH + SNAPPING_DISTANCE) {
      snapToRight()
      snapped = 'r'
    }
    // Left
    else if (x <= -SNAPPING_DISTANCE) {
      snapToLeft()
      snapped = 'l'
    }

    if (snapped) {
      this.win.webContents.send('snapped', snapped)
      makeAppRegionChangesWork()

      this.win.webContents.on('ipc-message', (event, channel) => {
        if (!this.win || snapped === null) return

        if (channel === 'snapped-stop') {
          snapped === 'l'
            ? this.win.setPosition(SNAPPING_VISIBLE_EDGE, y)
            : this.win.setPosition(screenWidth - Size.WIDTH - SNAPPING_VISIBLE_EDGE, y)
          snapped = null
        }

        if (channel === 'snapped-view-start') {
          snapped === 'l'
            ? this.win.setPosition(0, y)
            : this.win.setPosition(screenWidth - Size.WIDTH + SNAPPING_VISIBLE_EDGE, y)
        }

        if (channel === 'snapped-view-end') {
          snapped === 'l'
            ? snapToLeft()
            : snapToRight() 
        }
      })
    }

    // #endregion
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
