import { App, Editor, MarkdownView, Modal, Notice, Plugin, Setting } from 'obsidian'
import { PlanFile } from './plan-file'
import { Parser } from './parser'
import { PlanEditor } from './plan-editor'
import { defaultSettings, SuperPlanSettings } from './settings'
import { PlanManager } from './plan-manager'
import { SuperPlanSettingsTab } from './settings-tab'
import { PlanTracker } from './plan-tracker'
import { timer } from './timer'
import { SplitConfirmModal } from './modals'
import type { ActivitiesData, Maybe } from './types'
import { isEqual } from 'lodash-es'
import 'electron'

export default class SuperPlan extends Plugin {
  settings: SuperPlanSettings

  private file: PlanFile
  private parser: Parser
  private cmEditors: CodeMirror.Editor[]
  private tracker: PlanTracker

  async onload() {
    await this.loadSettings()

    this.parser = new Parser(this.settings)
    this.file = new PlanFile(this.app.vault, this.parser, this.settings)

    this.tracker = new PlanTracker(
      this.app,
      this.parser,
      this.file,
      this.settings,
      this.addStatusBarItem()
    )
    this.tracker.init()

    new PlanManager(this, this.parser)

    this.cmEditors = []
    this.registerCodeMirror((cm) => {
      this.cmEditors.push(cm)
      cm.on('keydown', this.handleKeyDown)
    })

    this.addCommand({
      id: 'insert-plan-table',
      name: 'Insert plan table',
      editorCallback: (editor: Editor, view: MarkdownView) => {
        this.newPerformTableAction((pe) => {
          pe.insertPlanTable()
        })(false, editor, view)
      },
    })

    this.addCommand({
      id: 'insert-activity-below-current',
      name: 'Insert activity below current',
      editorCheckCallback: this.newPerformTableAction((pe) => {
        pe.insertActivityBelow()
      }),
    })

    this.addCommand({
      id: 'insert-activity-above-current',
      name: 'Insert activity above current',
      editorCheckCallback: this.newPerformTableAction((pe) => {
        pe.insertActivityAbove()
      }),
    })

    this.addCommand({
      id: 'begin-activity',
      name: 'Begin activity',
      editorCheckCallback: this.newPerformTableAction((pe) => {
        pe.beginCursorActivity()
      }),
    })

    this.addCommand({
      id: 'split-activity',
      name: 'Split activity',
      editorCheckCallback: this.newPerformTableAction((pe) => {
        new SplitConfirmModal(this.app, pe, this.tracker).open()
      }),
    })

    this.addCommand({
      id: 'ignore-activity',
      name: 'Ignore activity',
      editorCheckCallback: this.newPerformTableAction((pe) => {
        pe.ignoreActivity()
      }),
    })

    this.addCommand({
      id: 'fix-activity',
      name: 'Fix activity',
      editorCheckCallback: this.newPerformTableAction((pe) => {
        pe.fixCursorActivity()
      }),
    })

    this.addCommand({
      id: 'open-tracker-window',
      name: 'Open tracker window',
      callback: () => {
        const { BrowserWindow } = (require('electron') as any)
          .remote as Electron.RemoteMainInterface

        const win = new BrowserWindow()

        if (__DEV__) {
          win.loadURL(import.meta.env.VITE_DEV_SERVER_URL + 'windows/tracker/index.html')
        } else {
          win.loadFile('./windows/tracker.html')
        }
      },
    })

    this.addSettingTab(new SuperPlanSettingsTab(this.app, this))

    this.registerInterval(timer.intervalId)

    this.tick()
    timer.onTick(this.tick.bind(this))
  }

  private lastActivitiesData: Maybe<ActivitiesData> = null
  async tick() {
    const content = await this.file.getTodayPlanFileContent()
    if (content) {
      const tableInfo = this.parser.findPlanTable(content)
      if (tableInfo) {
        const { table } = tableInfo
        const activitiesData = this.parser.transformTable(table)
        if (!isEqual(activitiesData, this.lastActivitiesData)) {
          this.lastActivitiesData = activitiesData
          this.tracker.setData(activitiesData, tableInfo)
        }
      } else {
        this.tracker.setData(null, null)
      }
    }
  }

  onunload() {
    this.cmEditors.forEach((cm) => {
      cm.off('keydown', this.handleKeyDown)
    })
    timer.removeListener()
  }

  // TODO: handle key for CM5
  private readonly handleKeyDown = (cm: CodeMirror.Editor, event: KeyboardEvent): void => {
    if (['Tab', 'Enter'].contains(event.key)) {
    }
  }

  readonly newPerformPlanActionCM6 =
    (fn: (pe: PlanEditor) => void, force = false): (() => boolean) =>
    (): boolean => {
      const view = this.app.workspace.getActiveViewOfType(MarkdownView)
      if (view) {
        const pe = new PlanEditor(this.app, view.file, view.editor, this.parser, this.settings)

        if (force || pe.cursorIsInPlan()) {
          fn(pe)
          return true
        }
      }

      return false
    }

  private readonly newPerformTableAction =
    (fn: (pe: PlanEditor) => void, alertOnNoTable = true) =>
    (checking: boolean, editor: Editor, view: MarkdownView): boolean | void => {
      const pe = new PlanEditor(this.app, view.file, editor, this.parser, this.settings)

      if (checking) {
        return pe.cursorIsInPlan()
      }

      fn(pe)
    }

  async loadSettings() {
    const settingsOptions = Object.assign(defaultSettings, await this.loadData())
    this.settings = new SuperPlanSettings(this, settingsOptions)
    this.saveData(this.settings.serialize())
  }

  async saveSettings() {
    await this.saveData(this.settings.serialize())
  }
}
