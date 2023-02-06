import type { BrowserWindow } from 'electron'
import { debounce } from 'obsidian'
import type SuperPlan from 'src/main'
import type { PlanTracker } from 'src/tracker/plan-tracker'
import type { Maybe } from 'src/types'
import { getElectronAPI } from 'src/window/utils'

type Position = {
  x: number
  y: number
}

export class MiniTracker {
  private win: Maybe<BrowserWindow> = null
  private static instance: Maybe<MiniTracker> = null

  private constructor(private plugin: SuperPlan, private tracker: PlanTracker) {}

  static new(app: SuperPlan, tracker: PlanTracker) {
    if (MiniTracker.instance) return MiniTracker.instance
    return (MiniTracker.instance = new MiniTracker(app, tracker))
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
    return !this.win?.isDestroyed() && this.win?.isFocusable()
  }

  async open() {
    const { BrowserWindow, MessageChannelMain } = getElectronAPI()

    const { miniTracker } = await this.plugin.loadUserData()
    const position: Position | null = miniTracker ? miniTracker.position : null

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
    })

    if (__DEV__) {
      this.win.loadURL(import.meta.env.VITE_DEV_SERVER_URL + 'window/mini-tracker/index.html')
    } else {
      this.win.loadFile('./window/mini-tracker.html')
    }

    this.win.on('move', debounce(this.handleWindowMove, 500).bind(this))
  }

  private handleWindowMove() {
    if (!this.win) return
    const { x, y } = this.win.getBounds()
    this.plugin.saveUserData({
      miniTracker: {
        position: {
          x,
          y,
        },
      },
    })
  }
}
