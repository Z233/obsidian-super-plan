import {
  Editor,
  EditorSuggest,
  normalizePath,
  TFile,
  type App,
  type EditorPosition,
  type EditorSuggestContext,
  type EditorSuggestTriggerInfo,
} from 'obsidian'
import { getAPI, Result, Success } from 'obsidian-dataview'
import { PlanEditor } from './plan-editor'
import type { SuperPlanSettings } from './settings'
import { checkIsDataviewEnabled } from './utils/helper'
import { uniq } from 'lodash-es'

type ActivitySuggestValue = {
  value: string
  valueHtml: string
  context: EditorSuggestContext
}

type Match = { value: string; html: string }

export class ActivitySuggester extends EditorSuggest<ActivitySuggestValue> {
  app: App
  settings: SuperPlanSettings

  constructor(app: App, settings: SuperPlanSettings) {
    super(app)
    this.app = app
    this.settings = settings
  }

  private shouldPreventTrigger(cursor: EditorPosition, file: TFile) {
    const cache = this.app.metadataCache.getFileCache(file)
    if (!cache) return false

    return !(
      !cache.sections ||
      !cache.sections.some(
        (sec) =>
          sec.position.start.line <= cursor.line &&
          sec.position.end.line >= cursor.line &&
          sec.type === 'table' &&
          sec.id === this.settings.planTableId
      )
    )
  }

  onTrigger(cursor: EditorPosition, editor: Editor, file: TFile): EditorSuggestTriggerInfo | null {
    if (this.shouldPreventTrigger(cursor, file) || !checkIsDataviewEnabled()) return null

    const pe = new PlanEditor(file, editor, this.settings)
    const state = pe.getState()
    if (!state || state.type !== 'activity') return null

    const cellContent = state.cell.content
    if (cellContent.trim().length === 0) return null

    const line = editor.getLine(cursor.line)
    return {
      start: { line: cursor.line, ch: cursor.ch },
      end: {
        line: cursor.line,
        ch: line.length,
      },
      query: cellContent,
    }
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

    if (cursor === query.length && cursor < record.length) {
      const html = `${this.mark(query)}${record.slice(cursor)}`
      return {
        value: record,
        html,
      }
    }

    return null
  }

  private checkIsQuerySuccessful(
    query: Result<unknown, unknown>
  ): query is Success<unknown, unknown> {
    return query.successful
  }

  private async queryActivities() {
    const dv = getAPI()!
    const query = await dv.query(
      `LIST P.Activity FROM "${normalizePath(
        this.settings.dailyPlanNoteFolder
      )}" FLATTEN file.tables.plan AS P`
    )
    return query
  }

  async getSuggestions(context: EditorSuggestContext): Promise<ActivitySuggestValue[]> {
    const query = await this.queryActivities()

    if (this.checkIsQuerySuccessful(query)) {
      const activities = uniq(query.value.values.map((x) => x.value)).filter((x) => !!x)

      let matches: Match[] = []
      activities.forEach((record, idx) => {
        const match = this.search(context.query, record)
        if (match) matches.push(match)
      })

      return matches.map((x) => ({
        value: x.value,
        valueHtml: x.html,
        context,
      }))
    }

    return []
  }

  renderSuggestion(value: ActivitySuggestValue, el: HTMLElement): void {
    el.innerHTML = value.valueHtml
  }

  selectSuggestion(value: ActivitySuggestValue, evt: MouseEvent | KeyboardEvent): void {
    const { editor, query } = value.context
    const { value: insertValue } = value
    const { ch, line } = editor.getCursor()
    editor.replaceRange(
      insertValue,
      {
        ch: ch - query.length,
        line,
      },
      {
        ch,
        line,
      },
      query
    )
    editor.setCursor({
      line: line,
      ch: ch + insertValue.length - query.length,
    })
  }
}
