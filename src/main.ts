import { Editor, MarkdownView, Plugin, Platform, type Command, TFile } from 'obsidian'
import { MdTableParser, Parser } from './parser'
import { TableEditor } from './editor/table-editor'
import { defaultSettings, SuperPlanSettings } from './setting/settings'
import { EditorExtension } from './editor/editor-extension'
import { SuperPlanSettingsTab } from './setting/settings-tab'
import { SplitConfirmModal } from './ui/modals'
import type { Maybe } from './types'
import { ActivitySuggester } from './ui/suggest/activity-suggester'
import { ActivityProvider } from './ui/suggest/activity-provider'
import { MiniTracker } from './window'
import { DataStore, SettingsDataKey } from './store'
import { loadIcons } from './ui/icons'
import { desktopInit } from './platform/desktop'
import { Timer } from './tracker/timer'
import './style.css'
import { MdTableEditor } from './editor/md-table-editor'
import type { Table } from '@tgrosinger/md-advanced-tables'
import { MdPlan } from './ui/plan/Plan'
import { UpdateFlag } from './constants'

export default class SuperPlan extends Plugin {
  settings: SuperPlanSettings
  activityProvider: Maybe<ActivityProvider> = null

  private store: DataStore

  private parser: Parser

  async onload() {
    this.store = new DataStore(this)

    await this.loadSettings()
    this.addSettingTab(new SuperPlanSettingsTab(this.app, this))

    this.parser = new Parser(this.settings)

    if (Platform.isDesktopApp) {
      const timer = Timer.new()

      this.registerInterval(timer.intervalId)

      desktopInit(this.app, this.manifest, this.settings, this.store, this.addStatusBarItem())
    }

    const editorExtension = new EditorExtension(this, this.parser)
    this.registerEditorExtension(editorExtension.makeEditorRemappingExtension())
    this.registerEditorExtension(editorExtension.makeEditorUpdateListenerExtension())

    if (this.settings.enableActivityAutoCompletion) {
      const provider = (this.activityProvider = new ActivityProvider(this.settings))
      editorExtension.setProvider(provider)
      this.registerEditorSuggest(new ActivitySuggester(this.app, provider, this.settings))
    }

    this.registerMarkdownCodeBlockProcessor('super-plan', (source, el, ctx) => {
      const selection = ctx.getSectionInfo(el)

      if (selection && !window[UpdateFlag]) {
        const { lineStart, lineEnd } = selection
        const file = this.app.vault.getAbstractFileByPath(ctx.sourcePath) as TFile

        const getMte = (table: Table) =>
          new MdTableEditor({
            app: this.app,
            file,
            table,
            startRow: lineStart + 1,
            endRow: lineEnd - 1,
          })

        ctx.addChild(new MdPlan(el, source, getMte))
      }
    })

    loadIcons()

    this.addCommand({
      id: 'insert-plan-table',
      name: 'Insert plan table',
      icon: 'list-plus',
      editorCallback: (editor: Editor, view: MarkdownView) => {
        this.newPerformTableAction((pe) => {
          pe.insertPlanTable()
        })(false, editor, view)
      },
    })

    this.addCommand({
      id: 'insert-activity-below-current',
      name: 'Insert activity below current',
      icon: 'row-insert-bottom',
      editorCheckCallback: this.newPerformTableAction((pe) => {
        pe.insertActivityBelow()
      }),
    })

    this.addCommand({
      id: 'insert-activity-above-current',
      name: 'Insert activity above current',
      icon: 'row-insert-top',
      editorCheckCallback: this.newPerformTableAction((pe) => {
        pe.insertActivityAbove()
      }),
    })

    this.addCommand({
      id: 'begin-activity',
      name: 'Begin activity',
      icon: 'play',
      editorCheckCallback: this.newPerformTableAction((pe) => {
        pe.beginCursorActivity()
      }),
    })

    this.addCommand({
      id: 'split-activity',
      name: 'Split activity',
      icon: 'separator-horizontal',
      editorCheckCallback: this.newPerformTableAction((pe) => {
        new SplitConfirmModal(this.app, pe).open()
      }),
    })

    this.addCommand({
      id: 'ignore-activity',
      name: 'Ignore activity',
      icon: 'slash',
      editorCheckCallback: this.newPerformTableAction((pe) => {
        pe.ignoreActivity()
      }),
    })

    this.addCommand({
      id: 'toggle-fix-activity',
      name: 'Toggle fix to activity',
      icon: 'toggle-left',
      editorCheckCallback: this.newPerformTableAction((pe) => {
        pe.toggleFixCursorActivity()
      }),
    })

    this.addCommand({
      id: 'unfix-all-activities',
      name: 'Unfix all activities',
      icon: 'clear-all',
      editorCheckCallback: this.newPerformTableAction((pe) => {
        pe.unfixAllActivities()
      }),
    })

    // Mobile only

    const addMobileCommand = (command: Omit<Command, 'mobileOnly'>) =>
      this.addCommand({
        mobileOnly: true,
        ...command,
      })

    addMobileCommand({
      id: 'move-left',
      name: 'Move left',
      icon: 'arrow-left',
      editorCheckCallback: this.newPerformPlanActionCM6((te) => {
        te.moveLeft()
      }),
    })

    addMobileCommand({
      id: 'move-up',
      name: 'Move up',
      icon: 'arrow-up',
      editorCheckCallback: this.newPerformPlanActionCM6((te) => {
        te.moveUp()
      }),
    })

    addMobileCommand({
      id: 'move-right',
      name: 'Move right',
      icon: 'arrow-right',
      editorCheckCallback: this.newPerformPlanActionCM6((te) => {
        te.moveRight()
      }),
    })

    addMobileCommand({
      id: 'move-down',
      name: 'Move down',
      icon: 'arrow-down',
      editorCheckCallback: this.newPerformPlanActionCM6((te) => {
        te.moveDown()
      }),
    })

    addMobileCommand({
      id: 'cut-activity',
      name: 'Cut activity',
      icon: 'cut',
      editorCheckCallback: this.newPerformPlanActionCM6((te) => {
        te.cutActivity()
      }),
    })

    addMobileCommand({
      id: 'paste-activity',
      name: 'Paste activity',
      icon: 'clipboard-plus',
      editorCheckCallback: this.newPerformPlanActionCM6((te) => {
        te.pasteActivity()
      }),
    })
  }

  onunload() {
    Timer.clean()
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
