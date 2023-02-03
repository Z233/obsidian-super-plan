import type { Extension } from '@codemirror/state'
import type { KeyBinding, ViewUpdate } from '@codemirror/view'
import type { TableRow } from '@tgrosinger/md-advanced-tables'
import type SuperPlan from '../main'
import type { TableEditor } from './table-editor'
import type { PlanTableState, Maybe, PlanCellType } from '../types'
import { Prec } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { isNumber } from 'lodash-es'
import { getActivityDataIndex } from '../util/helper'
import { TriggerScheduleColumn, UnsafeViewUpdateFlags } from '../constants'
import type { Parser } from '../parser'
import type { ActivityProvider } from '../ui/suggest/activity-provider'

export class EditorExtension {
  private activityProvider: Maybe<ActivityProvider> = null

  private lastState: Maybe<PlanTableState>
  private state: Maybe<PlanTableState>

  constructor(private plugin: SuperPlan, private parser: Parser) {}

  setProvider(provider: ActivityProvider) {
    this.activityProvider = provider
  }

  private tableBlurEffect(v: ViewUpdate, te: TableEditor) {
    if (!this.lastState) return

    const lines = v.state.doc.toJSON()
    const planTableInfo = this.parser.findPlanTable(lines)
    planTableInfo && te.executeScheduleOutside(planTableInfo, this.lastState)
    return
  }

  private focusChangedEffect(v: ViewUpdate, te: TableEditor) {
    const getStartCell = (row: TableRow) => row.getCellAt(getActivityDataIndex('start'))!

    const current = this.state
    const currentCell = current && getStartCell(current.row)
    const scheduled = te.executeSchedule(this.lastState)

    // set isFixed to true when user manually input start time
    if (
      this.lastState?.type === 'start' &&
      scheduled &&
      currentCell &&
      getStartCell(scheduled.row).content !== currentCell.content
    ) {
      // when moving between start cells, use last state to schedule
      if (current.type === 'start') {
        te.executeSchedule(
          {
            ...this.lastState,
            type: 'start',
            cell: getStartCell(current.table.getRows()[this.lastState.focus.row]),
          },
          true
        )
      } else {
        te.executeSchedule(
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

  private viewUpdateHandler(v: ViewUpdate) {
    if ((!v.selectionSet && !v.focusChanged) || v.docChanged) return

    const flags: UnsafeViewUpdateFlags = (v as any).flags

    this.plugin.newPerformPlanActionCM6((te) => {
      const state = te.getState()

      // reschedule when table blur
      if (
        flags === UnsafeViewUpdateFlags.TABLE_BLUR &&
        this.lastState &&
        TriggerScheduleColumn.includes(this.lastState.type)
      ) {
        this.tableBlurEffect(v, te)
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
        this.updateState(state)
        this.focusChangedEffect(v, te)
      }
    }, true)()
  }

  private updateState(newState: Maybe<PlanTableState>) {
    this.lastState = this.state
    this.state = newState
  }

  makeEditorUpdateListenerExtension(): Extension {
    return EditorView.updateListener.of(this.viewUpdateHandler.bind(this))
  }

  makeEditorRemappingExtension(): Extension {
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
        this.plugin.newPerformPlanActionCM6((pe: TableEditor) => {
          pe.nextCell()
        })(),
      shift: (): boolean =>
        this.plugin.newPerformPlanActionCM6((pe: TableEditor) => pe.previousCell())(),
      preventDefault: true,
    })

    keymaps.push({
      key: 'Ctrl-Delete',
      run: () => this.plugin.newPerformPlanActionCM6((pe: TableEditor) => pe.deleteRow())(),
      preventDefault: true,
    })

    keymaps.push(
      ...['Ctrl-x', 'Ctrl-v'].map((key) => ({
        key,
        run: (v: EditorView) => {
          const editor = this.plugin.app.workspace.activeEditor!.editor!
          const cursor = editor.getCursor()

          this.plugin.newPerformPlanActionCM6((pe: TableEditor) => {
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
                pe.executeScheduleOutside(planTableInfo, this.lastState)

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
}
