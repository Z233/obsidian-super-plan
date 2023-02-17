import { Editor, FileSystemAdapter, MarkdownView, Notice, Plugin } from 'obsidian'
import { PlanFile } from './file'
import { Parser } from './parser'
import { TableEditor } from './editor/table-editor'
import { defaultSettings, SuperPlanSettings } from './setting/settings'
import { EditorExtension } from './editor/editor-extension'
import { SuperPlanSettingsTab } from './setting/settings-tab'
import { PlanTracker } from './tracker/plan-tracker'
import { timer } from './tracker/timer'
import { SplitConfirmModal } from './ui/modals'
import type { ActivitiesData, Maybe } from './types'
import { isEqual } from 'lodash-es'
import 'electron'
import { ActivitySuggester } from './ui/suggest/activity-suggester'
import { ActivityProvider } from './ui/suggest/activity-provider'
import './style.css'
import { MiniTracker } from './window'
import { DataStore, SettingsDataKey } from './store'

export default class SuperPlan extends Plugin {
  settings: SuperPlanSettings
  activityProvider: Maybe<ActivityProvider> = null

  private store: DataStore

  private file: PlanFile
  private parser: Parser
  private tracker: PlanTracker

  async onload() {
    this.store = new DataStore(this)

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

    const editorExtension = new EditorExtension(this, this.parser)
    this.registerEditorExtension(editorExtension.makeEditorRemappingExtension())
    this.registerEditorExtension(editorExtension.makeEditorUpdateListenerExtension())

    if (this.settings.enableActivityAutoCompletion) {
      const provider = (this.activityProvider = new ActivityProvider(this.settings))
      editorExtension.setProvider(provider)
      this.registerEditorSuggest(new ActivitySuggester(this.app, provider, this.settings))
    }

    if (this.settings.enableMiniTracker) {
      const miniTracker = MiniTracker.new(this.store, this.tracker)

      let windowFolder: string | undefined
      const pluginDir = this.manifest.dir
      if (this.app.vault.adapter instanceof FileSystemAdapter && pluginDir) {
        windowFolder = this.app.vault.adapter.getFullPath(`${pluginDir}/window`)
      }

      if (windowFolder) {
        miniTracker.open(windowFolder)
      } else {
        new Notice(`Error: can't init mini tracker window.`)
      }
    } else {
      MiniTracker.clean()
    }

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
      id: 'toggle-fix-activity',
      name: 'Toggle fix to activity',
      editorCheckCallback: this.newPerformTableAction((pe) => {
        pe.toggleFixCursorActivity()
      }),
    })

    this.addCommand({
      id: 'unfix-all-activities',
      name: 'Unfix all activities',
      editorCheckCallback: this.newPerformTableAction((pe) => {
        pe.unfixAllActivities()
      }),
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
    timer.removeListener()
    MiniTracker.clean()
  }

  readonly newPerformPlanActionCM6 =
    (fn: (te: TableEditor) => void, force = false): (() => boolean) =>
    (): boolean => {
      const view = this.app.workspace.getActiveViewOfType(MarkdownView)
      if (view) {
        const te = new TableEditor(view.file, view.editor, this.settings)

        if (force || te.cursorIsInPlan()) {
          fn(te)
          return true
        }
      }

      return false
    }

  private readonly newPerformTableAction =
    (fn: (te: TableEditor) => void, alertOnNoTable = true) =>
    (checking: boolean, editor: Editor, view: MarkdownView): boolean | void => {
      const pe = new TableEditor(view.file, editor, this.settings)

      if (checking) {
        return pe.cursorIsInPlan()
      }

      fn(pe)
    }

  async loadSettings() {
    const data = await this.store.get(SettingsDataKey)
    const settingsOptions = Object.assign(defaultSettings, data)
    this.settings = new SuperPlanSettings(this, settingsOptions)
    this.saveSettings()
  }

  async saveSettings() {
    await this.store.set(SettingsDataKey, this.settings.serialize())
  }
}
