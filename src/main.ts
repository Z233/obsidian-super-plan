import { Editor, MarkdownView, Plugin, Platform, type Command, TFile } from 'obsidian'
import { Parser } from './parser'
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
import type { MdTableEditor } from './editor/md-table-editor'
import { renderPlan } from './ui/plan/Plan'
import { CodeBlockSync } from './editor/code-block-sync'
import { EditorView } from '@codemirror/view'

export default class SuperPlan extends Plugin {
  settings: SuperPlanSettings
  activityProvider: Maybe<ActivityProvider> = null

  private store: DataStore
  private parser: Parser
  private leafsMte: Map<string, MdTableEditor> = new Map()

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

    this.registerCodeBlockProcessor()

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

  private registerCodeBlockProcessor() {
    const queue: Set<() => void> = new Set()
    let activeEditor: Maybe<Editor> = null

    const plansMap = new WeakMap<
      Editor,
      {
        container: HTMLElement
        sync: CodeBlockSync
      }
    >()

    this.registerEvent(
      this.app.workspace.on('active-leaf-change', (leaf) => {
        activeEditor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor
        if (queue.size) {
          queue.forEach((job) => job())
          queue.clear()
        }
      })
    )

    this.registerEditorExtension(
      EditorView.updateListener.of((update) => {
        const doc = update.view.state.doc
        if (!update.docChanged || !(doc as any).text) return
        update.changes.iterChanges((fromA, toA, fromB, toB) => {
          // Get the starting and ending line numbers for the changed lines
          const changedLineStart = doc.lineAt(fromB).number - 1
          const changedLineEnd = doc.lineAt(toB).number - 1

          if (activeEditor && plansMap.has(activeEditor)) {
            const { sync } = plansMap.get(activeEditor)!
            const { lineStart, lineEnd } = sync.getInfo()

            if (changedLineStart >= lineStart + 1 && changedLineEnd <= lineEnd - 1) {
              sync.notify({
                source: ((doc as any).text as string[]).slice(lineStart + 1, lineEnd).join('\n'),
              })
            }
          }
        })
      })
    )

    this.registerMarkdownCodeBlockProcessor('super-plan', (source, el, ctx) => {
      el.parentElement?.setAttribute('style', 'contain: none !important;')

      const job = () => {
        const selection = ctx.getSectionInfo(el)
        const file = this.app.vault.getAbstractFileByPath(ctx.sourcePath) as TFile

        if (selection && activeEditor) {
          let { sync, container } = plansMap.get(activeEditor) || {
            sync: new CodeBlockSync(),
            container: null,
          }

          sync.notify({
            source,
            lineStart: selection.lineStart,
            lineEnd: selection.lineEnd,
          })

          if (!container) {
            const newContainer = (container = document.createElement('div'))
            renderPlan(container, sync, this.app, file)
            plansMap.set(activeEditor, { sync, container: newContainer })
          }

          el.insertBefore(container, null)
        }
      }

      if (!activeEditor) {
        queue.add(job)
      } else {
        job()
      }
    })
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
