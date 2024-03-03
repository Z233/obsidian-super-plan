import type { App, EventRef, MarkdownPostProcessorContext, TFile } from 'obsidian'
import { EditorView } from '@codemirror/view'
import { CodeBlockSync } from './editor/code-block-sync'
import type { Maybe } from './types'
import { renderPlan } from './ui/plan'
import type { SuperPlanSettings } from './setting/settings'

// interface PlanTableMeta {
//   lineStart: number
//   lineEnd: number
//   container: HTMLElement
//   sync: CodeBlockSync
// }

type FilesMap = WeakMap<TFile, PlanTableMeta[]>

class PlanTableMeta {
  constructor(
    public lineStart: number,
    public lineEnd: number,
    public container: HTMLElement | null,
    public sync: CodeBlockSync,
  ) { }

  updateRange(lineStart: number, lineEnd: number) {
    this.lineStart = lineStart
    this.lineEnd = lineEnd
  }

  within(lineStart: number, lineEnd: number) {
    return lineStart >= this.lineStart && lineEnd <= this.lineEnd
  }

  setContainer(container: HTMLElement) {
    this.container = container
  }
}

export class PlanTableManager {
  private filesMap: FilesMap = new WeakMap()
  private queue: Set<() => void> = new Set()

  activeFile: Maybe<TFile> = null
  activeLeafChangeRef: EventRef

  private constructor(private app: App, private settings: SuperPlanSettings) { }

  static new(app: App, settings: SuperPlanSettings) {
    const ins = new PlanTableManager(app, settings)

    ins.activeLeafChangeRef = app.workspace.on('active-leaf-change', (leaf) => {
      const leafFile = app.workspace.getActiveFile()
      ins.activeFile = leafFile

      if (leaf) {
        leaf.view.onunload = () => {
          if (leafFile && ins.filesMap.has(leafFile))
            ins.filesMap.delete(leafFile)
        }
      }

      if (ins.queue.size > 0) {
        ins.queue.forEach(fn => fn())
        ins.queue.clear()
      }
    })

    return ins
  }

  unregister() {
    this.app.workspace.offref(this.activeLeafChangeRef)
  }

  private _processCodeBlock(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    el.parentElement?.setAttribute('style', 'contain: none !important;')

    const selection = ctx.getSectionInfo(el)
    const file = this.app.vault.getAbstractFileByPath(ctx.sourcePath) as TFile

    if (!selection)
      return

    let metaArr = this.filesMap.get(file)
    if (metaArr === undefined) {
      metaArr = []
      this.filesMap.set(file, metaArr)
    }

    const updatedMetaArr = metaArr.filter(
      meta => meta.within(selection.lineStart, selection.lineEnd),
    )

    if (updatedMetaArr.length > 1)
      throw new Error('Can\'t get table meta.')

    let meta = updatedMetaArr?.[0]

    if (!meta) {
      meta = new PlanTableMeta(
        selection.lineStart,
        selection.lineEnd,
        null,
        new CodeBlockSync({
          source,
          lineStart: selection.lineStart,
          lineEnd: selection.lineEnd,
        }),
      )
      metaArr.push(meta)
      this.filesMap.set(file, metaArr)
    }

    let { sync, container } = meta

    if (!container) {
      const newContainer = (container = document.createElement('div'))
      renderPlan({ container, sync, app: this.app, file, settings: this.settings })
      meta.setContainer(newContainer)
    }
    else {
      sync.notify({
        source,
        lineStart: selection.lineStart,
        lineEnd: selection.lineEnd,
      })
    }

    el.insertBefore(container!, null)
  }

  get codeBlockProcessor() {
    return (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      const fn = () => this._processCodeBlock(source, el, ctx)

      if (this.activeFile)
        Promise.resolve().then(() => fn())

      else this.queue.add(fn)
    }
  }

  private _getLinesChangedType(currentLines: number, previousLines: number) {
    if (currentLines === previousLines)
      return null
    if (currentLines > previousLines)
      return 'ASC'
    else if (currentLines < previousLines)
      return 'DESC'
  }

  get updateListener() {
    return EditorView.updateListener.of((update) => {
      if (!update.docChanged)
        return

      if (!this.activeFile || !this.filesMap.has(this.activeFile))
        return

      const doc = update.state.doc
      const startDoc = update.startState.doc
      const tableMetas = this.filesMap.get(this.activeFile)!
      const linesChangedType = this._getLinesChangedType(doc.lines, startDoc.lines)
      const changedLines = Math.abs(doc.lines - startDoc.lines)

      update.changes.iterChanges((fromA, toA, fromB, toB) => {
        // Get the starting and ending line numbers for the changed lines
        const changedLineStart = doc.lineAt(fromB).number - 1
        const changedLineEnd = doc.lineAt(toB).number - 1

        for (const meta of tableMetas) {
          // The change within the table
          if (meta.within(changedLineStart, changedLineEnd)) {
            if (linesChangedType === 'ASC' && changedLineStart >= meta.lineStart)
              meta.updateRange(meta.lineStart, meta.lineEnd + changedLines)
            else if (linesChangedType === 'DESC' && changedLineStart >= meta.lineStart)
              meta.updateRange(meta.lineStart, meta.lineEnd - changedLines)

            meta.sync.notify({
              source: [...doc.iterLines(meta.lineStart + 2, meta.lineEnd + 1)].join('\n'),
            })
          }
          // The change above of the table
          else if (changedLineStart < meta.lineStart) {
            if (linesChangedType === 'ASC')
              meta.updateRange(meta.lineStart + changedLines, meta.lineEnd + changedLines)
            else if (linesChangedType === 'DESC')
              meta.updateRange(meta.lineStart - changedLines, meta.lineEnd - changedLines)
          }
        }
      })
    })
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
}
