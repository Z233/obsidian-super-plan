import {
  Editor,
  EditorSuggest,
  TFile,
  Scope,
  type App,
  type EditorPosition,
  type EditorSuggestContext,
  type EditorSuggestTriggerInfo,
  type KeymapEventHandler,
} from 'obsidian'
import type { SuperPlanSettings } from '../../setting/settings'
import type { ActivityProvider } from './activity-provider'

type ActivitySuggestValue = {
  value: string
  valueHtml: string
  context: EditorSuggestContext
}

type Match = { value: string; html: string }

// This is an unsafe code..!!
interface UnsafeEditorSuggestInterface {
  scope: Scope & { keys: (KeymapEventHandler & { func: CallableFunction })[] }
  suggestions: {
    useSelectedItem(ev: Partial<KeyboardEvent>): void
  }
}

export class ActivitySuggester
  extends EditorSuggest<ActivitySuggestValue>
  implements UnsafeEditorSuggestInterface
{
  scope: UnsafeEditorSuggestInterface['scope']
  suggestions: UnsafeEditorSuggestInterface['suggestions']
  // Used to avoid re-registration
  keymapEventHandlers: KeymapEventHandler[] = []

  private lastCellContent = ''

  constructor(
    private app: App,
    private provider: ActivityProvider,
    private settings: SuperPlanSettings
  ) {
    super(app)
    this.registerKeymaps()
  }

  private registerKeymaps() {
    // Clear
    this.keymapEventHandlers.forEach((x) => this.scope.unregister(x))
    this.keymapEventHandlers = []

    this.keymapEventHandlers.push(
      this.scope.register([], 'Tab', () => {
        this.suggestions.useSelectedItem({})
        return true
      })
    )
  }

  private shouldPreventTrigger(cursor: EditorPosition, file: TFile) {
    const cache = this.app.metadataCache.getFileCache(file)
    if (!cache || !cache.sections) return false

    return !cache.sections.some(
      (sec) =>
        sec.position.start.line <= cursor.line &&
        sec.position.end.line >= cursor.line &&
        sec.type === 'table' &&
        sec.id === this.settings.planTableId
    )
  }

  onTrigger(cursor: EditorPosition, editor: Editor, file: TFile): EditorSuggestTriggerInfo | null {
    throw new Error('Need to be reimplemented.')

    // if (!checkIsDataviewEnabled()) return null

    // const pe = new TableEditor(file, editor, this.settings)
    // const state = pe.getState()
    // if (!state || state.type !== 'activity') return null

    // const cellContent = state.cell.content

    // if (cellContent.trim().length === 0) return null
    // if (cellContent === this.lastCellContent) return null

    // this.lastCellContent = cellContent

    // const line = editor.getLine(cursor.line)
    // return {
    //   start: { line: cursor.line, ch: cursor.ch },
    //   end: {
    //     line: cursor.line,
    //     ch: line.length,
    //   },
    //   query: cellContent,
    // }
  }

  private mark(value: string) {
    return `<span class="u-pop">${value}</span>`
  }

  private search(query: string, record: string): Match | null {
    let cursor = 0

    let step = record.length
    while (step--) {
      if (cursor < query.length && query.charAt(cursor) === record.charAt(cursor)) cursor++
      else break
    }

    if (cursor === query.length && cursor <= record.length) {
      const html = `${this.mark(query)}${record.slice(cursor)}`
      return {
        value: record,
        html,
      }
    }

    return null
  }

  async getSuggestions(context: EditorSuggestContext): Promise<ActivitySuggestValue[]> {
    const activities = this.provider.activityNames

    let matches: Match[] = []
    activities.forEach((record, idx) => {
      const match = this.search(context.query, record)
      if (match) matches.push(match)
    })

    matches = matches.sort((a, b) => a.value.length - b.value.length)

    return matches.map((x) => ({
      value: x.value,
      valueHtml: x.html,
      context,
    }))
  }

  renderSuggestion(value: ActivitySuggestValue, el: HTMLElement): void {
    el.innerHTML = value.valueHtml
  }

  selectSuggestion(value: ActivitySuggestValue, evt: MouseEvent | KeyboardEvent): void {
    const { editor, query } = value.context
    const { value: selectedValue } = value
    const { ch, line } = editor.getCursor()

    const lineText = editor.getLine(line)
    const queryStartCh = lineText.indexOf(query)
    const cursorChInQuery = ch - queryStartCh - 1
    const insertText = selectedValue.slice(cursorChInQuery + 1)
    const afterInsertCh = queryStartCh + selectedValue.length

    editor.replaceRange(
      insertText,
      {
        ch,
        line,
      },
      {
        ch: queryStartCh + query.length,
        line,
      }
    )

    editor.setCursor({
      line: line,
      ch: afterInsertCh,
    })
  }
}
