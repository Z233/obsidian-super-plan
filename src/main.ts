import {
  Platform,
  Plugin,
} from 'obsidian'
import type {
  Editor,
  MarkdownPostProcessorContext,
  TFile,
} from 'obsidian'
import { EditorView } from '@codemirror/view'
import sentinel from 'sentinel-js'
import { SuperPlanSettings, defaultSettings } from './setting/settings'
import { SuperPlanSettingsTab } from './setting/settings-tab'
import type { Maybe } from './types'
import { MiniTracker } from './window'
import { DataStore, SettingsDataKey } from './store'
import { loadIcons } from './ui/icons'
import { desktopInit } from './platform/desktop'
import { Timer } from './tracker/timer'
import './style.css'
import { renderPlan } from './ui/plan/Plan'
import { CodeBlockSync } from './editor/code-block-sync'
import { PlanBuilder } from './editor/plan-builder'
import { generateId, getNowMins, parseMins2Time } from './util/helper'
import { ACTIVITY_TR_ID_PREFIX, CODE_BLOCK_LANG } from './constants'

type FilesMap = WeakMap<
  TFile,
  {
    container: HTMLElement
    sync: CodeBlockSync
  }
>

export default class SuperPlan extends Plugin {
  settings: SuperPlanSettings
  store: DataStore

  async onload() {
    this.store = new DataStore(this)

    await this.loadSettings()
    this.addSettingTab(new SuperPlanSettingsTab(this.app, this))

    if (Platform.isDesktopApp) {
      const timer = Timer.new()

      this.registerInterval(timer.intervalId)

      desktopInit(this)
    }

    this.registerCodeBlockProcessor()

    loadIcons()

    this.addCommand({
      id: 'insert-new-plan',
      name: 'Insert new plan',
      icon: 'list-plus',
      editorCallback: (editor: Editor) => {
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
        const codeLines = [`\`\`\`${CODE_BLOCK_LANG}`, ...lines, '```']

        const cursor = editor.getCursor()

        const isEmptyLine = editor.getLine(cursor.line).trim() === ''

        editor.replaceRange(`${codeLines.join('\n')}\n`, {
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
    const filesMap: FilesMap = new WeakMap()

    let activeFile: Maybe<TFile> = this.app.workspace.getActiveFile()

    this.registerEvent(
      this.app.workspace.on('active-leaf-change', (leaf) => {
        const leafFile = this.app.workspace.getActiveFile()
        activeFile = leafFile

        if (leaf) {
          leaf.view.onunload = () => {
            if (leafFile && filesMap.has(leafFile))
              filesMap.delete(leafFile)
          }
        }

        if (queue.size) {
          queue.forEach(fn => fn())
          queue.clear()
        }
      }),
    )

    this.registerEditorExtension(
      EditorView.updateListener.of((update) => {
        if (!update.docChanged)
          return

        const doc = update.state.doc
        update.changes.iterChanges((fromA, toA, fromB, toB) => {
          // Get the starting and ending line numbers for the changed lines
          const changedLineStart = doc.lineAt(fromB).number - 1
          const changedLineEnd = doc.lineAt(toB).number - 1

          // Notify the change to the sync.
          if (activeFile && filesMap.has(activeFile)) {
            const { sync } = filesMap.get(activeFile)!
            const { lineStart, lineEnd } = sync.getInfo()

            if (changedLineStart >= lineStart + 1 && changedLineEnd <= lineEnd - 1) {
              sync.notify({
                source: [...doc.iterLines(lineStart + 2, lineEnd + 1)].join('\n'),
              })
            }
          }
        })
      }),
    )

    /**
     * Every time the content within the code block changes,
     * the code block will be re-process.
     */
    this.registerMarkdownCodeBlockProcessor(CODE_BLOCK_LANG, (source, el, ctx) => {
      const fn = () => this._processCodeBlock({ source, el, ctx, filesMap })

      if (activeFile)
        Promise.resolve().then(() => fn())

      else queue.add(fn)
    })
  }

  private _processCodeBlock({
    source,
    el,
    ctx,
    filesMap,
  }: {
    source: string
    el: HTMLElement
    ctx: MarkdownPostProcessorContext
    filesMap: FilesMap
  }) {
    const cmPreviewCodeBlockSelector = '.cm-preview-code-block.cm-embed-block.markdown-rendered'

    el.parentElement?.setAttribute('style', 'contain: none !important;')

    const selection = ctx.getSectionInfo(el)
    const file = this.app.vault.getAbstractFileByPath(ctx.sourcePath) as TFile

    if (!selection)
      return

    let { sync, container } = filesMap.get(file) || {
      sync: new CodeBlockSync(),
      container: null,
    }

    let parent: Maybe<HTMLElement> = null

    if (!container) {
      const newContainer = (container = document.createElement('div'))
      renderPlan({ container, sync, app: this.app, file, settings: this.settings })
      filesMap.set(file, { sync, container: newContainer })
    }
    else {
      parent = container.closest<HTMLElement>(cmPreviewCodeBlockSelector)
    }

    if (
      parent
      && parent !== el.closest(cmPreviewCodeBlockSelector)
      && parent.offsetWidth > 0
      && parent.offsetHeight > 0
    ) {
      const div = this._createErrorDiv('A file can only have one plan.')
      el.insertBefore(div, null)
      return
    }

    sync.notify({
      source,
      lineStart: selection.lineStart,
      lineEnd: selection.lineEnd,
    })

    el.insertBefore(container!, null)
  }

  private _createErrorDiv(msg: string) {
    const div = document.createElement('div')
    const h1 = document.createElement('h1')
    const p = document.createElement('p')

    h1.textContent = 'Error'
    p.textContent = msg

    div.appendChild(h1)
    div.appendChild(p)

    return div
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
