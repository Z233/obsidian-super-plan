import { Editor, MarkdownView, Plugin, Platform, type Command, TFile } from 'obsidian'
import { defaultSettings, SuperPlanSettings } from './setting/settings'
import { SuperPlanSettingsTab } from './setting/settings-tab'
import type { Maybe } from './types'
import type { ActivityProvider } from './ui/suggest/activity-provider'
import { MiniTracker } from './window'
import { DataStore, SettingsDataKey } from './store'
import { loadIcons } from './ui/icons'
import { desktopInit } from './platform/desktop'
import { Timer } from './tracker/timer'
import './style.css'
import { renderPlan } from './ui/plan/Plan'
import { CodeBlockSync } from './editor/code-block-sync'
import { EditorView } from '@codemirror/view'
import { PlanBuilder } from './editor/plan-builder'
import { generateId, getNowMins, parseMins2Time } from './util/helper'
import sentinel from 'sentinel-js'
import { ACTIVITY_TR_ID_PREFIX, CODE_BLOCK_LANG } from './constants'

export default class SuperPlan extends Plugin {
  settings: SuperPlanSettings
  activityProvider: Maybe<ActivityProvider> = null
  store: DataStore

  async onload() {
    this.store = new DataStore(this)

    await this.loadSettings()
    this.addSettingTab(new SuperPlanSettingsTab(this.app, this))

    if (Platform.isDesktopApp) {
      const timer = Timer.new()

      this.registerInterval(timer.intervalId)

      // desktopInit(this.app, this.manifest, this.settings, this.store, this.addStatusBarItem())
      desktopInit(this)
    }

    // if (this.settings.enableActivityAutoCompletion) {
    //   const provider = (this.activityProvider = new ActivityProvider(this.settings))
    //   editorExtension.setProvider(provider)
    //   this.registerEditorSuggest(new ActivitySuggester(this.app, provider, this.settings))
    // }

    this.registerCodeBlockProcessor()

    loadIcons()

    this.addCommand({
      id: 'insert-new-plan',
      name: 'Insert new plan',
      icon: 'list-plus',
      editorCallback: (editor: Editor, view: MarkdownView) => {
        const builder = new PlanBuilder()

        const firstId = generateId()

        const plan = builder
          .addActivity({
            id: firstId,
            activity: '',
            length: '0',
            start: parseMins2Time(getNowMins()),
            f: 'x',
            r: '',
            actLen: '0',
          })
          .addActivity({
            id: generateId(),
            activity: 'END',
            length: '0',
            start: '',
            f: 'x',
            r: '',
            actLen: '',
          })
          .build()

        const lines = plan.getLines()
        const codeLines = ['```' + CODE_BLOCK_LANG, ...lines, '```']

        const cursor = editor.getCursor()

        const isEmptyLine = editor.getLine(cursor.line).trim() === ''

        editor.replaceRange(codeLines.join('\n') + '\n', {
          line: isEmptyLine ? cursor.line : cursor.line + 1,
          ch: 0,
        })

        isEmptyLine && editor.setCursor(cursor.line + codeLines.length + 1, 0)

        /**
         * We can't use css selector to select input
         * because the input element use "all: unset"
         * to reset all styles set by obsidian.
         */
        const actCellSelector = `tr#${ACTIVITY_TR_ID_PREFIX}${firstId} > td[data-column="activity"]`

        const focusOnActInput = (td: HTMLTableCellElement) => {
          const input = td.firstChild as HTMLInputElement
          input.focus()
          sentinel.off(actCellSelector, focusOnActInput)
        }

        sentinel.on(actCellSelector, focusOnActInput)
      },
    })
  }

  onunload() {
    Timer.clean()
    MiniTracker.clean()
  }

  private registerCodeBlockProcessor() {
    const queue: Set<() => void> = new Set()
    let activeFile: Maybe<TFile> = null

    const plansMap = new WeakMap<
      TFile,
      {
        container: HTMLElement
        sync: CodeBlockSync
      }
    >()

    this.registerEvent(
      this.app.workspace.on('active-leaf-change', (leaf) => {
        activeFile = this.app.workspace.getActiveFile()
        // activeEditor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor
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

          if (activeFile && plansMap.has(activeFile)) {
            const { sync } = plansMap.get(activeFile)!
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

        if (selection && activeFile) {
          let { sync, container } = plansMap.get(activeFile) || {
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
            plansMap.set(activeFile, { sync, container: newContainer })
          }

          el.insertBefore(container, null)
        }
      }

      if (!activeFile) {
        queue.add(job)
      } else {
        job()
      }
    })
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
