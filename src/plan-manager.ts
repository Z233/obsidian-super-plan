import type { Extension } from '@codemirror/state'
import type { KeyBinding } from '@codemirror/view'
import type { TableRow } from '@tgrosinger/md-advanced-tables'
import type SuperPlan from './main'
import type { PlanEditor } from './plan-editor'
import type { PlanTableState, Maybe, PlanCellType } from './types'
import { Prec } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { debounce, isNumber } from 'lodash-es'
import { getActivityDataIndex } from './utils/helper'
import { TriggerScheduleColumn, ViewUpdateFlags } from './constants'
import type { Parser } from './parser'
import type { ActivityProvider } from './suggest/providers'

export class PlanManager {
  private activityProvider: Maybe<ActivityProvider> = null

  private lastState: Maybe<PlanTableState>
  private state: Maybe<PlanTableState>

  constructor(private plugin: SuperPlan, private parser: Parser) {
    this.plugin = plugin
    this.parser = parser

    this.plugin.registerEditorExtension(this.makeEditorRemappingExtension())
    this.plugin.registerEditorExtension(this.makeEditorUpdateListenerExtension())
  }

  setProvider(provider: ActivityProvider) {
    this.activityProvider = provider
  }

  private readonly makeEditorUpdateListenerExtension = (): Extension => {
    return EditorView.updateListener.of((v) => {
      if ((!v.selectionSet && !v.focusChanged) || v.docChanged) return
      const flags: ViewUpdateFlags = (v as any).flags
      const fn = debounce(
        this.plugin.newPerformPlanActionCM6((pe) => {
          const state = pe.getState()

          // reschedule when table blur
          if (
            flags === ViewUpdateFlags.TABLE_BLUR &&
            this.lastState &&
            TriggerScheduleColumn.includes(this.lastState.type)
          ) {
            const lines = v.state.doc.toJSON()
            const planTableInfo = this.parser.findPlanTable(lines)
            planTableInfo && pe.executeBackgroundSchedule(planTableInfo, this.lastState)
            return
          }

          if (
            state &&
            state.type === 'activity' &&
            this.plugin.settings.enableActivityAutoCompletion &&
            this.activityProvider
          ) {
            this.activityProvider.refresh()
          }

          // if focus position in table is not same
          if (!(state && this.state?.focus.posEquals(state.focus))) {
            const getStartCell = (row: TableRow) => row.getCellAt(getActivityDataIndex('start'))!

            this.updateState(state)

            const current = state
            const currentCell = current && getStartCell(current.row)
            const scheduled = pe.executeSchedule(this.lastState)

            // set isFixed to true when user manually input start time
            if (
              this.lastState?.type === 'start' &&
              scheduled &&
              currentCell &&
              getStartCell(scheduled.row).content !== currentCell.content
            ) {
              // when moving between start cells, use last state to schedule
              if (current.type === 'start') {
                pe.executeSchedule(
                  {
                    ...this.lastState,
                    type: 'start',
                    cell: getStartCell(current.table.getRows()[this.lastState.focus.row]),
                  },
                  true
                )
              } else {
                pe.executeSchedule(
                  {
                    ...current,
                    type: 'start',
                    cell: currentCell,
                  },
                  true
                )
              }
            }
          }
        }, true),
        10
      )
      fn()
    })
  }

  private readonly makeEditorRemappingExtension = (): Extension => {
    const keymaps: KeyBinding[] = []
    const shouldNextRow = (cellType: PlanCellType) => {
      const arr: PlanCellType[] = ['actLen', 'r']
      return arr.contains(cellType)
    }

    keymaps.push({
      key: 'Enter',
      run: (): boolean =>
        this.plugin.newPerformPlanActionCM6((pe) => {
          const state = pe.getState()
          if (!state) return

          if (shouldNextRow(state.type)) {
            const { table, focus } = state
            const shouldInsertActivity = focus.row === table.getHeight() - 2

            if (shouldInsertActivity) {
              pe.insertActivityBelow()
            } else {
              const offsetColumn = -focus.column + getActivityDataIndex('activity')
              pe.moveFocus(1, offsetColumn)
            }
          } else {
            pe.nextCell()
          }
        })(),
      preventDefault: true,
    })

    keymaps.push({
      key: 'Tab',
      run: (): boolean =>
        this.plugin.newPerformPlanActionCM6((pe: PlanEditor) => {
          pe.nextCell()
        })(),
      shift: (): boolean =>
        this.plugin.newPerformPlanActionCM6((pe: PlanEditor) => pe.previousCell())(),
      preventDefault: true,
    })

    keymaps.push({
      key: 'Ctrl-Delete',
      run: () => this.plugin.newPerformPlanActionCM6((pe: PlanEditor) => pe.deleteRow())(),
      preventDefault: true,
    })

    keymaps.push(
      ...['Ctrl-x', 'Ctrl-v'].map((key) => ({
        key,
        run: (v: EditorView) => {
          const editor = this.plugin.app.workspace.activeEditor!.editor!
          const cursor = editor.getCursor()

          this.plugin.newPerformPlanActionCM6((pe: PlanEditor) => {
            const lastHeight = this.state?.table.getHeight()
            this.updateState(pe.getState())

            // Use window.setImmediate to execute schedule after plan table updated.
            window.setImmediate(() => {
              const lines = v.state.doc.toJSON()
              const planTableInfo = this.parser.findPlanTable(lines)
              const currentHeight = planTableInfo?.table.getHeight()

              if (
                planTableInfo &&
                this.lastState &&
                isNumber(lastHeight) &&
                isNumber(currentHeight) &&
                lastHeight !== currentHeight
              ) {
                pe.executeBackgroundSchedule(planTableInfo, this.lastState)

                if (lastHeight > currentHeight) {
                  editor.setCursor({
                    ...cursor,
                    line: cursor.line - 1,
                  })
                } else {
                  editor.setCursor({
                    ...cursor,
                    line: cursor.line + 1,
                  })
                }
              }
            })
          })()
          return false
        },
      }))
    )

    return Prec.override(keymap.of(keymaps))
  }

  private updateState(newState: Maybe<PlanTableState>) {
    this.lastState = this.state
    this.state = newState
  }
}
